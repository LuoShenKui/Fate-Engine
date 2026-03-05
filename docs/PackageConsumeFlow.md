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

脚本会先执行 `tools/validate_schemas.py`，然后：
- 按 `packages/<brick>/publish.json` 读取发布元数据；
- 生成 `dist/<package>-<version>.tar.gz` 与同名 `.sha256` 摘要文件；
- 回写 `publish.json` 的 `source` 为 `file://dist/...`；
- 生成 `packages/brick.lock.json`（锁定版本 + checksum + compat + registry 保留字段）。

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
