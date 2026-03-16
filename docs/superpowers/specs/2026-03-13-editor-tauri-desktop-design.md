# Editor Tauri Desktop Design

**Date:** 2026-03-13

## Goal

Replace the current browser-only editor preview with a local desktop application built on `React + TypeScript + Vite + Tauri`, targeting macOS and Windows. The editor must stop depending on CDN-hosted React modules and static `http.server` preview flow.

## Current Problems

- `editor/app` is served as a static web preview rather than a desktop application.
- `editor/app/index.html` depends on `https://esm.sh/...` import maps, which can cause blank screens when network access fails.
- The current `tsc + python3 -m http.server` flow is fragile for browser module resolution and is not suitable as the long-term desktop development path.
- The repository documentation already treats the editor as a long-lived product surface, but the build and runtime model are still prototype-grade.

## Proposed Architecture

### Frontend

Keep `editor/app/src` as the main React frontend source tree. Replace the static preview build with a standard local Vite pipeline.

- Add `vite.config.ts` as the canonical frontend build configuration.
- Keep `src/main.tsx` and `src/ui/*` as the entry and UI module tree.
- Remove the `esm.sh` import-map dependency from `index.html`.
- Use Vite dev/build output as the source for Tauri during both development and packaging.

### Desktop Shell

Add a minimal Tauri shell under `editor/app/src-tauri`.

- Single window desktop app.
- macOS and Windows build targets.
- No custom commands in the first phase.
- No updater, signing, or release automation in this migration.

The shell’s purpose is to host the existing editor UI with a stable local runtime, not to expand native capabilities yet.

### Runtime Boundaries

- React frontend remains responsible for editor UI, protocol adaptation, and local scene workflows.
- Tauri shell is responsible only for window lifecycle and packaging.
- Native integration is explicitly deferred to a later phase.

This keeps the migration low-risk and avoids mixing desktop concerns into UI code before the shell is stable.

## File Structure

### Create

- `editor/app/vite.config.ts`
- `editor/app/src-tauri/Cargo.toml`
- `editor/app/src-tauri/src/main.rs`
- `editor/app/src-tauri/tauri.conf.json`
- `editor/app/src/vite-env.d.ts`

### Modify

- `editor/app/package.json`
- `editor/app/index.html`
- `editor/app/tsconfig.json`
- `tools/start_test.sh`
- `README.md`
- `docs/FrameWork.md`
- `docs/Target.md`

### Likely Remove From Main Path

- `editor/app/tools/prepare_browser_preview.mjs`
- `editor/app/tools/check_browser_module_specifiers.mjs`
- `editor/app/tools/check_preview_dist_layout.mjs`
- `editor/app/tools/clean_dist.mjs`

They exist only to patch the static web preview path. Once Vite owns the frontend build, these compatibility scripts should no longer be part of the default editor workflow.

## Build and Run Model

### Development

- `pnpm --dir editor/app run dev`
  Starts the Vite dev server.
- `pnpm --dir editor/app run tauri:dev`
  Starts the desktop shell against the Vite frontend.

### Production

- `pnpm --dir editor/app run build`
  Produces the frontend bundle locally with Vite.
- `pnpm --dir editor/app run tauri:build`
  Produces desktop bundles for the current platform.

## Testing Strategy

The migration is complete only when these checks pass:

- `pnpm --dir editor/app run typecheck`
- `pnpm --dir editor/app run build`
- `pnpm --dir editor/app run tauri:build`

If the local environment can run a desktop window:

- `pnpm --dir editor/app run tauri:dev`

Additional assertions:

- No frontend runtime dependency on `esm.sh`
- No default editor workflow depending on `python3 -m http.server`
- Existing UI modules still compile without behavioral rewrites

## Non-Goals

- Do not redesign the editor UI during this migration.
- Do not add native filesystem or dialog APIs yet.
- Do not add updater/signing/release automation.
- Do not fork the editor into separate web and desktop code paths.

## Risks and Controls

### Risk: Tooling migration breaks existing TypeScript modules

Control:
- Keep `src` tree intact.
- Limit the migration to build/runtime wiring first.
- Verify with `typecheck` before and after Tauri wiring.

### Risk: Tauri setup introduces platform-specific breakage

Control:
- Start with the minimal official shell layout.
- Keep custom Rust code near zero in phase one.

### Risk: Repo retains two competing editor workflows

Control:
- Move the editor’s default commands to Vite/Tauri.
- Demote the old static preview path from the documented main flow.

