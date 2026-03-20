import { readFileSync } from "node:fs";

const demoScene = JSON.parse(readFileSync(new URL("../src/workflow/demoSceneData.json", import.meta.url), "utf8"));
const appSceneSource = readFileSync(new URL("../src/ui/app-scene.ts", import.meta.url), "utf8");
const layoutSource = readFileSync(new URL("../src/ui/forest-demo-layout.ts", import.meta.url), "utf8");
const cameraSource = readFileSync(new URL("../src/ui/graph-canvas-camera.ts", import.meta.url), "utf8");

const nodeById = new Map(demoScene.nodes.map((node) => [node.id, node]));
const frontDoor = nodeById.get("door-1");
const entryZone = nodeById.get("trigger-zone-1");
const insideDoor = nodeById.get("door-2");
const insideSwitch = nodeById.get("switch-1");
const ladder = nodeById.get("ladder-1");
const container = nodeById.get("container-1");
const checkpoint = nodeById.get("checkpoint-1");
const teleport = nodeById.get("teleport-1");
const patrolGuard = nodeById.get("patrol-guard-1");

const checks = [
  Array.isArray(frontDoor?.transform?.position) && frontDoor.transform.position.join(",") === "0,0,2.8",
  Array.isArray(entryZone?.transform?.position) && entryZone.transform.position.join(",") === "0,0,6.2",
  Array.isArray(insideDoor?.transform?.position) && insideDoor.transform.position.join(",") === "4.2,0,-2.5",
  Array.isArray(insideSwitch?.transform?.position) && insideSwitch.transform.position.join(",") === "5.8,0,-6.2",
  Array.isArray(ladder?.transform?.position) && ladder.transform.position.join(",") === "-5.2,0,-6.2",
  Array.isArray(container?.transform?.position) && container.transform.position.join(",") === "-8.6,0,7.8",
  Array.isArray(checkpoint?.transform?.position) && checkpoint.transform.position.join(",") === "-3.1,0,7.8",
  Array.isArray(teleport?.transform?.position) && teleport.transform.position.join(",") === "2.4,0,7.8",
  Array.isArray(patrolGuard?.transform?.position) && patrolGuard.transform.position.join(",") === "7.9,0,7.8",
  layoutSource.includes("FOREST_CABIN_WALL_HEIGHT = 4.2"),
  layoutSource.includes("FOREST_TEST_PAD_ORIGINS"),
  appSceneSource.includes("buildForestDemoModule"),
  appSceneSource.includes("offsetPreviewScene"),
  !appSceneSource.includes("id: `yard-${entry.id}`"),
  !appSceneSource.includes("showcase-${entry.id}"),
  !cameraSource.includes('startsWith("yard-")'),
];

if (checks.some((passed) => !passed)) {
  console.error("[forest-demo-scale] expected rebuilt forest demo anchors and visible catalog coverage to be present");
  process.exit(1);
}

console.log("[forest-demo-scale] ok");
