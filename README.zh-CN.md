# Fate Engine

[English](./README.md) | [简体中文](./README.zh-CN.md)

Fate Engine 是一个仍处于原型阶段的下一代游戏引擎项目。

它的长期目标不是单点解决渲染、剧情或 AI，而是把 **标准化世界资产、自动游戏装配、动态命运世界、Anime-first 视觉系统和原生 AI Agent** 组合成一套完整游戏生产体系，并最终演进为可互联虚拟世界的基础 Runtime。

## 六大长期支柱

1. **World Asset System**：统一规则下的世界资产模型积木库。
2. **Game Assembly System**：选择游戏类型、组件、插件和世界模板，快速得到可玩的 Demo，再继续完善。
3. **Fate Game System**：把动画、小说、漫画等原作转成默认命运世界，玩家可以通过真实因果改变甚至摧毁原剧情。
4. **Anime-first Visual System**：二次元角色是一等公民，3D 游戏尽量保持 2D 动画的角色、色彩、动作、表情和镜头观感。
5. **Native AI Agent**：Agent 原生负责理解、检索、组合、配置和验证标准资产，而不是把“现场生成一切”当作唯一方案。
6. **Metaverse Foundation**：长期让不同游戏世界在统一资产、角色、状态和协议基础上逐步互联。

完整愿景见 [docs/Vision.md](docs/Vision.md)。

## 当前架构

- `core/`：World Kernel；因果、命运、世界意志、时间、身份、关系、记忆、权限和状态。
- `systems/`：Character、Brick 以及国家/地区社会制度。
- `asset/`：引擎无关的标准世界资产描述。
- `simulation/`：NPC、日程、需求、行为、人口和 Simulation LOD。
- `narrative/`：事件、默认时间线、条件与后果。
- `world/`：具体世界模板、地点、人物、势力和规则。
- `pipeline/`：原作 / 资料 / 资产到可运行世界的生产流水线。
- `ai/`：Builder Agent、Character Agent 及相关 AI 能力。
- `style/` / `render/`：Anime-first 与其他 Style 的视觉规则。
- `runtime/`：事件总线、调度、存档、快照和回放。
- `adapters/` / `unity/`：宿主适配；Unity 是第一阶段宿主。
- `editor/`：开发者与 Agent 的主要操作界面。
- `protocol/`：跨模块 Schema、Contract 和版本边界。

完整技术边界见 [docs/Architecture.md](docs/Architecture.md)。

## 文档入口

- [docs/README.md](docs/README.md)：文档导航与职责。
- [docs/Vision.md](docs/Vision.md)：项目总愿景（SSOT）。
- [docs/Architecture.md](docs/Architecture.md)：当前技术总架构（SSOT）。
- [docs/AnimeRenderStylePRD.md](docs/AnimeRenderStylePRD.md)：Anime-first 渲染与表现体系。
- [systems/brick/docs/BrickContract.md](systems/brick/docs/BrickContract.md)：Brick / 资产装配契约。
- [docs/TODO.md](docs/TODO.md)：当前未完成事项。

## 当前原则

- Unity 是宿主，不是 Fate Engine 的定义。
- Brick 很重要，但 Brick 不等于 Fate Engine。
- World Kernel 很重要，但 World Kernel 也不等于 Fate Engine。
- Anime 是第一视觉公民，但 Fate Engine 不只是渲染器。
- AI 优先组合标准资产，并受 Validator、世界规则、许可和版本约束。
- 原作剧情是默认命运线，不是不可改变的脚本铁轨。

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