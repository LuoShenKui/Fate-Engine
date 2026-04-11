# Fate Engine 总体定位

## 近期里程碑（阶段 + 验收口径）

> 说明：以下为**原型阶段**里程碑，目标是先跑通闭环与机检入口，不代表最终真实 3D 联调全部完成。

| 里程碑 | 目标 | 验收口径（通过标准） | 机检命令入口 |
| --- | --- | --- | --- |
| M1 | Unity 中可导入并消费角色基础组白盒 recipe | 见 `docs/Editor3DTestReadiness.md`（功能项阈值）。 | `make check-m1` |
| M2 | 角色基础组的碰撞/触发/攀爬/拾取闭环 | 见 `docs/Editor3DTestReadiness.md`（稳定性项阈值）。 | `make check-m2` |
| M3 | 可复现场景回放与自动化冒烟 | 见 `docs/Editor3DTestReadiness.md`（回放一致性项阈值）。 | `make check-m3` |


## 门禁覆盖矩阵（当前）

| 检查入口 | ubuntu-latest | windows-latest | macos-latest | 覆盖等级 |
| --- | --- | --- | --- | --- |
| `check` | schema + rust + cmake build + ts build + perf budget | schema + rust + cmake build + ts build + perf budget | schema + rust + cmake build + ts build + perf budget | smoke |
| `replay-determinism` | 固定 seed/recipe/lockfile 的摘要 hash 一致性 | - | - | full |

> 当前仓库以**本地手动门禁**为准：发布前至少执行 `make check-m1`、`make check-m2`、`make check-m3`、`make check-visual`、`make check-perf-scenes`。若后续恢复 GitHub 自动门禁，再单独更新本节。

## 目标机型 + 预算基线 + 回归策略

### 目标机型（当前 Perf Budget profile）

- profile：`mid_tier_pc_1080p`
- 参考机型：6C/12T 桌面 CPU + 主流独显（1080p，默认画质）

### 预算基线（warning/error）

- `frame_time_cpu_ms`：12.0 / 16.0
- `frame_time_gpu_ms`：13.0 / 18.0
- `draw_calls`：2500 / 3200
- `material_count`：180 / 240
- `shadow_distance`：100 / 130

> 基线配置存放在 `protocol/perf/perf_budget.json`，并通过 `tools/check_perf_budget.py` 统一校验。

### 回归策略（持续执行）

1. 持续抽取主干代表场景（至少含 Door/TriggerZone 交互流）。
2. 运行 `make check-perf-scenes` 批量生成结构化报告（`artifacts/perf/*.json`）。
3. `error` 指标（含必填元数据缺失）阻断合入，必须归零；`warning` 指标不阻断，但要进入周报并分配责任人。
4. warning 持续上升的指标，必须给出预算调整或优化方案并复测。
5. 例外流程：确需临时放行时，必须在 PR 记录原因、影响范围、修复截止时间与责任人，并在后续 PR 回收例外。

## 最终愿景
* Unity 宿主上的白盒内容装配系统；
* **内容装配引擎**：把重复劳动（门/梯子/水域/容器/机关…）做成可安装、可组合、可升级的“互动积木库”。
* **AI 只做工具**：白盒“检索 + 装配 + 参数化 + 校验报告”，不在运行时每帧调用模型。
* **真实尺度优先**：角色高度、移动速度、步幅、抓取距离等以现实单位表达，写实资产通过 Unity 资源链路落地。

## 核心差异点

* “拖一个门进场景就能用”升级成：
  “拖一个角色基础组或区域套件进场景就能玩，并自动授予技能包、氛围与交互”。
* **积木库**：包含所有互动积木（门/梯子/水域/容器/机关…）的“互动积木库”。
* 工业化工件，不再重复搭建相同逻辑；
* 所见即所得；

---

# 语言与模块分工（收敛版）

> 目标：开发者尽量不用写自定义宿主；Unity 负责运行与渲染。

* **Unity/C#**：唯一运行宿主、渲染、物理、动画、DOTS/ECS 执行与 Baker 链路
* **Rust**：参考校验核心、协议一致性验证、工具链与导出辅助
* **TypeScript**：编辑器 UI 原型（当前为 `editor/app` 的 `React + Vite + Tauri` 桌面形态）+ 工作流编排（导入/索引/装配/校验/打包）
* **Go**：后续资产库/注册表/账号/下载/队列/索引服务（平台后端）

> 对外开发者主要用：**拖拽积木 + 事件图/组合模板 + 少量 TS（可选）**
> Rust 插件作为高级扩展（非日常玩法语言）。

---

# 引擎架构（分层）

## 1) Runtime（运行时）

### 1.1 Core

* 早期参考实现只保留日志、Trace、崩溃收集、回放基础设施
* 主循环、渲染与物理都交给 Unity

### 1.2 World（开放世界一等公民）

* Unity 负责世界分区、流式加载与场景驻留
* Fate Engine 只定义 world/terrain recipe 与资产布局规则

### 1.3 Asset System（资源系统）

* GUID、依赖图、增量构建缓存
* Unity 资源导入、ScriptableObject 生成、Prefab/引用绑定
* 热重载（编辑器联动）

### 1.4 Gameplay Substrate（玩法基底，非脚本优先）

* 统一交互契约：输入/事件/状态（Interact / OnDenied / StateChanged）
* 状态可序列化（存档、回放）
* 事件总线（Event Bus）+ 条件/动作系统（数据驱动）
* 第一阶段 MVP 包集是角色基础组：walk / run / jump / ladder / pickup / throw

## 2) Rendering（渲染）

### 2.1 Rendering Ownership

* Unity owns the renderer in the first phase
* Fate Engine may only reference rendering requirements as data
* No custom render graph, RHI, or ray tracing stack is part of this slice

## 3) Toolchain（工具链）

* 导入器（glTF/FBX/纹理/音频）
* 处理与烘焙：压缩、mesh 简化、碰撞体生成、shader 编译
* 资源索引与标签：结构化 + 向量索引（为 AI 检索服务）
* 校验器：几何/碰撞/可达性/预算/许可检查

## 4) Editor（编辑器）

* 资源浏览器、场景编辑、属性面板、节点图
* Play-in-Editor：即时预览
* Profiler/Frame Debugger（尽早做）
* “组合模板”面板：一键放置复合积木或角色基础组

## 5) Platform（资产库与生态）

* **Interaction Registry（交互积木注册表）**：像 npm/Docker Hub
* 版本、依赖、锁文件（lockfile）
* Demo scene、自动测试、质量门槛
* 举报/下架/回滚/弃用机制（生态要活必须有）

---

# Fate Engine 的“积木库”设计（核心能力）

## Brick（积木包）包含

* manifest：版本、依赖、参数表、许可、兼容性
* logic：白盒状态机/事件图（可编辑、可 diff）
* defaults：默认表现（占位也可）
* demo：示例场景 + 自动测试用例

## 积木层级

* L0 原语：Interactable、Trigger、State、Saveable、AudioSlot、AnimSlot
* L1 组件：Door、Ladder、Switch、Pickup、Container、WaterVolume…
* L2 组合：篮球场套件、小屋套件、仓库区套件（氛围+技能包+互动）
* L3 区域：医院、学校、工业区；
* L4 城市：包含完整的城市级内容；
* L5 游戏Demo: 包含完整可玩的一个游戏Demo；

## 技能（Ability Set）机制（你要的“进篮球场就会打球”）

* 技能包 = 输入映射 + 动作集 + 状态机 + UI 提示
* Context/Tag（上下文）驱动授予/回收
* 由“区域积木”触发（篮球场积木自带 GrantAbilitySet）

---

# AI（白盒工具）在引擎里的位置与职责

## AI 做什么

* 从本地+公共库检索积木/组合模板
* 生成装配方案（接线、参数化）
* 输出可编辑结果（不是黑盒）
* 输出校验报告与清单（版本、依赖、许可、预算）

## AI 不做什么

* 不在运行时帧循环做决定
* 不生成新资产（你当前策略）
* 不绕过许可检查（白盒可审计≠自动合法）

---

# 路线图（从普通 3D 引擎到 Fate Engine）

## Phase 0：跑起来（2–6 周级别的目标感）

* 窗口/输入/相机控制
* 基础渲染（PBR 简化版也行）
* 资源加载（mesh/texture/shader）
* 场景保存/加载（最小格式）

产出：能加载一个场景并以稳定帧率运行。

---

## Phase 1：可做内容的普通 3D 引擎（MVP）

* 编辑器（TS UI）+ 运行时联动（Play-in-Editor）
* 资源导入与缓存（增量构建）
* 基础交互原语：Interactable/Trigger/State/Saveable
* 10 个高频积木（门/梯子/开关/触发区/拾取/容器/传送/对话点/检查点/水域）
* 校验器 v1（碰撞穿插、参数缺失、简单可达性）

产出：拖拽积木搭关卡，马上可玩；不写重复代码。

---

## Phase 2：开放世界骨架

* 世界分区 + 流式加载（Working Set 预算）
* HLOD v1（静态合并代理）
* 存档系统升级：分区快照 + 事件日志（可回放）
* 性能工具：Profiler/Trace/热点分析

产出：能做“内容密度高但画质一般”的开放世界 demo。

---

## Phase 3：生态与装配（Fate Engine 开始显形）

* 积木包格式定稿 + Registry 服务上线（Go）
* lockfile、依赖解析、版本回滚
* 组合模板系统：篮球场/小屋/仓库区等“复合积木”
* AI 检索装配 v1：一句话→拉包→装配→校验→可编辑结果

产出：开发流程从写代码转为“装配 + 少量独特逻辑”。

---

## Phase 4：Unity 视觉增强（按性价比推进）

* 更完整的 HLOD、遮挡剔除、流式优化
* 角色表演、写实资产、动画质量和大世界表现继续向上迭代
*（长期研究线）更激进的图形技术只在生态与现金流稳定后投入

产出：满足“现代宿主有更好画质按钮”的市场预期，但不把 Fate Engine 变回自研渲染战线。

---

# 里程碑 Demo 规划（最能打的展示方式）

做一个“内容装配 demo”，不是射击走廊：

* 一个小型开放世界街区（流式分区）
* 复合积木：篮球场一放即玩（氛围+互动+技能包）
* AI：输入“做一片门禁仓库区”→ 自动装配并输出校验报告
* 不炫画质，炫 **生产力**：搭建速度与可玩性

---

这份总结可以当作 Fate Engine 的“设计纲领”。你之后每加一个模块，都可以问一句：
**它是让开发者更快装配可玩内容？还是在重复别人已经做得很深的画质战线？**
前者是 Fate Engine 的主线，后者除非有强理由，否则先放到后期。

---

# 从当前原型到“生产可用 3D 生产环境”的缺口清单（2026Q1 视角）

> 背景：当前 Door 交互链路是原型验证用途，目标是验证 schema/runtime/editor 最小闭环；并不等于生产环境可直接交付。

## A. 引擎与运行时稳定性（必须补齐）

1. **可持续运行稳定性**
   - 缺口：暂无明确的长稳压测（如 2h/8h soak test）、内存泄漏门槛、崩溃自动归档规范。
   - 目标：建立 nightly soak + 崩溃回溯 + 内存峰值阈值告警。
   - 当前基线命令（A1 smoke）：`python3 tools/check_runtime_stability.py` / `make check-stability`

2. **世界分区与流式加载实装**
   - 缺口：文档定义了 World Partition/Streaming，但缺少可机检的分区加载、卸载、回放基线。
   - 目标：至少完成“分区切换不丢状态、无明显卡顿尖峰”的基线验收。

3. **存档与回放可靠性**
   - 缺口：缺少“多版本状态迁移 + 回放一致性”回归矩阵。
   - 目标：同 seed/recipe/lockfile + 存档快照在不同机器复现一致结果。

## B. 3D 渲染与性能（历史门槛参考）

1. **渲染后端能力曾作为实验项存在**
   - 现状：历史上补充过“最小可运行后端层”（模拟 Vulkan + `fate_render_probe` 探测程序），并接入过 `make check-render-matrix` 双重校验。
   - 说明：这条线现在不是 Unity 白盒主线的一部分，只保留作历史参考。
   - 目标：当前产品主线应把表现层交给 Unity，Fate Engine 只输出 recipe、校验和导出数据。

2. **性能预算体系未固化**
   - 缺口：缺少帧时间预算（CPU/GPU）、draw call/材质/阴影距离等硬阈值与 CI 报告。
   - 目标：建立场景级性能预算校验，超预算自动标记 Warning/Error。

3. **可观测性不足**
   - 缺口：Profiler、Frame Debugger、GPU 计时采样尚未形成标准验收入口。
   - 目标：开发态可定位“哪一帧、哪个 pass、哪类积木”导致性能退化。

## C. 内容生产与工具链（真正“可生产”关键）

1. **导入-处理-发布流水线需完善**
   - 缺口：导入器、碰撞体自动生成、LOD/HLOD、压缩策略仍以最小验证为主。
   - 目标：资源从 DCC 到可运行包具备可复现、可回滚、可追溯流水线。

2. **积木生态规模不足**
   - 缺口：当前高频积木数量有限，且复杂组合模板覆盖不足。
   - 目标：补齐 L1 高频积木 + L2 复合模板（小屋/仓库/区域）并附自动测试。

3. **校验器深度不够**
   - 缺口：虽有基础校验，但预算、可达性、禁用冲突等规则还需扩大覆盖并沉淀误报治理。
   - 目标：校验结果可定位、可解释、可批处理，且可直接作为发布门禁。

## D. 协议、兼容与发布治理（长期可维护性）

1. **协议演进治理**
   - 缺口：需要更严格的 schema 变更门禁（兼容性检查、变更审计、迁移文档强制化）。
   - 目标：协议升级可追踪、可回滚，不因隐式字段导致线上破坏。

2. **依赖与许可合规自动化**
   - 缺口：许可白名单虽有策略，但缺少持续化的依赖扫描与阻断。
   - 目标：第三方依赖引入自动校验许可证、来源与升级策略。

3. **版本发布与回滚体系**
   - 缺口：包级别回滚、弃用、兼容矩阵与变更公告流程仍需平台化。
   - 目标：形成“可灰度、可回滚、可审计”的包发布机制。

## E. 测试体系（当前最急需补课）

1. **测试分层不完整**
   - 缺口：缺少“单测→集成→场景验收→回放一致性→性能回归”统一测试金字塔。
   - 目标：每层都有固定命令入口、通过标准与失败归因模板。

2. **跨平台/跨机一致性验证不足**
   - 缺口：不同 OS、不同显卡/驱动组合下的结果一致性矩阵未成型。
   - 目标：至少覆盖核心平台的 smoke + deterministic 回放。

3. **可视化回归能力不足**
   - 缺口：缺少截图/视频基线对比与关键交互回归（如门碰撞、触发区边界）。
   - 目标：建立场景截图金标与偏差阈值，支持 CI 自动比对。

## F. 进入“可试生产”前的最小门槛（建议 Gate）

1. `schema + runtime + editor + cpp` 全链路命令连续通过，并纳入 CI 必跑。
2. 至少 3 个复合场景模板（非单 Door）可稳定回放并通过批量校验。
3. 建立性能预算基线（目标机型）并连续两周无 P1 回归。
4. 发布/回滚演练完成（含 lockfile、依赖冲突、兼容回退）。
5. 文档、测试、发布门禁三者一致（禁止“文档说有，命令跑不通”）。

> 结论：当前阶段可用于“原型验证与流程打样”，若要进入生产可用 3D 环境，优先级应是“测试体系 + 可观测性 + 资源流水线 + 发布治理”，而不是先追求高阶渲染特效。


### 历史渲染后端测试说明
> 统一准入口径见 `docs/Editor3DTestReadiness.md`（视觉/性能项）；本节仅保留历史排障记录，不再作为 Unity 主线门槛。
1. 过去曾校验 `protocol/runtime/render_capabilities.json` 与 `fate_render_probe` 的模拟后端链路。
2. 过去曾使用 `make check-render-backend-init` 和 `make check-render-matrix` 做双重校验。
3. 这些命令与 Unity 白盒主线无关，仅供理解旧实验路径时参考。

### 历史排障记录（可忽略）
1. 若提示缺少探测程序：执行 `cmake -S . -B build-render -DFATE_ENABLE_RENDER=ON && cmake --build build-render --target fate_render_probe`。
2. 若提示 `backend_unavailable=vulkan`：检查是否设置了 `FATE_RENDER_DISABLE_VULKAN_SIM=1`，并确认 `FATE_RENDER_ENABLE_VULKAN_SIM=ON`。
3. 若配置校验失败：检查 `fallback_chain` 是否非空、无重复、以 `none` 结尾，且所有后端值在允许枚举内。
