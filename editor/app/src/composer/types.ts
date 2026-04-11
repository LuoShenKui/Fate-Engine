export type ComposeCapabilityId =
  | "actor.humanoid"
  | "ability.locomotion"
  | "interaction.openable_door"
  | "interaction.locked_door"
  | "interaction.key_pickup"
  | "interaction.button"
  | "interaction.lever"
  | "interaction.pressure_plate"
  | "interaction.ladder"
  | "interaction.pickup"
  | "interaction.throw"
  | "interaction.chest"
  | "interaction.dialog_trigger"
  | "interaction.quest_trigger"
  | "interaction.checkpoint"
  | "interaction.teleport"
  | "interaction.trigger_zone"
  | "interaction.damage_zone"
  | "interaction.heal_zone"
  | "interaction.item_drop"
  | "interaction.inventory_grant"
  | "interaction.socket_attach"
  | "interaction.destructible_prop"
  | "enemy.patrol"
  | "enemy.guard"
  | "enemy.melee_attack"
  | "enemy.ranged_attack"
  | "enemy.spawner"
  | "enemy.aggro_sensor"
  | "loot.drop_table"
  | "loot.pickup_reward";

export type ComposeDiagnosticCode =
  | "unsupported_intent"
  | "missing_package"
  | "missing_asset_binding"
  | "missing_formal_binding"
  | "slot_type_mismatch"
  | "required_capability_missing"
  | "capability_conflict"
  | "actor_class_mismatch"
  | "space_conflict"
  | "space_installation_missing"
  | "ambiguous_request"
  | "constraint_violation";

export type ComposeDiagnostic = {
  code: ComposeDiagnosticCode;
  severity: "error" | "warning" | "info";
  message: string;
  target?: string;
};

export type ComposerSlot = {
  slotId: string;
  label: string;
  optional: boolean;
  fallbackAssetRef?: string;
  slotType?: "mesh" | "material" | "anim" | "prefab" | "audio" | "vfx" | "script_ref" | "volume";
};

export type ComposerDefaultAssetBinding = {
  slotId: string;
  resourceType: "mesh" | "material" | "anim" | "prefab" | "audio" | "vfx" | "script_ref";
  assetPackageId: string;
  resourceId: string;
};

export type ComposerHints = {
  intentAliases: string[];
  requiredCapabilities: ComposeCapabilityId[];
  requiredSlots: string[];
  spaceHints: {
    footprintMeters: [number, number, number];
    interactionDistanceMeters: number;
    facing: "forward" | "any";
  };
  stateHints: string[];
  constraintHints: {
    requiredActorClass: string;
    conflictsWith: ComposeCapabilityId[];
  };
};

export type ComposerCatalogEntry = {
  id: string;
  name: string;
  packageId: string;
  version: string;
  packageKind: "product" | "logic" | "asset";
  installState: "ready" | "incomplete" | "blocked";
  summary: string;
  slots: ComposerSlot[];
  defaultAssetBindings: ComposerDefaultAssetBinding[];
  assetDependencies: string[];
  composeHints?: ComposerHints;
  license?: string;
  notes?: string;
};

export type ComposerAssetItem = {
  assetRef: string;
  packageId: string;
  packageVersion: string;
  resourceId: string;
  resourceType: "mesh" | "material" | "anim" | "prefab" | "audio" | "vfx" | "script_ref";
  unityTargetType: string;
  licenseSource: string;
  slotHints: string[];
  importStatus: "formal" | "fallback" | "local";
};

export type ComposeIntent = {
  rawPrompt: string;
  normalizedPrompt: string;
  capabilityIds: ComposeCapabilityId[];
  environmentHints: string[];
  unmatchedFragments: string[];
  confidence: number;
  diagnostics: ComposeDiagnostic[];
};

export type ComposeBindingSummaryItem = {
  slotId: string;
  bindingKind: "formal" | "fallback" | "unresolved";
  resolutionStatus: "formal_resolved" | "formal_missing" | "fallback_only" | "unresolved";
  assetRef: string;
  resourceType: string;
  expectedSlotType: string;
  resolvedResourceType: string;
  sourcePackageId: string;
  sourcePackageVersion: string;
  sourceResourceId: string;
  issues: string[];
  reason: string;
};

export type ComposePlanNode = {
  capabilityId: ComposeCapabilityId;
  nodeId: string;
  brickId: string;
  packageId: string;
  version: string;
  summary: string;
};

export type ComposePlan = {
  nodes: ComposePlanNode[];
  missingCapabilities: ComposeCapabilityId[];
  requiredAssetPackages: string[];
};

export type ComposeRecipeDraft = {
  version: "0";
  nodes: Array<{
    id: string;
    type: string;
    brickId: string;
    transform: {
      position: [number, number, number];
      rotation: [number, number, number];
    };
  }>;
  edges: Array<{
    from: string;
    to: string;
  }>;
  params: Record<string, unknown>;
  slot_bindings: Record<string, string>;
  seed: number;
  lockfile: {
    packages: Array<{
      id: string;
      version: string;
      hash: string;
    }>;
  };
  package_lock: {
    packages: Record<string, string>;
  };
  suppress: Array<{
    ruleId: string;
    target: string;
  }>;
};

export type ComposeAuditRecord = {
  package_id: string;
  version: string;
  license: string;
  reason: string;
  notes: string;
  alternatives: string[];
};

export type ComposeResult = {
  intent: ComposeIntent;
  plan: ComposePlan;
  recipeDraft: ComposeRecipeDraft | null;
  diagnostics: ComposeDiagnostic[];
  audit: ComposeAuditRecord[];
  bindingSummary: ComposeBindingSummaryItem[];
};
