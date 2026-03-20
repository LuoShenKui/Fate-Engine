import type { CameraMode, CameraState } from "./graph-canvas-types";
import type { Vec3 } from "./graph-canvas-math";

type OrbitEntity = {
  id: string;
  transform: {
    position: Vec3;
  };
};

const EDITOR_ACTOR_ANCHOR: Vec3 = [0, 0, 10];

export const getOrbitSamplePositions = (entities: OrbitEntity[]): Vec3[] => {
  const positions = entities.map((entity) => entity.transform.position);
  return [...positions, EDITOR_ACTOR_ANCHOR];
};

export const normalizeEditorOrbitDistance = (distance: number): number => Math.max(16.5, Math.min(22, distance));

export const createEditorHomeCamera = (target: Vec3, distance: number): CameraState => ({
  yaw: 0.22,
  pitch: 0.98,
  distance: normalizeEditorOrbitDistance(distance),
  target,
});

export const formatVec3 = (value: Vec3): string => value.map((axis) => axis.toFixed(2)).join("/");

export const getCameraTrace = (cameraMode: CameraMode, camera: CameraState): string =>
  `mode=${cameraMode} distance=${camera.distance.toFixed(2)} yaw=${camera.yaw.toFixed(2)} pitch=${camera.pitch.toFixed(2)} target=${formatVec3(camera.target)}`;
