import { useEffect, useState, type MutableRefObject } from "react";
import { getViewProjectionMatrix, projectWorldToScreen } from "./graph-canvas-renderer";
import type { ActorPhysicsState } from "./graph-canvas-playtest";
import type { CameraMode, CameraState, GraphCanvasWorldLabel } from "./graph-canvas-types";
import type { Vec3 } from "./graph-canvas-math";

type WorldLabelOverlayProps = {
  canvas: HTMLCanvasElement | null;
  labels: GraphCanvasWorldLabel[];
  anchors: Record<string, Vec3>;
  cameraMode: CameraMode;
  cameraRef: MutableRefObject<CameraState>;
  actorStateRef: MutableRefObject<ActorPhysicsState>;
  actorHeadingRef: MutableRefObject<number>;
  actorPitchRef: MutableRefObject<number>;
};

type ProjectedLabel = GraphCanvasWorldLabel & {
  x: number;
  y: number;
};

const labelToneStyle = (tone: GraphCanvasWorldLabel["tone"]): { border: string; accent: string } => {
  if (tone === "ability") return { border: "rgba(223, 178, 74, 0.9)", accent: "#f7d88f" };
  if (tone === "interactive") return { border: "rgba(117, 159, 215, 0.9)", accent: "#d9ebff" };
  return { border: "rgba(93, 109, 130, 0.92)", accent: "#e4edf7" };
};

export default function GraphCanvasWorldLabels({
  canvas,
  labels,
  anchors,
  cameraMode,
  cameraRef,
  actorStateRef,
  actorHeadingRef,
  actorPitchRef,
}: WorldLabelOverlayProps): JSX.Element | null {
  const [projectedLabels, setProjectedLabels] = useState<ProjectedLabel[]>([]);

  useEffect(() => {
    if (canvas === null) {
      setProjectedLabels([]);
      return;
    }

    let raf = 0;
    const update = (): void => {
      const viewProjection = getViewProjectionMatrix({
        canvas,
        camera: cameraRef.current,
        cameraMode,
        actor: actorStateRef.current.position,
        heading: actorHeadingRef.current,
        pitch: actorPitchRef.current,
      });
      const next = labels.flatMap<ProjectedLabel>((label) => {
        const anchor = anchors[label.id];
        if (anchor === undefined) return [];
        const projected = projectWorldToScreen(viewProjection, [anchor[0], anchor[1] + 1.45, anchor[2]], canvas);
        if (!projected.visible) return [];
        return [{ ...label, x: projected.x, y: projected.y }];
      });
      setProjectedLabels(next);
      raf = window.requestAnimationFrame(update);
    };

    raf = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(raf);
  }, [actorHeadingRef, actorPitchRef, actorStateRef, anchors, cameraMode, cameraRef, canvas, labels]);

  if (canvas === null || projectedLabels.length === 0) return null;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {projectedLabels.map((label) => {
        const tone = labelToneStyle(label.tone);
        return (
          <div
            key={label.id}
            style={{
              position: "absolute",
              left: `${label.x}px`,
              top: `${label.y}px`,
              transform: "translate(-50%, -100%)",
              minWidth: "84px",
              maxWidth: "132px",
              padding: "4px 7px",
              borderRadius: "7px",
              border: `1px solid ${tone.border}`,
              background: "rgba(13, 18, 26, 0.86)",
              boxShadow: "0 8px 18px rgba(0, 0, 0, 0.28)",
              color: "#f1f6fc",
              fontSize: "10px",
              lineHeight: 1.2,
              textAlign: "center",
            }}
          >
            <div style={{ color: tone.accent, fontWeight: 700 }}>{label.title}</div>
          </div>
        );
      })}
    </div>
  );
}
