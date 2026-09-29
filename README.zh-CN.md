# Fate Engine

[English](./README.md) | [简体中文](./README.zh-CN.md)

Fate Engine 是一个仍处于原型阶段的下一代游戏引擎项目。

## 第一阶段要做什么

第一阶段的目标很直接：

> **打开 Fate Engine → New Project → 选择游戏类型 → 直接得到一个完整可玩、可继续开发的 Starter Project。**

例如选择 RPG、ARPG、FPS、类魂或竞速类型后，Fate Engine 不应该给你一个空目录，而应该给你一个已经包含该类型基础控制、Camera、Gameplay、UI、Animation、Physics、Audio、存档与示例场景的基础游戏工程。

开发者直接在这个 Starter Project 上：

- 替换角色和资产；
- 修改战斗或玩法；
- 修改 UI；
- 增加地图、剧情和系统；
- 删除不需要的功能；
- 最终做成自己的游戏。

详细规则见 [docs/StarterProjects.md](docs/StarterProjects.md) 与 [docs/GameCategories.md](docs/GameCategories.md)。

## 第一阶段不是什么

Starter Project **不是** AI 动态生成游戏，也不是 Game Assembly。

第一阶段是：

```text
Game Category
    ↓
Official Starter Project
    ↓
Create Project
    ↓
Playable Base Game
```

更复杂的 Component / Template / AI Game Assembly 属于后续阶段，必须建立在多个真实 Starter Project 已经验证成功之后。

## 长期方向

Fate Engine 长期还希望发展：

1. **World Asset System**：标准化、可复用、可验证、可版本化的世界资产体系。
2. **Starter Project / Game Assembly**：先提供官方完整基础项目，后续再逐步自动化重复开发工作。
3. **Fate Game System**：允许玩家真正改变原作世界的命运和时间线。
4. **Anime-first Visual System**：让二次元角色在 3D 世界里尽量保持动画中的视觉身份。
5. **Native AI Agent**：AI 原生理解项目、资产和工具，但不绕开规则和验证。
6. **Metaverse Foundation**：长期探索不同虚拟世界之间的协议互操作。

完整愿景见 [docs/Vision.md](docs/Vision.md)。

## 当前关键文档

- [docs/StarterProjects.md](docs/StarterProjects.md)：第一阶段核心产品目标。
- [docs/GameCategories.md](docs/GameCategories.md)：游戏类型集合。
- [docs/Architecture.md](docs/Architecture.md)：完整游戏引擎目标架构。
- [docs/FateAssetProtocol.md](docs/FateAssetProtocol.md)：标准资产协议。
- [docs/Fate3DAssetStandard.md](docs/Fate3DAssetStandard.md)：3D / glTF / GLB 资产规范。
- [docs/FateHumanoidStandard.md](docs/FateHumanoidStandard.md)：Humanoid 标准。
- [docs/AnimeRenderStylePRD.md](docs/AnimeRenderStylePRD.md)：Anime-first 视觉体系。
- [docs/TODO.md](docs/TODO.md)：当前工作队列。

## 当前原则

- Fate Engine 首先必须是一套能做传统游戏的完整游戏开发引擎。
- 一个普通游戏可以完全不启用 Fate / World Will 等高级系统。
- 第一阶段优先把至少一个 Game Category 的 Starter Project 做完整。
- Starter Project 必须能直接试玩、修改和 Build，不能只是 Tech Demo。
- Unity 是当前宿主，不是 Fate Engine 的最终定义。
- World Asset / Anime / AI / Fate 都不能替代最基础的游戏开发能力。

## 许可证

- **代码：** MPL-2.0
- **文档：** CC BY 4.0
- **示例资产：** 明确标记为 CC0 或 CC BY 4.0
- **第三方资产：** 遵循各自许可证
- **Marketplace 资产：** 按资产单独声明许可证与商业条款

允许商业使用。**使用 Fate Engine 开发并发行的游戏或应用可以保持闭源，不需要公开自己的游戏源码。** 只有修改并分发 Fate Engine 自身受 MPL-2.0 覆盖的源代码文件时，这些受覆盖的修改源代码才需要继续按照 MPL-2.0 提供。

详见 [LICENSE](LICENSE) 与 [docs/Licensing.md](docs/Licensing.md)。

## 当前状态

项目仍然非常早期。仓库中存在多个此前用于验证 Brick、World Kernel、Unity Host、Package、Asset、Anime Rendering 等方向的原型；这些不代表第一阶段已经完成。

第一阶段是否成立只看一个结果：

> **能否从 New Project 选择一种游戏类型，然后直接得到一个真正能继续做游戏的 Starter Project。**
