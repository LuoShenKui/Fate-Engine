import { ueShellColors } from "./ue-shell-theme";

type EditorLayoutProps = {
  left?: JSX.Element;
  center: JSX.Element;
  right?: JSX.Element;
  bottom?: JSX.Element;
  top?: JSX.Element;
  fullscreenCenter?: boolean;
  maximizedPanel?: "left" | "center" | "right" | "bottom";
};

const panelStyle = {
  overflow: "hidden",
  minHeight: 0,
  minWidth: 0,
  background: ueShellColors.panel,
  borderRight: `1px solid ${ueShellColors.border}`,
} as const;

export default function EditorLayout(props: EditorLayoutProps): JSX.Element {
  if (props.fullscreenCenter) {
    return (
      <div style={{ height: "100vh", display: "grid", gridTemplateRows: "auto minmax(0,1fr)", background: ueShellColors.frame }}>
        {props.top ?? null}
        <div style={{ minHeight: 0 }}>{props.center}</div>
      </div>
    );
  }

  if (props.maximizedPanel !== undefined) {
    const selected =
      props.maximizedPanel === "left" ? props.left :
      props.maximizedPanel === "right" ? props.right :
      props.maximizedPanel === "bottom" ? props.bottom :
      props.center;
    return (
      <div style={{ height: "100vh", display: "grid", gridTemplateRows: "auto minmax(0,1fr)", background: ueShellColors.frame }}>
        {props.top ?? null}
        <div style={{ minHeight: 0 }}>{selected ?? props.center}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "grid",
        gridTemplateRows: "auto minmax(0,1fr) minmax(190px, 31vh)",
        background: ueShellColors.frame,
        color: ueShellColors.text,
        overflow: "hidden",
      }}
    >
      {props.top ?? null}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: props.right === undefined ? "260px minmax(0,1fr)" : "260px minmax(0,1fr) 360px",
          minHeight: 0,
          borderBottom: `1px solid ${ueShellColors.borderStrong}`,
        }}
      >
        {props.left !== undefined ? <section style={panelStyle}>{props.left}</section> : null}
        <section style={{ ...panelStyle, borderRight: props.right === undefined ? "0" : panelStyle.borderRight }}>{props.center}</section>
        {props.right !== undefined ? <section style={{ ...panelStyle, borderRight: "0" }}>{props.right}</section> : null}
      </div>
      <section style={{ minHeight: 0, overflow: "hidden", background: ueShellColors.panel }}>{props.bottom ?? null}</section>
    </div>
  );
}
