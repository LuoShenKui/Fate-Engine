# Fate Engine Architecture

> 状态：Canonical Architecture
> 总愿景见 Vision.md。本文件只定义当前架构边界、模块职责与依赖方向。

## 1. 架构目标

Fate Engine 由六个长期支柱组成：World Asset System、Game Assembly System、Fate Game System、Anime-first Visual System、Native AI Agent、Metaverse Foundation。

技术架构必须保证这些能力可以逐步实现，而不是把项目锁死为某个局部原型。

当前第一原则：

> **核心世界、资产协议、Fate 和装配逻辑不得依赖某一个宿主引擎。Unity 是第一阶段宿主，不是 Fate Engine 的定义。**

## 2. 总体分层

```text
                    Fate Engine
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   World Assets      Game Assembly      AI Agent
        │                │                │
        └───────────┬────┴───────────┬────┘
                    │                │
              World Runtime      Build Pipeline
                    │
       ┌────────────┼────────────┐
       │            │            │
   Simulation     Narrative     Fate
       │            │            │
       └────────────┴─────┬──────┘
                          │
                     World State
                          │
                 Style / Presentation
                          │
                 Host Adapter Layer
                          │
             Unity / Unreal / Future Host
```

Metaverse Foundation 不单独作为当前代码模块，它是 Asset、Identity、World State、Package、Permissions、Runtime 等基础协议成熟之后的长期平台层。

## 3. 仓库模块职责

### 3.1 core/ — World Kernel

负责宿主无关的世界真相：

- causality：因果记录与后果传播；
- fate：Fate Link、Node、Rewrite、Sever；
- world_will：剧情吸引子与有限干预；
- time：世界时间；
- identity：身份；
- relationship：关系；
- memory：长期记忆事实；
- permission：权限；
- state：核心状态。

Core 不负责最终画面、不负责 Unity 对象、不负责具体国家制度，也不直接承担资产装配。

### 3.2 systems/ — 可复用世界规则

systems/character 组合完整 Character。

systems/japan 等目录负责国家 / 地区优先的社会制度实现，例如学校、家庭、警察、医院、公司、铁路、住房、银行、司法和商业。

systems/common 只放经过多个地区实现反复验证后的稳定共性，不先造一个万能现实模板。

systems/brick 是世界资产和交互快速装配子系统，负责 Package、Recipe、版本、依赖、安装、升级、回滚、组合与宿主导出。

Brick 很重要，但 Brick 不等于 Fate Engine。

### 3.3 asset/ — 标准化世界资产描述

asset/ 保存宿主无关的资产语义。长期目标是让 AI、Assembly、Style 和 Host 都能读取同一份资产身份。

资产应逐步区分：

- identity / semantic；
- geometry / animation reference；
- interaction；
- state；
- slots / resources；
- constraints；
- style metadata；
- license / provenance；
- version / compatibility。

### 3.4 simulation/ — 长期世界模拟

负责 NPC Schedule、Needs、Behavior、Population 与 Simulation LOD。

只有一种 Character 数据模型，通过 Main / Supporting / Background 等 Simulation Level 调整计算深度，角色可以动态升降级。

### 3.5 narrative/ — 叙事与默认时间线

负责事件、条件、后果、默认 Timeline 与 Narrative Generator。

Narrative 提供默认剧情结构，但不能绕过 Causality 和 Fate 强制世界回到原剧情。

### 3.6 world/ — 世界实例与模板

负责地点、人物、势力、规则、World Template 和 Bootstrap。

world/ 是“这个具体世界是什么”，core/ 是“所有世界共同遵守哪些基础真相”。

### 3.7 pipeline/ — 世界生产流水线

负责把动画、小说、设定、资产清单等输入逐步转换为可消费世界：

```text
Ingest → Analysis → Normalize → Validate → Asset Resolve → Assembly → Export
```

每一步必须有明确输入、输出和验证点，不允许把“原作 → 游戏”做成无法调试的大黑盒。

### 3.8 ai/ — Native AI Agent 能力

AI 分为至少两类：

1. Builder / Editor Agent：理解需求、解析资料、检索资产、编排组件、生成 Recipe、调用 Validator。
2. Runtime Character Agent：在 Character Knowledge、Identity、Permission、World State 和制度规则约束下进行对话与行动规划。

两者必须隔离。

Builder Agent 的默认职责是组合标准资产，而不是绕过资产体系现场制造所有内容。

### 3.9 style/ 与 render/ — 视觉规则

style/ 保存角色形体、动画、Camera、Style Profile 与 Render Style Contract。

Anime 是第一视觉公民，详细规则见 AnimeRenderStylePRD.md。

Realistic / Comic / Lego / Painting 等未来可以作为平级 Style 扩展。

Render Style 可以改变“怎么表现”，不能改变 Character Identity、Memory、Relationship、Fate 或 World State 真相。

### 3.10 runtime/ — World Runtime

负责 Event Bus、Scheduler、Save、Snapshot、Replay 与宿主桥接所需的运行时能力。

Runtime 应能够在没有最终画面的情况下执行核心世界测试。

### 3.11 adapters/ 与 unity/ — Host Adapter

第一阶段宿主是 Unity。

Unity 负责当前实际工程中的 Scene、Physics、Animation、Input、VR、GPU 与最终呈现；Fate Engine 通过 Adapter 提供资产、世界状态、装配结果和 Style 规则。

未来接 Unreal 或其他 Host 时，不应要求重写 World Kernel。

### 3.12 editor/ 与 protocol/

editor/ 是人类和 Agent 操作 Fate Engine 的主要开发界面。

protocol/ 负责跨模块稳定 Schema、Contract、错误码和版本边界。跨模块数据不得依赖未声明的魔法字段。

## 4. 六大支柱如何映射到架构

| 长期支柱 | 当前主要模块 |
| --- | --- |
| World Asset System | asset/, systems/brick/, protocol/ |
| Game Assembly System | systems/brick/, editor/, pipeline/, ai/ |
| Fate Game System | core/fate, core/causality, core/world_will, narrative/, world/, pipeline/ |
| Anime-first Visual System | style/, render/, adapters/unity/rendering/anime/ |
| Native AI Agent | ai/, pipeline/, editor/, runtime character-agent boundary |
| Metaverse Foundation | 暂无单一模块；依赖前述协议长期收敛 |

## 5. Fate Game 运行链

```text
Original Material
      ↓
Pipeline Analysis
      ↓
World / Character / Relationship / Timeline
      ↓
Default Fate Graph
      ↓
Player or NPC Action
      ↓
World State Change
      ↓
Causality
      ↓
Fate Evaluation
      ↓
World Will Evaluation
      ↓
New World State
      ↓
Narrative / Simulation continue
```

核心规则：World Will 可以对抗偶然，不能对抗已经成立的充分因果。

## 6. Character System

统一 Character 应组合：Identity、Personality、Preferences、Skills、Knowledge、Needs、Goals、Memory、Relationships、Resources、Schedule、Beliefs、Fate 与 SimulationLevel。

必须区分：

- Personality：行为风格；
- Preferences：喜好与审美；
- Skills：能做什么；
- Knowledge：知道什么。

Runtime AI 不能因为底层模型知道某件事，就让角色自动拥有该知识。

## 7. Game Assembly 数据流

```text
Game Type / User Intent
        ↓
Assembly Plan
        ↓
Asset / Brick Resolution
        ↓
Dependency + License + Compatibility Check
        ↓
Recipe + Seed + Lockfile
        ↓
Validator
        ↓
Host Export
        ↓
Playable Demo
```

生成结果必须可继续人工修改，而不是一次性不可维护产物。

## 8. Anime-first Presentation 边界

Anime Rendering 是完整 Style，不是 PBR 后面补一层 Toon Shader。

Anime Style 可拥有自己的 Lighting、Projection、Geometry Correction、Shadow、Outline、Animation Presentation 与 Post Process。

视觉系统优先保持动画中的角色身份，但它仍然只是 Presentation Layer，不拥有世界逻辑真相。

## 9. AI 边界

AI 可以提案、解析、检索、装配、配置、对话和规划，但 Validator / World Rules / Permission / Causality / Fate 决定硬约束。

AI 生成的新资产如果未来启用，必须进入标准 Asset Pipeline，经过来源、许可、格式和质量验证后才成为正式资产。

## 10. 依赖方向

推荐依赖方向：

```text
protocol / contracts
      ↑
core + asset
      ↑
systems + simulation + narrative
      ↑
world + runtime
      ↑
pipeline + ai + style
      ↑
adapters
      ↑
Unity / Unreal / Editor UI
```

不是所有模块都严格单向编译依赖，但设计上必须避免 Host API 反向污染 Core。

## 11. 文档职责

- Vision.md：项目为什么存在、长期成为什么。
- Architecture.md：系统怎么分层、边界和依赖。
- AnimeRenderStylePRD.md：Anime Visual 子系统。
- systems/*/README / Contract：具体规则系统。
- PackageConsumeFlow.md：Package 生命周期。
- TODO.md：当前未完成工作。
- Target.md / FrameWork.md / FirstStep.md / product.md：历史原型资料。

## 12. 当前阶段原则

Fate Engine 的最终愿景很大，但开发只能按可验证闭环推进。

任何新阶段都应先回答：

1. 要验证哪个长期支柱？
2. 最小可运行 Demo 是什么？
3. 输入和输出协议是什么？
4. 如何自动验证？
5. 成功后沉淀成哪个 Asset / Contract / System？

> **不为了追求宏大架构一次实现整个引擎，也不允许某个临时 Demo 重新定义整个 Fate Engine。**