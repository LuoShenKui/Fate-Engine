import type { BrickDefinition } from "./brick";
import {
  DoorBrickDefinition,
  LadderBrickDefinition,
  TriggerZoneBrickDefinition,
} from "./door";

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
