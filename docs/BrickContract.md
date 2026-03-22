Fate Engine Brick Contract v0.1（规范稿）

0) 设计原则与当前范围
0.1 “标准化”不是把所有积木做成一样

这里的标准化目标，不是消灭差异，而是把原本分散、隐式、难复用的适配问题，收敛成固定且可描述的协议问题类型。

积木之间的高频问题，应优先归入以下统一类别：

- 空间适配问题
- 交互适配问题
- 状态适配问题
- 资源绑定问题
- 约束冲突问题

只有问题类型先固定，后续的参数化、校验、编辑器辅助和 AI 装配才有稳定入口。

0.2 “参数化”不是把一切都参数化

参数化的本质是：把高频微调项，从隐式代码修改，变成显式配置项。

协议只要求暴露高频、稳定、可验证的调节入口，不要求把所有内部实现细节都做成参数。

例如“门积木”的典型参数化入口可以包括：

- 安装朝向
- 门轴位置
- 开门角度
- 触发半径
- 交互方式
- 锁定条件
- 碰撞包围盒
- 动画资源引用

开发者应优先通过协议允许的入口调参，而不是反复拆 Prefab、改脚本、改碰撞体和改资源绑定。

0.3 微调标准化的六层结构

协议设计按六个固定层组织，避免每个积木各自定义“怎么调”。

1. 空间层

每个积木必须声明：

- 本地坐标原点
- 朝向基准
- 尺寸包围盒
- 安装锚点
- 交互锚点
- 特效锚点
- 导航阻挡区域
- 推荐放置面类型

2. 交互层

每个积木必须声明：

- 支持的交互模式枚举，例如靠近自动触发、按键触发、点击触发、进入区域触发、离开区域触发
- 交互条件接口，例如钥匙、任务状态、权限等级、电力状态
- 标准输出事件，例如 `OnOpen`、`OnClose`、`OnTriggered`、`OnFailed`、`OnCooldownBegin`

3. 状态层

每个积木必须声明：

- 状态集合
- 状态切换规则
- 可被外部改变的状态
- 状态变化时抛出的事件
- 状态持久化需求

4. 逻辑层

逻辑层标准化的重点，不是限制玩法，而是统一：

- 输入事件格式
- 输出事件格式
- 条件表达式格式
- 执行动作格式

5. 资源层

协议必须允许资源通过标准槽位绑定，而不是通过脚本硬编码绑定。典型槽位包括：

- `MeshSlot`
- `MaterialSlot`
- `AudioSlot_Open`
- `AudioSlot_Close`
- `VFXSlot_Triggered`
- `UISlot_InteractPrompt`

6. 约束层

协议必须显式声明装配约束，至少覆盖：

- 最小安装空间
- 允许安装表面类型
- 依赖模块类型
- 禁止共存模块类型
- 必须连接的输入输出口
- 可选连接口
- 最大支持绑定数量

0.4 当前协议实现边界

本规范当前先落“协议定义”，不直接落“全量实现”。

第一阶段只要求定义和验证高频公共语义，优先覆盖以下四类积木的子协议：

- 门
- 开关
- 区域触发器
- 灯

这四类积木之间至少要先把输入、输出、状态、参数和校验规则定义完整。未完成前，不应继续扩展更多玩法类型。

0.5 最小可行协议（MVP）

第一版协议最少包含以下七项：

1. 基础信息：`id`、`type`、`version`
2. 空间信息：`bounds`、`pivot`、`anchors`
3. 参数表：名称、类型、默认值、范围
4. 输入事件口：可接收事件
5. 输出事件口：可发出事件
6. 状态表：状态集合与初始状态
7. 校验规则：安装条件与连接条件

只要这七项能支撑“门-开关-区域触发器”闭环，就说明协议开始具备实际装配价值。

1) 版本与兼容性
1.1 协议版本

brick_contract_version = "0.1"

任何包必须声明其契约版本。

引擎必须声明支持的契约版本范围：min_supported / max_supported。

1.2 兼容规则（硬性）

MAJOR 变更：破坏兼容（字段语义变化、默认行为变化、事件/能力删除）

MINOR 变更：向后兼容扩展（新增字段、新增事件、新增能力 level）

任何新增字段必须有默认解释（未识别字段必须忽略，不得崩溃）。

2) Brick Package（包）必备元信息：manifest
2.1 顶层字段

id：稳定唯一（推荐反向域名风格 com.fate.brick.forest.conifer）

version：SemVer

contract_version：固定 "0.1"

engine_compat：支持的引擎版本范围

license：包的许可证标识（开源/商用声明）

authors：作者信息（可选）

dependencies[]：依赖包列表（id + version range + optional）

补充要求：基础身份信息至少还应可追踪以下元数据，用于升级、协作和兼容治理：

- name：展示名称
- category：积木分类
- authors：作者信息
- protocol_compat：兼容的协议版本范围

其中 `id`、`version`、`contract_version` 依旧属于硬性字段。

2.2 能力声明：capabilities[]

每个 capability 必须含：

capability_id：稳定字符串（点分层级）

level：整数（0..n），0 表示不提供

dependencies[]：依赖的 capability_id（可选）

degrade_to：禁用/低配时降级目标（可选）

exposed_params[]：该能力暴露的参数键集合（用于 UI/AI）

约束：能力 ID 必须稳定、不可随意改名；改名视为 MAJOR。

3) Parameters（参数）规范：params + schema
3.1 参数声明（每个参数必须）

key：例如 weather.enabled

type：bool|int|float|string|enum|curve|color|asset_ref|tag_set|map

default：默认值

range：可选（min/max/enum_values）

mutability：

static（仅编辑器/生成阶段可改）

runtime（运行时可改）

locked（只能被 policy 覆写）

visibility：basic|advanced|internal

impact：performance|visual|gameplay|storage|network（可多选）

requires：表达式（例如 cap(Environment.Weather)>=1 && param(weather.enabled)==true）

doc：说明文本（可选）

编辑器与 AI 侧补充要求：

- required：是否必填
- editor_widget：编辑器展示方式
- runtime_mutable：是否允许运行时修改
- group：参数分组

如果字段语义已由 `mutability` 覆盖，可以在序列化时归并，但契约层必须有等价表达。

3.2 参数覆写（必须支持）

覆写来源与优先级（从高到低）：

Project Policy

Scene Override

Brick Instance Override

Brick Default

覆写操作（必须支持）：

set(key, value)

clamp(key, min, max)

reset(key)（回退到下层默认）

lock(key)（禁止下层再改）

4) Slots（资源插槽）规范
4.1 Slot 必备字段

slot_id：如 sfx.ambient, mesh.primary

slot_type：mesh|material|texture|audio|anim|vfx|curve|script_ref

fallback：缺失时使用的默认资源或“无资源策略”

optional：bool（默认 false）

requires：表达式（同参数 requires）

4.2 Slot 覆写

Slot 允许同参数一样被 Policy/Scene/Instance 覆写：set(slot_id, asset_ref)。

5) State（状态）规范：可存档、可分区、可升级
5.1 状态分类

config_state：由参数/覆写计算得出，可重建

runtime_state：运行时状态（可存档）

cache_state：缓存（默认不存档，可重建）

5.2 必备要求

所有 runtime_state 字段必须在 schema 中声明并有默认值

必须提供 state_version 与迁移规则（至少支持从上一个版本迁移）

单机开放世界必须支持 分区存档（state 关联 chunk_id）

6) Events（事件）规范：组合与扩展的统一接口
6.1 事件声明字段

name：如 OnInteract, OnEnterZone

payload_schema

scope：entity|scene|global

ordering：ordered|unordered

reliability：best_effort|guaranteed

6.2 必备事件（所有砖至少支持）

生命周期：OnSpawn, OnEnable, OnDisable, OnDespawn

校验：OnValidate

交互：OnInteract（可空实现，但必须存在）

低频 tick：OnTickLowFreq（用于避免每帧决策）

7) Logic Graph（白盒逻辑图）规范
7.1 节点类型（必须支持最小集合）

Event（事件源）

Condition（条件）

Action（动作）

Gate（开关门：由 feature/param 控制）

Timer（定时）

Sequence（顺序）

Selector（选择）

RandomWeighted（权重随机）

EmitEvent（发事件）

7.2 动作的边界（硬性）

Logic Graph 不得直接：

访问渲染后端细节

进行任意文件 IO

进行任意网络请求
只能通过受控 Action 集合（可审计）：

SetState(key,value)

SetParam(key,value)（仅允许 mutability=runtime 的参数）

PlaySfx(slot)

SpawnChild(brick_id, params...)

EnableCapability(cap_id) / DisableCapability(cap_id)（受 policy 限制）

RequestValidation()

8) Logic Patch（快速改逻辑）规范：三种层级

你要“快速改逻辑”，又要保持生态可维护，必须限定 patch 的表达能力。

8.1 Patch 类型

Param-only：只改参数（最常用）

Graph Patch：局部改图

Graph Replace：整图替换（高阶）

8.2 Graph Patch 支持的原子操作（必须）

insert_gate(before_node, gate_condition)

replace_node(node_id, new_node_def)

remove_node(node_id)（必须保证图仍连通，否则校验 Error）

override_weight(random_node_id, item_id, new_weight)

disable_subgraph(tag)（按 tag 批量禁用）

8.3 Patch 优先级

同参数一样：
Project Policy > Scene > Instance > Default

9) Feature 禁用 / 降级 / 强制流程（你最关心）

当用户禁用某能力或强制某参数（如固定春天）时，引擎必须执行如下流程：

9.1 解析阶段（Resolve）

合并所有覆写（参数+slot+capability）

生成最终 config_state（Resolved Config）

9.2 依赖分析（Dependency Closure）

如果禁用 Environment.Weather，必须计算所有依赖它的 capability/节点/参数。

若存在“硬依赖且无 degrade_to”，输出 Error（积木不可用）。

若有 degrade_to，进入降级路径。

9.3 降级执行（Degrade）

将能力降到 degrade_to 指定目标（例如 NoWeather）

自动应用必要的参数修正（例如 weather.enabled=false）

自动应用必要的 graph patch（例如 disable 天气循环 subgraph）

9.4 校验（Validate）

运行包自带校验规则 + 引擎通用规则

输出结构化报告（见第 10 节）

若 Error：禁止进入运行时；若 Warning：允许但提示

10) Validator（校验器）输出格式（硬性）
10.1 报告结构

severity：Error|Warning|Info

code：稳定错误码（用于自动化处理）

message：人类可读

location：

brick_id

entity_id（可选）

param_key / slot_id / node_id（可选）

suggested_fix[]（可选）：

type：set_param|set_slot|disable_capability|apply_patch

payload：具体建议动作

10.2 最小必备校验类别

缺参数/缺 slot（Error）

requires 条件不满足（Error/Warning）

patch 导致图不连通（Error）

能力依赖不满足且无法降级（Error）

预算超限（Warning）

补充要求：校验规则需要按阶段划分，至少包括：

- 安装前校验
- 连接前校验
- 运行时校验
- 冲突检测
- 缺失依赖处理

典型错误示例包括：

- 门后摆动空间不足
- 触发区穿墙
- 陷阱未贴合地面
- NPC 站位落在不可导航区域
- 两个模块占用同一逻辑通道
- 一个开关同时绑定互斥门状态

11) Type、Condition、Action、Persistence、Editor 补充约束
11.1 类型定义

不同类型积木的必填字段不同，契约不能只靠单一扁平 schema。至少需要支持以下类型族：

- 场景结构类
- 交互类
- 触发器类
- 角色类
- 武器类
- UI 类
- 逻辑控制类
- 任务类

11.2 条件系统

条件表达式必须协议化，避免每个积木自行发明判断语法。典型条件来源包括：

- 权限检查
- 任务检查
- 道具检查
- 队伍状态检查
- 冷却时间检查

11.3 标准动作库

行为层应优先使用可审计的标准动作库，例如：

- 播放动画
- 切换状态
- 开启或关闭碰撞
- 发射投射物
- 造成伤害
- 播放音效
- 生成 UI 提示

11.4 序列化与持久化

契约必须明确：

- 哪些参数需要存档
- 哪些状态需要同步
- 哪些字段仅属于本地表现
- 哪些变化需要广播

否则多人联机、存档恢复、编辑器回放都无法稳定工作。

11.5 编辑器元数据

契约必须允许编辑器消费以下元数据：

- 分类显示
- 参数分组
- 默认预览图
- 可视化 Gizmo 定义
- 面板布局
- 拖拽安装辅助规则

12) 协议化积木的判定标准

一个积木若无法完整回答以下问题，就仍然更接近“资源包”而不是“协议模块”：

1. 放置时，原点和朝向怎么定义？
2. 允许用户调整哪些参数？
3. 接受哪些输入？
4. 会发出哪些输出？
5. 有哪些状态？
6. 依赖什么前置条件？
7. 和别的积木冲突时怎么检测？
8. 哪些数据要存档或同步？
9. 可视化调节入口在哪里？
10. 不满足条件时，如何失败并反馈？

13) “固定春天，禁用天气”示例语义（契约保证能做）

若森林包有：

cap(Environment.Weather)=2

cap(Environment.Season)=2

并且声明 Environment.Weather.degrade_to = Environment.Weather.Static 或 NoWeather

项目策略可做：

disable capability: Environment.Weather

set param: season.mode = "fixed"

set param: season.fixed_value = "spring"

引擎必须保证：

天气子图被禁用或 gate 掉

季节固定生效（材质/散布可依据固定季节选择）

包仍可运行（除非作者未提供降级路径）
