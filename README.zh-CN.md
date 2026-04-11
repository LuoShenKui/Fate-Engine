# Fate Engine

[English](./README.md) | [简体中文](./README.zh-CN.md)

Fate Engine 当前处于原型阶段。这个仓库现在的目标不是宣称“完整游戏引擎已经完成”，而是先验证一条核心闭环：

- 协议优先的交互内容契约
- 可安装、可组合的积木包
- 编辑器、运行时、包流程、回放之间的闭环
- 可通过明确命令复现的本地校验

## 愿景

Fate Engine 想验证的是：通过可复用交互积木、场景模板、校验门禁以及 AI 辅助装配，减少游戏制作中的重复劳动。长期方向可以概括为：

`demo -> 积木协议簇 -> 白盒装配层 -> AI agent -> Unity 宿主 -> 无限Fate类游戏`


这个目标还远没有完成。当前仓库重点仍然是证明这条工作流成立，而不是宣称终局已经做完。

## 当前状态

- 桌面编辑器原型位于 `editor/app`，技术栈是 `React + Vite + Tauri`
- 积木包与 lockfile 流程位于 `packages/`
- 协议契约与共享 schema 位于 `protocol/`
- Unity 现在是第一阶段唯一宿主
- 仍保留一个 Rust 参考运行时和基础 smoke checks，但它们不再是产品主线

这并不意味着：

- 生产级 3D 引擎已经完成
- 发布者工作流已经完全产品化
- 长期治理和维护问题已经解决

## 仓库结构

- `runtime/`：Rust 参考运行时与校验核心
- `editor/`：编辑器前端与桌面应用
- `protocol/`：schema、契约、共享定义
- `packages/`：积木包、发布元数据、lockfile
- `unity/`：Unity 宿主骨架、recipe 样例、生成物示例
- `tools/`：校验、发布、导入与辅助脚本

## 快速开始

### 参考校验

```bash
python3 tools/validate_schemas.py
python3 tools/check_protocol_contract.py
python3 tools/check_interaction_contract.py
python3 tools/check_publisher_p0.py
python3 tools/check_publisher_p1.py
cargo test --manifest-path runtime/door_core/Cargo.toml
cmake -S . -B build
cmake --build build
```

这些检查仍作为仓库参考校验存在，但第一阶段产品宿主已经转为 Unity。

### 编辑器

```bash
cd editor/app
pnpm install
pnpm run typecheck
pnpm run build
pnpm run tauri:dev
```

### Unity 骨架

`unity/` 目录是 Unity 宿主集成骨架，当前仓库只放文本化示例，不包含完整 Unity 工程。

### Make 入口

```bash
make tauri-dev
make check-m1
make check-m2
make check-m3
make check-visual
make check-perf-scenes
```

## 界面语言

编辑器现在默认使用英文。运行时可以在工具栏里切换英文和中文。

## 核心门禁

- `make check-m1`：功能与视口交互门禁
- `make check-m2`：稳定性与多积木交互门禁
- `make check-m3`：回放一致性门禁
- `make check-interaction-contract`：高频交互契约门禁
- `make check-publisher-p0`：发布者 P0 闭环
- `make check-publisher-p1`：发布 / 升级 / 回滚治理闭环
- `make check-visual`：视觉基线检查
- `make check-perf-scenes`：多场景性能检查

统一准入阈值见 [docs/Editor3DTestReadiness.md](docs/Editor3DTestReadiness.md)。

## 路线图

### 阶段 1：Unity 白盒验证

- 平台：Unity
- 目标：验证角色基础组 `走 / 跑 / 跳 / 梯子 / 拾取 / 投掷` 的白盒装配链路
- 验证：recipe/schema 校验、确定性导出、Unity 导入后的 ScriptableObject 和 Baker 消费

### 阶段 2：发布者工作流产品化

- 目标：打通创建、预览、校验、打包、安装、升级、回滚闭环
- 验证：清理 [docs/TODO.md](docs/TODO.md) 中的 `P0/P1` 项，并在独立 demo 项目验证安装与回滚

### 阶段 3：模板跨项目复用

- 目标：把组合积木、区域模板、能力包收敛成复用资产，而不是单 demo 特例
- 验证：至少在两类不同场景模板中复用同一套积木，并重新跑回放、校验、安装链路

### 阶段 4：引擎化与生态扩展

- 目标：从“可演示的积木工作台”演进为“可持续生产内容的装配引擎”
- 验证：形成稳定的包生态、模板生态、性能基线和可信维护策略

## 当前未完成工作

唯一未完成事项入口是 [docs/TODO.md](docs/TODO.md)。

## 关键文档

- [docs/Target.md](docs/Target.md)：目标原型定义
- [docs/FrameWork.md](docs/FrameWork.md)：架构约束
- [docs/BrickContract.md](docs/BrickContract.md)：积木契约
- [docs/UnityWhiteBoxPivot.md](docs/UnityWhiteBoxPivot.md)：Unity 主宿主与白盒流
- [docs/Editor3DTestReadiness.md](docs/Editor3DTestReadiness.md)：准入门槛
- [docs/PackageConsumeFlow.md](docs/PackageConsumeFlow.md)：包发布与消费流程
- [docs/TODO.md](docs/TODO.md)：未完成事项清单
