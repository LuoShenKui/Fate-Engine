import { toggleHiddenPanel, type HiddenPanels, type WorkspacePanelKey } from "./editor-layout-state";

type StateSetter<T> = (value: T | ((prev: T) => T)) => void;

type BuildAppToolbarStateArgs = {
  hiddenPanels: HiddenPanels;
  playMode: boolean;
  playtestFullscreen: boolean;
  setPlayMode: StateSetter<boolean>;
  setPlaytestFullscreen: StateSetter<boolean>;
  setHiddenPanels: StateSetter<HiddenPanels>;
  setActiveRightPanelTab: StateSetter<"install" | "details" | "inspector" | "compose" | "export" | "narrative">;
  setMaximizedPanel: StateSetter<WorkspacePanelKey | undefined>;
};

type RightPanelTab = "install" | "details" | "inspector" | "compose" | "export" | "narrative";

export const buildAppToolbarState = ({
  hiddenPanels,
  playMode,
  playtestFullscreen,
  setPlayMode,
  setPlaytestFullscreen,
  setHiddenPanels,
  setActiveRightPanelTab,
  setMaximizedPanel,
}: BuildAppToolbarStateArgs) => {
  const onTogglePlayMode = (): void => {
    setPlayMode((prev) => !prev);
  };

  const onTogglePanel = (panel: keyof HiddenPanels): void => {
    setHiddenPanels((prev) => toggleHiddenPanel(prev, panel));
  };

  const onTogglePlaytestFullscreen = (): void => {
    const next = !playtestFullscreen;
    setPlayMode(next);
    setPlaytestFullscreen(next);
  };

  const openRightPanelTab = (tab: RightPanelTab): void => {
    setHiddenPanels((prev) => (prev.inspector ? { ...prev, inspector: false } : prev));
    setActiveRightPanelTab(tab);
    setMaximizedPanel("right");
  };

  const onOpenInstall = (): void => {
    openRightPanelTab("install");
  };

  const onOpenDetails = (): void => {
    openRightPanelTab("details");
  };

  const onOpenInspector = (): void => {
    openRightPanelTab("inspector");
  };

  const onOpenCompose = (): void => {
    openRightPanelTab("compose");
  };

  const onOpenExportReview = (): void => {
    openRightPanelTab("export");
  };

  const onOpenNarrativeDebug = (): void => {
    openRightPanelTab("narrative");
  };

  const onOpenBrickLibrary = (): void => {
    setHiddenPanels((prev) => (prev.library ? { ...prev, library: false } : prev));
    setMaximizedPanel("left");
  };

  const onOpenAssetLibrary = (): void => {
    setHiddenPanels((prev) => ({ ...prev, assets: false }));
    setMaximizedPanel("left");
  };

  const onOpenValidation = (): void => {
    setHiddenPanels((prev) => (prev.validation ? { ...prev, validation: false } : prev));
    setMaximizedPanel("bottom");
  };

  return {
    hiddenPanels,
    playMode,
    onTogglePlayMode,
    onTogglePanel,
    onTogglePlaytestFullscreen,
    onOpenInstall,
    onOpenDetails,
    onOpenInspector,
    onOpenCompose,
    onOpenExportReview,
    onOpenNarrativeDebug,
    onOpenBrickLibrary,
    onOpenAssetLibrary,
    onOpenValidation,
  };
};
