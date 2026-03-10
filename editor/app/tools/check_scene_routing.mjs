import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scenePath = path.join(appDir, "src", "workflow", "demoSceneData.json");
const scene = JSON.parse(fs.readFileSync(scenePath, "utf8"));

const nodes = Array.isArray(scene.nodes) ? scene.nodes : [];
const edges = Array.isArray(scene.edges) ? scene.edges : [];

const nodeTypeById = new Map(nodes.map((node) => [node.id, node.type]));
const triggerZones = nodes.filter((node) => node.type === "trigger-zone");
const switches = nodes.filter((node) => node.type === "switch");
const ladders = nodes.filter((node) => node.type === "ladder");
const doors = nodes.filter((node) => node.type === "door");

const failures = [];

if (doors.length < 2) {
  failures.push(`expected at least 2 doors, got ${doors.length}`);
}

if (triggerZones.length < 2) {
  failures.push(`expected at least 2 trigger zones, got ${triggerZones.length}`);
}

const linkedDoorIdsByZone = new Map(
  triggerZones.map((zone) => [
    zone.id,
    edges
      .filter((edge) => edge.from === zone.id)
      .map((edge) => edge.to)
      .filter((targetId) => nodeTypeById.get(targetId) === "door"),
  ]),
);

const linkedDoorIdsBySwitch = new Map(
  switches.map((switchNode) => [
    switchNode.id,
    edges
      .filter((edge) => edge.from === switchNode.id)
      .map((edge) => edge.to)
      .filter((targetId) => nodeTypeById.get(targetId) === "door"),
  ]),
);

const linkedDoorIdsByLadder = new Map(
  ladders.map((ladderNode) => [
    ladderNode.id,
    edges
      .filter((edge) => edge.from === ladderNode.id)
      .map((edge) => edge.to)
      .filter((targetId) => nodeTypeById.get(targetId) === "door"),
  ]),
);

for (const zone of triggerZones) {
  const linkedDoorIds = linkedDoorIdsByZone.get(zone.id) ?? [];
  if (linkedDoorIds.length !== 1) {
    failures.push(`zone ${zone.id} should link exactly 1 door, got ${linkedDoorIds.length}`);
  }
}

for (const switchNode of switches) {
  const linkedDoorIds = linkedDoorIdsBySwitch.get(switchNode.id) ?? [];
  if (linkedDoorIds.length !== 1) {
    failures.push(`switch ${switchNode.id} should link exactly 1 door, got ${linkedDoorIds.length}`);
  }
}

for (const ladderNode of ladders) {
  const linkedDoorIds = linkedDoorIdsByLadder.get(ladderNode.id) ?? [];
  if (linkedDoorIds.length !== 1) {
    failures.push(`ladder ${ladderNode.id} should link exactly 1 door, got ${linkedDoorIds.length}`);
  }
}

const allLinkedDoors = Array.from(linkedDoorIdsByZone.values()).flat();
const uniqueLinkedDoors = new Set(allLinkedDoors);
if (allLinkedDoors.length !== uniqueLinkedDoors.size) {
  failures.push("expected trigger zones to target distinct doors, but found duplicate door routing");
}

if (failures.length > 0) {
  console.error("[scene-routing] failed");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `[scene-routing] ok zones=${triggerZones.length} switches=${switches.length} ladders=${ladders.length} doors=${doors.length} routes=${[
    ...Array.from(linkedDoorIdsByZone.entries()).map(([zoneId, targetIds]) => `${zoneId}->${targetIds.join(",")}`),
    ...Array.from(linkedDoorIdsBySwitch.entries()).map(([switchId, targetIds]) => `${switchId}->${targetIds.join(",")}`),
    ...Array.from(linkedDoorIdsByLadder.entries()).map(([ladderId, targetIds]) => `${ladderId}->${targetIds.join(",")}`),
  ]
    .join(" ")}`,
);
