import type { BrickCatalogEntry } from "./app-types";
import type { Vec3 } from "./graph-canvas-math";

export const FOREST_WORLD_HALF_EXTENT = 15.5;
export const FOREST_CABIN_WALL_HEIGHT = 4.2;
export const FOREST_CABIN_WALL_THICKNESS = 0.16;
export const FOREST_CABIN_ROOF_Y = 4.46;

export const FOREST_TREE_POSITIONS: Vec3[] = [
  [-11.8, 0, -10.4],
  [-9.4, 0, -8.1],
  [9.6, 0, -10.2],
  [11.1, 0, -7.6],
  [-10.7, 0, 10.3],
  [10.5, 0, 10.8],
];

export const FOREST_CABIN_WALLS: Array<{ center: Vec3; size: [number, number, number]; tone: "outer" | "inner" }> = [
  { center: [0, FOREST_CABIN_WALL_HEIGHT * 0.5, -7.8], size: [14.2, FOREST_CABIN_WALL_HEIGHT, 0.2], tone: "outer" },
  { center: [-6.7, FOREST_CABIN_WALL_HEIGHT * 0.5, -2.5], size: [0.2, FOREST_CABIN_WALL_HEIGHT, 10.8], tone: "outer" },
  { center: [6.7, FOREST_CABIN_WALL_HEIGHT * 0.5, -2.5], size: [0.2, FOREST_CABIN_WALL_HEIGHT, 10.8], tone: "outer" },
  { center: [-4.4, FOREST_CABIN_WALL_HEIGHT * 0.5, 2.8], size: [4.8, FOREST_CABIN_WALL_HEIGHT, 0.16], tone: "outer" },
  { center: [4.4, FOREST_CABIN_WALL_HEIGHT * 0.5, 2.8], size: [4.8, FOREST_CABIN_WALL_HEIGHT, 0.16], tone: "outer" },
  { center: [0, FOREST_CABIN_WALL_HEIGHT * 0.5, -2.5], size: [8.6, FOREST_CABIN_WALL_HEIGHT, 0.16], tone: "inner" },
  { center: [4.2, FOREST_CABIN_WALL_HEIGHT * 0.5, -5.0], size: [0.16, FOREST_CABIN_WALL_HEIGHT, 5.2], tone: "inner" },
];

export const FOREST_TEST_PAD_ORIGINS: Vec3[] = [
  [-8.6, 0, 7.8],
  [-3.1, 0, 7.8],
  [2.4, 0, 7.8],
  [7.9, 0, 7.8],
  [-8.6, 0, 12.1],
  [-3.1, 0, 12.1],
  [2.4, 0, 12.1],
  [7.9, 0, 12.1],
];

const yardOffsetByCategory = (entry: BrickCatalogEntry): Vec3 => {
  if (entry.category === "ability") return [0, 0, -0.4];
  if (entry.category === "enemy") return [0.3, 0, 0.2];
  if (entry.category === "composite") return [0.2, 0, 0.6];
  return [0, 0, 0];
};

export const getForestDemoPlacement = (entry: BrickCatalogEntry, index: number): Vec3 => {
  const base = FOREST_TEST_PAD_ORIGINS[index % FOREST_TEST_PAD_ORIGINS.length] ?? [0, 0, 10.5];
  const offset = yardOffsetByCategory(entry);
  return [base[0] + offset[0], base[1] + offset[1], base[2] + offset[2]];
};
