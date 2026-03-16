import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(appDir, "dist");

const rewriteSource = (source) =>
  source.replace(/(from\s+"(\.[^"]+)")/g, (full, statement, specifier) => {
    if (specifier.endsWith(".js") || specifier.endsWith(".json")) {
      return statement;
    }
    return statement.replace(specifier, `${specifier}.js`);
  });

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
    const rewritten = rewriteSource(source);
    if (rewritten !== source) {
      fs.writeFileSync(fullPath, rewritten, "utf8");
    }
  }
};

visit(distDir);
console.log("[prepare-browser-preview] ok");
