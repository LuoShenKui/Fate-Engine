import type { CanvasNode } from "./GraphCanvasPanel";
import { ueShellColors } from "./ue-shell-theme";

type HierarchyPanelProps = {
  nodes: CanvasNode[];
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
};

const rowStyle = (active: boolean) =>
  ({
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minHeight: "28px",
    padding: "4px 8px",
    border: "0",
    borderRadius: "3px",
    background: active ? "#255b96" : "transparent",
    color: active ? "#ffffff" : ueShellColors.text,
    textAlign: "left",
    cursor: "pointer",
    fontSize: "12px",
  }) as const;

const displayName = (node: CanvasNode): string => {
  const name = node.meta?.displayName;
  if (typeof name === "string" && name.trim().length > 0) return name;
  return node.id;
};

export default function HierarchyPanel(props: HierarchyPanelProps): JSX.Element {
  return (
    <div style={{ display: "grid", gridTemplateRows: "auto minmax(0,1fr)", minHeight: 0, height: "100%" }}>
      <div style={{ padding: "7px 8px", borderBottom: `1px solid ${ueShellColors.border}` }}>
        <input
          aria-label="Search hierarchy"
          placeholder="Search..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: `1px solid ${ueShellColors.borderStrong}`,
            background: "#171c22",
            color: ueShellColors.text,
            borderRadius: "4px",
            padding: "6px 8px",
            fontSize: "11px",
          }}
        />
      </div>
      <div style={{ overflow: "auto", padding: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 5px", color: "#f1f4f7", fontWeight: 700, fontSize: "12px" }}>
          <span style={{ color: ueShellColors.textMuted }}>▾</span>
          <span>◇</span>
          <span>SampleScene</span>
        </div>
        <div style={{ marginLeft: "14px", borderLeft: `1px solid ${ueShellColors.border}`, paddingLeft: "6px", display: "grid", gap: "1px" }}>
          <button type="button" style={rowStyle(false)}><span>▣</span><span>Main Camera</span></button>
          <button type="button" style={rowStyle(false)}><span>☀</span><span>Directional Light</span></button>
          {props.nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => props.onSelectNode(node.id)}
              style={rowStyle(node.id === props.selectedNodeId)}
              title={node.type ?? node.id}
            >
              <span style={{ color: "#aebbc9" }}>◇</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName(node)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
