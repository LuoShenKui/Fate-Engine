# Editor 3D Test Readiness Checklist

> 本清单是 Editor 3D 场景准入的**唯一事实来源（SSOT）**。`README.md`、`docs/Target.md`、`docs/ForestCabinDemo.md` 中涉及准入口径的内容均应引用本文件，不再重复维护阈值细节。

## 使用规则
- 每个准入项必须绑定唯一命令入口。
- 判定通过时必须同时满足：命令退出码为 `0` + 报告关键词/字段命中。
- 若需临时例外，必须在 PR 中记录原因、影响范围与回滚计划。

## 准入项定义（功能 / 稳定性 / 视觉 / 性能 / 回放一致性）

| 准入项 | 命令入口（唯一） | 通过阈值（关键词/字段） | 产出物 |
| --- | --- | --- | --- |
| 功能（Functional） | `make check-m1` | 输出包含 `OnUsed` 与 `OnDenied`，并标记 M1 通过（示例：`check-m1 passed`）。 | 命令日志 |
| 稳定性（Stability） | `make check-m2` | 输出包含 `door_scene_acceptance_flow_cover_trigger_lock_and_collision ... ok` 与 `trigger_zone_runtime_interact_and_validate_work ... ok`。 | 命令日志 |
| 视觉（Visual） | `make check-visual` | 自动模式：输出包含 `visual baseline passed`（或同等成功标识）。手工兜底模式：按 `docs/ScreenshotOperation.md` 产出并登记截图基线。 | 基线比对日志 / 截图 |
| 性能（Performance） | `make check-perf-scenes` | 结构化报告（`artifacts/perf/*.json`）中无 `severity=error`；允许 `warning` 但需在 PR 说明。 | `artifacts/perf/*.json` |
| 回放一致性（Replay Determinism） | `make check-m3` | 输出包含 `replay determinism check passed`（或同等成功标识），且 lockfile/recipe/seed 一致性校验通过。 | 命令日志 |

## 里程碑映射（对齐 Target）
- M1：功能 + 视觉（主入口：`make check-m1`）。
- M2：稳定性（主入口：`make check-m2`）。
- M3：回放一致性（主入口：`make check-m3`）。

## PR / 发布流程要求
- PR 模板或发布流程必须包含“Readiness Checklist”勾选：
  - [ ] 功能（`make check-m1`）
  - [ ] 稳定性（`make check-m2`）
  - [ ] 视觉（`make check-visual`）
  - [ ] 性能（`make check-perf-scenes`）
  - [ ] 回放一致性（`make check-m3`）
