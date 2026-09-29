# Fate Engine Starter Projects

> 状态：Phase 1 Product Goal
>
> 本文定义 Fate Engine 第一阶段最核心的产品体验。

## 1. 第一阶段目标

Fate Engine 第一阶段不是自动生成完整游戏，也不是先实现复杂的 Game Assembly。

> **用户打开 Fate Engine，新建项目，选择游戏类型，立刻得到一个已经可以运行和试玩的 Starter Project。开发者直接在这个基础项目上替换资产、修改规则、增加系统和内容。**

目标体验：

```text
Open Fate Engine
      ↓
New Project
      ↓
Select Game Category
      ↓
Select Official Starter Project
      ↓
Create
      ↓
Playable Base Game
      ↓
Replace / Extend / Rewrite
      ↓
Your Game
```

Starter Project 是一个真实工程，不是截图、脚手架目录或空模板。

## 2. Starter Project 必须满足什么

一个官方 Starter Project 至少必须：

- 可以直接启动并进入游戏；
- 有明确的 Gameplay Loop；
- 包含该类型最基础的角色 / 控制方式；
- 包含基础 Camera；
- 包含 Input；
- 包含 UI / HUD；
- 包含至少一个实际场景；
- 包含基础 Animation；
- 包含必要 Physics / Collision；
- 包含 Audio 基础；
- 包含该类型最小 Gameplay System；
- 包含可修改的数据和示例内容；
- 能 Build 成独立可运行产物；
- 能作为真实项目继续开发，而不是只能展示。

## 3. Starter Project 与 Game Category

`GameCategories.md` 定义分类集合。

第一阶段不是要求所有分类同时存在 Starter Project。

一个 Category 可以暂时：

```text
unsupported
experimental
starter_available
```

只有达到完整验收标准的类型才标记为 `starter_available`。

## 4. Starter Project 与 Game Assembly 的区别

Starter Project 是：

> **官方提前开发并维护好的完整基础项目。**

Game Assembly 是：

> 根据组件、资产、规则和用户意图动态组合新项目的自动化系统。

两者不是一回事。

第一阶段：

```text
Game Category
      ↓
Official Starter Project
      ↓
Clone / Instantiate
      ↓
Playable Project
```

后期才可能演进为：

```text
User Intent
   ↓
Game Type + Components + Assets + Plugins
   ↓
Assembly Plan
   ↓
Dynamically Composed Project
```

## 5. 为什么先做 Starter Project

Starter Project 同时解决两件事：

1. 给普通开发者一个真正能继续开发的起点；
2. 强迫 Fate Engine 用真实游戏类型验证 Editor、Runtime、Asset、Animation、Physics、UI、Input、Audio、Save、Build 等完整引擎能力。

如果一个 Starter Project 无法真正做完整，说明对应的 Engine Foundation 还不够成熟。

## 6. 第一批类型策略

游戏分类可以很多，但 Starter Project 必须逐个做实。

推荐流程：

```text
Choose one Category
      ↓
Build production-quality Starter Project
      ↓
Use it to repair Engine Foundation
      ↓
Mark starter_available
      ↓
Move to next Category
```

不是同时铺开十几个半成品模板。

## 7. Starter Project 的边界

Starter Project 应提供该类型的共同基础，但不应该替开发者决定游戏内容。

例如一个 RPG Starter 可以提供：

- Player Controller；
- Camera；
- Stats；
- Combat foundation；
- Enemy；
- NPC；
- Dialogue；
- Quest foundation；
- Inventory / Equipment；
- UI；
- Save；
- 一个示例关卡。

但它不应该绑定某个世界观、剧情、美术 IP 或强制玩法结构。

## 8. 可替换性

Starter Project 内的系统必须尽量可替换。

开发者应该能够：

- 换掉角色；
- 换掉战斗；
- 换掉 UI；
- 换掉地图；
- 换掉 Camera；
- 删除不需要的系统；
- 增加自己的插件和代码。

Starter Project 是起点，不是框架牢笼。

## 9. 第一阶段验收

Fate Engine 第一阶段的核心验收不是“支持多少概念”，而是：

> **至少一个 Game Category 已经可以从 New Project 直接创建出真正完整、可试玩、可继续开发的 Starter Project。**

之后再逐步扩展更多 Game Category。

## 10. 后续阶段

Starter Project 稳定之后，才能逐步讨论：

- 多 Starter Variant；
- Community Starter；
- Template 派生；
- Component Library；
- AI-assisted editing；
- Game Assembly；
- 一键动态组合。

这些都建立在 Starter Project 已经证明 Fate Engine 可以完成传统游戏开发的基础上。