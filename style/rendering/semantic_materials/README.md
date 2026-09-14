# Semantic Materials

语义材质描述资产“是什么”，而不是绑定到某个具体 Renderer 或 Shader。

第一阶段类型：

```text
Skin
Hair
Eye
Cloth
Metal
Wood
Stone
Glass
Water
Vegetation
Generic
```

目标：

- Anime Renderer 可以把 `Hair` 映射到动画头发材质；
- Realistic Renderer 未来可以把同一个 `Hair` 语义映射到写实头发实现；
- World、Character、Gameplay 不依赖具体渲染实现；
- Material Variant 可以由 Render Style 或 Asset Profile 选择。

后续这里应演进为正式 schema / contract，而不是长期停留在 Markdown。
