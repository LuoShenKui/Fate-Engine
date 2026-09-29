# Fate Engine TODO

> 状态：Current Work Queue / SSOT
>
> 第一阶段核心目标：**让用户 New Project → 选择 Game Category → 直接得到一个完整可玩、可继续开发的 Starter Project。**

## P0：完成第一个官方 Starter Project

先只主攻一个 Game Category，不同时铺开多个半成品。

- [ ] 从 `GameCategories.md` 选择第一个主攻类型。
- [ ] 定义该类型 Starter Project 的最小完整 Gameplay Loop。
- [ ] 完成真实角色 / 控制器。
- [ ] 完成 Camera。
- [ ] 完成 Input。
- [ ] 完成至少一个完整示例 Scene / Level。
- [ ] 完成该类型必要 Gameplay Systems。
- [ ] 完成 UI / HUD / Menu。
- [ ] 完成 Animation。
- [ ] 完成 Physics / Collision。
- [ ] 完成 Audio。
- [ ] 完成必要 Save / State Persistence。
- [ ] 完成 Debug / Validation 基础。
- [ ] 完成 Build / Packaging。
- [ ] 实际试玩并修复阻塞继续开发的问题。

### P0 验收

Starter Project 只有同时满足以下条件才可标记为 `starter_available`：

1. New Project 可以直接创建；
2. 不需要额外手工补文件才能运行；
3. 启动后立刻可以试玩；
4. 有完整 Gameplay Loop；
5. 可以修改资产、规则和内容继续开发；
6. 可以构建为独立可运行版本；
7. 它看起来是一个小型基础游戏，而不是 Engine Tech Demo。

详细规则见 `StarterProjects.md`。

## P1：New Project → Starter Project 产品流程

- [ ] New Project 页面显示 Game Category。
- [ ] Game Category 显示支持状态：`unsupported / experimental / starter_available`。
- [ ] 选择已支持类型后显示官方 Starter Project。
- [ ] Create Project 能复制 / 实例化 Starter Project。
- [ ] 新项目拥有独立 Project ID、配置和资源引用。
- [ ] 创建完成后可以直接 Run / Play。
- [ ] Starter Project 更新不能破坏用户已经创建的项目。

## P2：用 Starter Project 补完整 Engine Foundation

Starter Project 是引擎验收工具。缺什么就补什么：

- Project / Scene / World；
- Resource / Asset Runtime；
- Rendering / Presentation Boundary；
- Animation；
- Physics；
- Audio；
- Input；
- UI；
- Gameplay / Scripting；
- Persistence；
- Editor；
- Debugger / Profiler / Validator；
- Build / Platform。

## P3：标准资产

当前已有：

- `FateAssetProtocol.md`；
- `Fate3DAssetStandard.md`；
- `FateHumanoidStandard.md`。

只优先实现 Starter Project 真正需要的资产类型与校验：

- [ ] 用真实 Starter 资产验证 Asset Protocol。
- [ ] 建立 Import → Validate → Runtime 流程。
- [ ] 验证 GLB / glTF Runtime 路线。
- [ ] 用真实角色验证 FateHumanoid。
- [ ] 修订不合理字段。

## P4：扩展第二个 Game Category

第一个 Starter 稳定后再进入：

- [ ] 选择第二个差异明显的 Game Category。
- [ ] 做第二个完整 Starter Project。
- [ ] 比较两个类型真正共享的 Engine 能力。
- [ ] 只把被真实验证重复的部分抽成公共 Template / Component。

## P5：Anime-first

如果某个 Starter 使用 Anime 风格，则直接用真实游戏画面验证 Anime Rendering；否则保持独立实验。

## P6：Native AI Agent

AI 可以辅助开发，但不能成为 Starter Project 能否成立的必要条件。

- [ ] 先保证所有关键流程可以由普通 Editor / Tool 完成。
- [ ] 再让 Agent 调用这些稳定工具。
- [ ] 不先做自然语言自动生成完整游戏。

## P7：Game Assembly

> **后期能力。Starter Project 不等于 Game Assembly。**

只有多个完整 Starter / 真实项目证明哪些结构稳定重复后，再设计：

- Template 组合；
- Component Library；
- Assembly Plan / Recipe；
- AI-assisted Assembly；
- 动态一键组合。

## P8：Fate Game / Advanced World Simulation

Fate Game 建立在已经稳定的传统游戏开发能力之上，不阻塞第一阶段。

## P9：Metaverse Foundation

> 暂不进入实现。

## 当前明确不做

- 同时制作大量半成品 Starter；
- 把 Starter Project 做成不可修改的固定框架；
- 当前阶段动态 Game Assembly；
- 当前阶段自然语言生成完整游戏；
- 大规模 Marketplace；
- 元宇宙 Runtime。

## 已完成且保留

现有 Brick、Package、发布、安装、回滚、World Kernel、Anime 设计、Asset Protocol 等实验成果保留，但当前优先级统一服从 Starter Project 第一阶段目标。