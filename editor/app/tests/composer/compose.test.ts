import test from "node:test";
import assert from "node:assert/strict";

import {
  composeRecipeFromPrompt,
  parseComposePrompt,
  type ComposerAssetItem,
  type ComposerCatalogEntry,
} from "../../src/composer";

const catalogEntries: ComposerCatalogEntry[] = [
  {
    id: "humanoid-actor",
    name: "Humanoid Actor",
    packageId: "fate.actor.humanoid",
    version: "0.1.0",
    packageKind: "product",
    installState: "ready",
    summary: "Actor",
    slots: [
      { slotId: "mesh.humanoid", label: "Humanoid Mesh", optional: false, fallbackAssetRef: "builtin:mesh.humanoid" },
      { slotId: "anim.controller", label: "Animator Controller", optional: false, fallbackAssetRef: "builtin:anim.controller" },
    ],
    defaultAssetBindings: [
      { slotId: "mesh.humanoid", resourceType: "mesh", assetPackageId: "fate.assets.humanoid.foundation", resourceId: "humanoid_mesh_main" },
    ],
    assetDependencies: ["fate.assets.humanoid.foundation"],
    composeHints: {
      intentAliases: ["humanoid", "character", "player", "角色"],
      requiredCapabilities: ["actor.humanoid"],
      requiredSlots: ["mesh.humanoid", "anim.controller"],
      spaceHints: { footprintMeters: [0.8, 0.8, 1.8], interactionDistanceMeters: 1.6, facing: "forward" },
      stateHints: ["spawned", "ready"],
      constraintHints: { requiredActorClass: "humanoid", conflictsWith: [] },
    },
  },
  {
    id: "locomotion-ability",
    name: "Locomotion Ability",
    packageId: "fate.ability.locomotion",
    version: "0.1.0",
    packageKind: "product",
    installState: "ready",
    summary: "Walk run jump",
    slots: [
      { slotId: "anim.locomotion", label: "Locomotion", optional: false, fallbackAssetRef: "builtin:anim.locomotion" },
      { slotId: "input.map", label: "Input", optional: false, fallbackAssetRef: "builtin:input.map" },
    ],
    defaultAssetBindings: [
      { slotId: "anim.locomotion", resourceType: "anim", assetPackageId: "fate.assets.humanoid.foundation", resourceId: "humanoid_locomotion_animset" },
    ],
    assetDependencies: ["fate.assets.humanoid.foundation"],
    composeHints: {
      intentAliases: ["walk", "run", "jump", "move", "走", "跑", "跳", "移动"],
      requiredCapabilities: ["ability.locomotion"],
      requiredSlots: ["anim.locomotion", "input.map"],
      spaceHints: { footprintMeters: [0.8, 0.8, 1.8], interactionDistanceMeters: 1.6, facing: "forward" },
      stateHints: ["idle", "walk", "run", "airborne", "land"],
      constraintHints: { requiredActorClass: "humanoid", conflictsWith: [] },
    },
  },
  {
    id: "ladder",
    name: "Ladder",
    packageId: "fate.ladder.basic",
    version: "0.1.0",
    packageKind: "product",
    installState: "ready",
    summary: "Ladder",
    slots: [
      { slotId: "mesh", label: "Mesh", optional: false, fallbackAssetRef: "builtin:mesh.ladder" },
      { slotId: "anim.ladder", label: "Anim", optional: false, fallbackAssetRef: "builtin:anim.ladder" },
    ],
    defaultAssetBindings: [
      { slotId: "mesh", resourceType: "mesh", assetPackageId: "fate.assets.ladder.foundation", resourceId: "ladder_mesh_primary" },
    ],
    assetDependencies: ["fate.assets.ladder.foundation"],
    composeHints: {
      intentAliases: ["ladder", "climb", "梯子", "攀爬"],
      requiredCapabilities: ["interaction.ladder"],
      requiredSlots: ["mesh", "anim.ladder"],
      spaceHints: { footprintMeters: [0.6, 0.2, 2.8], interactionDistanceMeters: 0.8, facing: "forward" },
      stateHints: ["enter", "climb", "exit"],
      constraintHints: { requiredActorClass: "humanoid", conflictsWith: [] },
    },
  },
  {
    id: "pickup-interaction",
    name: "Pickup Interaction",
    packageId: "fate.interaction.pickup",
    version: "0.1.0",
    packageKind: "product",
    installState: "ready",
    summary: "Pickup",
    slots: [
      { slotId: "socket.hand", label: "Hand", optional: false, fallbackAssetRef: "builtin:socket.hand" },
      { slotId: "fx.pickup", label: "Pickup FX", optional: true, fallbackAssetRef: "builtin:vfx.pickup" },
    ],
    defaultAssetBindings: [
      { slotId: "socket.hand", resourceType: "script_ref", assetPackageId: "fate.assets.interaction.props", resourceId: "pickup_socket_binding" },
      { slotId: "fx.pickup", resourceType: "vfx", assetPackageId: "fate.assets.interaction.props", resourceId: "pickup_highlight_vfx" },
    ],
    assetDependencies: ["fate.assets.interaction.props"],
    composeHints: {
      intentAliases: ["pickup", "hold", "grab", "拾取", "拿起"],
      requiredCapabilities: ["interaction.pickup"],
      requiredSlots: ["socket.hand"],
      spaceHints: { footprintMeters: [0.5, 0.5, 0.5], interactionDistanceMeters: 1.25, facing: "forward" },
      stateHints: ["free", "targeting", "held"],
      constraintHints: { requiredActorClass: "humanoid", conflictsWith: [] },
    },
  },
  {
    id: "throw-interaction",
    name: "Throw Interaction",
    packageId: "fate.interaction.throw",
    version: "0.1.0",
    packageKind: "product",
    installState: "ready",
    summary: "Throw",
    slots: [
      { slotId: "fx.throw", label: "Throw FX", optional: true, fallbackAssetRef: "builtin:vfx.throw" },
      { slotId: "audio.throw", label: "Throw Audio", optional: true, fallbackAssetRef: "builtin:audio.throw" },
    ],
    defaultAssetBindings: [
      { slotId: "fx.throw", resourceType: "vfx", assetPackageId: "fate.assets.interaction.props", resourceId: "throw_release_vfx" },
    ],
    assetDependencies: ["fate.assets.interaction.props"],
    composeHints: {
      intentAliases: ["throw", "toss", "投掷", "扔"],
      requiredCapabilities: ["interaction.throw"],
      requiredSlots: ["fx.throw"],
      spaceHints: { footprintMeters: [0.5, 0.5, 0.5], interactionDistanceMeters: 1.25, facing: "forward" },
      stateHints: ["held", "windup", "released"],
      constraintHints: { requiredActorClass: "humanoid", conflictsWith: [] },
    },
  },
  {
    id: "interaction-button",
    name: "Interaction Button",
    packageId: "fate.interaction.button",
    version: "0.1.0",
    packageKind: "product",
    installState: "ready",
    summary: "Button",
    slots: [{ slotId: "mesh.button", label: "Button Mesh", optional: false, fallbackAssetRef: "builtin:button.mesh" }],
    defaultAssetBindings: [{ slotId: "mesh.button", resourceType: "mesh", assetPackageId: "fate.assets.interaction.props", resourceId: "button_mesh" }],
    assetDependencies: ["fate.assets.interaction.props"],
    composeHints: {
      intentAliases: ["button", "按钮", "按钮开关"],
      requiredCapabilities: ["interaction.button"],
      requiredSlots: ["mesh.button"],
      spaceHints: { footprintMeters: [0.3, 0.2, 0.3], interactionDistanceMeters: 1.1, facing: "forward" },
      stateHints: ["idle", "pressed", "cooldown"],
      constraintHints: { requiredActorClass: "generic", conflictsWith: [] },
    },
  },
  {
    id: "door",
    name: "Door",
    packageId: "fate.door.basic",
    version: "0.1.1",
    packageKind: "logic",
    installState: "ready",
    summary: "Door",
    slots: [{ slotId: "mesh.primary", label: "Door Mesh", optional: false, fallbackAssetRef: "builtin:door.mesh" }],
    defaultAssetBindings: [],
    assetDependencies: [],
    composeHints: {
      intentAliases: ["door", "开门", "门"],
      requiredCapabilities: ["interaction.openable_door"],
      requiredSlots: ["mesh.primary"],
      spaceHints: { footprintMeters: [1.4, 0.3, 2.3], interactionDistanceMeters: 1.6, facing: "forward" },
      stateHints: ["closed", "open"],
      constraintHints: { requiredActorClass: "generic", conflictsWith: [] },
    },
  },
  {
    id: "key-pickup",
    name: "Key Pickup",
    packageId: "fate.interaction.key-pickup",
    version: "0.1.0",
    packageKind: "product",
    installState: "ready",
    summary: "Key",
    slots: [{ slotId: "mesh.key", label: "Key Mesh", optional: false, fallbackAssetRef: "builtin:key.mesh" }],
    defaultAssetBindings: [],
    assetDependencies: ["fate.assets.interaction.props"],
    composeHints: {
      intentAliases: ["key", "钥匙"],
      requiredCapabilities: ["interaction.key_pickup"],
      requiredSlots: ["mesh.key"],
      spaceHints: { footprintMeters: [0.2, 0.2, 0.2], interactionDistanceMeters: 1.2, facing: "forward" },
      stateHints: ["available", "collected"],
      constraintHints: { requiredActorClass: "generic", conflictsWith: [] },
    },
  },
  {
    id: "treasure-chest",
    name: "Treasure Chest",
    packageId: "fate.interaction.chest",
    version: "0.1.0",
    packageKind: "product",
    installState: "ready",
    summary: "Chest",
    slots: [{ slotId: "mesh.chest", label: "Chest Mesh", optional: false, fallbackAssetRef: "builtin:chest.mesh" }],
    defaultAssetBindings: [{ slotId: "mesh.chest", resourceType: "mesh", assetPackageId: "fate.assets.loot.chests", resourceId: "chest_mesh" }],
    assetDependencies: ["fate.assets.loot.chests"],
    composeHints: {
      intentAliases: ["chest", "宝箱"],
      requiredCapabilities: ["interaction.chest"],
      requiredSlots: ["mesh.chest"],
      spaceHints: { footprintMeters: [1, 0.9, 0.9], interactionDistanceMeters: 1.4, facing: "forward" },
      stateHints: ["closed", "opened"],
      constraintHints: { requiredActorClass: "generic", conflictsWith: [] },
    },
  },
  {
    id: "guard-enemy",
    name: "Guard Enemy",
    packageId: "fate.enemy.guard",
    version: "0.1.0",
    packageKind: "product",
    installState: "ready",
    summary: "Guard Enemy",
    slots: [{ slotId: "mesh.enemy", label: "Enemy Mesh", optional: false, fallbackAssetRef: "builtin:enemy.guard.mesh" }],
    defaultAssetBindings: [{ slotId: "mesh.enemy", resourceType: "mesh", assetPackageId: "fate.assets.melee.enemy", resourceId: "guard_mesh" }],
    assetDependencies: ["fate.assets.melee.enemy"],
    composeHints: {
      intentAliases: ["guard", "守卫", "看守敌人"],
      requiredCapabilities: ["enemy.guard"],
      requiredSlots: ["mesh.enemy"],
      spaceHints: { footprintMeters: [0.9, 0.9, 1.9], interactionDistanceMeters: 5, facing: "forward" },
      stateHints: ["idle", "alert", "attack"],
      constraintHints: { requiredActorClass: "humanoid", conflictsWith: [] },
    },
  },
  {
    id: "patrol-guard",
    name: "Patrol Guard",
    packageId: "fate.enemy.patrol",
    version: "0.1.0",
    packageKind: "product",
    installState: "ready",
    summary: "Patrol Enemy",
    slots: [{ slotId: "mesh.enemy", label: "Enemy Mesh", optional: false, fallbackAssetRef: "builtin:enemy.mesh" }],
    defaultAssetBindings: [{ slotId: "mesh.enemy", resourceType: "mesh", assetPackageId: "fate.assets.melee.enemy", resourceId: "guard_mesh" }],
    assetDependencies: ["fate.assets.melee.enemy"],
    composeHints: {
      intentAliases: ["patrol enemy", "enemy patrol", "巡逻敌人", "巡逻"],
      requiredCapabilities: ["enemy.patrol"],
      requiredSlots: ["mesh.enemy"],
      spaceHints: { footprintMeters: [0.8, 0.8, 1.8], interactionDistanceMeters: 6, facing: "forward" },
      stateHints: ["idle", "patrol", "alert"],
      constraintHints: { requiredActorClass: "humanoid", conflictsWith: [] },
    },
  },
  {
    id: "enemy-melee-attack",
    name: "Enemy Melee Attack",
    packageId: "fate.enemy.melee-attack",
    version: "0.1.0",
    packageKind: "product",
    installState: "ready",
    summary: "Enemy Melee Attack",
    slots: [{ slotId: "anim.attack", label: "Attack Anim", optional: false, fallbackAssetRef: "builtin:enemy.attack.anim" }],
    defaultAssetBindings: [{ slotId: "anim.attack", resourceType: "anim", assetPackageId: "fate.assets.melee.enemy", resourceId: "melee_attack_anim" }],
    assetDependencies: ["fate.assets.melee.enemy"],
    composeHints: {
      intentAliases: ["melee", "近战", "近战敌人"],
      requiredCapabilities: ["enemy.melee_attack"],
      requiredSlots: ["anim.attack"],
      spaceHints: { footprintMeters: [0.8, 0.8, 1.8], interactionDistanceMeters: 2.4, facing: "forward" },
      stateHints: ["ready", "windup", "swing", "recover"],
      constraintHints: { requiredActorClass: "humanoid", conflictsWith: [] },
    },
  },
  {
    id: "enemy-ranged-attack",
    name: "Enemy Ranged Attack",
    packageId: "fate.enemy.ranged-attack",
    version: "0.1.0",
    packageKind: "product",
    installState: "ready",
    summary: "Enemy Ranged Attack",
    slots: [{ slotId: "anim.shoot", label: "Shoot Anim", optional: false, fallbackAssetRef: "builtin:enemy.shoot.anim" }],
    defaultAssetBindings: [{ slotId: "anim.shoot", resourceType: "anim", assetPackageId: "fate.assets.ranged.enemy", resourceId: "ranged_attack_anim" }],
    assetDependencies: ["fate.assets.ranged.enemy"],
    composeHints: {
      intentAliases: ["ranged", "远程", "远程敌人", "射击敌人"],
      requiredCapabilities: ["enemy.ranged_attack"],
      requiredSlots: ["anim.shoot"],
      spaceHints: { footprintMeters: [0.8, 0.8, 1.8], interactionDistanceMeters: 10, facing: "forward" },
      stateHints: ["ready", "aim", "fire", "recover"],
      constraintHints: { requiredActorClass: "humanoid", conflictsWith: [] },
    },
  },
  {
    id: "enemy-spawner",
    name: "Enemy Spawner",
    packageId: "fate.enemy.spawner",
    version: "0.1.0",
    packageKind: "product",
    installState: "ready",
    summary: "Enemy Spawner",
    slots: [{ slotId: "fx.spawn", label: "Spawn FX", optional: true, fallbackAssetRef: "builtin:spawn.vfx" }],
    defaultAssetBindings: [{ slotId: "fx.spawn", resourceType: "vfx", assetPackageId: "fate.assets.fx.gameplay", resourceId: "spawn_vfx" }],
    assetDependencies: ["fate.assets.fx.gameplay"],
    composeHints: {
      intentAliases: ["spawner", "刷怪点", "生成敌人"],
      requiredCapabilities: ["enemy.spawner"],
      requiredSlots: [],
      spaceHints: { footprintMeters: [1, 1, 1], interactionDistanceMeters: 0.5, facing: "forward" },
      stateHints: ["idle", "armed", "spent"],
      constraintHints: { requiredActorClass: "generic", conflictsWith: [] },
    },
  },
  {
    id: "aggro-sensor",
    name: "Aggro Sensor",
    packageId: "fate.enemy.aggro-sensor",
    version: "0.1.0",
    packageKind: "product",
    installState: "ready",
    summary: "Aggro Sensor",
    slots: [{ slotId: "fx.sensor", label: "Sensor FX", optional: true, fallbackAssetRef: "builtin:sensor.vfx" }],
    defaultAssetBindings: [{ slotId: "fx.sensor", resourceType: "vfx", assetPackageId: "fate.assets.fx.gameplay", resourceId: "sensor_vfx" }],
    assetDependencies: ["fate.assets.fx.gameplay"],
    composeHints: {
      intentAliases: ["aggro", "仇恨", "警戒范围"],
      requiredCapabilities: ["enemy.aggro_sensor"],
      requiredSlots: [],
      spaceHints: { footprintMeters: [0.5, 0.5, 0.5], interactionDistanceMeters: 8, facing: "forward" },
      stateHints: ["idle", "tracking"],
      constraintHints: { requiredActorClass: "generic", conflictsWith: [] },
    },
  },
  {
    id: "item-drop",
    name: "Item Drop",
    packageId: "fate.interaction.item-drop",
    version: "0.1.0",
    packageKind: "product",
    installState: "ready",
    summary: "Item Drop",
    slots: [{ slotId: "mesh.drop", label: "Drop Mesh", optional: false, fallbackAssetRef: "builtin:drop.mesh" }],
    defaultAssetBindings: [{ slotId: "mesh.drop", resourceType: "mesh", assetPackageId: "fate.assets.interaction.props", resourceId: "drop_reward_mesh" }],
    assetDependencies: ["fate.assets.interaction.props"],
    composeHints: {
      intentAliases: ["drop reward", "掉落", "掉落奖励"],
      requiredCapabilities: ["interaction.item_drop"],
      requiredSlots: ["mesh.drop"],
      spaceHints: { footprintMeters: [0.4, 0.4, 0.4], interactionDistanceMeters: 1.2, facing: "forward" },
      stateHints: ["spawned", "claimed"],
      constraintHints: { requiredActorClass: "generic", conflictsWith: [] },
    },
  },
  {
    id: "inventory-grant",
    name: "Inventory Grant",
    packageId: "fate.interaction.inventory-grant",
    version: "0.1.0",
    packageKind: "product",
    installState: "ready",
    summary: "Inventory Reward",
    slots: [{ slotId: "ui.reward", label: "Reward UI", optional: true, fallbackAssetRef: "builtin:reward.ui" }],
    defaultAssetBindings: [],
    assetDependencies: [],
    composeHints: {
      intentAliases: ["reward", "奖励", "inventory grant"],
      requiredCapabilities: ["interaction.inventory_grant"],
      requiredSlots: [],
      spaceHints: { footprintMeters: [0.2, 0.2, 0.2], interactionDistanceMeters: 1.0, facing: "forward" },
      stateHints: ["ready", "granted"],
      constraintHints: { requiredActorClass: "generic", conflictsWith: [] },
    },
  },
];

const assetItems: ComposerAssetItem[] = [
  {
    assetRef: "assetpkg://fate.assets.humanoid.foundation/humanoid_mesh_main",
    packageId: "fate.assets.humanoid.foundation",
    packageVersion: "0.1.0",
    resourceId: "humanoid_mesh_main",
    resourceType: "mesh",
    unityTargetType: "Mesh",
    licenseSource: "CC0",
    slotHints: ["mesh.humanoid"],
    importStatus: "formal",
  },
  {
    assetRef: "assetpkg://fate.assets.humanoid.foundation/humanoid_locomotion_animset",
    packageId: "fate.assets.humanoid.foundation",
    packageVersion: "0.1.0",
    resourceId: "humanoid_locomotion_animset",
    resourceType: "anim",
    unityTargetType: "AnimationClip",
    licenseSource: "CC0",
    slotHints: ["anim.locomotion"],
    importStatus: "formal",
  },
  {
    assetRef: "assetpkg://fate.assets.ladder.foundation/ladder_mesh_primary",
    packageId: "fate.assets.ladder.foundation",
    packageVersion: "0.1.0",
    resourceId: "ladder_mesh_primary",
    resourceType: "mesh",
    unityTargetType: "Mesh",
    licenseSource: "CC0",
    slotHints: ["mesh"],
    importStatus: "formal",
  },
  {
    assetRef: "assetpkg://fate.assets.interaction.props/pickup_socket_binding",
    packageId: "fate.assets.interaction.props",
    packageVersion: "0.1.0",
    resourceId: "pickup_socket_binding",
    resourceType: "script_ref",
    unityTargetType: "MonoScript",
    licenseSource: "CC0",
    slotHints: ["socket.hand"],
    importStatus: "formal",
  },
  {
    assetRef: "assetpkg://fate.assets.interaction.props/pickup_highlight_vfx",
    packageId: "fate.assets.interaction.props",
    packageVersion: "0.1.0",
    resourceId: "pickup_highlight_vfx",
    resourceType: "vfx",
    unityTargetType: "VisualEffectAsset",
    licenseSource: "CC0",
    slotHints: ["fx.pickup"],
    importStatus: "formal",
  },
  {
    assetRef: "assetpkg://fate.assets.interaction.props/throw_release_vfx",
    packageId: "fate.assets.interaction.props",
    packageVersion: "0.1.0",
    resourceId: "throw_release_vfx",
    resourceType: "vfx",
    unityTargetType: "VisualEffectAsset",
    licenseSource: "CC0",
    slotHints: ["fx.throw"],
    importStatus: "formal",
  },
  {
    assetRef: "assetpkg://fate.assets.loot.chests/chest_mesh",
    packageId: "fate.assets.loot.chests",
    packageVersion: "0.1.0",
    resourceId: "chest_mesh",
    resourceType: "mesh",
    unityTargetType: "Mesh",
    licenseSource: "CC0",
    slotHints: ["mesh.chest"],
    importStatus: "formal",
  },
  {
    assetRef: "assetpkg://fate.assets.melee.enemy/guard_mesh",
    packageId: "fate.assets.melee.enemy",
    packageVersion: "0.1.0",
    resourceId: "guard_mesh",
    resourceType: "mesh",
    unityTargetType: "Mesh",
    licenseSource: "CC0",
    slotHints: ["mesh.enemy"],
    importStatus: "formal",
  },
  {
    assetRef: "assetpkg://fate.assets.interaction.props/drop_reward_mesh",
    packageId: "fate.assets.interaction.props",
    packageVersion: "0.1.0",
    resourceId: "drop_reward_mesh",
    resourceType: "mesh",
    unityTargetType: "Mesh",
    licenseSource: "CC0",
    slotHints: ["mesh.drop"],
    importStatus: "formal",
  },
  {
    assetRef: "assetpkg://fate.assets.interaction.props/button_mesh",
    packageId: "fate.assets.interaction.props",
    packageVersion: "0.1.0",
    resourceId: "button_mesh",
    resourceType: "mesh",
    unityTargetType: "Mesh",
    licenseSource: "CC0",
    slotHints: ["mesh.button"],
    importStatus: "formal",
  },
  {
    assetRef: "assetpkg://fate.assets.melee.enemy/melee_attack_anim",
    packageId: "fate.assets.melee.enemy",
    packageVersion: "0.1.0",
    resourceId: "melee_attack_anim",
    resourceType: "anim",
    unityTargetType: "AnimationClip",
    licenseSource: "CC0",
    slotHints: ["anim.attack"],
    importStatus: "formal",
  },
  {
    assetRef: "assetpkg://fate.assets.ranged.enemy/ranged_attack_anim",
    packageId: "fate.assets.ranged.enemy",
    packageVersion: "0.1.0",
    resourceId: "ranged_attack_anim",
    resourceType: "anim",
    unityTargetType: "AnimationClip",
    licenseSource: "CC0",
    slotHints: ["anim.shoot"],
    importStatus: "formal",
  },
  {
    assetRef: "assetpkg://fate.assets.fx.gameplay/spawn_vfx",
    packageId: "fate.assets.fx.gameplay",
    packageVersion: "0.1.0",
    resourceId: "spawn_vfx",
    resourceType: "vfx",
    unityTargetType: "VisualEffectAsset",
    licenseSource: "CC0",
    slotHints: ["fx.spawn"],
    importStatus: "formal",
  },
  {
    assetRef: "assetpkg://fate.assets.fx.gameplay/sensor_vfx",
    packageId: "fate.assets.fx.gameplay",
    packageVersion: "0.1.0",
    resourceId: "sensor_vfx",
    resourceType: "vfx",
    unityTargetType: "VisualEffectAsset",
    licenseSource: "CC0",
    slotHints: ["fx.sensor"],
    importStatus: "formal",
  },
];

test("parseComposePrompt recognizes fixed character foundation intents", () => {
  const intent = parseComposePrompt("做一个角色，能走跑跳、爬梯子、拾取并投掷物品");

  assert.deepEqual(intent.capabilityIds, [
    "actor.humanoid",
    "ability.locomotion",
    "interaction.ladder",
    "interaction.pickup",
    "interaction.throw",
  ]);
  assert.equal(intent.diagnostics.length, 0);
});

test("parseComposePrompt reports unsupported intent outside v0 scope", () => {
  const intent = parseComposePrompt("做一个载具战斗和天气系统");

  assert.equal(intent.capabilityIds.length, 0);
  assert.equal(intent.diagnostics[0]?.code, "unsupported_intent");
});

test("parseComposePrompt recognizes grounded interaction and enemy intents", () => {
  const intent = parseComposePrompt("写实第三人称角色，开门、找钥匙、开宝箱、打巡逻敌人、掉落奖励");

  assert.deepEqual(intent.capabilityIds, [
    "actor.humanoid",
    "interaction.openable_door",
    "interaction.key_pickup",
    "interaction.chest",
    "interaction.item_drop",
    "interaction.inventory_grant",
    "enemy.patrol",
  ]);
});

test("composeRecipeFromPrompt is deterministic for the same prompt and package set", () => {
  const prompt = "做一个角色，能走跑跳、爬梯子、拾取并投掷物品";

  const first = composeRecipeFromPrompt({ prompt, catalogEntries, assetItems });
  const second = composeRecipeFromPrompt({ prompt, catalogEntries, assetItems });

  assert.deepEqual(first.recipeDraft, second.recipeDraft);
  assert.equal(first.recipeDraft?.nodes.length, 5);
  assert.equal(first.recipeDraft?.edges.length, 4);
});

test("composeRecipeFromPrompt prefers formal bindings, then fallback, then unresolved diagnostics", () => {
  const result = composeRecipeFromPrompt({
    prompt: "做一个角色，能走跑跳、拾取并投掷物品",
    catalogEntries,
    assetItems,
  });

  const bindings = result.bindingSummary;
  const meshBinding = bindings.find((item: { slotId: string }) => item.slotId === "mesh.humanoid");
  const throwAudioBinding = bindings.find((item: { slotId: string }) => item.slotId === "audio.throw");
  const fxThrowBinding = bindings.find((item: { slotId: string }) => item.slotId === "fx.throw");

  assert.equal(meshBinding?.bindingKind, "formal");
  assert.equal(meshBinding?.assetRef, "assetpkg://fate.assets.humanoid.foundation/humanoid_mesh_main");
  assert.equal(fxThrowBinding?.bindingKind, "formal");
  assert.equal(throwAudioBinding?.bindingKind, "fallback");

  const unresolved = composeRecipeFromPrompt({
    prompt: "做一个角色，能爬梯子",
    catalogEntries: catalogEntries.filter((entry) => entry.id !== "ladder"),
    assetItems,
  });

  assert.equal(unresolved.recipeDraft, null);
  assert.equal(unresolved.diagnostics[0]?.code, "missing_package");
});

test("composeRecipeFromPrompt blocks when a declared formal binding is missing even if fallback exists", () => {
  const result = composeRecipeFromPrompt({
    prompt: "做一个角色，能走跑跳、拾取并投掷物品",
    catalogEntries,
    assetItems: assetItems.filter((item) => item.resourceId !== "throw_release_vfx"),
  });

  assert.equal(result.recipeDraft, null);
  assert.equal(result.diagnostics.some((diagnostic) => diagnostic.code === "missing_formal_binding"), true);
  assert.equal(result.bindingSummary.find((item) => item.slotId === "fx.throw")?.resolutionStatus, "formal_missing");
});

test("composeRecipeFromPrompt assembles grounded interaction and enemy bricks beyond the foundation set", () => {
  const result = composeRecipeFromPrompt({
    prompt: "写实第三人称角色，开门、找钥匙、开宝箱、打巡逻敌人、掉落奖励",
    catalogEntries,
    assetItems,
  });

  assert.equal(result.recipeDraft?.nodes.some((node) => node.type === "door"), true);
  assert.equal(result.recipeDraft?.nodes.some((node) => node.type === "key-pickup"), true);
  assert.equal(result.recipeDraft?.nodes.some((node) => node.type === "treasure-chest"), true);
  assert.equal(result.recipeDraft?.nodes.some((node) => node.type === "patrol-guard"), true);
  assert.equal(result.recipeDraft?.nodes.some((node) => node.type === "item-drop"), true);
  assert.equal(result.recipeDraft?.nodes.some((node) => node.type === "inventory-grant"), true);
});

test("composeRecipeFromPrompt resolves formal entries for button, guard, melee, ranged, spawner, and aggro sensor", () => {
  const result = composeRecipeFromPrompt({
    prompt: "按钮开门，守卫近战，远程敌人刷怪点，并有警戒范围",
    catalogEntries,
    assetItems,
  });

  assert.equal(result.recipeDraft?.nodes.some((node) => node.type === "interaction-button"), true);
  assert.equal(result.recipeDraft?.nodes.some((node) => node.type === "guard-enemy"), true);
  assert.equal(result.recipeDraft?.nodes.some((node) => node.type === "enemy-melee-attack"), true);
  assert.equal(result.recipeDraft?.nodes.some((node) => node.type === "enemy-ranged-attack"), true);
  assert.equal(result.recipeDraft?.nodes.some((node) => node.type === "enemy-spawner"), true);
  assert.equal(result.recipeDraft?.nodes.some((node) => node.type === "aggro-sensor"), true);
});
