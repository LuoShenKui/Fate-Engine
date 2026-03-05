# 视觉回归基线目录

该目录用于保存以下场景的金标截图：

- `default.png`
- `door-lock-unlock.png`
- `validation-levels.png`

更新命令：

```bash
npx -y -p playwright@1.52.0 -p pixelmatch@5.3.0 -p pngjs@7.0.0 node editor/app/tools/visual_regression.mjs --update-baseline
```
