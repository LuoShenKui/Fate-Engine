import { runAssemblyValidationRules } from "../workflow/assembly-validation";
import { toComposeDiagnosticsFromValidation } from "./assembly-diagnostics";
import { parseComposePrompt } from "./intent-parser";
import { buildComposePlan } from "./capability-planner";
import { resolveComposeBindings } from "./binding-resolver";
import { buildComposeAudit, assembleComposeRecipeDraft } from "./recipe-assembler";
import type { ComposeResult, ComposerAssetItem, ComposerCatalogEntry } from "./types";

type ComposeRecipeArgs = {
  prompt: string;
  catalogEntries: ComposerCatalogEntry[];
  assetItems: ComposerAssetItem[];
};

export const composeRecipeFromPrompt = ({ prompt, catalogEntries, assetItems }: ComposeRecipeArgs): ComposeResult => {
  const intent = parseComposePrompt(prompt);
  const planResult = buildComposePlan(intent, catalogEntries);
  const bindingResult = resolveComposeBindings(planResult.plan.nodes, catalogEntries, assetItems);
  const audit = buildComposeAudit(planResult.plan, catalogEntries);
  const draft = assembleComposeRecipeDraft(prompt, planResult.plan, bindingResult.bindingSummary, audit, catalogEntries, assetItems);
  const assemblyIssues = runAssemblyValidationRules(draft);
  const diagnostics = [...intent.diagnostics, ...planResult.diagnostics, ...bindingResult.diagnostics, ...toComposeDiagnosticsFromValidation(assemblyIssues)];
  const hasBlockingIssue = diagnostics.some((diagnostic) => diagnostic.severity === "error");

  return {
    intent,
    plan: planResult.plan,
    recipeDraft: hasBlockingIssue ? null : draft,
    diagnostics,
    audit,
    bindingSummary: bindingResult.bindingSummary,
  };
};
