# Unity XR Host Prototype

This directory is now the Unity `PCVR host prototype` for Fate Runtime Core. The host direction has moved away from the flat character-foundation validation room and toward an `XR Base Hall Demo` that acts as the first version of the infinite-room player base.

The current product boundary is:

- Fate Engine Editor: authoring, validation, narrative debug, AI-assisted assembly, local narrative tooling
- Fate Runtime Core: world truth, runtime NPC AI, fate state, intent/action, snapshot/replay, dialogue/task/fate execution
- Unity XR Host: OpenXR startup, XR rig state, XR interactions, hall scene shell, rendering, physics, animation, UI, host bridge

The current XR validation slice is:

- PCVR only
- OpenXR + XR Interaction Toolkit + Input System
- Base hall spawn point
- Central godlight interaction shell
- Shop shell
- Expansion gate anchors
- Avatar bay shell

## Unity Version

- `Unity 6 LTS`
- `6000.0.0f1`
- `com.unity.entities 1.3.x`
- `com.unity.xr.openxr 1.14.x`
- `com.unity.xr.interaction.toolkit 3.0.x`

## Intended Runtime Data Flow

1. Author or import runtime-facing data and narrative fixtures.
2. Generate `ScriptableObject` assets or runtime records for the Unity host.
3. Initialize Unity as a PCVR OpenXR host with a base hall shell scene.
4. Mirror XR rig state and interaction events into Fate Runtime Core host records.
5. Keep snapshot import/export, narrative state, and runtime feature flags stable so the hall can run with NPC AI enabled or disabled.

## Layout

- `Assets/FateUnityImporter/Runtime/`: generated runtime-facing assets, feature flags, and host prototype records
- `Assets/FateUnityImporter/Editor/`: editor-side importer and demo import entry points
- `Assets/FateUnityImporter/Authoring/`: MonoBehaviour authoring wrapper and DOTS baker bridge
- `Assets/FateDemo/DOTS/`: legacy flat validation systems kept as compatibility fixtures
- `Assets/FateDemo/XR/`: XR host layer, hall shell bootstrap, and avatar contracts
- `Assets/FateDemo/Imports/`: JSON export fixtures from Fate Engine
- `Assets/FateDemo/Generated/`: generated recipe assets and placeholder bindings
- `Assets/FateDemo/Scenes/`: host scenes and future XR hall scenes
- `Packages/manifest.json`: Unity package lock for the XR host
