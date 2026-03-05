# Runtime 长稳崩溃归档规范

适用范围：`tools/check_runtime_soak.py` 触发失败（运行失败、错误计数超限、内存超阈值）时的自动归档。

## 归档目录

默认写入：`artifacts/crash/runtime_soak_<UTC时间戳>/`

## 最小归档内容（必须具备）

1. `stderr.log`：进程标准错误输出。
2. `backtrace.log`：包含 backtrace 的错误输出副本（脚本默认设置 `RUST_BACKTRACE=1`）。
3. `recipe.json`：本次运行输入 recipe（若路径存在则复制）。
4. `lockfile.json`：本次运行输入 lockfile（若路径存在则复制）。
5. `run_params.json`：运行参数与时间戳，至少包括：
   - `timestamp_utc`
   - `profile`
   - `duration_seconds`
   - `seed`
   - `recipe`
   - `lockfile`
   - `command`

补充：脚本还会落盘 `stdout.log` 方便排查输出截断问题。

## 使用建议

- 夜间任务失败后，直接打包对应时间戳目录交付排障。
- 若需复现，优先使用 `run_params.json` 中的命令和输入文件重放。
