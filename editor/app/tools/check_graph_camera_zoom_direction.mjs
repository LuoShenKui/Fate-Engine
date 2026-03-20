import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/ui/GraphCanvasPanel.tsx", import.meta.url), "utf8");

const hasCorrectZoomDirection = source.includes("cameraRef.current.distance - event.deltaY * 0.01");

if (!hasCorrectZoomDirection) {
  console.error("[graph-camera-zoom] expected wheel zoom to decrease distance on zoom-in gestures");
  process.exit(1);
}

console.log("[graph-camera-zoom] ok");
