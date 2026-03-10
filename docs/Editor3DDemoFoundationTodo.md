# Editor 3D Demo Foundation Todo

> 目标：先把“可测试的 3D 积木 Demo 底座”做出来，用于验证积木模式。
>
> 边界：本清单只定义执行顺序、交付物和完成标准；M1/M2/M3 的唯一准入口径仍以 `docs/Editor3DTestReadiness.md` 为准。

## 当前判断

- 当前仓库已经具备可测试的 3D 积木 Demo 底座。
- 当前仓库已经完成固定场景、统一交互样板、多积木接入，以及 editor 侧的自动化回归入口。
- 当前剩余 blocker 主要是本机 `cmake` 缺失导致 `check-m1` 无法在本地执行，不是当前 Demo 代码链路缺口。

## 当前状态

- P0：已完成
- P1：已完成
- P2：已完成最小目标（`TriggerZone` / `Switch` / `Ladder` 已接入）
- P3：已完成代码侧最小目标（visual / replay / routing / behavior / perf 已有固定入口）

## 当前固定 Demo 能力

- 固定 3D 场景：`Forest Cabin v0`
- 固定积木关系：
  - `trigger-zone-1 -> door-1`
  - `trigger-zone-2 -> door-2`
  - `switch-1 -> door-2`
  - `ladder-1 -> door-1`
- 固定检查入口：
  - `make check-m1`
  - `make check-m2`
  - `make check-m3`
  - `make check-perf-scenes`
  - `cd editor/app && pnpm run check:visual`
  - `cd editor/app && pnpm run check:routing`
  - `cd editor/app && pnpm run check:behavior`

## 总原则

1. 先能测，再能扩，再能稳。
2. 先做积木样板和固定场景，不先追求画质。
3. 每一阶段都必须给出唯一命令入口和可观察输出。
4. 不新增“文档说有、命令跑不通”的能力。

## P0：打通最小 3D Demo 闭环

### 目标

让编辑器视口稳定加载一个最小 3D 场景，并完成 Door 的可移动、可接近、可交互测试。

### 交付物

- 固定 Demo 场景：地面、边界、小屋或墙体、1 扇 Door、1 个 TriggerZone、玩家出生点。
- 统一启动路径：一条命令能启动编辑器预览或 Demo 场景。
- 3D 视口中的基础移动、碰撞、交互反馈。
- 最小截图基线或视觉回归入口。

### 任务

- [x] 固定 `Forest Cabin` 级别的最小测试场景，不再依赖临时节点摆放。
- [x] 明确玩家出生点、Door 位置、TriggerZone 位置和默认 seed。
- [x] 让编辑器视口进入场景后可稳定移动和观察，不出现空白页或无实体状态。
- [x] 保证 Door 在 Play 模式中可被接近并触发交互。
- [x] 把当前视觉验证流程绑定到固定场景，而不是任意手工状态。

### 完成标准

- 能进入 3D 视口。
- 能看到 Door 占位和场景底板。
- 能通过接近 Door 触发 `OnUsed` / `OnDenied`。
- `make check-visual` 有稳定输入。
- `make check-m1` 的输入场景固定且可复现。

### 对应命令

- `cd editor/app && pnpm run build && pnpm run preview`
- `make check-visual`
- `make check-m1`

## P1：把 Door 做成第一个完整积木样板

### 目标

让 Door 不再只是 demo 特例，而是第一个可被后续积木复用的标准样板。

### 交付物

- Door 的 manifest、runtime、editor、3D 表现、校验输出保持一致。
- Door 具备完整状态链路：`Closed / Open / Locked`。
- Door 具备最小碰撞、触发距离和状态同步。

### 任务

- [x] 统一 Door 的协议字段、编辑器字段和运行时字段命名与语义。
- [x] 清理 Door 的“编辑器定义”和“包 manifest”之间的重复或漂移。
- [x] 固定 Door 的 3D 占位尺寸、碰撞体、触发距离和交互日志格式。
- [x] 确保 Door 的验证结果可定位到对象、字段或 slot。
- [x] 为 Door 的 3D 交互补足回归样例，避免后续积木接入时破坏现有行为。

### 完成标准

- Door 在 3D 视口中可开、可关、可锁定。
- Door 关闭时阻挡通行，打开后允许通行。
- Door 的 manifest、runtime test、editor 行为没有明显语义分叉。
- `make check-m2` 中 Door 相关测试稳定通过。

### 对应命令

- `cargo test --manifest-path runtime/door_core/Cargo.toml door_scene_acceptance_flow_cover_trigger_lock_and_collision`
- `make check-m2`

## P2：补齐第二个和第三个积木，验证“积木模式”不是 Door 特例

### 目标

至少再接入两个积木，使 3D Demo 能证明“组合积木”而不是“单一门测试”。

### 推荐顺序

1. `TriggerZone`
2. `Switch` 或 `Ladder`

### 交付物

- 第二个积木可在 3D 视口中被放置、显示、交互或触发。
- 至少一条跨积木连接可工作。
- 编辑器、运行时、校验器都认识这些积木。

### 任务

- [x] 先把 `TriggerZone` 接入 3D 视口，而不是只停留在 runtime test。
- [x] 支持 `TriggerZone -> Door` 的最小事件连接。
- [x] 接入 `Switch` 或 `Ladder`，验证与 Door 不同的交互类型。
- [x] 让图编辑、属性面板、运行时反馈覆盖新积木，而不只覆盖 Door。
- [x] 为新增积木补齐最小 demo 和自动化样例。

### 完成标准

- 至少 2 个非 Door 积木出现在 3D Demo 里。
- 至少 1 条跨积木交互链路可跑通。
- 不需要手工改代码即可在固定 Demo 中复现组合行为。

### 对应命令

- `cargo test --manifest-path runtime/door_core/Cargo.toml trigger_zone_runtime_interact_and_validate_work`
- `make check-m2`

## P3：建立 Demo 的自动化测试底座

### 目标

让 3D Demo 成为稳定回归样板，而不是一次性的演示工程。

### 交付物

- 固定的功能、视觉、性能、回放一致性入口。
- 固定的基线场景、截图输入、perf 报告输入。
- 失败时可定位是场景、协议、运行时还是视口问题。

### 任务

- [x] 固定 Demo 场景作为 visual baseline 输入。
- [x] 固定 recipe/seed/lockfile 作为 replay baseline 输入。
- [x] 让 perf 场景至少覆盖 Door + TriggerZone 交互流。
- [x] 对失败输出补充定位信息，减少“只知道失败，不知道坏在哪”。
- [x] 把 Demo 回归流程收敛到 `make check-m1/m2/m3`。

### 完成标准

- [x] 改 Door/TriggerZone 逻辑后，能快速知道是否破坏 Demo。
- [x] `make check-m1`、`make check-m2`、`make check-m3` 覆盖固定输入，而不是随手拼装状态。
- [x] 同一 recipe + seed + lockfile 能稳定复现。

### 对应命令

- `make check-m1`
- `make check-m2`
- `make check-m3`

## 暂不做

- 不先做真实高阶渲染后端。
- 不先做复杂光追、Nanite 类能力。
- 不先做开放世界流式正式版。
- 不先做 AI 自动装配。
- 不先追求大而全的积木库数量。

## 下一步

下一步若继续扩展，优先处理本机环境 blocker：安装 `cmake` 并完成 `check-m1` 本地验证；代码侧的 3D Demo Foundation Todo 已基本完成。
