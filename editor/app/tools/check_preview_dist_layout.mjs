import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(appDir, "dist");
const legacyDistDir = path.join(distDir, "editor", "app", "src");

if (!fs.existsSync(distDir)) {
  console.error("[preview-dist-layout] failed");
  console.error("- dist output directory is missing");
  process.exit(1);
}

if (fs.existsSync(legacyDistDir)) {
  console.error("[preview-dist-layout] failed");
  console.error(`- legacy dist tree still exists: ${path.relative(appDir, legacyDistDir)}`);
  process.exit(1);
}

console.log("[preview-dist-layout] ok");
