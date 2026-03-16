import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(appDir, "dist");

const failures = [];

const visit = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      visit(fullPath);
      continue;
    }
    if (!entry.name.endsWith(".js")) {
      continue;
    }
    const source = fs.readFileSync(fullPath, "utf8");
    const matches = source.matchAll(/from\s+"(\.[^"]+)"/g);
    for (const match of matches) {
      const specifier = match[1];
      if (!specifier.endsWith(".js") && !specifier.endsWith(".json")) {
        failures.push(`${path.relative(appDir, fullPath)} -> ${specifier}`);
      }
    }
  }
};

visit(distDir);

if (failures.length > 0) {
  console.error("[browser-module-specifiers] failed");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("[browser-module-specifiers] ok");
