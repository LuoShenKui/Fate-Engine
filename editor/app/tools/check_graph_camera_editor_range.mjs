import { readFileSync } from "node:fs";

const cameraSource = readFileSync(new URL("../src/ui/graph-canvas-camera.ts", import.meta.url), "utf8");
const panelSource = readFileSync(new URL("../src/ui/GraphCanvasPanel.tsx", import.meta.url), "utf8");

const requirements = [
  cameraSource.includes("pitch: 0.98"),
  cameraSource.includes("EDITOR_ACTOR_ANCHOR: Vec3 = [0, 0, 10]"),
  panelSource.includes("Math.max(5.4, Math.min(18, cameraRef.current.distance - event.deltaY * 0.01))"),
  panelSource.includes("{webglState === \"ready\" ? \"render ok\" : `render:${webglState}`}"),
];

if (requirements.some((passed) => !passed)) {
  console.error("[graph-camera-editor-range] expected higher editor home pitch, wider zoom-out range, and calmer render status copy");
  process.exit(1);
}

console.log("[graph-camera-editor-range] ok");
