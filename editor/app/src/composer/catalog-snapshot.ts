import type { ComposerAssetItem, ComposerCatalogEntry } from "./types";

export type ComposeCatalogSnapshotEntry = {
  id: string;
  packageId: string;
  version: string;
  packageKind: "product" | "logic" | "asset";
  installState: "ready" | "incomplete" | "blocked";
  slots: ComposerCatalogEntry["slots"];
  defaultAssetBindings: ComposerCatalogEntry["defaultAssetBindings"];
  composeHints?: ComposerCatalogEntry["composeHints"];
};

export const serializeComposeCatalogSnapshot = (catalogEntries: ComposerCatalogEntry[]): ComposeCatalogSnapshotEntry[] =>
  catalogEntries.map((entry) => ({
    id: entry.id,
    packageId: entry.packageId,
    version: entry.version,
    packageKind: entry.packageKind,
    installState: entry.installState,
    slots: entry.slots,
    defaultAssetBindings: entry.defaultAssetBindings,
    composeHints: entry.composeHints,
  }));

export const serializeComposeAssetRegistry = (assetItems: ComposerAssetItem[]): ComposerAssetItem[] => assetItems;
