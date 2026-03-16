import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const editorLayout = fs.readFileSync(path.join(appDir, "src/ui/EditorLayout.tsx"), "utf8");
const debugToolbar = fs.readFileSync(path.join(appDir, "src/ui/DebugToolbar.tsx"), "utf8");

const failures = [];

if (editorLayout.includes("radial-gradient(") || !editorLayout.includes('background: "#ffffff"')) {
  failures.push("EditorLayout must use a pure white background without hero gradients");
}

if (debugToolbar.includes("rgba(10, 20, 36")) {
  failures.push("DebugToolbar still uses the dark showcase toolbar surface");
}

const buttonCount = [...debugToolbar.matchAll(/<button\b/g)].length;
if (buttonCount > 4) {
  failures.push(`DebugToolbar still renders too many buttons (${buttonCount}) instead of menu-style controls`);
}

if (failures.length > 0) {
  console.error("[editor-surface-style] failed");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("[editor-surface-style] ok");
