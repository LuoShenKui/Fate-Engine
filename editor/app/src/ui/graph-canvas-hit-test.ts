import { clamp, vec3Add, vec3Scale, type Vec3 } from "./graph-canvas-math";
import type { DoorVisualEntity, EnemyVisualEntity, GenericVisualEntity, LadderVisualEntity, SwitchVisualEntity } from "./graph-canvas-types";

export type HitEntity = { id: string; kind: "door" | "switch" | "ladder" | "enemy" | "generic" };

const hitAabb = (eye: Vec3, dir: Vec3, center: Vec3, half: Vec3): boolean => {
  const min: Vec3 = [center[0] - half[0], center[1] - half[1], center[2] - half[2]];
  const max: Vec3 = [center[0] + half[0], center[1] + half[1], center[2] + half[2]];
  let tMin = -Infinity;
  let tMax = Infinity;
  for (let i = 0; i < 3; i += 1) {
    if (Math.abs(dir[i]) < 1e-5) {
      if (eye[i] < min[i] || eye[i] > max[i]) return false;
      continue;
    }
    const t1 = (min[i] - eye[i]) / dir[i];
    const t2 = (max[i] - eye[i]) / dir[i];
    tMin = Math.max(tMin, Math.min(t1, t2));
    tMax = Math.min(tMax, Math.max(t1, t2));
  }
  return tMax >= Math.max(0, tMin);
};

export const findHitEntity = ({
  eye,
  dir,
  doorEntities,
  switchEntities,
  ladderEntities,
  enemyEntities,
  genericEntities,
}: {
  eye: Vec3;
  dir: Vec3;
  doorEntities: DoorVisualEntity[];
  switchEntities: SwitchVisualEntity[];
  ladderEntities: LadderVisualEntity[];
  enemyEntities: EnemyVisualEntity[];
  genericEntities: GenericVisualEntity[];
}): HitEntity | undefined => {
  const hitDoor = doorEntities.find((door) => hitAabb(eye, dir, [door.transform.position[0] + 0.6, 1, door.transform.position[2]], [0.6, 1, 0.35]));
  if (hitDoor !== undefined) return { id: hitDoor.id, kind: "door" };
  const hitSwitch = switchEntities.find((entity) => hitAabb(eye, dir, [entity.transform.position[0], 0.25, entity.transform.position[2]], [entity.size[0] * 0.5, entity.size[1] * 0.5, entity.size[2] * 0.5]));
  if (hitSwitch !== undefined) return { id: hitSwitch.id, kind: "switch" };
  const hitLadder = ladderEntities.find((entity) => hitAabb(eye, dir, [entity.transform.position[0], 1.1, entity.transform.position[2]], [entity.size[0] * 0.5, entity.size[1] * 0.5, entity.size[2] * 0.5]));
  if (hitLadder !== undefined) return { id: hitLadder.id, kind: "ladder" };
  const hitEnemy = enemyEntities.find((entity) => hitAabb(eye, dir, [entity.transform.position[0], entity.size[1] * 0.5, entity.transform.position[2]], [entity.size[0] * 0.5, entity.size[1] * 0.5, entity.size[2] * 0.5]));
  if (hitEnemy !== undefined) return { id: hitEnemy.id, kind: "enemy" };
  const hitGeneric = genericEntities.find((entity) => hitAabb(eye, dir, [entity.transform.position[0], entity.size[1] * 0.5, entity.transform.position[2]], [entity.size[0] * 0.5, entity.size[1] * 0.5, entity.size[2] * 0.5]));
  if (hitGeneric !== undefined) return { id: hitGeneric.id, kind: "generic" };
  return undefined;
};

export const projectRayToGround = (eye: Vec3, dir: Vec3): Vec3 => {
  const rayScale = Math.abs(dir[1]) < 1e-5 ? 0 : -eye[1] / dir[1];
  const hitPoint: Vec3 = rayScale > 0 ? vec3Add(eye, vec3Scale(dir, rayScale)) : [0, 0, 0];
  return [clamp(hitPoint[0], -9, 9), 0, clamp(hitPoint[2], -9, 9)];
};
