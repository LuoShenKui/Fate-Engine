import type { AgentComposeResult, AgentRemoteCatalogEntry } from "../composer";
import type { ValidationItem } from "./ValidationPanel";

export const DEFAULT_AGENT_REMOTE_CATALOG: AgentRemoteCatalogEntry[] = [
  {
    title: "Remote Patrol Enemy Package",
    url: "https://packages.example.com/patrol-enemy",
    summary: "Adds enemy patrol bricks and behavior summaries.",
    packageId: "fate.enemy.patrol",
    capabilityIds: ["enemy.patrol"],
    tags: ["enemy", "patrol", "combat"],
  },
  {
    title: "Remote Chest Interaction Package",
    url: "https://packages.example.com/chest-interaction",
    summary: "Adds chest interaction bricks and loot hooks.",
    packageId: "fate.interaction.chest",
    capabilityIds: ["interaction.chest"],
    tags: ["chest", "loot", "treasure"],
  },
];

export const buildAgentValidationItems = (result: AgentComposeResult | null): ValidationItem[] => {
  if (result?.plan == null) {
    return [];
  }
  return [
    ...result.plan.gapReport.map<ValidationItem>((gap) => ({
      level: "Warning",
      ruleId:
        gap.type === "missing_brick"
          ? "agent.placeholder_present"
          : gap.type === "missing_asset_binding"
            ? "agent.binding_unresolved"
            : gap.type === "missing_protocol_capability"
              ? "agent.capability_gap"
              : "agent.uninstalled_reference",
      message: gap.message,
      evidence: gap.packageId ?? gap.capabilityId ?? gap.nodeId,
    })),
    ...result.diagnostics.map<ValidationItem>((diagnostic) => ({
      level: diagnostic.severity === "error" ? "Error" : diagnostic.severity === "warning" ? "Warning" : "Info",
      ruleId:
        diagnostic.code === "missing_asset_binding"
          ? "agent.binding_unresolved"
          : diagnostic.code === "missing_package"
            ? "agent.uninstalled_reference"
            : diagnostic.code === "constraint_violation"
              ? "agent.capability_gap"
              : "agent.source_missing",
      message: diagnostic.message,
      evidence: diagnostic.target,
    })),
  ];
};
