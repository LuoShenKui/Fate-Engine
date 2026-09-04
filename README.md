# Fate Engine

[English](./README.md) | [简体中文](./README.zh-CN.md)

Fate Engine is still a prototype, but the architecture is no longer centered on a brick-assembly engine. The project is now organized around an **engine-independent World Kernel for causality, fate, social systems, and long-running simulation**.

The root architecture covers:

- causality;
- fate links, rewrite, and severing;
- world-will narrative attractors with strict causal limits;
- reusable social systems such as school, police, justice, hospital, company, family, and economy;
- NPC schedules, needs, behavior, memory, identity, population, and simulation LOD;
- narrative timelines as default fate lines rather than forced scripts;
- independent anime / semi-realistic / realistic style profiles;
- replaceable Unity / Unreal / custom-renderer adapters.

## Brick: fast 3D scene assembly subsystem

The original Brick system is preserved, but it no longer defines Fate Engine itself.

Brick has one focused job: **assemble reusable interactions, 3D assets, ability sets, and composite templates into playable 3D scenes with as little repeated work as possible — ideally through one-click or parameterized construction.**

Doors, ladders, switches, pickups, building parts, classrooms, streets, cabins, and other reusable scene structures can be composed from Brick/Template packages. Brick answers “how do we build the world faster?”, while Core and the social systems answer “how does this world actually behave?”

Therefore:

- `core/` and social systems own world rules, causality, and fate.
- `systems/brick/` owns fast 3D scene and interaction assembly.
- Unity currently owns final rendering, physics, animation, and VR presentation.

Canonical locations:

- `systems/brick/packages/`: brick packages, publish metadata, and lockfile.
- `systems/brick/docs/BrickContract.md`: Brick contract.
- `packages`: temporary compatibility entry for existing tooling and scripts.

Existing Brick editor UI, shared schemas, reference runtime integrations, and Unity import code remain in place for now and are treated as callers/adapters of the Brick subsystem.

## Repository layout

- `core/`: causality, fate, world will, time, identity, relationships, memory, permissions, state.
- `systems/`: reusable social/gameplay systems; Brick is one subsystem.
- `simulation/`: NPC, schedules, needs, behavior, population, simulation LOD.
- `narrative/`: events, default timeline, conditions, consequences, generators.
- `world/`: templates, locations, characters, factions, rules, bootstrap.
- `style/`: character morphology, rendering, animation, camera, style profiles.
- `ai/`: character agents, dialogue, planning, world building, asset-generation interface, lore parsing.
- `asset/`: engine-independent asset descriptions.
- `runtime/`: world runtime, event bus, scheduler, save, snapshots; legacy reference runtime remains.
- `adapters/`: Unity, Unreal, and future custom-renderer boundaries.
- `editor/`, `protocol/`, `unity/`, `tools/`, `tests/`: current host/tooling layers.

See [docs/Architecture.md](docs/Architecture.md) for the canonical architecture.

## Engineering rules

1. World Kernel comes before a custom renderer.
2. Core world logic must not depend on Unity APIs.
3. Systems use explicit contracts instead of a monolithic World class.
4. Important actions must close the loop from input to state change to causality to future consequences.
5. World Will may repair accidents but cannot override sufficient causality.
6. Brick is specifically for fast/one-click 3D scene and interaction assembly; it does not own causality, fate, or social rules.

## Quick start

```bash
python3 tools/validate_schemas.py
python3 tools/check_protocol_contract.py
python3 tools/check_interaction_contract.py
python3 tools/check_publisher_p0.py
python3 tools/check_publisher_p1.py
cargo test --manifest-path runtime/door_core/Cargo.toml
cmake -S . -B build
cmake --build build
```

Editor:

```bash
cd editor/app
pnpm install
pnpm run typecheck
pnpm run build
pnpm run tauri:dev
```
