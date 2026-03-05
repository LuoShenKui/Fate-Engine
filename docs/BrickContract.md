Fate Engine Brick Contract v0.1（规范稿）
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

11) “固定春天，禁用天气”示例语义（契约保证能做）

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