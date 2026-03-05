import type { BrickDefinition } from "./brick";
import { DoorBrickDefinition } from "./door";

const LadderBrickDefinition: BrickDefinition = {
  id: "ladder",
  name: "Ladder",
  summary: "可上下攀爬",
  properties: [],
  ports: [],
};

const TriggerZoneBrickDefinition: BrickDefinition = {
  id: "trigger-zone",
  name: "TriggerZone",
  summary: "区域触发器",
  properties: [],
  ports: [],
};

const brickRegistry: Record<string, BrickDefinition> = {
  [DoorBrickDefinition.id]: DoorBrickDefinition,
  [LadderBrickDefinition.id]: LadderBrickDefinition,
  [TriggerZoneBrickDefinition.id]: TriggerZoneBrickDefinition,
};

export function listBrickDefinitions(): BrickDefinition[] {
  return Object.values(brickRegistry);
}

export function getBrickDefinition(id: string): BrickDefinition | undefined {
  return brickRegistry[id];
}
