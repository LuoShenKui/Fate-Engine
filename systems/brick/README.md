# Brick Subsystem

Brick 是 Fate Engine 的 **3D 场景快速装配子系统**。

它的目标不是承担世界因果、命运或社会制度，而是把重复的 3D 场景制作工作收敛成可复用、可组合、可参数化的构建单元。

理想使用方式是：

```text
选择场景模板 / 输入场景需求
        ↓
匹配 Brick + Asset + Ability Set
        ↓
自动装配 / 参数化
        ↓
校验依赖、碰撞、绑定和版本
        ↓
导出到 Unity
        ↓
得到可玩的 3D 场景
```

例如：

- Door / Ladder / Switch / Pickup 等基础交互；
- 建筑部件、室内房间、街区构件；
- 教室、小屋、仓库、商店等组合模板；
- 对应的动画、碰撞体、音频、VFX、Ability Set 和默认参数。

它解决的是：

> **如何快速甚至一键构建 3D 场景。**

而不是：

> **世界为什么这样运行。**

后者属于 World Kernel、Causality、Fate、World Will 以及 School / Police / Hospital 等社会制度系统。

## Canonical paths

- Packages: `systems/brick/packages/`
- Contract: `systems/brick/docs/BrickContract.md`
- Legacy compatibility mirror: `packages/`

## Responsibilities

Brick 负责：

- 3D 场景快速装配；
- 可安装、可组合交互构件；
- 场景与区域组合模板；
- 资产绑定和 Ability Set；
- manifest、依赖、版本和 lockfile；
- 发布、升级、回滚和兼容校验；
- 编辑器装配；
- Unity-facing recipe/export。

Brick 不负责：

- 世界因果真相；
- Fate 图；
- World Will；
- NPC 长期记忆；
- 世界时间；
- School / Police / Hospital 等制度规则。

现有 `editor/`、`protocol/`、`runtime/` 和 `unity/` 中的 Brick 集成暂时保留原位置，视为该子系统的调用方与适配层。
