import type { EditorRecipeV0 } from "../project/recipe";

export type BatchValidationIssueLevel = "Error" | "Warning" | "Info";

export type BatchValidationTarget =
  | { type: "node"; nodeId: string }
  | { type: "edge"; edgeId: string }
  | { type: "brick"; brickId: string };

export type BatchValidationIssue = {
  level: BatchValidationIssueLevel;
  ruleId: string;
  target?: BatchValidationTarget;
  evidence?: string;
  suggestion?: string;
  message: string;
  suppressed?: boolean;
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

export type ValidationRule = {
  id: string;
  run: (recipe: EditorRecipeV0) => BatchValidationIssue[];
};
