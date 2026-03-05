export default function GraphCanvasPanel(): JSX.Element {
  return (
    <div>
      <h2>GraphCanvasPanel</h2>
      <div
        style={{
          height: "100%",
          minHeight: "320px",
          border: "1px dashed #8c959f",
          borderRadius: "6px",
          display: "grid",
          placeItems: "center",
          color: "#57606a",
        }}
      >
        节点/连线画布预留区域
      </div>
    </div>
  );
}
