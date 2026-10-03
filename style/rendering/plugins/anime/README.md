# Fate Anime Renderer

Fate Engine 第一款正式 Render Style 插件。

```text
Render Track: NPR_ARTISTIC
Render Style: ANIME
```

Anime Renderer 不允许被实现为 `PBR -> Toon/Outline/PostProcess` 的附属链路。

目标：让真正的 3D 角色与 3D 世界在静态和运动状态下都尽可能保持日式 2D 动画视觉语言，而不是仅仅套一层 Toon Shader。

## 模块

```text
anime/
├─ character/       # Face / Skin / Hair / Eye / Cloth / Accessory
├─ environment/     # Wood / Stone / Metal / Glass / Water / Vegetation
├─ lighting/        # Physical Light -> Anime Light Interpreter
├─ shadows/         # Face / Body / Environment / Contact Shadow
├─ outlines/        # 稳定描边
├─ vfx/             # Fire / Smoke / Explosion / Magic / Splash
└─ post_process/    # 色彩、曝光、Bloom 等
```

## 优先级

1. Character / Face
2. Lighting / Shadow
3. Outline
4. Environment Materials
5. Post Process
6. Motion / VR Stability
7. VFX

## 关键原则

- 角色身份保持优先；
- 美术正确优先于物理正确；
- 线条、影形、色块、拍数、Smear / Impact Frame、符号化 VFX 都属于正式表现能力；
- Render Geometry 可以为镜头做视角相关修正，但不得修改 Physics / Collision Truth；
- 角色与环境必须使用统一视觉语言；
- 任何 World Kernel 逻辑不得依赖本插件；
- Unity URP 是第一阶段实现，不是永远的架构边界。

Render Track 根边界见 `docs/RenderTracks.md`。

详细需求见 `docs/AnimeRenderStylePRD.md`。
