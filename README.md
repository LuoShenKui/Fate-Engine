# Fate Engine

[English](./README.md) | [简体中文](./README.zh-CN.md)

Fate Engine is an experimental next-generation game engine project.

## Phase 1 goal

The first goal is intentionally simple:

> **Open Fate Engine → New Project → choose a game category → immediately get a complete, playable Starter Project that you can continue developing.**

Choosing RPG, ARPG, FPS, Souls-like, racing, or another supported category should not create an empty project. It should create a real base game containing the fundamentals of that genre: controls, camera, gameplay, UI, animation, physics, audio, persistence where needed, and an example level.

Developers then replace, remove, extend, or rewrite those systems to build their own game.

See [docs/StarterProjects.md](docs/StarterProjects.md) and [docs/GameCategories.md](docs/GameCategories.md).

## What Phase 1 is not

A Starter Project is **not** dynamic AI game generation and it is not the future Game Assembly system.

Phase 1 is:

```text
Game Category
    ↓
Official Starter Project
    ↓
Create Project
    ↓
Playable Base Game
```

Component-driven templates, AI-assisted composition, and dynamic Game Assembly come later, after multiple real Starter Projects have proven which structures are actually reusable.

## Long-term directions

1. **World Asset System** — standardized, reusable, validated, versioned world assets.
2. **Starter Projects / Game Assembly** — complete official starting games first, deeper automation later.
3. **Fate Game System** — worlds where the original timeline is a default fate, not an unbreakable script.
4. **Anime-first Visual System** — preserve 2D anime identity inside interactive 3D worlds.
5. **Native AI Agent** — AI that understands engine tools, projects, and assets without bypassing contracts and validation.
6. **Metaverse Foundation** — long-term interoperability between independently built virtual worlds.

See [docs/Vision.md](docs/Vision.md) for the canonical vision.

## Key documents

- [docs/StarterProjects.md](docs/StarterProjects.md) — Phase 1 product goal.
- [docs/GameCategories.md](docs/GameCategories.md) — game category set.
- [docs/Architecture.md](docs/Architecture.md) — complete game-engine target architecture.
- [docs/FateAssetProtocol.md](docs/FateAssetProtocol.md) — standard asset protocol.
- [docs/Fate3DAssetStandard.md](docs/Fate3DAssetStandard.md) — 3D / glTF / GLB asset standard.
- [docs/FateHumanoidStandard.md](docs/FateHumanoidStandard.md) — humanoid compatibility standard.
- [docs/AnimeRenderStylePRD.md](docs/AnimeRenderStylePRD.md) — Anime-first visual system.
- [docs/TODO.md](docs/TODO.md) — current work queue.

## Current principles

- Fate Engine must first be capable of traditional game development.
- A normal game must be able to ignore Fate / World Will and other advanced systems entirely.
- Phase 1 focuses on making at least one category's Starter Project genuinely complete.
- A Starter Project must be playable, editable, and buildable — not merely an engine tech demo.
- Unity is the current host, not the definition of Fate Engine.
- World Assets, Anime, AI, and Fate cannot replace basic game-engine capability.

## Licensing

- **Code:** MPL-2.0
- **Documentation:** CC BY 4.0
- **Sample assets:** CC0 or CC BY 4.0, as explicitly marked
- **Third-party assets:** their respective licenses
- **Marketplace assets:** per-asset licenses and commercial terms

Commercial use is allowed. Games and applications built with Fate Engine may remain closed source. Using Fate Engine does not require publishing your game source code. If you modify Fate Engine source files covered by MPL-2.0 and distribute those modified engine files, the covered modifications must remain available under MPL-2.0.

See [LICENSE](LICENSE) and [docs/Licensing.md](docs/Licensing.md).

## Current status

The project is still very early. The repository contains prototypes from earlier experiments around Brick, World Kernel, Unity hosting, packages, assets, and Anime rendering. Those prototypes do not mean Phase 1 is complete.

Phase 1 succeeds only when:

> **New Project can select a supported game category and immediately create a real Starter Project that can be continued into an actual game.**
