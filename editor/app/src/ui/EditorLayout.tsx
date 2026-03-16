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
  gap: "12px",
  height: "100vh",
  padding: "14px",
  boxSizing: "border-box",
  background: "#ffffff",
} as const;

const mainStyle = {
  display: "grid",
  gridTemplateColumns: "300px minmax(0, 1fr) 360px",
  gap: "12px",
  minHeight: 0,
} as const;

const panelStyle = {
  border: "1px solid #d7dee8",
  borderRadius: "14px",
  padding: "14px",
  overflow: "auto",
  background: "#fbfcfe",
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
} as const;

const bottomPanelStyle = {
  ...panelStyle,
  padding: "12px 14px",
  background: "#fbfcfe",
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
      <section style={bottomPanelStyle}>{props.bottom}</section>
    </div>
  );
}
