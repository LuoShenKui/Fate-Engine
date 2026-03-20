import { readFileSync } from "node:fs";

const themeSource = readFileSync(new URL("../src/ui/ue-shell-theme.ts", import.meta.url), "utf8");
const layoutSource = readFileSync(new URL("../src/ui/EditorLayout.tsx", import.meta.url), "utf8");
const chromeSource = readFileSync(new URL("../src/ui/app-chrome.tsx", import.meta.url), "utf8");
const validationDockSource = readFileSync(new URL("../src/ui/AppValidationDock.tsx", import.meta.url), "utf8");

const requirements = [
  themeSource.includes('frame: "#11161d"'),
  themeSource.includes('panel: "#1a212b"'),
  layoutSource.includes('background: ueShellColors.frame'),
  layoutSource.includes('panels.length === 3 ? "280px minmax(0, 1fr) 340px"'),
  chromeSource.includes("uePanelSurface"),
  validationDockSource.includes("ueShellColors.frameRaised"),
];

if (requirements.some((passed) => !passed)) {
  console.error("[ue-shell-layout] expected dark shell theme, viewport-first columns, and drawer-style validation dock");
  process.exit(1);
}

console.log("[ue-shell-layout] ok");
