## 变更说明

- 

## Readiness Checklist

- [ ] 功能（`make check-m1`）
- [ ] 稳定性（`make check-m2`）
- [ ] 视觉（`make check-visual`）
- [ ] 性能（`make check-perf-scenes`）
- [ ] 回放一致性（`make check-m3`）

## 自检清单

- [ ] 已运行必要的构建/测试并通过。
- [ ] 若本次修改涉及 Door 行为（事件、状态语义、校验规则），已同步更新：
  - `docs/DoorParityChecklist.md`
  - `editor/app/src/domain/door.ts`
  - `runtime/door_core/src/lib.rs`
  - `tools/check_door_parity.py`（如需新增/调整一致性检查规则）
