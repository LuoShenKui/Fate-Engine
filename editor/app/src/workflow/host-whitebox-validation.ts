import perfBudget from "../../../../protocol/perf/perf_budget.json";
import type { PerfBudgetMetric } from "./validation-helpers";
import type { BatchValidationIssue, ValidationRule } from "./validation-types";

const perfBudgetRule: ValidationRule = {
  id: "budget.threshold",
  run: (recipe) => {
    const metrics = typeof recipe.params.perf_budget === "object" && recipe.params.perf_budget !== null ? (recipe.params.perf_budget as Record<string, unknown>) : {};
    const budgetMetrics = (perfBudget as { metrics?: Record<string, PerfBudgetMetric> }).metrics ?? {};
    const issues: BatchValidationIssue[] = [];
    for (const [metricName, threshold] of Object.entries(budgetMetrics)) {
      const rawValue = metrics[metricName];
      if (typeof rawValue !== "number") {
        continue;
      }
      const lowerIsBetter = threshold.lower_is_better !== false;
      const isError = lowerIsBetter ? rawValue > threshold.error : rawValue < threshold.error;
      const isWarning = lowerIsBetter ? rawValue > threshold.warning : rawValue < threshold.warning;
      if (!isError && !isWarning) {
        continue;
      }
      issues.push({
        level: isError ? "Error" : "Warning",
        ruleId: "budget.threshold",
        message: `预算超阈值: ${metricName}=${rawValue}`,
        evidence: `warning=${threshold.warning}, error=${threshold.error}`,
        suggestion: "降低开销参数或切换更低复杂度方案",
      });
    }
    return issues;
  },
};

const unityHostRule: ValidationRule = {
  id: "host.unity",
  run: (recipe) => {
    const host = recipe.params.authoring_host;
    const runtimeStack = recipe.params.runtime_stack;
    const issues: BatchValidationIssue[] = [];
    if (host !== "unity") {
      issues.push({
        level: "Error",
        ruleId: "host.unity",
        message: "当前白盒配方未声明 Unity 为宿主",
        evidence: `authoring_host=${String(host ?? "")}`,
        suggestion: "将 authoring_host 固定为 unity",
      });
    }
    if (runtimeStack !== "dots-ecs") {
      issues.push({
        level: "Warning",
        ruleId: "host.unity",
        message: "当前白盒配方未声明 DOTS/ECS 运行栈",
        evidence: `runtime_stack=${String(runtimeStack ?? "")}`,
        suggestion: "将 runtime_stack 固定为 dots-ecs",
      });
    }
    return issues;
  },
};

const whiteboxAuditRule: ValidationRule = {
  id: "whitebox.audit",
  run: (recipe) => {
    const auditRecords = Array.isArray(recipe.params.whitebox_audit) ? recipe.params.whitebox_audit : [];
    if (auditRecords.length > 0) {
      return [];
    }
    return [
      {
        level: "Warning",
        ruleId: "whitebox.audit",
        message: "当前配方缺少 AI 白盒审计记录",
        evidence: "params.whitebox_audit.length=0",
        suggestion: "在导出前补充 package/version/license/reason/notes 审计条目",
      },
    ];
  },
};

export const hostWhiteboxValidationRules: ValidationRule[] = [perfBudgetRule, unityHostRule, whiteboxAuditRule];
