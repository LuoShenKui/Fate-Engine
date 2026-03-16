import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uiDir = path.join(appDir, "src", "ui");

const readModule = (fileName) => fs.readFileSync(path.join(uiDir, fileName), "utf8");

const runtimeModule = readModule("app-runtime-actions.ts");
const propertyModule = readModule("app-property-actions.ts");
const rightPanelModule = readModule("app-right-panel.tsx");
const visualScenarioModule = readModule("app-visual-scenarios.ts");
const viewModelModule = readModule("app-view-models.ts");

assert.match(runtimeModule, /export const createAppRuntimeActions\s*=/, "expected createAppRuntimeActions export");
assert.match(propertyModule, /export const createAppPropertyActions\s*=/, "expected createAppPropertyActions export");
assert.match(rightPanelModule, /export const renderAppRightPanel\s*=/, "expected renderAppRightPanel export");
assert.match(visualScenarioModule, /export const applyVisualScenarioPreset\s*=/, "expected applyVisualScenarioPreset export");
assert.match(viewModelModule, /export const buildBusinessValidationItems\s*=/, "expected buildBusinessValidationItems export");

console.log("[app-action-modules] ok source modules and exports present");
