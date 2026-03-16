import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexHtml = fs.readFileSync(path.join(appDir, "index.html"), "utf8");
const packageJson = JSON.parse(fs.readFileSync(path.join(appDir, "package.json"), "utf8"));
const scriptValues = Object.values(packageJson.scripts ?? {}).filter((value) => typeof value === "string");

const failures = [];

if (indexHtml.includes("esm.sh")) {
  failures.push("index.html still depends on esm.sh");
}

if (scriptValues.some((value) => value.includes("python3 -m http.server"))) {
  failures.push("package.json still depends on python3 -m http.server");
}

if (failures.length > 0) {
  console.error("[editor-local-runtime] failed");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("[editor-local-runtime] ok");
