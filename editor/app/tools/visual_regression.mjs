import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const appDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const baselineDir = path.join(appDir, 'tests', 'visual-baseline');
const currentDir = path.join(appDir, 'tests', 'visual-current');
const diffDir = path.join(appDir, 'tests', 'visual-diff');
const updateBaseline = process.argv.includes('--update-baseline');
const maxDiffPixels = Number(process.env.VISUAL_MAX_DIFF_PIXELS ?? '150');
const maxDiffRatio = Number(process.env.VISUAL_MAX_DIFF_RATIO ?? '0.0015');
const port = 5173;

const scenarios = [
  { name: 'default', query: '' },
  { name: 'door-lock-unlock', query: '?visualScenario=door-lock-unlock' },
  { name: 'validation-levels', query: '?visualScenario=validation-levels' },
];

for (const dir of [baselineDir, currentDir, diffDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
]);

const resolvePath = (urlPath) => {
  const cleanPath = urlPath.split('?')[0];
  const normalized = cleanPath === '/' ? '/index.html' : cleanPath;
  const abs = path.join(appDir, normalized);
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;
  const withJs = `${abs}.js`;
  if (fs.existsSync(withJs) && fs.statSync(withJs).isFile()) return withJs;
  return null;
};

const server = http.createServer((req, res) => {
  const filePath = resolvePath(req.url ?? '/');
  if (filePath === null) {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }
  const ext = path.extname(filePath);
  res.setHeader('Content-Type', mime.get(ext) ?? 'application/octet-stream');
  res.end(fs.readFileSync(filePath));
});

const readPng = (filePath) => PNG.sync.read(fs.readFileSync(filePath));

const compareImages = (baselinePath, currentPath, diffPath) => {
  const baseline = readPng(baselinePath);
  const current = readPng(currentPath);
  if (baseline.width !== current.width || baseline.height !== current.height) {
    return { diffPixels: Number.POSITIVE_INFINITY, totalPixels: current.width * current.height };
  }
  const diff = new PNG({ width: current.width, height: current.height });
  const diffPixels = pixelmatch(baseline.data, current.data, diff.data, current.width, current.height, { threshold: 0.1 });
  fs.writeFileSync(diffPath, PNG.sync.write(diff));
  return { diffPixels, totalPixels: current.width * current.height };
};

const run = async () => {
  let failed = false;
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    for (const scenario of scenarios) {
      await page.goto(`http://127.0.0.1:${port}/${scenario.query}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('[data-testid="editor-page-ready"]', { state: 'visible', timeout: 20000 });
      await page.waitForTimeout(300);
      const currentPath = path.join(currentDir, `${scenario.name}.png`);
      const baselinePath = path.join(baselineDir, `${scenario.name}.png`);
      const diffPath = path.join(diffDir, `${scenario.name}.png`);
      await page.screenshot({ path: currentPath, fullPage: true });

      if (updateBaseline) {
        fs.copyFileSync(currentPath, baselinePath);
        console.log(`[visual] 已更新基线: ${scenario.name}`);
        continue;
      }
      if (!fs.existsSync(baselinePath)) {
        failed = true;
        console.error(`[visual] 缺少基线: ${scenario.name}`);
        continue;
      }
      const { diffPixels, totalPixels } = compareImages(baselinePath, currentPath, diffPath);
      const diffRatio = totalPixels === 0 ? 0 : diffPixels / totalPixels;
      const pass = diffPixels <= maxDiffPixels && diffRatio <= maxDiffRatio;
      console.log(`[visual] ${scenario.name}: diffPixels=${diffPixels}, diffRatio=${diffRatio.toFixed(6)}, pass=${pass}`);
      if (!pass) failed = true;
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (failed) process.exit(1);
};

run().catch((error) => {
  server.close();
  console.error(error);
  process.exit(1);
});
