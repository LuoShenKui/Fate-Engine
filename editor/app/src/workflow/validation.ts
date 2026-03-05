import type { EditorRecipeV0 } from "../project/recipe";

export type BatchValidationIssueLevel = "Error" | "Warning";

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
        } else {
          acc.totalWarnings += 1;
        }
      }
      return acc;
    },
    { totalErrors: 0, totalWarnings: 0 },
  );

  return { entries, stats };
};
