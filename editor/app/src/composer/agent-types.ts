import type { EditorRecipeV0 } from "../project/recipe";
import type { ComposeDiagnostic, ComposerAssetItem, ComposerCatalogEntry } from "./types";

export type AgentGapType =
  | "missing_brick"
  | "missing_asset_package"
  | "missing_asset_binding"
  | "missing_protocol_capability"
  | "unsupported_request_fragment";

export type AgentGapItem = {
  type: AgentGapType;
  packageId?: string;
  capabilityId?: string;
  nodeId?: string;
  message: string;
};

export type AgentSourceRecord = {
  title: string;
  url: string;
  retrievedAt: string;
  usedFor: string;
  packageId?: string;
};

export type AgentAssemblyPlanNode = {
  nodeId: string;
  packageId: string;
  brickId: string;
  capabilityId: string;
  confidence: number;
};

export type AgentAssemblyPlanEdge = {
  from: string;
  to: string;
  reason: string;
};

export type AgentParamSuggestion = {
  nodeId: string;
  key: string;
  value: string | number | boolean;
  reason: string;
};

export type AgentBindingSuggestion = {
  nodeId: string;
  slotId: string;
  assetRef: string;
  reason: string;
};

export type AgentAssemblyPlan = {
  sessionId: string;
  goal: string;
  reasoningSummary: string;
  sources: AgentSourceRecord[];
  nodes: AgentAssemblyPlanNode[];
  edges: AgentAssemblyPlanEdge[];
  paramSuggestions: AgentParamSuggestion[];
  bindingSuggestions: AgentBindingSuggestion[];
  gapReport: AgentGapItem[];
};

export type AgentRemoteCatalogEntry = {
  title: string;
  url: string;
  summary: string;
  packageId?: string;
  capabilityIds?: string[];
  tags?: string[];
};

export type NormalizeAgentAssemblyPlanResult = {
  plan: AgentAssemblyPlan | null;
  diagnostics: ComposeDiagnostic[];
};

export type RetrieveAgentContextArgs = {
  prompt: string;
  catalogEntries: ComposerCatalogEntry[];
  assetItems: ComposerAssetItem[];
  remoteCatalogUrl?: string;
  fetchCatalog?: (url: string) => Promise<AgentRemoteCatalogEntry[]>;
  fallbackRemoteCatalog?: AgentRemoteCatalogEntry[];
};

export type RetrieveAgentContextResult = {
  localEntries: ComposerCatalogEntry[];
  assetItems: ComposerAssetItem[];
  remoteSources: AgentRemoteCatalogEntry[];
  diagnostics: ComposeDiagnostic[];
};

export type AgentComposeResult = {
  plan: AgentAssemblyPlan | null;
  diagnostics: ComposeDiagnostic[];
  remoteSources: AgentRemoteCatalogEntry[];
};

export type AgentPlaceholderNodeMeta = {
  placeholderKind: AgentGapType;
  missingReason: string;
  requiredCapability: string;
  agentSessionId: string;
};

export type AgentApplyReport = {
  sessionId: string;
  appliedAt: string;
  placeholderCount: number;
  gapCount: number;
  sourceCount: number;
  replacedNodeCount: number;
};

export type ApplyAgentAssemblyPlanArgs = {
  prompt: string;
  plan: AgentAssemblyPlan;
  catalogEntries: ComposerCatalogEntry[];
  assetItems: ComposerAssetItem[];
  currentRecipe: EditorRecipeV0;
};

export type ApplyAgentAssemblyPlanResult = {
  checkpointRecipe: EditorRecipeV0;
  nextRecipe: EditorRecipeV0;
  applyReport: AgentApplyReport;
};
