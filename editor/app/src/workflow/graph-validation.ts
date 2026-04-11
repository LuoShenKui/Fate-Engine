import type { EditorRecipeV0 } from "../project/recipe";
import { getGraphEdges, makeEdgeId, toNodeId, toObject, toStringList } from "./validation-helpers";
import type { BatchValidationIssue, ValidationRule } from "./validation-types";

const emptyGraphRule: ValidationRule = {
  id: "graph.empty",
  run: (recipe) => {
    if (recipe.nodes.length > 0) {
      return [];
    }
    return [{ level: "Error", ruleId: "graph.empty", message: "节点为空", evidence: "recipe.nodes.length=0", suggestion: "请先添加至少一个节点" }];
  },
};

const missingEdgeRule: ValidationRule = {
  id: "graph.edges.missing",
  run: (recipe) => {
    if (recipe.edges.length > 0) {
      return [];
    }
    return [{ level: "Warning", ruleId: "graph.edges.missing", message: "未配置连线", evidence: "recipe.edges.length=0", suggestion: "请补充关键节点之间的连线" }];
  },
};

const reachabilityRule: ValidationRule = {
  id: "graph.unreachable",
  run: (recipe) => {
    if (recipe.nodes.length === 0) {
      return [];
    }
    const nodeIds = recipe.nodes.map((node, index) => toNodeId(node, index));
    const edges = getGraphEdges(recipe);
    const incoming = new Set(edges.map((edge) => edge.to));
    const entryNodes = nodeIds.filter((id) => !incoming.has(id));
    const start = entryNodes.length > 0 ? entryNodes[0] : nodeIds[0];
    const visited = new Set<string>([start]);
    const queue = [start];
    while (queue.length > 0) {
      const current = queue.shift();
      if (current === undefined) {
        continue;
      }
      for (const edge of edges) {
        if (edge.from === current && edge.to !== "" && !visited.has(edge.to)) {
          visited.add(edge.to);
          queue.push(edge.to);
        }
      }
    }
    return nodeIds
      .filter((id) => !visited.has(id))
      .map<BatchValidationIssue>((nodeId) => ({
        level: "Warning",
        ruleId: "graph.unreachable",
        target: { type: "node", nodeId },
        message: `发现不可达节点: ${nodeId}`,
        evidence: `entry=${start}`,
        suggestion: "为该节点补充可达路径或删除冗余节点",
      }));
  },
};

const crossBrickDependencyRule: ValidationRule = {
  id: "dependency.cross_brick",
  run: (recipe) => {
    const nodeBrickMap = new Map<string, string>();
    recipe.nodes.forEach((node, index) => {
      const nodeId = toNodeId(node, index);
      const nodeObj = toObject(node);
      const brickId = typeof nodeObj.brickId === "string" ? nodeObj.brickId : "";
      if (brickId !== "") {
        nodeBrickMap.set(nodeId, brickId);
      }
    });
    const allowPairs = new Set(
      toStringList(recipe.params.allowed_cross_brick_dependencies).flatMap((pair) => {
        const [fromBrick, toBrick] = pair.split("->").map((part) => part.trim());
        if (!fromBrick || !toBrick) {
          return [];
        }
        return [`${fromBrick}->${toBrick}`, `${toBrick}->${fromBrick}`];
      }),
    );
    return getGraphEdges(recipe).flatMap<BatchValidationIssue>((edge) => {
      const fromBrick = nodeBrickMap.get(edge.from);
      const toBrick = nodeBrickMap.get(edge.to);
      if (fromBrick === undefined || toBrick === undefined || fromBrick === toBrick) {
        return [];
      }
      const pairKey = `${fromBrick}->${toBrick}`;
      if (allowPairs.has(pairKey)) {
        return [];
      }
      return [
        {
          level: "Error",
          ruleId: "dependency.cross_brick",
          target: { type: "edge", edgeId: edge.id },
          message: `检测到跨砖块依赖: ${fromBrick} -> ${toBrick}`,
          evidence: `edge=${edge.from}->${edge.to}, allow=${allowPairs.size > 0 ? "configured" : "empty"}`,
          suggestion: "在允许列表补充该砖块对，或拆分为同砖块内依赖",
        },
      ];
    });
  },
};

const eventLoopRule: ValidationRule = {
  id: "event.loop",
  run: (recipe) => {
    const links = Array.isArray(recipe.params.event_links) ? recipe.params.event_links : [];
    const adjacency = new Map<string, Set<string>>();
    links.forEach((link) => {
      const linkObj = toObject(link);
      const from = typeof linkObj.from === "string" ? linkObj.from : "";
      const to = typeof linkObj.to === "string" ? linkObj.to : "";
      if (from === "" || to === "") {
        return;
      }
      const next = adjacency.get(from) ?? new Set<string>();
      next.add(to);
      adjacency.set(from, next);
    });

    const visiting = new Set<string>();
    const visited = new Set<string>();
    const loopNodes = new Set<string>();

    const dfs = (nodeId: string): void => {
      visiting.add(nodeId);
      const nextNodes = adjacency.get(nodeId) ?? new Set<string>();
      nextNodes.forEach((nextNodeId) => {
        if (visiting.has(nextNodeId)) {
          loopNodes.add(nextNodeId);
          loopNodes.add(nodeId);
          return;
        }
        if (!visited.has(nextNodeId)) {
          dfs(nextNodeId);
        }
      });
      visiting.delete(nodeId);
      visited.add(nodeId);
    };

    adjacency.forEach((_toNodes, nodeId) => {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    });

    return Array.from(loopNodes).map<BatchValidationIssue>((nodeId) => ({
      level: "Error",
      ruleId: "event.loop",
      target: { type: "node", nodeId },
      message: `事件链路存在环路节点: ${nodeId}`,
      evidence: `event_links 中存在回边，node=${nodeId}`,
      suggestion: "打断回路或增加幂等保护，避免事件无限触发",
    }));
  },
};

const invalidStateTransitionRule: ValidationRule = {
  id: "state.transition.invalid_path",
  run: (recipe) => {
    const transitions = Array.isArray(recipe.params.state_transitions) ? recipe.params.state_transitions : [];
    const allowedPaths = new Set(toStringList(recipe.params.allowed_state_paths));
    return transitions.flatMap<BatchValidationIssue>((transition, index) => {
      const transitionObj = toObject(transition);
      const from = typeof transitionObj.from === "string" ? transitionObj.from : "";
      const to = typeof transitionObj.to === "string" ? transitionObj.to : "";
      if (from === "" || to === "") {
        return [];
      }
      const path = `${from}->${to}`;
      if (allowedPaths.has(path)) {
        return [];
      }
      const transitionBrickId =
        typeof transitionObj.brickId === "string"
          ? transitionObj.brickId
          : typeof recipe.params.selected_brick === "string"
            ? recipe.params.selected_brick
            : "";
      return [
        {
          level: "Error",
          ruleId: "state.transition.invalid_path",
          target: transitionBrickId !== "" ? { type: "brick", brickId: transitionBrickId } : undefined,
          message: `状态迁移非法路径: ${path}`,
          evidence: `allowed_state_paths 缺失 ${path} (index=${index})`,
          suggestion: "更新允许迁移路径配置，或删除不被允许的迁移",
        },
      ];
    });
  },
};

const disabledDependencyRule: ValidationRule = {
  id: "dependency.disabled_conflict",
  run: (recipe) => {
    const disabledCapabilities = Array.isArray(recipe.params.disabled_capabilities)
      ? recipe.params.disabled_capabilities.filter((item): item is string => typeof item === "string")
      : [];
    const disabledParams = Array.isArray(recipe.params.disabled_params)
      ? recipe.params.disabled_params.filter((item): item is string => typeof item === "string")
      : [];
    const issues: BatchValidationIssue[] = [];
    recipe.edges.forEach((edge, index) => {
      const edgeObj = typeof edge === "object" && edge !== null ? (edge as Record<string, unknown>) : {};
      const edgeCapability = typeof edgeObj.capability === "string" ? edgeObj.capability : "";
      const edgeParam = typeof edgeObj.param === "string" ? edgeObj.param : "";
      const edgeId = makeEdgeId(edge, index);
      if (edgeCapability !== "" && disabledCapabilities.includes(edgeCapability)) {
        issues.push({
          level: "Error",
          ruleId: "dependency.disabled_conflict",
          target: { type: "edge", edgeId },
          message: `禁用 capability 仍存在依赖连线: ${edgeCapability}`,
          evidence: `edge.capability=${edgeCapability}`,
          suggestion: "移除该连线或恢复 capability",
        });
      }
      if (edgeParam !== "" && disabledParams.includes(edgeParam)) {
        issues.push({
          level: "Warning",
          ruleId: "dependency.disabled_conflict",
          target: { type: "edge", edgeId },
          message: `禁用参数仍存在依赖连线: ${edgeParam}`,
          evidence: `edge.param=${edgeParam}`,
          suggestion: "移除依赖或取消参数禁用",
        });
      }
    });
    return issues;
  },
};

export const graphValidationRules: ValidationRule[] = [
  emptyGraphRule,
  missingEdgeRule,
  reachabilityRule,
  disabledDependencyRule,
  crossBrickDependencyRule,
  eventLoopRule,
  invalidStateTransitionRule,
];
