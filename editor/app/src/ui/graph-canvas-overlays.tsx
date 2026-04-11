import type { MutableRefObject } from "react";
import GraphCanvasNodeValidationOverlay from "./graph-canvas-node-validation-overlay";
import type { ActorPhysicsState } from "./graph-canvas-playtest";
import GraphCanvasWorldLabels from "./graph-canvas-world-labels";
import type { CameraMode, CameraState, CanvasNode, GraphCanvasWorldLabel } from "./graph-canvas-types";
import type { Vec3 } from "./graph-canvas-math";

type GraphCanvasOverlaysProps = {
  canvas: HTMLCanvasElement | null;
  dragActive: boolean;
  webglState: "booting" | "ready" | "failed";
  dragHintText: string;
  worldLabels: GraphCanvasWorldLabel[];
  labelAnchors: Record<string, Vec3>;
  nodes: CanvasNode[];
  cameraMode: CameraMode;
  cameraRef: MutableRefObject<CameraState>;
  actorStateRef: MutableRefObject<ActorPhysicsState>;
  actorHeadingRef: MutableRefObject<number>;
  actorPitchRef: MutableRefObject<number>;
};

export default function GraphCanvasOverlays({
  canvas,
  dragActive,
  webglState,
  dragHintText,
  worldLabels,
  labelAnchors,
  nodes,
  cameraMode,
  cameraRef,
  actorStateRef,
  actorHeadingRef,
  actorPitchRef,
}: GraphCanvasOverlaysProps): JSX.Element {
  return (
    <>
      <div data-testid="viewport-render-state" style={{ position: "absolute", right: "10px", bottom: "10px", zIndex: 2, padding: "4px 8px", borderRadius: "6px", background: "rgba(15,23,42,0.78)", color: "#cfd8e3", fontSize: "10px" }}>
        {webglState === "ready" ? "render ok" : `render:${webglState}`}
      </div>
      {dragActive ? (
        <div style={{ position: "absolute", inset: "12px", borderRadius: "10px", border: "1px dashed #2553a4", background: "rgba(40, 67, 104, 0.78)", display: "grid", placeItems: "center", pointerEvents: "none", color: "#dbeeff", fontSize: "13px", fontWeight: 700 }}>
          {dragHintText}
        </div>
      ) : null}
      {webglState === "failed" ? (
        <div style={{ position: "absolute", inset: "12px", borderRadius: "10px", background: "rgba(25,30,40,0.92)", display: "grid", placeItems: "center", color: "#f6c3b8", fontSize: "12px", fontWeight: 700 }}>
          视口初始化失败：WebGL 未就绪
        </div>
      ) : null}
      <GraphCanvasWorldLabels
        canvas={canvas}
        labels={worldLabels}
        anchors={labelAnchors}
        cameraMode={cameraMode}
        cameraRef={cameraRef}
        actorStateRef={actorStateRef}
        actorHeadingRef={actorHeadingRef}
        actorPitchRef={actorPitchRef}
      />
      <GraphCanvasNodeValidationOverlay
        canvas={canvas}
        nodes={nodes}
        anchors={labelAnchors}
        cameraMode={cameraMode}
        cameraRef={cameraRef}
        actorStateRef={actorStateRef}
        actorHeadingRef={actorHeadingRef}
        actorPitchRef={actorPitchRef}
      />
    </>
  );
}
