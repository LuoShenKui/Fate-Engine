import type { EditorRecipeV0 } from "../project/recipe";
import { serializeComposeAssetRegistry, serializeComposeCatalogSnapshot } from "./catalog-snapshot";
import type { ApplyAgentAssemblyPlanArgs, ApplyAgentAssemblyPlanResult, AgentGapItem } from "./agent-types";

const positionForIndex = (index: number): [number, number, number] => [index * 2.2, 0, (index % 2) * 2.4];

const packageIndex = (packageId: string): string => packageId.split(".").pop() ?? packageId;

const findGapForNode = (nodeId: string, packageId: string, gapReport: AgentGapItem[]): AgentGapItem | undefined =>
  gapReport.find((gap) => gap.nodeId === nodeId || gap.packageId === packageId);

export const applyAgentAssemblyPlan = ({
  prompt,
  plan,
  catalogEntries,
  assetItems,
  currentRecipe,
}: ApplyAgentAssemblyPlanArgs): ApplyAgentAssemblyPlanResult => {
  const checkpointRecipe: EditorRecipeV0 = JSON.parse(JSON.stringify(currentRecipe)) as EditorRecipeV0;
  const installedByPackage = new Map(catalogEntries.map((entry) => [entry.packageId, entry] as const));
  const appliedAt = new Date().toISOString();
  const placeholderCount = plan.nodes.filter((node) => !installedByPackage.has(node.packageId)).length;

  const nextNodes = plan.nodes.map((node, index) => {
    const installed = installedByPackage.get(node.packageId);
    const gap = findGapForNode(node.nodeId, node.packageId, plan.gapReport);
    if (installed !== undefined) {
      return {
        id: node.nodeId,
        type: installed.id,
        brickId: installed.packageId,
        transform: {
          position: positionForIndex(index),
          rotation: [0, 0, 0] as [number, number, number],
        },
        meta: {
          agentSessionId: plan.sessionId,
          agentAppliedAt: appliedAt,
        },
      };
    }
    return {
      id: node.nodeId,
      type: "agent-placeholder",
      brickId: node.packageId,
      transform: {
        position: positionForIndex(index),
        rotation: [0, 0, 0] as [number, number, number],
      },
      meta: {
        placeholderKind: gap?.type ?? "missing_brick",
        missingReason: gap?.message ?? `Missing local package ${node.packageId}`,
        requiredCapability: node.capabilityId,
        agentSessionId: plan.sessionId,
        agentAppliedAt: appliedAt,
      },
    };
  });

  const nextEdges = plan.edges.map((edge) => ({ from: edge.from, to: edge.to }));
  const nextSlotBindings = Object.fromEntries(
    plan.bindingSuggestions
      .filter((binding) => binding.assetRef.length > 0)
      .map((binding) => [binding.slotId, binding.assetRef]),
  );

  const nextRecipe: EditorRecipeV0 = {
    ...checkpointRecipe,
    nodes: nextNodes,
    edges: nextEdges,
    slot_bindings: nextSlotBindings,
    params: {
      ...checkpointRecipe.params,
      selected_brick: typeof nextNodes[0]?.type === "string" ? nextNodes[0].type : checkpointRecipe.params.selected_brick,
      whitebox_audit: plan.nodes.map((node) => ({
        package_id: node.packageId,
        version: installedByPackage.get(node.packageId)?.version ?? "candidate",
        license: installedByPackage.get(node.packageId)?.license ?? "Unknown",
        reason: node.capabilityId,
        notes: plan.reasoningSummary,
        alternatives: [],
      })),
      agent_session: plan.sessionId,
      agent_prompt: prompt,
      agent_plan: plan,
      agent_sources: plan.sources,
      agent_gap_report: plan.gapReport,
      agent_apply_mode: "direct_canvas",
      agent_applied_at: appliedAt,
      catalog_snapshot: serializeComposeCatalogSnapshot(catalogEntries),
      asset_registry: serializeComposeAssetRegistry(assetItems),
      agent_apply_report: {
        sessionId: plan.sessionId,
        appliedAt,
        placeholderCount,
        gapCount: plan.gapReport.length,
        sourceCount: plan.sources.length,
        replacedNodeCount: nextNodes.length,
      },
      agent_checkpoint_seed: checkpointRecipe.seed,
    },
    lockfile: {
      packages: plan.nodes.map((node) => ({
        id: node.packageId,
        version: installedByPackage.get(node.packageId)?.version ?? "candidate",
        hash: `sha256:${packageIndex(node.packageId)}-${plan.sessionId}`,
      })),
    },
    package_lock: {
      packages: plan.nodes.reduce<Record<string, string>>((acc, node) => {
        acc[node.packageId] = installedByPackage.get(node.packageId)?.version ?? "candidate";
        return acc;
      }, { editor: "0.1.0" }),
    },
  };

  return {
    checkpointRecipe,
    nextRecipe,
    applyReport: {
      sessionId: plan.sessionId,
      appliedAt,
      placeholderCount,
      gapCount: plan.gapReport.length,
      sourceCount: plan.sources.length,
      replacedNodeCount: nextNodes.length,
    },
  };
};
