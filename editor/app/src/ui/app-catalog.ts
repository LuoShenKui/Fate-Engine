import type { BrickDefinition } from "../domain/brick";
import { listBrickDefinitions } from "../domain/registry";
import type { InstallReportItem } from "./InstallReportPanel";
import { BUILTIN_SCENE_CATEGORY, DEFAULT_ACTOR_TYPE } from "./app-constants";
import { emptyBrickTags } from "./brick-tags";
import type { BrickCatalogEntry } from "./app-types";

export const toCatalogEntry = (definition: BrickDefinition, source: "builtin" | "imported", overrides?: Partial<BrickCatalogEntry>): BrickCatalogEntry => ({
  ...definition,
  packageId: overrides?.packageId ?? `fate.${definition.id}`,
  version: overrides?.version ?? "0.1.0",
  license: overrides?.license ?? "Proprietary",
  dependencies: overrides?.dependencies ?? [],
  compat: overrides?.compat ?? "editor>=0.1.0",
  contractVersion: overrides?.contractVersion ?? "0.1",
  supportedActorTypes: overrides?.supportedActorTypes ?? [],
  category: overrides?.category ?? BUILTIN_SCENE_CATEGORY,
  source,
  installState: overrides?.installState ?? "ready",
  importIssues: overrides?.importIssues ?? [],
  runtimeKind: overrides?.runtimeKind ?? (definition.id === "door" || definition.id === "switch" || definition.id === "ladder" || definition.id === "trigger-zone" || definition.id === "enemy" ? definition.id : "generic"),
  compositeChildren: overrides?.compositeChildren ?? [],
  compositeEdges: overrides?.compositeEdges ?? [],
  compositeParamGroups: overrides?.compositeParamGroups ?? [],
  grantedAbilityPackageIds: overrides?.grantedAbilityPackageIds ?? [],
  tags: overrides?.tags ?? emptyBrickTags(),
});

export const builtinCatalogEntries: BrickCatalogEntry[] = [
  ...listBrickDefinitions().map((definition) => toCatalogEntry(definition, "builtin")),
  toCatalogEntry(
    {
      id: "patrol-guard",
      name: "Patrol Guard",
      summary: "A reusable enemy template with patrol, chase, and melee attack defaults.",
      properties: [
        { key: "health", label: "Health", type: "number", defaultValue: 120, description: "Base health value." },
        { key: "patrolRoute", label: "Patrol Route", type: "string", defaultValue: "route_guard_a", description: "Patrol route id." },
        { key: "attackStyle", label: "Attack Style", type: "string", defaultValue: "melee_combo_a", description: "Default attack style identifier." },
        { key: "aggroRadius", label: "Aggro Radius", type: "number", defaultValue: 6, description: "Enemy aggro radius in meters." },
      ],
      slots: [
        { slotId: "mesh", label: "Enemy Mesh", optional: false, fallbackAssetRef: "asset://mesh/default-guard" },
        { slotId: "anim-idle", label: "Idle Animation", optional: false, fallbackAssetRef: "asset://anim/default-guard-idle" },
        { slotId: "anim-attack", label: "Attack Animation", optional: false, fallbackAssetRef: "asset://anim/default-guard-attack" },
      ],
      ports: [{ id: "on-alert", name: "OnAlert", direction: "output", dataType: "event", description: "Emitted when the guard acquires a target." }],
    },
    "builtin",
    {
      packageId: "fate.enemy.patrol-guard",
      version: "0.1.0",
      license: "Proprietary",
      compat: "editor>=0.1.0",
      category: "enemy",
      tags: { styleTags: ["stylized"], platformTags: ["desktop"], themeTags: ["forest", "combat"], interactionTags: ["combat", "patrol"] },
    },
  ),
  toCatalogEntry(
    {
      id: "basketball-ability",
      name: "Basketball Ability Set",
      summary: "Grants dribble and shoot interactions to compatible actors.",
      properties: [
        { key: "abilityId", label: "Ability Id", type: "string", defaultValue: "basketball_basic", description: "Ability set identifier." },
        { key: "requiresInputMap", label: "Requires Input Map", type: "boolean", defaultValue: true, description: "Whether a dedicated input map is required." },
      ],
      slots: [
        { slotId: "anim-pack", label: "Animation Pack", optional: false, fallbackAssetRef: "asset://anim/default-basketball-pack" },
        { slotId: "input-map", label: "Input Map", optional: false, fallbackAssetRef: "asset://input/default-basketball-map" },
      ],
      ports: [{ id: "on-granted", name: "OnGranted", direction: "output", dataType: "event", description: "Emitted when the ability set is granted." }],
    },
    "builtin",
    {
      packageId: "fate.basketball-ability",
      version: "0.1.0",
      license: "Proprietary",
      compat: "editor>=0.1.0",
      category: "ability",
      supportedActorTypes: [DEFAULT_ACTOR_TYPE],
      tags: { styleTags: ["stylized"], platformTags: ["desktop"], themeTags: ["sports"], interactionTags: ["ability-grant", "actor-bound"] },
    },
  ),
  toCatalogEntry(
    {
      id: "basketball-court",
      name: "Basketball Court",
      summary: "A composite court area that grants basketball abilities while preserving a simple door interaction demo.",
      properties: [
        { key: "theme", label: "Theme", type: "string", defaultValue: "basketball", description: "Court theme preset." },
        { key: "grantOnEnter", label: "Grant On Enter", type: "boolean", defaultValue: true, description: "Grant the linked ability when the actor enters the court zone." },
      ],
      slots: [{ slotId: "demo-scene", label: "Demo Scene", optional: true, fallbackAssetRef: "asset://scene/default-basketball-court" }],
      ports: [{ id: "on-ready", name: "OnReady", direction: "output", dataType: "event", description: "Emitted when the court is ready." }],
    },
    "builtin",
    {
      packageId: "fate.basketball-court",
      version: "0.1.0",
      license: "Proprietary",
      compat: "editor>=0.1.0",
      category: "composite",
      dependencies: ["fate.basketball-ability@>=0.1.0"],
      compositeChildren: [
        { id: "court-zone", type: "trigger-zone", position: [-1.2, 0, 1.6] },
        { id: "court-door", type: "door", position: [1.2, 0, 1.6] },
      ],
      compositeEdges: [{ from: "court-zone", to: "court-door" }],
      compositeParamGroups: [{ key: "court", label: "Court Setup", values: { theme: "basketball", grantOnEnter: true } }],
      grantedAbilityPackageIds: ["fate.basketball-ability"],
      tags: { styleTags: ["stylized"], platformTags: ["desktop"], themeTags: ["sports"], interactionTags: ["composite", "ability-grant"] },
    },
  ),
  toCatalogEntry(
    {
      id: "small-house",
      name: "Small House",
      summary: "A reusable cabin setup with an entry trigger, front door, and interior switch.",
      properties: [
        { key: "theme", label: "Theme", type: "string", defaultValue: "cabin", description: "House art and prop preset." },
        { key: "autoOpenOnEnter", label: "Auto Open On Enter", type: "boolean", defaultValue: true, description: "Open the front door when the entry trigger is occupied." },
      ],
      slots: [{ slotId: "demo-scene", label: "Demo Scene", optional: true, fallbackAssetRef: "asset://scene/default-small-house" }],
      ports: [{ id: "on-ready", name: "OnReady", direction: "output", dataType: "event", description: "Emitted when the house setup is ready." }],
    },
    "builtin",
    {
      packageId: "fate.composite.small-house",
      version: "0.1.0",
      license: "Proprietary",
      compat: "editor>=0.1.0",
      category: "composite",
      dependencies: ["fate.door@>=0.1.0", "fate.switch@>=0.1.0", "fate.trigger-zone@>=0.1.0"],
      compositeChildren: [
        { id: "entry-zone", type: "trigger-zone", position: [-1.2, 0, 1.6] },
        { id: "front-door", type: "door", position: [1.2, 0, 1.6] },
        { id: "inside-switch", type: "switch", position: [1.4, 0, -0.6] },
      ],
      compositeEdges: [
        { from: "entry-zone", to: "front-door" },
        { from: "inside-switch", to: "front-door" },
      ],
      compositeParamGroups: [{ key: "house", label: "House Setup", values: { theme: "cabin", autoOpenOnEnter: true } }],
      tags: { styleTags: ["stylized"], platformTags: ["desktop"], themeTags: ["forest", "cabin"], interactionTags: ["door", "switch", "composite"] },
    },
  ),
  toCatalogEntry(
    {
      id: "warehouse-zone",
      name: "Warehouse Zone",
      summary: "A reusable warehouse gameplay area with a gate, route trigger, and access ladder.",
      properties: [
        { key: "theme", label: "Theme", type: "string", defaultValue: "warehouse", description: "Warehouse visual preset." },
        { key: "requiresRouteTrigger", label: "Requires Route Trigger", type: "boolean", defaultValue: true, description: "Keep the route trigger active for the gate flow." },
      ],
      slots: [{ slotId: "demo-scene", label: "Demo Scene", optional: true, fallbackAssetRef: "asset://scene/default-warehouse-zone" }],
      ports: [{ id: "on-ready", name: "OnReady", direction: "output", dataType: "event", description: "Emitted when the warehouse zone is ready." }],
    },
    "builtin",
    {
      packageId: "fate.composite.warehouse-zone",
      version: "0.1.0",
      license: "Proprietary",
      compat: "editor>=0.1.0",
      category: "composite",
      dependencies: ["fate.door@>=0.1.0", "fate.ladder@>=0.1.0", "fate.switch@>=0.1.0", "fate.trigger-zone@>=0.1.0"],
      compositeChildren: [
        { id: "route-trigger", type: "trigger-zone", position: [-1.6, 0, 1.8] },
        { id: "loading-gate", type: "door", position: [1.6, 0, 1.8] },
        { id: "catwalk-ladder", type: "ladder", position: [-1.8, 0, -0.6] },
        { id: "control-switch", type: "switch", position: [1.8, 0, -0.8] },
      ],
      compositeEdges: [
        { from: "route-trigger", to: "loading-gate" },
        { from: "control-switch", to: "loading-gate" },
      ],
      compositeParamGroups: [{ key: "warehouse", label: "Warehouse Setup", values: { theme: "warehouse", requiresRouteTrigger: true } }],
      tags: { styleTags: ["stylized"], platformTags: ["desktop"], themeTags: ["industrial"], interactionTags: ["door", "ladder", "switch", "zone"] },
    },
  ),
];

export const compareSemver = (left: string, right: string): number => {
  const leftParts = left.split(".").map((part) => Number(part));
  const rightParts = right.split(".").map((part) => Number(part));
  for (let index = 0; index < 3; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;
    if (leftValue < rightValue) return -1;
    if (leftValue > rightValue) return 1;
  }
  return 0;
};

export const versionMatches = (version: string, requirement: string): boolean => {
  const match = /^(>=|<=|>|<|=)?([0-9]+\.[0-9]+\.[0-9]+)$/.exec(requirement.trim());
  if (match === null) {
    return false;
  }
  const operator = match[1] ?? "=";
  const requiredVersion = match[2];
  const result = compareSemver(version, requiredVersion);
  if (operator === "=") return result === 0;
  if (operator === ">") return result > 0;
  if (operator === ">=") return result >= 0;
  if (operator === "<") return result < 0;
  if (operator === "<=") return result <= 0;
  return false;
};

export const parseDependencyList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    if (typeof item === "string") {
      return [item];
    }
    if (typeof item === "object" && item !== null) {
      const dep = item as Record<string, unknown>;
      const depId = typeof dep.id === "string" ? dep.id : null;
      const depVersion = typeof dep.version === "string" ? dep.version : null;
      if (depId !== null && depVersion !== null) {
        return [`${depId}@${depVersion}`];
      }
      if (depId !== null) {
        return [depId];
      }
    }
    return [];
  });
};

export const parseDependencyRequirement = (raw: string): { id: string; requirement: string | null } => {
  const atIndex = raw.indexOf("@");
  if (atIndex <= 0) {
    return { id: raw, requirement: null };
  }
  return { id: raw.slice(0, atIndex), requirement: raw.slice(atIndex + 1) };
};

export const normalizeDependencyVersion = (requirement: string | null, fallback: string): string => {
  if (requirement === null) {
    return fallback;
  }
  const match = /([0-9]+\.[0-9]+\.[0-9]+)/.exec(requirement);
  return match?.[1] ?? fallback;
};

export const inferRuntimeKindFromPackageId = (packageId: string): BrickCatalogEntry["runtimeKind"] => {
  const normalized = packageId.toLowerCase();
  if (normalized.includes("trigger")) return "trigger-zone";
  if (normalized.includes("ladder")) return "ladder";
  if (normalized.includes("switch")) return "switch";
  if (normalized.includes("door")) return "door";
  if (normalized.includes("enemy") || normalized.includes("guard")) return "enemy";
  return "generic";
};

export const toInstallReportItems = (entries: BrickCatalogEntry[]): InstallReportItem[] =>
  entries.reduce<InstallReportItem[]>((acc, entry) => {
    if (entry.importIssues.length === 0) {
      acc.push({ level: "Info", code: "READY", brickId: entry.id, brickName: entry.name, detail: `${entry.packageId}@${entry.version} is ready to use.` });
      return acc;
    }
    entry.importIssues.forEach((issue) => {
      if (issue.startsWith("ENGINE_INCOMPATIBLE")) {
        acc.push({ level: "Error", code: "ENGINE_INCOMPATIBLE", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Use a compatible engine version or import a compatible brick version." });
        return;
      }
      if (issue.startsWith("DEPENDENCY_MISSING")) {
        acc.push({ level: "Warning", code: "DEPENDENCY_MISSING", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Install the required dependency package first." });
        return;
      }
      if (issue.startsWith("DEPENDENCY_VERSION_CONFLICT")) {
        acc.push({ level: "Warning", code: "DEPENDENCY_VERSION_CONFLICT", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Roll back or upgrade the dependency to a matching version." });
        return;
      }
      if (issue.startsWith("CONTRACT_INCOMPATIBLE")) {
        acc.push({ level: "Error", code: "CONTRACT_INCOMPATIBLE", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Switch to a package built for the supported contract version." });
        return;
      }
      if (issue.startsWith("SLOT_DEFAULT_MISSING")) {
        acc.push({ level: "Warning", code: "SLOT_DEFAULT_MISSING", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Provide a fallback asset or bind the slot before using this package." });
        return;
      }
      if (issue.startsWith("ABILITY_ACTOR_COMPAT_MISSING")) {
        acc.push({ level: "Error", code: "ABILITY_ACTOR_COMPAT_MISSING", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Declare supported actor types before installing this ability package." });
        return;
      }
      if (issue.startsWith("ABILITY_ACTOR_INCOMPATIBLE")) {
        acc.push({ level: "Error", code: "ABILITY_ACTOR_INCOMPATIBLE", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Use a compatible actor type or switch to an ability package that supports the current actor." });
        return;
      }
      if (issue.startsWith("ABILITY_INPUT_MAPPING_MISSING")) {
        acc.push({ level: "Warning", code: "ABILITY_INPUT_MAPPING_MISSING", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Add an input-map slot fallback before installing this ability package." });
        return;
      }
      if (issue.startsWith("ABILITY_ANIMATION_MISSING")) {
        acc.push({ level: "Warning", code: "ABILITY_ANIMATION_MISSING", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Add an animation pack fallback before installing this ability package." });
        return;
      }
      if (issue.startsWith("ABILITY_PACKAGE_MISSING")) {
        acc.push({ level: "Error", code: "ABILITY_PACKAGE_MISSING", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Install the required ability package or remove the ability grant from this brick." });
        return;
      }
      if (issue.startsWith("ENEMY_HEALTH_MISSING")) {
        acc.push({ level: "Warning", code: "ENEMY_HEALTH_MISSING", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Add a base health property before using this enemy template." });
        return;
      }
      if (issue.startsWith("ENEMY_PATROL_ROUTE_MISSING")) {
        acc.push({ level: "Warning", code: "ENEMY_PATROL_ROUTE_MISSING", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Declare a patrolRoute property so the template can be reused across scenes." });
        return;
      }
      if (issue.startsWith("ENEMY_ATTACK_STYLE_MISSING")) {
        acc.push({ level: "Warning", code: "ENEMY_ATTACK_STYLE_MISSING", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Declare an attackStyle property so the default combat behavior can be tuned." });
        return;
      }
      if (issue.startsWith("ENEMY_MESH_MISSING")) {
        acc.push({ level: "Warning", code: "ENEMY_MESH_MISSING", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Provide a mesh fallback before installing this enemy package." });
        return;
      }
      if (issue.startsWith("ENEMY_ATTACK_ANIMATION_MISSING")) {
        acc.push({ level: "Warning", code: "ENEMY_ATTACK_ANIMATION_MISSING", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Provide an attack animation fallback before installing this enemy package." });
        return;
      }
      if (issue.startsWith("COMPOSITE_CHILD_MISSING")) {
        acc.push({ level: "Error", code: "COMPOSITE_CHILD_MISSING", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Install the missing child brick package before using this composite." });
        return;
      }
      if (issue.startsWith("MANIFEST_METADATA_MISSING")) {
        acc.push({ level: "Warning", code: "MANIFEST_METADATA_MISSING", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Import a package with embedded manifest details for direct use." });
        return;
      }
      acc.push({ level: "Warning", code: "IMPORT_REVIEW", brickId: entry.id, brickName: entry.name, detail: issue });
    });
    return acc;
  }, []);
