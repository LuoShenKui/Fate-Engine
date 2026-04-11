import { useEffect, useState, type MutableRefObject } from "react";
import { getViewProjectionMatrix, projectWorldToScreen } from "./graph-canvas-renderer";
import type { ActorPhysicsState } from "./graph-canvas-playtest";
import type { CameraMode, CameraState, CanvasNode } from "./graph-canvas-types";
import type { Vec3 } from "./graph-canvas-math";

type GraphCanvasNodeValidationOverlayProps = {
  canvas: HTMLCanvasElement | null;
  nodes: CanvasNode[];
  anchors: Record<string, Vec3>;
  cameraMode: CameraMode;
  cameraRef: MutableRefObject<CameraState>;
  actorStateRef: MutableRefObject<ActorPhysicsState>;
  actorHeadingRef: MutableRefObject<number>;
  actorPitchRef: MutableRefObject<number>;
};

type ProjectedValidationBadge = {
  id: string;
  state: "ready" | "incomplete" | "blocked";
  issues: string[];
  x: number;
  y: number;
};

const stateStyles: Record<ProjectedValidationBadge["state"], { border: string; background: string; accent: string; label: string }> = {
  ready: {
    border: "rgba(109, 204, 134, 0.95)",
    background: "rgba(31, 53, 38, 0.92)",
    accent: "#b6f5c4",
    label: "Ready",
  },
  incomplete: {
    border: "rgba(232, 191, 96, 0.95)",
    background: "rgba(58, 45, 18, 0.92)",
    accent: "#ffe4a1",
    label: "Incomplete",
  },
  blocked: {
    border: "rgba(244, 131, 94, 0.96)",
    background: "rgba(70, 28, 20, 0.94)",
    accent: "#ffd2c7",
    label: "Blocked",
  },
};

export default function GraphCanvasNodeValidationOverlay({
  canvas,
  nodes,
  anchors,
  cameraMode,
  cameraRef,
  actorStateRef,
  actorHeadingRef,
  actorPitchRef,
}: GraphCanvasNodeValidationOverlayProps): JSX.Element | null {
  const [badges, setBadges] = useState<ProjectedValidationBadge[]>([]);

  useEffect(() => {
    if (canvas === null) {
      setBadges([]);
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
      const nextBadges = nodes.flatMap<ProjectedValidationBadge>((node) => {
        const validationState = node.meta?.validationState;
        if (validationState === undefined) return [];
        const anchor = anchors[node.id];
        if (anchor === undefined) return [];
        const projected = projectWorldToScreen(viewProjection, [anchor[0], anchor[1] + 1.9, anchor[2]], canvas);
        if (!projected.visible) return [];
        return [{
          id: node.id,
          state: validationState,
          issues: node.meta?.validationIssues ?? [],
          x: projected.x,
          y: projected.y,
        }];
      });
      setBadges(nextBadges);
      raf = window.requestAnimationFrame(update);
    };

    raf = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(raf);
  }, [actorHeadingRef, actorPitchRef, actorStateRef, anchors, cameraMode, cameraRef, canvas, nodes]);

  if (canvas === null || badges.length === 0) return null;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {badges.map((badge) => {
        const tone = stateStyles[badge.state];
        if (badge.state === "ready") {
          return (
            <div
              key={badge.id}
              data-testid={`node-validation-${badge.id}`}
              style={{
                position: "absolute",
                left: `${badge.x}px`,
                top: `${badge.y}px`,
                transform: "translate(-50%, -50%)",
                width: "10px",
                height: "10px",
                borderRadius: "999px",
                border: `1px solid ${tone.border}`,
                background: tone.background,
                boxShadow: "0 0 0 2px rgba(9, 12, 18, 0.72)",
              }}
            />
          );
        }

        return (
          <div
            key={badge.id}
            data-testid={`node-validation-${badge.id}`}
            style={{
              position: "absolute",
              left: `${badge.x}px`,
              top: `${badge.y}px`,
              transform: "translate(-50%, -100%)",
              minWidth: "128px",
              maxWidth: "188px",
              padding: "6px 8px",
              borderRadius: "8px",
              border: `1px solid ${tone.border}`,
              background: tone.background,
              boxShadow: badge.state === "blocked" ? "0 12px 28px rgba(0, 0, 0, 0.34)" : "0 8px 18px rgba(0, 0, 0, 0.24)",
              color: "#f6fbff",
              fontSize: "10px",
              lineHeight: 1.25,
            }}
          >
            <div style={{ color: tone.accent, fontWeight: 800, letterSpacing: "0.02em", textTransform: "uppercase" }}>{tone.label}</div>
            {badge.issues.slice(0, 2).map((issue) => (
              <div key={`${badge.id}-${issue}`} style={{ marginTop: "2px", color: "#edf4fb" }}>
                {issue}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
