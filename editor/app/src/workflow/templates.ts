export type WorkflowTemplateId = "warehouse_gate_v0";

export type WorkflowTemplate = {
  id: WorkflowTemplateId;
  name: string;
  nodes: unknown[];
  edges: unknown[];
};

const templates: Record<WorkflowTemplateId, WorkflowTemplate> = {
  warehouse_gate_v0: {
    id: "warehouse_gate_v0",
    name: "Warehouse Gate v0",
    nodes: [
      { id: "sensor-1", type: "sensor.entry" },
      { id: "door-1", type: "door" },
      { id: "alarm-1", type: "alarm" },
    ],
    edges: [
      { from: "sensor-1", to: "door-1" },
      { from: "door-1", to: "alarm-1" },
    ],
  },
};

export const listWorkflowTemplates = (): WorkflowTemplate[] => Object.values(templates);

export const assembleWorkflowTemplate = (id: WorkflowTemplateId): { nodes: unknown[]; edges: unknown[] } => {
  const template = templates[id];
  return {
    nodes: [...template.nodes],
    edges: [...template.edges],
  };
};
