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
