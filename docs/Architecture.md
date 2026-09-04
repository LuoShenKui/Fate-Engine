# Fate Engine Architecture

> 架构基线：2026-09-04

## 1. 定位

Fate Engine 的目标不是“提供更多固定剧情”，而是构建一个可以长期运行、允许玩家真正改变命运的世界。

底层持续推演：

```text
World State
+ Time
+ Social Rules
+ NPC State
+ Causality
+ Fate
+ World Will
=> Next World State
```

电影、动漫、小说等原作资料提供人物、地点、势力、规则、默认时间线与资产参考。AI 可以分析、补全并生成资产，但 World Kernel 必须能够脱离 AI、Unity 和画面独立运行。

## 2. 核心数据流

```text
Action
  -> State Change
  -> Causal Consequence
  -> Fate Evaluation
  -> World-Will Evaluation
  -> New World State
```

### Causality

所有重要行为都必须留下可追踪后果。

例如：

```text
玩家让关键人物住院
-> 人物缺席学校
-> 无法参加事件
-> 默认命运节点失去成立条件
-> World Will 尝试寻找合理的新窗口
```

### Fate

Fate 是世界真实数据结构，而不是剧情标签。

支持：

- 人物与人物之间的 Fate Link；
- 人物与关键事件之间的 Fate Link；
- 改写命运；
- 降低/增强命运强度；
- 高阶能力永久 Sever Fate。

### World Will

World Will 维护关键“剧情吸引子”，但必须遵守：

> 世界意志可以对抗偶然，不能对抗已经成立的充分因果。

玩家只造成小干扰时，关键节点可以合理延后、换地点或换条件；如果玩家真正拆除了因果链，原命运线必须允许死亡。

## 3. 目录结构

```text
fate-engine/
├─ core/
│  ├─ causality/{graph,event,resolver}
│  ├─ fate/{link,node,rewrite,sever}
│  ├─ world_will/{attractor,intervention,constraint}
│  ├─ time/
│  ├─ identity/
│  ├─ relationship/
│  ├─ memory/
│  ├─ permission/
│  └─ state/
│
├─ systems/
│  ├─ character/{model,templates/main,templates/supporting,templates/background,lod,evolution}
│  ├─ brick/
│  ├─ common/
│  └─ japan/
│     ├─ school/{calendar,academics,homeroom,lifecycle,events,clubs,governance,discipline,templates/high_school}
│     ├─ family/
│     ├─ police/
│     ├─ hospital/
│     ├─ company/
│     ├─ commerce/{convenience_store,pharmacy,restaurant}
│     ├─ transport/rail/
│     ├─ housing/rental/
│     ├─ economy/banking/
│     ├─ justice/court/
│     └─ organization/club/
│
├─ simulation/{npc,schedule,needs,behavior,population,lod}
├─ narrative/{event,timeline,condition,consequence,generator}
├─ world/
│  ├─ template/{modern_japan,modern_us,fantasy}
│  ├─ locations/
│  ├─ characters/
│  ├─ factions/
│  ├─ rules/
│  └─ bootstrap/
├─ style/{character,rendering,animation,camera,profiles}
├─ ai/{character_agent,dialogue,planning,world_builder,asset_generator,lore_parser}
├─ asset/{character,environment,animation,audio,manifest}
├─ pipeline/{ingest,analysis,generation,validation,assembly,export}
├─ runtime/{world_runtime,event_bus,scheduler,save,snapshot}
├─ adapters/{unity,unreal,custom_renderer}
├─ editor/
├─ protocol/
├─ unity/
├─ tools/{world_editor,fate_graph_editor,causality_debugger,npc_debugger,importer}
└─ tests/{core,systems,simulation,scenarios}
```

## 4. Systems 的定义

社会制度系统不是为了模拟每个现实微观细节，而是为了形成“现实常识闭环”。

例如 School System 应逐步拥有：

- 学生、教师、教务、校长等 Identity；
- Permission 和权力边界；
- 校规；
- 处分、停课、开除等流程；
- 学生历史记录；
- 家长、教师、同学关系；
- 对日程、声誉、关系和 Fate 的后续影响。

Police、Justice、Hospital、Company 等遵循同样原则。

### Country-First Social Systems

社会制度首先按国家 / 地区实现，因为学校、警察、医疗、劳动、住房、银行、法院和商业规则都高度依赖当地制度环境。

规范目录：

- `systems/japan/`
- 未来可以增加 `systems/us/`、`systems/china/` 等。
- `systems/common/` 不是父模板，而是在多个国家实现后提炼出的稳定共性。

抽象方向是：

```text
Japan School ─┐
US School    ─┼→ 反复验证共同概念 → systems/common/
China School ─┘
```

而不是：

```text
Common School
→ 强行覆盖 Japan / US / China
```

### Social-System Runtime Model

每个制度系统最终都由“人物 + 角色设定 + 专业知识 + 机构事实 + AI”共同运行。

```text
Character
+ Identity
+ Role
+ Qualification
+ Personality
+ Domain Knowledge
+ Institution Rules
+ Permissions
+ Schedule
+ Local World State
+ Memory
        ↓
AI Decision / Dialogue
        ↓
Action
        ↓
System Validation
        ↓
World State / Causality
```

AI 不应该只靠 Prompt 假装自己是某个职业。

例如日本药店：

- 普通兼职店员、注册销售人员、药剂师、店长拥有不同资格与知识范围；
- 角色能访问的药品知识由 Role / Qualification / Experience 决定；
- 当前库存、商品状态和店内规则来自真实 World State；
- 玩家如果本身是药学学生或专业人士，其 Character Knowledge 也参与对话上下文，因此双方可以进行更深入的专业交流。

Engine / System 负责硬事实、身份、资格、权限、库存、资金、时间和因果；AI 负责在这些边界内理解、判断、交流、协商和选择行动。

第一阶段允许大量制度细节继续以 Markdown 作为人类可读设定，由 AI 辅助理解；只有必须保证一致性的硬约束、交易和状态变化再逐步结构化。

### Japan World Rules Library

第一批日本现代社会模板已经建立骨架：

- `systems/japan/school/`：日本高中与校园制度
- `systems/japan/family/`：日本家庭
- `systems/japan/police/`：日本警察
- `systems/japan/commerce/convenience_store/`：便利店
- `systems/japan/commerce/pharmacy/`：药店 / 药妆店
- `systems/japan/commerce/restaurant/`：餐厅
- `systems/japan/hospital/`：医院
- `systems/japan/company/`：公司
- `systems/japan/transport/rail/`：铁路 / 电车
- `systems/japan/housing/rental/`：租房
- `systems/japan/economy/banking/`：银行
- `systems/japan/justice/court/`：法院
- `systems/japan/organization/club/`：校外社团 / 协会

这些系统共同遵循：

```text
人物 + 身份 + 角色 + 专业知识 + 权限 + 资源 + 时间 + 制度 + 事件
→ 行动 / 对话
→ 状态变化
→ 跨系统后果
→ Causality / Fate
```

第一阶段只建立制度边界和目录，不急着把全部规则结构化。后续逐个系统补权限、知识、流程、异常路径和跨系统联动。

### Japanese School System

第一套正式 School Template 放在 systems/japan/school/，先以日本高中为基准。

它不是若干剧情事件合集，而是由 Calendar 驱动的长期制度系统：

World Date / Time
→ National Holiday
→ School Calendar
→ Term / Vacation
→ Daily Timetable
→ Class / Homeroom / Club / Event
→ Attendance / Learning / Records
→ Character / Relationship / Causality Changes

第一阶段覆盖：

- 4 月到次年 3 月的学年循环；
- 三学期 / 两学期可配置；
- 节假日、周末、长假、临时停课与补课；
- 新生入学、新生欢迎、转学生介绍、升年级与毕业；
- 真正课堂、作业、考试、成绩和学习进度；
- Homeroom、座位、值日、班级委员；
- 学园祭、体育祭、修学旅行、健康诊断、避难训练；
- 学生社团、生徒会、教师与行政权限；
- 迟到、旷课、作弊、打架等纪律闭环。

所有具体活动日期由 School Profile 配置，不能把学园祭、体育祭等写成全国统一固定日期。

## 5. Character System

`systems/character/` 是统一人物系统，用于把 Core 与 Simulation 中的人物相关能力组合成一个完整 Character。

原则：

> **只有一种 Character 数据模型，通过 Simulation Level 控制模拟深度。**

Character 可以组合：

- Identity；
- Personality；
- Needs；
- Goals；
- Memory；
- Relationships；
- Resources；
- Schedule；
- Beliefs；
- Fate；
- SimulationLevel。

其中 Identity / Memory / Relationship / Fate 等基础能力由 `core/` 提供，Needs / Schedule / Behavior 等运行能力由 `simulation/` 提供。

### Simulation Level

三档模板：

- `Main`：主要角色，保留完整人格、价值观、长期目标、重要记忆、关系网、秘密、资产、技能、情绪、日程和 Fate Link。
- `Supporting`：配角，保留人格标签、身份、主要关系、当前目标、重要记忆、资产、日程和少量长期目标。
- `Background`：背景角色，只维持身份、职业、位置、日程、基础需求、基础人格、家庭/组织归属、经济状态和当前行为。

Simulation Level 可以动态变化：

```text
Background
   ↓ 玩家长期互动 / 产生重大关系
Supporting
   ↓ 卷入关键命运和主线
Main
```

也允许反向降级以控制模拟成本。

升级人物时只能基于已存在的事实、记忆、关系、社会身份和世界模板补全信息，不能覆盖已经成立的设定。

### Character Evolution

人物设定分为：

相对稳定：

- 出生背景；
- 早期经历；
- 基础人格；
- 核心价值观。

可被事件持续改变：

- 信任；
- 恐惧；
- 目标；
- 立场；
- 财富；
- 职业；
- 身份；
- 创伤；
- 习惯；
- 技能；
- 对世界的认知；
- 关系。

核心原则：

> **事件改变人物，人物再基于改变后的自己做新的决定。**

## 6. Brick 的新位置

Brick 只是 `systems/` 下的一个子系统。

它负责：

- 可安装、可组合交互构件；
- manifest、依赖、版本和 lockfile；
- 发布、升级、回滚；
- 编辑器装配；
- Unity-facing recipe/export。

它不负责：

- 世界因果真相；
- Fate 图；
- World Will；
- 世界时间；
- NPC 长期记忆；
- 社会制度本身。

## 7. Style 独立

同一个世界状态可以采用不同 Style Profile：

- anime；
- semi-realistic；
- realistic。

Style 可以控制：

- 头身比、眼睛比例、面部形体；
- Toon/PBR/SSS；
- 头发和眼睛材质；
- 表情夸张度；
- 动画风格；
- Camera language。

但不能改变角色身份、记忆、关系和 Fate。

## 8. World Build Pipeline

`pipeline/` 是世界生产流水线，负责把原作资料转成 Fate Engine 可以消费的世界、资产和 3D 场景。

典型流程：

```text
原片 / 设定集 / 设计稿 / 剧本
        ↓
      ingest
        ↓
     analysis
        ↓
    generation
        ↓
    validation
        ↓
     assembly
        ↓
      export
        ↓
Unity / 其他宿主
```

其中：

- `ai/` 提供解析、规划和生成能力；
- `pipeline/` 负责编排这些能力；
- `asset/` 保存标准化资产；
- `systems/brick/` 负责快速装配 3D 场景；
- `adapters/` 负责交给具体宿主。

Pipeline 的原则是：**每一步都有明确输入、明确输出、可独立重跑、可独立验证。** 不允许把“动画 → 世界”做成一个不可调试的大黑盒。

## 9. Engine Adapter 边界

第一阶段使用 Unity：

```text
World Kernel / Systems / Simulation
                |
            Adapter
                |
              Unity
                |
     Render / Physics / Animation / VR
```

以后更换 Unreal 或自研 Renderer，不应该要求重写 Core。

## 10. 第一阶段建议验证

先做一个无画面的校园世界：

1. World Time；
2. Character Model + Simulation Level；
3. Identity + Permission；
4. Relationship + Memory；
5. School System；
6. Causality；
7. Fate；
8. World Will；
9. 100 个 NPC Schedule + Simulation LOD；
10. Scenario Tests：打架、处分、开除、住院、错过关键事件、世界意志修正、Fate Sever。

只有这套逻辑能稳定独立运行后，再让 Unity 把它表现出来。
