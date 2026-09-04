# Character System

Character System 是 Fate Engine 的统一人物系统。

核心原则：

> **只有一种 Character 数据模型，通过不同 Simulation Level 决定模拟深度。**

不要为主要角色、配角、背景角色建立三套独立人物类。

## Character Model

一个 Character 可以组合以下状态：

- Identity：身份与社会位置
- Personality：人格、气质、行为倾向
- Needs：当前需求
- Goals：短期与长期目标
- Memory：经历过什么
- Relationships：与其他角色的关系
- Resources：资产、物品、金钱、社会资源
- Schedule：日常生活与时间安排
- Beliefs：价值观、立场、对世界的理解
- Fate：与关键人物和事件的命运关系
- SimulationLevel：Main / Supporting / Background

其中 Identity / Memory / Relationship / Fate 等底层能力继续由 `core/` 提供，Needs / Schedule / Behavior 等运行逻辑继续由 `simulation/` 提供；Character System 负责把它们组合成一个完整的人物。

## Simulation Levels

### Main

主要角色使用最高模拟深度。

重点保留：

- 完整人格
- 价值观与道德边界
- 长短期目标
- 重要记忆与长期记忆
- 关系网络
- 秘密
- 资产
- 技能
- 情绪
- 日程
- Fate Link
- 关键剧情节点

### Supporting

配角保留影响行为的核心信息：

- 人格标签
- 职业 / 身份
- 主要关系
- 当前目标
- 重要记忆
- 资产
- 日程
- 少量长期目标

### Background

背景角色只维持最低必要状态：

- 身份
- 职业
- 位置
- 日程
- 基础需求
- 基础人格
- 家庭 / 组织归属
- 经济状态
- 当前行为

背景角色默认不需要持续调用 AI。

## Dynamic Promotion / Demotion

Simulation Level 不是永久身份。

例如：

```text
便利店店员
Background
   ↓ 玩家长期互动 / 产生重大关系
Supporting
   ↓ 卷入关键命运与主线
Main
```

反向也允许降级，以控制模拟成本。

升级时，系统应基于已有事实、关系、记忆、社会身份和世界模板补全更高层所需信息，不能凭空重写已经成立的设定。

## Character Evolution

人物设定分成两类。

相对稳定：

- 出生背景
- 早期经历
- 基础人格
- 核心价值观

可被事件持续改变：

- 信任
- 恐惧
- 目标
- 立场
- 财富
- 职业
- 身份
- 创伤
- 习惯
- 技能
- 对世界的认知
- 关系

原则：

> **事件改变人物，人物再基于改变后的自己做新的决定。**
