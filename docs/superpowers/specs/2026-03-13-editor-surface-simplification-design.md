# Editor Surface Simplification Design

**Date:** 2026-03-13

## Goal

Reduce the current "AI demo" feel of the editor shell and move it toward a practical engineering editor surface. The key requirements are a pure white page background, fewer button-heavy control groups, and a top area that reads like menus rather than a marketing dashboard.

## Scope

- Keep the current three-column editor layout.
- Replace the dense top button groups with menu-style controls.
- Simplify the right-side tab controls so they read as segmented navigation rather than action buttons.
- Remove dark hero gradients and reduce decorative visual weight.

## Non-Goals

- No information architecture rewrite.
- No native Tauri menu integration in this pass.
- No changes to editor business logic or protocol behavior.

## Design

### Background and Surface

- `EditorLayout` switches to a pure white page background.
- Panels keep a light neutral fill, thin borders, and shallow shadows only.
- The top chrome stops using dark gradients and high-contrast showcase styling.

### Top Control Area

- Replace the current button matrix with a menu bar pattern:
  - `文件`
  - `积木`
  - `场景`
  - `运行时`
- Each menu uses a compact trigger and a lightweight dropdown list.
- Keep only one or two direct controls outside the menus when necessary, such as locale.

### Right Panel Tabs

- Keep the existing three tabs.
- Restyle them as low-emphasis segmented navigation.

## Verification

- Add a structural UI check that fails when:
  - the editor background is not pure white
  - the top toolbar still uses the old dark showcase styling
  - the top toolbar still renders an excessive number of buttons

