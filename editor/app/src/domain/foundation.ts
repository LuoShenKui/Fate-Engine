import type { BrickDefinition } from "./brick";

const realisticHumanMetadata = {
  style: "grounded",
  artStyle: "realistic-placeholder",
  semanticTags: ["unity", "humanoid", "metric", "whitebox"],
  notes: "Human-scale placeholder content for Unity DOTS/ECS validation.",
  realWorldScale: "1 unit = 1 meter",
  actorClass: "humanoid",
  interactionIntent: "character-foundation",
  unitSystem: "metric" as const,
};

export const HumanoidActorDefinition: BrickDefinition = {
  id: "humanoid-actor",
  name: "Humanoid Actor",
  summary: "A human-scale placeholder actor profile used as the Unity host avatar source.",
  metadata: realisticHumanMetadata,
  properties: [
    { key: "heightMeters", label: "Height", type: "number", defaultValue: 1.78, description: "Standing body height in meters.", group: "Body", unit: "m" },
    { key: "capsuleRadiusMeters", label: "Capsule Radius", type: "number", defaultValue: 0.32, description: "Collision capsule radius in meters.", group: "Collision", unit: "m" },
    { key: "capsuleHeightMeters", label: "Capsule Height", type: "number", defaultValue: 1.8, description: "Collision capsule height in meters.", group: "Collision", unit: "m" },
    { key: "interactionDistanceMeters", label: "Interaction Distance", type: "number", defaultValue: 1.6, description: "Default interaction reach in meters.", group: "Interaction", unit: "m" },
  ],
  slots: [
    { slotId: "mesh.humanoid", label: "Humanoid Mesh", optional: false, fallbackAssetRef: "asset://mesh/humanoid-placeholder" },
    { slotId: "anim.controller", label: "Animator Controller", optional: false, fallbackAssetRef: "asset://anim/unity-humanoid-controller" },
  ],
  ports: [{ id: "on-spawned", name: "OnSpawned", direction: "output", dataType: "event", description: "Emitted when the actor profile is instantiated." }],
};

export const LocomotionAbilityDefinition: BrickDefinition = {
  id: "locomotion-ability",
  name: "Locomotion Ability",
  summary: "Walk, run, and jump defaults with reality-based movement parameters.",
  metadata: realisticHumanMetadata,
  properties: [
    { key: "walkSpeedMps", label: "Walk Speed", type: "number", defaultValue: 1.42, description: "Default walk speed in meters per second.", group: "Movement", unit: "m/s" },
    { key: "runSpeedMps", label: "Run Speed", type: "number", defaultValue: 3.8, description: "Default run speed in meters per second.", group: "Movement", unit: "m/s" },
    { key: "jumpHeightMeters", label: "Jump Height", type: "number", defaultValue: 0.45, description: "Jump apex height in meters.", group: "Movement", unit: "m" },
    { key: "airControl", label: "Air Control", type: "number", defaultValue: 0.35, description: "Normalized air control factor.", group: "Movement" },
    { key: "strideMeters", label: "Stride Length", type: "number", defaultValue: 0.74, description: "Expected stride length in meters.", group: "Movement", unit: "m" },
  ],
  slots: [
    { slotId: "anim.locomotion", label: "Locomotion Anim Set", optional: false, fallbackAssetRef: "asset://anim/humanoid-locomotion-pack" },
    { slotId: "input.map", label: "Input Map", optional: false, fallbackAssetRef: "asset://input/unity-third-person-map" },
  ],
  ports: [{ id: "on-mode-changed", name: "OnModeChanged", direction: "output", dataType: "event", description: "Emitted when movement mode changes." }],
};

export const PickupInteractionDefinition: BrickDefinition = {
  id: "pickup-interaction",
  name: "Pickup Interaction",
  summary: "Defines reality-based reach, carry, and attach behavior for held props.",
  metadata: realisticHumanMetadata,
  properties: [
    { key: "reachDistanceMeters", label: "Reach Distance", type: "number", defaultValue: 1.25, description: "Maximum pickup reach in meters.", group: "Interaction", unit: "m" },
    { key: "carryMassKg", label: "Carry Mass", type: "number", defaultValue: 8, description: "Maximum comfortable carry mass in kilograms.", group: "Interaction", unit: "kg" },
    { key: "holdOffsetMeters", label: "Hold Offset", type: "number", defaultValue: 0.55, description: "Forward hold offset from chest in meters.", group: "Interaction", unit: "m" },
  ],
  slots: [
    { slotId: "socket.hand", label: "Hand Socket", optional: false, fallbackAssetRef: "asset://socket/right-hand" },
    { slotId: "fx.pickup", label: "Pickup FX", optional: true, fallbackAssetRef: "asset://vfx/pickup-highlight" },
  ],
  ports: [{ id: "on-picked-up", name: "OnPickedUp", direction: "output", dataType: "event", description: "Emitted when an item is attached to the actor." }],
};

export const ThrowInteractionDefinition: BrickDefinition = {
  id: "throw-interaction",
  name: "Throw Interaction",
  summary: "Defines throw release speed, cooldown, and impulse profile for carried props.",
  metadata: realisticHumanMetadata,
  properties: [
    { key: "throwSpeedMps", label: "Throw Speed", type: "number", defaultValue: 11.5, description: "Release speed in meters per second.", group: "Interaction", unit: "m/s" },
    { key: "throwMassKg", label: "Throw Mass", type: "number", defaultValue: 2.2, description: "Reference throwable mass in kilograms.", group: "Interaction", unit: "kg" },
    { key: "cooldownSeconds", label: "Throw Cooldown", type: "number", defaultValue: 0.4, description: "Minimum delay between throws.", group: "Interaction", unit: "s" },
  ],
  slots: [
    { slotId: "fx.throw", label: "Throw FX", optional: true, fallbackAssetRef: "asset://vfx/throw-trail" },
    { slotId: "audio.throw", label: "Throw Audio", optional: true, fallbackAssetRef: "asset://audio/throw-release" },
  ],
  ports: [{ id: "on-thrown", name: "OnThrown", direction: "output", dataType: "event", description: "Emitted when the held object is released." }],
};
