# Editor Surface Simplification Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the editor surface look like an engineering editor rather than an AI demo dashboard.

**Architecture:** Keep the existing layout and logic, but replace the top chrome with menu-style controls and simplify the global surface styling. Verification is handled by a small source-level UI guard and the normal TypeScript/Vite build checks.

**Tech Stack:** React, TypeScript, Vite, Tauri

---

## Chunk 1: UI Guard

### Task 1: Add a failing style-structure check

**Files:**
- Create: `editor/app/tools/check_editor_surface_style.mjs`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run it and confirm it fails on the current dark, button-heavy toolbar**
- [ ] **Step 3: Keep the check focused on white background + toolbar simplification**
- [ ] **Step 4: Re-run after implementation and confirm it passes**

## Chunk 2: Top Chrome Simplification

### Task 2: Replace button matrix with menu-style toolbar

**Files:**
- Modify: `editor/app/src/ui/DebugToolbar.tsx`
- Modify: `editor/app/src/ui/app-chrome.tsx`

- [ ] **Step 1: Introduce compact menu triggers and dropdown sections**
- [ ] **Step 2: Remove the old large dark hero section look**
- [ ] **Step 3: Keep existing actions callable without changing their behavior**
- [ ] **Step 4: Verify with source check and TypeScript**

## Chunk 3: Surface Cleanup

### Task 3: Make the editor background pure white and reduce visual noise

**Files:**
- Modify: `editor/app/src/ui/EditorLayout.tsx`
- Modify: `editor/app/src/ui/app-right-panel.tsx`

- [ ] **Step 1: Set the page background to pure white**
- [ ] **Step 2: Reduce gradients/shadows/rounded emphasis across shell surfaces**
- [ ] **Step 3: Keep readability and panel separation**
- [ ] **Step 4: Run build verification**

