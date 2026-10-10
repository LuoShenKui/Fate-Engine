# Fate Engine Render Graph 架构设计

> 状态：Target Architecture / Design Only（并非已实现功能）
>
> 关联：[RenderTracks.md](RenderTracks.md) · [Architecture.md](Architecture.md)
>
> 目标：让 PBR、NPR 和 Custom Style/Pass 在统一游戏引擎内有序执行，并在需要时完成同场景合成；不强制为每个 IP 单独建立房间。

## 1. 定位与非目标

Render Graph 是 **GPU 资源与渲染任务调度的有向无环图（DAG）**，不是第三种光照模型，更不能自动把任意 IP 转换成忠实的视觉外观。

- Game World / Scene / Physics / Animation：产生稳定世界事实。
- Style / Render Track：解释角色、材质、几何与画面表达；PBR 与 NPR 互不作为对方的强制 shading 底座。
- Render Graph：声明每个 Pass 的资源依赖、执行条件、生命周期与合成顺序。
- Composition / Bridge：约定跨轨道的深度、阴影、反射、透明与后处理交换。
- Host Adapter：将抽象 Pass / Resource 映射到当下宿主渲染 API；不把 Unity 等宿主永久写入核心契约。

```text
Scene / World / Animation / Asset Semantics
                     |
          Style Selection + Capabilities
             /         |         \
        PBR Style   NPR Style   Custom Extensions
             \         |         /
            Render Graph Compiler
          (validation / DAG / resource lifetime)
                     |
           Pass Execution / GPU Backend
                     |
             Composition / Present
```

Custom 是扩展方式，不预设为独立根轨。自定义 Pass 应申明所属 Track/阶段；真正的新视觉范式须另行建立 Track Contract。

## 2. 最小组成

| 概念 | 职责 |
| --- | --- |
| Graph Resource | 颜色、深度、模板、法线、运动矢量、历史缓冲等逻辑句柄；描述格式/尺寸/读写/生命周期 |
| Render Pass | 明确声明读写资源、所属渲染轨/风格、依赖、执行队列及回退 |
| Render Graph Builder | 收集 Pass，连边构图，验证非法依赖、读写冲突与未初始化读 |
| Graph Compiler | 拓扑排序，剔除无用 Pass，计算资源生命周期，计划 barrier/同步/别名优化（逐步实现） |
| Executor / Adapter | 将编译计划交给实际图形后端执行 |
| Composition Bridge | 跨风格的遮挡、颜色空间、透明、深度等合成；禁止隐式共享最终 shading 结果 |
| Diagnostics | Pass 耗时、VRAM、资源依赖可视化、缺失能力与降级原因 |

资源依赖必须显式声明；不允许插件私下修改未申明的 Render Target。可复用资源必须经过生命周期与同步验证。

## 3. 建议 Pass 阶段（非固定管线）

```text
Prepare / Culling / Scene Inputs
               |
      Depth & Visibility
               |
     +---------+-----------+
     |         |           |
 PBR Passes  NPR Passes  Custom Passes
     |         |           |
     +---------+-----------+
               |
      Composition / Bridge
               |
     Scoped Post Processing
               |
       Final Composite / UI
               |
             Present
```

- 实际执行应以资源依赖 DAG 为准；图中左右支路并不保证并行。
- 普通材质级 Custom Shader 可直接进入已有绘制阶段，不必创建独立离屏渲染链。
- 只有确需特殊 Geometry、Line、Shadow、VFX、Post-process 时才新增 Pass。
- 角色级后处理应使用 ID/Stencil/Mask 或隔离目标资源，并声明边缘混合策略，避免污染整个场景。
- 各 Track 的光照解释独立；相机/光源语义可以共享，最终 shading 不能被强制共享。

## 4. 渲染配置与角色保真

**Standard（通用）**：每个角色/材质采用 PBR、NPR 或 Custom Style/Shader；共享场景与通常的合成资源。目标是维持辨识度、色彩、轮廓、动作与美术神韵。容许有限的局部光照/效果偏差。

**Fidelity（高保真）**：在特定 IP 展示场景附加专用灯光、镜头、风格 Profile、Pass、后处理及参考画面验收。共用同一角色资产和引擎；无需强制重新加载独立渲染器。无法取得原作数据、专用算法时不能保证百分之百还原。

推荐配置优先级：`engine defaults < project style < scene profile < character/material override < camera/presentation override`。冲突必须可追踪和诊断，不能默默覆盖。

## 5. 组合难点与规则

1. **Depth / Occlusion**：定义一致的深度/投影语义；视角相关形变需明确如何参与深度与阴影。
2. **Transparency**：声明排序/合成方案；深度预通道不足以自动解决所有透明相交。
3. **Shadows / Reflection / GI**：跨风格传播必须采用显式 Bridge，允许 Fidelity/Standard 采用不同质量策略。
4. **Post-process**：区分对象局部、Track 局部与整帧阶段；TAA、Bloom、色调映射不强制属于任一 Track。
5. **Color**：明确工作色域、HDR、线性/显示域、alpha 约定与输出变换，避免颜色漂移。
6. **Temporal / VR**：声明历史资源、帧依赖、双眼一致性与不支持的降级方案。
7. **Performance**：避免每个角色一套完整离屏管线；优先批处理兼容 Pass、共享可复用中间资源，并测量显存与 GPU 时间。
8. **Security / Portability**：插件只通过受约束的 API 注册 Pass，声明平台能力；移植到不同 Host 时提供清晰回退。

## 6. 分阶段实施与验收

### Phase 0：文档和接口设计（当前）

- 保持现有 PBR/NPR 双轨语义，补充 Custom Style/Pass 与 Render Graph 契约。
- 明确资源声明、Pass 插入点、依赖检查、Composition Bridge 和后端 Adapter。
- **当前不声称 Render Graph 已经实现或运行**。

### Phase 1：基础可运行游戏场景

- 在已有宿主/编辑器能力上验证一个普通 3D 场景、材质选择、角色动画与可运行 Demo。
- 支持基础绘制阶段及最小的 Pass 插入机制，做资源读写校验。
- 验收：场景能编辑和运行；变更 Style 不影响游戏逻辑/物理。

### Phase 2：同场景双风格

- 使用合法测试资产：一个 PBR 角色与一个 NPR 角色，同一相机/房间可见。
- 为局部 Custom 效果（例如描边或独立高光）加入 Pass。
- 验收：遮挡与基础透明正确、画面稳定；提供性能基线与失败回退。

### Phase 3：Fidelity Profile

- 增加专用展示环境配置，独立灯光/后处理/镜头规则与参考图对照。
- 验收：同一角色在 Standard 与 Fidelity 间切换，资产无需转换；参考截图可重复。
- 高保真是逐资产适配与验证目标，而非对任意 IP 的自动保真承诺。

### Phase 4：高级混合与 VR（远期）

- 分步解决跨轨阴影、反射、GI、复杂透明、VR 双眼一致性、流式资源与性能预算。
- 每项独立建立基准场景、可视化诊断和回归测试。

## 7. 架构边界

Fate Engine **首先是完整的游戏引擎**。Render Graph 是 Rendering Foundation 的组件，不替代场景编辑、动画、物理、输入、脚本、构建发布流程。

不同 IP 的“房间”可以是高保真艺术配置，但**不是技术上不可跨越的隔离墙**。对于日常游戏，尽量使用轻量 Custom Pass 与统一合成；对于专属展示环境，允许更完整的视觉配置。
