import type { EditorRecipeV0 } from "../project/recipe";
import type { BatchValidationIssue, ValidationRule } from "./validation-types";

const asRecord = (value: unknown): Record<string, unknown> => (typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {});
const asString = (value: unknown): string => (typeof value === "string" ? value : "");

export const runAgentValidationRules = (recipe: EditorRecipeV0): BatchValidationIssue[] => {
  const params = asRecord(recipe.params);
  const gapReport = Array.isArray(params.agent_gap_report) ? params.agent_gap_report : [];
  const sources = Array.isArray(params.agent_sources) ? params.agent_sources : [];
  const bindingSummary = Array.isArray(params.compose_binding_summary) ? params.compose_binding_summary : [];
  const issues: BatchValidationIssue[] = [];

  recipe.nodes.forEach((node, index) => {
    const nodeRecord = asRecord(node);
    const nodeId = asString(nodeRecord.id) || `node-${index}`;
    const meta = asRecord(nodeRecord.meta);
    if (asString(meta.placeholderKind) !== "") {
      issues.push({
        level: "Warning",
        ruleId: "agent.placeholder_present",
        target: { type: "node", nodeId },
        evidence: `${asString(meta.placeholderKind)}::${asString(meta.requiredCapability)}`,
        suggestion: "安装对应积木包后替换占位节点，或调整需求范围。",
        message: `Agent 落下未完成占位节点: ${nodeId}`,
      });
    }
  });

  for (const source of sources) {
    const sourceRecord = asRecord(source);
    if (asString(sourceRecord.url) === "") {
      issues.push({
        level: "Warning",
        ruleId: "agent.source_missing",
        evidence: JSON.stringify(sourceRecord),
        suggestion: "补齐远程来源 URL 与检索记录。",
        message: "Agent 来源记录不完整",
      });
    }
  }

  for (const gap of gapReport) {
    const gapRecord = asRecord(gap);
    const gapType = asString(gapRecord.type);
    const packageId = asString(gapRecord.packageId);
    const capabilityId = asString(gapRecord.capabilityId);
    if (gapType === "missing_brick") {
      issues.push({
        level: "Warning",
        ruleId: "agent.uninstalled_reference",
        evidence: packageId,
        suggestion: "安装推荐包或保留占位节点等待后续实现。",
        message: `Agent 引用了未安装包: ${packageId}`,
      });
    } else if (gapType === "missing_asset_binding") {
      issues.push({
        level: "Warning",
        ruleId: "agent.binding_unresolved",
        evidence: packageId || capabilityId,
        suggestion: "补齐正式资源绑定或接受 fallback。",
        message: "Agent 结果存在未解绑定资源",
      });
    } else if (gapType === "missing_protocol_capability" || gapType === "unsupported_request_fragment") {
      issues.push({
        level: "Warning",
        ruleId: "agent.capability_gap",
        evidence: capabilityId || packageId,
        suggestion: "新增协议能力或缩小当前自动组装范围。",
        message: "Agent 请求超出当前协议/积木能力范围",
      });
    }
  }

  for (const binding of bindingSummary) {
    const bindingRecord = asRecord(binding);
    if (asString(bindingRecord.bindingKind) === "unresolved") {
      issues.push({
        level: "Warning",
        ruleId: "agent.binding_unresolved",
        evidence: asString(bindingRecord.slotId),
        suggestion: "为该 slot 绑定 formal 资产或声明 fallback。",
        message: `Agent 结果存在 unresolved slot: ${asString(bindingRecord.slotId)}`,
      });
    }
  }

  return issues;
};

export const agentValidationRules: ValidationRule[] = [
  {
    id: "agent.validation",
    run: (recipe) => runAgentValidationRules(recipe),
  },
];
