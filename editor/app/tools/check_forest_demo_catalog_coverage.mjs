import { readFileSync } from "node:fs";

const demoScene = JSON.parse(readFileSync(new URL("../src/workflow/demoSceneData.json", import.meta.url), "utf8"));
const appSceneSource = readFileSync(new URL("../src/ui/app-scene.ts", import.meta.url), "utf8");
const cameraSource = readFileSync(new URL("../src/ui/graph-canvas-camera.ts", import.meta.url), "utf8");

const nodeTypes = new Set(demoScene.nodes.map((node) => node.type));
const requiredVisibleTypes = [
  "door",
  "switch",
  "ladder",
  "trigger-zone",
  "container",
  "checkpoint",
  "teleport",
  "patrol-guard",
];

const missingTypes = requiredVisibleTypes.filter((type) => !nodeTypes.has(type));
const stillUsesHiddenYardNodes = appSceneSource.includes("id: `yard-${entry.id}`");
const stillFiltersDemoNodesFromCamera = cameraSource.includes('startsWith("yard-")');

if (missingTypes.length > 0 || stillUsesHiddenYardNodes || stillFiltersDemoNodesFromCamera) {
  console.error(
    `[forest-demo-catalog-coverage] missing=${missingTypes.join(",") || "none"} hiddenYard=${stillUsesHiddenYardNodes} filteredByCamera=${stillFiltersDemoNodesFromCamera}`,
  );
  process.exit(1);
}

console.log("[forest-demo-catalog-coverage] ok");
