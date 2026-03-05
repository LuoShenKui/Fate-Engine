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

type CameraState = { yaw: number; pitch: number; distance: number };
type Mat4 = Float32Array;
type Vec3 = [number, number, number];

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

const mat4Identity = (): Mat4 => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
const mat4Multiply = (a: Mat4, b: Mat4): Mat4 => {
  const out = new Float32Array(16);
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return out;
};
const mat4Perspective = (fov: number, aspect: number, near: number, far: number): Mat4 => {
  const f = 1 / Math.tan(fov / 2);
  const nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
};
const vec3Normalize = (v: Vec3): Vec3 => {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
};
const vec3Cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vec3Sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mat4LookAt = (eye: Vec3, center: Vec3, up: Vec3): Mat4 => {
  const z = vec3Normalize(vec3Sub(eye, center));
  const x = vec3Normalize(vec3Cross(up, z));
  const y = vec3Cross(z, x);
  return new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]),
    -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]),
    -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]),
    1,
  ]);
};
const mat4Translate = (x: number, y: number, z: number): Mat4 => {
  const m = mat4Identity();
  m[12] = x;
  m[13] = y;
  m[14] = z;
  return m;
};
const mat4RotateY = (rad: number): Mat4 => new Float32Array([Math.cos(rad), 0, -Math.sin(rad), 0, 0, 1, 0, 0, Math.sin(rad), 0, Math.cos(rad), 0, 0, 0, 0, 1]);
const mat4Scale = (x: number, y: number, z: number): Mat4 => new Float32Array([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]);

const compileShader = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
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

export default function GraphCanvasPanel({ nodes, edges, onChange, onInteract, onDoorPositionsChange, onActorPositionChange }: GraphCanvasPanelProps): JSX.Element {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<CameraState>({ yaw: 0.6, pitch: 0.4, distance: 9 });
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const doorAnimRef = useRef<Record<string, { current: number; target: number }>>({});

  const doorEntities = useMemo(() => nodes.filter((node) => node.type === "door").map(toDoorEntity), [nodes]);

  useEffect(() => {
    const nextPositions: Record<string, [number, number, number]> = {};
    doorEntities.forEach((entity) => {
      nextPositions[entity.id] = entity.transform.position;
      doorAnimRef.current[entity.id] = doorAnimRef.current[entity.id] ?? { current: 0, target: 0 };
    });
    Object.keys(doorAnimRef.current).forEach((id) => {
      if (!nextPositions[id]) {
        delete doorAnimRef.current[id];
      }
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
    const gl = canvas.getContext("webgl", { antialias: true, alpha: false });
    if (gl === null) {
      return;
    }

    const vertexShader = compileShader(
      gl,
      gl.VERTEX_SHADER,
      `attribute vec3 aPos;uniform mat4 uMvp;void main(){gl_Position=uMvp*vec4(aPos,1.0);}`,
    );
    const fragmentShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      `precision mediump float;uniform vec4 uColor;void main(){gl_FragColor=uColor;}`,
    );
    if (vertexShader === null || fragmentShader === null) {
      return;
    }
    const program = gl.createProgram();
    if (program === null) {
      return;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return;
    }

    const posLoc = gl.getAttribLocation(program, "aPos");
    const mvpLoc = gl.getUniformLocation(program, "uMvp");
    const colorLoc = gl.getUniformLocation(program, "uColor");
    if (posLoc < 0 || mvpLoc === null || colorLoc === null) {
      return;
    }

    const cubeVertices = new Float32Array([
      -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
      -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
    ]);
    const cubeIndices = new Uint16Array([
      0, 1, 2, 0, 2, 3, 1, 5, 6, 1, 6, 2, 5, 4, 7, 5, 7, 6,
      4, 0, 3, 4, 3, 7, 3, 2, 6, 3, 6, 7, 4, 5, 1, 4, 1, 0,
    ]);

    const vbo = gl.createBuffer();
    const ebo = gl.createBuffer();
    if (vbo === null || ebo === null) {
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeIndices, gl.STATIC_DRAW);

    const resize = (): void => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
    };

    const drawBox = (viewProj: Mat4, model: Mat4, color: [number, number, number, number]): void => {
      const mvp = mat4Multiply(viewProj, model);
      gl.uniformMatrix4fv(mvpLoc, false, mvp);
      gl.uniform4f(colorLoc, color[0], color[1], color[2], color[3]);
      gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);
    };

    let raf = 0;
    const render = (): void => {
      resize();
      gl.clearColor(0.964, 0.973, 0.98, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(posLoc);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);

      const target: Vec3 = [0, 1, 0];
      const camera = cameraRef.current;
      const eye: Vec3 = [
        target[0] + Math.sin(camera.yaw) * Math.cos(camera.pitch) * camera.distance,
        target[1] + Math.sin(camera.pitch) * camera.distance,
        target[2] + Math.cos(camera.yaw) * Math.cos(camera.pitch) * camera.distance,
      ];

      const view = mat4LookAt(eye, target, [0, 1, 0]);
      const projection = mat4Perspective((55 * Math.PI) / 180, canvas.width / Math.max(1, canvas.height), 0.1, 100);
      const viewProj = mat4Multiply(projection, view);

      drawBox(viewProj, mat4Multiply(mat4Translate(0, -0.03, 0), mat4Scale(30, 0.02, 30)), [0.87, 0.91, 0.94, 1]);

      for (let i = -12; i <= 12; i += 1) {
        drawBox(viewProj, mat4Multiply(mat4Translate(i, 0.001, 0), mat4Scale(0.01, 0.01, 24)), [0.82, 0.84, 0.87, 0.9]);
        drawBox(viewProj, mat4Multiply(mat4Translate(0, 0.001, i), mat4Scale(24, 0.01, 0.01)), [0.82, 0.84, 0.87, 0.9]);
      }

      doorEntities.forEach((door) => {
        const anim = doorAnimRef.current[door.id] ?? { current: 0, target: 0 };
        anim.current += (anim.target - anim.current) * 0.15;
        doorAnimRef.current[door.id] = anim;

        const pivot = mat4Multiply(mat4Translate(...door.transform.position), mat4RotateY(-anim.current * Math.PI * 0.5));
        const doorModel = mat4Multiply(
          pivot,
          mat4Multiply(
            mat4Translate(door.collider.size[0] * 0.5, door.collider.size[1] * 0.5, 0),
            mat4Scale(door.collider.size[0], door.collider.size[1], door.collider.size[2]),
          ),
        );
        drawBox(viewProj, doorModel, [0.18, 0.51, 0.97, 1]);

        const gizmo = mat4Multiply(
          mat4Translate(...door.transform.position),
          mat4Multiply(mat4Translate(door.collider.size[0] * 0.5, door.collider.size[1] * 0.5, 0), mat4Scale(door.collider.size[0] * 1.8, door.collider.size[1] * 1.1, door.collider.size[2] * 4)),
        );
        drawBox(viewProj, gizmo, [1, 0.48, 0.45, 0.18]);
      });

      nodes
        .filter((node) => node.type !== "door")
        .forEach((_, index) => {
          drawBox(viewProj, mat4Multiply(mat4Translate(index * 1.4, 0.35, -2.5), mat4Scale(0.18, 0.18, 0.18)), [0.49, 0.52, 0.56, 1]);
        });

      raf = window.requestAnimationFrame(render);
    };
    raf = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(raf);
      gl.deleteBuffer(vbo);
      gl.deleteBuffer(ebo);
      gl.deleteProgram(program);
    };
  }, [doorEntities, nodes]);

  const onPointerDown = (event: { clientX: number; clientY: number }): void => {
    pointerRef.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerMove = (event: { clientX: number; clientY: number }): void => {
    if (pointerRef.current === null) {
      return;
    }
    const dx = event.clientX - pointerRef.current.x;
    const dy = event.clientY - pointerRef.current.y;
    pointerRef.current = { x: event.clientX, y: event.clientY };
    cameraRef.current = {
      ...cameraRef.current,
      yaw: cameraRef.current.yaw + dx * 0.01,
      pitch: Math.max(-1.2, Math.min(1.2, cameraRef.current.pitch + dy * 0.01)),
    };
  };

  const onPointerUp = (): void => {
    pointerRef.current = null;
  };

  const onWheel = (event: { deltaY: number; preventDefault: () => void }): void => {
    event.preventDefault();
    cameraRef.current = {
      ...cameraRef.current,
      distance: Math.max(3, Math.min(16, cameraRef.current.distance + event.deltaY * 0.01)),
    };
  };

  const onCanvasClick = (event: { clientX: number; clientY: number; currentTarget: { getBoundingClientRect: () => DOMRect } }): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const target: Vec3 = [0, 1, 0];
    const camera = cameraRef.current;
    const eye: Vec3 = [
      target[0] + Math.sin(camera.yaw) * Math.cos(camera.pitch) * camera.distance,
      target[1] + Math.sin(camera.pitch) * camera.distance,
      target[2] + Math.cos(camera.yaw) * Math.cos(camera.pitch) * camera.distance,
    ];

    const forward = vec3Normalize(vec3Sub(target, eye));
    const right = vec3Normalize(vec3Cross(forward, [0, 1, 0]));
    const up = vec3Normalize(vec3Cross(right, forward));
    const tanFov = Math.tan((55 * Math.PI) / 360);
    const dir = vec3Normalize([
      forward[0] + right[0] * nx * tanFov * (rect.width / Math.max(1, rect.height)) + up[0] * ny * tanFov,
      forward[1] + right[1] * nx * tanFov * (rect.width / Math.max(1, rect.height)) + up[1] * ny * tanFov,
      forward[2] + right[2] * nx * tanFov * (rect.width / Math.max(1, rect.height)) + up[2] * ny * tanFov,
    ]);

    const hitDoor = doorEntities.find((door) => {
      const anim = doorAnimRef.current[door.id] ?? { current: 0, target: 0 };
      const angle = -anim.current * Math.PI * 0.5;
      const localOrigin = vec3Sub(eye, door.transform.position);
      const cos = Math.cos(-angle);
      const sin = Math.sin(-angle);
      const ox = localOrigin[0] * cos - localOrigin[2] * sin;
      const oz = localOrigin[0] * sin + localOrigin[2] * cos;
      const dx = dir[0] * cos - dir[2] * sin;
      const dz = dir[0] * sin + dir[2] * cos;

      const min: Vec3 = [0, 0, -door.collider.size[2] * 0.5];
      const max: Vec3 = [door.collider.size[0], door.collider.size[1], door.collider.size[2] * 0.5];

      let tMin = -Infinity;
      let tMax = Infinity;
      const origin: Vec3 = [ox, localOrigin[1], oz];
      const ray: Vec3 = [dx, dir[1], dz];

      for (let i = 0; i < 3; i += 1) {
        if (Math.abs(ray[i]) < 1e-5) {
          if (origin[i] < min[i] || origin[i] > max[i]) {
            return false;
          }
          continue;
        }
        const t1 = (min[i] - origin[i]) / ray[i];
        const t2 = (max[i] - origin[i]) / ray[i];
        tMin = Math.max(tMin, Math.min(t1, t2));
        tMax = Math.min(tMax, Math.max(t1, t2));
      }

      return tMax >= Math.max(0, tMin);
    });

    if (hitDoor !== undefined) {
      const anim = doorAnimRef.current[hitDoor.id] ?? { current: 0, target: 0 };
      anim.target = anim.target > 0.1 ? 0 : 1;
      doorAnimRef.current[hitDoor.id] = anim;
      onInteract?.(hitDoor.id);
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
