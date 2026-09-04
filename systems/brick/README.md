# Brick Subsystem

Brick 是 Fate Engine 的一个可复用内容装配与交互子系统，不再是项目根架构。

## Canonical paths

- Packages: `systems/brick/packages/`
- Contract: `systems/brick/docs/BrickContract.md`
- Legacy compatibility entry: `packages`

## Responsibilities

Brick 负责：

- manifest、依赖、版本和 lockfile；
- 可安装、可组合交互构件；
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
