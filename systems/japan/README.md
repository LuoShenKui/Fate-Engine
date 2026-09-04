# Japan World Rules Index

这是 Fate Engine 的日本现代社会规则库索引。

目录采用 **国家 / 地区优先**：

`systems/japan/<system>/`

因为学校、警察、医疗、劳动、住房、银行、商业等制度都高度依赖国家和地区环境。

## 第一批系统

- School / High School: `systems/japan/school/`
- Family: `systems/japan/family/`
- Police: `systems/japan/police/`
- Convenience Store: `systems/japan/commerce/convenience_store/`
- Pharmacy / Drugstore: `systems/japan/commerce/pharmacy/`
- Restaurant: `systems/japan/commerce/restaurant/`
- Hospital: `systems/japan/hospital/`
- Company: `systems/japan/company/`
- Rail / Train: `systems/japan/transport/rail/`
- Rental Housing: `systems/japan/housing/rental/`
- Banking: `systems/japan/economy/banking/`
- Court: `systems/japan/justice/court/`
- Club / Association: `systems/japan/organization/club/`

## Country First, Common Later

先把日本社会系统做具体。

未来有美国、中国等实现后，再把多个国家都稳定存在的制度共性提炼到：

`systems/common/`

Common 不是日本系统的父类，也不是现实制度的预设答案。

## Character + Setting + Domain Knowledge + AI

社会系统最终不是一堆静态规则，而是让真实人物生活在制度里。

角色运行时至少可以由：

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
```

共同决定。

AI 负责：

- 在角色已有知识和权限范围内理解情况；
- 选择合理行动；
- 与玩家或 NPC 对话；
- 解释、协商、拒绝、求助、上报；
- 根据关系和经历表现不同态度。

Engine / System 负责：

- 什么事实成立；
- 谁拥有什么身份与资格；
- 谁拥有什么权限；
- 当前有哪些商品、药品、资金、床位、座位等真实资源；
- 制度流程与因果后果；
- 角色能访问哪些专业知识。

例如药店店员不是“套一段店员 Prompt”。

一个有资格、有经验的角色应能访问相应药品知识；普通兼职店员只能访问自己受训和被允许的范围。玩家如果是药学学生，其 Character Knowledge 也会影响双方对话深度。

目标是：

> **人物真的活在制度里，而不是 AI 假装自己在扮演一个职业。**

原则：先建立可复用制度骨架，再逐步补权限、状态、职业知识、事件、流程和因果闭环。
