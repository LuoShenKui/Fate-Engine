import type { ComposeDiagnostic } from "./types";
import type { AgentAssemblyPlan, AgentGapItem, AgentSourceRecord, NormalizeAgentAssemblyPlanResult } from "./agent-types";

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

const toString = (value: unknown): string => (typeof value === "string" ? value : "");
const toNumber = (value: unknown): number => (typeof value === "number" ? value : 0);

const invalidPlan = (message: string): NormalizeAgentAssemblyPlanResult => ({
  plan: null,
  diagnostics: [{ code: "constraint_violation", severity: "error", message }],
});

const toSources = (value: unknown): AgentSourceRecord[] =>
  Array.isArray(value)
    ? value.flatMap<AgentSourceRecord>((item) => {
        if (!isObject(item)) return [];
        const title = toString(item.title);
        const url = toString(item.url);
        const retrievedAt = toString(item.retrievedAt);
        const usedFor = toString(item.usedFor);
        if (title === "" || url === "" || retrievedAt === "" || usedFor === "") {
          return [];
        }
        return [{
          title,
          url,
          retrievedAt,
          usedFor,
          packageId: toString(item.packageId) || undefined,
        }];
      })
    : [];

const toGapReport = (value: unknown): AgentGapItem[] =>
  Array.isArray(value)
    ? value.flatMap<AgentGapItem>((item) => {
        if (!isObject(item)) return [];
        const typeRaw = toString(item.type);
        const message = toString(item.message);
        if (typeRaw === "" || message === "") return [];
        return [{
          type: typeRaw as AgentGapItem["type"],
          message,
          packageId: toString(item.packageId) || undefined,
          capabilityId: toString(item.capabilityId) || undefined,
          nodeId: toString(item.nodeId) || undefined,
        }];
      })
    : [];

export const normalizeAgentAssemblyPlan = (raw: unknown): NormalizeAgentAssemblyPlanResult => {
  if (!isObject(raw)) {
    return invalidPlan("Agent model output must be an object.");
  }

  const sessionId = toString(raw.sessionId);
  const goal = toString(raw.goal);
  const reasoningSummary = toString(raw.reasoningSummary);
  const nodes = Array.isArray(raw.nodes) ? raw.nodes : [];
  const edges = Array.isArray(raw.edges) ? raw.edges : [];

  if (sessionId === "" || goal === "" || reasoningSummary === "") {
    return invalidPlan("Agent model output is missing sessionId, goal, or reasoningSummary.");
  }

  const normalizedNodes = nodes.flatMap<AgentAssemblyPlan["nodes"][number]>((node) => {
    if (!isObject(node)) return [];
    const nodeId = toString(node.nodeId ?? node.node_id);
    const packageId = toString(node.packageId ?? node.package_id);
    const brickId = toString(node.brickId ?? node.brick_id);
    const capabilityId = toString(node.capabilityId ?? node.capability_id);
    const confidence = toNumber(node.confidence);
    if (nodeId === "" || packageId === "" || brickId === "" || capabilityId === "") return [];
    return [{ nodeId, packageId, brickId, capabilityId, confidence }];
  });

  if (normalizedNodes.length !== nodes.length || normalizedNodes.length === 0) {
    return invalidPlan("Agent model output contains malformed nodes.");
  }

  const normalizedEdges = edges.flatMap<AgentAssemblyPlan["edges"][number]>((edge) => {
    if (!isObject(edge)) return [];
    const from = toString(edge.from);
    const to = toString(edge.to);
    const reason = toString(edge.reason);
    if (from === "" || to === "" || reason === "") return [];
    return [{ from, to, reason }];
  });

  const normalizedPlan: AgentAssemblyPlan = {
    sessionId,
    goal,
    reasoningSummary,
    sources: toSources(raw.sources),
    nodes: normalizedNodes,
    edges: normalizedEdges,
    paramSuggestions: Array.isArray(raw.paramSuggestions) ? raw.paramSuggestions.flatMap((item) => {
      if (!isObject(item)) return [];
      const nodeId = toString(item.nodeId ?? item.node_id);
      const key = toString(item.key);
      const reason = toString(item.reason);
      const value = item.value;
      if (nodeId === "" || key === "" || reason === "") return [];
      if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") return [];
      return [{ nodeId, key, value, reason }];
    }) : [],
    bindingSuggestions: Array.isArray(raw.bindingSuggestions) ? raw.bindingSuggestions.flatMap((item) => {
      if (!isObject(item)) return [];
      const nodeId = toString(item.nodeId ?? item.node_id);
      const slotId = toString(item.slotId ?? item.slot_id);
      const assetRef = toString(item.assetRef ?? item.asset_ref);
      const reason = toString(item.reason);
      if (nodeId === "" || slotId === "" || assetRef === "" || reason === "") return [];
      return [{ nodeId, slotId, assetRef, reason }];
    }) : [],
    gapReport: toGapReport(raw.gapReport ?? raw.gap_report),
  };

  return { plan: normalizedPlan, diagnostics: [] };
};
