# Fate Engine Game Categories v0.1

> 状态：Draft / Classification Only
>
> 本文只定义 Fate Engine 当前使用的游戏类型分类集合。
> **它不是动态 Game Assembly 协议；第一阶段它会用于 New Project 的类型选择，并逐步绑定官方 Starter Project。**

## 1. 当前原则

当前阶段 Game Category 有四个用途：

1. New Project 时让用户选择主要游戏类型；
2. 绑定该类型的官方 Starter Project；
3. 给项目标记主要游戏类型；
4. 整理 Engine Capability、Asset 与测试覆盖。

当前阶段明确不做：

- 根据分类动态组合一个全新游戏；
- 复杂 Game Type 继承树；
- AI 自动选择大量组件生成完整游戏；
- 为所有分类同时开发半成品 Starter。

## 2. Game Category Tuple

v0.1 暂定为一个可选集合：

```text
GAME_CATEGORIES = (
  "3d_rpg",
  "2d_rpg",
  "arpg",
  "soulslike",
  "fps",
  "tps",
  "action_adventure",
  "2d_platformer",
  "3d_platformer",
  "racing",
  "vehicle",
  "sports_ball",
  "fighting",
  "survival",
  "sandbox",
  "simulation",
  "strategy_rts",
  "strategy_turn_based",
  "tactics",
  "moba",
  "mmorpg",
  "visual_novel",
  "card",
  "puzzle",
  "rhythm",
  "party",
  "other"
)
```

## 3. 分类语义

| ID | 含义 |
| --- | --- |
| `3d_rpg` | 以 3D 世界、角色成长、任务/探索为主要结构的 RPG |
| `2d_rpg` | 以 2D 表现为主的 RPG |
| `arpg` | 实时动作战斗驱动的 RPG |
| `soulslike` | 强调锁定、体力、闪避/格挡、死亡惩罚、关卡探索等特征的动作类型 |
| `fps` | 第一人称射击 |
| `tps` | 第三人称射击 |
| `action_adventure` | 动作 + 探索 / 叙事驱动 |
| `2d_platformer` | 2D 平台跳跃 |
| `3d_platformer` | 3D 平台跳跃 |
| `racing` | 以竞速为核心目标 |
| `vehicle` | 车辆 / 飞行器 / 船舶等载具操控为核心 |
| `sports_ball` | 足球、篮球、网球、棒球等球类 / 体育游戏 |
| `fighting` | 格斗游戏 |
| `survival` | 生存资源循环 |
| `sandbox` | 沙盒 / 高自由度系统交互 |
| `simulation` | 经营、生活、城市等模拟类 |
| `strategy_rts` | 即时战略 |
| `strategy_turn_based` | 回合制战略 |
| `tactics` | 战棋 / 小队战术 |
| `moba` | MOBA |
| `mmorpg` | 大型多人在线 RPG |
| `visual_novel` | 视觉小说 / AVG |
| `card` | 卡牌类 |
| `puzzle` | 解谜类 |
| `rhythm` | 音乐 / 节奏类 |
| `party` | 聚会 / 多人轻量玩法 |
| `other` | 尚未纳入分类的类型 |

## 4. 使用方式

一个项目当前只需要声明一个主要分类：

```yaml
project:
  game_category: arpg
```

如果一个游戏横跨多个类型，v0.1 仍只选一个最能代表核心玩法的 `game_category`。

其他特征暂时使用普通 tags：

```yaml
project:
  game_category: 3d_rpg
  tags:
    - open_world
    - anime
    - multiplayer
```

这样可以避免现在过早设计复杂的多继承 Game Type 系统。

## 5. Fate Game 的位置

`Fate` 当前不作为和 FPS / RPG / Racing 完全同层的基础控制类型。

Fate 更接近一种建立在普通游戏类型上的高级世界 / 叙事系统，例如：

```text
3d_rpg + fate
arpg + fate
simulation + fate
```

因此当前建议：

```yaml
project:
  game_category: arpg
  features:
    - fate_world
```

后续如果 Fate Game 形成稳定、独立的产品形态，再决定是否升级为正式 Game Type。

## 6. Starter Project 支持状态

每个 Game Category 可以有：

```text
unsupported
experimental
starter_available
```

`starter_available` 表示：用户可以在 New Project 中选择该类型，并直接创建一个完整可运行、可试玩、可继续开发的官方 Starter Project。

第一阶段策略：

> **类型集合可以先完整定义，但 Starter Project 必须一个一个做实。**

不会为了数量同时维护大量半成品。

Starter Project 的详细要求见 `StarterProjects.md`。

## 7. v0.1 非目标

- 不追求分类学绝对正确；
- 不处理所有混合类型；
- 不定义各类型完整组件集合；
- 不要求 Engine 当前支持所有分类；
- 不在 v0.1 设计动态 Game Assembly；
- New Project 可以根据分类选择对应 Starter Project。