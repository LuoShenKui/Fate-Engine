export const ueShellColors = {
  frame: "#11161d",
  frameRaised: "#161d26",
  panel: "#1a212b",
  panelMuted: "#202a35",
  border: "#2b3744",
  borderStrong: "#3a4859",
  text: "#dbe5ef",
  textMuted: "#91a0b2",
  accent: "#f3b33e",
  accentMuted: "#5a4a24",
} as const;

export const uePanelSurface = {
  background: ueShellColors.panel,
  border: `1px solid ${ueShellColors.border}`,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
} as const;

export const ueGhostButton = {
  borderRadius: "4px",
  border: `1px solid ${ueShellColors.borderStrong}`,
  background: ueShellColors.panelMuted,
  color: ueShellColors.text,
  cursor: "pointer",
} as const;
