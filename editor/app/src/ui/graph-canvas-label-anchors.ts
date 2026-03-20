import type { Vec3 } from "./graph-canvas-math";
import type { DoorVisualEntity, EnemyVisualEntity, GenericVisualEntity, LadderVisualEntity, SwitchVisualEntity } from "./graph-canvas-types";

type LabelEntity = DoorVisualEntity | SwitchVisualEntity | LadderVisualEntity | EnemyVisualEntity | GenericVisualEntity;

export const buildLabelAnchors = (entities: LabelEntity[]): Record<string, Vec3> =>
  entities.reduce<Record<string, Vec3>>((acc, entity) => {
    acc[entity.id] = entity.transform.position;
    return acc;
  }, {});
