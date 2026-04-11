# Unity Runtime Host Prototype

This directory is now a minimal Unity host prototype for Fate Runtime Core.

The current product boundary is:

- Fate Engine Editor: JSON recipe authoring, validation, white-box assembly, export
- Fate Runtime Core: world truth, runtime NPC AI, fate state, intent/action, snapshot/replay
- Unity: rendering, physics, animation, DOTS/ECS execution, play mode, host bridge

The current validation slice is still the character foundation group, but the runtime direction has changed:

- walk
- run
- jump
- ladder climb
- pickup
- throw

## Unity Version

- `Unity 6 LTS`
- `6000.0.0f1`
- `com.unity.entities 1.3.x`

## Intended Runtime Data Flow

1. Author or import a JSON recipe.
2. Generate a `ScriptableObject` asset from that JSON.
3. Use Unity as the host that visualizes and simulates the imported slice.
4. Incrementally replace demo-only runtime code with Fate Runtime Core host bridge calls.
5. Keep snapshot import/export and runtime feature flags stable so the host can run with NPC AI enabled or disabled.

## Layout

- `Assets/FateUnityImporter/Runtime/`: generated runtime-facing assets, feature flags, and host prototype records
- `Assets/FateUnityImporter/Editor/`: editor-side importer and demo import entry points
- `Assets/FateUnityImporter/Authoring/`: MonoBehaviour authoring wrapper and DOTS baker bridge
- `Assets/FateDemo/DOTS/`: current DOTS validation systems and temporary runtime demo logic
- `Assets/FateDemo/Imports/`: JSON export fixtures from Fate Engine
- `Assets/FateDemo/Generated/`: generated recipe assets and placeholder bindings
- `Assets/FateDemo/Scenes/CharacterFoundationDemo.unity`: validation room scene
- `Packages/manifest.json`: Unity package lock for the demo host
