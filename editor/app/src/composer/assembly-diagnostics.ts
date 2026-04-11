import type { BatchValidationIssue } from "../workflow/validation";
import type { ComposeDiagnostic, ComposeDiagnosticCode } from "./types";

const codeForRule = (ruleId: string): ComposeDiagnosticCode =>
  ruleId === "asset.binding.missing_formal"
    ? "missing_formal_binding"
    : ruleId === "asset.binding.slot_mismatch"
      ? "slot_type_mismatch"
      : ruleId === "capability.required_missing"
        ? "required_capability_missing"
        : ruleId === "capability.conflict"
          ? "capability_conflict"
          : ruleId === "actor.class_mismatch"
            ? "actor_class_mismatch"
            : ruleId === "space.footprint_conflict"
              ? "space_conflict"
              : ruleId === "space.installation_missing"
                ? "space_installation_missing"
                : ruleId === "slot.missing"
                  ? "missing_asset_binding"
                  : "constraint_violation";

export const toComposeDiagnosticsFromValidation = (issues: BatchValidationIssue[]): ComposeDiagnostic[] =>
  issues.map((issue) => ({
    code: codeForRule(issue.ruleId),
    severity: issue.level === "Error" ? "error" : issue.level === "Warning" ? "warning" : "info",
    message: issue.message,
    target:
      issue.target?.type === "node"
        ? issue.target.nodeId
        : issue.target?.type === "edge"
          ? issue.target.edgeId
          : issue.target?.brickId,
  }));
