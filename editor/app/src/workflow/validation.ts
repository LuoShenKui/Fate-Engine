import type { EditorRecipeV0 } from "../project/recipe";
import { agentValidationRules } from "./agent-validation";
import { assemblyValidationRules } from "./assembly-validation";
import { graphValidationRules } from "./graph-validation";
import { hostWhiteboxValidationRules } from "./host-whitebox-validation";
import { slotAssetValidationRules } from "./slot-asset-validation";
import { withSuppressState } from "./validation-helpers";
import type {
  BatchValidationEntry,
  BatchValidationIssue,
  BatchValidationIssueLevel,
  BatchValidationReport,
  BatchValidationStats,
  BatchValidationTarget,
  ValidationRule,
} from "./validation-types";

export type {
  BatchValidationEntry,
  BatchValidationIssue,
  BatchValidationIssueLevel,
  BatchValidationReport,
  BatchValidationStats,
  BatchValidationTarget,
} from "./validation-types";

const RULES: ValidationRule[] = [...graphValidationRules, ...slotAssetValidationRules, ...hostWhiteboxValidationRules, ...assemblyValidationRules, ...agentValidationRules];

export const runRules = (recipe: EditorRecipeV0): BatchValidationIssue[] => {
  return withSuppressState(
    recipe,
    RULES.flatMap((rule) => rule.run(recipe)),
  );
};

export const runBatchValidate = (recipes: Array<{ recipeId: string; recipe: EditorRecipeV0 }>): BatchValidationReport => {
  const entries = recipes.map<BatchValidationEntry>(({ recipeId, recipe }) => ({
    recipeId,
    issues: runRules(recipe),
  }));

  const stats = entries.reduce<BatchValidationStats>(
    (acc, entry) => {
      for (const issue of entry.issues) {
        if (issue.suppressed) {
          continue;
        }
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
