export type CanvasTransform = {
  position?: [number, number, number];
  rotation?: [number, number, number];
};

export type CanvasNodeMeta = {
  grantedAbilityPackageIds?: string[];
  compositeParentId?: string;
  patrolRoutePoints?: Array<[number, number, number]>;
};

export type CanvasNode = {
  id: string;
  type?: string;
  transform?: CanvasTransform;
  meta?: CanvasNodeMeta;
};

export type CanvasEdge = {
  from: string;
  to: string;
};

export type DoorVisualEntity = {
  id: string;
  kind: "door";
  transform: Required<CanvasTransform>;
  collider: {
    shape: "box";
    size: [number, number, number];
  };
};

export type TriggerZoneVisualEntity = {
  id: string;
  kind: "trigger-zone";
  transform: Required<CanvasTransform>;
  volume: {
    size: [number, number, number];
  };
};

export type GenericVisualEntity = {
  id: string;
  kind: "generic";
  transform: Required<CanvasTransform>;
  size: [number, number, number];
  color: [number, number, number, number];
};

export type SwitchVisualEntity = {
  id: string;
  kind: "switch";
  transform: Required<CanvasTransform>;
  size: [number, number, number];
};

export type LadderVisualEntity = {
  id: string;
  kind: "ladder";
  transform: Required<CanvasTransform>;
  size: [number, number, number];
};

export type EnemyVisualEntity = {
  id: string;
  kind: "enemy";
  transform: Required<CanvasTransform>;
  size: [number, number, number];
  patrolRoutePoints: Array<[number, number, number]>;
};

export type GraphCanvasPanelProps = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  onChange: (next: { nodes: CanvasNode[]; edges: CanvasEdge[] }) => void;
  resolveNodeKind?: (nodeType?: string) => "door" | "switch" | "ladder" | "trigger-zone" | "enemy" | "generic";
  defaultNodeType?: string;
  onSelectNode?: (nodeId: string) => void;
  onInteract?: (nodeId: string) => void;
  onTriggerZoneStateChange?: (zoneId: string, occupied: boolean) => void;
  onDoorPositionsChange?: (next: Record<string, [number, number, number]>) => void;
  onActorPositionChange?: (position: [number, number, number]) => void;
  onDropBrick?: (brickId: string, position?: [number, number, number]) => void;
  onExitPlaytestFullscreen?: () => void;
  onViewportEvent?: (text: string) => void;
  actorLabel?: string;
  activeAbilityNames?: string[];
  worldLabels?: GraphCanvasWorldLabel[];
  playtestFullscreen?: boolean;
};

export type GraphCanvasWorldLabel = {
  id: string;
  title: string;
  subtitle?: string;
  tone?: "neutral" | "ability" | "interactive";
};

export type CameraState = {
  yaw: number;
  pitch: number;
  distance: number;
  target: [number, number, number];
};
export type CameraMode = "editor" | "first" | "third";

const defaultTransform: Required<CanvasTransform> = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
};

export const toDoorEntity = (node: CanvasNode, index: number): DoorVisualEntity => ({
  id: node.id,
  kind: "door",
  transform: {
    position: node.transform?.position ?? [index * 2.4, 0, 0],
    rotation: node.transform?.rotation ?? defaultTransform.rotation,
  },
  collider: {
    shape: "box",
    size: [1.2, 2.4, 0.24],
  },
});

export const toTriggerZoneEntity = (node: CanvasNode, index: number): TriggerZoneVisualEntity => ({
  id: node.id,
  kind: "trigger-zone",
  transform: {
    position: node.transform?.position ?? [0, 0, index === 0 ? 2.2 : index * 2.8],
    rotation: node.transform?.rotation ?? defaultTransform.rotation,
  },
  volume: {
    size: [4.2, 0.05, 3.2],
  },
});

export const toGenericEntity = (node: CanvasNode, index: number): GenericVisualEntity => ({
  id: node.id,
  kind: "generic",
  transform: {
    position: node.transform?.position ?? [index * 1.8 - 1.8, 0, -4.2],
    rotation: node.transform?.rotation ?? defaultTransform.rotation,
  },
  size:
    node.type === "container"
      ? [0.95, 0.78, 0.95]
      : node.type === "checkpoint"
        ? [0.72, 1.45, 0.72]
        : node.type === "teleport"
          ? [1.35, 2.1, 1.35]
          : [0.48, 0.92, 0.48],
  color:
    node.type === "container"
      ? [0.68, 0.47, 0.24, 1]
      : node.type === "checkpoint"
        ? [0.25, 0.78, 0.86, 1]
        : node.type === "teleport"
          ? [0.47, 0.52, 0.95, 1]
          : [0.49, 0.52, 0.56, 1],
});

export const toSwitchEntity = (node: CanvasNode): SwitchVisualEntity => ({
  id: node.id,
  kind: "switch",
  transform: {
    position: node.transform?.position ?? [3.8, 0, 4.6],
    rotation: node.transform?.rotation ?? defaultTransform.rotation,
  },
  size: [0.34, 0.5, 0.34],
});

export const toLadderEntity = (node: CanvasNode): LadderVisualEntity => ({
  id: node.id,
  kind: "ladder",
  transform: {
    position: node.transform?.position ?? [-4.2, 0, -2.8],
    rotation: node.transform?.rotation ?? defaultTransform.rotation,
  },
  size: [0.46, 2.8, 0.18],
});

export const toEnemyEntity = (node: CanvasNode, index: number): EnemyVisualEntity => ({
  id: node.id,
  kind: "enemy",
  transform: {
    position: node.transform?.position ?? [index * 1.2 - 0.8, 0, 2.4],
    rotation: node.transform?.rotation ?? defaultTransform.rotation,
  },
  size: [0.48, 1.2, 0.48],
  patrolRoutePoints: node.meta?.patrolRoutePoints ?? [
    [node.transform?.position?.[0] ?? 0, 0, (node.transform?.position?.[2] ?? 2.4) - 1.2],
    [node.transform?.position?.[0] ?? 0, 0, (node.transform?.position?.[2] ?? 2.4) + 1.2],
  ],
});
