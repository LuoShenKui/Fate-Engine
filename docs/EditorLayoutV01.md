# Fate Engine Editor Layout v0.1

> 状态：Phase 1 Editor Specification
>
> 本文定义 Fate Engine 0.1 的默认编辑器布局、面板职责、基础交互与验收边界。
> 目标不是创造一套陌生 UI，而是采用 Unity / Unreal / CryEngine 已经验证过的主流游戏编辑器工作流，让开发者下载 Fate Engine 后可以立即开始传统游戏开发。

## 1. 0.1 核心目标

Fate Engine 0.1 必须首先是一套可以正常工作的游戏编辑器。

最小闭环：

```text
Download / Install
      ↓
Open Fate Engine
      ↓
New Project
      ↓
Select Game Category / Starter Project
      ↓
Open Scene
      ↓
Edit Objects / Assets / Components
      ↓
Save
      ↓
Play / Stop
      ↓
Build
      ↓
Runnable Game
```

0.1 的验收重点不是 Fate、AI、World Will 或复杂 Assembly，而是：

> **开发者是否可以把 Fate Engine 当作正常游戏引擎使用。**

## 2. 默认布局

默认采用主流游戏编辑器的经典结构：

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Menu Bar: File Edit Assets GameObject Component Window Help                │
├─────────────────────────────────────────────────────────────────────────────┤
│ Toolbar: Select Move Rotate Scale | Local/World | Play Pause Stop | Build   │
├──────────────────┬──────────────────────────────────────┬───────────────────┤
│                  │                                      │                   │
│    Hierarchy     │                                      │    Inspector      │
│                  │              Viewport                │                   │
│  Scene Objects   │                                      │   Components      │
│                  │                                      │   Properties      │
│                  │                                      │                   │
├──────────────────┴──────────────────────────────────────┴───────────────────┤
│ Project / Assets                                   Console / Problems       │
└─────────────────────────────────────────────────────────────────────────────┘
```

默认布局应适合 16:9 桌面显示器。

0.1 可以先固定布局；Dock / Detach / 多屏布局属于后续增强，但面板设计必须预留 Dockable Panel 边界。

## 3. Menu Bar

### 3.1 File

```text
File
├─ New Project
├─ Open Project
├─ Recent Projects
├─ New Scene
├─ Open Scene
├─ Save
├─ Save Scene
├─ Save All
├─ Build
└─ Exit
```

0.1 必须真正可用：

- New Project；
- Open Project；
- Save / Save Scene；
- Build；
- Recent Projects。

### 3.2 Edit

```text
Edit
├─ Undo
├─ Redo
├─ Cut
├─ Copy
├─ Paste
├─ Duplicate
├─ Delete
└─ Preferences
```

Undo / Redo 必须覆盖至少：

- Transform；
- 创建 / 删除对象；
- Component 属性修改；
- Hierarchy 父子关系调整。

### 3.3 Assets

```text
Assets
├─ Import
├─ Create
├─ Reimport
├─ Show in Project
└─ Refresh
```

0.1 只要求 Local Project Assets。

Official Asset Registry、Marketplace、Community Assets 后置。

### 3.4 GameObject

```text
GameObject
├─ Create Empty
├─ 3D Object
│  ├─ Cube
│  ├─ Sphere
│  ├─ Capsule
│  ├─ Plane
│  └─ Light
├─ Camera
└─ Delete
```

后续可以扩展：

- Character；
- Audio Source；
- UI；
- VFX；
- Fate-specific objects。

### 3.5 Component

```text
Component
├─ Add Component
└─ Remove Component
```

Component 菜单和 Inspector 的 Add Component 必须使用同一套 Registry。

### 3.6 Window

```text
Window
├─ Hierarchy
├─ Inspector
├─ Project
├─ Console
├─ Scene
├─ Game
├─ Validation
├─ Reset Layout
└─ Advanced
   ├─ Brick Library
   ├─ Composer
   ├─ Narrative
   └─ Fate
```

0.1 默认隐藏 Advanced 工具，避免旧原型功能污染传统游戏开发主流程。

## 4. Toolbar

0.1 Toolbar 保持克制。

```text
[Select] [Move] [Rotate] [Scale]
[Local / World]
[Grid Snap]
[Play] [Pause] [Stop]
[Build]
```

推荐快捷键：

| 操作 | 快捷键 |
| --- | --- |
| Select | Q |
| Move | W |
| Rotate | E |
| Scale | R |
| Focus Selected | F |
| Duplicate | Ctrl/Cmd + D |
| Save | Ctrl/Cmd + S |
| Play / Stop | Ctrl/Cmd + P 或独立按钮 |
| Delete | Delete / Backspace |

快捷键必须可配置，0.1 可以先提供默认值。

## 5. Hierarchy

Hierarchy 表示当前 Scene 的对象树。

示例：

```text
SampleScene
├─ Main Camera
├─ Directional Light
├─ Player
│  ├─ Model
│  └─ CameraTarget
├─ Environment
│  ├─ Ground
│  └─ Building
└─ Enemies
```

### 5.1 0.1 必须支持

- Select；
- Multi-select；
- Rename；
- Create；
- Delete；
- Duplicate；
- Parent / Unparent；
- Drag reorder；
- Search；
- Active / Hidden 状态；
- 与 Viewport selection 同步。

### 5.2 规则

Hierarchy 显示的是 Scene Entity / GameObject，不是文件系统，也不是 Asset Browser。

用户点击对象：

```text
Hierarchy Selection
      ↓
Viewport Highlight
      ↓
Inspector Displays Components
```

三者必须保持一致。

## 6. Scene Viewport

Viewport 是 Fate Engine Editor 的核心工作区。

当前旧 Graph Canvas 不应继续作为默认编辑器中心。

### 6.1 视图模式

0.1 至少支持：

- Perspective；
- Top；
- Front；
- Side。

### 6.2 摄像机操作

至少支持：

- Orbit；
- Pan；
- Zoom；
- Fly / FPS navigation；
- Focus Selected；
- Frame All。

### 6.3 Object Selection

必须支持：

- 点击 Mesh / Collider 选择对象；
- Hierarchy 同步；
- Selection outline / highlight；
- 空白点击取消选择。

### 6.4 Transform Gizmo

支持：

- Move；
- Rotate；
- Scale；
- Local / World；
- Grid Snap。

所有 Transform 操作必须：

- 实时更新 Inspector；
- 可 Undo / Redo；
- 保存进入 Scene 数据。

### 6.5 Drag & Drop

Project / Assets 中的可实例化资产应该可以拖入 Viewport。

例如：

```text
Assets/Models/crate.glb
      ↓ drag
Viewport
      ↓
Create Entity
      ↓
Hierarchy + Inspector
```

## 7. Scene / Game 两种主模式

采用传统游戏引擎习惯：

```text
Scene | Game
```

### 7.1 Scene

用于编辑：

- 自由 Editor Camera；
- Gizmo；
- Selection；
- Object manipulation；
- Debug overlays。

### 7.2 Game

显示真正 Runtime Camera 输出。

### 7.3 Play State

```text
Edit Mode
   ↓ Play
Play Mode
   ↓ Pause
Paused
   ↓ Stop
Edit Mode
```

Stop 后默认恢复进入 Play 前的编辑状态。

Runtime 修改是否回写编辑数据，0.1 默认不回写，后续可增加 Apply Changes。

## 8. Inspector

Inspector 采用 Entity / GameObject + Component 模型。

示例：

```text
Player

Transform
  Position
  Rotation
  Scale

Character Controller
  Radius
  Height
  Step Offset

Player Movement
  Walk Speed
  Run Speed
  Jump Height

Animator
  Controller

[ + Add Component ]
```

### 8.1 0.1 必须支持

- 展示当前对象全部 Components；
- 编辑 Component 属性；
- Add Component；
- Remove Component；
- Enable / Disable Component；
- Reset Component；
- 多对象选择时显示可安全批量编辑的共同属性。

### 8.2 第一批通用 Components

0.1 至少需要：

- Transform；
- Camera；
- Light；
- Mesh Renderer / Renderable；
- Collider；
- Rigidbody / Physics Body；
- Audio Source；
- Script / Gameplay Component；
- Character Controller（如果首个 Starter 需要）。

内部可以使用 ECS、DOTS 或其他 Runtime 模型，但 Editor UX 不应要求普通开发者直接理解底层 ECS。

## 9. Project / Assets

Project 面板负责当前游戏工程的文件和资产。

推荐布局：

```text
Assets
├─ Scenes
├─ Characters
├─ Models
├─ Materials
├─ Textures
├─ Animations
├─ Audio
├─ Scripts
├─ Prefabs
└─ UI
```

### 9.1 0.1 必须支持

- Folder tree；
- Grid / List；
- Search；
- Type filter；
- Import；
- Rename；
- Duplicate；
- Delete；
- Thumbnail；
- Drag to Viewport；
- 双击打开可编辑 Asset。

### 9.2 资产范围

0.1 只要求：

> **Local Project Assets**

后续再加入：

```text
Local
Official
Community
Marketplace
Private Registry
```

## 10. Console / Problems

底部必须有稳定的问题入口。

默认 Tabs：

```text
Console | Problems
```

Console 支持：

- Log；
- Warning；
- Error；
- Clear；
- Collapse；
- Filter。

Problems 用于：

- Asset import errors；
- Missing dependency；
- Invalid Scene reference；
- Build errors；
- Validator errors。

错误如果关联对象或文件，应允许：

```text
Double Click Error
      ↓
Select Entity / Asset / File
```

现有 ValidationPanel 可以逐步收敛到 Problems。

## 11. Project Creation

0.1 的 New Project 是产品入口之一。

界面至少包含：

```text
New Project

Project Name
Location

Game Category
  ○ 3D RPG
  ○ ARPG
  ○ FPS
  ○ ...

Starter Project
  ○ Empty
  ○ Official Starter

[Create]
```

Game Category 来自 `GameCategories.md`。

只有状态为 `starter_available` 的类型显示可用 Official Starter。

创建后：

1. 生成独立项目目录；
2. 生成 Project ID；
3. 写入项目配置；
4. 安装 / 拷贝 Starter Project 内容；
5. 打开默认 Scene；
6. 用户可以立即 Play。

## 12. Project 数据边界

Editor 不应把项目状态锁死在 Editor UI 内部。

至少需要清晰的 Project 数据结构：

```text
MyGame/
├─ ProjectSettings/
├─ Assets/
├─ Scenes/
├─ Packages/
├─ Temp/            # 可重新生成
└─ Build/
```

具体物理目录后续可以调整，但必须满足：

- 项目可移动；
- 不依赖开发机绝对路径；
- 可进入 Git；
- 可从另一台机器重新打开；
- Temp / Cache 可删除重建。

## 13. Save

0.1 必须有可靠保存语义。

需要区分：

- Project Settings；
- Scene；
- Asset metadata；
- Editor layout / preferences。

最少支持：

- Save；
- Save Scene；
- Save All；
- Dirty state；
- 关闭未保存项目时提示。

## 14. Build

0.1 至少需要一个正式 Build 流程。

```text
Build Settings
├─ Target Platform
├─ Scenes
├─ Output Directory
└─ Build
```

第一阶段可以只完整支持一个桌面目标平台，再逐步扩展。

Build 输出必须是可直接启动的游戏，而不是只能从 Editor 内运行。

## 15. 现有 Editor 组件迁移映射

当前代码不推倒重来，优先复用。

| 当前模块 | 0.1 目标 |
| --- | --- |
| `AppTopToolbar` / toolbar config | 收敛成标准 Toolbar |
| `GraphCanvasPanel` | 从默认中心降级；逐步替换为 Scene Viewport |
| `PropertyInspectorPanel` | 升级为正式 Inspector |
| `AssetLibraryPanel` | 收敛为 Project / Assets |
| `ValidationPanel` | 合并 / 映射为 Problems |
| `DebugToolbar` | 收敛到 Toolbar / Window |
| `SceneSamplesPanel` | 迁移为 Starter / Sample Scene 辅助 |
| `BrickLibraryPanel` | Advanced Window，默认隐藏 |
| `ComposerPanel` | Advanced Window，默认隐藏 |
| `NarrativeDebugPanel` | Advanced Window，默认隐藏 |
| `UnityExportPanel` | Host / Build 工具，不占主布局 |
| `InstallReportPanel` | Package / Advanced 工具 |

## 16. 0.1 默认隐藏的 FateEngine 高级能力

以下功能可以继续保留代码和实验，但不能占据默认 UI 主流程：

- Fate；
- World Will；
- Narrative；
- Japan Simulation；
- AI World Builder；
- Brick Assembly；
- Complex Composer；
- Metaverse；
- Marketplace。

未来统一从：

```text
Window → Advanced
```

或独立 Workspace 进入。

原则：

> **普通游戏开发者第一次打开 Fate Engine，应该看到一个正常游戏引擎，而不是一套 Fate 专用工具。**

## 17. 0.1 明确后置

以下不属于 Editor 0.1 阻塞项：

- 自由 Dock / 多显示器高级布局；
- Blueprint / Visual Scripting 完整系统；
- Shader Graph；
- Terrain Editor；
- Animation State Machine 专业编辑器；
- Profiler 完整版；
- Multiplayer Debugger；
- Marketplace；
- AI Agent Workspace；
- Game Assembly；
- Anime 专用编辑器；
- Fate 专用编辑器。

这些以后按 Starter Project 的真实需求增加。

## 18. 0.1 验收流程

必须能够真实完成：

```text
1. 安装 / 解压 Fate Engine
2. 启动 Editor
3. New Project
4. 选择一个可支持的 Game Category
5. 创建项目
6. 自动打开默认 Scene
7. Hierarchy 选择对象
8. Viewport 移动 / 旋转 / 缩放对象
9. Inspector 修改属性
10. 从 Project 拖入一个 Asset
11. 保存 Scene
12. Play
13. Stop
14. 修改后再次 Play
15. Build
16. 启动构建后的游戏
17. 关闭 Editor
18. 再次打开同一项目
19. 项目状态完整恢复
```

以上任意关键步骤无法完成，都不能称为 Fate Engine 0.1 Editor Foundation 完成。

## 19. 0.1 产品定义

Fate Engine 0.1 不以“实现多少未来系统”为完成标准。

完成标准只有：

> **开发者可以把 Fate Engine 下载下来，当作一套正常游戏引擎，从新建项目开始完成场景编辑、资产使用、Play、保存和 Build，并继续开发自己的游戏。**

Starter Project 是第一阶段降低起步成本的主要方式。

Fate、Anime、AI、World Asset、Assembly 等差异化能力在此基础上逐步接入，而不能反过来阻塞最基础的游戏开发闭环。