Demo：Forest Cabin v0（森林小屋）
1) 场景内容（最小但能打）

一块小地形（或平面也行）

一片针叶林（程序化散布）

一间小屋（墙/屋顶/桌子/椅子等静态物）

1 扇门（可交互开关）

1 个触发区（进屋触发氛围/提示）

可选：一个箱子（拾取/容器，后续加）

2) 必须证明的“Fate 特性”（验收清单）
A. 拿来可用

门拖进去就能开/关（无需写脚本）

森林拖进去就能生成（无需一棵棵摆）

B. 可禁用/可覆写（你最关心的）

森林包默认支持天气/季节

项目策略一键覆写：禁用天气、固定春天

覆写后依然可运行，且校验器给出 Info/Warning（可解释）

C. 可复现

同一 recipe + seed + lockfile 生成的森林布局一致

换机器/重装也一致（这点非常关键）

D. 可校验

校验器至少能检查：

门缺 slot/参数（Error）

森林散布超预算（Warning）

禁用天气后仍引用天气子图（Error 或自动 gate 掉）

校验报告能定位到具体：哪个积木、哪个参数/节点

E. 快速改逻辑（白盒）

不改源码就能改门的逻辑：例如“进屋后门自动关上”

做法：对门积木应用一个 graph patch 或在场景层加一个规则连接

3) Demo 需要的最小积木包（4 个足够）

forest.conifer

能力：Scatter / Season / Weather（Weather 可降级）

参数：密度、变体、season.mode、weather.enabled、wind strength

输出：实例化树、地表点缀（可选）

cabin.basic（静态组合包）

只要模型插槽：墙/屋顶/桌椅

可选：室内氛围音 slot

door.basic

Interact：开/关

状态：Open/Closed

插槽：门板 mesh、开关音效 sfx（都有 fallback）

trigger.zone

OnEnter/OnExit

用于“进入小屋→触发提示/氛围/门逻辑”

这 4 个包就能展示“生态装配”的本质：组合、覆写、可复现。

4) 演示脚本（60 秒展示顺序）

打开编辑器，选择模板 Forest Cabin

输入 seed=123 → 生成森林布局

切换 seed=456 → 森林变化（但仍合理）

勾选项目策略：

Weather: Disabled

Season: Fixed Spring

点击 Validate → 出报告（Info: weather degraded / OK）

点击 Play → 进屋，开门关门，触发区生效

导出 lockfile → 在另一台机器复现（可以录成第二段）

5) 最小实现建议（避免你被细节拖死）

森林第一版不要追求“真树建模”，用简单 mesh 变体就行（甚至 billboard 也行）

门第一版用对象旋转动画（不需要骨骼）

小屋可以是最简单的几何体（你要证明的是工作流与契约，不是美术质量）

校验器先做最小集合（缺参数/缺 slot/超预算/禁用冲突）

6) 做完这个 demo，你就拿到了什么？

一套能跑的 Brick Contract v0.1 用例（森林禁用天气/固定春天）

一套能对外讲清楚的“为什么更快”的证据

以后每新增积木都能用这套 demo 做回归测试（防止生态崩）

7) Demo 最小验收

A. 命令执行成功证据（schema/rust/cpp/ts）

- 验收项：Schema 校验脚本通过。
  - 命令：`python3 tools/validate_schemas.py`
  - 预期输出关键词：`Schema validation passed` / `manifest` / `ok`
- 验收项：Rust 运行时测试通过（门交互 + 校验分级）。
  - 命令：`cargo test --manifest-path runtime/door_core/Cargo.toml`
  - 预期输出关键词：`test result: ok`、`OnUsed`、`OnDenied`
- 验收项：C++ Demo 可编译并可运行。
  - 命令：`cmake -S . -B build && cmake --build build && ./build/fate_demo`
  - 预期输出关键词：`Door used`、`Door denied`、`Validation`
- 验收项：TS 编辑器可完成类型检查与构建。
  - 命令：`cd editor/app && pnpm run typecheck && pnpm run build`
  - 预期输出关键词：`Found 0 errors`、`build completed`、`dist/main.js`

B. 编辑器交互结果证据（门开关、校验输出）

- 验收项：角色接近门触发交互（Play 模式由场景驱动，不依赖工具栏 Interact 按钮）。
  - 操作：点击工具栏 `Play Mode (enabled=true)`，在画布点击门实体。
  - 预期输出关键词：`entity_id=door-1`、`state=Open`、`OnUsed`。
- 验收项：上锁时拒绝交互。
  - 操作：点击 `切换锁定` 后再次点击门。
  - 预期输出关键词：`state=Locked`、`reason=locked`、`OnDenied`。
- 验收项：开门后可通行。
  - 操作：解锁并再次点击门，观察状态同步日志。
  - 预期输出关键词：`state=Open`、`blocked=false`。
- 验收项：关门后阻挡恢复。
  - 操作：再次点击已打开的门使其关闭。
  - 预期输出关键词：`state=Closed`、`blocked=true`。
- 验收项：校验面板能输出分级结果并定位对象。
  - 操作：执行 Validate，分别制造缺 slot、超预算、禁用冲突等案例。
  - 预期输出关键词：`Info`、`Warning`、`Error`（并包含对应 brick/参数定位）。

C. 导出配方/lockfile 的可复现证据

- 验收项：同 recipe + seed + lockfile 在不同机器结果一致。
  - 操作：导出配方与 lockfile，记录 seed（如 `123`）；在另一环境导入后重建场景。
  - 预期输出关键词：`recipe`、`lockfile`、`seed=123`、`reproducible` / `一致`
- 验收项：变更 seed 后布局变化但流程可复现。
  - 操作：将 seed 改为 `456`，导出新的结果并与 `123` 对照。
  - 预期输出关键词：`seed=456`、`layout changed`、`deterministic`

8) 失败排查（优先级顺序）

- 页面空白时，先确认是否已完成前端构建：`cd editor/app && pnpm run build`。
- 再确认是否已启动静态服务：`cd editor/app && pnpm run preview`，并访问 `http://localhost:5173`。
- 再确认 `dist` 路径与产物是否存在：`editor/app/dist/index.html`、`editor/app/dist/main.js`。
- 若仍异常，回到“命令执行成功证据”逐项重跑，先排除 schema/runtime 构建失败导致的数据或协议不一致。
