import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "editor/app");

const appSource = readFileSync(resolve(root, "src/ui/App.tsx"), "utf8");
const toolbarSource = readFileSync(resolve(root, "src/ui/DebugToolbar.tsx"), "utf8");
const layoutStatePath = resolve(root, "src/ui/editor-layout-state.ts");

const failures = [];

try {
  readFileSync(layoutStatePath, "utf8");
} catch {
  failures.push("missing editor layout state module");
}

if (toolbarSource.includes("<details")) {
  failures.push("toolbar still uses <details> menus");
}

if (appSource.includes('"Palette"')) {
  failures.push("left dock still uses the ambiguous Palette title");
}

if (!appSource.includes("AppValidationDock")) {
  failures.push("validation summary bar dock is not wired into App.tsx");
}

if (!appSource.includes("hiddenPanels")) {
  failures.push("App.tsx does not manage hideable panel state");
}

if (failures.length > 0) {
  console.error("[editor-shell-layout] fail");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("[editor-shell-layout] ok");
