import { ueGhostButton, uePanelSurface, ueShellColors } from "./ue-shell-theme";

export const dockSectionStyle = {
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  gap: "6px",
  height: "100%",
  padding: "0",
  borderRadius: "6px",
  ...uePanelSurface,
  overflow: "hidden",
  minHeight: 0,
} as const;

const dockHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  alignItems: "center",
  padding: "6px 8px",
  borderBottom: `1px solid ${ueShellColors.border}`,
  background: ueShellColors.panelMuted,
} as const;

const dockTitleStyle = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  color: ueShellColors.textMuted,
  textTransform: "uppercase",
} as const;

const dockMetaStyle = {
  fontSize: "10px",
  color: ueShellColors.textMuted,
} as const;

export const renderDockSection = (title: string, meta: string, body: JSX.Element, actions?: JSX.Element): JSX.Element => (
  <section style={dockSectionStyle}>
    <div style={dockHeaderStyle}>
      <div style={{ display: "flex", gap: "10px", alignItems: "center", minWidth: 0 }}>
        <span style={dockTitleStyle}>{title}</span>
        <span style={dockMetaStyle}>{meta}</span>
      </div>
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        {actions}
      </div>
    </div>
    <div style={{ padding: "8px", overflow: "hidden", display: "grid", gridTemplateRows: "minmax(0, 1fr)", minHeight: 0, height: "100%", background: ueShellColors.panel }}>{body}</div>
  </section>
);

export const dockHeaderButtonStyle = {
  padding: "3px 8px",
  ...ueGhostButton,
  fontSize: "10px",
} as const;

export const rightTabButtonStyle = (active: boolean) =>
  ({
    padding: "6px 10px",
    borderRadius: "8px",
    border: `1px solid ${active ? ueShellColors.accentMuted : "transparent"}`,
    background: active ? "#332913" : "transparent",
    color: active ? "#f6d58a" : ueShellColors.textMuted,
    fontWeight: active ? 700 : 600,
    cursor: "pointer",
    boxShadow: "none",
  }) as const;
