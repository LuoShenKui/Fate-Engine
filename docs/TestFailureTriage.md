# Test Failure Triage（分层失败归因）

本文档用于统一记录分层测试失败后的归因信息，确保排障路径一致、可复现、可追责。

## 归因模板

> 建议直接复制以下模板到 issue/PR 评论中填写。

```md
### 失败层级
- Layer: <check-unit | check-integration | check-replay | check-visual | check-perf>
- Milestone(可选): <check-m1 | check-m2 | check-m3>

### 复现命令
- Command: `<完整命令>`
- Commit: `<git rev-parse --short HEAD>`
- Environment: `<OS/Compiler/Node/Rust/Python>`

### 关键日志字段
- request_id: `<value or N/A>`
- frame_id: `<value or N/A>`
- render_pass: `<value or N/A>`
- brick_type: `<value or N/A>`
- brick_id: `<value or N/A>`
- cpu_frame_ms: `<value or N/A>`
- gpu_frame_ms: `<value or N/A>`
- draw_calls: `<value or N/A>`
- material_count: `<value or N/A>`
- seed: `<value or N/A>`
- lockfile_hash: `<value or N/A>`

### 责任模块
- Owner: <schema | runtime | editor | release>
- Evidence:
  - `<关键日志片段或报错摘要 1>`
  - `<关键日志片段或报错摘要 2>`

### 结论与后续动作
- Root cause: `<一句话根因>`
- Next action: `<修复动作 + 负责人 + 截止时间>`
```

## 分层与责任模块默认映射

- `check-unit`
  - 主责任：`schema` / `runtime`
  - 常见症状：schema 校验失败、Rust 单测失败
- `check-integration`
  - 主责任：`editor` / `runtime`
  - 常见症状：TS typecheck/build 失败、协议适配字段不一致
- `check-replay`
  - 主责任：`release` / `runtime`
  - 常见症状：seed/recipe/lockfile 结果不一致、产物 hash 漂移
- `check-visual`
  - 主责任：`editor` / `release`
  - 常见症状：截图基线不一致、页面空白或元素缺失
- `check-perf`
  - 主责任：`runtime` / `release`
  - 常见症状：性能预算超阈值、构建链路退化

## 推荐最小采样字段

无论哪一层失败，日志中至少保留以下字段，便于跨模块协作：

- `request_id`
- `brick_id`
- `seed`
- `lockfile hash`

如某层当前未产生某字段，请填写 `N/A`，不得留空。
