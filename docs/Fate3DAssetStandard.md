# Fate 3D Asset Standard v0.1

> 状态：Draft / 3D Runtime Standard
>
> 本标准建立在 `FateAssetProtocol.md` 之上，定义 3D 模型进入 Fate Engine Runtime 前必须满足的规则。

## 1. Runtime Canonical Format

Fate Engine v0.1 的标准 3D Runtime 交换格式：

> **glTF 2.x / GLB**

默认优先单文件：

```text
*.glb
```

原因：

- 单文件方便下载、缓存、Hash 与 Marketplace 分发；
- 可表达 Mesh、Node、Material、Skin、Animation 和 Scene；
- 具有标准 Extension 机制；
- 与具体 DCC 工具解耦。

## 2. Authoring Source Format

Fate Engine 不规定唯一创作源格式。

允许 Import Pipeline 支持：

- `.blend`；
- `.fbx`；
- `.usd` / `.usda` / `.usdc`；
- `.ma` / Maya source；
- 其他受支持 DCC 格式。

标准流程：

```text
Authoring Source
      ↓
Fate Import Pipeline
      ↓
Normalize
      ↓
Validate
      ↓
Runtime GLB
```

源文件是否随资产包分发由资产作者和许可证决定。

## 3. 坐标与单位

Fate 3D Runtime Standard v0.1 统一：

- Unit：meter；
- Up：+Y；
- Forward：-Z；
- Coordinate System：Right-handed。

Importer 必须负责把源格式转换到标准空间。

禁止把不同坐标规则留到运行时临时猜测。

## 4. Transform / Pivot

所有 ModelAsset 必须声明或能够验证：

- local origin；
- pivot 语义；
- default orientation；
- default scale；
- bounds。

典型 Asset Type 可以定义自己的 Pivot Contract，例如：

- Door：hinge / center；
- Chair：floor contact center；
- Tree：root at ground；
- Weapon：grip socket origin。

## 5. Geometry

Manifest 应支持记录：

```yaml
geometry:
  triangles:
  vertices:
  bounds:
  lod:
```

Validator 应能够按 Platform Profile 检查：

- triangle budget；
- vertex budget；
- invalid geometry；
- missing normals / tangents；
- extreme bounds；
- duplicated / broken mesh。

## 6. LOD

LOD 不是所有资产 v0.1 的强制字段，但大型或高复杂度资产进入 Official / Marketplace 推荐提供。

标准应允许：

```yaml
lod:
  - level: 0
    entry:
  - level: 1
    entry:
```

未来可以支持 Runtime-generated LOD，但不得破坏资产身份和可复现性。

## 7. Collision

可交互 3D Asset 必须显式声明 Collision 策略。

```yaml
collision:
  type:
  entry:
```

允许：

- none；
- primitive；
- convex；
- compound；
- custom mesh。

Gameplay 不得默认把 Render Mesh 当作最终 Collision Mesh。

## 8. Anchors / Sockets

标准资产必须允许声明语义 Anchor / Socket：

```yaml
anchors:
  - id: interaction.main
  - id: seat.main
  - id: handle.left

sockets:
  - id: attach.top
```

名称必须稳定，并通过 Asset Type Contract 约束其语义。

它们用于：

- Interaction；
- Attachment；
- Character placement；
- AI Assembly；
- Animation alignment；
- VFX / Audio placement。

## 9. Materials

glTF Material 可以保存基础运行时材质信息，但 Fate Engine 额外使用 Semantic Material。

例如：

```yaml
materials:
  - slot: body
    semantic: wood
  - slot: handle
    semantic: metal
```

Style System 根据 Semantic Material 决定最终 Anime / Realistic / Comic 等视觉解释。

资产不能把某个具体 Host Shader 当作唯一真相。

## 10. Style Compatibility

```yaml
style_compatibility:
  - anime
  - realistic
```

Style Compatibility 表示资产是否已有足够数据支持某个 Style，不代表其他 Style 永久禁止使用。

Anime Character 可能额外依赖：

- face profile；
- color palette；
- camera correction；
- anime shadow metadata。

这些信息属于 Fate Manifest / Style Profile，不应全部硬塞进 GLB。

## 11. Animation / Skin

普通 skinned model 可使用 glTF Skin / Animation。

如果资产声明为 Humanoid Character，则必须进一步符合 `FateHumanoidStandard.md`。

非 Humanoid Rig 可以定义自己的 Rig Contract。

## 12. Extensions

Fate Engine 可以使用 glTF extension / extras，但原则是：

- 几何、Skin、Animation 等标准数据优先使用 glTF 标准能力；
- Fate 专有的 License、Marketplace、Gameplay、Semantic、Asset Version 等信息保留在 Fate Manifest；
- 只有真正需要与 glTF Runtime 紧耦合的数据才考虑 Fate glTF Extension。

避免把所有 Fate Metadata 塞入 GLB。

## 13. Validation

标准 3D Asset 至少需要验证：

- Runtime entry 可读取；
- 坐标与单位正确；
- Bounds 合理；
- Pivot 合理；
- Material slot 可解析；
- Hash 正确；
- Collision Contract 满足 Asset Type 要求；
- 必要 Anchor / Socket 存在；
- 所有外部 Resource Dependency 可解析。

## 14. 推荐包结构

```text
door.fateasset/
├─ manifest.json
├─ runtime/
│  └─ door.glb
├─ preview/
│  ├─ thumbnail.webp
│  └─ preview.webp
├─ source/          # 可选
└─ license/
```

## 15. v0.1 非目标

- 不禁止 USD / FBX 等源格式；
- 不要求所有 Runtime 数据只能存在 GLB；
- 不把 Host-specific Shader 作为标准资产接口；
- 不在 v0.1 固定所有压缩扩展；
- 不在 v0.1 定义所有角色骨架细节。