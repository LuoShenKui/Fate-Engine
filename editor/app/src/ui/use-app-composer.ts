import { useEffect, useMemo, useState } from "react";
import {
  applyAgentAssemblyPlan,
  composeRecipeFromPrompt,
  composeRecipeWithAgent,
  type AgentApplyReport,
  type AgentComposeResult,
  type ComposeResult,
} from "../composer";
import { normalizeRecipe, type EditorRecipeV0 } from "../project/recipe";
import { annotateRecipeValidationState } from "../composer/validation-state";
import type { AssetLibraryItem } from "./AssetLibraryPanel";
import { DEFAULT_AGENT_REMOTE_CATALOG, buildAgentValidationItems } from "./agent-compose-support";
import { COMPOSER_HISTORY_STORAGE_KEY } from "./app-constants";
import { toComposerAssetItems, toComposerCatalogEntries } from "./app-composer-adapter";
import type { BrickCatalogEntry } from "./app-types";
import type { ValidationItem } from "./ValidationPanel";

type ComposeMode = "rules" | "agent";

type UseAppComposerArgs = {
  catalogEntries: BrickCatalogEntry[];
  assetLibraryItems: AssetLibraryItem[];
  getRecipe: () => EditorRecipeV0;
  applyRecipe: (recipe: EditorRecipeV0) => void;
  renderBatchValidate: (recipe: EditorRecipeV0) => void;
  pushWorkspaceNotice: (item: ValidationItem) => void;
};

type UseAppComposerResult = {
  composeMode: ComposeMode;
  setComposeMode: (value: ComposeMode) => void;
  composePrompt: string;
  setComposePrompt: (value: string) => void;
  composeHistory: string[];
  composeResult: ComposeResult | null;
  agentResult: AgentComposeResult | null;
  lastAgentApplyReport: AgentApplyReport | null;
  canRollbackAgentApply: boolean;
  onCompose: () => Promise<void> | void;
  onApplyDraft: () => void;
  onRollbackAgentApply: () => void;
  onReuseHistory: (value: string) => void;
};

const COMPOSER_HISTORY_LIMIT = 8;
const REMOTE_CATALOG_URL = "https://packages.example.com/catalog.json";

const loadComposeHistory = (): string[] => {
  try {
    const raw = window.localStorage.getItem(COMPOSER_HISTORY_STORAGE_KEY);
    if (raw === null) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
  } catch {
    return [];
  }
};

export const useAppComposer = ({
  catalogEntries,
  assetLibraryItems,
  getRecipe,
  applyRecipe,
  renderBatchValidate,
  pushWorkspaceNotice,
}: UseAppComposerArgs): UseAppComposerResult => {
  const [composeMode, setComposeMode] = useState<ComposeMode>("rules");
  const [composePrompt, setComposePrompt] = useState("做一个角色，能走跑跳、爬梯子、拾取并投掷物品");
  const [composeHistory, setComposeHistory] = useState<string[]>(loadComposeHistory());
  const [composeResult, setComposeResult] = useState<ComposeResult | null>(null);
  const [agentResult, setAgentResult] = useState<AgentComposeResult | null>(null);
  const [lastAgentCheckpoint, setLastAgentCheckpoint] = useState<EditorRecipeV0 | null>(null);
  const [lastAgentApplyReport, setLastAgentApplyReport] = useState<AgentApplyReport | null>(null);

  const composerCatalogEntries = useMemo(() => toComposerCatalogEntries(catalogEntries), [catalogEntries]);
  const composerAssetItems = useMemo(() => toComposerAssetItems(assetLibraryItems), [assetLibraryItems]);

  useEffect(() => {
    try {
      window.localStorage.setItem(COMPOSER_HISTORY_STORAGE_KEY, JSON.stringify(composeHistory));
    } catch {
      // Ignore local storage failures.
    }
  }, [composeHistory]);

  const rememberPrompt = (prompt: string): void => {
    setComposeHistory((prev) => [prompt, ...prev.filter((item) => item !== prompt)].slice(0, COMPOSER_HISTORY_LIMIT));
  };

  const onComposeRules = (): void => {
    const prompt = composePrompt.trim();
    if (prompt.length === 0) {
      pushWorkspaceNotice({ level: "Warning", message: "Compose prompt is empty." });
      return;
    }
    const result = composeRecipeFromPrompt({
      prompt,
      catalogEntries: composerCatalogEntries,
      assetItems: composerAssetItems,
    });
    setComposeResult(result);
    setAgentResult(null);
    rememberPrompt(prompt);
    pushWorkspaceNotice({
      level: result.recipeDraft === null ? "Warning" : "Info",
      message: result.recipeDraft === null ? `Compose blocked: ${result.diagnostics[0]?.message ?? "unknown issue"}` : `Compose draft ready with ${result.recipeDraft.nodes.length} nodes.`,
    });
  };

  const onComposeAgent = async (): Promise<void> => {
    const prompt = composePrompt.trim();
    if (prompt.length === 0) {
      pushWorkspaceNotice({ level: "Warning", message: "Agent compose prompt is empty." });
      return;
    }
    const result = await composeRecipeWithAgent({
      prompt,
      catalogEntries: composerCatalogEntries,
      assetItems: composerAssetItems,
      remoteCatalogUrl: REMOTE_CATALOG_URL,
      fallbackRemoteCatalog: DEFAULT_AGENT_REMOTE_CATALOG,
    });
    setComposeResult(null);
    setAgentResult(result);
    rememberPrompt(prompt);

    if (result.plan === null) {
      pushWorkspaceNotice({ level: "Warning", message: `Agent compose blocked: ${result.diagnostics[0]?.message ?? "no supported plan"}` });
      return;
    }

    const applied = applyAgentAssemblyPlan({
      prompt,
      plan: result.plan,
      catalogEntries: composerCatalogEntries,
      assetItems: composerAssetItems,
      currentRecipe: getRecipe(),
    });
    const nextRecipe = annotateRecipeValidationState(normalizeRecipe(applied.nextRecipe));
    applyRecipe(nextRecipe);
    renderBatchValidate(nextRecipe);
    setLastAgentCheckpoint(applied.checkpointRecipe);
    setLastAgentApplyReport(applied.applyReport);

    const validationItems = buildAgentValidationItems(result);
    for (const item of validationItems.slice(0, 6)) {
      pushWorkspaceNotice(item);
    }
    pushWorkspaceNotice({
      level: applied.applyReport.placeholderCount > 0 ? "Warning" : "Info",
      message:
        applied.applyReport.placeholderCount > 0
          ? `Agent applied ${applied.applyReport.replacedNodeCount} nodes with ${applied.applyReport.placeholderCount} placeholders.`
          : `Agent applied ${applied.applyReport.replacedNodeCount} nodes to the canvas.`,
    });
  };

  const onCompose = (): Promise<void> | void => (composeMode === "agent" ? onComposeAgent() : onComposeRules());

  const onApplyDraft = (): void => {
    if (composeResult?.recipeDraft === null || composeResult?.recipeDraft === undefined) {
      pushWorkspaceNotice({ level: "Warning", message: "No compose draft is ready to apply." });
      return;
    }
    const nextRecipe = annotateRecipeValidationState(normalizeRecipe(composeResult.recipeDraft));
    applyRecipe(nextRecipe);
    renderBatchValidate(nextRecipe);
    pushWorkspaceNotice({ level: "Info", message: `Applied compose draft from prompt: ${composeResult.intent.rawPrompt}` });
  };

  const onRollbackAgentApply = (): void => {
    if (lastAgentCheckpoint === null) {
      pushWorkspaceNotice({ level: "Warning", message: "No agent checkpoint is available to roll back." });
      return;
    }
    const nextRecipe = annotateRecipeValidationState(normalizeRecipe(lastAgentCheckpoint));
    applyRecipe(nextRecipe);
    renderBatchValidate(nextRecipe);
    setLastAgentCheckpoint(null);
    pushWorkspaceNotice({ level: "Info", message: "Rolled back the latest agent canvas apply." });
  };

  return {
    composeMode,
    setComposeMode,
    composePrompt,
    setComposePrompt,
    composeHistory,
    composeResult,
    agentResult,
    lastAgentApplyReport,
    canRollbackAgentApply: lastAgentCheckpoint !== null,
    onCompose,
    onApplyDraft,
    onRollbackAgentApply,
    onReuseHistory: (value: string) => setComposePrompt(value),
  };
};
