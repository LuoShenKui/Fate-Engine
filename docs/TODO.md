# Fate Engine TODO

> 状态：Current Work Queue / SSOT
>
> 当前最高优先级：**先做出一个完整、真正可玩的游戏 Demo。**
>
> 规则：
> - 当前不做 Game Assembly 自动化；
> - 当前不做一键 Game Type Demo；
> - 当前不同时支持所有游戏分类；
> - 先用一个真实 Demo 暴露引擎缺失能力，再补 Engine Foundation；
> - 只有 Demo 完整成立后，才把经验抽象成 Template / Game Type / Assembly。

## P0：确定并完成第一个完整游戏 Demo

目标：证明 Fate Engine 至少能完整支撑一种真实游戏，而不是只能做白盒、协议或技术验证。

- [ ] 从 `GameCategories.md` 的集合中确定一个主攻 Game Category。
- [ ] 写清楚该 Demo 的完整玩法循环、开始条件和结束条件。
- [ ] 明确 Demo 的最小内容规模，但必须是完整游戏体验，不是单个技术房间。
- [ ] 角色控制完整可用。
- [ ] Camera 完整可用。
- [ ] Gameplay Loop 完整可用。
- [ ] Scene / Level 流程完整可用。
- [ ] UI / HUD / Menu 完整可用。
- [ ] Input 完整可用。
- [ ] Animation 完整可用。
- [ ] Physics / Collision 完整可用。
- [ ] Audio 完整可用。
- [ ] Save / State Persistence 达到 Demo 所需水平。
- [ ] Debug / Error / Validation 能支撑实际开发。
- [ ] Build / Packaging 能生成真正可运行版本。
- [ ] 实际试玩并记录所有阻塞开发的问题。

### P0 验收

只有同时满足以下条件才算通过：

1. 不依赖手工临时修改才能启动；
2. 从启动到结束存在完整 Gameplay Loop；
3. 可以重复试玩；
4. 可以构建成独立可运行产物；
5. Demo 暴露出的引擎缺陷已经形成明确问题清单；
6. 它看起来是一个小型游戏，而不是 Engine Tech Demo。

## P1：根据 Demo 补完整 Game Engine Foundation

不提前假设所有引擎模块怎么做，以 P0 Demo 的真实问题驱动。

重点补齐：

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

## P2：标准资产规则

当前已有协议：

- `FateAssetProtocol.md`；
- `Fate3DAssetStandard.md`；
- `FateHumanoidStandard.md`。

下一步只做 Demo 真正需要的资产类型和校验，不为了未来 Marketplace 一次定义所有资产。

- [ ] 用真实 Demo 资产验证 Asset Protocol。
- [ ] 修订不合理字段。
- [ ] 建立最小 Import → Validate → Runtime 流程。
- [ ] 验证 GLB/glTF Runtime 路线。
- [ ] 用真实角色验证 FateHumanoid。

## P3：Anime-first Visual

如果第一个 Demo 选择 Anime 视觉路线，则进入当前开发；否则只保持协议与实验状态。

- [ ] 用 Demo 中真实角色做视觉基准。
- [ ] 验证 Anime Lighting / Projection / Geometry Correction。
- [ ] 验证 Animation Timing / Pose / Camera Language。
- [ ] 与普通 3D / Toon 方案进行实际游戏画面对照。

## P4：Native AI Agent

当前只允许 AI 作为开发辅助工具，不让 AI Agent 成为 P0 Demo 的必要依赖。

- [ ] 等完整手工开发流程稳定后，再确定 Agent 可以替代哪些重复步骤。
- [ ] Agent 的能力必须建立在真实 Editor / Asset / Build Tool 之上。
- [ ] 不先做“自然语言 → 自动完整游戏”的大闭环。

## P5：Game Type / Template / Assembly

> **明确后置。**

Game Category 当前只是分类集合，见 `GameCategories.md`。

只有至少一个完整 Demo 成立后，再做：

- [ ] 从第一个 Demo 中提炼可复用组件。
- [ ] 判断哪些能力属于 Engine，哪些属于该游戏类型。
- [ ] 定义该类型的 Template。
- [ ] 再验证第二个同类游戏能否复用 Template。
- [ ] 两个以上真实案例稳定后，再设计 Game Assembly。
- [ ] 最后才考虑“一键生成 Demo”。

## P6：Fate Game / Advanced World Simulation

Fate Game 是长期第一方高级能力，但当前不阻塞第一个普通完整 Demo。

- [ ] 等 Generic Game Runtime 稳定后，再验证 Fate Graph / Causality / World Will。
- [ ] Fate 世界必须建立在已经可工作的普通 Gameplay Runtime 上。

## P7：Metaverse Foundation

> 暂不进入实现。

只有多个真实游戏已经验证 Asset、Identity、Networking、Persistence、Permissions 等协议之后，才讨论跨世界互操作。

## 当前明确不做

- 同时开发多个 Game Category Demo；
- 一键 Game Assembly；
- 自动 Game Type 组合；
- 大规模 Marketplace；
- 元宇宙 Runtime；
- 为尚未出现的使用场景提前做大量抽象。

## 已完成且保留的基础工作

现有 Brick、Package、发布、安装、回滚、协议、World Kernel、Anime 设计等原型不会删除；它们作为已有实验成果保留，但不再决定当前开发优先级。