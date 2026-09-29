# Fate Engine TODO

> 状态：Current Work Queue / SSOT
>
> 规则：
> - 这里只记录还没完成、且已经明确到可以执行或验证的事项。
> - 长期愿景不直接复制进 TODO；愿景见 Vision.md。
> - 架构说明不写进 TODO；架构见 Architecture.md。
> - 已完成项从这里移除，由 Git 历史保留。

## A. 文档与架构收敛

- [ ] 继续检查各子系统 README，删除与 Vision / Architecture 冲突的旧总定位。
- [ ] 给关键子系统补齐统一的 Status / Scope / Dependencies / Non-goals 头部。
- [ ] 后续新增架构级设计时优先修改 Canonical 文档，不再创建平行总纲。

## B. World Asset / Brick

目标：让世界资产真正成为可复用、可安装、可验证、可版本化的标准积木。

- [ ] 提供模板中心，覆盖 UI、交互、数据驱动、特效等常见起点。
- [ ] 提供“人话报错”，错误至少包含：问题、位置、修复建议。
- [ ] 提供最小可复制样例集合，优先服务新发布者上手。
- [ ] 固定积木协议的五类标准问题：空间适配、交互适配、状态适配、资源绑定、约束冲突。
- [ ] 固定积木协议六层结构：空间层、交互层、状态层、逻辑层、资源层、约束层。
- [ ] 收敛最小可行协议：基础信息、空间信息、参数表、输入事件口、输出事件口、状态表、校验规则。
- [ ] 完成门、开关、区域触发器、灯四类高频积木的子协议定义。
- [ ] 在四类基础子协议稳定前，不扩展更多积木玩法类型。

## C. Game Assembly

目标：证明开发者可以从“可玩 Demo”开始，而不是从空项目开始。

- [ ] 明确 Game Type / Template / Component / Plugin / Style 的最小装配协议。
- [ ] 定义 Assembly Plan 与 Recipe 的职责边界。
- [ ] 选一个最小 Game Type，完成从模板选择到 Playable Demo 的端到端验证。
- [ ] 确保生成结果可以继续人工编辑，而不是一次性不可维护产物。
- [ ] 把 Validator 接入装配闭环：装配 → 校验 → 修正 → 再校验。

### Boss 模板系统

- [ ] 做出基础 Boss 基座。
- [ ] 做出首批通用技能包。
- [ ] 做出阶段配置工作流。
- [ ] 保留独特机制扩展点。
- [ ] 证明 Boss 模板化能够显著减少重复开发。

### 玩家能力包系统

- [ ] 做出 Ability Set 基础格式。
- [ ] 做出首批玩家能力包样例。
- [ ] 证明区域 / 组合积木可以授予能力。
- [ ] 做出角色兼容性检查与调试面板。

## D. Fate Game / World Kernel

目标：验证“原作是默认命运线，而不是强制剧情”这一核心机制。

- [ ] 固定最小 Fate Graph 数据结构：Character、Event、Fate Link、Fate Node、Condition、Consequence。
- [ ] 做一个无画面的最小 Fate Scenario：玩家通过充分因果破坏一个原作关键节点。
- [ ] 验证 World Will 只能修复偶然扰动，不能覆盖已经成立的充分因果。
- [ ] 验证 Character / Relationship / Memory / Schedule 的变化可以继续影响后续 Fate。
- [ ] 将 Scenario Test 变成自动测试，而不是只写剧情说明。

## E. Anime-first Visual

目标：验证 Anime Style 是否真的比 Standard PBR / PBR + Toon 更接近二维动画角色。

- [ ] 冻结第一版 Anime Render Style Contract。
- [ ] 定义 Anime Lighting / Projection / Geometry Correction 的最小接口。
- [ ] 建立固定角色 + 固定房间的视觉基准场景。
- [ ] 加入 Standard PBR / PBR + Toon / Fate Anime Style 三组对照。
- [ ] 优先验证正脸、30°、45°、60°、侧脸的角色身份稳定性。
- [ ] 在实现前明确性能预算与 Unity URP Adapter 边界。

## F. Native AI Agent

目标：Agent 首先成为标准资产的世界工程师，而不是不可控的资产生成器。

- [ ] 定义 Builder Agent 最小输入：User Intent + Constraints + Game Type + World Context。
- [ ] 定义最小输出：Asset Selection + Assembly Plan + Parameters + Validation Request。
- [ ] Asset Search 必须只返回许可、版本和兼容信息明确的资产。
- [ ] Agent 生成的计划必须可审计、可 diff、可重放。
- [ ] Builder Agent 与 Runtime Character Agent 保持接口和权限隔离。

## G. Runtime Character / Social Simulation

- [ ] 继续完善统一 Character 模型与 Simulation Level。
- [ ] 验证 Personality / Preferences / Skills / Knowledge 四类输入不会混为一体。
- [ ] 验证角色知识受到身份、资格、经历与 World State 约束。
- [ ] 选一个最小社会制度场景完成跨系统闭环测试。

## H. Metaverse Foundation

> 暂不进入实现。

只有当 World Asset、Identity、Package、Permissions、World State 和 Runtime 协议在多个真实游戏场景中稳定后，才开始定义跨世界互操作协议。

当前不创建“元宇宙平台”代码模块，避免提前设计没有真实使用验证的抽象。

## I. 非强制接入与扩展边界

- [ ] 明确哪些系统是可选的。
- [ ] 为自定义玩法保留扩展接口。
- [ ] 证明项目可以部分采用 Fate Engine 能力，而不是必须全盘接受。

## 已经完成且不再作为 TODO 保留的能力

发布者闭环、基础打包安装、版本/依赖/许可读取、回滚、基础发布治理等已经在现有原型中形成可运行实现；详细历史由 Git 提交、PackageConsumeFlow.md 与 releases/ 记录，不在本 TODO 重复罗列。