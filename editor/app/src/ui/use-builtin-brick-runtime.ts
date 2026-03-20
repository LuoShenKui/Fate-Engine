import { useEffect, useRef } from "react";
import type { CanvasNode } from "./GraphCanvasPanel";
import { getAbilitySourceOccupancy, getDoorProximityNodeIds } from "./app-runtime-proximity";
import type { BrickCatalogEntry } from "./app-types";
import type { DoorSceneComponent } from "../runtime/doorScene";

type UseBuiltinBrickRuntimeArgs = {
  playMode: boolean;
  actorPosition: [number, number, number];
  nodes: CanvasNode[];
  catalogEntries: BrickCatalogEntry[];
  sceneDoorMap: Map<string, DoorSceneComponent>;
  onInteract: (nodeId: string) => void;
  syncGrantedAbilitiesForSource: (sourceNodeId: string, occupied: boolean) => void;
};

export const useBuiltinBrickRuntime = ({
  playMode,
  actorPosition,
  nodes,
  catalogEntries,
  sceneDoorMap,
  onInteract,
  syncGrantedAbilitiesForSource,
}: UseBuiltinBrickRuntimeArgs): void => {
  const activeDoorProximityRef = useRef<Set<string>>(new Set());
  const activeAbilitySourceRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!playMode) {
      Object.entries(activeAbilitySourceRef.current).forEach(([sourceNodeId, occupied]) => {
        if (occupied) syncGrantedAbilitiesForSource(sourceNodeId, false);
      });
      activeDoorProximityRef.current = new Set();
      activeAbilitySourceRef.current = {};
      return;
    }

    const nextDoorIds = new Set(getDoorProximityNodeIds({ actorPosition, nodes, catalogEntries }));
    nextDoorIds.forEach((doorId) => {
      if (!activeDoorProximityRef.current.has(doorId) && (sceneDoorMap.get(doorId)?.syncToProtocol() ?? "Closed") === "Closed") {
        onInteract(doorId);
      }
    });
    activeDoorProximityRef.current = nextDoorIds;

    const nextAbilityOccupancy = getAbilitySourceOccupancy({ actorPosition, nodes, catalogEntries });
    const sourceIds = new Set([...Object.keys(activeAbilitySourceRef.current), ...Object.keys(nextAbilityOccupancy)]);
    sourceIds.forEach((sourceNodeId) => {
      const previous = activeAbilitySourceRef.current[sourceNodeId] === true;
      const next = nextAbilityOccupancy[sourceNodeId] === true;
      if (previous !== next) syncGrantedAbilitiesForSource(sourceNodeId, next);
    });
    activeAbilitySourceRef.current = nextAbilityOccupancy;
  }, [actorPosition, catalogEntries, nodes, onInteract, playMode, sceneDoorMap, syncGrantedAbilitiesForSource]);
};
