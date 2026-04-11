import type { ComposerAssetItem, ComposerCatalogEntry } from "../composer";
import type { AssetLibraryItem } from "./AssetLibraryPanel";
import type { BrickCatalogEntry } from "./app-types";

export const toComposerCatalogEntries = (catalogEntries: BrickCatalogEntry[]): ComposerCatalogEntry[] =>
  catalogEntries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    packageId: entry.packageId,
    version: entry.version,
    packageKind: entry.packageKind,
    installState: entry.installState,
    summary: entry.summary,
    slots: entry.slots,
    defaultAssetBindings: entry.defaultAssetBindings as ComposerCatalogEntry["defaultAssetBindings"],
    assetDependencies: entry.assetDependencies,
    composeHints: entry.composeHints,
    license: entry.license,
    notes: entry.whiteboxMetadata.notes,
  }));

export const toComposerAssetItems = (assetLibraryItems: AssetLibraryItem[]): ComposerAssetItem[] =>
  assetLibraryItems.map((item) => ({
    assetRef: item.assetRef,
    packageId: item.packageId,
    packageVersion: item.packageVersion,
    resourceId: item.resourceId,
    resourceType: item.resourceType,
    unityTargetType: item.unityTargetType,
    licenseSource: item.licenseSource,
    slotHints: item.slotHints,
    importStatus: item.importStatus,
  }));
