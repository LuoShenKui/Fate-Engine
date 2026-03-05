type EditorLayoutProps = {
  left: JSX.Element;
  center: JSX.Element;
  right: JSX.Element;
  bottom: JSX.Element;
  top?: JSX.Element;
};

const frameStyle = {
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
  gap: "8px",
  height: "100vh",
  padding: "8px",
  boxSizing: "border-box",
} as const;

const mainStyle = {
  display: "grid",
  gridTemplateColumns: "260px 1fr 320px",
  gap: "8px",
  minHeight: 0,
} as const;

const panelStyle = {
  border: "1px solid #d0d7de",
  borderRadius: "8px",
  padding: "10px",
  overflow: "auto",
  background: "#fff",
} as const;

export default function EditorLayout(props: EditorLayoutProps): JSX.Element {
  return (
    <div style={frameStyle}>
      {props.top ?? null}
      <div style={mainStyle}>
        <section style={panelStyle}>{props.left}</section>
        <section style={panelStyle}>{props.center}</section>
        <section style={panelStyle}>{props.right}</section>
      </div>
      <section style={panelStyle}>{props.bottom}</section>
    </div>
  );
}
