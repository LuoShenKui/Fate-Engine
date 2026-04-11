import type { BrickPort, BrickPropertySchema, BrickSlotSchema, BrickWhiteboxMetadata } from "../domain/brick";
import type { CompositeChildSpec, CompositeEdgeSpec, CompositeParamGroup, BrickCatalogEntry } from "./app-types";
import { DEFAULT_ACTOR_TYPE, EDITOR_ENGINE_VERSION, IMPORTED_BRICKS_STORAGE_KEY, IMPORTED_BRICK_HISTORY_STORAGE_KEY } from "./app-constants";
import { inferRuntimeKindFromPackageId, normalizeDependencyVersion, parseDependencyList, parseDependencyRequirement, toCatalogEntry, versionMatches } from "./app-catalog";
import { parseComposeHints, toComposeHintManifestFields } from "./compose-hints";
import { parseBrickTags } from "./brick-tags";

const emptyWhiteboxMetadata = (): BrickWhiteboxMetadata => ({
  style: "neutral",
  artStyle: "prototype",
  semanticTags: [],
  notes: "",
  realWorldScale: "1 unit = 1 meter",
  actorClass: "generic",
  interactionIntent: "general",
  unitSystem: "metric",
});

export const parseWhiteboxMetadata = (value: unknown): BrickWhiteboxMetadata => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return emptyWhiteboxMetadata();
  }
  const record = value as Record<string, unknown>;
  const semanticTagsRaw = record.semanticTags ?? record.semantic_tags;
  return {
    style: typeof record.style === "string" ? record.style : "neutral",
    artStyle: typeof record.artStyle === "string" ? record.artStyle : typeof record.art_style === "string" ? record.art_style : "prototype",
    semanticTags: Array.isArray(semanticTagsRaw)
      ? semanticTagsRaw.filter((item): item is string => typeof item === "string")
      : [],
    notes: typeof record.notes === "string" ? record.notes : "",
    realWorldScale: typeof record.realWorldScale === "string" ? record.realWorldScale : typeof record.real_world_scale === "string" ? record.real_world_scale : "1 unit = 1 meter",
    actorClass: typeof record.actorClass === "string" ? record.actorClass : typeof record.actor_class === "string" ? record.actor_class : "generic",
    interactionIntent: typeof record.interactionIntent === "string" ? record.interactionIntent : typeof record.interaction_intent === "string" ? record.interaction_intent : "general",
    unitSystem: record.unitSystem === "imperial" || record.unit_system === "imperial" ? "imperial" : "metric",
  };
};

export const parseBrickProperties = (value: unknown): BrickPropertySchema[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null).map((item) => {
    const type = item.type === "boolean" || item.type === "number" || item.type === "string" ? item.type : "string";
    const rawDefaultValue = item.defaultValue;
    let defaultValue: boolean | number | string = "";
    if (type === "boolean") defaultValue = Boolean(rawDefaultValue);
    else if (type === "number") defaultValue = typeof rawDefaultValue === "number" ? rawDefaultValue : Number(rawDefaultValue ?? 0);
    else defaultValue = typeof rawDefaultValue === "string" ? rawDefaultValue : String(rawDefaultValue ?? "");
    return {
      key: typeof item.key === "string" ? item.key : `property-${Math.random().toString(36).slice(2, 8)}`,
      label: typeof item.label === "string" ? item.label : typeof item.key === "string" ? item.key : "Property",
      type,
      defaultValue,
      description: typeof item.description === "string" ? item.description : "",
    };
  });
};

export const parseBrickSlots = (value: unknown): BrickSlotSchema[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null).map((item) => ({
    slotId: typeof item.slotId === "string" ? item.slotId : typeof item.id === "string" ? item.id : `slot-${Math.random().toString(36).slice(2, 8)}`,
    label: typeof item.label === "string" ? item.label : typeof item.slotId === "string" ? item.slotId : "Slot",
    optional: item.optional === true,
    fallbackAssetRef: typeof item.fallbackAssetRef === "string" ? item.fallbackAssetRef : undefined,
    slotType:
      item.slotType === "mesh" ||
      item.slotType === "material" ||
      item.slotType === "anim" ||
      item.slotType === "prefab" ||
      item.slotType === "audio" ||
      item.slotType === "vfx" ||
      item.slotType === "script_ref" ||
      item.slotType === "volume"
        ? item.slotType
        : item.slot_type === "mesh" ||
            item.slot_type === "material" ||
            item.slot_type === "anim" ||
            item.slot_type === "prefab" ||
            item.slot_type === "audio" ||
            item.slot_type === "vfx" ||
            item.slot_type === "script_ref" ||
            item.slot_type === "volume"
          ? item.slot_type
          : undefined,
  }));
};

export const parseBrickPorts = (value: unknown): BrickPort[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null).map((item) => ({
    id: typeof item.id === "string" ? item.id : `port-${Math.random().toString(36).slice(2, 8)}`,
    name: typeof item.name === "string" ? item.name : typeof item.id === "string" ? item.id : "Port",
    direction: item.direction === "input" ? "input" : "output",
    dataType: typeof item.dataType === "string" ? item.dataType : "event",
    description: typeof item.description === "string" ? item.description : "",
  }));
};

export const parseCompositeChildren = (value: unknown): CompositeChildSpec[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null).map((item, index) => {
    const positionRaw = Array.isArray(item.position) ? item.position : [];
    return {
      id: typeof item.id === "string" ? item.id : `child-${index + 1}`,
      type: typeof item.type === "string" ? item.type : "generic",
      position: [typeof positionRaw[0] === "number" ? positionRaw[0] : index * 1.5, typeof positionRaw[1] === "number" ? positionRaw[1] : 0, typeof positionRaw[2] === "number" ? positionRaw[2] : 1.5],
    };
  });
};

export const parseCompositeEdges = (value: unknown): CompositeEdgeSpec[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null).map((item) => ({
    from: typeof item.from === "string" ? item.from : "",
    to: typeof item.to === "string" ? item.to : "",
  })).filter((edge) => edge.from.length > 0 && edge.to.length > 0);
};

export const parseCompositeParamGroups = (value: unknown): CompositeParamGroup[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null).map((item, index) => {
    const rawValues = typeof item.values === "object" && item.values !== null && !Array.isArray(item.values) ? (item.values as Record<string, unknown>) : {};
    const values = Object.entries(rawValues).reduce<Record<string, string | number | boolean>>((acc, [key, rawValue]) => {
      if (typeof rawValue === "string" || typeof rawValue === "number" || typeof rawValue === "boolean") acc[key] = rawValue;
      return acc;
    }, {});
    return {
      key: typeof item.key === "string" ? item.key : `group-${index + 1}`,
      label: typeof item.label === "string" ? item.label : typeof item.key === "string" ? item.key : `Group ${index + 1}`,
      values,
    };
  });
};

export const parseGrantedAbilityPackageIds = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];

const parseAssetDependencies = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];

const parseDefaultAssetBindings = (value: unknown): Array<{ slotId: string; resourceType: string; assetPackageId: string; resourceId: string }> =>
  Array.isArray(value)
    ? value
        .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
        .map((item) => ({
          slotId: typeof item.slot_id === "string" ? item.slot_id : typeof item.slotId === "string" ? item.slotId : "",
          resourceType: typeof item.resource_type === "string" ? item.resource_type : typeof item.resourceType === "string" ? item.resourceType : "",
          assetPackageId: typeof item.asset_package_id === "string" ? item.asset_package_id : typeof item.assetPackageId === "string" ? item.assetPackageId : "",
          resourceId: typeof item.resource_id === "string" ? item.resource_id : typeof item.resourceId === "string" ? item.resourceId : "",
        }))
        .filter((item) => item.slotId.length > 0 && item.resourceType.length > 0 && item.assetPackageId.length > 0 && item.resourceId.length > 0)
    : [];

const parseAssetResources = (value: unknown): unknown[] =>
  Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null) : [];

export const toImportedBrickFromManifest = (raw: unknown): BrickCatalogEntry | null => {
  if (typeof raw !== "object" || raw === null) return null;
  const manifest = raw as Record<string, unknown>;
  const id = typeof manifest.id === "string" ? manifest.id : null;
  const name = typeof manifest.name === "string" ? manifest.name : typeof manifest.display_name === "string" ? manifest.display_name : id;
  if (id === null || name === null) return null;
  const properties = parseBrickProperties(manifest.properties);
  const slots = parseBrickSlots(manifest.slots);
  const ports = parseBrickPorts(manifest.ports);
  const compositeChildren = parseCompositeChildren(manifest.composite_children);
  const compositeEdges = parseCompositeEdges(manifest.composite_edges);
  const compositeParamGroups = parseCompositeParamGroups(manifest.composite_param_groups);
  const grantedAbilityPackageIds = parseGrantedAbilityPackageIds("granted_ability_packages" in manifest ? manifest.granted_ability_packages : manifest.granted_abilities);
  const packageKind = manifest.package_kind === "logic" || manifest.package_kind === "asset" ? manifest.package_kind : "product";
  const importIssues: string[] = [];
  if (slots.length === 0) importIssues.push("Missing slot definitions");
  if (packageKind !== "asset" && ports.length === 0) importIssues.push("Missing port definitions");
  if (packageKind !== "asset" && properties.length === 0) importIssues.push("No editable parameters declared");
  const dependencies = parseDependencyList(manifest.dependencies);
  const compat = typeof manifest.compat === "string" ? manifest.compat : typeof manifest.engine_compat === "string" ? manifest.engine_compat : "editor>=0.1.0";
  const contractVersion = typeof manifest.contract_version === "string" ? manifest.contract_version : "0.1";
  const supportedActorTypes = Array.isArray(manifest.supported_actor_types) ? manifest.supported_actor_types.filter((item): item is string => typeof item === "string") : [];
  const runtimeKindRaw = typeof manifest.runtime_kind === "string" ? manifest.runtime_kind : typeof manifest.extends === "string" ? manifest.extends : id;
  const runtimeKind: BrickCatalogEntry["runtimeKind"] = runtimeKindRaw === "door" || runtimeKindRaw === "switch" || runtimeKindRaw === "ladder" || runtimeKindRaw === "trigger-zone" || runtimeKindRaw === "enemy" ? runtimeKindRaw : "generic";
  const whiteboxMetadata = parseWhiteboxMetadata({
    style: manifest.style,
    art_style: manifest.art_style,
    semantic_tags: manifest.semantic_tags,
    notes: manifest.notes,
    real_world_scale: manifest.real_world_scale,
    actor_class: manifest.actor_class,
    interaction_intent: manifest.interaction_intent,
    unit_system: manifest.unit_system,
  });
  const composeHints = parseComposeHints(manifest, id);
  return toCatalogEntry({ id, name, summary: typeof manifest.summary === "string" ? manifest.summary : "Imported brick package", properties, slots, ports }, "imported", {
    packageId: typeof manifest.package_id === "string" ? manifest.package_id : `user.${id}`,
    version: typeof manifest.version === "string" ? manifest.version : "0.1.0",
    license: typeof manifest.license === "string" ? manifest.license : "Custom",
    dependencies,
    compat,
    contractVersion,
    packageKind,
    supportedActorTypes,
    category: typeof manifest.category === "string" ? manifest.category : "custom",
    installState: importIssues.length === 0 ? "ready" : "incomplete",
    importIssues,
    runtimeKind,
    compositeChildren,
    compositeEdges,
    compositeParamGroups,
    grantedAbilityPackageIds,
    assetDependencies: parseAssetDependencies(manifest.asset_dependencies),
    defaultAssetBindings: parseDefaultAssetBindings(manifest.default_asset_bindings),
    resources: parseAssetResources(manifest.resources),
    tags: parseBrickTags(manifest.tags ?? manifest.metadata),
    whiteboxMetadata,
    composeHints,
  });
};

export const toImportedBrickFromPackageRecord = (raw: unknown): BrickCatalogEntry | null => {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  if ("manifest" in record) return toImportedBrickFromManifest(record.manifest);
  const packageId = typeof record.package === "string" ? record.package : typeof record.id === "string" ? record.id : null;
  if (packageId === null) return null;
  const version = typeof record.version === "string" ? record.version : "0.1.0";
  const shortId = packageId.split(".").pop() ?? packageId;
  return toCatalogEntry({ id: shortId, name: typeof record.name === "string" ? record.name : shortId, summary: typeof record.summary === "string" ? record.summary : "Imported from package list", properties: parseBrickProperties(record.properties), slots: parseBrickSlots(record.slots), ports: parseBrickPorts(record.ports) }, "imported", {
    packageId,
    version,
    license: typeof record.license === "string" ? record.license : "Unknown",
    dependencies: parseDependencyList(record.dependencies),
    compat: typeof record.compat === "string" ? record.compat : "editor>=0.1.0",
    contractVersion: typeof record.contract_version === "string" ? record.contract_version : "0.1",
    packageKind: record.package_kind === "logic" || record.package_kind === "asset" ? record.package_kind : "product",
    supportedActorTypes: Array.isArray(record.supported_actor_types) ? record.supported_actor_types.filter((item): item is string => typeof item === "string") : [],
    category: typeof record.category === "string" ? record.category : "lockfile",
    installState: "incomplete",
    importIssues: ["MANIFEST_METADATA_MISSING: package entry has no embedded manifest"],
    compositeChildren: parseCompositeChildren(record.composite_children),
    compositeEdges: parseCompositeEdges(record.composite_edges),
    compositeParamGroups: parseCompositeParamGroups(record.composite_param_groups),
    grantedAbilityPackageIds: parseGrantedAbilityPackageIds(record.granted_ability_packages),
    assetDependencies: parseAssetDependencies(record.asset_dependencies),
    defaultAssetBindings: parseDefaultAssetBindings(record.default_asset_bindings),
    resources: parseAssetResources(record.resources),
    tags: parseBrickTags(record.tags ?? record.metadata),
    whiteboxMetadata: parseWhiteboxMetadata(record.whiteboxMetadata ?? record.whitebox_metadata),
    composeHints: parseComposeHints(record, shortId),
  });
};

export const detectImportSourceType = (json: string): "manifest" | "packages" | "lockfile" | "package_lock" | "artifact" | "unknown" => {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (typeof parsed !== "object" || parsed === null) return "unknown";
    if ("artifact" in (parsed as Record<string, unknown>) && "manifest" in (parsed as Record<string, unknown>)) return "artifact";
    if ("lockfile" in (parsed as Record<string, unknown>)) return "lockfile";
    if ("package_lock" in (parsed as Record<string, unknown>)) return "package_lock";
    if ("packages" in (parsed as Record<string, unknown>)) return "packages";
    if ("manifest" in (parsed as Record<string, unknown>) || "id" in (parsed as Record<string, unknown>)) return "manifest";
    return "unknown";
  } catch {
    return "unknown";
  }
};

export const exportInstalledBrickLockfile = (entries: BrickCatalogEntry[]): string =>
  JSON.stringify({
    lockfile: {
      packages: entries.map((entry) => ({
        package: entry.packageId,
        version: entry.version,
        license: entry.license,
        compat: entry.compat,
        dependencies: entry.dependencies,
        manifest: {
          id: entry.id,
          name: entry.name,
          summary: entry.summary,
          version: entry.version,
          license: entry.license,
          compat: entry.compat,
          category: entry.category,
          package_kind: entry.packageKind,
          runtime_kind: entry.runtimeKind,
          supported_actor_types: entry.supportedActorTypes,
          granted_ability_packages: entry.grantedAbilityPackageIds,
          asset_dependencies: entry.assetDependencies,
          default_asset_bindings: entry.defaultAssetBindings.map((binding) => ({ slot_id: binding.slotId, resource_type: binding.resourceType, asset_package_id: binding.assetPackageId, resource_id: binding.resourceId })),
          resources: entry.resources,
          dependencies: entry.dependencies,
          properties: entry.properties,
          slots: entry.slots.map((slot) => ({
            slotId: slot.slotId,
            label: slot.label,
            optional: slot.optional,
            fallbackAssetRef: slot.fallbackAssetRef,
            slot_type: slot.slotType,
          })),
          ports: entry.ports,
          composite_children: entry.compositeChildren,
          composite_edges: entry.compositeEdges,
          composite_param_groups: entry.compositeParamGroups,
          tags: entry.tags,
          style: entry.whiteboxMetadata.style,
          art_style: entry.whiteboxMetadata.artStyle,
          semantic_tags: entry.whiteboxMetadata.semanticTags,
          notes: entry.whiteboxMetadata.notes,
          real_world_scale: entry.whiteboxMetadata.realWorldScale,
          actor_class: entry.whiteboxMetadata.actorClass,
          interaction_intent: entry.whiteboxMetadata.interactionIntent,
          unit_system: entry.whiteboxMetadata.unitSystem,
          ...toComposeHintManifestFields(entry.composeHints),
        },
      })),
    },
    package_lock: { packages: entries.reduce<Record<string, string>>((acc, entry) => ({ ...acc, [entry.packageId]: entry.version }), {}) },
  }, null, 2);

export const parseImportedBrickBatch = (json: string): BrickCatalogEntry[] | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  const raw = typeof parsed === "object" && parsed !== null && "manifest" in parsed ? (parsed as { manifest: unknown }).manifest : parsed;
  const direct = toImportedBrickFromManifest(raw);
  if (direct !== null) return [direct];
  if (typeof parsed === "object" && parsed !== null && "artifact" in parsed && "manifest" in parsed) return [toImportedBrickFromManifest((parsed as { manifest: unknown }).manifest)!];
  if (typeof parsed === "object" && parsed !== null && "lockfile" in parsed) {
    const packages = ((parsed as { lockfile: { packages?: unknown } }).lockfile?.packages);
    if (Array.isArray(packages)) {
      const imported = packages.map((item) => toImportedBrickFromPackageRecord(item)).filter((item): item is BrickCatalogEntry => item !== null);
      return imported.length > 0 ? imported : null;
    }
  }
  if (typeof parsed === "object" && parsed !== null && "package_lock" in parsed) {
    const packageMap = (((parsed as { package_lock: { packages?: unknown } }).package_lock?.packages));
    if (typeof packageMap === "object" && packageMap !== null && !Array.isArray(packageMap)) {
      const imported = Object.entries(packageMap as Record<string, unknown>).map(([packageId, version]) => toImportedBrickFromPackageRecord({ package: packageId, version: typeof version === "string" ? version : "0.1.0" })).filter((item): item is BrickCatalogEntry => item !== null);
      return imported.length > 0 ? imported : null;
    }
  }
  if (typeof parsed === "object" && parsed !== null && "packages" in parsed) {
    const packages = (parsed as { packages: unknown }).packages;
    if (!Array.isArray(packages)) return null;
    const imported = packages.map((item) => toImportedBrickFromPackageRecord(item) ?? toImportedBrickFromManifest(item)).filter((item): item is BrickCatalogEntry => item !== null);
    return imported.length > 0 ? imported : null;
  }
  return null;
};

export const loadImportedBricksFromStorage = (): BrickCatalogEntry[] => {
  try {
    const raw = window.localStorage.getItem(IMPORTED_BRICKS_STORAGE_KEY);
    if (raw === null) return [];
    return deserializeInstalledBricks(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
};

export const loadImportedBrickHistoryFromStorage = (): Record<string, BrickCatalogEntry[]> => {
  try {
    const raw = window.localStorage.getItem(IMPORTED_BRICK_HISTORY_STORAGE_KEY);
    if (raw === null) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    return Object.entries(parsed as Record<string, unknown>).reduce<Record<string, BrickCatalogEntry[]>>((acc, [brickId, entries]) => {
      acc[brickId] = deserializeInstalledBricks(entries);
      return acc;
    }, {});
  } catch {
    return {};
  }
};

export const assessImportedEntries = (entries: BrickCatalogEntry[], installedEntries: BrickCatalogEntry[]): BrickCatalogEntry[] => {
  const availableEntries = [...installedEntries.filter((entry) => !entries.some((candidate) => candidate.id === entry.id)), ...entries];
  return entries.map((entry) => {
    const nextIssues = [...entry.importIssues];
    const availableAssetPackages = new Map(availableEntries.filter((candidate) => candidate.packageKind === "asset").map((candidate) => [candidate.packageId, candidate] as const));
    if (!versionMatches(EDITOR_ENGINE_VERSION, entry.compat)) nextIssues.push(`ENGINE_INCOMPATIBLE: required ${entry.compat}, current ${EDITOR_ENGINE_VERSION}`);
    if (entry.contractVersion !== "0.1") nextIssues.push(`CONTRACT_INCOMPATIBLE: required ${entry.contractVersion}, supported 0.1`);
    entry.slots.forEach((slot) => {
      if (!slot.optional && (slot.fallbackAssetRef ?? "").trim().length === 0) nextIssues.push(`SLOT_DEFAULT_MISSING: ${slot.slotId} has no fallback`);
    });
    if (entry.category === "ability" && entry.supportedActorTypes.length === 0) nextIssues.push("ABILITY_ACTOR_COMPAT_MISSING: supported_actor_types not declared");
    if (entry.category === "ability" && entry.supportedActorTypes.length > 0 && !entry.supportedActorTypes.includes(DEFAULT_ACTOR_TYPE)) nextIssues.push(`ABILITY_ACTOR_INCOMPATIBLE: actor_type=${DEFAULT_ACTOR_TYPE}`);
    if (entry.category === "ability") {
      const inputMapSlot = entry.slots.find((slot) => slot.slotId === "input-map");
      const animationSlot = entry.slots.find((slot) => slot.slotId === "anim-pack");
      if (inputMapSlot === undefined || (inputMapSlot.fallbackAssetRef ?? "").trim().length === 0) nextIssues.push("ABILITY_INPUT_MAPPING_MISSING: input-map fallback not declared");
      if (animationSlot === undefined || (animationSlot.fallbackAssetRef ?? "").trim().length === 0) nextIssues.push("ABILITY_ANIMATION_MISSING: anim-pack fallback not declared");
    }
    if (entry.category === "enemy") {
      if (entry.properties.find((property) => property.key === "health") === undefined) nextIssues.push("ENEMY_HEALTH_MISSING: health property not declared");
      if (entry.properties.find((property) => property.key === "patrolRoute") === undefined) nextIssues.push("ENEMY_PATROL_ROUTE_MISSING: patrolRoute property not declared");
      if (entry.properties.find((property) => property.key === "attackStyle") === undefined) nextIssues.push("ENEMY_ATTACK_STYLE_MISSING: attackStyle property not declared");
      const meshSlot = entry.slots.find((slot) => slot.slotId === "mesh");
      const attackAnimSlot = entry.slots.find((slot) => slot.slotId === "anim-attack");
      if (meshSlot === undefined || (meshSlot.fallbackAssetRef ?? "").trim().length === 0) nextIssues.push("ENEMY_MESH_MISSING: mesh fallback not declared");
      if (attackAnimSlot === undefined || (attackAnimSlot.fallbackAssetRef ?? "").trim().length === 0) nextIssues.push("ENEMY_ATTACK_ANIMATION_MISSING: anim-attack fallback not declared");
    }
    if (entry.category === "composite") {
      entry.compositeChildren.forEach((child) => {
        if (availableEntries.find((candidate) => candidate.id === child.type || candidate.packageId === child.type) === undefined) nextIssues.push(`COMPOSITE_CHILD_MISSING: ${child.type}`);
      });
    }
    entry.grantedAbilityPackageIds.forEach((abilityPackageId) => {
      const abilityEntry = availableEntries.find((candidate) => candidate.packageId === abilityPackageId || candidate.id === abilityPackageId);
      if (abilityEntry === undefined) nextIssues.push(`ABILITY_PACKAGE_MISSING: ${abilityPackageId}`);
      else if (abilityEntry.category !== "ability") nextIssues.push(`ABILITY_PACKAGE_MISSING: ${abilityPackageId} is not an ability package`);
      else if (abilityEntry.supportedActorTypes.length > 0 && !abilityEntry.supportedActorTypes.includes(DEFAULT_ACTOR_TYPE)) nextIssues.push(`ABILITY_ACTOR_INCOMPATIBLE: ${abilityPackageId} does not support ${DEFAULT_ACTOR_TYPE}`);
    });
    entry.dependencies.forEach((dependency) => {
      const parsed = parseDependencyRequirement(dependency);
      const installed = availableEntries.find((candidate) => candidate.packageId === parsed.id || candidate.id === parsed.id);
      if (installed === undefined) nextIssues.push(`DEPENDENCY_MISSING: ${parsed.id}${parsed.requirement !== null ? ` (${parsed.requirement})` : ""}`);
      else if (parsed.requirement !== null && !versionMatches(installed.version, parsed.requirement)) nextIssues.push(`DEPENDENCY_VERSION_CONFLICT: ${parsed.id} requires ${parsed.requirement}, current ${installed.version}`);
    });
    entry.assetDependencies.forEach((assetPackageId) => {
      if (!availableAssetPackages.has(assetPackageId)) nextIssues.push(`ASSET_PACKAGE_MISSING: ${assetPackageId}`);
    });
    entry.defaultAssetBindings.forEach((binding) => {
      const slot = entry.slots.find((candidate) => candidate.slotId === binding.slotId);
      if (slot === undefined) {
        nextIssues.push(`ASSET_SLOT_MISSING: ${binding.slotId}`);
        return;
      }
      if (slot.slotId !== binding.slotId) return;
      const assetPackage = availableAssetPackages.get(binding.assetPackageId);
      if (assetPackage === undefined) return;
      const resources = parseAssetResources(assetPackage.resources);
      const resource = resources.find((candidate) => typeof candidate === "object" && candidate !== null && (candidate as Record<string, unknown>).id === binding.resourceId) as Record<string, unknown> | undefined;
      if (resource === undefined) {
        nextIssues.push(`ASSET_RESOURCE_MISSING: ${binding.assetPackageId}/${binding.resourceId}`);
        return;
      }
      if (resource.resource_type !== binding.resourceType) nextIssues.push(`ASSET_RESOURCE_TYPE_MISMATCH: ${binding.slotId} expects ${binding.resourceType}, got ${String(resource.resource_type ?? "")}`);
    });
    const hasBlockingIssue = nextIssues.some((issue) => issue.startsWith("ENGINE_INCOMPATIBLE") || issue.startsWith("CONTRACT_INCOMPATIBLE") || issue.startsWith("ABILITY_ACTOR_COMPAT_MISSING") || issue.startsWith("ABILITY_ACTOR_INCOMPATIBLE") || issue.startsWith("ABILITY_PACKAGE_MISSING") || issue.startsWith("COMPOSITE_CHILD_MISSING") || issue.startsWith("ASSET_PACKAGE_MISSING") || issue.startsWith("ASSET_RESOURCE_MISSING"));
    return { ...entry, installState: nextIssues.length === 0 ? "ready" : hasBlockingIssue ? "blocked" : "incomplete", importIssues: nextIssues };
  });
};

export const extractDependencyIdFromIssue = (detail: string): string | null => /DEPENDENCY_(?:MISSING|VERSION_CONFLICT):\s*([A-Za-z0-9._-]+)/.exec(detail)?.[1] ?? null;

export const serializeInstalledBricks = (entries: BrickCatalogEntry[]): Record<string, unknown>[] =>
  entries.map((entry) => ({ id: entry.id, name: entry.name, summary: entry.summary, packageId: entry.packageId, version: entry.version, license: entry.license, dependencies: entry.dependencies, compat: entry.compat, contractVersion: entry.contractVersion, packageKind: entry.packageKind, supportedActorTypes: entry.supportedActorTypes, category: entry.category, source: entry.source, installState: entry.installState, importIssues: entry.importIssues, runtimeKind: entry.runtimeKind, properties: entry.properties, slots: entry.slots, ports: entry.ports, compositeChildren: entry.compositeChildren, compositeEdges: entry.compositeEdges, compositeParamGroups: entry.compositeParamGroups, grantedAbilityPackageIds: entry.grantedAbilityPackageIds, assetDependencies: entry.assetDependencies, defaultAssetBindings: entry.defaultAssetBindings, resources: entry.resources, tags: entry.tags, whiteboxMetadata: entry.whiteboxMetadata, composeHints: entry.composeHints }));

export const deserializeInstalledBricks = (value: unknown): BrickCatalogEntry[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null).map((record) => toCatalogEntry({ id: typeof record.id === "string" ? record.id : "imported-brick", name: typeof record.name === "string" ? record.name : "Imported Brick", summary: typeof record.summary === "string" ? record.summary : "Imported brick package", properties: parseBrickProperties(record.properties), slots: parseBrickSlots(record.slots), ports: parseBrickPorts(record.ports) }, "imported", {
    packageId: typeof record.packageId === "string" ? record.packageId : "user.imported",
    version: typeof record.version === "string" ? record.version : "0.1.0",
    license: typeof record.license === "string" ? record.license : "Custom",
    dependencies: Array.isArray(record.dependencies) ? record.dependencies.filter((dep): dep is string => typeof dep === "string") : [],
    compat: typeof record.compat === "string" ? record.compat : "editor>=0.1.0",
    contractVersion: typeof record.contractVersion === "string" ? record.contractVersion : "0.1",
    packageKind: record.packageKind === "logic" || record.packageKind === "asset" ? record.packageKind : "product",
    category: typeof record.category === "string" ? record.category : "custom",
    installState: record.installState === "blocked" ? "blocked" : record.installState === "incomplete" ? "incomplete" : "ready",
    importIssues: Array.isArray(record.importIssues) ? record.importIssues.filter((issue): issue is string => typeof issue === "string") : [],
    runtimeKind: record.runtimeKind === "door" || record.runtimeKind === "switch" || record.runtimeKind === "ladder" || record.runtimeKind === "trigger-zone" || record.runtimeKind === "enemy" ? record.runtimeKind : "generic",
    supportedActorTypes: Array.isArray(record.supportedActorTypes) ? record.supportedActorTypes.filter((item): item is string => typeof item === "string") : [],
    compositeChildren: parseCompositeChildren(record.compositeChildren),
    compositeEdges: parseCompositeEdges(record.compositeEdges),
    compositeParamGroups: parseCompositeParamGroups(record.compositeParamGroups),
    grantedAbilityPackageIds: parseGrantedAbilityPackageIds(record.grantedAbilityPackageIds),
    assetDependencies: parseAssetDependencies(record.assetDependencies),
    defaultAssetBindings: parseDefaultAssetBindings(record.defaultAssetBindings),
    resources: parseAssetResources(record.resources),
    tags: parseBrickTags(record.tags),
    whiteboxMetadata: parseWhiteboxMetadata(record.whiteboxMetadata ?? record.whitebox_metadata),
    composeHints: parseComposeHints(record, typeof record.id === "string" ? record.id : "imported-brick"),
  }));
};

export const createDependencyCandidateEntry = (dependencyId: string, requirement: string | null, catalog: BrickCatalogEntry[]): BrickCatalogEntry | null => {
  const runtimeKind = inferRuntimeKindFromPackageId(dependencyId);
  if (runtimeKind === "generic") return null;
  const template = catalog.find((entry) => entry.source === "builtin" && entry.runtimeKind === runtimeKind);
  if (template === undefined) return null;
  const shortId = dependencyId.split(".").pop() ?? dependencyId;
  return toCatalogEntry({ id: shortId, name: `${template.name} Dependency`, summary: `Auto-generated dependency candidate for ${dependencyId}.`, properties: template.properties, slots: template.slots, ports: template.ports }, "imported", {
    packageId: dependencyId,
    version: normalizeDependencyVersion(requirement, template.version),
    license: template.license,
    dependencies: [],
    packageKind: "product",
    compat: template.compat,
    category: "dependency-candidate",
    installState: "ready",
    importIssues: [],
    runtimeKind,
    assetDependencies: [],
    defaultAssetBindings: [],
    resources: [],
    tags: template.tags,
  });
};
