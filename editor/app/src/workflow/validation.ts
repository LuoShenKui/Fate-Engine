import { getBrickDefinition } from "../domain/registry";
import type { EditorRecipeV0 } from "../project/recipe";

export type BatchValidationIssueLevel = "Error" | "Warning" | "Info";

export type BatchValidationIssue = {
  level: BatchValidationIssueLevel;
  message: string;
};

export type BatchValidationEntry = {
  recipeId: string;
  issues: BatchValidationIssue[];
};

export type BatchValidationStats = {
  totalErrors: number;
  totalWarnings: number;
};

export type BatchValidationReport = {
  entries: BatchValidationEntry[];
  stats: BatchValidationStats;
};

const isLocked = (recipe: EditorRecipeV0): boolean => {
  return recipe.lockfile.packages.every((pkg) => pkg.id !== "" && pkg.version !== "" && pkg.hash !== "");
};

const collectRecipeIssues = (recipe: EditorRecipeV0): BatchValidationIssue[] => {
  const issues: BatchValidationIssue[] = [];
  if (recipe.nodes.length === 0) {
    issues.push({ level: "Error", message: "节点为空" });
  }
  if (recipe.edges.length === 0) {
    issues.push({ level: "Warning", message: "未配置连线" });
  }
  if (!isLocked(recipe)) {
    issues.push({ level: "Warning", message: "lockfile 未完整锁定" });
  }

  const selectedBrickId = typeof recipe.params.selected_brick === "string" ? recipe.params.selected_brick : "";
  const selectedDefinition = getBrickDefinition(selectedBrickId);
  if (selectedDefinition !== undefined) {
    for (const slot of selectedDefinition.slots) {
      const binding = recipe.slot_bindings[slot.slotId];
      const hasBinding = typeof binding === "string" && binding.trim() !== "";
      if (!hasBinding && !slot.optional) {
        issues.push({ level: "Error", message: `slot 缺失: ${slot.slotId}` });
      }
      if (!hasBinding && slot.fallbackAssetRef !== undefined && slot.fallbackAssetRef !== "") {
        issues.push({ level: slot.optional ? "Info" : "Warning", message: `slot 使用 fallback: ${slot.slotId} -> ${slot.fallbackAssetRef}` });
      }
    }
  }

  return issues;
};

export const runBatchValidate = (recipes: Array<{ recipeId: string; recipe: EditorRecipeV0 }>): BatchValidationReport => {
  const entries = recipes.map<BatchValidationEntry>(({ recipeId, recipe }) => ({
    recipeId,
    issues: collectRecipeIssues(recipe),
  }));

  const stats = entries.reduce<BatchValidationStats>(
    (acc, entry) => {
      for (const issue of entry.issues) {
        if (issue.level === "Error") {
          acc.totalErrors += 1;
        } else if (issue.level === "Warning") {
          acc.totalWarnings += 1;
        }
      }
      return acc;
    },
    { totalErrors: 0, totalWarnings: 0 },
  );

  return { entries, stats };
};
