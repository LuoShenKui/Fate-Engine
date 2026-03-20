import type { CameraMode, DoorVisualEntity, LadderVisualEntity, SwitchVisualEntity, TriggerZoneVisualEntity } from "./graph-canvas-types";
import { collidesWithAabb, TREE_POSITIONS } from "./graph-canvas-renderer";
import { vec3Normalize, type Vec3 } from "./graph-canvas-math";
import { FOREST_CABIN_WALLS, FOREST_WORLD_HALF_EXTENT } from "./forest-demo-layout";

export type ActorInputState = {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  ascend: boolean;
  descend: boolean;
};

export type ActorPhysicsState = {
  position: Vec3;
  verticalVelocity: number;
  grounded: boolean;
  onLadder: boolean;
};

export type InteractionTarget = {
  id: string;
  kind: "door" | "switch" | "ladder" | "trigger-zone";
  prompt: string;
};

const FLOOR_Y = 0;
const JUMP_SPEED = 5.4;
const GRAVITY = 14;
const LADDER_SPEED = 4.2;
const MOVE_SPEED = 4.6;
const PLAYER_HALF: Vec3 = [0.28, 0.9, 0.28];

const slideMove = (from: Vec3, delta: Vec3, blocked: (candidate: Vec3) => boolean): Vec3 => {
  const candidateX: Vec3 = [from[0] + delta[0], from[1], from[2]];
  const nextX = blocked(candidateX) ? from : candidateX;
  const candidateZ: Vec3 = [nextX[0], from[1], nextX[2] + delta[2]];
  return blocked(candidateZ) ? nextX : candidateZ;
};

const isDoorBlocking = (door: DoorVisualEntity, openness: number): boolean => openness < 0.88;

const getBlocked = (doorEntities: DoorVisualEntity[], doorAnim: Record<string, { current: number; target: number }>) => (candidate: Vec3): boolean => {
  const walls: Array<{ center: Vec3; half: Vec3 }> = [
    { center: [0, 1.2, -FOREST_WORLD_HALF_EXTENT], half: [FOREST_WORLD_HALF_EXTENT + 0.1, 1.2, 0.18] },
    { center: [0, 1.2, FOREST_WORLD_HALF_EXTENT], half: [FOREST_WORLD_HALF_EXTENT + 0.1, 1.2, 0.18] },
    { center: [-FOREST_WORLD_HALF_EXTENT, 1.2, 0], half: [0.18, 1.2, FOREST_WORLD_HALF_EXTENT + 0.1] },
    { center: [FOREST_WORLD_HALF_EXTENT, 1.2, 0], half: [0.18, 1.2, FOREST_WORLD_HALF_EXTENT + 0.1] },
    ...FOREST_CABIN_WALLS.map((wall) => ({ center: wall.center, half: [wall.size[0] * 0.5, wall.size[1] * 0.5, wall.size[2] * 0.5] as Vec3 })),
  ];
  const trees = TREE_POSITIONS.map((pos) => ({ center: [pos[0], 0.6, pos[2]] as Vec3, half: [0.45, 0.6, 0.45] as Vec3 }));
  const closedDoors = doorEntities.flatMap((door) => {
    const openness = doorAnim[door.id]?.current ?? 0;
    return isDoorBlocking(door, openness) ? [{ center: [door.transform.position[0] + 0.6, 1, door.transform.position[2]] as Vec3, half: [0.6, 1, 0.35] as Vec3 }] : [];
  });
  return [...walls, ...trees, ...closedDoors].some((obstacle) =>
    collidesWithAabb(candidate, obstacle.center, [obstacle.half[0] + PLAYER_HALF[0], obstacle.half[1], obstacle.half[2] + PLAYER_HALF[2]]),
  );
};

export const updateActorPhysics = ({
  state,
  input,
  dt,
  heading,
  cameraMode,
  doorEntities,
  doorAnim,
  ladderEntities,
}: {
  state: ActorPhysicsState;
  input: ActorInputState;
  dt: number;
  heading: number;
  cameraMode: CameraMode;
  doorEntities: DoorVisualEntity[];
  doorAnim: Record<string, { current: number; target: number }>;
  ladderEntities: LadderVisualEntity[];
}): ActorPhysicsState => {
  const blocked = getBlocked(doorEntities, doorAnim);
  const direction: Vec3 = [0, 0, 0];
  if (input.forward) direction[2] -= 1;
  if (input.back) direction[2] += 1;
  if (input.left) direction[0] -= 1;
  if (input.right) direction[0] += 1;
  const normalized = Math.abs(direction[0]) < 1e-4 && Math.abs(direction[2]) < 1e-4 ? ([0, 0, 0] as Vec3) : vec3Normalize(direction);
  const rotated: Vec3 =
    cameraMode === "editor"
      ? normalized
      : [
          normalized[0] * Math.cos(heading) - normalized[2] * Math.sin(heading),
          0,
          normalized[0] * Math.sin(heading) + normalized[2] * Math.cos(heading),
        ];

  const nearLadder = ladderEntities.find((ladder) => collidesWithAabb(state.position, [ladder.transform.position[0], 1.1, ladder.transform.position[2]], [0.8, 1.3, 0.7]));
  let next: ActorPhysicsState = { ...state, onLadder: nearLadder !== undefined };
  const horizontalDelta: Vec3 = [rotated[0] * MOVE_SPEED * dt, 0, rotated[2] * MOVE_SPEED * dt];
  next.position = slideMove(next.position, horizontalDelta, blocked);

  if (next.onLadder && (input.ascend || input.descend)) {
    const deltaY = (input.ascend ? 1 : 0) - (input.descend ? 1 : 0);
    next.position = [next.position[0], Math.max(0, Math.min(3.8, next.position[1] + deltaY * LADDER_SPEED * dt)), next.position[2]];
    next.verticalVelocity = 0;
    next.grounded = next.position[1] <= FLOOR_Y;
  } else {
    if (input.jump && next.grounded) {
      next.verticalVelocity = JUMP_SPEED;
      next.grounded = false;
    }
    if (!next.grounded) {
      next.verticalVelocity -= GRAVITY * dt;
      next.position = [next.position[0], next.position[1] + next.verticalVelocity * dt, next.position[2]];
      if (next.position[1] <= FLOOR_Y) {
        next.position = [next.position[0], FLOOR_Y, next.position[2]];
        next.verticalVelocity = 0;
        next.grounded = true;
      }
    }
  }

  return next;
};

export const findInteractionTarget = ({
  actor,
  doorEntities,
  switchEntities,
  ladderEntities,
  triggerZoneEntities,
}: {
  actor: Vec3;
  doorEntities: DoorVisualEntity[];
  switchEntities: SwitchVisualEntity[];
  ladderEntities: LadderVisualEntity[];
  triggerZoneEntities: TriggerZoneVisualEntity[];
}): InteractionTarget | undefined => {
  const distanceTo = (target: Vec3): number => Math.hypot(actor[0] - target[0], actor[1] - target[1], actor[2] - target[2]);
  const candidates: InteractionTarget[] = [];
  doorEntities.forEach((door) => {
    if (distanceTo([door.transform.position[0], 1.2, door.transform.position[2]]) < 3.1) candidates.push({ id: door.id, kind: "door", prompt: "E 开关门" });
  });
  switchEntities.forEach((entity) => {
    if (distanceTo([entity.transform.position[0], 0.6, entity.transform.position[2]]) < 2.4) candidates.push({ id: entity.id, kind: "switch", prompt: "E 触发开关" });
  });
  ladderEntities.forEach((entity) => {
    if (distanceTo([entity.transform.position[0], 1.2, entity.transform.position[2]]) < 2.6) candidates.push({ id: entity.id, kind: "ladder", prompt: "W/S 上下梯子" });
  });
  triggerZoneEntities.forEach((entity) => {
    if (distanceTo([entity.transform.position[0], 0.5, entity.transform.position[2]]) < 3.4) candidates.push({ id: entity.id, kind: "trigger-zone", prompt: "进入触发区测试逻辑" });
  });
  return candidates[0];
};
