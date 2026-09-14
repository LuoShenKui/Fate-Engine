# Unity Anime Rendering Adapter

第一阶段宿主：Unity + URP。

本目录负责把 Fate Engine 的 Render Style Contract、Semantic Material 与 Anime Style Profile 映射到 Unity/URP 实现。

边界：

- 可以依赖 Unity / URP；
- 不允许反向污染 `core/`、`systems/`、`simulation/`、`world/`；
- 真实 Shader / Renderer Feature / Material Binder 在实现阶段加入；
- 若未来接 Unreal 或自研 Renderer，应通过相同上层契约实现新的 Adapter。

预计实现期结构：

```text
Packages/com.fate.render.anime/
├─ Runtime/
├─ Shaders/
├─ Materials/
├─ RenderFeatures/
├─ Lighting/
├─ Character/
├─ Environment/
├─ Outline/
├─ PostProcessing/
└─ Editor/
```
