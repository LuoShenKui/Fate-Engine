# Fate Engine

[English](./README.md) | [简体中文](./README.zh-CN.md)

Fate Engine 当前仍处于原型阶段，但项目定位已经从“积木装配引擎”调整为 **可长期运行的世界模拟与命运系统内核**。

当前根架构是 World Kernel：

- 因果系统：行为改变世界状态，并继续影响未来。
- 命运系统：人物、事件和关键节点之间存在可读取、改写、斩断的命运关系。
- 世界意志：对关键剧情节点进行有限修正，但不能推翻已经成立的充分因果。
- 人物系统：统一 Character 模型，通过 Main / Supporting / Background 三档 Simulation Level 控制模拟深度，并允许角色随事件动态升级、降级和成长。
- 社会制度系统：校园、警察、司法、医院、公司、家庭、经济等作为可复用世界模板。
- 长期模拟：NPC 日程、需求、行为、关系、记忆、身份和人口级 Simulation LOD。
- 叙事系统：原作剧情只是默认命运线，不是强制任务树。
- 风格系统：二次元、半写实、写实等表现与 World Kernel 解耦。
- 引擎适配层：Unity 是第一阶段宿主，未来可以接 Unreal 或自研 Renderer。

## Brick：3D 场景快速装配子系统

原有积木系统仍然保留，但它不再代表 Fate Engine 本身。

Brick 的核心用途是：**把可复用的交互组件、3D 资产、能力包和组合模板快速装配成可玩的 3D 场景，尽量把重复搭建工作变成“一键构建 / 参数化构建”。**

例如门、梯子、开关、拾取物、建筑部件、教室、街区、小屋等，都可以通过 Brick/Template 组合快速形成场景。它解决的是“怎么更快把世界做出来”，而不是“这个世界为什么这样运行”。

因此：

- `core/` 与社会系统负责世界规则、因果和命运。
- `systems/brick/` 负责 3D 场景与交互内容的快速装配。
- Unity 当前负责最终渲染、物理、动画和 VR 表现。

新的规范位置：

- `systems/brick/packages/`：积木包、发布元数据和 lockfile。
- `systems/brick/docs/BrickContract.md`：积木契约。
- `packages`：暂时保留为兼容入口，避免旧工具、脚本和文档立即失效。

编辑器中的 Brick UI、共享协议 schema、参考运行时和 Unity 导入代码暂时保留原位置；它们现在被视为 Brick 子系统的调用方/适配层，而不是总架构。

## 仓库结构

- `core/`：World Kernel；因果、命运、世界意志、时间、身份、关系、记忆、权限、状态。
- `systems/`：可复用人物、社会与玩法系统；现已开始建立 Japan World Rules Library，包括学校、家庭、警察、便利店、医院、公司、电车、租房、银行、法院、餐厅和社团等日本现代社会模板；`brick/` 负责 3D 场景快速装配。
- `simulation/`：NPC、日程、需求、行为、人口和模拟 LOD。
- `narrative/`：事件、默认时间线、条件、后果和动态生成。
- `world/`：世界模板、地点、人物、势力、规则和初始化。
- `style/`：角色形体、渲染、动画、镜头和 Style Profile。
- `ai/`：角色 Agent、对话、规划、世界构建、资产生成接口和原作资料解析。
- `asset/`：引擎无关资产描述。
- `pipeline/`：世界生产流水线；负责 ingest → analysis → generation → validation → assembly → export。
- `runtime/`：世界运行时、事件总线、调度、存档和快照；现有参考运行时继续保留。
- `adapters/`：Unity / Unreal / 自研 Renderer 的适配边界。
- `editor/`：当前桌面编辑器原型。
- `protocol/`：跨系统共享 schema、契约和协议。
- `unity/`：第一阶段 Unity 宿主。
- `tools/`：校验、发布、导入、调试和世界制作工具。
- `tests/`：核心、系统、模拟和完整场景测试。

完整说明见 [docs/Architecture.md](docs/Architecture.md)。

## 当前工程原则

1. **World Kernel 优先于自研 Renderer。**
2. **核心逻辑不得依赖 Unity API。**
3. **系统通过明确接口组合，不构建巨型 World 类。**
4. **重要行为必须形成“输入 → 状态变化 → 因果 → 后续影响”的闭环。**
5. **世界意志可以对抗偶然，但不能对抗充分因果。**
6. **Brick 专门负责快速/一键构建 3D 场景与交互内容，不负责世界因果、命运和社会制度。**

## 当前已有原型

- 桌面编辑器：`editor/app`，React + Vite + Tauri。
- 共享协议：`protocol/`。
- Unity 宿主：`unity/`。
- Rust/C++ 参考实现和 smoke checks：继续用于已有原型校验。

## 快速开始

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

编辑器：

```bash
cd editor/app
pnpm install
pnpm run typecheck
pnpm run build
pnpm run tauri:dev
```

## 关键文档

- [docs/Architecture.md](docs/Architecture.md)：当前总架构。
- [docs/Target.md](docs/Target.md)：早期原型目标，保留作历史参考。
- [docs/FrameWork.md](docs/FrameWork.md)：早期框架设计，保留作迁移参考。
- [systems/brick/docs/BrickContract.md](systems/brick/docs/BrickContract.md)：Brick 子系统契约。
- [docs/UnityWhiteBoxPivot.md](docs/UnityWhiteBoxPivot.md)：Unity 白盒宿主边界。
- [docs/TODO.md](docs/TODO.md)：现有原型未完成事项。
