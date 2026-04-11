export { composeRecipeFromPrompt } from "./compose";
export { composeRecipeWithAgent } from "./agent-compose";
export { parseComposePrompt } from "./intent-parser";
export { normalizeAgentAssemblyPlan } from "./agent-normalizer";
export { retrieveAgentContext } from "./agent-retrieval";
export { applyAgentAssemblyPlan } from "./agent-apply";
export type {
  ComposeBindingSummaryItem,
  ComposeDiagnostic,
  ComposeIntent,
  ComposePlan,
  ComposeRecipeDraft,
  ComposeResult,
  ComposerAssetItem,
  ComposerCatalogEntry,
  ComposerHints,
} from "./types";
export type {
  AgentApplyReport,
  AgentAssemblyPlan,
  AgentComposeResult,
  AgentGapItem,
  AgentPlaceholderNodeMeta,
  AgentRemoteCatalogEntry,
  AgentSourceRecord,
} from "./agent-types";
