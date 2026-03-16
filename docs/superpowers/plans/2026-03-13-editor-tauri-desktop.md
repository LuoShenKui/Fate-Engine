# Editor Tauri Desktop Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `editor/app` from a static browser preview into a local `React + Vite + Tauri` desktop application for macOS and Windows.

**Architecture:** Keep the existing React source tree in `editor/app/src`, replace the static `tsc + http.server` preview path with Vite, and add a minimal Tauri shell in `editor/app/src-tauri`. The migration keeps UI behavior stable while changing build/runtime infrastructure.

**Tech Stack:** React 18, TypeScript, Vite, Tauri, Rust

---

## Chunk 1: Frontend Build Migration

### Task 1: Add a failing guard for CDN-free editor entry

**Files:**
- Create: `editor/app/tools/check_editor_local_runtime.mjs`
- Test: `editor/app/tools/check_editor_local_runtime.mjs`

- [ ] **Step 1: Write the failing test**

Implement a Node check that fails when:
- `editor/app/index.html` still contains `esm.sh`
- `editor/app/package.json` still uses `python3 -m http.server` as the default preview path

- [ ] **Step 2: Run test to verify it fails**

Run: `node editor/app/tools/check_editor_local_runtime.mjs`
Expected: FAIL against the current static preview setup

- [ ] **Step 3: Write minimal implementation**

Implement the file so it reads `index.html` and `package.json`, then exits non-zero when the old runtime markers exist.

- [ ] **Step 4: Run test to verify it passes after migration**

Run: `node editor/app/tools/check_editor_local_runtime.mjs`
Expected: PASS after Vite/Tauri wiring is complete

### Task 2: Replace static preview build with Vite

**Files:**
- Create: `editor/app/vite.config.ts`
- Create: `editor/app/src/vite-env.d.ts`
- Modify: `editor/app/package.json`
- Modify: `editor/app/index.html`
- Modify: `editor/app/tsconfig.json`

- [ ] **Step 1: Add Vite dependencies**

Add `vite`, `@vitejs/plugin-react`, and `@tauri-apps/cli` to `editor/app/package.json`.

- [ ] **Step 2: Add Vite config**

Create `editor/app/vite.config.ts` with:
- React plugin
- stable dev server port
- build output usable by Tauri

- [ ] **Step 3: Update HTML entry**

Switch `editor/app/index.html` to a normal Vite entry that loads `/src/main.tsx` and remove the `esm.sh` import map.

- [ ] **Step 4: Update package scripts**

Replace static preview scripts with:
- `dev`
- `build`
- `preview`
- `tauri:dev`
- `tauri:build`

- [ ] **Step 5: Update TS config for Vite**

Ensure `tsconfig.json` remains compatible with the current React source tree and Vite environment typing.

- [ ] **Step 6: Verify**

Run:
- `pnpm --dir editor/app run typecheck`
- `pnpm --dir editor/app run build`

Expected: both PASS

## Chunk 2: Tauri Shell

### Task 3: Add minimal Tauri application shell

**Files:**
- Create: `editor/app/src-tauri/Cargo.toml`
- Create: `editor/app/src-tauri/build.rs`
- Create: `editor/app/src-tauri/src/main.rs`
- Create: `editor/app/src-tauri/tauri.conf.json`

- [ ] **Step 1: Scaffold minimal shell files**

Add the standard Tauri v2 shell files with a single desktop window.

- [ ] **Step 2: Wire frontend build directory**

Configure Tauri to use:
- Vite dev server during `tauri:dev`
- frontend build output during `tauri:build`

- [ ] **Step 3: Keep Rust shell minimal**

Do not add custom commands or native business logic.

- [ ] **Step 4: Verify shell configuration**

Run: `pnpm --dir editor/app run tauri:build`
Expected: PASS on the current host platform

## Chunk 3: Workflow and Docs

### Task 4: Replace editor startup workflow

**Files:**
- Modify: `tools/start_test.sh`
- Modify: `README.md`
- Modify: `docs/FrameWork.md`
- Modify: `docs/Target.md`

- [ ] **Step 1: Update local startup script**

Make the editor path launch the desktop-oriented workflow instead of `http.server`.

- [ ] **Step 2: Update documentation**

Document that:
- the editor is now a Tauri desktop app
- the frontend is built locally with Vite
- supported desktop targets are macOS and Windows

- [ ] **Step 3: Remove outdated preview guidance**

Demote or remove stale instructions that reference `esm.sh`, browser-only preview, or `python3 -m http.server` as the main editor path.

- [ ] **Step 4: Verify**

Run:
- `node editor/app/tools/check_editor_local_runtime.mjs`
- `pnpm --dir editor/app run build`

Expected: PASS

## Chunk 4: End-to-End Verification

### Task 5: Run final checks

**Files:**
- No code changes required

- [ ] **Step 1: Frontend verification**

Run:
- `pnpm --dir editor/app run typecheck`
- `pnpm --dir editor/app run build`

Expected: PASS

- [ ] **Step 2: Desktop verification**

Run:
- `pnpm --dir editor/app run tauri:build`

Expected: PASS for the current platform

- [ ] **Step 3: Interactive verification**

Run:
- `pnpm --dir editor/app run tauri:dev`

Expected:
- desktop window opens
- editor UI renders without blank screen

- [ ] **Step 4: Commit**

```bash
git add editor/app tools/start_test.sh README.md docs/FrameWork.md docs/Target.md docs/superpowers/specs/2026-03-13-editor-tauri-desktop-design.md docs/superpowers/plans/2026-03-13-editor-tauri-desktop.md
git commit -m "feat: migrate editor to tauri desktop shell"
```
