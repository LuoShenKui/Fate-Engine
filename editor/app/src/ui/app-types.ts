import type { BrickDefinition, BrickWhiteboxMetadata } from "../domain/brick";
import type { ComposerHints } from "../composer";
import type { BrickTags } from "./brick-tags";

export type RuntimeEventItem = {
  source: "door" | "switch" | "ladder" | "trigger-zone" | "link" | "adapter" | "ability" | "camera";
  text: string;
};

export type CompositeChildSpec = {
  id: string;
  type: string;
  position: [number, number, number];
};

export type CompositeEdgeSpec = {
  from: string;
  to: string;
};

export type CompositeParamGroup = {
  key: string;
  label: string;
  values: Record<string, string | number | boolean>;
};

export type AbilityGrantState = {
  packageId: string;
  brickId: string;
  sourceNodeId: string;
};

export type AssetRegistryItem = {
  id: string;
  name: string;
  assetRef: string;
  slotHints: string[];
  packageId: string;
  packageVersion: string;
  resourceId: string;
  resourceType: "mesh" | "material" | "anim" | "prefab" | "audio" | "vfx" | "script_ref";
  unityTargetType: string;
  licenseSource: string;
  localPath?: string;
  sourcePackageKind: "asset" | "local";
  importStatus: "formal" | "fallback" | "local";
};

export type BrickCatalogEntry = BrickDefinition & {
  packageId: string;
  version: string;
  license: string;
  dependencies: string[];
  compat: string;
  contractVersion: string;
  packageKind: "product" | "logic" | "asset";
  supportedActorTypes: string[];
  category: string;
  source: "builtin" | "imported";
  installState: "ready" | "incomplete" | "blocked";
  importIssues: string[];
  runtimeKind: "door" | "switch" | "ladder" | "trigger-zone" | "enemy" | "generic";
  compositeChildren: CompositeChildSpec[];
  compositeEdges: CompositeEdgeSpec[];
  compositeParamGroups: CompositeParamGroup[];
  grantedAbilityPackageIds: string[];
  assetDependencies: string[];
  defaultAssetBindings: Array<{ slotId: string; resourceType: string; assetPackageId: string; resourceId: string }>;
  resources: unknown[];
  tags: BrickTags;
  whiteboxMetadata: BrickWhiteboxMetadata;
  composeHints?: ComposerHints;
};
