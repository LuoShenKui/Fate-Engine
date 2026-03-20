import { existsSync, readFileSync } from "node:fs";

const panelSource = readFileSync(new URL("../src/ui/GraphCanvasPanel.tsx", import.meta.url), "utf8");
const cameraPath = new URL("../src/ui/graph-canvas-camera.ts", import.meta.url);

if (!existsSync(cameraPath)) {
  console.error("[graph-camera-home] expected graph-canvas-camera.ts to exist");
  process.exit(1);
}

const cameraSource = readFileSync(cameraPath, "utf8");

const requirements = [
  panelSource.includes("createEditorHomeCamera"),
  panelSource.includes("lastPlaytestFullscreenRef"),
  panelSource.includes("handleCameraModeChange"),
  panelSource.includes("pointerRef.current = null"),
  panelSource.includes('handleCameraModeChange("editor")'),
  cameraSource.includes('!entity.id.startsWith("showcase-")'),
];

if (requirements.some((passed) => !passed)) {
  console.error("[graph-camera-home] expected editor camera home/reset flow to be present");
  process.exit(1);
}

console.log("[graph-camera-home] ok");
