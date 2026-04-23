Fate Engine 硬性架构要求 v0.1
0. 设计边界（不可违反）

80/20 原则：80% 通过自动化/积木/规则系统实现；20% 通过扩展点提供自由创作。

AI 分层：编辑器 AI 负责白盒装配与建议；运行时 NPC AI 是独立子系统。二者必须边界清晰、接口分离、可单独关闭。

可复现优先：同一 recipe + seed + lockfile 必须生成一致结果（跨机器、跨时间）。

语言收敛：第一阶段以 Unity/C# 为唯一宿主实现语言，C++ 不再作为产品主线的一部分。Runtime Core 允许 Rust 作为参考核心与宿主桥接原型语言存在。

开源友好：所有第三方依赖必须满足“可免费使用 + 可开源引入 + 允许商用”的许可策略（见第 3 节）。

1. 语言与版本（必须固定）

说明：这里的版本是“工程锁定版本”（pinned baseline）。后续升级必须走 RFC + CI 全量回归。

1.1 Rust（Runtime / Core / Toolchain 核心）

Rust Edition：2024（当前基线）

MSRV（最低支持 Rust 版本）：1.78.0

Cargo.lock：必须提交到仓库（可复现）

硬限制

Runtime 核心不得使用 unsafe，除非：

性能关键路径 + 有基准测试证明

有明确的 unsafe 审计文档（WHY/INVARIANTS）

有对应的单测/模糊测试覆盖

1.2 TypeScript（Editor / Composer / UI）

Node.js：20 LTS

TypeScript：5.4+

包管理：pnpm（必须），锁文件必须提交

当前 editor 交付形态：TypeScript + React 前端原型（`editor/app`，本地 Vite 构建）

桌面容器：Tauri（当前基线），目标平台为 macOS / Windows

硬限制

Editor 与 Runtime 的通信协议必须版本化（见第 2.4 节），不得出现“隐式字段”或“随手加字段不兼容”。

1.3 C++（历史兼容 / 可选外部插件）

标准：C++20

构建：CMake ≥ 3.28

异常/RTTI：模块内可用，但跨 FFI 边界必须禁用异常传播（见第 2.3 节）

硬限制

C++ 不作为第一阶段产品主线；如果未来恢复外部插件或历史兼容层，也必须与 Unity 主线解耦。

1.4 Go（Registry / 后端服务，第二阶段再启用）

Go：1.22+

依赖管理：Go modules（必须），go.sum 必须提交

硬限制

第一期 Demo 可以完全不引入 Go；只有当你决定“线上资产库/注册表”时才启用。

2. 模块化架构（必须遵守）
2.1 仓库结构（硬性）

runtime/（Rust）：Fate Runtime Core 原型、快照回放、宿主桥接接口、校验器核心、协议一致性验证

editor/（TS）：场景编辑、装配器、配方管理、可视化校验报告、调试可视化

unity/：Unity XR 宿主骨架、XR Base Hall 样例、ScriptableObject/Baker 范例

protocol/（Rust+TS 共享定义）：消息协议/版本、JSON schema、共享契约常量、错误码

packages/：内置积木包（Door/Ladder/TriggerZone 等），每个包必须带 demo 与测试

tools/：导入管线、批处理、CI 辅助工具

硬限制

任何跨模块调用必须通过 protocol 或明确的接口层；禁止“直接引用对方内部结构”。

2.2 运行时（Runtime）必须采用 ECS 或等效组件化模型

推荐 ECS：Unity DOTS/ECS（第一阶段唯一宿主）

所有交互积木必须以“组件 + 系统”方式挂载执行（禁止散落脚本）

硬限制

积木逻辑不得直接访问渲染对象；必须通过事件/命令队列发出“意图”。
第一阶段的运行与表现由 Unity 承担；Fate Runtime Core 负责世界真相、NPC 运行时 AI、命运状态、快照回放与宿主桥接。
当前宿主主线已经切到 `PCVR + OpenXR + XR Interaction Toolkit + Input System`，验证场景改为 `XR Base Hall Demo`，不再以平面验证房间作为产品主场景。

2.3 FFI 边界（Rust ↔ C++）硬性规则

如果启用任何宿主集成层：

只允许稳定的数据边界，不允许在白盒层直接依赖宿主内部对象

所有宿主交互必须可导出、可回放、可校验

2.4 Editor ↔ Runtime 通信协议（硬性）

协议必须版本化：protocol_version = MAJOR.MINOR

不允许“魔法字段”

所有消息必须有稳定 type 与 request_id

错误必须结构化：code / message / details

硬限制

schema-first：先改 schema，再改实现。若协议版本/type/error code 发生变化，必须同步更新 `protocol/contracts/` 共享契约，并通过契约一致性检查。

3. 第三方依赖与许可（必须执行）
3.1 允许的开源许可（默认白名单）

MIT

Apache-2.0

BSD-2-Clause / BSD-3-Clause

zlib

ISC

CC0（仅限工具/数据，不限但需标注来源）

3.2 限制与默认禁止（除非 RFC）

GPL / LGPL / AGPL：默认禁止进入核心仓库（尤其 Editor/Runtime 静态链接场景）

自定义许可、非商业限制（NC）、不明确来源：禁止

3.3 依赖引入规则（硬性）

每个依赖必须记录：用途、版本、许可证、替代品、升级策略

禁止“为了方便拉一个巨型框架”——必须证明不可替代

Demo 阶段允许“临时依赖”，但必须打标 EXPERIMENTAL_DEP，并在 30 天内清理或转正（RFC）

4. 第一阶段 Demo 的技术选型（硬性建议，优先落地）
4.1 Runtime 推荐免费开源组合

第一阶段不再推荐自研渲染壳或独立游戏运行时。
Unity 负责渲染、物理、动画、XR 输入与场景运行；Fate Engine 负责 recipe、校验、装配、叙事 runtime 和导出。

你要证明的是“积木装配与校验”，不是渲染黑科技。

4.2 Editor 推荐免费开源组合

TypeScript + React（MIT）前端原型

构建/预览工具当前基线为 `Vite + Tauri`；前端必须本地构建，不得依赖外网 CDN import map

状态管理随意，但必须可测试、可回放（例如 redux 风格）

5. 核心数据格式（硬性）
5.1 积木包（Brick Package）必须包含

manifest：id/version/deps/params/defaults/license/compat

logic：事件/条件/动作（白盒，可 diff）

defaults：占位资源（允许为空，但必须有 fallback 行为）

demo：示例场景（必须）

tests：至少 1 个自动测试用例（必须）

5.2 生成配方（Recipe）

必须包含：seed、引用的包版本、装配拓扑（事件连接）

必须可导出 lockfile（锁定依赖树与哈希）

硬限制

任何 AI 生成内容必须输出为 Recipe（或能无损转换为 Recipe）。

6. 校验器（Validator）硬性要求（第一阶段就要有）

至少包含四类检查（Error/Warning 分级）：

缺参数/缺资源（硬错误）

穿插/碰撞异常（硬错误或警告）

可达性（梯子上下点、触发区可进入）（硬错误）

预算超限（实例数、材质数、阴影距离等）（警告为主）

硬限制

校验器必须“可批处理运行”（CI 上跑），不得只存在于编辑器 UI。

7. 调试与可观测性（硬性）

Runtime 必须提供结构化日志 + trace（带事件链）

规则系统（掉落/技能选择/Boss 导演）必须输出“决策理由”（可视化用）

至少提供“最近 N 秒事件回放”的基础设施（第一阶段可简版）

8. 构建与 CI（硬性）

当前仓库默认使用手动触发门禁（`workflow_dispatch`）：

合入前必须手动执行并确认以下检查：

Rust：fmt + clippy + test

TS：lint + typecheck + test

schema 校验：protocol/manifest/recipe 的 JSON schema

校验器批处理：跑 demo 场景并输出报告（必须可复现）

必须提供一键构建脚本：dev bootstrap（名字随意，但要统一）

9. 安全与合规（硬性）

资产库（后续 Go 服务）必须记录来源与许可字段；不得“黑盒抓取”

AI 检索/装配必须保留审计日志（用到哪些包、版本、许可证）

默认拒绝“未知许可资产”的自动引入（除非用户明确允许并承担风险）

10. 阶段性冻结点（防止架构漂移）

Demo v0：只允许 Unity + 外部白盒编排层 + 参考校验核心，不新增自研渲染主线

Alpha v0.5：允许扩展 Unity 导入器、Baker 和资产模板，但不得把宿主责任迁回自研 runtime

Beta v1：允许引入 Go Registry（线上生态），但不得反向污染 Unity 主线或外部编排器
