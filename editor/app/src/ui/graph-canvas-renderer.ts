import type {
  CameraMode,
  CameraState,
  DoorVisualEntity,
  EnemyVisualEntity,
  GenericVisualEntity,
  LadderVisualEntity,
  SwitchVisualEntity,
  TriggerZoneVisualEntity,
} from "./graph-canvas-types";
import {
  mat4LookAt,
  mat4Multiply,
  mat4Perspective,
  mat4RotateY,
  mat4Scale,
  mat4Translate,
  vec3Add,
  vec3Cross,
  vec3Normalize,
  vec3Scale,
  vec3Sub,
  type Mat4,
  type Vec3,
} from "./graph-canvas-math";
import { FOREST_CABIN_ROOF_Y, FOREST_CABIN_WALLS, FOREST_TREE_POSITIONS, FOREST_WORLD_HALF_EXTENT } from "./forest-demo-layout";

export const TREE_POSITIONS: Vec3[] = FOREST_TREE_POSITIONS;

export const getSceneFocus = (positions: Vec3[]): Vec3 => {
  if (positions.length === 0) {
    return [0, 1, 0];
  }
  const sum = positions.reduce<Vec3>(
    (acc, pos) => [acc[0] + pos[0], acc[1] + pos[1], acc[2] + pos[2]],
    [0, 0, 0],
  );
  return [sum[0] / positions.length, Math.max(1, sum[1] / positions.length + 0.8), sum[2] / positions.length];
};

export const getSceneOrbitDistance = (positions: Vec3[], focus: Vec3): number => {
  if (positions.length === 0) {
    return 10;
  }
  const furthest = positions.reduce((maxRadius, pos) => {
    const dx = pos[0] - focus[0];
    const dy = pos[1] - focus[1];
    const dz = pos[2] - focus[2];
    return Math.max(maxRadius, Math.sqrt(dx * dx + dy * dy + dz * dz));
  }, 0);
  return Math.min(28, Math.max(14, furthest * 2.15 + 7));
};

export const compileShader = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
  const shader = gl.createShader(type);
  if (shader === null) {
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return null;
  }
  return shader;
};

export const collidesWithAabb = (position: Vec3, center: Vec3, halfExtents: Vec3): boolean =>
  Math.abs(position[0] - center[0]) <= halfExtents[0] &&
  Math.abs(position[1] - center[1]) <= halfExtents[1] &&
  Math.abs(position[2] - center[2]) <= halfExtents[2];

export const moveActor = ({
  actor,
  input,
  dt,
  cameraMode,
  heading,
  doorEntities,
  doorAnim,
}: {
  actor: Vec3;
  input: { forward: boolean; back: boolean; left: boolean; right: boolean };
  dt: number;
  cameraMode: CameraMode;
  heading: number;
  doorEntities: DoorVisualEntity[];
  doorAnim: Record<string, { current: number; target: number }>;
}): Vec3 => {
  const direction: Vec3 = [0, 0, 0];
  if (input.forward) direction[2] -= 1;
  if (input.back) direction[2] += 1;
  if (input.left) direction[0] -= 1;
  if (input.right) direction[0] += 1;
  if (Math.abs(direction[0]) < 1e-4 && Math.abs(direction[2]) < 1e-4) {
    return actor;
  }

  const normalized = vec3Normalize(direction);
  const rotated: Vec3 =
    cameraMode === "editor"
      ? normalized
      : [
          normalized[0] * Math.cos(heading) - normalized[2] * Math.sin(heading),
          0,
          normalized[0] * Math.sin(heading) + normalized[2] * Math.cos(heading),
        ];
  const speed = 5.8;
  const candidate: Vec3 = [actor[0] + rotated[0] * speed * dt, 0, actor[2] + rotated[2] * speed * dt];

  const wallBlocks: Array<{ center: Vec3; half: Vec3 }> = [
    { center: [0, 1.2, -FOREST_WORLD_HALF_EXTENT], half: [FOREST_WORLD_HALF_EXTENT + 0.1, 1.2, 0.18] },
    { center: [0, 1.2, FOREST_WORLD_HALF_EXTENT], half: [FOREST_WORLD_HALF_EXTENT + 0.1, 1.2, 0.18] },
    { center: [-FOREST_WORLD_HALF_EXTENT, 1.2, 0], half: [0.18, 1.2, FOREST_WORLD_HALF_EXTENT + 0.1] },
    { center: [FOREST_WORLD_HALF_EXTENT, 1.2, 0], half: [0.18, 1.2, FOREST_WORLD_HALF_EXTENT + 0.1] },
    ...FOREST_CABIN_WALLS.map((wall) => ({ center: wall.center, half: [wall.size[0] * 0.5, wall.size[1] * 0.5, wall.size[2] * 0.5] as Vec3 })),
  ];
  const treeBlocks = TREE_POSITIONS.map((pos) => ({ center: [pos[0], 0.6, pos[2]] as Vec3, half: [0.45, 0.6, 0.45] as Vec3 }));
  const dynamicDoorBlocks = doorEntities
    .map((door) => {
      const anim = doorAnim[door.id] ?? { current: 0, target: 0 };
      if (anim.current > 0.88) {
        return null;
      }
      return { center: [door.transform.position[0] + 0.5, 0.8, door.transform.position[2]] as Vec3, half: [0.55, 0.8, 0.35] as Vec3 };
    })
    .filter((value): value is { center: Vec3; half: Vec3 } => value !== null);

  const blocked = [...wallBlocks, ...treeBlocks, ...dynamicDoorBlocks].some((obstacle) => collidesWithAabb(candidate, obstacle.center, obstacle.half));
  return blocked ? actor : [Math.max(-FOREST_WORLD_HALF_EXTENT + 0.8, Math.min(FOREST_WORLD_HALF_EXTENT - 0.8, candidate[0])), 0, Math.max(-FOREST_WORLD_HALF_EXTENT + 0.8, Math.min(FOREST_WORLD_HALF_EXTENT - 0.8, candidate[2]))];
};

export const getCameraVectors = ({
  actor,
  camera,
  cameraMode,
  heading,
  pitch,
}: {
  actor: Vec3;
  camera: CameraState;
  cameraMode: CameraMode;
  heading: number;
  pitch: number;
}): { eye: Vec3; target: Vec3 } => {
  if (cameraMode === "first") {
    const eye: Vec3 = [actor[0], 1.62, actor[2]];
    const target: Vec3 = [actor[0] + Math.sin(heading) * Math.cos(pitch), 1.62 + Math.sin(pitch), actor[2] - Math.cos(heading) * Math.cos(pitch)];
    return { eye, target };
  }
  if (cameraMode === "third") {
    const target: Vec3 = [actor[0], 1.4, actor[2]];
    const eye: Vec3 = [actor[0] - Math.sin(heading) * 9.2, 5.1, actor[2] + Math.cos(heading) * 9.2];
    return { eye, target };
  }
  const orbitTarget = camera.target;
  const eye: Vec3 = [
    orbitTarget[0] + Math.sin(camera.yaw) * Math.cos(camera.pitch) * camera.distance,
    orbitTarget[1] + Math.sin(camera.pitch) * camera.distance,
    orbitTarget[2] + Math.cos(camera.yaw) * Math.cos(camera.pitch) * camera.distance,
  ];
  return { eye, target: orbitTarget };
};

export const getViewProjectionMatrix = ({
  canvas,
  camera,
  cameraMode,
  actor,
  heading,
  pitch,
}: {
  canvas: HTMLCanvasElement;
  camera: CameraState;
  cameraMode: CameraMode;
  actor: Vec3;
  heading: number;
  pitch: number;
}): Mat4 => {
  const { eye, target } = getCameraVectors({ actor, camera, cameraMode, heading, pitch });
  const view = mat4LookAt(eye, target, [0, 1, 0]);
  const projection = mat4Perspective((38 * Math.PI) / 180, canvas.width / Math.max(1, canvas.height), 0.1, 100);
  return mat4Multiply(projection, view);
};

export const projectWorldToScreen = (viewProjection: Mat4, point: Vec3, canvas: HTMLCanvasElement): { x: number; y: number; visible: boolean } => {
  const x = point[0];
  const y = point[1];
  const z = point[2];
  const clipX = viewProjection[0] * x + viewProjection[4] * y + viewProjection[8] * z + viewProjection[12];
  const clipY = viewProjection[1] * x + viewProjection[5] * y + viewProjection[9] * z + viewProjection[13];
  const clipZ = viewProjection[2] * x + viewProjection[6] * y + viewProjection[10] * z + viewProjection[14];
  const clipW = viewProjection[3] * x + viewProjection[7] * y + viewProjection[11] * z + viewProjection[15];
  if (clipW <= 0.001) {
    return { x: 0, y: 0, visible: false };
  }
  const ndcX = clipX / clipW;
  const ndcY = clipY / clipW;
  const ndcZ = clipZ / clipW;
  return {
    x: ((ndcX + 1) * 0.5) * canvas.clientWidth,
    y: ((1 - ndcY) * 0.5) * canvas.clientHeight,
    visible: ndcX >= -1.1 && ndcX <= 1.1 && ndcY >= -1.1 && ndcY <= 1.1 && ndcZ >= -1.1 && ndcZ <= 1.1,
  };
};

export const drawScene = ({
  canvas,
  gl,
  posLoc,
  mvpLoc,
  colorLoc,
  cubeIndices,
  vbo,
  ebo,
  camera,
  cameraMode,
  actor,
  heading,
  pitch,
  doorEntities,
  triggerZoneEntities,
  switchEntities,
  ladderEntities,
  enemyEntities,
  genericEntities,
  doorAnim,
  onTriggerZoneStateChange,
  activeTriggerIdsRef,
}: {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  posLoc: number;
  mvpLoc: WebGLUniformLocation;
  colorLoc: WebGLUniformLocation;
  cubeIndices: Uint16Array;
  vbo: WebGLBuffer;
  ebo: WebGLBuffer;
  camera: CameraState;
  cameraMode: CameraMode;
  actor: Vec3;
  heading: number;
  pitch: number;
  doorEntities: DoorVisualEntity[];
  triggerZoneEntities: TriggerZoneVisualEntity[];
  switchEntities: SwitchVisualEntity[];
  ladderEntities: LadderVisualEntity[];
  enemyEntities: EnemyVisualEntity[];
  genericEntities: GenericVisualEntity[];
  doorAnim: Record<string, { current: number; target: number }>;
  onTriggerZoneStateChange?: (zoneId: string, occupied: boolean) => void;
  activeTriggerIdsRef: { current: Set<string> };
}): void => {
  gl.clearColor(0.964, 0.973, 0.98, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.useProgram(gl.getParameter(gl.CURRENT_PROGRAM));
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(posLoc);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);

  const viewProj = getViewProjectionMatrix({ canvas, camera, cameraMode, actor, heading, pitch });
  const drawBox = (model: Mat4, color: [number, number, number, number]): void => {
    const mvp = mat4Multiply(viewProj, model);
    gl.uniformMatrix4fv(mvpLoc, false, mvp);
    gl.uniform4f(colorLoc, color[0], color[1], color[2], color[3]);
    gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);
  };

  drawBox(mat4Multiply(mat4Translate(0, -0.03, 0), mat4Scale(FOREST_WORLD_HALF_EXTENT * 2 + 13, 0.02, FOREST_WORLD_HALF_EXTENT * 2 + 13)), [0.87, 0.91, 0.94, 1]);
  drawBox(mat4Multiply(mat4Translate(0, -0.02, -2.5), mat4Scale(14.8, 0.01, 11.2)), [0.55, 0.47, 0.38, 1]);
  [
    { center: [0, 1.2, -FOREST_WORLD_HALF_EXTENT], size: [FOREST_WORLD_HALF_EXTENT * 2, 2.4, 0.2], tone: "outer" },
    { center: [0, 1.2, FOREST_WORLD_HALF_EXTENT], size: [FOREST_WORLD_HALF_EXTENT * 2, 2.4, 0.2], tone: "outer" },
    { center: [-FOREST_WORLD_HALF_EXTENT, 1.2, 0], size: [0.2, 2.4, FOREST_WORLD_HALF_EXTENT * 2], tone: "outer" },
    { center: [FOREST_WORLD_HALF_EXTENT, 1.2, 0], size: [0.2, 2.4, FOREST_WORLD_HALF_EXTENT * 2], tone: "outer" },
    ...FOREST_CABIN_WALLS,
  ].forEach((wall, index) => {
    drawBox(mat4Multiply(mat4Translate(wall.center[0], wall.center[1], wall.center[2]), mat4Scale(wall.size[0], wall.size[1], wall.size[2])), index < 4 || wall.tone === "outer" ? [0.71, 0.75, 0.8, 1] : [0.72, 0.64, 0.56, 1]);
  });
  drawBox(mat4Multiply(mat4Translate(0, FOREST_CABIN_ROOF_Y, -2.5), mat4Scale(13.6, 0.18, 10.8)), [0.54, 0.22, 0.19, 1]);
  TREE_POSITIONS.forEach((pos) => {
    drawBox(mat4Multiply(mat4Translate(pos[0], 0.45, pos[2]), mat4Scale(0.18, 0.9, 0.18)), [0.45, 0.3, 0.2, 1]);
    drawBox(mat4Multiply(mat4Translate(pos[0], 1.2, pos[2]), mat4Scale(0.95, 1.2, 0.95)), [0.21, 0.5, 0.29, 1]);
  });

  const activeTriggerIds = new Set(
    triggerZoneEntities.filter((zone) => collidesWithAabb(actor, [zone.transform.position[0], 0.45, zone.transform.position[2]], [zone.volume.size[0] * 0.5, 0.7, zone.volume.size[2] * 0.5])).map((zone) => zone.id),
  );
  triggerZoneEntities.forEach((zone) => {
    const wasActive = activeTriggerIdsRef.current.has(zone.id);
    const isActive = activeTriggerIds.has(zone.id);
    if (wasActive !== isActive) {
      onTriggerZoneStateChange?.(zone.id, isActive);
    }
    drawBox(mat4Multiply(mat4Translate(zone.transform.position[0], 0.03, zone.transform.position[2]), mat4Scale(zone.volume.size[0], 0.02, zone.volume.size[2])), isActive ? [0.25, 0.76, 0.43, 0.35] : [0.96, 0.6, 0.24, 0.18]);
    drawBox(mat4Multiply(mat4Translate(zone.transform.position[0], 0.45, zone.transform.position[2]), mat4Scale(zone.volume.size[0], 0.9, zone.volume.size[2])), isActive ? [0.28, 0.72, 0.42, 0.08] : [0.94, 0.64, 0.26, 0.05]);
  });
  activeTriggerIdsRef.current = activeTriggerIds;

  if (cameraMode !== "first") {
    drawBox(mat4Multiply(mat4Translate(actor[0], 0.9, actor[2]), mat4Scale(0.52, 1.8, 0.52)), [0.16, 0.71, 0.35, 1]);
  }
  for (let i = -20; i <= 20; i += 1) {
    drawBox(mat4Multiply(mat4Translate(i, 0.001, 0), mat4Scale(0.01, 0.01, 40)), [0.82, 0.84, 0.87, 0.9]);
    drawBox(mat4Multiply(mat4Translate(0, 0.001, i), mat4Scale(40, 0.01, 0.01)), [0.82, 0.84, 0.87, 0.9]);
  }

  doorEntities.forEach((door) => {
    const anim = doorAnim[door.id] ?? { current: 0, target: 0 };
    anim.current += (anim.target - anim.current) * 0.15;
    doorAnim[door.id] = anim;
    const pivot = mat4Multiply(mat4Translate(...door.transform.position), mat4RotateY(-anim.current * Math.PI * 0.5));
    drawBox(mat4Multiply(pivot, mat4Multiply(mat4Translate(door.collider.size[0] * 0.5, door.collider.size[1] * 0.5, 0), mat4Scale(door.collider.size[0], door.collider.size[1], door.collider.size[2]))), [0.18, 0.51, 0.97, 1]);
  });
  switchEntities.forEach((entity) => {
    drawBox(mat4Multiply(mat4Translate(entity.transform.position[0], 0.25, entity.transform.position[2]), mat4Scale(entity.size[0], entity.size[1], entity.size[2])), [0.95, 0.78, 0.24, 1]);
    drawBox(mat4Multiply(mat4Translate(entity.transform.position[0], 0.55, entity.transform.position[2]), mat4Scale(0.12, 0.18, 0.12)), [0.44, 0.24, 0.16, 1]);
  });
  ladderEntities.forEach((entity) => {
    drawBox(mat4Multiply(mat4Translate(entity.transform.position[0], 1.1, entity.transform.position[2]), mat4Scale(entity.size[0], entity.size[1], entity.size[2])), [0.72, 0.58, 0.32, 1]);
  });
  enemyEntities.forEach((entity) => {
    drawBox(mat4Multiply(mat4Translate(entity.transform.position[0], 0.6, entity.transform.position[2]), mat4Scale(entity.size[0], entity.size[1], entity.size[2])), [0.76, 0.31, 0.28, 1]);
    drawBox(mat4Multiply(mat4Translate(entity.transform.position[0], 1.18, entity.transform.position[2]), mat4Scale(0.34, 0.32, 0.34)), [0.45, 0.18, 0.16, 1]);
  });
  genericEntities.forEach((entity) => {
    drawBox(mat4Multiply(mat4Translate(entity.transform.position[0], 0.35, entity.transform.position[2]), mat4Scale(entity.size[0], entity.size[1], entity.size[2])), entity.color);
  });
};

export const getRayContext = (rect: DOMRect, clientX: number, clientY: number, camera: CameraState): { eye: Vec3; dir: Vec3 } => {
  const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
  const ny = -((clientY - rect.top) / rect.height) * 2 + 1;
  const target = camera.target;
  const eye: Vec3 = [
    target[0] + Math.sin(camera.yaw) * Math.cos(camera.pitch) * camera.distance,
    target[1] + Math.sin(camera.pitch) * camera.distance,
    target[2] + Math.cos(camera.yaw) * Math.cos(camera.pitch) * camera.distance,
  ];
  const forward = vec3Normalize(vec3Sub(target, eye));
  const right = vec3Normalize(vec3Cross(forward, [0, 1, 0]));
  const up = vec3Normalize(vec3Cross(right, forward));
  const tanFov = Math.tan((38 * Math.PI) / 360);
  const dir = vec3Normalize([
    forward[0] + right[0] * nx * tanFov * (rect.width / Math.max(1, rect.height)) + up[0] * ny * tanFov,
    forward[1] + right[1] * nx * tanFov * (rect.width / Math.max(1, rect.height)) + up[1] * ny * tanFov,
    forward[2] + right[2] * nx * tanFov * (rect.width / Math.max(1, rect.height)) + up[2] * ny * tanFov,
  ]);
  return { eye, dir };
};
