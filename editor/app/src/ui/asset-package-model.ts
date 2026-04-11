import type { AssetRegistryItem, BrickCatalogEntry } from "./app-types";

const RESOURCE_TYPES = new Set(["mesh", "material", "anim", "prefab", "audio", "vfx", "script_ref"]);
const isResourceType = (value: unknown): value is AssetRegistryItem["resourceType"] => typeof value === "string" && RESOURCE_TYPES.has(value);

type RawAssetResource = Record<string, unknown>;

const toArrayOfStrings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];

export const parseAssetResourceRecord = (
  value: unknown,
  packageId: string,
  packageVersion: string,
  fallbackLicense: string,
): AssetRegistryItem | null => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const record = value as RawAssetResource;
  const resourceId = typeof record.id === "string" ? record.id : null;
  const assetPath = typeof record.path === "string" ? record.path : null;
  const resourceType = isResourceType(record.resource_type) ? record.resource_type : null;
  if (resourceId === null || assetPath === null || resourceType === null) {
    return null;
  }
  return {
    id: `${packageId}:${resourceId}`,
    name: typeof record.name === "string" ? record.name : resourceId,
    assetRef: `assetpkg://${packageId}/${resourceId}`,
    slotHints: toArrayOfStrings(record.slot_hints),
    packageId,
    packageVersion,
    resourceId,
    resourceType,
    unityTargetType: typeof record.unity_target_type === "string" ? record.unity_target_type : "Object",
    licenseSource: typeof record.license_source === "string" ? record.license_source : fallbackLicense,
    localPath: assetPath,
    sourcePackageKind: "asset",
    importStatus: "formal",
  };
};

export const buildAssetRegistryFromCatalog = (catalogEntries: BrickCatalogEntry[], localItems: AssetRegistryItem[]): AssetRegistryItem[] => {
  const packageItems = catalogEntries.flatMap((entry) =>
    entry.packageKind === "asset"
      ? entry.resources
          .map((resource) => parseAssetResourceRecord(resource, entry.packageId, entry.version, entry.license))
          .filter((item): item is AssetRegistryItem => item !== null)
      : [],
  );

  const merged = [...packageItems, ...localItems];
  const deduped = merged.reduce<Map<string, AssetRegistryItem>>((acc, item) => {
    acc.set(item.assetRef, item);
    return acc;
  }, new Map());
  return [...deduped.values()];
};

export const getAssetBindingIssues = (
  slotId: string,
  expectedResourceType: string,
  boundAsset: AssetRegistryItem | undefined,
): string[] => {
  if (boundAsset === undefined) {
    return [`ASSET_BINDING_MISSING: ${slotId} requires ${expectedResourceType}`];
  }
  if (boundAsset.resourceType !== expectedResourceType) {
    return [`ASSET_RESOURCE_TYPE_MISMATCH: ${slotId} expects ${expectedResourceType}, got ${boundAsset.resourceType}`];
  }
  if ((boundAsset.licenseSource ?? "").trim().length === 0) {
    return [`ASSET_LICENSE_MISSING: ${boundAsset.assetRef}`];
  }
  return [];
};
