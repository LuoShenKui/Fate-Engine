# 视觉回归基线目录

该目录用于保存以下场景的金标截图：

- `default.png`
- `door-lock-unlock.png`
- `ladder-door-link.png`
- `switch-door-link.png`
- `trigger-zone-door-link.png`
- `trigger-zone-door-2-link.png`
- `validation-levels.png`

更新命令：

```bash
npx -y -p playwright@1.52.0 -p pixelmatch@5.3.0 -p pngjs@7.0.0 node editor/app/tools/visual_regression.mjs --update-baseline
```
