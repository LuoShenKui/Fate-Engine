# Fate Engine

[English](./README.md) | [简体中文](./README.zh-CN.md)

Fate Engine is an experimental next-generation game engine project.

Its long-term goal is not a single renderer, story system, or AI generator. Fate Engine combines **standardized world assets, automatic game assembly, dynamic fate-driven worlds, an Anime-first visual system, and native AI agents** into one game-production architecture, with an eventual path toward an interoperable virtual-world runtime.

## Six long-term pillars

1. **World Asset System** — a standardized, reusable library of world building blocks.
2. **Game Assembly System** — select a game type, components, plugins, and world templates to produce a playable demo that developers can continue refining.
3. **Fate Game System** — convert source material such as animation, novels, and comics into a default fate-driven world whose original timeline can be changed through real causality.
4. **Anime-first Visual System** — anime characters are first-class citizens; 3D presentation should preserve the identity, colors, motion, expression, and camera language of 2D animation as closely as possible.
5. **Native AI Agent** — agents natively understand, retrieve, assemble, configure, and validate standardized assets instead of treating on-demand asset generation as the only workflow.
6. **Metaverse Foundation** — over the long term, enable independently built game worlds to interoperate through shared asset, identity, state, and runtime protocols.

See [docs/Vision.md](docs/Vision.md) for the canonical vision.

## Current architecture

- `core/`: World Kernel — causality, fate, world will, time, identity, relationships, memory, permissions, and state.
- `systems/`: Character, Brick, and country/region-specific social systems.
- `asset/`: engine-independent standardized world asset descriptions.
- `simulation/`: NPC schedules, needs, behavior, population, and simulation LOD.
- `narrative/`: events, default timelines, conditions, and consequences.
- `world/`: concrete world templates, locations, characters, factions, and rules.
- `pipeline/`: source material / assets to playable-world production pipeline.
- `ai/`: builder agents, character agents, and supporting AI capabilities.
- `style/` / `render/`: Anime-first and other visual style rules.
- `runtime/`: event bus, scheduling, save, snapshot, and replay.
- `adapters/` / `unity/`: host boundaries; Unity is the first-stage host.
- `editor/`: primary human/agent authoring surface.
- `protocol/`: cross-module schemas, contracts, and version boundaries.

See [docs/Architecture.md](docs/Architecture.md) for the canonical technical architecture.

## Documentation

- [docs/README.md](docs/README.md) — documentation map and ownership rules.
- [docs/Vision.md](docs/Vision.md) — canonical project vision.
- [docs/Architecture.md](docs/Architecture.md) — canonical architecture.
- [docs/AnimeRenderStylePRD.md](docs/AnimeRenderStylePRD.md) — Anime-first rendering and presentation.
- [systems/brick/docs/BrickContract.md](systems/brick/docs/BrickContract.md) — Brick / asset assembly contract.
- [docs/TODO.md](docs/TODO.md) — current unfinished work.

## Key principles

- Unity is a host, not the definition of Fate Engine.
- Brick is important, but Brick is not Fate Engine.
- The World Kernel is important, but it is not the whole engine.
- Anime is the first visual citizen, but Fate Engine is not merely a renderer.
- AI should primarily compose standardized assets under validators, world rules, licensing, and version constraints.
- Original storylines are default fate lines, not unbreakable rails.

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