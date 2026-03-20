import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/ui/graph-canvas-camera.ts", import.meta.url), "utf8");

const hasShowcaseFilter = source.includes('!entity.id.startsWith("showcase-")');
const hasPrimaryOrbitPositions = source.includes("primaryPositions");

if (!hasShowcaseFilter || !hasPrimaryOrbitPositions) {
  console.error("[graph-camera-focus] expected editor orbit camera to ignore showcase nodes");
  process.exit(1);
}

console.log("[graph-camera-focus] ok");
