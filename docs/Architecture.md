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
│  ├─ brick/
│  ├─ school/
│  ├─ police/
│  ├─ justice/
│  ├─ hospital/
│  ├─ company/
│  ├─ family/
│  ├─ economy/
│  ├─ commerce/
│  ├─ housing/
│  ├─ transport/
│  └─ organization/
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

## 5. Brick 的新位置

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

## 6. Style 独立

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

## 7. World Build Pipeline

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

## 8. Engine Adapter 边界

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

## 9. 第一阶段建议验证

先做一个无画面的校园世界：

1. World Time；
2. Identity + Permission；
3. Relationship + Memory；
4. School System；
5. Causality；
6. Fate；
7. World Will；
8. 100 个 NPC Schedule + Simulation LOD；
9. Scenario Tests：打架、处分、开除、住院、错过关键事件、世界意志修正、Fate Sever。

只有这套逻辑能稳定独立运行后，再让 Unity 把它表现出来。
