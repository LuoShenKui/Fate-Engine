# Render 占位模块（最小骨架）

本目录用于定义渲染能力层的最小契约，不代表画质功能已实现。

## 配置字段
- `backend`: `none | dx12 | vulkan`
- `feature_tier`: `tier0 | tier1`
- `fallback_chain`: 例如 `["vulkan", "none"]`

约束（由 `make check-render-matrix` 校验）：
1. 字段值必须命中枚举。
2. `fallback_chain` 至少包含一个元素。
3. `fallback_chain` 必须以 `none` 收敛，避免无限回退。
4. `fallback_chain` 中不得出现重复项，避免回退环路。

## 编译开关
- CMake 选项：`FATE_ENABLE_RENDER`（默认 `OFF`）
- 开启后仅编译占位模块，不引入复杂渲染实现。
