import type { CameraMode } from "./graph-canvas-types";

type GraphCanvasHudProps = {
  fps: number;
  cameraMode: CameraMode;
  playtestFullscreen?: boolean;
  actorLabel?: string;
  actorPosition: [number, number, number];
  actorSpeed?: number;
  activeAbilityNames?: string[];
  title: string;
  actorDefaultLabel: string;
  actorAbilitiesText: string;
  actorAbilitiesEmptyText: string;
  interactionPrompt?: string;
  grounded: boolean;
  onLadder: boolean;
  orbitDistance: number;
  onChangeCameraMode: (mode: CameraMode) => void;
  onExitPlaytestFullscreen?: () => void;
};

const cameraLabel = (mode: CameraMode): string => (mode === "editor" ? "编辑视角" : mode === "first" ? "第一视角" : "第三视角");

export function GraphCanvasHud(props: GraphCanvasHudProps): JSX.Element {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", padding: "2px 2px 0" }}>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          <span style={{ padding: "3px 7px", borderRadius: "4px", background: "#20262e", border: "1px solid #343c46", fontSize: "10px", color: "#cbd7e4", fontVariantNumeric: "tabular-nums" }}>{`FPS ${props.fps}`}</span>
          <button type="button" onClick={() => props.onChangeCameraMode("first")} style={{ padding: "3px 7px", borderRadius: "4px", background: props.cameraMode === "first" ? "#2c3540" : "#1b2027", border: props.cameraMode === "first" ? "1px solid #6d7885" : "1px solid #2d353f", fontSize: "10px", color: "#dce6f2", cursor: "pointer" }}>第一视角</button>
          <button type="button" onClick={() => props.onChangeCameraMode("third")} style={{ padding: "3px 7px", borderRadius: "4px", background: props.cameraMode === "third" ? "#2c3540" : "#1b2027", border: props.cameraMode === "third" ? "1px solid #6d7885" : "1px solid #2d353f", fontSize: "10px", color: "#dce6f2", cursor: "pointer" }}>第三视角</button>
          <button type="button" onClick={() => props.onChangeCameraMode("editor")} style={{ padding: "3px 7px", borderRadius: "4px", background: props.cameraMode === "editor" ? "#2c3540" : "#1b2027", border: props.cameraMode === "editor" ? "1px solid #6d7885" : "1px solid #2d353f", fontSize: "10px", color: "#dce6f2", cursor: "pointer" }}>编辑视角</button>
        </div>
        <span style={{ fontSize: "10px", color: "#97a9bd", letterSpacing: "0.04em", textTransform: "uppercase" }}>{props.playtestFullscreen ? "Third Person Test" : props.title}</span>
      </div>
      {props.playtestFullscreen && props.onExitPlaytestFullscreen !== undefined ? (
        <button
          type="button"
          onClick={props.onExitPlaytestFullscreen}
          style={{ position: "absolute", top: "12px", right: "12px", padding: "5px 9px", borderRadius: "4px", border: "1px solid #3a4656", background: "#20262e", color: "#dce6f2", cursor: "pointer", zIndex: 3, fontSize: "10px" }}
        >
          退出全屏测试
        </button>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: "12px",
          bottom: "12px",
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap",
          padding: "7px 10px",
          borderRadius: "4px",
          background: "rgba(18, 22, 28, 0.84)",
          border: "1px solid #323a44",
          color: "#dfe8f2",
          fontSize: "10px",
          pointerEvents: "none",
          maxWidth: "calc(100% - 24px)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <strong style={{ fontSize: "10px", color: "#ffffff" }}>{props.actorLabel ?? props.actorDefaultLabel}</strong>
        <div>{cameraLabel(props.cameraMode)}</div>
        <div>{`Actor XYZ ${props.actorPosition[0].toFixed(2)} / ${props.actorPosition[1].toFixed(2)} / ${props.actorPosition[2].toFixed(2)}`}</div>
        {props.actorSpeed !== undefined ? <div>{`Speed ${props.actorSpeed.toFixed(2)} m/s`}</div> : null}
        {props.cameraMode === "editor" ? <div>{`Orbit ${props.orbitDistance.toFixed(1)}m`}</div> : null}
        <div>{props.onLadder ? "梯子中" : props.grounded ? "落地" : "空中"}</div>
        <div>{props.activeAbilityNames !== undefined && props.activeAbilityNames.length > 0 ? props.actorAbilitiesText : props.actorAbilitiesEmptyText}</div>
        {props.interactionPrompt !== undefined ? <div style={{ color: "#9fe0b2", fontWeight: 700 }}>{props.interactionPrompt}</div> : null}
      </div>
    </>
  );
}

type GraphCanvasDebugListProps = {
  nodes: Array<{ id: string; type?: string }>;
  edges: Array<{ from: string; to: string }>;
  defaultNodeType?: string;
  onSelectNode?: (nodeId: string) => void;
  onAddNode: () => void;
  onAddEdge: () => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge: (index: number) => void;
};

export function GraphCanvasDebugList(props: GraphCanvasDebugListProps): JSX.Element {
  return (
    <details>
      <summary style={{ cursor: "pointer", marginBottom: "8px", color: "#dce6f2" }}>调试列表（节点/连线）</summary>
      <div style={{ width: "100%", display: "grid", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" onClick={props.onAddNode} style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #445264", background: "#273240", color: "#d9e3ef" }}>
            {`+ 节点${props.defaultNodeType !== undefined ? ` (${props.defaultNodeType})` : ""}`}
          </button>
          <button type="button" onClick={props.onAddEdge} disabled={props.nodes.length < 2} style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #445264", background: props.nodes.length < 2 ? "#1c2430" : "#273240", color: "#d9e3ef" }}>
            + 连线
          </button>
        </div>
        <div>
          <strong style={{ color: "#f3f7fb" }}>节点</strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: "18px", color: "#b8c6d4" }}>
            {props.nodes.map((node) => (
              <li key={node.id} style={{ marginBottom: "4px" }}>
                <button type="button" onClick={() => props.onSelectNode?.(node.id)} style={{ border: "none", background: "transparent", padding: 0, fontFamily: "monospace", color: "#1c4e9a", cursor: "pointer" }}>
                  {node.id}
                </button>{" "}
                <span>({node.type ?? "unknown"})</span>{" "}
                <button type="button" onClick={() => props.onDeleteNode(node.id)} style={{ padding: "2px 8px", borderRadius: "8px", border: "1px solid #7a6241", background: "#534325", color: "#ffefc9" }}>
                  删除
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <strong style={{ color: "#f3f7fb" }}>连线</strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: "18px", color: "#b8c6d4" }}>
            {props.edges.map((edge, index) => (
              <li key={`${edge.from}-${edge.to}-${index}`} style={{ marginBottom: "4px" }}>
                <code>
                  {edge.from} -&gt; {edge.to}
                </code>{" "}
                <button type="button" onClick={() => props.onDeleteEdge(index)} style={{ padding: "2px 8px", borderRadius: "8px", border: "1px solid #7a6241", background: "#534325", color: "#ffefc9" }}>
                  删除
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}
