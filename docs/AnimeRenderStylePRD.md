# Fate Anime Render Style PRD

> 状态：Draft / Architecture First  
> 目标宿主：Unity + URP（第一阶段）  
> 所属系统：`style/rendering/`

## 1. 背景

Fate Engine 的目标不是把二次元角色“现实化”，而是让二次元角色以原本的视觉身份进入真正的 3D 世界。

二次元角色本身并不是严格遵循真实三维几何、真实透视与真实光照的对象。它们是经过原画、动画、镜头设计长期优化后的视觉产物：

- 正脸、45°、侧脸可能分别采用不同的视觉修正；
- 眼睛、鼻子、嘴、下巴并不一定满足严格三维几何一致性；
- 光照与阴影首先服务于角色观感，而不是物理正确；
- 透视可以被弱化、夸张或局部修正；
- 角色轮廓、头发色块、脸部阴影本质上都属于美术设计的一部分。

因此，如果简单将二次元设定转换为普通 3D 模型，再套用标准 PBR、真实透视与 Toon Shader，角色往往会出现“变味”：

> 模型仍然像这个角色，但视觉身份已经从“动画角色”变成“3D 模型 / Cosplayer / 手办”。

Fate Engine 的核心原则是：

> 游戏必须是可自由运动、可交互的 3D 世界，但最终画面不必服从真实世界的视觉规律。

第一优先级不是“更真实”，而是：

> 在完整 3D 空间中，尽可能保持接近优秀 2D 动画的最终视觉体验。

---

## 2. 产品目标

构建一个可插拔的 `Render Style System`，让 World Kernel、角色逻辑、物理、动画与最终视觉规则解耦。

第一款正式风格：

`Fate Anime Renderer`

目标不是普通 Toon Shader，也不是在 PBR 上增加卡通后处理，而是一套完整独立的 Anime Rendering Pipeline：

- 角色是 3D，但最终视觉尽可能接近日式 2D 动画；
- 场景、建筑、植物、金属、水、玻璃、特效等遵循统一二次元视觉语言；
- 角色可根据镜头方向进行非真实几何与透视修正；
- Anime Style 不强制使用真实 PBR 光照模型；
- 静态截图接近动画画面；
- 镜头和角色运动时仍保持稳定，不因角度与动态光照快速“掉回 3D 游戏感”；
- 后续允许 Realistic / Comic / Lego / Oil Painting 等完全不同的视觉系统与其平级存在。

一句话目标：

> 不是把二次元角色变成真实世界中的人，而是建立一套专门服务于“二次元如何进入三维世界”的视觉规则。

---

## 3. 核心架构原则

### 3.1 PBR 不是默认世界规律，而是一种 Render Style

传统游戏引擎通常默认：

```text
3D World
   ↓
PBR Rendering
   ↓
可选 Toon / Post Process
```

Fate Engine 不采用这个前提。

目标结构：

```text
3D World / Physics / Animation
              ↓
      Visual Semantic Layer
              ↓
        Render Style
   ┌──────────┼──────────┬─────────┬──────────┐
   ↓          ↓          ↓         ↓          ↓
Anime     Realistic    Comic      Lego    Oil Painting
```

Realistic Renderer 可以使用 PBR。

Anime Renderer 可以使用完全不同的光照、阴影、透视、法线、轮廓与后处理规则。

因此：

> PBR 只是 Render Style 的一种实现，不是所有风格必须服从的底层真理。

---

### 3.2 模型可以显式声明自己的视觉风格

对象允许绑定 `RenderStyleProfile`。

示例：

```text
Character_A
RenderStyle = Anime

Building_B
RenderStyle = Realistic

NPC_C
RenderStyle = Comic

Toy_D
RenderStyle = Lego

DreamObject_E
RenderStyle = OilPainting
```

这意味着同一个 3D 世界中，不同对象可以使用不同的“视觉物理规则”。

Style 不只是材质标签，而是完整控制：

- Lighting
- Shading
- Projection
- Geometry Correction
- Shadow
- Outline
- Animation Presentation
- Post Process

---

### 3.3 资产描述“它是什么”，Style 决定“怎么看它”

禁止世界资产直接绑定某个具体 Shader。

资产只声明语义：

- Skin
- Hair
- Eye
- Cloth
- Metal
- Wood
- Stone
- Glass
- Water
- Vegetation
- Generic

然后不同 Style 自己解释：

```text
Semantic Material: Skin
        │
        ├─ Realistic → Skin PBR / SSS
        ├─ Anime     → Anime Skin Shading
        ├─ Comic     → High Contrast Skin
        └─ Painting  → Painterly Skin
```

逻辑资产共享，表现资产允许 Variant。

```text
Character Asset
├─ Shared Mesh
├─ Shared Skeleton
├─ Shared Animation
├─ Anime Variant
├─ Realistic Variant
└─ Comic Variant
```

---

### 3.4 美术正确优先于物理正确

Anime Renderer 的验收标准不是：

> 是否符合现实世界的光学与透视。

而是：

> 这个角色在最终画面里是否仍然像优秀二维动画中的“他自己”。

因此允许：

- 非物理阴影；
- 非真实高光；
- 非线性光照响应；
- 镜头相关几何变形；
- 局部弱透视；
- 脸部特定角度修正；
- 轮廓主动调整；
- 鼻子、眼睛、嘴巴的位置与显著度随镜头变化。

---

## 4. Style-Aware Rendering

Render Style 应被视为完整视觉解释器，而不是 Shader 集合。

概念接口：

```go
// RenderStyleProfile 描述某个对象或场景使用的完整视觉规则。
// 它不仅决定材质，还负责光照解释、透视、形体修正、阴影、轮廓和后处理。
type RenderStyleProfile interface {
    // Lighting 定义该风格如何解释场景光源。
    Lighting()

    // Projection 定义该风格如何解释摄像机和透视。
    Projection()

    // GeometryCorrection 定义是否允许根据镜头对模型做非真实形变。
    GeometryCorrection()

    // Shading 定义表面最终如何着色。
    Shading()

    // Shadow 定义阴影的生成与视觉表达方式。
    Shadow()

    // Outline 定义轮廓线和内部强调线规则。
    Outline()

    // PostProcess 定义该 Style 专属的最终画面处理。
    PostProcess()
}
```

候选 Style：

```text
AnimeStyle
RealisticStyle
ComicStyle
LegoStyle
OilPaintingStyle
```

长期目标是让这些 Style 在架构层平级，而不是让 Anime 永远依赖 Realistic/PBR Render Pipeline 做补丁。

---

## 5. Anime Renderer：独立视觉物理

### 5.1 Anime Lighting 不等于 Toon PBR

传统 PBR 关注：

> 现实中的光打到这种材质后应该产生什么结果？

Anime Renderer 关注：

> 在当前光照条件下，动画导演希望这个对象如何被表现？

传统路径：

```text
Light
  ↓
Normal
  ↓
BRDF
  ↓
Roughness / Metallic / SSS
  ↓
Continuous Physical Result
```

Anime 路径：

```text
Scene Light
    ↓
Anime Light Interpreter
    ↓
Stylized Normal / Semantic Region
    ↓
Light Region Classification
 ├─ Light
 ├─ Mid
 └─ Shadow
    ↓
Art Direction Rules
    ↓
Final Anime Color
```

例如一个简单区域判断可以是：

```text
N·L > threshold
    → Character Base Color

N·L <= threshold
    → Designed Shadow Color
```

但实际实现必须进一步结合：

- Face Shadow Mask
- Hair Shadow Mask
- Body Shadow Mask
- Material Semantic
- Camera Direction
- Character Identity Profile

因此 Anime Renderer 不应该只是一个固定的 `N·L` 阶梯 Shader。

---

### 5.2 场景光首先转换为抽象光照信息

不同 Style 不应该直接共享同一套最终 BRDF 结果。

场景光先被描述成抽象 Lighting Information：

```text
Scene Light
    ↓
Lighting Semantic Layer
    ├─ Main Direction
    ├─ Intensity
    ├─ Color
    ├─ Environment
    ├─ Shadow State
    └─ Special Light Tags
          ↓
     Style Interpreter
```

然后：

```text
Realistic
    → PBR BRDF

Anime
    → Light / Mid / Shadow
    → Face Rule
    → Hair Rule
    → Rim Rule

Lego
    → Plastic-like Response

Painting
    → Painterly Response
```

这样一个太阳可以同时照亮整个世界，但不同风格用不同方式解释“太阳”。

---

## 6. Anime Projection System

Anime Style 必须拥有独立于普通相机投影的 `ProjectionProfile`。

候选类型：

```text
REALISTIC
ANIME
COMIC
CHIBI
FISHEYE
ORTHOGRAPHIC_STYLE
```

Anime Projection 不意味着抛弃 3D 摄像机，而是在标准空间计算后增加视觉修正层。

```text
3D Camera
    ↓
View Direction
    ↓
Anime Projection Controller
    ├─ Face Correction
    ├─ Eye Correction
    ├─ Nose Suppression
    ├─ Mouth Correction
    ├─ Jaw Correction
    ├─ Hair Silhouette Correction
    └─ Body Proportion Correction
          ↓
       Final Render
```

核心思想：

> 同一个角色在不同视角下，不要求严格保持完全相同的三维几何，而要求保持相同的二维视觉身份。

---

## 7. Camera-Aware Geometry

二次元角色常见问题不是模型精度不足，而是：

> 一套固定 3D 几何无法同时重现正脸、45°和侧脸的最佳二维设计。

因此允许模型保存 View-Dependent Correction。

示例：

```text
Front View
├─ Large Eye Presentation
├─ Minimal Nose
└─ Narrow Jaw

45 Degree
├─ Eye Width Correction
├─ Nose Shape Correction
├─ Mouth Offset
└─ Cheek Silhouette Correction

Side View
├─ Profile Nose
├─ Eye Side Projection
├─ Lip Simplification
└─ Jaw Profile Correction
```

第一阶段不要尝试无限自由角度的复杂 AI 形变，而应优先：

1. 定义关键视角；
2. 艺术家制作 Correction Target；
3. 根据 View Direction 平滑插值；
4. 重点保证正脸、30°、45°、60°、侧脸等关键区间稳定。

---

## 8. 系统目录

```text
style/rendering/
├─ contracts/
│  ├─ render_style/             # Style Contract
│  ├─ lighting/                 # Lighting Semantic Contract
│  ├─ projection/               # Projection Contract
│  └─ geometry_correction/      # View-dependent deformation contract
│
├─ semantic_materials/          # Skin / Hair / Metal 等语义材质
│
├─ plugins/
│  ├─ anime/
│  │  ├─ character/
│  │  ├─ environment/
│  │  ├─ lighting/
│  │  ├─ projection/
│  │  ├─ geometry_correction/
│  │  ├─ shadows/
│  │  ├─ outlines/
│  │  ├─ vfx/
│  │  └─ post_process/
│  │
│  ├─ realistic/
│  ├─ comic/
│  ├─ lego/
│  └─ painting/
│
└─ composition/                 # 不同 Style 的最终合成
```

Profile：

```text
style/profiles/
├─ anime/
├─ realistic/
├─ comic/
├─ lego/
└─ painting/
```

Unity 第一阶段：

```text
adapters/unity/rendering/
├─ core/
├─ anime/
└─ composition/
```

---

## 9. 同场景多 Style

长期允许：

```text
World
├─ Main Character      → Anime
├─ Environment         → Anime
├─ Special NPC         → Comic
├─ Toy / Brick Object  → Lego
└─ Portal World        → Oil Painting
```

它们共享：

- Transform
- Depth
- Physics
- Animation
- Visibility
- World State

但不共享最终视觉解释规则。

概念流程：

```text
Scene Geometry
      │
      ├─ Realistic Render Domain
      ├─ Anime Render Domain
      ├─ Comic Render Domain
      ├─ Lego Render Domain
      └─ Painting Render Domain
             │
             ↓
         Composition
             ↓
          Final Frame
```

需要重点解决：

- Depth / Occlusion 一致性；
- 阴影跨 Style 传播；
- 反射与间接光如何跨域；
- 后处理冲突；
- Transparent Object 排序；
- Style 边缘合成；
- VR 双眼一致性。

第一阶段不要求全部实现，但架构不能堵死这个方向。

---

## 10. Character Renderer

第一优先级。

必须独立处理：

- Face
- Skin
- Hair
- Eye
- Cloth
- Accessory

重点能力：

- Face SDF / 等价脸部阴影控制；
- 鼻影、脸颊阴影可控；
- 刘海投影与头发高光；
- 眼睛独立深度和高光规则；
- 角色不同角度下身份稳定；
- Light / Mid / Shadow / Accent 分层；
- Camera-Aware Face Correction；
- 镜头距离变化时保持视觉稳定。

---

## 11. Environment Renderer

整个世界必须共享统一动画视觉语言，而不是只给人物套 Toon Shader。

第一阶段支持约 8～12 类基础 Anime Material：

- Skin
- Hair
- Eye
- Cloth
- Metal
- Wood
- Stone
- Glass
- Water
- Vegetation

环境不必像角色一样进行复杂几何修正，但需要：

- 非写实光照响应；
- 动画式色块；
- 风格化阴影；
- 材质细节抑制；
- 稳定轮廓；
- 远景简化；
- Anime Atmosphere。

---

## 12. Shadow System

分离：

- Face Shadow
- Hair Shadow
- Body Shadow
- Environment Shadow
- Contact Shadow

阴影允许主动设计，而不是完全由真实光照决定。

尤其脸部必须具备“保护机制”：

- 逆光不允许整张脸变黑；
- 夜晚不允许真实环境光摧毁面部信息；
- 鼻子阴影必须受控；
- 眼窝不应出现写实深阴影；
- 必要时允许 Character Key Light 与 World Light 解耦。

---

## 13. Outline System

描边必须支持：

- 距离稳定；
- 角色部位差异；
- 镜头角度差异；
- 分辨率差异；
- 内外轮廓区分；
- VR 双眼一致性；
- 运动时低抖动。

最终目标不是“所有边都画黑线”，而是模拟动画中的线稿设计。

---

## 14. Animation Presentation

二次元观感不仅来自 Shader。

未来 Anime Style 应允许控制：

- Animation Sampling Style；
- Held Frames；
- Smear / Stretch；
- Impact Frame；
- Speed Line；
- Pose Exaggeration；
- Camera Timing；
- Facial Expression Override。

因此：

> Anime Renderer 长期应演进为 Anime Presentation System，而不只是 GPU Shader Package。

---

## 15. Anime VFX

目标覆盖：

- Fire
- Smoke
- Explosion
- Magic
- Water Splash
- Hit
- Slash
- Speed Line
- Impact Frame

不允许写实粒子特效直接破坏动画画风。

---

## 16. Style Profile

Anime 不应只有一个固定风格。

Profile 至少控制：

- ShadowSteps
- ShadowThreshold
- ShadowColor
- OutlineWidth
- OutlineColor
- Saturation
- Contrast
- HighlightStyle
- FaceShadowStyle
- HairHighlightStyle
- ProjectionProfile
- FaceCorrectionStrength
- GeometryCorrectionStrength
- PerspectiveStrength
- EnvironmentContrast
- Bloom
- Exposure

候选预设：

- TVAnime_Day
- TVAnime_Night
- AnimeMovie_Sunset
- AnimeIndoorWarm
- SoftAnime
- ChibiAnime

Profile 必须：

- 确定；
- 可版本化；
- 可序列化；
- 可针对角色覆盖；
- 可针对镜头覆盖。

---

## 17. 第一阶段宿主：Unity URP

Unity 负责：

- Scene
- Animation
- Physics
- Input
- VR Runtime
- 基础资源加载
- 基础 Camera / Culling / Depth

Fate Render Style System 负责视觉解释规则。

Unity Adapter 不得让 World Kernel 依赖 Unity API。

第一阶段推荐独立 Package：

```text
Packages/com.fate.render.anime/
├─ Runtime/
├─ Contracts/
├─ Shaders/
├─ Materials/
├─ RenderFeatures/
├─ Lighting/
├─ Projection/
├─ GeometryCorrection/
├─ Character/
├─ Environment/
├─ Outline/
├─ PostProcessing/
└─ Editor/
```

仓库当前先保留引擎无关设计与 Unity 适配边界，真正 Package 在实现阶段创建。

---

## 18. MVP 测试场景

第一阶段不要直接做城市。

固定测试场景：

> 一个二次元角色 + 一间日式房间 + 窗户 + 桌椅 + 金属物件 + 木材 + 石材 + 植物 + 玻璃 + 一杯水。

必须覆盖：

### 光照

- 正午
- 黄昏
- 夜间
- 室内暖光
- 背光
- 侧光

### 镜头

- 正脸
- 30°
- 45°
- 60°
- 侧脸
- 近景
- 中景
- 远景
- 镜头环绕

### 动态

- 角色移动
- 镜头移动
- 动态光源
- 表情变化

其中最重要的一组对照测试：

```text
同一个角色
    ↓
Standard PBR
    ↓
PBR + Toon
    ↓
Fate Anime Style
```

需要直观看出：

> Anime Style 的目标不是“更卡通”，而是更接近原始二维角色的视觉身份。

---

## 19. MVP 验收标准

### P0：架构成立

- World Kernel 不依赖 Anime Renderer；
- PBR/Realistic 不再被定义为唯一默认视觉模型；
- Asset 可以声明 Semantic Material；
- Object 可以显式选择 Render Style；
- Render Style 可以定义自己的 Lighting / Projection / Shading；
- Anime Style Profile 可加载；
- Unity Adapter 可以消费上述数据。

### P1：角色成立

- 角色脸部在主要镜头角度下保持稳定；
- 45°与侧脸不因严格三维几何而明显“变味”；
- 不出现明显连续 PBR 脸部阴影；
- Face / Hair / Eye 使用独立视觉规则；
- 镜头移动时描边稳定；
- 昼夜和逆光不会让脸部失去动画身份。

### P2：场景成立

- 木材、金属、石材、玻璃、水、植物拥有统一动画风格；
- 角色与环境不会明显属于两套渲染语言；
- 任意固定测试机位截图应更接近“动画截图”，而不是“普通 3D 游戏 Toon Shader”。

### P3：动态成立

- 角色移动、镜头旋转、光源变化时风格稳定；
- Camera-Aware Geometry 不发生明显跳变；
- 无明显描边抖动、阴影高频闪烁；
- VR 模式下双眼结果一致。

---

## 20. 非目标

第一阶段不做：

- 自研底层图形 API；
- 自研完整游戏引擎；
- 全功能 Realistic Renderer；
- 一次性实现所有 Style；
- 使用 AI 实时重建每一帧角色；
- 自动把任意写实资产无损转换成动画资产；
- 一开始支持所有材质类型；
- 一开始做完整城市级别验证。

---

## 21. 路线图

### Phase A — Style Contract

- Render Style Contract
- Semantic Material Contract
- Lighting Semantic Contract
- Projection Contract
- Geometry Correction Contract
- Style Profile Contract
- Unity Adapter Boundary

### Phase B — Character First

- Face
- Hair
- Eye
- Skin / Cloth
- Outline
- Key View Corrections

### Phase C — Anime Projection

- Face Camera-Aware Deformation
- Eye / Nose / Mouth Correction
- Weak Perspective / Perspective Control
- View Interpolation

### Phase D — Room

- Environment Material
- Lighting Interpreter
- Shadow
- Post Process

### Phase E — Motion & VR

- 镜头稳定性
- 动画稳定性
- 双眼一致性
- 性能预算

### Phase F — World Scale

- Outdoor
- Weather
- Water
- Vegetation
- VFX
- Large Scene

### Phase G — Multi Style

- Realistic Renderer
- Comic Renderer
- Lego Renderer
- Painting Renderer
- Mixed Style Composition
- Style Switching / Asset Variant Pipeline

---

## 22. 长期愿景

Fate Engine 的视觉层最终不是一套固定 Shader，而是一套：

> **Style-Aware Rendering / 多视觉物理系统。**

同一个三维世界拥有统一的：

- 世界坐标；
- 人物身份；
- 命运；
- 关系；
- 记忆；
- 物理状态；
- 动画；
- 世界事件；

但不同对象可以遵守完全不同的视觉规则。

真实系追求真实。

二次元追求动画观感。

漫画系追求平面构图和夸张表达。

乐高系追求玩具材料与微缩视觉。

油画系追求笔触、色彩块与画布感。

因此 Fate Engine 不把“真实”定义为唯一正确答案。

对于 Anime Style，核心目标始终是：

> **游戏空间必须是 3D 的，但最终视觉不需要被真实世界束缚。**

> **二次元本身就是被创造出来的视觉语言。3D 化的意义不是把它变真实，而是让它可以在三维世界中自由存在，同时尽可能保留二维动画最漂亮的那部分。**
