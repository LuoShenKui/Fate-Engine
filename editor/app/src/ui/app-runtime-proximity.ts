import type { CanvasNode } from "./GraphCanvasPanel";
import type { BrickCatalogEntry } from "./app-types";

const distanceTo = (from: [number, number, number], to: [number, number, number]): number => Math.hypot(from[0] - to[0], from[1] - to[1], from[2] - to[2]);

export const getDoorProximityNodeIds = ({
  actorPosition,
  nodes,
  catalogEntries,
  radius = 1.6,
}: {
  actorPosition: [number, number, number];
  nodes: CanvasNode[];
  catalogEntries: BrickCatalogEntry[];
  radius?: number;
}): string[] =>
  nodes
    .filter((node) => catalogEntries.find((entry) => entry.id === node.type)?.runtimeKind === "door")
    .filter((node) => distanceTo(actorPosition, node.transform?.position ?? [0, 0, 0]) <= radius)
    .map((node) => node.id);

export const getAbilitySourceOccupancy = ({
  actorPosition,
  nodes,
  catalogEntries,
  radius = 1.4,
}: {
  actorPosition: [number, number, number];
  nodes: CanvasNode[];
  catalogEntries: BrickCatalogEntry[];
  radius?: number;
}): Record<string, boolean> =>
  nodes.reduce<Record<string, boolean>>((acc, node) => {
    const entry = catalogEntries.find((candidate) => candidate.id === node.type);
    const grants = node.meta?.grantedAbilityPackageIds ?? entry?.grantedAbilityPackageIds ?? [];
    if ((entry?.category !== "ability" && grants.length === 0) || !Array.isArray(node.transform?.position)) {
      return acc;
    }
    acc[node.id] = distanceTo(actorPosition, node.transform.position) <= radius;
    return acc;
  }, {});
