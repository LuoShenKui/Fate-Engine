# Common Social-System Abstractions

`systems/common/` 不是各国规则的母版，而是从多个国家 / 地区实现中反向提炼出的共性。

原则：

> **先做真实国家实现，再抽 Common；不要先做 Common，再强迫现实世界适配它。**

例如先有：

- `systems/japan/school/`
- 未来的 `systems/us/school/`
- 未来的 `systems/china/school/`

当多个实现中反复出现相同概念时，再把稳定共性抽到 Common。

可能逐步抽出的共性包括：

- Institution
- Role
- Permission
- Responsibility
- Jurisdiction
- Schedule
- Inventory
- Transaction
- Case / Record
- Approval
- Escalation
- Contract
- Domain Knowledge Binding

但法律、校历、医疗流程、警察权限、劳动制度、银行规则等国家差异内容继续留在各国目录。

`core/` 提供更底层的 Identity / Permission / Memory / Relationship / Causality 等世界原语；`systems/common/` 只放已经从多个真实社会模板中验证过的制度共性。
