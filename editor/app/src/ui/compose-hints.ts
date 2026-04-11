import type { ComposerHints } from "../composer";

const BUILTIN_COMPOSE_HINTS: Record<string, ComposerHints> = {
  "humanoid-actor": {
    intentAliases: ["humanoid", "character", "player", "avatar", "角色", "主角"],
    requiredCapabilities: ["actor.humanoid"],
    requiredSlots: ["mesh.humanoid", "anim.controller"],
    spaceHints: { footprintMeters: [0.8, 0.8, 1.8], interactionDistanceMeters: 1.6, facing: "forward" },
    stateHints: ["spawned", "ready"],
    constraintHints: { requiredActorClass: "humanoid", conflictsWith: [] },
  },
  "locomotion-ability": {
    intentAliases: ["walk", "run", "jump", "move", "移动", "走", "跑", "跳"],
    requiredCapabilities: ["ability.locomotion"],
    requiredSlots: ["anim.locomotion", "input.map"],
    spaceHints: { footprintMeters: [0.8, 0.8, 1.8], interactionDistanceMeters: 1.6, facing: "forward" },
    stateHints: ["idle", "walk", "run", "jump_start", "airborne", "land"],
    constraintHints: { requiredActorClass: "humanoid", conflictsWith: [] },
  },
  ladder: {
    intentAliases: ["ladder", "climb", "梯子", "攀爬"],
    requiredCapabilities: ["interaction.ladder"],
    requiredSlots: ["mesh"],
    spaceHints: { footprintMeters: [0.6, 0.2, 2.8], interactionDistanceMeters: 0.8, facing: "forward" },
    stateHints: ["enter", "climb", "exit"],
    constraintHints: { requiredActorClass: "humanoid", conflictsWith: [] },
  },
  "pickup-interaction": {
    intentAliases: ["pickup", "hold", "grab", "拾取", "拿起"],
    requiredCapabilities: ["interaction.pickup"],
    requiredSlots: ["socket.hand"],
    spaceHints: { footprintMeters: [0.5, 0.5, 0.5], interactionDistanceMeters: 1.25, facing: "forward" },
    stateHints: ["free", "targeting", "held"],
    constraintHints: { requiredActorClass: "humanoid", conflictsWith: [] },
  },
  "throw-interaction": {
    intentAliases: ["throw", "toss", "投掷", "扔"],
    requiredCapabilities: ["interaction.throw"],
    requiredSlots: ["fx.throw", "audio.throw"],
    spaceHints: { footprintMeters: [0.5, 0.5, 0.5], interactionDistanceMeters: 1.25, facing: "forward" },
    stateHints: ["held", "windup", "released"],
    constraintHints: { requiredActorClass: "humanoid", conflictsWith: [] },
  },
};

const toStringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];

const toFootprint = (value: unknown, fallback: [number, number, number]): [number, number, number] => {
  if (!Array.isArray(value)) {
    return fallback;
  }
  return [
    typeof value[0] === "number" ? value[0] : fallback[0],
    typeof value[1] === "number" ? value[1] : fallback[1],
    typeof value[2] === "number" ? value[2] : fallback[2],
  ];
};

export const getDefaultComposeHints = (entryId: string): ComposerHints | undefined => BUILTIN_COMPOSE_HINTS[entryId];

export const parseComposeHints = (manifest: Record<string, unknown>, entryId: string): ComposerHints | undefined => {
  const fallback = getDefaultComposeHints(entryId);
  const hasExplicitHints = ["intent_aliases", "required_capabilities", "required_slots", "space_hints", "state_hints", "constraint_hints"].some((key) => key in manifest);
  if (!hasExplicitHints && fallback === undefined) {
    return undefined;
  }
  const rawSpaceHints = typeof manifest.space_hints === "object" && manifest.space_hints !== null && !Array.isArray(manifest.space_hints) ? (manifest.space_hints as Record<string, unknown>) : {};
  const rawConstraintHints = typeof manifest.constraint_hints === "object" && manifest.constraint_hints !== null && !Array.isArray(manifest.constraint_hints) ? (manifest.constraint_hints as Record<string, unknown>) : {};
  return {
    intentAliases: toStringList(manifest.intent_aliases).length > 0 ? toStringList(manifest.intent_aliases) : fallback?.intentAliases ?? [],
    requiredCapabilities: (toStringList(manifest.required_capabilities) as ComposerHints["requiredCapabilities"]).length > 0 ? (toStringList(manifest.required_capabilities) as ComposerHints["requiredCapabilities"]) : fallback?.requiredCapabilities ?? [],
    requiredSlots: toStringList(manifest.required_slots).length > 0 ? toStringList(manifest.required_slots) : fallback?.requiredSlots ?? [],
    spaceHints: {
      footprintMeters: toFootprint(rawSpaceHints.footprint_meters, fallback?.spaceHints.footprintMeters ?? [1, 1, 1]),
      interactionDistanceMeters: typeof rawSpaceHints.interaction_distance_meters === "number" ? rawSpaceHints.interaction_distance_meters : fallback?.spaceHints.interactionDistanceMeters ?? 1,
      facing: rawSpaceHints.facing === "any" ? "any" : fallback?.spaceHints.facing ?? "forward",
    },
    stateHints: toStringList(manifest.state_hints).length > 0 ? toStringList(manifest.state_hints) : fallback?.stateHints ?? [],
    constraintHints: {
      requiredActorClass: typeof rawConstraintHints.required_actor_class === "string" ? rawConstraintHints.required_actor_class : fallback?.constraintHints.requiredActorClass ?? "generic",
      conflictsWith: (toStringList(rawConstraintHints.conflicts_with) as ComposerHints["constraintHints"]["conflictsWith"]).length > 0 ? (toStringList(rawConstraintHints.conflicts_with) as ComposerHints["constraintHints"]["conflictsWith"]) : fallback?.constraintHints.conflictsWith ?? [],
    },
  };
};

export const toComposeHintManifestFields = (composeHints: ComposerHints | undefined): Record<string, unknown> => {
  if (composeHints === undefined) {
    return {};
  }
  return {
    intent_aliases: composeHints.intentAliases,
    required_capabilities: composeHints.requiredCapabilities,
    required_slots: composeHints.requiredSlots,
    space_hints: {
      footprint_meters: composeHints.spaceHints.footprintMeters,
      interaction_distance_meters: composeHints.spaceHints.interactionDistanceMeters,
      facing: composeHints.spaceHints.facing,
    },
    state_hints: composeHints.stateHints,
    constraint_hints: {
      required_actor_class: composeHints.constraintHints.requiredActorClass,
      conflicts_with: composeHints.constraintHints.conflictsWith,
    },
  };
};
