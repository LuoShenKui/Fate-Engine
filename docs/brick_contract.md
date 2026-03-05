# Fate Engine 积木契约规范 v0

## 1. 统一输入事件
- `Interact(actor_id)`：触发交互。
- `Enable(enabled)`：启用/禁用积木。
- `SetState(key, value)`：外部修改状态。

## 2. 统一输出事件
- `OnUsed(actor_id)`：交互成功。
- `OnDenied(reason)`：交互失败。
- `OnStateChanged(key, value)`：状态变化。

## 3. 状态约束
- 所有状态必须可序列化为 JSON。
- 状态字段必须在 manifest 参数表中有默认值。

## 4. 最小参数约束
- 必填参数：`id`、`enabled`。
- 积木私有参数通过 `params` 声明，支持默认值与必填标记。
