import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/ui/GraphCanvasPanel.tsx", import.meta.url), "utf8");

const requirements = [
  source.includes("const resolveNodeKindRef = useRef(resolveNodeKind), onSelectNodeRef = useRef(onSelectNode), onInteractRef = useRef(onInteract), onTriggerZoneStateChangeRef = useRef(onTriggerZoneStateChange), onDoorPositionsChangeRef = useRef(onDoorPositionsChange), onActorPositionChangeRef = useRef(onActorPositionChange);"),
  source.includes("const doorEntities = useMemo(() => nodes.filter((node) => toKind(node.type) === \"door\").map(toDoorEntity), [nodes]);"),
  !source.includes("[nodes, resolveNodeKind]"),
  !source.includes("[doorEntities, ladderEntities, onInteract, onSelectNode, switchEntities, triggerZoneEntities]"),
  !source.includes("[cameraMode, doorEntities, enemyEntities, genericEntities, ladderEntities, onActorPositionChange, onTriggerZoneStateChange, switchEntities, triggerZoneEntities]"),
];

if (requirements.some((passed) => !passed)) {
  console.error("[graph-canvas-stable-runtime-loop] expected GraphCanvasPanel to decouple runtime loop from unstable app callbacks");
  process.exit(1);
}

console.log("[graph-canvas-stable-runtime-loop] ok");
