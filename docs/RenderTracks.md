# Fate Engine Render Tracks

> 状态：Canonical Rendering Boundary  
> 适用范围：Fate Engine Rendering / Render Style / Animation Presentation / VFX  
> 目标：严格区分 NPR 艺术轨与 PBR 物理轨，禁止把 NPR 退化为 PBR 上的后处理或 Toon Shader。

## 1. 为什么需要 Render Track

Fate Engine 不把所有视觉风格塞进同一条“先做真实物理，再做风格化”的渲染管线。

必须先区分两种根本不同的目标：

- **PBR Physical Track**：建立尽可能自洽的物理世界，再由相机观察。
- **NPR Artistic Track**：直接优化最终画面，用构图、线条、色块、时间节奏和视角欺骗来得到目标视觉结果。

两者可以共享世界状态，但不能共享同一套最终视觉物理。

**Custom Rendering 是横向扩展机制，而非第三种固定画风或自动新增的根轨。** 自定义 Style/Pass 必须声明自己的语义归属（PBR、NPR 或显式声明的独立范式）、资源读写与合成方式；不能绕过统一调度。

因此：

```text
World / Physics / Animation / Asset Semantics
                   ↓
          Render Track Boundary
            ┌───────────────┐
            ↓               ↓
      PBR Physical      NPR Artistic
          Track             Track
            ↓               ↓
       Realistic       Anime / Comic /
       Rendering       Painting / ...
```

**硬规则：NPR 不是 PBR 的子模式，PBR 也不是 NPR 的强制底座。**

---

## 2. 两条轨道的根本差异

| 维度 | PBR Physical Track | NPR Artistic Track |
| --- | --- | --- |
| 核心目标 | 物理与材质响应自洽 | 最终画面与艺术语言正确 |
| 空间 | 固定三维几何优先 | 允许视角相关几何修正与屏幕空间欺骗 |
| 光照 | BRDF / BSDF / 能量一致性 | 语义化光照、分区阴影、艺术指导优先 |
| 阴影 | 光源与几何决定 | 阴影形状本身是构图元素 |
| 色彩 | 连续光照与材质响应 | 固定色板、硬阶色块、受控高光 |
| 线条 | 通常由几何边缘或后处理生成 | 线条本身是结构、张力与光影语言 |
| 动画时间 | 连续插值与高帧率稳定性 | 拍数、顿帧、Held Frame、Impact Frame |
| 高速运动 | Motion Blur / Temporal Blur | Smear Frame / Stretch / 多重残像设计 |
| VFX | 粒子、流体、体积与物理解算 | 特效原画式形态、符号化块面与节奏 |
| 相机 | 透视模型尽量统一 | 可局部超透视、弱透视、构图优先 |
| 验收 | 是否符合物理与材质规律 | 是否像目标动画/漫画/插画画面 |

---

## 3. NPR 艺术轨的五个一等能力

### 3.1 Line Language：线条不是几何边缘

NPR 必须允许线条参与最终视觉结构，而不是只做 Outline 后处理。

需要支持：

- 外轮廓与内部结构线分离；
- 线宽、虚实、闭合度随部位、光照、镜头和动作变化；
- 受光侧线条变细或断开；
- 背光/暗部线条加粗；
- 影指定线或等价语义边界；
- 线条可表达重量、速度、张力，而不是仅表示 Mesh 边缘。

因此 NPR 的 Line System 必须被视为正式 Render Pass / Presentation Layer，而不是附加效果。

### 3.2 Composition over Geometry：构图高于物理空间

NPR 允许在保持世界逻辑和碰撞真相不变的情况下，为最终画面做视觉修正：

- 局部超透视；
- Camera-aware Geometry；
- 关键视角 Face / Eye / Mouth / Nose Correction；
- 局部弱透视或透视压平；
- 2D / Multiplane Background；
- View-dependent Silhouette Correction。

**渲染几何不等于物理几何。**

Physics / Collision / Navigation 使用稳定世界几何；NPR Render Geometry 可以为镜头服务。

### 3.3 Timing & Spacing：时间不是连续曲线的附属物

NPR Presentation 必须能够脱离“每帧连续插值”的默认假设。

正式支持：

- 一拍一 / 一拍二 / 一拍三 / 一拍四；
- Held Frame；
- Hit Stop；
- Impact Frame；
- Animation Sampling Override；
- Pose Exaggeration；
- Camera Timing Override；
- Smear Frame / Stretch / Ghost Shape。

运行时仍可在 60/90/120Hz 更新世界，但**视觉采样与表现节奏可以是离散的**。

### 3.4 Symbolic VFX：自然现象可以被重新设计

NPR VFX 不以物理模拟精度作为最高目标。

允许：

- 水花尖刺化；
- 爆炸块面化；
- 烟雾以设计过的体积块裂变；
- 火焰内部使用硬边影块；
- 碎石、冲击、速度线、斩击线采用符号化语言；
- VFX 形态按关键帧艺术节奏变化，而不是只由流体方程决定。

物理解算可以作为输入，但不能成为 NPR 最终形状的唯一权威。

### 3.5 Palette & Shadow Shape：色块是构成元素

NPR 必须能定义：

```text
Base
1st Shadow
2nd Shadow
Highlight
Accent
```

并允许每层拥有确定色板与区域规则。

阴影形状允许由：

- Light Semantic；
- Face / Hair / Body Mask；
- Camera Direction；
- Character Identity Profile；
- Art Direction Rule；

共同决定。

光源只提供输入，不直接拥有最终像素结果的决定权。

---

## 4. PBR Physical Track 的职责

PBR Track 保持清晰、完整，不因为 Anime-first 而被做成残缺的兼容层。

它负责典型的：

- physically based material；
- BRDF / BSDF；
- metallic / roughness / dielectric；
- physically plausible lighting；
- shadow / reflection / GI；
- volumetric / transparency；
- camera exposure / motion blur；
- continuous animation presentation；
- physically coherent post process。

Realistic Renderer 默认属于 PBR Physical Track。

PBR Track 可以拥有风格化参数，但只要最终仍以物理光照与固定三维几何为主要真相，它仍属于 PBR 轨。

---

## 5. 两条轨道允许共享什么

允许共享的是**世界事实与语义**：

- Entity / Transform；
- Scene Graph；
- Asset Identity；
- Mesh Source；
- Skeleton / Rig；
- Animation Clip / Pose；
- Physics / Collision；
- Visibility / Culling；
- Depth / Occlusion 基础信息；
- Camera Transform；
- Light 的方向、颜色、强度等原始/语义输入；
- Semantic Material（Skin / Hair / Metal / Wood ...）；
- Character / Environment Identity；
- Runtime State。

这些共享层不得预先替任何 Track 做最终视觉决定。

例如：

```text
Semantic Material = Hair
        ├─ PBR → anisotropic / roughness / specular response
        └─ NPR → shadow band / highlight shape / line rule / palette
```

---

## 6. 两条轨道禁止共享什么

以下内容不得被定义为所有 Render Style 的公共强制结果：

- PBR BRDF 结果；
- 连续 Lighting Result；
- 固定 Motion Blur；
- 固定真实透视；
- 固定三维面部几何；
- 固定连续阴影梯度；
- metallic / roughness 作为所有风格的必填最终语义；
- TAA / Bloom / Exposure 等 PBR 常用后处理的默认强制链；
- 由物理粒子或流体直接决定的最终 VFX 外观。

尤其禁止：

```text
World
  ↓
PBR
  ↓
Toon / Outline / Posterize
  ↓
Anime
```

Anime / NPR 的正确结构应是：

```text
World Facts + Visual Semantics
              ↓
         NPR Interpreter
              ↓
Line / Shape / Timing / Palette / Projection / VFX
              ↓
          Final Frame
```

---

## 7. Hybrid 不等于边界消失

未来允许 Hybrid，但必须显式声明。

例如：

- PBR Environment + NPR Character；
- NPR Character + physically simulated cloth；
- NPR Fire 使用流体模拟作为 motion source；
- PBR Reflection 中出现 NPR object；
- Portal / Dream Scene 混合两条 Track。

Hybrid 的原则是：

> 可以交换输入和合成结果，但不能让其中一条轨道偷偷成为另一条的默认底座。

需要通过 Composition / Bridge 层解决：

- Depth；
- Occlusion；
- Cross-track Shadow；
- Reflection；
- Transparency；
- Post Process；
- VR Multi-view。

---

## 8. Render Track Contract

每个 Render Style 必须先声明自己的 Track。

概念契约：

```text
RenderStyle
├─ id
├─ version
├─ track                  # NPR_ARTISTIC / PBR_PHYSICAL（或未来经评审的新 Track）
├─ capabilities
├─ material_mapping
├─ profile_schema
├─ presentation_rules
└─ adapter_requirements
```

第一阶段至少定义：

```text
NPR_ARTISTIC
PBR_PHYSICAL
```

未来如果出现无法归入二者的新范式，再新增 Track；不要为了方便把所有东西继续塞回 PBR。

---

## 9. Anime Renderer 的归属

`Fate Anime Renderer` 明确属于：

```text
Render Track: NPR_ARTISTIC
Render Style: ANIME
```

因此 Anime Renderer 可以正式拥有：

- Anime Lighting Interpreter；
- Camera-aware Geometry；
- Anime Projection；
- Line System；
- Shadow Shape Design；
- Palette / Cell Division；
- Held Frame / Hit Stop；
- Smear / Stretch；
- Symbolic Anime VFX；
- Anime-specific Composition。

这些能力不是“违反渲染规则的例外”，而是 NPR Track 的正常能力。

---

## 10. 架构硬规则

1. **PBR 与 NPR 在 Render Track 层必须显式分离。**
2. **NPR 不允许以完整 PBR shading result 作为强制输入。**
3. **PBR 不得被定义为 Fate Engine 的默认视觉真理。**
4. **World / Physics Truth 与 Render Truth 分离。**
5. **Physics Geometry 与 Render Geometry 可以不同，但必须保持可追踪映射。**
6. **Animation Runtime Tick 与 Presentation Sampling 分离。**
7. **Line、Shadow Shape、Palette、Timing、VFX Shape 在 NPR 中都是一等能力。**
8. **同一 Style 必须声明 Track；不得依赖隐式猜测。**
9. **跨 Track 混合必须经过 Composition / Bridge，不允许直接共享最终 shading pipeline。**
10. **Anime-first 的实现与验收以 NPR Artistic Track 为准，不得退化为 PBR + Toon。**

---

## 11. 第一阶段落地

第一阶段先做：

```text
Render Track Contract
├─ NPR_ARTISTIC
└─ PBR_PHYSICAL

NPR_ARTISTIC
└─ Anime Renderer (first implementation)

PBR_PHYSICAL
└─ Realistic Renderer (host fallback / future formal implementation)
```

Unity URP 可以作为宿主提供底层 Camera、Depth、Culling、Render Pass、GPU Resource 等能力，但宿主的 PBR 管线不能因此成为 Anime Renderer 的架构父级。

这条边界从文档、Contract、Profile、Adapter 到未来运行时代码都必须保持一致。

---

## 12. Custom Rendering：独立的扩展机制

Custom 不是与 PBR/NPR 相互排斥的第三条固定渲染轨，也不意味着每个 IP 单独开发引擎。

- 可以在现有 Track 中注册自定义 Shader、Material、Geometry Correction、Pass、Post-process 与 Style Profile。
- 如视觉范式无法归入 PBR/NPR，应先定义并评审新的 Track Contract，而不是借用 `CUSTOM` 逃避语义约束。
- 角色/材质可选择 Render Style，场景可提供统一的灯光、相机和合成策略；角色的特殊表现不得修改物理世界事实。
- IP 高保真需要合法取得的模型、纹理、动画及参考资料，Custom 插件不等于自动还原任何 IP。

### 12.1 双层视觉表现目标

| 级别 | 适用环境 | 验收目标 |
| --- | --- | --- |
| Standard / 通用模式 | 一般游戏场景，可同场景混用 PBR/NPR/Custom | 保持角色身份、轮廓、色彩与风格神韵；允许有限阴影、反射、后处理偏差 |
| Fidelity / 高保真模式 | IP 专属场景或展示环境 | 使用专用照明、渲染通道、后处理、镜头及对照画面，尽量还原原作；不承诺百分百一致 |

两种模式共享原始角色资产与世界系统；高保真模式通过叠加 Style Profile、Pass 与环境配置实现，**房间不是强制的渲染隔离边界**。

### 12.2 Custom Pass 最小声明

- 稳定标识、版本、适配后端与能力要求；
- 执行阶段/依赖项，输入与输出资源、读写访问方式；
- 颜色空间、深度/模板语义、透明合成策略；
- 是否支持 VR 双眼、动态分辨率、时间历史资源；
- 不支持时的降级路径和诊断信息。

完整的 Render Graph、资源生命周期、组合边界与分阶段验收见 [RenderGraph.md](RenderGraph.md)。
