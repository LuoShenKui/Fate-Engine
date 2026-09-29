# Fate Engine Architecture

> 状态：Canonical Architecture
>
> 总愿景见 `Vision.md`。本文定义的是 **Fate Engine 作为完整游戏开发引擎** 的目标架构。
> Fate Game、Anime Rendering、World Asset Assembly 都是引擎上的一等能力或官方子系统，但任何一个都不等于 Fate Engine 本身。

## 1. 根定位：首先是一套完整游戏开发引擎

Fate Engine 的第一层身份必须与 Unity / Unreal / Godot 属于同一问题域：

> **开发者应该能够只使用 Fate Engine 完成一个游戏从创建、编辑、运行、调试、打包到发布的完整开发流程。**

因此总架构不能从 Fate、Narrative 或 World Kernel 开始，而必须先具备完整 Game Engine Foundation。

Fate Engine 在完整引擎之上，再提供三个核心差异化能力：

1. 标准化 World Asset Library + Game Assembly，显著降低开发成本；
2. Anime-first 视觉与动画表现体系；
3. 原生 AI Agent，以及建立在通用引擎之上的独有 Fate Game Type。

长期再向可互联虚拟世界 / Metaverse Runtime 演进。

## 2. 总体架构

```text
                         Fate Engine
                              │
┌──────────────────────────────────────────────────────────────┐
│  1. Game Engine Foundation                                  │
│                                                              │
│  Project / Scene / Entity / Component / Resource / Runtime   │
│  Rendering / Animation / Physics / Audio / Input / UI        │
│  Gameplay / Scripting / Networking / Save / Build / Debug    │
└──────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────┐
│  2. Engine Tooling & Extensibility                          │
│                                                              │
│  Editor / Inspector / Profiler / Debugger / Package          │
│  Plugin / Importer / Exporter / Validator / Build Pipeline   │
└──────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────┐
│  3. World Asset & Game Assembly                             │
│                                                              │
│  Standard Assets / Brick / Templates / Game Types / Recipe   │
│  One-click Demo / Composition / Validation / Marketplace     │
└──────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────┐
│  4. Native AI Agent Layer                                   │
│                                                              │
│  Understand → Search → Select → Assemble → Configure          │
│  → Validate → Iterate                                        │
└──────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────┐
│  5. First-party Game Types & Advanced Systems               │
│                                                              │
│  Generic RPG / ARPG / Survival / Simulation / ...            │
│  Fate Game Type                                              │
│  Anime-first Presentation                                    │
└──────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────┐
│  6. Future World Platform                                   │
│                                                              │
│  Persistent Worlds / Shared Protocols / Interoperability      │
│  Metaverse Foundation                                        │
└──────────────────────────────────────────────────────────────┘
```

## 3. Game Engine Foundation

这一层是 Fate Engine 成为“游戏引擎”而不是某种上层框架的基础。

### 3.1 Project / Scene / World

负责：

- Project 生命周期；
- Scene / Level；
- World；
- Entity / Component 或等价对象模型；
- Prefab / Template；
- Transform；
- 生命周期与序列化。

### 3.2 Resource / Asset Runtime

负责：

- Mesh；
- Texture；
- Material；
- Shader；
- Animation；
- Audio；
- Font；
- VFX；
- Streaming；
- Resource dependency；
- Import / cache / hot reload。

`asset/` 的标准世界资产语义建立在这一基础之上，但不能代替底层资源系统。

### 3.3 Rendering

完整引擎必须有明确的 Rendering Abstraction / Host Boundary。

Fate Engine 的特色是 Style-Aware Rendering，其中 Anime 是第一视觉公民，但底层仍需要处理：

- camera；
- visibility / culling；
- render graph / pass；
- geometry；
- lighting data；
- shadow；
- post process；
- GPU resource；
- VR / multi-view。

第一阶段可以由 Unity 承担大量底层实现，但架构不能把“Unity 永久存在”作为 Fate Engine 的定义。

### 3.4 Animation

Animation 是 Fate Engine 的核心基础能力，而不是 Anime Renderer 的附件。

需要逐步覆盖：

- Skeleton / Rig；
- Animation Clip；
- State / Blend；
- Retarget；
- IK；
- Root Motion；
- Procedural Animation；
- Facial Animation；
- Animation Event；
- Motion / Pose Profile。

Anime-first 的夸张动作、Held Frame、Smear、Impact Frame 等建立在通用 Animation System 之上。

### 3.5 Physics

包括：

- Collision；
- Rigid Body；
- Character Controller；
- Trigger；
- Query；
- Constraint；
- Physics Material。

### 3.6 Audio

包括 Audio Source、Mixer、Spatial Audio、Environment、Music、Voice 与运行时音频事件。

### 3.7 Input

统一 Keyboard / Mouse / Gamepad / Touch / VR / future device 输入映射。

### 3.8 UI

游戏 UI、HUD、Menu、Layout、Text、Input Navigation、World-space UI。

### 3.9 Gameplay / Scripting Framework

提供普通游戏都需要的：

- gameplay component；
- event / message；
- state machine；
- ability；
- interaction；
- quest / objective 可选框架；
- data-driven configuration；
- scripting / extension API。

Fate 系统不能占据 Gameplay Framework 的根位置；它只是一个高级 Game Type 使用的专用系统。

### 3.10 Networking

未来完整引擎需要明确 Multiplayer / Replication / Session / Authority 边界。

第一阶段允许不实现，但架构必须保留位置。

### 3.11 Persistence

Save / Load、Snapshot、Replay、Migration、Versioning。

### 3.12 Build & Platform

负责 Build、Packaging、Platform Profile、Runtime Distribution 和未来多平台适配。

## 4. Engine Tooling & Extensibility

### 4.1 Editor

Editor 是完整游戏开发环境，而不是 Brick 专用 UI。

长期至少包括：

- Project Browser；
- Scene / World Editor；
- Hierarchy；
- Inspector；
- Asset Browser；
- Animation Tool；
- Material / Style Tool；
- Gameplay Graph / Data Editor；
- Build Settings；
- Debug / Profiler；
- Agent Workspace。

### 4.2 Package / Plugin System

插件必须能够扩展：

- Game Type；
- Gameplay Component；
- Editor Tool；
- Importer / Exporter；
- Render Style；
- AI Tool；
- Asset Type；
- Platform Integration。

### 4.3 Validator / Debug / Profiler

Validator 不只是 Brick 校验器，而是引擎级质量基础设施。

## 5. World Asset System

这是 Fate Engine 降低游戏开发成本的第一核心差异化能力。

World Asset 不等于普通资源文件。它是在底层 Asset Runtime 之上的标准化游戏语义对象，可以描述：

- 这个东西是什么；
- 它占多大空间；
- 能如何交互；
- 有什么状态；
- 需要哪些资源；
- 可以连接哪些组件；
- 使用什么 Style；
- 有什么版本与依赖；
- 有什么许可证与来源。

`systems/brick/` 是当前这一方向的早期实现之一，但长期 World Asset System 的范围大于 Brick。

## 6. Game Assembly System

Game Assembly 位于完整 Engine Foundation 之上。

```text
New Project
    ↓
Select Game Type
    ↓
Select World / Style / Components / Plugins
    ↓
Resolve Standard Assets
    ↓
Assembly Plan / Recipe
    ↓
Validate
    ↓
Playable Demo
    ↓
Human + Agent continue development
```

它的目标不是替代引擎，而是让开发者不必每次从空工程开始。

Game Type 应成为正式扩展点，例如：

- ARPG；
- RPG；
- Adventure；
- Survival；
- Simulation；
- Visual Novel Hybrid；
- Fate Game；
- Community Game Types。

## 7. Native AI Agent

AI 是引擎原生开发接口之一。

Builder Agent 默认：

1. 理解需求；
2. 查询 Project / Game Type / World Context；
3. 搜索 Asset Library；
4. 选择组件与插件；
5. 生成 Assembly Plan；
6. 配置参数；
7. 调用 Editor / Engine Tool；
8. 执行 Validator / Test；
9. 根据结果迭代。

默认原则仍然是：**组合现有标准资产优先于凭空创造新资产。**

AI 不拥有最终真理，Engine Contract、Validator、Asset License、Platform Rule 决定硬约束。

## 8. Anime-first Visual & Animation System

Anime-first 是 Fate Engine 的官方第一视觉路线，但建立在完整 Rendering + Animation Foundation 之上。

它负责：

- Anime Lighting；
- Anime Projection；
- Camera-aware Geometry；
- Face / Hair / Eye 专用规则；
- Anime Shadow / Outline；
- Color / Skin / Material identity；
- Pose / Motion Exaggeration；
- Animation Timing；
- Camera Language；
- Anime VFX。

详细规范见 `AnimeRenderStylePRD.md`。

Realistic / Comic / Lego / Painting 等未来可以作为其他 Render Style。

## 9. Fate Game Type

Fate Game 是 Fate Engine 的 **官方特殊 Game Type**，而不是 Fate Engine 的根架构。

只有进入 Fate Game Type 时，才需要下面这些专用系统：

```text
Source Material
   ↓
Lore / Character / Timeline Analysis
   ↓
Fate World Model
   ↓
Causality
   ↓
Fate Graph
   ↓
World Will
   ↓
Dynamic Timeline
```

因此现有这些能力：

- `core/causality`；
- `core/fate`；
- `core/world_will`；
- `narrative/`；
- 长期 Character / Social Simulation；

更准确地说，是 **Fate Game / advanced world simulation 的第一方高级系统**，而不是所有普通游戏都必须承担的引擎根依赖。

未来目录可以逐步向 `game_types/fate/` 或等价模块边界收敛；当前代码无需立刻搬迁，先把架构语义纠正。

## 10. Generic Game Runtime

普通游戏必须能够：

> **完全不启用 Fate / World Will / 原作 Timeline，也正常使用 Fate Engine。**

例如一个简单动作游戏可以只使用：

```text
Engine Foundation
+ Asset
+ Animation
+ Physics
+ Gameplay
+ Anime Style
+ Game Assembly
```

而完全不知道 Fate Graph 的存在。

这是判断总架构是否正确的一条硬标准。

## 11. Metaverse Foundation

Metaverse 是终极平台方向，不是当前 Runtime 根依赖。

只有当以下通用基础经过多个游戏验证后，才逐步抽象跨世界协议：

- Asset；
- Character / Avatar；
- Identity；
- Permissions；
- World State；
- Interaction；
- Package / Plugin；
- Networking；
- Persistence。

## 12. 当前仓库与目标架构的关系

当前仓库经历过 Brick-first 和 Fate/World-Kernel-first 两个阶段，所以物理目录还没有完全反映新架构。

当前目录应按以下方式理解：

| 当前目录 | 新架构中的角色 |
| --- | --- |
| `editor/` | Engine Editor 原型 |
| `protocol/` | Engine Contract / Schema |
| `packages/`, `systems/brick/` | World Asset / Package / Assembly 原型 |
| `asset/` | Standard Asset Model |
| `style/`, `render/` | Visual Style / Rendering abstraction |
| `adapters/`, `unity/` | 当前 Host / Platform Adapter |
| `runtime/` | Runtime / Persistence / bridge 的现有原型 |
| `core/fate`, `core/causality`, `core/world_will` | Fate Game 高级系统 |
| `narrative/` | Fate / Narrative Game Type 高级系统 |
| `simulation/`, `systems/character`, `systems/japan` | 高级 World Simulation，可被 Fate Game 或其他 Simulation Game Type 复用 |
| `ai/`, `pipeline/` | Engine Agent + World / Game Build Pipeline |

不要为了文档整洁立即大规模移动代码。先稳定 Contract，再按真实实现需要迁移。

## 13. 目标依赖关系

```text
Platform / Core Utilities
        ↓
Engine Foundation
(scene/resource/render/animation/physics/audio/input/ui)
        ↓
Gameplay + Runtime + Editor + Package/Plugin
        ↓
World Asset + Game Assembly + AI Agent
        ↓
Game Types / Advanced Systems
        ├─ Generic RPG / ARPG / ...
        └─ Fate Game
              ├─ Causality
              ├─ Fate
              ├─ World Will
              ├─ Narrative
              └─ Advanced Simulation
        ↓
Game Project
```

Anime Style 横向接入 Rendering / Animation / Asset / Camera，不应该被放到 Fate Game Type 内部。

## 14. 架构硬规则

1. Fate Engine 必须能开发普通游戏，不启用 Fate 系统也能完整运行。
2. Fate Game 是 Game Type，不是 Engine Core。
3. Anime-first 是视觉优先级，不是整个引擎唯一功能。
4. World Asset / Assembly 是生产力层，建立在完整 Engine Foundation 上。
5. AI Agent 是原生开发接口，但不能成为运行引擎的强制依赖。
6. Unity 当前可以承担底层能力，但目标架构不得把 Unity 永久写成不可替换的核心。
7. 任何高级世界模拟都不得反向污染最小 Game Runtime。
8. Marketplace Asset License 与 Engine Code License 分离。

## 15. 当前实现策略

目标架构是完整引擎，但不意味着现在立刻重写 Unity 已经做好的 Rendering、Physics、Animation。

当前更现实的顺序是：

1. 先把 Engine Contract / Project / Asset / Package / Assembly / Editor 边界建立正确；
2. 继续利用 Unity 作为可替换 Host 验证游戏开发闭环；
3. 建立 Anime-first Presentation；
4. 建立一键 Game Type Demo；
5. 把 Fate Game 作为第一方高级 Game Type 接入；
6. 只有当某个 Host 能力真正限制 Fate Engine 时，再决定是否逐步自研或替换。

> **先拥有完整的“游戏引擎架构”，再按价值逐步拥有底层实现；不能因为当前借用 Unity，就把 Fate Engine 永久定义成 Unity 上层插件。**