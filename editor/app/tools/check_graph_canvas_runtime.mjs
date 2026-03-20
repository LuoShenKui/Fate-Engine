import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "editor/app");
const canvasSource = readFileSync(resolve(root, "src/ui/GraphCanvasPanel.tsx"), "utf8");
const chromeSource = readFileSync(resolve(root, "src/ui/app-chrome.tsx"), "utf8");
const appSource = readFileSync(resolve(root, "src/ui/App.tsx"), "utf8");
const rightPanelSource = readFileSync(resolve(root, "src/ui/app-right-panel.tsx"), "utf8");
const validationDockSource = readFileSync(resolve(root, "src/ui/AppValidationDock.tsx"), "utf8");

const failures = [];

if (!canvasSource.includes("viewport-render-state")) {
  failures.push("viewport render-state marker missing");
}

if (!canvasSource.includes("webglState")) {
  failures.push("webgl diagnostic state missing");
}

if (!canvasSource.includes("renderHeartbeat")) {
  failures.push("render heartbeat state missing");
}

if (!chromeSource.includes("dockHeaderButtonStyle") || !appSource.includes("maximizeAction") || !rightPanelSource.includes("maximize") || !validationDockSource.includes("maximize")) {
  failures.push("dock maximize controls missing");
}

if (failures.length > 0) {
  console.error("[graph-canvas-runtime] fail");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("[graph-canvas-runtime] ok");
