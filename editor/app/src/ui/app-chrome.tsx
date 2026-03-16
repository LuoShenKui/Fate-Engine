export const dockSectionStyle = {
  display: "grid",
  gap: "10px",
  padding: "0",
  borderRadius: "12px",
  border: "1px solid #d8dee8",
  background: "#ffffff",
  boxShadow: "none",
  overflow: "hidden",
} as const;

const dockHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  alignItems: "center",
  padding: "10px 12px",
  borderBottom: "1px solid #e1e6ee",
  background: "#f7f9fc",
} as const;

const dockTitleStyle = {
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  color: "#31475e",
  textTransform: "uppercase",
} as const;

const dockMetaStyle = {
  fontSize: "11px",
  color: "#6a7d92",
} as const;

export const renderDockSection = (title: string, meta: string, body: JSX.Element): JSX.Element => (
  <section style={dockSectionStyle}>
    <div style={dockHeaderStyle}>
      <span style={dockTitleStyle}>{title}</span>
      <span style={dockMetaStyle}>{meta}</span>
    </div>
    <div style={{ padding: "12px" }}>{body}</div>
  </section>
);

export const rightTabButtonStyle = (active: boolean) =>
  ({
    padding: "6px 10px",
    borderRadius: "8px",
    border: "1px solid transparent",
    background: active ? "#eef3f9" : "transparent",
    color: active ? "#203247" : "#607286",
    fontWeight: active ? 700 : 600,
    cursor: "pointer",
    boxShadow: "none",
  }) as const;
