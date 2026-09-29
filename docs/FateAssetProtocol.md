# Fate Asset Protocol v0.1

> 状态：Draft / Canonical Asset Contract
>
> 本协议定义所有 Fate Standard Asset 必须遵守的共同规则。
> 具体 3D 模型规则见 `Fate3DAssetStandard.md`；Humanoid 角色规则见 `FateHumanoidStandard.md`。

## 1. 核心原则

Fate Engine 不要求官方仓库持有所有资产本体。

> **Fate Engine 拥有资产协议、资产身份、解析规则与索引体系；资产内容可以由官方、社区、Marketplace、工作室私有仓库或第三方来源托管。**

因此必须区分：

- Asset Identity：资产是谁；
- Asset Metadata：资产是什么、怎么用；
- Asset Source：资产实际存在哪里；
- Asset Package：下载和安装的实际内容；
- Asset Registry：如何查找、解析版本和来源。

## 2. Asset Registry 与 Asset Storage 分离

推荐结构：

```text
Fate Asset Registry
        │
        ├─ Fate Official Assets
        ├─ Community Assets
        ├─ Marketplace Assets
        ├─ Studio Private Assets
        └─ Third-party Providers
```

Registry 保存资产 ID、版本、元数据、许可、依赖、兼容信息、来源地址与校验信息。

资产本体可以位于：

- Fate 官方对象存储 / CDN；
- GitHub / Release；
- Marketplace 存储；
- 用户或工作室自己的服务器；
- 私有 Registry；
- 其他受支持 Provider。

Fate Engine 不强制所有资产上传到官方服务器。

## 3. 官方资产库范围

官方资产库优先维护高复用、构成世界基础语言的资产：

- 基础 Humanoid；
- 基础 Skeleton；
- 常用 Animation；
- 门、窗、梯子、开关；
- 桌椅、柜体等基础家具；
- 墙、地面、楼梯、道路等基础建筑件；
- 树木、石块等基础环境件；
- 基础材质；
- 基础 VFX；
- 基础声音；
- 引擎测试与 fallback 资产。

高价值、特定题材、特定 IP、大体积或商业资产优先进入 Marketplace / Community / Private Repository，而不是无限膨胀官方核心资产库。

## 4. 标准资产最小结构

所有 Fate Standard Asset 必须包含以下共同信息。

### 4.1 Identity

必须：

```yaml
asset:
  id:
  version:
  name:
  type:
```

规则：

- `id` 必须稳定且全局可解析；
- 文件名不能作为唯一资产身份；
- `version` 使用明确版本规则，默认推荐 SemVer；
- `type` 必须来自注册的 Asset Type。

推荐 ID：

```text
fate.prop.door.wood.single01
fate.environment.tree.sakura01
fate.character.humanoid.female.base01
```

### 4.2 Semantic

必须能够回答“这是什么”。

```yaml
semantic:
  category:
  subtype:
  tags: []
```

语义必须服务：

- Editor 搜索；
- AI Agent 检索；
- Game Assembly；
- Compatibility 判断；
- Marketplace 分类。

### 4.3 Runtime

必须声明实际运行时入口：

```yaml
runtime:
  format:
  entry:
  sha256:
```

`sha256` 或等价完整性校验字段必须存在。

### 4.4 Compatibility

```yaml
compatibility:
  fate_asset_protocol:
  engine:
```

资产必须能够明确判断：

- 协议版本是否兼容；
- Engine 版本是否兼容；
- 依赖是否满足；
- Asset Type Contract 是否匹配。

### 4.5 Dependencies

```yaml
dependencies: []
```

依赖必须使用稳定 Asset ID + Version Constraint，不得依赖本地绝对路径。

### 4.6 Provenance

```yaml
provenance:
  author:
  source:
```

必须能够追踪资产来源。

### 4.7 License

```yaml
license:
  id:
  commercial_use:
  redistribution:
  derivatives:
  attribution:
```

没有明确许可证和使用边界的资产，不得进入 Official / Marketplace 标准索引。

### 4.8 Preview

推荐：

```yaml
preview:
  thumbnail:
```

面向 Editor / Marketplace 的资产应提供稳定预览。

## 5. 类型扩展模型

Fate Asset Protocol 采用：

```text
Common Asset Contract
        +
Asset Type Contract
```

第一批建议 Asset Type：

- ModelAsset；
- CharacterAsset；
- BuildingAsset；
- PropAsset；
- AnimationAsset；
- MaterialAsset；
- AudioAsset；
- VFXAsset；
- UIAsset；
- WorldTemplateAsset；
- GameTypeAsset；
- PluginAsset。

不同类型只要求自己的增量字段，不强迫树、音效、角色拥有完全相同的字段。

## 6. 标准包结构

推荐标准包：

```text
<asset>.fateasset
├─ manifest.json
├─ runtime/
├─ preview/
├─ source/        # 可选
└─ license/       # 可选补充材料
```

`manifest.json` 是 Fate Engine 的资产真相入口。

Runtime 文件不能取代 Manifest，Manifest 也不应复制 Runtime 格式本身已经完整表达的数据。

## 7. Resolver 工作流

```text
Asset ID
   ↓
Registry Resolve
   ↓
Version + Provider Selection
   ↓
License / Compatibility Check
   ↓
Download
   ↓
Hash Verification
   ↓
Local Content Cache
   ↓
Asset Validator
   ↓
Engine Runtime
```

## 8. Marketplace / 私有资产

Marketplace Asset 不要求采用统一开源许可证。

每个资产独立声明：

- author；
- source；
- license；
- commercial_use；
- redistribution；
- derivatives；
- attribution_required；
- marketplace_resale；
- exclusive。

私有工作室资产可以只存在于私有 Registry，只要遵循 Fate Asset Protocol 即可被 Engine / Agent / Assembly 使用。

## 9. AI Agent 约束

AI Agent 检索和组合资产时必须基于 Manifest，不允许仅凭文件名或视觉猜测决定兼容性。

Agent 至少要检查：

- Asset Type；
- Semantic；
- Compatibility；
- Dependency；
- License；
- Style；
- Spatial / Skeleton 等类型专用约束。

## 10. v0.1 非目标

- 不规定所有资产必须由 Fate 官方托管；
- 不规定所有资产必须免费；
- 不规定所有资产必须开源；
- 不规定所有创作源格式；
- 不把 Marketplace 商业条款写进 Asset Protocol；
- 不把所有类型专用字段塞进 Common Contract。

## 11. v0.1 最小 Manifest 示例

```yaml
asset:
  id: fate.prop.door.wood.single01
  version: 0.1.0
  name: Wooden Single Door
  type: PropAsset

semantic:
  category: architecture
  subtype: door
  tags: [wood, hinged, indoor]

runtime:
  format: glb
  entry: runtime/door.glb
  sha256: "..."

compatibility:
  fate_asset_protocol: ">=0.1 <0.2"
  engine: ">=0.1.0"

dependencies: []

provenance:
  author: Fate Engine
  source: fate-official

license:
  id: CC-BY-4.0
  commercial_use: true
  redistribution: true
  derivatives: true
  attribution: required

preview:
  thumbnail: preview/thumbnail.webp
```