import type { ComposeDiagnostic, ComposerAssetItem, ComposerCatalogEntry } from "./types";
import type { AgentRemoteCatalogEntry, RetrieveAgentContextArgs, RetrieveAgentContextResult } from "./agent-types";

const TERM_SYNONYMS: Record<string, string[]> = {
  character: ["character", "角色", "humanoid", "actor"],
  locomotion: ["walk", "run", "jump", "移动", "行走", "跑", "跳"],
  door: ["door", "开门", "门", "locked door", "锁门"],
  key: ["key", "钥匙", "key pickup"],
  chest: ["chest", "宝箱", "treasure"],
  enemy: ["enemy", "敌人", "guard", "patrol", "巡逻"],
  reward: ["reward", "loot", "drop", "奖励", "掉落", "战利品"],
  dialogue: ["dialog", "dialogue", "对话"],
  quest: ["quest", "mission", "任务"],
  ladder: ["ladder", "climb", "梯子", "攀爬"],
  pickup: ["pickup", "grab", "carry", "拾取", "拿起", "持有"],
  throw: ["throw", "projectile", "投掷", "扔", "抛"],
};

const expandPromptTerms = (prompt: string): string[] => {
  const promptLower = prompt.toLowerCase();
  const terms = new Set(
    promptLower
      .split(/[\s,，。.!?？]+/)
      .filter((token) => token.length > 0),
  );
  for (const aliases of Object.values(TERM_SYNONYMS)) {
    if (aliases.some((alias) => promptLower.includes(alias.toLowerCase()))) {
      for (const alias of aliases) {
        terms.add(alias.toLowerCase());
      }
    }
  }
  return Array.from(terms).filter((token) => token.length > 1);
};

const includesPromptTerm = (prompt: string, candidate: AgentRemoteCatalogEntry): boolean => {
  const haystack = `${candidate.title} ${candidate.summary} ${(candidate.tags ?? []).join(" ")} ${(candidate.capabilityIds ?? []).join(" ")}`.toLowerCase();
  return expandPromptTerms(prompt).some((token) => haystack.includes(token));
};

const defaultFetchCatalog = async (url: string): Promise<AgentRemoteCatalogEntry[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`remote catalog request failed: ${response.status}`);
  }
  const parsed = await response.json() as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("remote catalog must be an array");
  }
  return parsed.filter((item): item is AgentRemoteCatalogEntry => typeof item === "object" && item !== null).map((item) => ({
    title: typeof item.title === "string" ? item.title : "",
    url: typeof item.url === "string" ? item.url : "",
    summary: typeof item.summary === "string" ? item.summary : "",
    packageId: typeof item.packageId === "string" ? item.packageId : undefined,
    capabilityIds: Array.isArray(item.capabilityIds) ? item.capabilityIds.filter((value): value is string => typeof value === "string") : undefined,
    tags: Array.isArray(item.tags) ? item.tags.filter((value): value is string => typeof value === "string") : undefined,
  }));
};

export const retrieveAgentContext = async ({
  prompt,
  catalogEntries,
  assetItems,
  remoteCatalogUrl,
  fetchCatalog = defaultFetchCatalog,
  fallbackRemoteCatalog = [],
}: RetrieveAgentContextArgs): Promise<RetrieveAgentContextResult> => {
  const diagnostics: ComposeDiagnostic[] = [];
  let remoteCatalog: AgentRemoteCatalogEntry[] = [];

  if (typeof remoteCatalogUrl === "string" && remoteCatalogUrl.trim().length > 0) {
    try {
      remoteCatalog = await fetchCatalog(remoteCatalogUrl);
    } catch {
      diagnostics.push({
        code: "missing_package",
        severity: "warning",
        message: "Remote package catalog lookup failed; falling back to local and bundled remote summaries.",
      });
      remoteCatalog = fallbackRemoteCatalog;
    }
  } else {
    remoteCatalog = fallbackRemoteCatalog;
  }

  return {
    localEntries: catalogEntries,
    assetItems,
    remoteSources: remoteCatalog.filter((candidate) => includesPromptTerm(prompt, candidate)),
    diagnostics,
  };
};
