# Render Style System

`style/rendering/` 定义 Fate Engine 的渲染风格抽象，不直接实现 World Kernel 逻辑。

## 目标

- 世界逻辑与视觉表现解耦；
- 资产优先声明“是什么”，而不是绑定具体 Shader；
- Anime / Realistic / Stylized 等风格通过统一契约接入；
- Unity 是第一阶段宿主，但本目录保持引擎无关。

## 目录

```text
style/rendering/
├─ contracts/               # Render Style / Capability / Switching 契约
├─ semantic_materials/      # Skin / Hair / Metal / Wood 等语义材质
├─ plugins/
│  └─ anime/
│     ├─ character/         # Face / Skin / Hair / Eye / Cloth / Accessory
│     ├─ environment/       # Wood / Stone / Metal / Glass / Water / Vegetation
│     ├─ lighting/          # Anime Light Interpreter
│     ├─ shadows/           # Face / Body / Environment / Contact Shadow
│     ├─ outlines/          # 稳定描边系统
│     ├─ vfx/               # 动画风格 VFX
│     └─ post_process/      # 整体色彩与画面控制
└─ README.md
```

相关目录：

```text
style/profiles/anime/             # Anime Style Profile
adapters/unity/rendering/anime/   # Unity URP 适配实现
```

## 核心数据流

```text
World / Character / Environment
              ↓
      Semantic Asset Layer
              ↓
       Render Style Contract
              ↓
       Selected Renderer
              ↓
        Engine Adapter
              ↓
      Unity / Unreal / Other
```

## 第一实现

第一款正式 Render Style 为 `Anime`。

产品需求见：`docs/AnimeRenderStylePRD.md`。
