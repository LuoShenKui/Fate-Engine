import { createDefaultEditorDemoEdges, createDefaultEditorDemoNodes, DEFAULT_EDITOR_DEMO_SCENE_ID, DEFAULT_EDITOR_DEMO_SCENE_NAME } from "./demoScene";

export type WorkflowTemplateId = "forest_cabin_v0" | "warehouse_gate_v0" | "small_house_v0" | "warehouse_zone_v0";

export type WorkflowTemplateNode = {
  id: string;
  type: string;
  params?: Record<string, string | number | boolean>;
};

export type WorkflowTemplateEdge = {
  from: string;
  to: string;
  fromPort?: string;
  toPort?: string;
};

export type WorkflowTemplate = {
  id: WorkflowTemplateId;
  name: string;
  nodes: WorkflowTemplateNode[];
  edges: WorkflowTemplateEdge[];
};

const toWorkflowTemplateNodes = (): WorkflowTemplateNode[] =>
  createDefaultEditorDemoNodes().map((node) => ({
    id: node.id,
    type: node.type ?? "unknown",
  }));

const toWorkflowTemplateEdges = (): WorkflowTemplateEdge[] =>
  createDefaultEditorDemoEdges().map((edge) => ({
    from: edge.from,
    to: edge.to,
  }));

const templates: Record<WorkflowTemplateId, WorkflowTemplate> = {
  forest_cabin_v0: {
    id: "forest_cabin_v0",
    name: DEFAULT_EDITOR_DEMO_SCENE_NAME,
    nodes: toWorkflowTemplateNodes(),
    edges: toWorkflowTemplateEdges(),
  },
  warehouse_gate_v0: {
    id: "warehouse_gate_v0",
    name: "Warehouse Gate v0",
    nodes: [
      { id: "sensor-1", type: "sensor.entry", params: { radius: 4 } },
      { id: "door-1", type: "door", params: { locked: false, openAngle: 90 } },
      { id: "alarm-1", type: "alarm", params: { level: 1 } },
    ],
    edges: [
      { from: "sensor-1", to: "door-1", fromPort: "on-enter", toPort: "on-used" },
      { from: "door-1", to: "alarm-1", fromPort: "on-denied", toPort: "trigger" },
    ],
  },
  small_house_v0: {
    id: "small_house_v0",
    name: "Small House v0",
    nodes: [
      { id: "switch-entry", type: "switch", params: { enabled: true } },
      { id: "door-main", type: "door", params: { locked: true, displayName: "FrontDoor" } },
      { id: "container-loot", type: "container", params: { opened: false, capacity: 12 } },
      { id: "checkpoint-bed", type: "checkpoint", params: { activated: false } },
    ],
    edges: [
      { from: "switch-entry", to: "door-main", fromPort: "on-used", toPort: "on-used" },
      { from: "door-main", to: "container-loot", fromPort: "on-used", toPort: "on-used" },
      { from: "container-loot", to: "checkpoint-bed", fromPort: "on-used", toPort: "on-used" },
    ],
  },
  warehouse_zone_v0: {
    id: "warehouse_zone_v0",
    name: "Warehouse Zone v0",
    nodes: [
      { id: "zone-1", type: "trigger-zone", params: { enabled: true } },
      { id: "door-north", type: "door", params: { locked: false } },
      { id: "teleport-emergency", type: "teleport", params: { cooldown: 3 } },
      { id: "alarm-warehouse", type: "alarm", params: { level: 2 } },
    ],
    edges: [
      { from: "zone-1", to: "door-north", fromPort: "on-used", toPort: "on-used" },
      { from: "door-north", to: "teleport-emergency", fromPort: "on-denied", toPort: "on-used" },
      { from: "teleport-emergency", to: "alarm-warehouse", fromPort: "on-denied", toPort: "trigger" },
    ],
  },
};

export const listWorkflowTemplates = (): WorkflowTemplate[] => Object.values(templates);

export const assembleWorkflowTemplate = (id: WorkflowTemplateId): { nodes: WorkflowTemplateNode[]; edges: WorkflowTemplateEdge[] } => {
  const template = templates[id];
  return {
    nodes: template.nodes.map((node) => ({ ...node, params: node.params ? { ...node.params } : undefined })),
    edges: template.edges.map((edge) => ({ ...edge })),
  };
};
