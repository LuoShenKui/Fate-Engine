import { uePanelSurface, ueShellColors } from "./ue-shell-theme";

type EditorLayoutProps = {
  left?: JSX.Element;
  center: JSX.Element;
  right?: JSX.Element;
  bottom?: JSX.Element;
  top?: JSX.Element;
  fullscreenCenter?: boolean;
  maximizedPanel?: "left" | "center" | "right" | "bottom";
};

const frameStyle = {
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
  gap: "10px",
  height: "100vh",
  padding: "10px",
  boxSizing: "border-box",
  background: ueShellColors.frame,
} as const;

const panelStyle = {
  ...uePanelSurface,
  borderRadius: "10px",
  padding: "10px",
  overflow: "hidden",
} as const;

const bottomPanelStyle = {
  ...panelStyle,
  padding: "8px 10px",
  background: ueShellColors.frameRaised,
} as const;

export default function EditorLayout(props: EditorLayoutProps): JSX.Element {
  const activeMaximizedPanel = props.maximizedPanel;

  if ((activeMaximizedPanel === "left" && props.left !== undefined) || activeMaximizedPanel === "center" || (activeMaximizedPanel === "right" && props.right !== undefined)) {
    const panel = activeMaximizedPanel === "left" ? props.left : activeMaximizedPanel === "right" ? props.right : props.center;
    return (
      <div style={{ ...frameStyle, gridTemplateRows: "1fr", padding: "0", gap: "0" }}>
        <section style={{ ...panelStyle, borderRadius: "0", padding: "10px", display: "grid", minHeight: 0 }}>
          {panel}
        </section>
      </div>
    );
  }

  if (activeMaximizedPanel === "bottom" && props.bottom !== undefined) {
    return (
      <div style={frameStyle}>
        {props.top ?? null}
        <section style={{ ...bottomPanelStyle, minHeight: 0, display: "grid" }}>{props.bottom}</section>
      </div>
    );
  }

  const resolvedLeft = activeMaximizedPanel === undefined || activeMaximizedPanel === "left" ? props.left : undefined;
  const resolvedCenter = activeMaximizedPanel === undefined ? props.center : undefined;
  const resolvedRight = activeMaximizedPanel === undefined || activeMaximizedPanel === "right" ? props.right : undefined;
  const panels = [resolvedLeft, resolvedCenter, resolvedRight].filter((panel): panel is JSX.Element => panel !== undefined);
  const columns = props.fullscreenCenter ? "minmax(0, 1fr)" : panels.length === 3 ? "280px minmax(0, 1fr) 340px" : panels.length === 2 ? "280px minmax(0, 1fr)" : "minmax(0, 1fr)";

  return (
    <div style={frameStyle}>
      {props.top ?? null}
      <div style={{ display: "grid", gridTemplateColumns: columns, gap: "12px", minHeight: 0 }}>
        {panels.map((panel, index) => (
          <section key={index} style={{ ...panelStyle, display: "grid", minHeight: 0 }}>
            {panel}
          </section>
        ))}
      </div>
      {props.bottom !== undefined && activeMaximizedPanel === undefined ? <section style={bottomPanelStyle}>{props.bottom}</section> : null}
    </div>
  );
}
