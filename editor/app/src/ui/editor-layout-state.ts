export type EditorPanelKey = "library" | "samples" | "assets" | "inspector" | "validation";

export type HiddenPanels = Record<EditorPanelKey, boolean>;
export type WorkspacePanelKey = "left" | "center" | "right" | "bottom";

export const defaultHiddenPanels = (): HiddenPanels => ({
  library: false,
  samples: false,
  assets: true,
  inspector: false,
  validation: false,
});

export const toggleHiddenPanel = (state: HiddenPanels, panel: EditorPanelKey): HiddenPanels => ({
  ...state,
  [panel]: !state[panel],
});

export const toggleMaximizedPanel = (current: WorkspacePanelKey | undefined, next: WorkspacePanelKey): WorkspacePanelKey | undefined => (current === next ? undefined : next);
