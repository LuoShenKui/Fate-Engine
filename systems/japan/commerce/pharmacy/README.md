# Japanese Pharmacy / Drugstore System

日本药店 / 药妆店规则模板。

这个系统不仅需要库存、收银和班次，还要有角色的专业知识与权限边界。

## Character + Role + Knowledge

典型角色可能包括：

- 普通店员
- 注册销售人员
- 药剂师
- 店长
- 实习生 / 打工学生

角色实际行为由以下信息共同决定：

Character
+ Job Role
+ Qualification
+ Experience
+ Domain Knowledge
+ Store Rules
+ Current Inventory
+ Customer Context
+ World State

AI 负责在这些边界内进行对话、判断和交流，而不是凭空获得无限权限。

例如玩家询问药品时，系统应根据店员身份决定其能提供什么层级的信息；如果玩家本身是药学相关学生或专业人士，双方可以进入更深入的专业对话。

后续需要覆盖：

- 药品 / 商品库存
- 商品分类
- 专业资格
- 咨询
- 收银
- 补货
- 处方相关边界
- 营业时间
- 班次
- 顾客健康需求
- 与 Hospital / Clinic / Insurance 等系统的联动
