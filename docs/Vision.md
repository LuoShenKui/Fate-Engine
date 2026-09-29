# Fate Engine Vision

> 状态：Canonical / Long-term Vision
> 本文只定义 Fate Engine 最终想成为什么。具体技术实现以 Architecture.md 为准，当前开发顺序以 TODO.md 为准。

## 1. 一句话定义

**Fate Engine 是一个以标准化世界资产、自动游戏装配、动态命运世界、Anime-first 视觉体系和原生 AI Agent 为核心的下一代游戏引擎；长期目标是成为可互联虚拟世界 / 元宇宙平台的基础 Runtime。**

它不是单独的积木编辑器、World Simulator、剧情生成器、二次元 Renderer、AI 游戏生成器或 Unity 插件；这些只是 Fate Engine 的组成部分。

## 2. 六大长期支柱

### 2.1 World Asset System — 世界资产模型积木库

Fate Engine 的第一块地基是统一规则下的可复用世界资产。资产不仅是 Mesh / Texture，而是可被游戏、AI 和运行时理解的标准对象，可以逐步包含几何与外观、动画、碰撞、交互、状态、能力、语义标签、Style Profile、许可来源、版本依赖与兼容信息。

对象可以从门、窗、梯子、武器、家具，扩展到 Character、建筑、街区、学校、医院乃至完整世界模板。

> **世界逐渐成为一个巨大、标准化、可组合、可验证、可版本化的资产模型库。**

### 2.2 Game Assembly System — 长期生产力能力

长期目标是：在 Fate Engine 已经能够手工完成完整游戏开发之后，把真实项目中反复出现的模式逐步抽象成可复用 Template / Component / Assembly 能力。

Game Assembly 不是当前阶段的前置条件，也不能替代一个完整、成熟的游戏开发流程。只有真实 Demo 已经被完整做出来，才从这些 Demo 中提炼可复用组合规则。

> **先证明 Fate Engine 能完整做出游戏，再自动化其中已经被真实项目证明为重复的部分。**

### 2.3 Fate Game System — Fate Engine 独有游戏类型

Fate Game 可以从动画、小说、漫画、剧本、设定集和其他合法授权或用户自有 IP 资料中建立世界、人物、地点、势力、关系、时间线、关键事件、Fate Link 与默认命运路径。

原作剧情不是强制脚本，而是 Default Fate Timeline。玩家行为改变 World State，经由 Causality 与 Fate 重新求值后，可以产生全新的时间线。

玩家可以救下原本会死亡的人、杀死原作主角、破坏关键事件成立条件、改变阵营关系，甚至让整个原作时间线失效。

World Will 可以维护剧情吸引子，但不能无视已经成立的充分因果。

> **Fate Game 的本质不是 AI 重讲一遍原作，而是把原作变成一个可以真正进入、干预并改变命运的动态世界。**

动画是 Fate Game 最重要的参考源之一，因为它同时提供人物外观、动作、表情、镜头、空间和剧情表现。

### 2.4 Anime-first Visual System — 二次元角色是一等公民

> **Anime Character is a first-class citizen of Fate Engine.**

视觉系统首先服务二次元 3D 游戏。目标不是把二次元角色真人化，而是让角色进入可自由运动的 3D 世界后，仍尽可能保持动画中的视觉身份。

优先还原角色比例、面部、肤色、发色、眼睛、阴影、高光、轮廓、表情、动作夸张度、Animation Timing、Pose Language 与 Camera Language。

Anime Style 不必服从真实 PBR、真实透视或固定三维几何，可以拥有 Anime Lighting、Anime Projection、Camera-aware Geometry、非真实阴影和视角相关面部修正。

长期采用 Style-Aware Rendering，支持 Anime、Realistic、Comic、Lego、Painting 等平级视觉规则，但 Anime 是首要实现和首要验收对象。

详细规范见 AnimeRenderStylePRD.md。

### 2.5 Native AI Agent — AI 原生存在，但不替代资产体系

Fate Engine 天生拥有 AI Agent，但核心原则是：

> **Agent 的首要职责不是现场凭空创造资产，而是理解需求、检索标准资产、选择组件、组合世界、配置规则并完成验证。**

长期链路可以发展为：User Intent → Fate Agent → Tool / Asset Search → Plan → Validation → Implementation；但当前阶段 Agent 不作为完成第一个游戏 Demo 的必要依赖。

AI 可以理解自然语言需求、解析世界资料、查找资产、组合已有资产、生成 Recipe / Assembly Plan、配置参数、分析冲突、调用 Validator 并根据验证结果修正装配。

AI 不应绕开资产许可、版本约束、世界规则、角色身份、物理约束、Fate / Causality 与 Validator。资产生成可以作为独立扩展存在，但不能成为整个引擎成立的前提。

### 2.6 Metaverse Foundation — 从游戏引擎走向世界平台

终极方向不是单个游戏项目，而是让不同世界逐渐共享 World Asset、Character、Identity、Interaction、Ability、World Rules、AI Agent、Style、Fate / Causality、Save / State、Permissions 与 Package / Plugin 等基础协议。

长期演进关系：

Reusable Assets → Fast Game Assembly → Fate Worlds → Persistent Worlds → Interoperable Worlds → Metaverse Runtime / Platform

> **元宇宙不是一个巨型聊天大厅，而是大量可以独立开发、独立运行、拥有不同规则和画风，但能够在统一基础协议上逐步互联的游戏世界。**

## 3. 六大支柱之间的关系

World Asset System 与 Game Assembly System 提供生产基础；Native AI Agent 负责理解与组合；World Kernel 和 Fate System 让世界持续运行并允许命运变化；Anime-first Visual System 负责以动画优先的方式呈现世界；这些能力成熟后共同汇合到 Metaverse Foundation。

- Asset / Brick：世界拿什么搭。
- Assembly：游戏怎么快速做出来。
- World Kernel：世界如何持续运行。
- Fate：原作命运如何被玩家真正改变。
- Anime Style：世界如何尽量保持动画视觉身份。
- AI Agent：谁来理解需求并自动组织这些能力。
- Metaverse：这些基础成熟之后的长期汇合点。

## 4. 核心产品原则

1. **先做出完整游戏**：当前首先证明 Fate Engine 能手工完成一个完整可玩的 Demo，再讨论 Template / Assembly 自动化。
2. **标准资产优先于一次性生成**：能复用、能版本化、能验证的资产优先于不可重复的即时生成结果。
3. **AI 组合优先于 AI 凭空创造**：Agent 优先成为世界工程师。
4. **世界状态必须真实存在**：重要人物、关系、资源、机构、事件和命运必须进入结构化 World State，而不是只存在于 Prompt。
5. **Fate 是默认路径，不是剧情铁轨**：足够强的因果必须能够改变原有命运。
6. **Anime-first，但不是 Anime-only**：二次元是一等视觉公民，其他风格可以平级扩展。
7. **宿主可替换**：Unity 是第一阶段宿主，不是 Fate Engine 的定义。
8. **可审计、可验证、可复现**：Recipe、版本、依赖、资产来源、AI 决策、装配结果和世界变化都应尽量可追踪。

## 5. Fate Engine 不是什么

Fate Engine 不以任何单点能力作为最终产品定义：不是一句话生成完整 AAA 游戏、不是 Toon Shader、不是剧情 Agent、不是 Unity 插件、不是一套门梯子积木、不是单独的社会模拟器，也不是虚拟聊天空间。

## 6. 当前现实

这个愿景跨度很大，不应一次实现。每个阶段都只选择最小闭环，用真实可运行 Demo 验证，把成功模式沉淀成协议、资产和工具，再扩大范围。

> **长期愿景用于防止局部实现把架构带偏，而不是要求第一个版本同时完成六大支柱。**