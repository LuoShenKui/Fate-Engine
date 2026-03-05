# Fate-Engine

最小可运行原型（第一步）：
- 定义积木契约（`docs/brick_contract.md`）
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
