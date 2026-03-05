import type { BrickDefinition } from "./brick";
import {
  DoorBrickDefinition,
  LadderBrickDefinition,
  TriggerZoneBrickDefinition,
  SwitchBrickDefinition,
  ContainerBrickDefinition,
  CheckpointBrickDefinition,
  TeleportBrickDefinition,
} from "./door";

const brickRegistry: Record<string, BrickDefinition> = {
  [DoorBrickDefinition.id]: DoorBrickDefinition,
  [LadderBrickDefinition.id]: LadderBrickDefinition,
  [TriggerZoneBrickDefinition.id]: TriggerZoneBrickDefinition,
  [SwitchBrickDefinition.id]: SwitchBrickDefinition,
  [ContainerBrickDefinition.id]: ContainerBrickDefinition,
  [CheckpointBrickDefinition.id]: CheckpointBrickDefinition,
  [TeleportBrickDefinition.id]: TeleportBrickDefinition,
};

export function listBrickDefinitions(): BrickDefinition[] {
  return Object.values(brickRegistry);
}

export function getBrickDefinition(id: string): BrickDefinition | undefined {
  return brickRegistry[id];
}
