# Render 最小模块（可运行骨架）

本目录提供渲染能力层的最小可运行实现：
- `fate_render_minimal`：后端可用性判断（软件模拟层）
- `fate_render_probe`：后端初始化/可用性探测程序

## 配置字段
- `backend`: `none | dx12 | vulkan`
- `feature_tier`: `tier0 | tier1`
- `fallback_chain`: 例如 `["vulkan", "none"]`

约束（由 `make check-render-matrix` 校验）：
1. 字段值必须命中枚举。
2. `fallback_chain` 至少包含一个元素。
3. `fallback_chain` 必须以 `none` 收敛，避免无限回退。
4. `fallback_chain` 中不得出现重复项，避免回退环路。
5. `backend/fallback_chain` 中出现的非 `none` 后端必须可被 `fate_render_probe` 探测通过。

## 编译开关
- CMake 选项：`FATE_ENABLE_RENDER`（默认 `OFF`）
- CMake 选项：`FATE_RENDER_ENABLE_VULKAN_SIM`（默认 `ON`）
  - 开启时，最小后端层会将 `vulkan` 视为可用（模拟后端）
  - 可通过环境变量 `FATE_RENDER_DISABLE_VULKAN_SIM=1` 临时让模拟 Vulkan 探测失败（用于故障演练）

## 常用命令
```bash
# 构建并检测最小后端探测程序
cmake -S . -B build-render -DFATE_ENABLE_RENDER=ON
cmake --build build-render --target fate_render_probe

# 校验配置合法性 + 后端可用性
make check-render-matrix
```
