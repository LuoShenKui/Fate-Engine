import type { CanvasEdge, CanvasNode } from "../ui/GraphCanvasPanel";
import { DOOR_LINK_ACTIONS, type DoorLinkAction } from "./interactionContract";

export type DoorSyncState = "Closed" | "Open" | "Locked";

export type TriggerZoneDoorAction = {
  doorId: string;
  action: DoorLinkAction;
  shouldToggle: boolean;
  previousState: DoorSyncState;
};

export const getLinkedDoorIds = (nodes: CanvasNode[], edges: CanvasEdge[], sourceId: string): string[] =>
  edges
    .filter((edge) => edge.from === sourceId)
    .map((edge) => edge.to)
    .filter((targetId): targetId is string => nodes.some((node) => node.id === targetId && node.type === "door"));

export const planTriggerZoneDoorActions = (
  linkedDoorIds: string[],
  occupied: boolean,
  getDoorState: (doorId: string) => DoorSyncState,
): TriggerZoneDoorAction[] =>
  linkedDoorIds.map((doorId) => {
    const previousState = getDoorState(doorId);
    const action = occupied ? DOOR_LINK_ACTIONS[0] : DOOR_LINK_ACTIONS[1];
    const shouldToggle = occupied ? previousState !== "Open" : previousState === "Open";
    return {
      doorId,
      action,
      shouldToggle,
      previousState,
    };
  });
