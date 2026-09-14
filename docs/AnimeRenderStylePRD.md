# Fate Anime Render Style PRD

> 状态：Draft / Architecture First
> 目标宿主：Unity + URP（第一阶段）
> 所属系统：`style/rendering/`

## 1. 背景

Fate Engine 的目标不是把二次元角色“现实化”，而是让二次元角色以原本的视觉身份进入真正的 3D 世界。

许多二次元角色的身份依赖非现实的视觉规则：眼睛比例、脸部轮廓、极简鼻口、头发色块、人工设计的脸部阴影、夸张轮廓与动作。若直接转换为写实 3D，往往会变成“长得像角色的真人”，而不是“角色本人进入三维世界”。

因此 Fate Engine 第一优先级的渲染风格不是写实，而是 Japanese Anime Style。

## 2. 产品目标

构建一个可插拔的 `Render Style System`，让 World Kernel、角色逻辑、物理、动画与视觉风格解耦。

第一款正式插件：

`Fate Anime Renderer`

目标不是普通 Toon Shader，而是完整的 Anime Rendering Pipeline：

- 角色是 3D，但视觉尽可能接近日式 2D 动画；
- 场景、建筑、植物、金属、水、玻璃、特效等也统一使用二次元视觉语言；
- 静态截图像动画画面；
- 镜头和角色运动时仍保持稳定，不因角度与动态光照快速“掉回 3D 游戏感”；
- 后续允许同一个世界切换到 Realistic / Stylized 等其他渲染插件。

一句话目标：

> 不是把二次元角色变成真人，而是让二次元角色真正进入三维世界。

## 3. 核心原则

### 3.1 World 与 Render Style 解耦

World Kernel 不知道当前是 Anime、Realistic 还是其他风格。

```text
World / NPC / Physics / Animation
              ↓
      Semantic Asset Layer
              ↓
       Render Style System
          ↙          ↘
 Anime Renderer   Realistic Renderer
```

### 3.2 资产描述“它是什么”，Renderer 决定“怎么画”

禁止世界资产直接依赖某个 Anime Shader 名称。

资产应优先声明语义材质：

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

Anime Renderer 将这些语义映射到动画材质；Realistic Renderer 未来可映射到 PBR / Hair / Skin 等写实材质。

### 3.3 逻辑资产共享，表现资产允许 Variant

Mesh、Skeleton、Animation、Collider、Gameplay State 应尽可能共享。

但不强求 Anime 与 Realistic 共用完全相同的纹理和材质。

```text
Character Asset
├─ Shared Mesh
├─ Shared Skeleton
├─ Shared Animation
├─ Anime Material Set
└─ Realistic Material Set
```

### 3.4 美术正确优先于物理正确

Anime Renderer 不追求物理光照绝对正确。

对于脸部阴影、头发高光、轮廓、阴影形状等，优先保证：

- 角色身份稳定；
- 画面符合日式动画视觉语言；
- 运动中不抖动、不跳变；
- 不因真实光照把角色脸“打坏”。

## 4. 系统架构

```text
style/rendering/
├─ contracts/               # Render Style 抽象、能力声明、切换契约
├─ semantic_materials/      # 引擎无关语义材质定义
├─ plugins/
│  └─ anime/
│     ├─ character/         # Face / Skin / Hair / Eye / Cloth / Accessory
│     ├─ environment/       # Wood / Stone / Metal / Glass / Water / Vegetation
│     ├─ lighting/          # Anime Light Interpreter
│     ├─ shadows/           # Face / Body / Environment / Contact Shadow
│     ├─ outlines/          # 距离/部位/镜头相关描边
│     ├─ vfx/               # Fire / Smoke / Explosion / Magic / Splash
│     └─ post_process/      # 色彩、曝光、Bloom 等整体画面控制
└─ README.md

style/profiles/
└─ anime/                   # Anime Style Profile 数据与预设

adapters/unity/rendering/
└─ anime/                   # Unity URP 第一阶段实现与桥接
```

## 5. 关键模块

### 5.1 Character Renderer

第一优先级。

必须独立处理：

- Face
- Skin
- Hair
- Eye
- Cloth
- Accessory

重点能力：

- Face SDF / 等价的脸部阴影控制；
- 鼻影、脸颊阴影可控；
- 刘海投影与头发高光；
- 眼睛独立深度和高光规则；
- 角色不同角度下身份稳定；
- 亮面 / 阴影面 / 强调面分层，而非连续 PBR 渐变。

### 5.2 Environment Renderer

整个世界必须共享统一动画视觉语言，而不是只给角色套 Toon Shader。

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

后续再补道路、墙面、雪、沙、云、复杂透明材质等。

### 5.3 Anime Lighting System

物理光照先进入解释层，再转换成动画式光照。

```text
Physical / Scene Light
        ↓
Anime Light Interpreter
        ↓
Stylized Light Result
```

至少需要：

- Light / Shadow 阈值；
- Shadow Color；
- Character 与 Environment 分离控制；
- 逆光、夜间、室内灯等情况下的角色脸部保护；
- 允许美术覆盖物理结果。

### 5.4 Shadow System

分离处理：

- Face Shadow
- Body Shadow
- Environment Shadow
- Contact Shadow

阴影形状允许风格化，不要求完全遵循真实光照。

### 5.5 Outline System

描边必须支持：

- 距离稳定；
- 角色部位差异；
- 镜头角度差异；
- 分辨率差异；
- VR 双眼一致性；
- 运动时低抖动。

### 5.6 Anime VFX

后续阶段实现。

目标覆盖：

- Fire
- Smoke
- Explosion
- Magic
- Water Splash
- Hit / Slash / Speed Line

不允许写实粒子特效直接破坏动画画风。

### 5.7 Style Profile

Anime 不应只有一个固定风格。

Profile 至少可控制：

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
- EnvironmentContrast
- Bloom
- Exposure

候选预设：

- TVAnime_Day
- TVAnime_Night
- AnimeMovie_Sunset
- AnimeIndoorWarm
- SoftAnime

未来允许基于动画参考图辅助生成 Profile，但 Profile 本身必须是确定、可版本化的数据。

## 6. 第一阶段宿主：Unity URP

Unity 负责：

- Scene
- Animation
- Physics
- Input
- VR Runtime
- 基础资源加载

Fate Anime Renderer 负责视觉规则。

Unity Adapter 不得让 World Kernel 依赖 Unity API。

第一阶段推荐独立 Package：

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

仓库当前先只保留引擎无关设计与 Unity 适配边界，真正 Package 在实现阶段创建。

## 7. MVP 测试场景

第一阶段不要直接做城市。

固定测试场景：

> 一个二次元角色 + 一间日式房间 + 窗户 + 桌椅 + 金属物件 + 木材 + 石材 + 植物 + 玻璃 + 一杯水。

必须覆盖：

- 正午
- 黄昏
- 夜间
- 室内暖光
- 背光
- 侧光
- 近景
- 中景
- 远景
- 角色移动
- 镜头环绕

## 8. MVP 验收标准

### P0：架构成立

- World Kernel 不依赖 Anime Renderer；
- Asset 可以通过 Semantic Material 描述材质类别；
- Render Style 可以被显式选择；
- Anime Style Profile 可加载；
- Unity Adapter 可以消费上述数据。

### P1：角色成立

- 角色脸部在主要镜头角度下保持稳定；
- 不出现明显连续 PBR 阴影；
- Face / Hair / Eye 使用独立视觉规则；
- 镜头移动时描边稳定；
- 昼夜和逆光不会让脸部失去动画身份。

### P2：场景成立

- 房间中木材、金属、石材、玻璃、水、植物拥有统一动画风格；
- 角色与环境不会明显属于两套渲染语言；
- 任意固定测试机位截图应更接近“动画截图”，而非“普通 3D 游戏 Toon Shader”。

### P3：动态成立

- 角色移动、镜头旋转、光源变化时风格稳定；
- 无明显描边抖动、阴影高频跳变；
- VR 模式下双眼结果一致。

## 9. 非目标

第一阶段不做：

- 自研底层图形 API；
- 自研完整游戏引擎；
- 全功能 Realistic Renderer；
- 自动把任意写实资产无损转换成动画资产；
- 一开始支持所有材质类型；
- 一开始做完整城市级别验证。

## 10. 路线图

### Phase A — Contract

- Render Style Contract
- Semantic Material Contract
- Style Profile Contract
- Unity Adapter Boundary

### Phase B — Character First

- Face
- Hair
- Eye
- Skin / Cloth
- Outline

### Phase C — Room

- Environment Material
- Lighting
- Shadow
- Post Process

### Phase D — Motion & VR

- 镜头稳定性
- 动画稳定性
- 双眼一致性
- 性能预算

### Phase E — World Scale

- Outdoor
- Weather
- Water
- Vegetation
- VFX
- Large Scene

### Phase F — Multi Style

- Realistic Renderer
- Stylized Renderer
- Style Switching / Asset Variant Pipeline

## 11. 长期愿景

Fate Engine 的视觉层最终不是一套固定画风，而是一套可切换的“世界表现协议”。

同一个世界可以拥有相同的：

- 人物身份；
- 命运；
- 关系；
- 记忆；
- 物理状态；
- 动画；
- 世界事件；

但通过不同 Render Style，以不同视觉语言呈现。

第一优先级始终是 Anime，因为它承担 Fate Engine 对二次元角色“身份保持”的核心目标。
