# Door Manifest

- 主 manifest 文件：`../manifest.json`
- 本目录用于放置后续多版本 manifest 或补充元数据。

## Migration

- 当前状态版本：`1.0.0`
- 迁移入口由 `manifest.json` 的 `state_migration.entry` 指向本节。
- 从 `0.0.x` 升级到 `1.0.0` 时，按默认值补齐 `runtime_state` 中新增字段。
