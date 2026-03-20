import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/ui/GraphCanvasPanel.tsx", import.meta.url), "utf8");

const requirements = [
  source.includes("lastSceneResetAtRef"),
  source.includes("cameraInteractionArmedRef"),
  source.includes("const resetEditorCamera = (): void =>"),
  source.includes("cameraInteractionArmedRef.current = false"),
  source.includes("cameraInteractionArmedRef.current = true"),
  source.includes("performance.now() - lastSceneResetAtRef.current < 350 || !cameraInteractionArmedRef.current"),
  source.includes("[camera_zoom_ignored]"),
];

if (requirements.some((passed) => !passed)) {
  console.error("[graph-camera-scene-reset-guard] expected scene reset to clear canvas interaction state and gate wheel zoom");
  process.exit(1);
}

console.log("[graph-camera-scene-reset-guard] ok");
