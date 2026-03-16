import type { BrickDefinition } from "../domain/brick";

export type RuntimeEventItem = {
  source: "door" | "switch" | "ladder" | "trigger-zone" | "link" | "adapter" | "ability";
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
};

export type BrickCatalogEntry = BrickDefinition & {
  packageId: string;
  version: string;
  license: string;
  dependencies: string[];
  compat: string;
  contractVersion: string;
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
};
