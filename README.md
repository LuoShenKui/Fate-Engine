# Fate Engine

[English](./README.md) | [简体中文](./README.zh-CN.md)

Fate Engine is currently in the prototype stage. This repository is not trying to present a complete game engine yet. The immediate goal is to prove one working loop:

- schema-first interactive content contracts
- installable and composable brick packages
- a closed workflow between editor, runtime, package flow, and replay
- reproducible local validation through explicit commands

## Vision

Fate Engine is exploring a workflow where repetitive game-production work can be reduced through reusable interactive bricks, scene templates, validation gates, and AI-assisted assembly. The long-term direction is:

`demo -> Block Protocol Cluster -> White-Box Assembly Layer -> AI agent -> Unity Host -> Infinite Fate Games`

That future state is not done yet. This repo is still focused on proving the workflow, not claiming the full destination.

## Current State

- Desktop editor prototype exists in `editor/app` using `React + Vite + Tauri`
- Brick package and lockfile flow exists in `packages/`
- Protocol contracts and shared schemas exist in `protocol/`
- Unity is the sole runtime host for the first phase
- A small Rust reference runtime and smoke checks still exist, but they are no longer the product mainline

This does **not** mean:

- a production-grade 3D engine is finished
- publisher workflows are fully productized
- long-term governance and maintenance are solved

## Repository Layout

- `runtime/`: Rust reference runtime and validation core
- `editor/`: editor frontend and desktop app
- `protocol/`: schemas, contracts, shared definitions
- `packages/`: brick packages, publish metadata, lockfiles
- `unity/`: Unity host scaffold, recipe samples, generated-data examples
- `tools/`: validation, publishing, import, and helper scripts

## Quick Start

### Reference Validation

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

These checks remain as reference validation for the repository, but the first-phase product host is Unity.

### Editor

```bash
cd editor/app
pnpm install
pnpm run typecheck
pnpm run build
pnpm run tauri:dev
```

### Unity Scaffold

The `unity/` directory is a text-only scaffold for the Unity host integration. It is meant to be copied into a real Unity project or package layout.

### Make Targets

```bash
make tauri-dev
make check-m1
make check-m2
make check-m3
make check-visual
make check-perf-scenes
```

## UI Language

The editor now defaults to English. You can switch between English and Chinese from the toolbar during runtime.

## Quality Gates

- `make check-m1`: functional and viewport interaction gate
- `make check-m2`: stability and multi-brick interaction gate
- `make check-m3`: replay consistency gate
- `make check-interaction-contract`: high-frequency interaction contract gate
- `make check-publisher-p0`: publisher P0 loop
- `make check-publisher-p1`: publish / upgrade / rollback governance loop
- `make check-visual`: visual baseline checks
- `make check-perf-scenes`: multi-scene performance checks

The acceptance threshold is defined in [docs/Editor3DTestReadiness.md](docs/Editor3DTestReadiness.md).

## Roadmap

### Phase 1: Unity White-Box Validation

- Host: Unity
- Goal: prove JSON-authored white-box assembly for the character foundation group
- Validation: recipe/schema checks, deterministic export, and Unity-side import of generated data

### Phase 2: Publisher Workflow Productization

- Goal: complete create, preview, validate, package, install, upgrade, and rollback loops
- Validation: clear `P0/P1` work from [docs/TODO.md](docs/TODO.md) and verify install/rollback in an independent demo project

### Phase 3: Template Reuse Across Projects

- Goal: convert composite bricks, zone templates, and ability packs into reusable assets instead of single-demo exceptions
- Validation: reuse one brick set across at least two different scene templates and re-run replay, validation, and install checks

### Phase 4: Engine and Ecosystem Expansion

- Goal: evolve from a demonstrable brick workspace into a sustainable content-assembly engine
- Validation: stable package ecosystem, stable templates, stable performance baselines, and a credible maintenance strategy

## Current Open Work

The single source of unfinished work is [docs/TODO.md](docs/TODO.md).

## Key Documents

- [docs/Target.md](docs/Target.md): target prototype definition
- [docs/FrameWork.md](docs/FrameWork.md): architectural constraints
- [docs/BrickContract.md](docs/BrickContract.md): brick contract
- [docs/UnityWhiteBoxPivot.md](docs/UnityWhiteBoxPivot.md): Unity host boundary and white-box flow
- [docs/Editor3DTestReadiness.md](docs/Editor3DTestReadiness.md): readiness gate
- [docs/PackageConsumeFlow.md](docs/PackageConsumeFlow.md): package publish/consume flow
- [docs/TODO.md](docs/TODO.md): open work list
