import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scenePath = path.join(appDir, "src", "workflow", "demoSceneData.json");
const scene = JSON.parse(fs.readFileSync(scenePath, "utf8"));

const nodes = Array.isArray(scene.nodes) ? scene.nodes : [];
const edges = Array.isArray(scene.edges) ? scene.edges : [];

const doorIds = nodes.filter((node) => node.type === "door").map((node) => node.id);
const triggerZoneIds = nodes.filter((node) => node.type === "trigger-zone").map((node) => node.id);
const switchIds = nodes.filter((node) => node.type === "switch").map((node) => node.id);
const ladderIds = nodes.filter((node) => node.type === "ladder").map((node) => node.id);
const nodeTypeById = new Map(nodes.map((node) => [node.id, node.type]));

const getLinkedDoorIds = (zoneId) =>
  edges
    .filter((edge) => edge.from === zoneId)
    .map((edge) => edge.to)
    .filter((targetId) => nodeTypeById.get(targetId) === "door");

const planActions = (zoneId, occupied, doorStates) =>
  getLinkedDoorIds(zoneId).map((doorId) => {
    const previousState = doorStates.get(doorId) ?? "Closed";
    return {
      zoneId,
      doorId,
      action: occupied ? "open_on_enter" : "close_on_exit",
      shouldToggle: occupied ? previousState !== "Open" : previousState === "Open",
      previousState,
    };
  });

const failures = [];

if (doorIds.length < 2 || triggerZoneIds.length < 2) {
  failures.push(`expected at least 2 doors and 2 trigger zones, got doors=${doorIds.length}, zones=${triggerZoneIds.length}`);
}

for (const zoneId of triggerZoneIds) {
  const initialStates = new Map(doorIds.map((doorId) => [doorId, "Closed"]));
  const enterActions = planActions(zoneId, true, initialStates);
  const toggledDoorIdsOnEnter = enterActions.filter((action) => action.shouldToggle).map((action) => action.doorId);

  if (toggledDoorIdsOnEnter.length !== 1) {
    failures.push(`zone ${zoneId} should toggle exactly 1 door on enter, got ${toggledDoorIdsOnEnter.length}`);
    continue;
  }

  const linkedDoorId = toggledDoorIdsOnEnter[0];
  initialStates.set(linkedDoorId, "Open");
  const exitActions = planActions(zoneId, false, initialStates);
  const toggledDoorIdsOnExit = exitActions.filter((action) => action.shouldToggle).map((action) => action.doorId);

  if (toggledDoorIdsOnExit.length !== 1 || toggledDoorIdsOnExit[0] !== linkedDoorId) {
    failures.push(`zone ${zoneId} should close only ${linkedDoorId} on exit, got ${toggledDoorIdsOnExit.join(",") || "none"}`);
  }

  const unrelatedDoorIds = doorIds.filter((doorId) => doorId !== linkedDoorId);
  const unrelatedTouched = enterActions.some((action) => unrelatedDoorIds.includes(action.doorId) && action.shouldToggle)
    || exitActions.some((action) => unrelatedDoorIds.includes(action.doorId) && action.shouldToggle);

  if (unrelatedTouched) {
    failures.push(`zone ${zoneId} should not toggle unrelated doors`);
  }
}

for (const switchId of switchIds) {
  const initialStates = new Map(doorIds.map((doorId) => [doorId, "Closed"]));
  const switchActions = planActions(switchId, true, initialStates);
  const toggledDoorIds = switchActions.filter((action) => action.shouldToggle).map((action) => action.doorId);

  if (toggledDoorIds.length !== 1) {
    failures.push(`switch ${switchId} should toggle exactly 1 door on use, got ${toggledDoorIds.length}`);
    continue;
  }

  const linkedDoorId = toggledDoorIds[0];
  const unrelatedDoorIds = doorIds.filter((doorId) => doorId !== linkedDoorId);
  const unrelatedTouched = switchActions.some((action) => unrelatedDoorIds.includes(action.doorId) && action.shouldToggle);
  if (unrelatedTouched) {
    failures.push(`switch ${switchId} should not toggle unrelated doors`);
  }
}

for (const ladderId of ladderIds) {
  const initialStates = new Map(doorIds.map((doorId) => [doorId, "Closed"]));
  const ladderActions = planActions(ladderId, true, initialStates);
  const toggledDoorIds = ladderActions.filter((action) => action.shouldToggle).map((action) => action.doorId);

  if (toggledDoorIds.length !== 1) {
    failures.push(`ladder ${ladderId} should toggle exactly 1 door on climb, got ${toggledDoorIds.length}`);
    continue;
  }

  const linkedDoorId = toggledDoorIds[0];
  const unrelatedDoorIds = doorIds.filter((doorId) => doorId !== linkedDoorId);
  const unrelatedTouched = ladderActions.some((action) => unrelatedDoorIds.includes(action.doorId) && action.shouldToggle);
  if (unrelatedTouched) {
    failures.push(`ladder ${ladderId} should not toggle unrelated doors`);
  }
}

if (failures.length > 0) {
  console.error("[scene-behavior] failed");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `[scene-behavior] ok zones=${triggerZoneIds.length} switches=${switchIds.length} ladders=${ladderIds.length} doors=${doorIds.length} checks=${[
    ...triggerZoneIds.map((zoneId) => `${zoneId}->${getLinkedDoorIds(zoneId).join(",")}`),
    ...switchIds.map((switchId) => `${switchId}->${getLinkedDoorIds(switchId).join(",")}`),
    ...ladderIds.map((ladderId) => `${ladderId}->${getLinkedDoorIds(ladderId).join(",")}`),
  ]
    .join(" ")}`,
);
