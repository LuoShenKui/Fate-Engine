import { getBrickDefinition } from "../domain/registry";
import type { EditorRecipeV0 } from "../project/recipe";
import { isLocked } from "./validation-helpers";
import type { BatchValidationIssue, ValidationRule } from "./validation-types";

const lockfileIntegrityRule: ValidationRule = {
  id: "lockfile.integrity",
  run: (recipe) => {
    if (isLocked(recipe)) {
      return [];
    }
    return [{ level: "Warning", ruleId: "lockfile.integrity", message: "lockfile 未完整锁定", evidence: "存在空 id/version/hash", suggestion: "运行锁定流程并写回完整 lockfile" }];
  },
};

const missingSlotRule: ValidationRule = {
  id: "slot.missing",
  run: (recipe) => {
    const selectedBrickId = typeof recipe.params.selected_brick === "string" ? recipe.params.selected_brick : "";
    const selectedDefinition = getBrickDefinition(selectedBrickId);
    if (selectedDefinition === undefined) {
      return [];
    }
    const issues: BatchValidationIssue[] = [];
    for (const slot of selectedDefinition.slots) {
      const binding = recipe.slot_bindings[slot.slotId];
      const hasBinding = typeof binding === "string" && binding.trim() !== "";
      if (!hasBinding && !slot.optional) {
        issues.push({
          level: "Error",
          ruleId: "slot.missing",
          target: { type: "brick", brickId: selectedBrickId },
          message: `slot 缺失: ${slot.slotId}`,
          evidence: `slot=${slot.slotId}, optional=false`,
          suggestion: "请在属性面板补齐 slot 绑定",
        });
      }
      if (!hasBinding && slot.fallbackAssetRef !== undefined && slot.fallbackAssetRef !== "") {
        issues.push({
          level: slot.optional ? "Info" : "Warning",
          ruleId: "slot.fallback",
          target: { type: "brick", brickId: selectedBrickId },
          message: `slot 使用 fallback: ${slot.slotId} -> ${slot.fallbackAssetRef}`,
          evidence: `slot=${slot.slotId}, fallback=${slot.fallbackAssetRef}`,
          suggestion: "确认 fallback 资源是否符合预期",
        });
      }
    }
    return issues;
  },
};

export const slotAssetValidationRules: ValidationRule[] = [lockfileIntegrityRule, missingSlotRule];
