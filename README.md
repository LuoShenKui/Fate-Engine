# Fate-Engine

最小可运行原型（第一步）：
- 定义积木契约（`docs/brick_contract.md`）
- 定义 Door 积木包（`bricks/door/manifest.json`）
- 提供 Door 交互逻辑与最小校验器
- 提供可运行 C++ demo
- 新增 Rust 核心库（`crates/door_core`）与 TS 最小 UI（`ui/`）并行验证链路

## C++ Demo 构建与运行
```bash
cmake -S . -B build
cmake --build build
./build/fate_demo
```

## Rust 核心库编译与测试
```bash
cargo test --manifest-path crates/door_core/Cargo.toml
```

## TS 最小 UI 类型检查
```bash
cd ui
npm install
npm run typecheck
npm run build
```
