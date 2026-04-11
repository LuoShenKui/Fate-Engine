import DebugToolbar from "./DebugToolbar";
import type { AdapterMode } from "../domain/door";
import type { EditorPanelKey, HiddenPanels } from "./editor-layout-state";
import type { ToolbarMenuGroup } from "./toolbar-menu-config";

type AppTopToolbarProps = {
  locked: boolean;
  adapterMode: AdapterMode;
  onToggleAdapterMode: () => void;
  onInteract: () => void;
  playMode: boolean;
  onTogglePlayMode: () => void;
  onToggleLock: () => void;
  onImport: () => void;
  onImportBrick: () => void;
  onExport: () => void;
  onSave: () => void;
  onLoad: () => void;
  onApplyTemplate: () => void;
  onOpenCommandPalette: () => void;
  onOpenCompose: () => void;
  onOpenExportReview: () => void;
  hiddenPanels: HiddenPanels;
  onTogglePanel: (panel: EditorPanelKey) => void;
  playtestFullscreen: boolean;
  onTogglePlaytestFullscreen: () => void;
  lockStatusText: string;
  appTitle: string;
  menus: ToolbarMenuGroup[];
};

export default function AppTopToolbar(props: AppTopToolbarProps): JSX.Element {
  return (
    <DebugToolbar
      locked={props.locked}
      adapterMode={props.adapterMode}
      onToggleAdapterMode={props.onToggleAdapterMode}
      onInteract={props.onInteract}
      playMode={props.playMode}
      onTogglePlayMode={props.onTogglePlayMode}
      onToggleLock={props.onToggleLock}
      onImport={props.onImport}
      onImportBrick={props.onImportBrick}
      onExport={props.onExport}
      onSave={props.onSave}
      onLoad={props.onLoad}
      onApplyTemplate={props.onApplyTemplate}
      onOpenCommandPalette={props.onOpenCommandPalette}
      onOpenCompose={props.onOpenCompose}
      onOpenExportReview={props.onOpenExportReview}
      hiddenPanels={props.hiddenPanels}
      onTogglePanel={props.onTogglePanel}
      playtestFullscreen={props.playtestFullscreen}
      onTogglePlaytestFullscreen={props.onTogglePlaytestFullscreen}
      lockStatusText={props.lockStatusText}
      appTitle={props.appTitle}
      menus={props.menus}
    />
  );
}
