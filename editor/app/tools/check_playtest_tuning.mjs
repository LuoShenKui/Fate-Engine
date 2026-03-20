import { readFileSync } from "node:fs";

const typesSource = readFileSync(new URL("../src/ui/graph-canvas-types.ts", import.meta.url), "utf8");
const playtestSource = readFileSync(new URL("../src/ui/graph-canvas-playtest.ts", import.meta.url), "utf8");
const cameraSource = readFileSync(new URL("../src/ui/graph-canvas-camera.ts", import.meta.url), "utf8");
const hudSource = readFileSync(new URL("../src/ui/graph-canvas-hud.tsx", import.meta.url), "utf8");

const requirements = [
  typesSource.includes("size: [1.2, 2.4, 0.24]"),
  typesSource.includes("size: [0.46, 2.8, 0.18]"),
  typesSource.includes('node.type === "container"'),
  typesSource.includes('node.type === "checkpoint"'),
  typesSource.includes('node.type === "teleport"'),
  playtestSource.includes("const LADDER_SPEED = 4.2;"),
  playtestSource.includes("const MOVE_SPEED = 4.6;"),
  playtestSource.includes("const PLAYER_HALF: Vec3 = [0.28, 0.9, 0.28];"),
  playtestSource.includes("const isDoorBlocking = (door: DoorVisualEntity, openness: number): boolean => openness < 0.88;"),
  playtestSource.includes("const blocked = getBlocked(doorEntities, doorAnim);"),
  cameraSource.includes("Math.max(16.5, Math.min(22, distance))"),
  cameraSource.includes("pitch: 0.98"),
  hudSource.includes("Speed "),
];

if (requirements.some((passed) => !passed)) {
  console.error("[playtest-tuning] expected human-scale movement, collision release, HUD speed telemetry, and higher editor orbit defaults");
  process.exit(1);
}

console.log("[playtest-tuning] ok");
