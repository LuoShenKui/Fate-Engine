import type { AssetLibraryItem } from "../ui/AssetLibraryPanel";
import type { BrickCatalogEntry } from "../ui/app-types";
import type { EditorRecipeV0 } from "./recipe";

export type UnityAssetBinding = {
  binding_id: string;
  node_id: string;
  slot_id: string;
  asset_ref: string;
  resource_type: AssetLibraryItem["resourceType"];
  unity_target_type: string;
  source_package_id: string;
  source_package_version: string;
  source_resource_id: string;
  binding_kind: "formal" | "fallback" | "local";
  unity_target_path: string;
  required: boolean;
  notes: string;
  issues: string[];
};

export type UnityGeneratedObjectRecord = {
  node_id: string;
  brick_id: string;
  scriptable_object_path: string;
  prefab_variant_path: string;
  baker_input: string;
};

export type UnityAuditRecord = {
  package_id: string;
  version: string;
  license: string;
  reason: string;
  notes: string;
  alternatives: string[];
};

export type UnityExportManifest = {
  version: "0";
  export_kind: "unity_whitebox";
  host: "unity";
  runtime_stack: "dots-ecs";
  recipe: EditorRecipeV0;
  asset_bindings: UnityAssetBinding[];
  generated_object_map: UnityGeneratedObjectRecord[];
  audit: {
    packages: UnityAuditRecord[];
    generated_from_seed: number;
  };
};

const toNodeObject = (value: unknown): Record<string, unknown> => (typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {});
const getNodeId = (node: unknown, index: number): string => {
  const nodeObject = toNodeObject(node);
  return typeof nodeObject.id === "string" ? nodeObject.id : `node-${index + 1}`;
};

const getNodeBrickId = (node: unknown, catalogEntries: BrickCatalogEntry[], index: number): string => {
  const nodeObject = toNodeObject(node);
  const nodeType = typeof nodeObject.type === "string" ? nodeObject.type : "";
  const nodeBrickId = typeof nodeObject.brickId === "string" ? nodeObject.brickId : "";
  if (nodeBrickId !== "") return nodeBrickId;
  const entry = catalogEntries.find((candidate) => candidate.id === nodeType);
  return entry?.packageId ?? (nodeType || `fate.node.${index + 1}`);
};

const buildAssetLookup = (assetItems: AssetLibraryItem[]): Map<string, AssetLibraryItem> =>
  assetItems.reduce<Map<string, AssetLibraryItem>>((acc, item) => {
    acc.set(item.assetRef, item);
    return acc;
  }, new Map());

const inferResourceTypeForSlot = (entry: BrickCatalogEntry, slotId: string): AssetLibraryItem["resourceType"] => {
  const mapped = entry.defaultAssetBindings.find((binding) => binding.slotId === slotId)?.resourceType;
  if (mapped === "mesh" || mapped === "material" || mapped === "anim" || mapped === "prefab" || mapped === "audio" || mapped === "vfx" || mapped === "script_ref") {
    return mapped;
  }
  if (slotId.startsWith("mesh")) return "mesh";
  if (slotId.startsWith("material")) return "material";
  if (slotId.startsWith("anim")) return "anim";
  if (slotId.startsWith("audio")) return "audio";
  if (slotId.startsWith("fx")) return "vfx";
  if (slotId.startsWith("socket") || slotId.startsWith("input")) return "script_ref";
  return "prefab";
};

const buildAssetBindings = (recipe: EditorRecipeV0, catalogEntries: BrickCatalogEntry[], assetItems: AssetLibraryItem[]): UnityAssetBinding[] => {
  const assetLookup = buildAssetLookup(assetItems);
  return recipe.nodes.flatMap((node, index) => {
    const nodeObject = toNodeObject(node);
    const nodeType = typeof nodeObject.type === "string" ? nodeObject.type : "";
    const entry = catalogEntries.find((candidate) => candidate.id === nodeType);
    if (entry === undefined) return [];
    const nodeId = getNodeId(node, index);
    return entry.slots.map((slot) => {
      const assetRef = recipe.slot_bindings[slot.slotId] ?? slot.fallbackAssetRef ?? "";
      const boundAsset = assetLookup.get(assetRef);
      const resourceType = boundAsset?.resourceType ?? inferResourceTypeForSlot(entry, slot.slotId);
      const bindingKind: UnityAssetBinding["binding_kind"] = assetRef.startsWith("asset://local/") ? "local" : boundAsset !== undefined ? "formal" : "fallback";
      const issues: string[] = [];
      if (!slot.optional && assetRef.length === 0) issues.push(`MISSING_REQUIRED_BINDING:${slot.slotId}`);
      if (boundAsset === undefined && bindingKind === "formal") issues.push(`UNKNOWN_ASSET_REF:${assetRef}`);
      if (boundAsset !== undefined && boundAsset.licenseSource.trim().length === 0) issues.push(`MISSING_LICENSE_SOURCE:${assetRef}`);
      return {
        binding_id: `${nodeId}:${slot.slotId}`,
        node_id: nodeId,
        slot_id: slot.slotId,
        asset_ref: assetRef,
        resource_type: resourceType,
        unity_target_type: boundAsset?.unityTargetType ?? "Object",
        source_package_id: boundAsset?.packageId ?? entry.packageId,
        source_package_version: boundAsset?.packageVersion ?? entry.version,
        source_resource_id: boundAsset?.resourceId ?? slot.slotId,
        binding_kind: bindingKind,
        unity_target_path: `Assets/FateGenerated/${nodeId}/${slot.slotId}.asset`,
        required: !slot.optional,
        notes: entry.whiteboxMetadata.notes,
        issues,
      };
    });
  });
};

const buildGeneratedObjectMap = (recipe: EditorRecipeV0, catalogEntries: BrickCatalogEntry[]): UnityGeneratedObjectRecord[] =>
  recipe.nodes.map((node, index) => {
    const nodeObject = toNodeObject(node);
    const nodeType = typeof nodeObject.type === "string" ? nodeObject.type : "generic";
    const nodeId = getNodeId(node, index);
    const entry = catalogEntries.find((candidate) => candidate.id === nodeType);
    const brickId = getNodeBrickId(node, catalogEntries, index);
    const assetName = nodeId.replace(/[^a-zA-Z0-9_-]/g, "_");
    return {
      node_id: nodeId,
      brick_id: brickId,
      scriptable_object_path: `Assets/FateGenerated/Configs/${assetName}Recipe.asset`,
      prefab_variant_path: `Assets/FateGenerated/Prefabs/${assetName}.prefab`,
      baker_input: entry?.whiteboxMetadata.actorClass === "humanoid" ? "HumanoidAuthoringBaker" : "FateBrickAuthoringBaker",
    };
  });

const buildAudit = (recipe: EditorRecipeV0, catalogEntries: BrickCatalogEntry[]): UnityAuditRecord[] =>
  recipe.lockfile.packages.map((pkg) => {
    const entry = catalogEntries.find((candidate) => candidate.packageId === pkg.id || candidate.id === pkg.id);
    return {
      package_id: pkg.id,
      version: pkg.version,
      license: entry?.license ?? "Unknown",
      reason: entry?.whiteboxMetadata.interactionIntent ?? "recipe-dependency",
      notes: entry?.whiteboxMetadata.notes ?? "Generated from external white-box authoring flow.",
      alternatives: entry?.dependencies ?? [],
    };
  });

export const buildUnityExportManifest = (recipe: EditorRecipeV0, catalogEntries: BrickCatalogEntry[], assetItems: AssetLibraryItem[]): UnityExportManifest => ({
  version: "0",
  export_kind: "unity_whitebox",
  host: "unity",
  runtime_stack: "dots-ecs",
  recipe,
  asset_bindings: buildAssetBindings(recipe, catalogEntries, assetItems),
  generated_object_map: buildGeneratedObjectMap(recipe, catalogEntries),
  audit: {
    packages: buildAudit(recipe, catalogEntries),
    generated_from_seed: recipe.seed,
  },
});

export const exportUnityManifest = (recipe: EditorRecipeV0, catalogEntries: BrickCatalogEntry[], assetItems: AssetLibraryItem[]): string =>
  JSON.stringify(buildUnityExportManifest(recipe, catalogEntries, assetItems), null, 2);
