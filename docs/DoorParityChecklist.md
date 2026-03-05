# Door Parity Checklist

> 基线来源：`protocol/schemas/*.json` 与 `runtime/door_core/src/lib.rs`。
> 变更流程：后续每次调整 Door 行为时，先更新本清单，再同步 Rust Runtime / Protocol Schema / Editor Demo，避免隐式分叉。

## 1) 状态字段（DoorState）

- `enabled: bool`
- `locked: bool`
- `open: bool`
- `has_collision: bool`
- `has_trigger: bool`

## 2) 事件常量（runtime/door_core::events）

- `ON_SPAWN = "OnSpawn"`
- `ON_ENABLE = "OnEnable"`
- `ON_DISABLE = "OnDisable"`
- `ON_DESTROY = "OnDestroy"`
- `ON_USED = "OnUsed"`
- `ON_DENIED = "OnDenied"`
- `ON_STATE_CHANGED = "OnStateChanged"`
- `ON_VALIDATE = "OnValidate"`
- `ON_TICK_LOW_FREQ = "OnTickLowFreq"`

## 3) validate 错误码（ValidationIssue.code）

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
