# World Build Pipeline

`pipeline/` 负责把“原始作品资料”转换为 Fate Engine 可以消费的世界、资产和场景。

它是**流程编排层**，不是 AI 能力本身：

- `ai/`：提供解析、规划、检索、装配建议等能力；资产生成是可选扩展，不是默认前提。
- `pipeline/`：决定这些能力按什么顺序执行、如何校验、失败后从哪一步重跑。
- `asset/`：保存和索引标准化资产描述，优先复用已有合规资产。
- `systems/brick/`：把资产和交互模板快速装配成 3D 场景。
- `adapters/`：把结果交给 Unity / Unreal / 自研 Renderer。

典型流程：

```text
动画 / 电影 / 设定集 / 设计稿
        ↓
      ingest
        ↓
     analysis
        ↓
 asset resolve
        ↓
 optional generation
        ↓
    validation
        ↓
     assembly
        ↓
      export
        ↓
Unity / 其他宿主
```

## Directories

- `ingest/`：原片、设定集、设计稿、脚本等输入资料的标准化接入。
- `analysis/`：人物、场景、物体、服装、动作、时间线、风格和世界规则解析。
- `generation/`：可选的资产生成任务编排；只有 Asset Library 无法满足需求时才进入，并且生成结果仍需进入标准资产与验证流程。
- `validation/`：几何、骨骼、风格一致性、资产完整性、版权/来源元数据、性能预算等自动校验。
- `assembly/`：调用 Brick、World Template 和 Asset Library 组装可玩的 3D 场景。
- `export/`：导出为 Unity、Unreal 或未来自研宿主可消费的格式。

原则：每一步都必须有明确输入、明确输出、可独立重跑、可独立验证，避免形成不可调试的“动画进去，世界出来”的大黑盒。
