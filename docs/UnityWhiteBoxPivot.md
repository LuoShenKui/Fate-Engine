# Unity White-Box Pivot

## What Fate Engine Is Now

Fate Engine is the external white-box authoring layer that sits above Unity.
It does not own rendering, physics, animation, or world execution for the mainline product path.
Unity is the sole runtime host for the first phase.

## What Fate Engine Owns

- Recipe authoring and review
- Brick/package metadata
- Validation and reproducibility checks
- AI-assisted assembly plans
- Export to Unity-facing data

## What Unity Owns

- Rendering
- Physics
- Animation
- DOTS/ECS execution
- Scene execution and play mode behavior

## Phase 1 MVP: Character Foundation

The first validation slice is the human-scale character foundation group:

- walk
- run
- jump
- ladder climb
- pickup
- throw

The goal is to prove that these behaviors can be described as white-box recipes, exported deterministically, and consumed by Unity as generated data.

## Source Of Truth Flow

1. Author or import JSON recipe data in Fate Engine.
2. Generate Unity-facing `ScriptableObject` assets from the JSON.
3. Feed the generated assets into Unity authoring components and DOTS/Baker code.
4. Keep the JSON recipe as the canonical source of truth.

## Non-Goals For This Slice

- No custom renderer
- No custom physics stack
- No replacement for Unity Editor
- No full open world yet
- No final production art pipeline

