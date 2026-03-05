# Door Parity Checklist

> **单一基线**：Door 行为一致性以本文档为准。
> 变更流程：后续每次调整 Door 行为时，先更新本清单，再同步 Rust Runtime / Protocol Schema / Editor Demo，避免隐式分叉。

## 1) 必须一致字段（DoorState）

- `enabled: bool`（是否允许交互）
- `locked: bool`（是否拒绝交互并返回 `OnDenied`）
- `open: bool`（交互成功后翻转）
- `has_collision: bool`（校验缺失时上报 Error）
- `has_trigger: bool`（校验缺失时上报 Error）

## 2) 事件常量（命名规范 + 必须一致值）

- 命名规范：常量名使用 `ON_<UPPER_SNAKE_CASE>`，事件值使用 `PascalCase`。
- `ON_SPAWN = "OnSpawn"`
- `ON_ENABLE = "OnEnable"`
- `ON_DISABLE = "OnDisable"`
- `ON_DESTROY = "OnDestroy"`
- `ON_USED = "OnUsed"`
- `ON_DENIED = "OnDenied"`
- `ON_STATE_CHANGED = "OnStateChanged"`
- `ON_VALIDATE = "OnValidate"`
- `ON_TICK_LOW_FREQ = "OnTickLowFreq"`

## 3) Validate 错误码（命名规范 + 必须一致级别）

- 命名规范：错误码使用 `UPPER_SNAKE_CASE`，级别仅允许 `Error` / `Warning`。
- `MISSING_COLLISION`（Error）
- `MISSING_TRIGGER`（Error）
- `LOCKED_DEFAULT`（Warning）

## 4) 期望 payload 格式

### `door.interact.request`

```json
{
  "protocol_version": "1.0",
  "type": "door.interact.request",
  "request_id": "<non-empty-string>",
  "payload": {
    "actor_id": "<non-empty-string>"
  }
}
```

### `door.interact.response`（成功）

```json
{
  "protocol_version": "1.0",
  "type": "door.interact.response",
  "request_id": "<same-as-request>",
  "payload": {
    "event": "<OnUsed|OnDenied|...>",
    "payload": "<string>"
  }
}
```

### `door.interact.response`（错误）

```json
{
  "protocol_version": "1.0",
  "type": "door.interact.response",
  "request_id": "<same-as-request>",
  "payload": {},
  "error": {
    "code": "<INVALID_PROTOCOL_VERSION|INVALID_REQUEST_TYPE|INVALID_REQUEST_PAYLOAD|...>",
    "message": "<string>",
    "details": {}
  }
}
```

## 5) 门逻辑验收脚本（Demo 彩排 / 回归）

### 准备

1. 打开编辑器，确认工具栏出现 `适配器模式` 按钮。
2. 初始模式切到 `demo`，并确认默认节点为 `door-1`。

### 操作步骤与预期

1. **点击 `交互`**
   - 预期：业务校验区出现 `OnUsed` 事件信息，日志包含统一格式：`[door_event] mode=demo request_id=req-* event=OnUsed`。
2. **点击 `切换锁定` 后再点击 `交互`**
   - 预期：业务校验区出现 `OnDenied` 事件，`payload` 含 `reason=locked`。
   - 预期：业务校验项可看到定位信息：`[brick=door node=door-1 slot=mesh]`。
3. **切换适配器模式到 `runtime` 后再次点击 `交互`**
   - 预期：业务事件日志中的 `mode` 变为 `runtime`，`request_id` 递增且可追踪。
4. **构造协议错误（如传非法 JSON 或缺失 actor_id）**
   - 预期：协议校验区显示错误，包含 `request_id` 与定位信息：`[brick=door node=door-1 slot=mesh]`。

### 通过标准

- `OnUsed` / `OnDenied` / `OnStateChanged` 均输出统一日志格式。
- 协议错误与业务校验结果在面板中分区显示。
- 关键日志均可按 `request_id` 串联排查。
