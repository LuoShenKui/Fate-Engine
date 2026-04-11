import type { ComposeCapabilityId, ComposerCatalogEntry, ComposerHints } from "./types";
import { CAPABILITY_ORDER } from "./capability-map";

const DEFAULT_HINTS: Record<string, ComposerHints> = {
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
  door: {
    intentAliases: ["door", "open door", "开门", "门"],
    requiredCapabilities: ["interaction.openable_door"],
    requiredSlots: ["mesh.primary", "audio.open_close"],
    spaceHints: { footprintMeters: [1.4, 0.3, 2.3], interactionDistanceMeters: 1.6, facing: "forward" },
    stateHints: ["closed", "opening", "open"],
    constraintHints: { requiredActorClass: "generic", conflictsWith: [] },
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
    requiredSlots: ["fx.throw"],
    spaceHints: { footprintMeters: [0.5, 0.5, 0.5], interactionDistanceMeters: 1.25, facing: "forward" },
    stateHints: ["held", "windup", "released"],
    constraintHints: { requiredActorClass: "humanoid", conflictsWith: [] },
  },
  "patrol-guard": {
    intentAliases: ["enemy patrol", "patrol enemy", "巡逻敌人", "巡逻"],
    requiredCapabilities: ["enemy.patrol"],
    requiredSlots: ["mesh", "anim.idle", "anim.move"],
    spaceHints: { footprintMeters: [0.8, 0.8, 1.9], interactionDistanceMeters: 6, facing: "forward" },
    stateHints: ["idle", "patrol", "alert", "chase"],
    constraintHints: { requiredActorClass: "humanoid", conflictsWith: [] },
  },
};

export const withDefaultComposeHints = (entry: ComposerCatalogEntry): ComposerCatalogEntry => {
  if (entry.composeHints !== undefined) {
    return entry;
  }
  return {
    ...entry,
    composeHints: DEFAULT_HINTS[entry.id],
  };
};
