# Fate Humanoid Standard v0.1

> 状态：Draft / Character Compatibility Standard
>
> 目标：让 Character Model、Animation、Ability、Equipment、IK 与 AI Assembly 能够在不同资产之间稳定复用。

## 1. 核心原则

Humanoid 资产不能只做到“看起来像人”。

> **一个 Fate Humanoid 必须拥有可预测、可验证、可重定向的骨架语义。**

否则世界资产库中的角色、动作和装备无法真正形成积木生态。

## 2. Character Asset 必须声明

```yaml
character:
  rig_standard: FateHumanoid
  rig_version: 0.1
  rest_pose:
  height_m:
```

并至少提供：

- Root；
- Hips / Pelvis；
- Spine chain；
- Chest；
- Neck；
- Head；
- Left / Right Clavicle；
- Left / Right UpperArm；
- Left / Right LowerArm；
- Left / Right Hand；
- Left / Right UpperLeg；
- Left / Right LowerLeg；
- Left / Right Foot。

手指、脚趾、Face Rig 可以作为能力级别扩展。

## 3. Bone Identity

标准以 **语义 Bone ID** 为真相，不强制 DCC 中完全相同的显示名称。

例如：

```text
humanoid.root
humanoid.hips
humanoid.spine.01
humanoid.chest
humanoid.neck
humanoid.head
humanoid.arm.upper.left
humanoid.arm.lower.left
humanoid.hand.left
humanoid.leg.upper.left
humanoid.leg.lower.left
humanoid.foot.left
```

Importer 可以把 Blender / Maya / Mixamo / 其他 Rig 名称映射到 Fate Bone ID。

## 4. Rest Pose

v0.1 必须明确 Rest Pose。

推荐默认标准：

- T-Pose 或明确注册的 Fate Rest Pose；
- 双脚落地；
- Character facing -Z；
- Scale 为真实米制。

如果资产不是默认 Rest Pose，必须声明可重定向映射。

## 5. Scale

Character 必须声明实际高度。

```yaml
height_m: 1.65
```

禁止仅依赖模型导入后的 Bounding Box 猜测人物身高。

## 6. Mandatory Anchors / Sockets

建议 v0.1 标准 Socket：

```text
socket.head
socket.hand.left
socket.hand.right
socket.weapon.primary
socket.weapon.secondary
socket.back
socket.hip.left
socket.hip.right
socket.foot.left
socket.foot.right
anchor.eye.left
anchor.eye.right
anchor.look
```

具体 Game Type 可以扩展，但不能改变已有标准 Socket 语义。

## 7. Foot / Ground Contract

必须能够确定：

- left foot contact；
- right foot contact；
- ground reference；
- root height；
- locomotion orientation。

用于：

- IK；
- foot placement；
- climbing；
- animation retarget；
- navigation；
- VR / interaction alignment。

## 8. Hands / Grip

Character 必须至少提供左右手语义骨骼。

支持装备的角色应声明 Grip / Weapon Socket。

Weapon Asset 则通过自身 Anchor Contract 与 Character Socket 对接。

## 9. Face Capability Levels

Face Rig 不要求 v0.1 所有角色完全一致，但必须声明能力级别。

例如：

```text
none
basic
blendshape
bone
advanced_anime
```

可进一步声明：

- eye blink；
- mouth phoneme；
- brow；
- gaze；
- expression set。

Anime Character 可以额外绑定 Anime Character Profile。

## 10. Animation Compatibility

AnimationAsset 必须声明：

```yaml
animation:
  rig_compatibility:
    - FateHumanoid@0.1
```

如果 Clip 依赖额外能力，也必须声明，例如：

- fingers；
- face；
- weapon socket；
- root motion；
- IK target。

这样 Agent / Editor 才能在应用动画前做兼容检查。

## 11. Root Motion

Animation 必须显式声明：

```text
root_motion: none | translation | translation_rotation
```

禁止靠运行时猜测。

## 12. Retarget

Retarget Pipeline 至少需要：

- Bone ID Mapping；
- Rest Pose normalization；
- Character Scale；
- Limb proportion correction；
- Root Motion mapping；
- Foot contact validation。

v0.1 不要求自动解决所有极端体型。

## 13. Anime-specific Character Metadata

Anime Character 的视觉身份不只来自骨架。

可以额外绑定：

```yaml
anime_profile:
  color_palette:
  skin_palette:
  hair_palette:
  eye_profile:
  face_proportion:
  shadow_profile:
  projection_profile:
  expression_range:
  motion_exaggeration:
  animation_timing:
```

这些字段属于 Anime Style / Character Profile，不改变 FateHumanoid 骨架兼容标准。

## 14. Character Validator

Humanoid 导入时至少检查：

- 必要 Bone ID 是否完整；
- 左右骨骼是否映射正确；
- Scale 是否合理；
- Rest Pose 是否可识别；
- Root / Hips 是否存在；
- Foot / Hand 是否可解析；
- Socket 是否满足声明的 Character Capability；
- Animation Compatibility 是否真实成立。

## 15. v0.1 非目标

- 不要求所有角色拥有统一拓扑；
- 不要求所有角色拥有相同 Face Rig；
- 不要求所有角色拥有相同身材比例；
- 不要求写实角色和 Anime 角色使用同一视觉 Profile；
- 不强制创作工具使用固定 Bone Display Name；
- 不在 v0.1 解决所有非人类角色。

## 16. 后续扩展

未来可以增加：

- FateQuadruped；
- FateCreature；
- FateVehicleRig；
- FateAnimeFace Standard；
- FateHand / Finger Standard；
- Equipment Attachment Standard。