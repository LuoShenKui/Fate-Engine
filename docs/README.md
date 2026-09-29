# Fate Engine Documentation

> 本目录采用“总纲 → 架构 → 子系统 → 当前执行 → 历史资料”的阅读顺序。
> 不再允许多个文档同时定义 Fate Engine 的总定位。

## 1. 必读文档

1. **Vision.md** — 项目总愿景（SSOT）。定义 Fate Engine 是什么、六大长期支柱以及最终边界。
2. **Architecture.md** — 当前技术总架构（SSOT）。定义各系统职责、依赖方向和宿主边界。
3. **TODO.md** — 当前未完成事项（SSOT）。只记录还没完成的工作，不承担愿景或架构说明。

## 2. 核心子系统文档

- AnimeRenderStylePRD.md — Anime-first / Style-Aware Rendering 技术规范。
- ../systems/brick/docs/BrickContract.md — Brick / 世界资产装配契约。
- PackageConsumeFlow.md — 包发布、安装、版本、lockfile、回滚和消费流程。
- ../pipeline/README.md — 世界构建 Pipeline。
- ../systems/character/README.md — Character System。
- ../systems/japan/README.md — 国家/地区社会制度模板。
- Licensing.md — 代码、文档、示例资产、第三方资产与 Marketplace 资产许可证边界。

## 3. 原型、测试与运维文档

Editor3DTestReadiness.md、DoorParityChecklist.md、ForestCabinDemo.md、RuntimeSoakCrashArchive.md、ScreenshotOperation.md、TestFailureTriage.md、UnityWhiteBoxPivot.md、releases/、superpowers/ 都属于具体 Demo、测试、发布或历史工程记录，不负责定义项目本身。

## 4. 历史设计文档

以下文件记录项目早期阶段的决策，不得再作为当前总纲引用：

- product.md — 早期 80/20 自动化与 Brick 产品原则。
- Target.md — 早期原型目标与门禁。
- FrameWork.md — 早期 Brick / Runtime 技术约束。
- FirstStep.md — 早期第一阶段 Demo 方案。

其中仍然有效的原则，应逐步迁移到 Vision、Architecture、BrickContract 或 TODO；迁移后历史文档保持只读参考。

## 5. 文档职责规则

- Fate Engine 为什么存在 / 最终是什么 → Vision.md
- 系统怎么分层 / 谁依赖谁 → Architecture.md
- 某个子系统怎么设计 → 对应子系统 PRD / Contract
- 现在还要做什么 → TODO.md
- 怎么测试 / 发布 / 排障 → 独立操作文档
- 已经过期但有历史价值 → 保留并显式标记 Historical

禁止再次创建 Target2.md、NewArchitecture.md、Vision-v2.md 一类平行总纲。