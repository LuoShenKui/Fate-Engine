import { buildComposePlan } from "./capability-planner";
import { parseComposePrompt } from "./intent-parser";
import { retrieveAgentContext } from "./agent-retrieval";
import type {
  AgentAssemblyPlan,
  AgentComposeResult,
  AgentGapItem,
  AgentRemoteCatalogEntry,
  AgentSourceRecord,
  RetrieveAgentContextArgs,
} from "./agent-types";
import type { ComposerAssetItem, ComposerCatalogEntry } from "./types";

type ComposeRecipeWithAgentArgs = {
  prompt: string;
  catalogEntries: ComposerCatalogEntry[];
  assetItems: ComposerAssetItem[];
  remoteCatalogUrl?: string;
  fetchCatalog?: RetrieveAgentContextArgs["fetchCatalog"];
  fallbackRemoteCatalog?: AgentRemoteCatalogEntry[];
};

const REMOTE_FRAGMENT_HINTS: Array<{ fragment: string; packageId?: string; capabilityId: string }> = [
  { fragment: "enemy", packageId: "fate.enemy.patrol", capabilityId: "enemy.patrol" },
  { fragment: "敌人", packageId: "fate.enemy.patrol", capabilityId: "enemy.patrol" },
  { fragment: "patrol", packageId: "fate.enemy.patrol", capabilityId: "enemy.patrol" },
  { fragment: "巡逻", packageId: "fate.enemy.patrol", capabilityId: "enemy.patrol" },
  { fragment: "drop", packageId: "fate.loot.drop", capabilityId: "loot.drop" },
  { fragment: "掉落", packageId: "fate.loot.drop", capabilityId: "loot.drop" },
  { fragment: "loot", packageId: "fate.loot.drop", capabilityId: "loot.drop" },
  { fragment: "战利品", packageId: "fate.loot.drop", capabilityId: "loot.drop" },
  { fragment: "chest", packageId: "fate.interaction.chest", capabilityId: "interaction.chest" },
  { fragment: "宝箱", packageId: "fate.interaction.chest", capabilityId: "interaction.chest" },
];

const dedupeBy = <T,>(items: T[], getKey: (item: T) => string): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const nodeIdForGap = (capabilityId: string, index: number): string => {
  const slug = capabilityId.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return `${slug || "placeholder"}-${index + 1}`;
};

const toRemoteSources = (remoteEntries: AgentRemoteCatalogEntry[]): AgentSourceRecord[] =>
  remoteEntries.map((entry) => ({
    title: entry.title,
    url: entry.url,
    retrievedAt: new Date().toISOString(),
    usedFor: entry.packageId !== undefined ? `candidate-package:${entry.packageId}` : "remote-catalog-summary",
    packageId: entry.packageId,
  }));

const findRemoteCandidate = (fragment: string, remoteEntries: AgentRemoteCatalogEntry[]): AgentRemoteCatalogEntry | undefined => {
  const lower = fragment.toLowerCase();
  return remoteEntries.find((entry) => {
    const haystack = `${entry.title} ${entry.summary} ${(entry.tags ?? []).join(" ")} ${(entry.capabilityIds ?? []).join(" ")}`.toLowerCase();
    return haystack.includes(lower);
  });
};

const buildGapItems = (
  unmatchedFragments: string[],
  remoteEntries: AgentRemoteCatalogEntry[],
): Array<{ gap: AgentGapItem; packageId: string; capabilityId: string }> => {
  const hints = dedupeBy(
    unmatchedFragments.flatMap((fragment) => REMOTE_FRAGMENT_HINTS.filter((hint) => hint.fragment === fragment)),
    (item) => `${item.packageId ?? "unsupported"}::${item.capabilityId}`,
  );

  return hints.map((hint, index) => {
    const remoteCandidate = findRemoteCandidate(hint.fragment, remoteEntries);
    const packageId = remoteCandidate?.packageId ?? hint.packageId ?? `placeholder.${hint.capabilityId}`;
    const capabilityId = remoteCandidate?.capabilityIds?.[0] ?? hint.capabilityId;
    return {
      packageId,
      capabilityId,
      gap: {
        type: packageId.startsWith("placeholder.") ? "unsupported_request_fragment" : "missing_brick",
        packageId,
        capabilityId,
        nodeId: nodeIdForGap(capabilityId, index),
        message:
          remoteCandidate?.packageId !== undefined
            ? `Recommended remote package ${remoteCandidate.packageId} is not installed locally.`
            : `Request fragment "${hint.fragment}" is outside the installed brick set.`,
      },
    };
  });
};

const buildMissingCapabilityGapItems = (
  missingCapabilities: string[],
  remoteEntries: AgentRemoteCatalogEntry[],
): Array<{ gap: AgentGapItem; packageId: string; capabilityId: string }> =>
  missingCapabilities.map((capabilityId, index) => {
    const remoteCandidate = remoteEntries.find((entry) => (entry.capabilityIds ?? []).includes(capabilityId));
    const packageId = remoteCandidate?.packageId ?? `placeholder.${capabilityId}`;
    return {
      packageId,
      capabilityId,
      gap: {
        type: remoteCandidate?.packageId !== undefined ? "missing_brick" : "missing_protocol_capability",
        packageId,
        capabilityId,
        nodeId: nodeIdForGap(capabilityId, index),
        message:
          remoteCandidate?.packageId !== undefined
            ? `Recommended remote package ${remoteCandidate.packageId} is not installed locally.`
            : `Capability ${capabilityId} is not available in the local package set.`,
      },
    };
  });

export const composeRecipeWithAgent = async ({
  prompt,
  catalogEntries,
  assetItems,
  remoteCatalogUrl,
  fetchCatalog,
  fallbackRemoteCatalog,
}: ComposeRecipeWithAgentArgs): Promise<AgentComposeResult> => {
  const context = await retrieveAgentContext({
    prompt,
    catalogEntries,
    assetItems,
    remoteCatalogUrl,
    fetchCatalog,
    fallbackRemoteCatalog,
  });
  const intent = parseComposePrompt(prompt);
  const planResult = buildComposePlan(intent, context.localEntries);
  const gapItems = [
    ...buildGapItems(intent.unmatchedFragments, context.remoteSources),
    ...buildMissingCapabilityGapItems(planResult.plan.missingCapabilities, context.remoteSources),
  ];
  const planNodes = [
    ...planResult.plan.nodes.map((node) => ({
      nodeId: node.nodeId,
      packageId: node.packageId,
      brickId: node.brickId,
      capabilityId: node.capabilityId,
      confidence: intent.confidence,
    })),
    ...gapItems.map((item) => ({
      nodeId: item.gap.nodeId ?? nodeIdForGap(item.capabilityId, 0),
      packageId: item.packageId,
      brickId: "agent-placeholder",
      capabilityId: item.capabilityId,
      confidence: 0.35,
    })),
  ];
  const allNodes = dedupeBy(planNodes, (node) => node.nodeId);
  const edges = allNodes.slice(1).map((node, index) => ({
    from: allNodes[index]!.nodeId,
    to: node.nodeId,
    reason: index === 0 ? "agent-sequence" : "agent-extension",
  }));
  const diagnostics = [...context.diagnostics, ...intent.diagnostics, ...planResult.diagnostics];

  if (allNodes.length === 0) {
    return {
      plan: null,
      diagnostics,
      remoteSources: context.remoteSources,
    };
  }

  const plan: AgentAssemblyPlan = {
    sessionId: `agent-${Date.now()}`,
    goal: prompt,
    reasoningSummary:
      gapItems.length > 0
        ? "Applied installed character-foundation bricks and inserted placeholders for missing or unsupported request fragments."
        : "Applied installed character-foundation bricks using the local package index and agent retrieval context.",
    sources: toRemoteSources(context.remoteSources),
    nodes: allNodes,
    edges,
    paramSuggestions: [],
    bindingSuggestions: [],
    gapReport: gapItems.map((item) => item.gap),
  };

  return {
    plan,
    diagnostics,
    remoteSources: context.remoteSources,
  };
};
