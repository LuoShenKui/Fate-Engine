import { useMemo, useState } from "react";
import type { AdapterMode } from "../domain/door";
import { collectToolbarCommands } from "./toolbar-command-registry";
import { buildToolbarMenus, type ToolbarMenuGroup } from "./toolbar-menu-config";
import type { HiddenPanels } from "./editor-layout-state";
import type { TranslateFn } from "./i18n/I18nProvider";

type UseAppCommandWorkflowArgs = {
  locale: "zh-CN" | "en-US";
  switchLocale: (nextLocale: "zh-CN" | "en-US") => void;
  t: TranslateFn;
  hiddenPanels: HiddenPanels;
  locked: boolean;
  adapterMode: AdapterMode;
  playMode: boolean;
  playtestFullscreen: boolean;
  onInteract: () => void;
  onToggleAdapterMode: () => void;
  onTogglePlayMode: () => void;
  onToggleLock: () => void;
  onImport: () => void;
  onImportBrick: () => void;
  onExport: () => void;
  onSave: () => void;
  onLoad: () => void;
  onApplyTemplate: () => void;
  onOpenInstall: () => void;
  onOpenDetails: () => void;
  onOpenInspector: () => void;
  onOpenCompose: () => void;
  onOpenExportReview: () => void;
  onOpenNarrativeDebug: () => void;
  onBeginNarrativeFixtureSession: () => void;
  onOpenBrickLibrary: () => void;
  onOpenAssetLibrary: () => void;
  onOpenValidation: () => void;
  onTogglePanel: (panel: "library" | "samples" | "assets" | "inspector" | "validation") => void;
  onTogglePlaytestFullscreen: () => void;
};

type UseAppCommandWorkflowResult = {
  commandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toolbarMenus: ToolbarMenuGroup[];
  toolbarCommands: ReturnType<typeof collectToolbarCommands>;
};

export const useAppCommandWorkflow = (args: UseAppCommandWorkflowArgs): UseAppCommandWorkflowResult => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const nextLocale = args.locale === "zh-CN" ? "en-US" : "zh-CN";

  const toolbarMenus = useMemo(
    () =>
      buildToolbarMenus({
        isEnglish: args.locale === "en-US",
        hiddenPanels: args.hiddenPanels,
        locked: args.locked,
        adapterMode: args.adapterMode,
        playMode: args.playMode,
        playtestFullscreen: args.playtestFullscreen,
        onInteract: args.onInteract,
        onToggleAdapterMode: args.onToggleAdapterMode,
        onTogglePlayMode: args.onTogglePlayMode,
        onToggleLock: args.onToggleLock,
        onImport: args.onImport,
        onImportBrick: args.onImportBrick,
        onExport: args.onExport,
        onSave: args.onSave,
        onLoad: args.onLoad,
        onApplyTemplate: args.onApplyTemplate,
        onOpenInstall: args.onOpenInstall,
        onOpenDetails: args.onOpenDetails,
        onOpenInspector: args.onOpenInspector,
        onOpenCommandPalette: () => setCommandPaletteOpen(true),
        onOpenCompose: args.onOpenCompose,
        onOpenExportReview: args.onOpenExportReview,
        onOpenNarrativeDebug: args.onOpenNarrativeDebug,
        onBeginNarrativeFixtureSession: args.onBeginNarrativeFixtureSession,
        onOpenBrickLibrary: args.onOpenBrickLibrary,
        onOpenAssetLibrary: args.onOpenAssetLibrary,
        onOpenValidation: args.onOpenValidation,
        onTogglePanel: args.onTogglePanel,
        onTogglePlaytestFullscreen: args.onTogglePlaytestFullscreen,
        onSwitchLocale: () => args.switchLocale(nextLocale),
        t: args.t,
      }),
    [
      args.locale,
      args.hiddenPanels,
      args.locked,
      args.adapterMode,
      args.playMode,
      args.playtestFullscreen,
      args.onInteract,
      args.onToggleAdapterMode,
      args.onTogglePlayMode,
      args.onToggleLock,
      args.onImport,
      args.onImportBrick,
      args.onExport,
      args.onSave,
      args.onLoad,
      args.onApplyTemplate,
      args.onOpenInstall,
      args.onOpenDetails,
      args.onOpenInspector,
      args.onOpenCompose,
      args.onOpenExportReview,
      args.onOpenNarrativeDebug,
      args.onBeginNarrativeFixtureSession,
      args.onOpenBrickLibrary,
      args.onOpenAssetLibrary,
      args.onOpenValidation,
      args.onTogglePanel,
      args.onTogglePlaytestFullscreen,
      args.switchLocale,
      args.t,
      nextLocale,
    ],
  );

  const toolbarCommands = useMemo(() => collectToolbarCommands(toolbarMenus), [toolbarMenus]);

  return {
    commandPaletteOpen,
    openCommandPalette: () => setCommandPaletteOpen(true),
    closeCommandPalette: () => setCommandPaletteOpen(false),
    toolbarMenus,
    toolbarCommands,
  };
};
