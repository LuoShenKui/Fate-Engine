# Fate-Engine

最小可运行原型（第一步）：
- 定义积木契约（`docs/BrickContract.md`）
- 定义 Door 积木包（`packages/door/manifest.json`）
- 提供 Door 交互逻辑与最小校验器
- 提供可运行 C++ demo
- 新增 Rust 核心库（`runtime/door_core`）与 TS 最小 UI（`editor/app/`）并行验证链路

## 当前能力边界
- 当前仓库定位是**原型验证阶段**，目标是先打通契约、交互、校验与构建链路。
- 渲染能力层默认关闭（`backend=none`，`FATE_ENABLE_RENDER=OFF`），该开关仅表示工程能力矩阵与编译路径，不代表画质功能已开启。
- 当前可证明：Door 相关的 schema/runtime/editor/cpp 最小链路可运行。
- 当前不等于：真实 3D 场景下的完整联调已完成（包括美术资产质量、复杂物理、全链路性能与多机协同）。
- 因此里程碑验收以“可机检命令 + 可复现输出”为主，而不是口头或单次手工演示。

## 新目录职责说明
- `runtime/`：运行时相关核心模块（当前包含 `door_core` Rust crate）。
- `editor/`：编辑器相关应用与前端工程（当前 `editor/app`）。
- `protocol/`：协议层定义与契约文件预留目录。
- `packages/`：可分发积木包（当前包含 `door`，保留 `manifest/demo/tests` 结构）。
- `tools/`：工程工具脚本与辅助程序预留目录。
- `render/`：渲染模块预留目录（可选启用）。


## 协议开发流程（重要）
1. **先修改 `protocol/schemas/*.json`**，明确协议契约。
2. 运行 `python3 tools/validate_schemas.py`，确保 schema 基础校验通过。
3. 再修改 Runtime 与 Editor 的编解码适配层实现。
4. 提交前检查新增错误文案是否为英文。

## 语言策略（Language Policy）
- 支持中文与英文文档/讨论。
- 默认开发流程、协议字段、日志与错误信息使用英文。
- 对外接口（schema/event/error code）优先使用英文稳定标识。

具体约束：
1. 新增 error message 默认使用英文；中文说明可放在文档或注释层。
2. 新增 schema 字段名、event 名、error code 必须使用英文且保持向后兼容。
3. 新增运行时日志默认英文，面向中文读者的解释写入 README/docs，不直接替换协议或错误文本。

说明：仓库中已有 C++/TS demo 的中文错误字符串等历史示例，可逐步迁移，不要求一次性全改。

## C++ Demo 构建与运行
```bash
cmake -S . -B build
cmake --build build
./build/fate_demo

# 可选：仅启用 render 占位模块（默认关闭）
cmake -S . -B build-render -DFATE_ENABLE_RENDER=ON
cmake --build build-render
```

## 如何测试
```bash
make check

# 渲染能力矩阵（配置合法性 + fallback 收敛）
make check-render-matrix
```

分层门禁入口（与 CI 对齐）：

```bash
# L1: 协议/schema + runtime 单元
make check-unit

# L2: runtime + editor 协议适配
make check-integration

# L3: seed/recipe/lockfile 回放一致性
make check-replay

# L4: 截图基线比对（按文档流程执行）
make check-visual

# L5: 多场景性能预算门禁
make check-perf-scenes
```

通过标准：

性能预算准入与例外流程：
- `Warning`：不阻断 CI，但必须在周报登记并指派负责人跟踪。
- `Error`：阻断 CI，修复后方可合入。
- 例外：如需临时放行，必须在 PR 中说明原因、影响范围、回滚/修复计划，并在后续 PR 清理例外。
- `check-unit`：Schema 校验与 Rust 单元测试均返回 0。
- `check-integration`：TS 类型检查与构建返回 0。
- `check-replay`：只读执行 replay 一致性校验（recipe/seed/lockfile），不写发布产物。
- `check-visual`：优先执行自动截图基线比对；若环境未安装 `playwright` 则会跳过自动比对，并按 `docs/ScreenshotOperation.md` 执行手工流程。
- `check-perf-scenes`：遍历 `fixtures/perf/*.json` 做场景级预算检查，`warning` 仅告警不阻断，`error` 或输入缺失阻断。
- `check-perf`：兼容单场景入口（默认 `fixtures/perf/sample_scene_metrics.json`），规则与多场景一致。
- `check-partition-streaming`：分区流送回放检查通过，且满足“无明显卡顿尖峰”阈值。

分区流送“无明显卡顿尖峰”量化阈值（最小场景）：
- 切换耗时 `p50 <= 20ms`
- 切换耗时 `p95 <= 35ms`
- 切换耗时 `max <= 50ms`
- 分区往返后状态一致性 `state_consistent = true`

里程碑命令与分层门禁映射：
- `check-m1` = `check-visual` + `check-perf-scenes` + `fate_demo` 日志断言。
- `check-m2` = `check-unit` + `check-integration` + 关键 runtime 场景测试。
- `check-m3` = `check-replay` + `check-unit` + `check-integration`。

发布与门禁职责分离：
- 只读门禁：`make check-replay`（调用 `tools/check_replay_determinism.py`）。
- 有副作用发布：`make release-local`（调用 `tools/release_local.py`，会写入 dist/publish/lockfile）。
- CI 仅校验发布流程有效性时可执行：`python3 tools/release_local.py --dry-run`（不写文件）。

如果你本地打开后是空白、不清楚先执行什么，可直接使用一键启动脚本：

```bash
# 全链路：schema + rust + cpp + editor preview
bash tools/start_test.sh all

# 仅编辑器链路（自动 install/typecheck/build/preview）
bash tools/start_test.sh editor
```

<details>
<summary>展开查看各子检查与原始命令</summary>

```bash
# 1) Schema 校验
python3 tools/validate_schemas.py

# 2) Rust package 自动化测试（OnUsed/OnDenied + 校验器分级）
cargo test --manifest-path runtime/door_core/Cargo.toml

# 2.1) 运行时稳定性基线（A1：10k tick smoke）
python3 tools/check_runtime_stability.py

# 2.2) 运行时长稳（nightly）
python3 tools/check_runtime_soak.py --profile 2h
python3 tools/check_runtime_soak.py --profile 8h

# 3) C++ 包装层与 manifest 基础编译校验（仅构建，不运行 demo）
cmake -S . -B build
cmake --build build

# 4) TS 类型检查与构建
cd editor/app
pnpm run typecheck
pnpm run build
```

</details>

## Rust 核心库编译与测试
```bash
cargo test --manifest-path runtime/door_core/Cargo.toml
```

## TS UI 本地预览（固定步骤）
```bash
# 1) 安装依赖
cd editor/app
pnpm install

# 2) 基础语法与类型检查
pnpm run typecheck

# 3) 构建产物（index.html 对应 ./dist/main.js）
pnpm run build

# 4) 启动本地预览服务（轻量静态服务）
pnpm run preview

# 可选：一条命令完成构建 + 启动
pnpm run dev
```

浏览器访问：`http://localhost:5173`


## 团队操作手册：截图与空白页排查
- 截图固定流程见：`docs/ScreenshotOperation.md`。
- 空白截图排查顺序（必须按序）：**服务未启动 → 路径错误 → 构建产物缺失 → 页面报错**。

## 当前是否可以开始做编辑器测试？
可以开始做第一轮编辑器联调测试，当前仓库已具备：
- Door 积木最小契约 + Manifest + Demo + 测试样例。
- Runtime（Rust）与 Editor（TS）的最小链路。
- schema-first 协议流程与基础校验脚本。

建议按以下顺序执行冒烟测试：
1. `python3 tools/validate_schemas.py`
2. `cargo test --manifest-path runtime/door_core/Cargo.toml`
3. `cmake -S . -B build && cmake --build build && ./build/fate_demo`
4. `cd editor/app && pnpm install && pnpm run typecheck && pnpm run build && pnpm run preview`（浏览器访问 `http://localhost:5173`）

## 如何开始做“门积木”契约（最简）
1. 在 `protocol/schemas` 先定义 request/response schema。
2. 在 `packages/door/manifest.json` 定义 `id/version/deps/params/defaults/license/compat`。
3. 在 Runtime 实现最小状态机（enabled/locked/open）和事件（`OnUsed/OnDenied/OnStateChanged`）。
4. 在 tests 中覆盖交互、校验分级、协议适配（Envelope）场景。

## 引擎默认全局配置（新增约定）
- 默认重力方向：`[0, 0, -1]`，并支持全局禁用。
- 默认三种摄像头：第一人称、第二人称、第三人称。
- 默认激活第一人称。
- 第二人称位于用户正前方 1 米（`offset_cm = [100, 0, 0]`）。
- 第三人称位于角色后上方（`offset_cm = [-200, 0, 120]`）。
- 三种摄像头均启用碰撞约束，防止穿模卡视野，并可在测试期间随时切换。


## 本地发布与消费（最小流程）
```bash
# 1) 回放一致性只读校验（门禁）
python3 tools/check_replay_determinism.py --recipe fixtures/replay/fixed_recipe.json --seed 123 --lockfile packages/brick.lock.json

# 2) 发布流程有效性校验（只校验，不落盘）
python3 tools/release_local.py --dry-run

# 3) 本地发布（有副作用，会写 dist/publish/lockfile）
python3 tools/release_local.py
```

消费流程说明见：`docs/PackageConsumeFlow.md`。


## A 项（引擎与运行时稳定性）当前可机检入口
```bash
# 快速门禁（PR 必跑）
make check-stability

# 夜间长稳（nightly）
make check-soak-2h
make check-soak-8h
```

通过标准：

性能预算准入与例外流程：
- `Warning`：不阻断 CI，但必须在周报登记并指派负责人跟踪。
- `Error`：阻断 CI，修复后方可合入。
- 例外：如需临时放行，必须在 PR 中说明原因、影响范围、回滚/修复计划，并在后续 PR 清理例外。
- `check-stability`：10k tick smoke 成功，快速发现崩溃与状态异常。
- `check-soak-2h` / `check-soak-8h`：输出统一 JSON 摘要（`duration/tick_total/error_count/max_rss_mb`），并满足 `protocol/perf/runtime_soak_thresholds.json` 阈值。
- 与现有分层门禁对齐：`check-stability` 作为快速门禁留在日常检查，长稳 soak 建议纳入 nightly。
