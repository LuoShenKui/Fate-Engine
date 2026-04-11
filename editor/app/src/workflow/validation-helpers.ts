import type { EditorRecipeV0 } from "../project/recipe";
import type { BatchValidationIssue } from "./validation-types";

export type PerfBudgetMetric = {
  warning: number;
  error: number;
  lower_is_better?: boolean;
};

export type GraphEdgeLike = {
  id: string;
  from: string;
  to: string;
};

export const isLocked = (recipe: EditorRecipeV0): boolean => {
  return recipe.lockfile.packages.every((pkg) => pkg.id !== "" && pkg.version !== "" && pkg.hash !== "");
};

export const makeEdgeId = (edge: unknown, index: number): string => {
  const edgeObj = typeof edge === "object" && edge !== null ? (edge as Record<string, unknown>) : {};
  const from = typeof edgeObj.from === "string" ? edgeObj.from : "unknown";
  const to = typeof edgeObj.to === "string" ? edgeObj.to : "unknown";
  return `${from}->${to}#${index}`;
};

export const toNodeId = (node: unknown, index: number): string => {
  const nodeObj = typeof node === "object" && node !== null ? (node as Record<string, unknown>) : {};
  return typeof nodeObj.id === "string" ? nodeObj.id : `node-${index}`;
};

export const toObject = (value: unknown): Record<string, unknown> => {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
};

export const toStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string" && item !== "");
};

export const getGraphEdges = (recipe: EditorRecipeV0): GraphEdgeLike[] => {
  return recipe.edges.map((edge, index) => {
    const edgeObj = toObject(edge);
    return {
      id: makeEdgeId(edge, index),
      from: typeof edgeObj.from === "string" ? edgeObj.from : "",
      to: typeof edgeObj.to === "string" ? edgeObj.to : "",
    };
  });
};

const getSuppressKeys = (recipe: EditorRecipeV0): Set<string> => {
  return new Set(recipe.suppress.map((item) => `${item.ruleId}::${item.target}`));
};

export const withSuppressState = (recipe: EditorRecipeV0, issues: BatchValidationIssue[]): BatchValidationIssue[] => {
  const suppressKeys = getSuppressKeys(recipe);
  return issues.map((issue) => {
    if (issue.target === undefined) {
      return issue;
    }
    const targetId = issue.target.type === "node" ? issue.target.nodeId : issue.target.type === "edge" ? issue.target.edgeId : issue.target.brickId;
    const key = `${issue.ruleId}::${targetId}`;
    return suppressKeys.has(key) ? { ...issue, suppressed: true } : issue;
  });
};
