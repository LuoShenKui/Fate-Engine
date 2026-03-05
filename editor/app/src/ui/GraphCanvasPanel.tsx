import { useEffect, useMemo, useRef } from "react";
import { useI18n } from "./i18n/I18nProvider";

export type CanvasTransform = {
  position?: [number, number, number];
  rotation?: [number, number, number];
};

export type CanvasNode = {
  id: string;
  type?: string;
  transform?: CanvasTransform;
};

export type CanvasEdge = {
  from: string;
  to: string;
};

type DoorVisualEntity = {
  id: string;
  kind: "door";
  transform: Required<CanvasTransform>;
  collider: {
    shape: "box";
    size: [number, number, number];
  };
};

type GraphCanvasPanelProps = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  onChange: (next: { nodes: CanvasNode[]; edges: CanvasEdge[] }) => void;
  onInteract?: (nodeId: string) => void;
  onDoorPositionsChange?: (next: Record<string, [number, number, number]>) => void;
  onActorPositionChange?: (position: [number, number, number]) => void;
};

type CameraState = {
  yaw: number;
  pitch: number;
  distance: number;
};

type ScreenRect = { id: string; x: number; y: number; w: number; h: number };
type PointerLikeEvent = { clientX: number; clientY: number };
type WheelLikeEvent = { deltaY: number; preventDefault: () => void };
type ClickLikeEvent = PointerLikeEvent & { currentTarget: { getBoundingClientRect: () => DOMRect } };

const defaultTransform: Required<CanvasTransform> = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
};

const toDoorEntity = (node: CanvasNode, index: number): DoorVisualEntity => ({
  id: node.id,
  kind: "door",
  transform: {
    position: node.transform?.position ?? [index * 1.8, 0, 0],
    rotation: node.transform?.rotation ?? defaultTransform.rotation,
  },
  collider: {
    shape: "box",
    size: [1, 2, 0.25],
  },
});

const project = (point: [number, number, number], camera: CameraState, width: number, height: number): [number, number, number] => {
  const [x, y, z] = point;
  const cosYaw = Math.cos(camera.yaw);
  const sinYaw = Math.sin(camera.yaw);
  const cosPitch = Math.cos(camera.pitch);
  const sinPitch = Math.sin(camera.pitch);

  const dx = x;
  const dy = y - 1;
  const dz = z;

  const rx = dx * cosYaw - dz * sinYaw;
  const rz = dx * sinYaw + dz * cosYaw + camera.distance;
  const ry = dy * cosPitch - rz * sinPitch;
  const rz2 = dy * sinPitch + rz * cosPitch;
  const perspective = Math.max(0.2, 500 / Math.max(1, rz2 * 120));

  return [width / 2 + rx * perspective * 40, height / 2 - ry * perspective * 40, rz2];
};

export default function GraphCanvasPanel({ nodes, edges, onChange, onInteract, onDoorPositionsChange, onActorPositionChange }: GraphCanvasPanelProps): JSX.Element {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number>(0);
  const cameraRef = useRef<CameraState>({ yaw: 0.5, pitch: 0.25, distance: 7 });
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
  const hitRectsRef = useRef<ScreenRect[]>([]);

  const doorEntities = useMemo(() => nodes.filter((node) => node.type === "door").map(toDoorEntity), [nodes]);

  useEffect(() => {
    const nextPositions: Record<string, [number, number, number]> = {};
    doorEntities.forEach((entity) => {
      nextPositions[entity.id] = entity.transform.position;
    });
    onDoorPositionsChange?.(nextPositions);
  }, [doorEntities, onDoorPositionsChange]);

  useEffect(() => {
    onActorPositionChange?.([0, 0, 2]);
  }, [onActorPositionChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (ctx === null) {
      return;
    }

    const draw = (): void => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#f6f8fa";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "#d0d7de";
      ctx.lineWidth = 1;
      for (let i = -12; i <= 12; i += 1) {
        const p1 = project([i, 0, -12], cameraRef.current, width, height);
        const p2 = project([i, 0, 12], cameraRef.current, width, height);
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();
      }

      const nextRects: ScreenRect[] = [];
      doorEntities.forEach((entity) => {
        const [sx, sy, depth] = project(entity.transform.position, cameraRef.current, width, height);
        const scale = Math.max(16, 90 / Math.max(1, depth));
        const doorW = scale * entity.collider.size[0];
        const doorH = scale * entity.collider.size[1];

        ctx.fillStyle = "#2f81f7";
        ctx.fillRect(sx - doorW / 2, sy - doorH, doorW, doorH);
        ctx.strokeStyle = "#1f6feb";
        ctx.strokeRect(sx - doorW / 2, sy - doorH, doorW, doorH);

        ctx.fillStyle = "#ffffff";
        ctx.font = "12px sans-serif";
        ctx.fillText(entity.id, sx - doorW / 2, sy - doorH - 4);

        nextRects.push({ id: entity.id, x: sx - doorW / 2, y: sy - doorH, w: doorW, h: doorH });
      });

      nodes
        .filter((node) => node.type !== "door")
        .forEach((node, index) => {
          const [sx, sy] = project([index * 1.4, 0.4, -2.5], cameraRef.current, width, height);
          ctx.beginPath();
          ctx.arc(sx, sy, 8, 0, Math.PI * 2);
          ctx.fillStyle = "#7d8590";
          ctx.fill();
          nextRects.push({ id: node.id, x: sx - 8, y: sy - 8, w: 16, h: 16 });
        });

      hitRectsRef.current = nextRects;
      frameRef.current = window.requestAnimationFrame(draw);
    };

    frameRef.current = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(frameRef.current);
    };
  }, [doorEntities, nodes]);

  const onPointerDown = (event: PointerLikeEvent): void => {
    pointerDownRef.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerMove = (event: PointerLikeEvent): void => {
    if (pointerDownRef.current === null) {
      return;
    }
    const dx = event.clientX - pointerDownRef.current.x;
    const dy = event.clientY - pointerDownRef.current.y;
    pointerDownRef.current = { x: event.clientX, y: event.clientY };
    cameraRef.current = {
      ...cameraRef.current,
      yaw: cameraRef.current.yaw + dx * 0.01,
      pitch: Math.max(-1.2, Math.min(1.2, cameraRef.current.pitch + dy * 0.01)),
    };
  };

  const onPointerUp = (): void => {
    pointerDownRef.current = null;
  };

  const onWheel = (event: WheelLikeEvent): void => {
    event.preventDefault();
    cameraRef.current = {
      ...cameraRef.current,
      distance: Math.max(3, Math.min(16, cameraRef.current.distance + event.deltaY * 0.01)),
    };
  };

  const onCanvasClick = (event: ClickLikeEvent): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hit = hitRectsRef.current.find((item) => x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h);
    if (hit !== undefined) {
      onInteract?.(hit.id);
    }
  };

  const onAddNode = (): void => {
    const nextId = `node-${Date.now()}`;
    onChange({
      nodes: [...nodes, { id: nextId, type: "door" }],
      edges,
    });
  };

  const onDeleteNode = (id: string): void => {
    const nextNodes = nodes.filter((node) => node.id !== id);
    const nextEdges = edges.filter((edge) => edge.from !== id && edge.to !== id);
    onChange({ nodes: nextNodes, edges: nextEdges });
  };

  const onAddEdge = (): void => {
    if (nodes.length < 2) {
      return;
    }
    const from = nodes[nodes.length - 2]?.id;
    const to = nodes[nodes.length - 1]?.id;
    if (typeof from !== "string" || typeof to !== "string") {
      return;
    }
    onChange({ nodes, edges: [...edges, { from, to }] });
  };

  const onDeleteEdge = (index: number): void => {
    onChange({
      nodes,
      edges: edges.filter((_, edgeIndex) => edgeIndex !== index),
    });
  };

  return (
    <div>
      <h2>{t("panel.graphCanvas.title")}</h2>
      <div
        style={{
          height: "100%",
          minHeight: "320px",
          border: "1px dashed #8c959f",
          borderRadius: "6px",
          padding: "12px",
          color: "#24292f",
          display: "grid",
          gridTemplateRows: "1fr auto",
          gap: "12px",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ minHeight: "320px", width: "100%", border: "1px solid #d0d7de", borderRadius: "6px", touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
          onClick={onCanvasClick}
        />

        <details>
          <summary style={{ cursor: "pointer", marginBottom: "8px" }}>调试列表（节点/连线）</summary>
          <div style={{ width: "100%", display: "grid", gap: "12px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" onClick={onAddNode}>
                + 节点
              </button>
              <button type="button" onClick={onAddEdge} disabled={nodes.length < 2}>
                + 连线
              </button>
            </div>

            <div>
              <strong>节点</strong>
              <ul style={{ margin: "8px 0 0", paddingLeft: "18px" }}>
                {nodes.map((node) => (
                  <li key={node.id} style={{ marginBottom: "4px" }}>
                    <code>{node.id}</code> <span>({node.type ?? "unknown"})</span>{" "}
                    <button type="button" onClick={() => onDeleteNode(node.id)}>
                      删除
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <strong>连线</strong>
              <ul style={{ margin: "8px 0 0", paddingLeft: "18px" }}>
                {edges.map((edge, index) => (
                  <li key={`${edge.from}-${edge.to}-${index}`} style={{ marginBottom: "4px" }}>
                    <code>
                      {edge.from} -&gt; {edge.to}
                    </code>{" "}
                    <button type="button" onClick={() => onDeleteEdge(index)}>
                      删除
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
