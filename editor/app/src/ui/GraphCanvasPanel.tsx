import { useI18n } from "./i18n/I18nProvider";

export type CanvasNode = {
  id: string;
  type?: string;
};

export type CanvasEdge = {
  from: string;
  to: string;
};

type GraphCanvasPanelProps = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  onChange: (next: { nodes: CanvasNode[]; edges: CanvasEdge[] }) => void;
};

export default function GraphCanvasPanel({ nodes, edges, onChange }: GraphCanvasPanelProps): JSX.Element {
  const { t } = useI18n();

  const onAddNode = (): void => {
    const nextId = `node-${Date.now()}`;
    onChange({
      nodes: [...nodes, { id: nextId, type: "custom" }],
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
        }}
      >
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
      </div>
    </div>
  );
}
