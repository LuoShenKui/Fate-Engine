import { CAPABILITY_ALIASES, CAPABILITY_ORDER } from "./capability-map";
import type { ComposeCapabilityId, ComposeDiagnostic, ComposeIntent } from "./types";

const UNSUPPORTED_ALIASES = ["parkour", "vehicle", "mount", "载具", "坐骑", "跑酷", "天气系统"];
const AMBIGUOUS_ALIASES = ["interaction", "movement", "action", "玩法", "交互", "移动能力"];

const includesAny = (source: string, aliases: string[]): boolean => aliases.some((alias) => source.includes(alias));

export const parseComposePrompt = (prompt: string): ComposeIntent => {
  const normalizedPrompt = prompt.trim().toLowerCase();
  const capabilitySet = new Set<ComposeCapabilityId>();

  for (const capabilityId of CAPABILITY_ORDER) {
    if (includesAny(normalizedPrompt, CAPABILITY_ALIASES[capabilityId])) {
      capabilitySet.add(capabilityId);
    }
  }

  if (capabilitySet.size > 0 && !capabilitySet.has("actor.humanoid")) {
    capabilitySet.add("actor.humanoid");
  }

  const diagnostics: ComposeDiagnostic[] = [];
  if (capabilitySet.size === 0) {
    diagnostics.push({
      code: includesAny(normalizedPrompt, UNSUPPORTED_ALIASES) ? "unsupported_intent" : includesAny(normalizedPrompt, AMBIGUOUS_ALIASES) ? "ambiguous_request" : "unsupported_intent",
      severity: "error",
      message: includesAny(normalizedPrompt, UNSUPPORTED_ALIASES)
        ? "Composer currently supports the grounded third-person interaction set: movement, doors, keys, chests, zones, and basic enemy/loot nodes."
        : "Prompt did not resolve to a supported fixed intent. Try describing movement, doors, keys, chests, zones, enemies, or rewards.",
    });
  }

  return {
    rawPrompt: prompt,
    normalizedPrompt,
    capabilityIds: CAPABILITY_ORDER.filter((capabilityId) => capabilitySet.has(capabilityId)),
    environmentHints: normalizedPrompt.includes("room") || normalizedPrompt.includes("房间") ? ["validation-room"] : [],
    unmatchedFragments: UNSUPPORTED_ALIASES.filter((alias) => normalizedPrompt.includes(alias)),
    confidence: capabilitySet.size > 0 ? 0.92 : 0.2,
    diagnostics,
  };
};
