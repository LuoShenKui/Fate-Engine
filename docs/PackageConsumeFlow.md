# 本地包消费流程（file:// / 目录源）

## 1) 回放一致性校验（只读，无副作用）

```bash
python3 tools/check_replay_determinism.py --recipe fixtures/replay/fixed_recipe.json --seed 123 --lockfile packages/brick.lock.json
```

说明：该命令只读取 recipe/seed/lockfile，输出标准化快照摘要并做一致性比对（默认二次运行比对，也可通过 `--expected` 对比期望快照）。

## 2) 发布侧：生成可分发包与 lockfile（有副作用）

```bash
python3 tools/release_local.py
```

脚本会先执行 `tools/validate_schemas.py`，并对 `lifecycle.status/release.channel/compat.matrix_ref/announcement_ref` 做治理字段检查；关键字段缺失会阻断发布。然后：
- 按 `packages/<brick>/publish.json` 读取发布元数据；
- 生成 `dist/<package>-<version>.tar.gz` 与同名 `.sha256` 摘要文件；
- 回写 `publish.json` 的 `source` 为 `file://dist/...`；
- 自动产出发布公告 `docs/releases/<date>-<package>-<version>.md` 并回写 `announcement_ref`；
- 自动生成兼容矩阵 `docs/releases/compat_matrix.json`，并回写 `compat.matrix_ref`；
- 生成 `packages/brick.lock.json`（锁定版本 + checksum + compat + registry + 治理字段）。

CI 只做流程校验时可使用：

```bash
python3 tools/release_local.py --dry-run
```

该模式仅校验流程，不会写入 `dist/`、`publish.json` 或 lockfile。

## 3) 消费侧：导入本地包

### 2.1 file:// 压缩包
读取 `packages/brick.lock.json` 中的 `source.uri`，例如：

- `file://dist/fate.door.basic-0.1.1.tar.gz`

流程：
1. 解析 `file://` URI 到本地路径；
2. 对 tar.gz 计算 sha256，必须与 lockfile 的 `checksum` 一致；
3. 解压并读取其中 `manifest.json`，校验 `id/version/license` 与 lockfile 一致。

### 2.2 目录源（开发态）
开发态允许 `publish.json.source.type=dir` 且 `source.uri=file://packages/<brick>`。

流程：
1. 读取目录中的 `manifest.json` 和 `publish.json`；
2. 校验 `publish.package/version/license` 与 `manifest` 一致；
3. 对 `manifest.json` 做 hash 校验（`publish.hash`）。

## 4) 版本兼容校验（最小规则）

安装前对每个包执行：
- `compat.engine` 与当前引擎版本做范围匹配；
- `compat.contract` 与引擎支持的 contract 版本匹配；
- 若不兼容，拒绝安装并提示具体字段。

## 5) 落到编辑器 registry 的最小映射

建议编辑器侧维护一个本地 registry 索引，字段最小集：
- `package`
- `version`
- `source`（file://）
- `checksum`
- `compat`
- `registry`（预留给 Go 服务化）

其中 `registry` 当前由发布元数据透传，推荐：
- `provider=local`
- `namespace=fate`
- `channel=stable`
- `endpoint` 先留空（后续 Go registry 可写 URL）。


## 6) 跨机器复现实验（矩阵模式）

执行命令：

```bash
python3 tools/check_replay_matrix.py --matrix fixtures/replay/matrix_cases.json --report-out fixtures/replay/report.latest.json
```

说明：
- 固定 `seed/recipe/lockfile`，对 `vN-1 / vN / vN+1` 存档样本批量执行迁移回放；
- 校验 `packages/*/manifest.json` 中 `state_migration.from_previous` 与 `state_version` 声明是否自洽；
- 输出统一 machine-readable 报告，包含每个 case 的 `summary_hash`、`migration_paths`、`failed_diff_fields`。

### 验收清单（可执行）

1. 环境记录（提交到实验记录）：
   - `os`: 操作系统名称与版本（如 `Ubuntu 24.04`）；
   - `arch`: CPU 架构（如 `x86_64` / `arm64`）；
   - `python`: `python3 --version`；
   - `cmake`: `cmake --version`；
   - `runtime`: 若涉及 Rust 运行时，记录 `rustc --version` 与 `cargo --version`。
2. 执行 `python3 tools/check_replay_determinism.py ...`，确认 `summary_hash` 稳定。
3. 执行 `python3 tools/check_replay_matrix.py ...`，确认 `failed_cases` 为空（或与预期失败用例一致）。
4. 归档 `--report-out` 产物与命令行输出，作为跨机器复现证据。

## 7) 回滚与追溯（plan_id + lockfile）

第一阶段仅做“计划与元数据贯通”，不涉及真实网格处理算法；发布与复现依赖以下两类信息：

- `packages/*/publish.json.pipeline.plan_id`：标识本次资产流水线计划；
- `packages/*/publish.json.pipeline.config_hash` 与 `source_hashes`：标识策略配置与输入资源集合；
- `packages/brick.lock.json`：锁定最终分发包版本、来源与 checksum。

回滚/追溯建议流程：
1. 通过 lockfile 定位目标包版本与归档（`source.uri` + `checksum`）；
2. 从对应包 `publish.json` 读取 `pipeline.plan_id`，并匹配 `config_hash/source_hashes/tool_version`；
3. 使用同一份 DCC 资源清单、同一份策略配置，通过 `tools/build_asset_pipeline_plan.py` 重新生成 plan；
4. 对比新 plan 的 `plan_id` 与发布记录是否一致，一致则可认定输入与策略可复现；
5. 若要回滚，优先选择 lockfile 中历史版本 + 对应 `plan_id` 完整匹配的发布条目。

## 8) 依赖合规违规处理流程

执行命令：

```bash
python3 tools/check_dependency_compliance.py
```

默认读取：
- `runtime/door_core/Cargo.lock`
- `editor/app/pnpm-lock.yaml`
- `protocol/compliance/dependency_policy.json`

若报告中出现 `violation_code`，按以下顺序处理：
1. **替代依赖优先**：优先改为同能力、许可证/来源可接受的依赖；
2. **锁版本回滚**：若问题由升级引入（如超出 patch 自动升级策略），回滚 lockfile 到最近合规版本；
3. **申请豁免**：确需保留时，提交豁免申请并在策略文件中记录临时 exemption（需标注范围与截止时间）。

建议在豁免单中最少包含：
- 包名与版本；
- 触发的 `violation_code`；
- 风险评估与替代方案对比；
- 生效时长（到期后必须复审）。


## 9) 发布治理状态机（灰度→稳定→弃用→回滚）

状态机：
- `canary + active`：灰度验证阶段；
- `stable/lts + active`：稳定可消费；
- `stable/lts + deprecated`：已弃用，允许读取但不建议新接入；
- `* + revoked`：撤销发布，必须回滚。

推荐操作命令：

1. **灰度发布（canary）**
   ```bash
   python3 tools/release_local.py <package_dir>
   ```
   在 `packages/<package_dir>/publish.json` 中设置：
   - `release.channel=canary`
   - `lifecycle.status=active`

2. **提升稳定（stable/lts）**
   修改 `release.channel` 为 `stable` 或 `lts` 后再次执行：
   ```bash
   python3 tools/release_local.py <package_dir>
   ```

3. **弃用（deprecated）**
   修改 `lifecycle.status=deprecated`，并执行：
   ```bash
   python3 tools/release_local.py <package_dir>
   ```

4. **回滚（revoked + 历史版本）**
   - 将问题版本标记为 `lifecycle.status=revoked` 并重新发布元数据；
   - 用目标历史版本重新执行发布：
   ```bash
   python3 tools/release_local.py <package_dir>
   ```

辅助命令：
```bash
python3 tools/build_compat_matrix.py --lockfile packages/brick.lock.json --out docs/releases/compat_matrix.json
```
用于在 lockfile 变更后单独重建 machine-readable 兼容矩阵。
