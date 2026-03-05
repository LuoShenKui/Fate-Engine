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

## 空白截图排查顺序
1. 服务未启动
2. 路径错误
3. 构建产物缺失
4. 页面报错
