# Fate-Engine

最小可运行原型（第一步）：
- 定义积木契约（`docs/BrickContract.md`）
- 定义 Door 积木包（`packages/door/manifest.json`）
- 提供 Door 交互逻辑与最小校验器
- 提供可运行 C++ demo
- 新增 Rust 核心库（`runtime/door_core`）与 TS 最小 UI（`editor/app/`）并行验证链路

## 新目录职责说明
- `runtime/`：运行时相关核心模块（当前包含 `door_core` Rust crate）。
- `editor/`：编辑器相关应用与前端工程（当前 `editor/app`）。
- `protocol/`：协议层定义与契约文件预留目录。
- `packages/`：可分发积木包（当前包含 `door`，保留 `manifest/demo/tests` 结构）。
- `tools/`：工程工具脚本与辅助程序预留目录。
- `render/`：渲染模块预留目录（可选启用）。


## 协议开发流程（重要）
1. **先修改 `protocol/schemas/*.json`**，明确协议契约。
2. 运行 `python3 tools/validate_schemas.py`，确保 schema 基础校验通过。
3. 再修改 Runtime 与 Editor 的编解码适配层实现。
4. 提交前检查新增错误文案是否为英文。

## 语言策略（Language Policy）
- 支持中文与英文文档/讨论。
- 默认开发流程、协议字段、日志与错误信息使用英文。
- 对外接口（schema/event/error code）优先使用英文稳定标识。

具体约束：
1. 新增 error message 默认使用英文；中文说明可放在文档或注释层。
2. 新增 schema 字段名、event 名、error code 必须使用英文且保持向后兼容。
3. 新增运行时日志默认英文，面向中文读者的解释写入 README/docs，不直接替换协议或错误文本。

说明：仓库中已有 C++/TS demo 的中文错误字符串等历史示例，可逐步迁移，不要求一次性全改。

## C++ Demo 构建与运行
```bash
cmake -S . -B build
cmake --build build
./build/fate_demo
```

## 如何运行 package tests
```bash
# C++ 包装层与 manifest 基础校验
cmake -S . -B build
cmake --build build
./build/fate_demo packages/door/manifest.json

# Rust package 自动化测试（OnUsed/OnDenied + 校验器分级）
cargo test --manifest-path runtime/door_core/Cargo.toml
```

## Rust 核心库编译与测试
```bash
cargo test --manifest-path runtime/door_core/Cargo.toml
```

## TS 最小 UI 类型检查
```bash
cd editor/app
pnpm install
pnpm run typecheck
pnpm run build
```

## 当前是否可以开始做编辑器测试？
可以开始做第一轮编辑器联调测试，当前仓库已具备：
- Door 积木最小契约 + Manifest + Demo + 测试样例。
- Runtime（Rust）与 Editor（TS）的最小链路。
- schema-first 协议流程与基础校验脚本。

建议按以下顺序执行冒烟测试：
1. `python3 tools/validate_schemas.py`
2. `cargo test --manifest-path runtime/door_core/Cargo.toml`
3. `cmake -S . -B build && cmake --build build && ./build/fate_demo`
4. `cd editor/app && pnpm install && pnpm run typecheck && pnpm run build`

## 如何开始做“门积木”契约（最简）
1. 在 `protocol/schemas` 先定义 request/response schema。
2. 在 `packages/door/manifest.json` 定义 `id/version/deps/params/defaults/license/compat`。
3. 在 Runtime 实现最小状态机（enabled/locked/open）和事件（`OnUsed/OnDenied/OnStateChanged`）。
4. 在 tests 中覆盖交互、校验分级、协议适配（Envelope）场景。

## 引擎默认全局配置（新增约定）
- 默认重力方向：`[0, 0, -1]`，并支持全局禁用。
- 默认三种摄像头：第一人称、第二人称、第三人称。
- 默认激活第一人称。
- 第二人称位于用户正前方 1 米（`offset_cm = [100, 0, 0]`）。
- 第三人称位于角色后上方（`offset_cm = [-200, 0, 120]`）。
- 三种摄像头均启用碰撞约束，防止穿模卡视野，并可在测试期间随时切换。
