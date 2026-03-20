export type BrickAuthoringTemplate = "door" | "switch" | "trigger-zone" | "ladder" | "enemy" | "composite" | "ability-set";

export type BrickAuthoringDraft = {
  template: BrickAuthoringTemplate;
  id: string;
  name: string;
  packageId: string;
  version: string;
  summary: string;
  category: string;
  license: string;
};

export type BrickAuthoringCheckItem = {
  category: string;
  status: "ready" | "warning";
  detail: string;
};

export const createAuthoringTemplateManifest = (draft: BrickAuthoringDraft): string => {
  const base = {
    id: draft.id,
    name: draft.name,
    package_id: draft.packageId,
    version: draft.version,
    summary: draft.summary,
    category: draft.category,
    license: draft.license,
    compat: "editor>=0.1.0",
  };

  const byTemplate: Record<BrickAuthoringTemplate, Record<string, unknown>> = {
    door: {
      ...base,
      runtime_kind: "door",
      properties: [
        { key: "locked", label: "Locked", type: "boolean", defaultValue: false, description: "Whether the door is locked by default." },
        { key: "openAngle", label: "Open Angle", type: "number", defaultValue: 90, description: "Open angle in degrees." },
      ],
      slots: [
        { slotId: "mesh", label: "Door Mesh", optional: false, fallbackAssetRef: "asset://mesh/default-door" },
        { slotId: "sfx-open", label: "Open SFX", optional: true, fallbackAssetRef: "asset://audio/default-door-open" },
      ],
      ports: [
        { id: "on-used", name: "OnUsed", direction: "output", dataType: "event", description: "Emitted when the door is used." },
        { id: "on-denied", name: "OnDenied", direction: "output", dataType: "event", description: "Emitted when interaction is denied." },
      ],
    },
    switch: {
      ...base,
      runtime_kind: "switch",
      properties: [
        { key: "enabled", label: "Enabled", type: "boolean", defaultValue: true, description: "Whether the switch is enabled." },
        { key: "active", label: "Active", type: "boolean", defaultValue: false, description: "Initial switch state." },
      ],
      slots: [{ slotId: "mesh", label: "Switch Mesh", optional: false, fallbackAssetRef: "asset://mesh/default-switch" }],
      ports: [{ id: "on-used", name: "OnUsed", direction: "output", dataType: "event", description: "Emitted when the switch changes state." }],
    },
    "trigger-zone": {
      ...base,
      runtime_kind: "trigger-zone",
      properties: [{ key: "enabled", label: "Enabled", type: "boolean", defaultValue: true, description: "Whether the trigger zone is enabled." }],
      slots: [{ slotId: "vfx-enter", label: "Enter VFX", optional: true, fallbackAssetRef: "asset://vfx/default-enter" }],
      ports: [{ id: "on-used", name: "OnUsed", direction: "output", dataType: "event", description: "Emitted when an actor enters or exits the zone." }],
    },
    ladder: {
      ...base,
      runtime_kind: "ladder",
      properties: [
        { key: "enabled", label: "Enabled", type: "boolean", defaultValue: true, description: "Whether the ladder is enabled." },
        { key: "has_top_anchor", label: "Top Anchor", type: "boolean", defaultValue: true, description: "Whether the ladder has a valid top anchor." },
      ],
      slots: [{ slotId: "mesh", label: "Ladder Mesh", optional: false, fallbackAssetRef: "asset://mesh/default-ladder" }],
      ports: [{ id: "on-used", name: "OnUsed", direction: "output", dataType: "event", description: "Emitted when climbing starts or ends." }],
    },
    enemy: {
      ...base,
      runtime_kind: "generic",
      properties: [
        { key: "health", label: "Health", type: "number", defaultValue: 100, description: "Base health value." },
        { key: "patrolRoute", label: "Patrol Route", type: "string", defaultValue: "route_a", description: "Patrol route id." },
        { key: "attackStyle", label: "Attack Style", type: "string", defaultValue: "melee_basic", description: "Default attack style identifier." },
      ],
      slots: [
        { slotId: "mesh", label: "Enemy Mesh", optional: false, fallbackAssetRef: "asset://mesh/default-enemy" },
        { slotId: "anim-idle", label: "Idle Animation", optional: true, fallbackAssetRef: "asset://anim/default-idle" },
      ],
      ports: [{ id: "on-alert", name: "OnAlert", direction: "output", dataType: "event", description: "Emitted when the enemy acquires a target." }],
    },
    composite: {
      ...base,
      category: "composite",
      runtime_kind: "generic",
      properties: [
        { key: "theme", label: "Theme", type: "string", defaultValue: "cabin", description: "Composite theme preset." },
        { key: "autoWire", label: "Auto Wire", type: "boolean", defaultValue: true, description: "Automatically connect child bricks after placement." },
      ],
      slots: [{ slotId: "demo-scene", label: "Demo Scene", optional: true, fallbackAssetRef: "asset://scene/default-composite-demo" }],
      ports: [{ id: "on-ready", name: "OnReady", direction: "output", dataType: "event", description: "Emitted when the composite setup is ready." }],
      composite_children: [
        { id: "trigger-entry", type: "trigger-zone", position: [-1.2, 0, 1.4] },
        { id: "door-main", type: "door", position: [1.2, 0, 1.4] },
      ],
      composite_edges: [{ from: "trigger-entry", to: "door-main" }],
      composite_param_groups: [
        {
          key: "entrance",
          label: "Entrance Setup",
          values: {
            theme: "cabin",
            autoWire: true,
          },
        },
      ],
      dependencies: ["user.basketball-ability@>=0.1.0"],
      granted_ability_packages: ["user.basketball-ability"],
    },
    "ability-set": {
      ...base,
      category: "ability",
      runtime_kind: "generic",
      supported_actor_types: ["humanoid"],
      properties: [
        { key: "abilityId", label: "Ability Id", type: "string", defaultValue: "basketball_basic", description: "Ability set identifier." },
        { key: "requiresInputMap", label: "Requires Input Map", type: "boolean", defaultValue: true, description: "Whether a dedicated input map is required." },
      ],
      slots: [
        { slotId: "anim-pack", label: "Animation Pack", optional: true, fallbackAssetRef: "asset://anim/default-ability-pack" },
        { slotId: "input-map", label: "Input Map", optional: true, fallbackAssetRef: "asset://input/default-ability-map" },
      ],
      ports: [{ id: "on-granted", name: "OnGranted", direction: "output", dataType: "event", description: "Emitted when the ability set is granted." }],
    },
  };

  return JSON.stringify(byTemplate[draft.template], null, 2);
};

const createAuthoringArtifactPayload = (manifestJson: string, packageId: string, version: string): string =>
  JSON.stringify(
    {
      artifact: {
        format: "fateblock-json",
        package: packageId,
        version,
        checksum: `sha256:${packageId.replace(/[^a-z0-9]+/gi, "").toLowerCase()}${version.replace(/\./g, "")}`,
      },
      manifest: JSON.parse(manifestJson) as unknown,
    },
    null,
    2,
  );

export const downloadAuthoringManifest = (json: string, packageId: string, version: string): void => {
  const artifactJson = createAuthoringArtifactPayload(json, packageId, version);
  const blob = new Blob([artifactJson], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${packageId.replace(/[^a-z0-9._-]+/gi, "-")}-${version}.fateblock`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const normalizeBrickSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
