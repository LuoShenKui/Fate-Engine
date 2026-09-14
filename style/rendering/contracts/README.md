# Render Style Contracts

这里定义渲染风格插件与 Fate Engine 之间的稳定边界。

第一阶段计划约束：

- Render Style ID 与版本；
- 支持能力声明；
- Style Profile 绑定；
- Semantic Material 映射；
- Character / Environment / VFX 能力声明；
- Engine Adapter 所需输入；
- 风格切换时允许的 Asset Variant；
- 不允许 World Kernel 依赖具体 Shader 或 Unity API。

示意接口：

```text
RenderStyle
├─ id
├─ version
├─ capabilities
├─ material_mapping
├─ profile_schema
└─ adapter_requirements
```

这里暂时只定义契约与目录，不提交具体运行时代码。
