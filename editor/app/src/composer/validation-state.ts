import type { EditorRecipeV0 } from "../project/recipe";
import { runRules } from "../workflow/validation";
import type { CanvasNode } from "../ui/GraphCanvasPanel";

export const annotateRecipeValidationState = (recipe: EditorRecipeV0): EditorRecipeV0 => {
  const issues = runRules(recipe).filter((issue) => !issue.suppressed);
  const issuesByNodeId = new Map<string, string[]>();
  const issuesByBrickId = new Map<string, string[]>();

  for (const issue of issues) {
    if (issue.target?.type === "node") {
      issuesByNodeId.set(issue.target.nodeId, [...(issuesByNodeId.get(issue.target.nodeId) ?? []), issue.message]);
    }
    if (issue.target?.type === "brick") {
      issuesByBrickId.set(issue.target.brickId, [...(issuesByBrickId.get(issue.target.brickId) ?? []), issue.message]);
    }
  }

  const nextNodes = (recipe.nodes as CanvasNode[]).map((node) => {
    const nextIssues = [...(issuesByNodeId.get(node.id) ?? []), ...(typeof node.type === "string" ? issuesByBrickId.get(node.type) ?? [] : [])];
    return {
      ...node,
      meta: {
        ...node.meta,
        validationState: nextIssues.length === 0 ? "ready" : "blocked",
        validationIssues: nextIssues,
      },
    };
  });

  return {
    ...recipe,
    nodes: nextNodes,
    params: {
      ...recipe.params,
      validation_state: {
        blocking_issue_count: issues.filter((issue) => issue.level === "Error").length,
        blocking_node_ids: nextNodes.filter((node) => node.meta?.validationState === "blocked").map((node) => node.id),
      },
    },
  };
};
