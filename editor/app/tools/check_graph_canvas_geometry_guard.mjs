import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/ui/GraphCanvasPanel.tsx", import.meta.url), "utf8");

const requirements = [
  source.includes('position: "relative", minHeight: 0, height: "100%", overflow: "hidden"'),
  source.includes('display: "block", minHeight: "320px", width: "100%", height: "100%"'),
];

if (requirements.some((passed) => !passed)) {
  console.error("[graph-canvas-geometry-guard] expected viewport wrapper height to be constrained and canvas to render as block");
  process.exit(1);
}

console.log("[graph-canvas-geometry-guard] ok");
