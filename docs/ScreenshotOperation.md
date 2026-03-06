# 编辑器截图操作说明

本说明用于产出稳定、可复现的编辑器页面截图。

## 固定流程
1. **启动命令**
   - `cd editor/app && pnpm run preview`
2. **访问地址**
   - `http://localhost:5173`
3. **等待页面就绪选择器（必须）**
   - 选择器：`#app [data-testid="editor-page-ready"]`
   - 就绪判定：该元素可见，且文本包含 `Fate`（如 `Fate Engine Editor` 或 `Fate 引擎编辑器`）
4. **截图文件名规范**
   - 统一格式：`editor-<页面名>-<场景名>-<YYYYMMDD-HHmmss>.png`
   - 示例：`editor-home-default-20260305-101530.png`

## 手工截图 vs 自动回归截图（边界）
- **手工截图**：用于需求评审、设计对齐、文档示例；允许人工调整窗口大小、语言和演示步骤，不作为 CI 门禁输入。
- **自动回归截图**：用于 CI 可重复门禁，仅使用脚本化场景（`default`、`door-lock-unlock`、`validation-levels`）与固定选择器 `data-testid="editor-page-ready"`。
- **冲突处理**：若手工截图与自动回归结果不一致，以自动回归基线为准；手工截图只更新文档，不更新 `editor/app/tests/visual-baseline/`。

## 自动回归命令
1. 更新基线（开发者本地）：
   - `npx -y -p playwright@1.52.0 -p pixelmatch@5.3.0 -p pngjs@7.0.0 node editor/app/tools/visual_regression.mjs --update-baseline`
2. 执行比对（CI/本地）：
   - `make check-visual`

## 基线更新准入规则
- **谁可更新**：仅允许该功能责任开发者发起更新，并由代码所有者（Code Owner）或指定评审者复核后合入。
- **何时允许更新**：
  - 视觉需求、交互流程或文案发生**明确变更**，且变更已在需求/任务中记录；
  - 跨平台字体或渲染差异导致的稳定偏差，经评审确认属于可接受差异；
  - 禁止为“让 CI 变绿”而无依据更新基线。
- **如何审批**：
  1. PR 必须同时包含代码变更与对应基线变更，并在描述中说明受影响场景（`default`、`door-lock-unlock`、`validation-levels`）。
  2. 至少 1 名评审者核对 `visual-diff` 结果与需求一致。
  3. 未完成核对前不得合并；存在争议时以产品/设计结论为准后再更新基线。

## 空白截图排查顺序
1. 服务未启动
2. 路径错误
3. 构建产物缺失
4. 页面报错
