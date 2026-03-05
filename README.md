# Fate-Engine

最小可运行原型（第一步）：
- 定义积木契约（`docs/brick_contract.md`）
- 定义 Door 积木包（`bricks/door/manifest.json`）
- 提供 Door 交互逻辑与最小校验器
- 提供可运行 C++ demo

## 构建与运行
```bash
cmake -S . -B build
cmake --build build
./build/fate_demo
```

## 编译与基础语法检查
```bash
cmake -S . -B build
cmake --build build
```
