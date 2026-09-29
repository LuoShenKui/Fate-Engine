import { useEffect, useMemo } from "react";
import ToolbarMenu from "./ToolbarMenu";
import type { EditorPanelKey, HiddenPanels } from "./editor-layout-state";
import { ueShellColors } from "./ue-shell-theme";
import type { ToolbarMenuGroup } from "./toolbar-menu-config";
import { collectToolbarCommands, executeToolbarShortcut } from "./toolbar-command-registry";

type DebugToolbarProps = {
  locked: boolean;
  adapterMode: "demo" | "runtime";
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

const toolButton = (active = false) =>
  ({
    minWidth: "56px",
    height: "48px",
    display: "grid",
    placeItems: "center",
    gap: "2px",
    padding: "5px 9px",
    borderRadius: "4px",
    border: `1px solid ${active ? "#3a79bb" : ueShellColors.border}`,
    background: active ? "#214f7f" : "#1c2229",
    color: active ? "#fff" : ueShellColors.text,
    cursor: "pointer",
    fontSize: "10px",
  }) as const;

export default function DebugToolbar(props: DebugToolbarProps): JSX.Element {
  const toolbarCommands = useMemo(() => collectToolbarCommands(props.menus), [props.menus]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => executeToolbarShortcut(event, toolbarCommands);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toolbarCommands]);

  return (
    <div style={{ display: "grid", gridTemplateRows: "30px 58px", background: "#171c22", borderBottom: `1px solid ${ueShellColors.borderStrong}` }}>
      <div style={{ display: "flex", alignItems: "center", padding: "0 12px", gap: "14px", borderBottom: `1px solid ${ueShellColors.border}`, color: ueShellColors.text }}>
        <strong data-testid="editor-page-ready" style={{ fontSize: "12px", marginRight: "4px", color: "#f5f7fa" }}>Fate Engine 0.1</strong>
        {props.menus.map((menu) => <ToolbarMenu key={menu.label} label={menu.label} items={menu.items} />)}
        <button type="button" onClick={props.onOpenCommandPalette} style={{ marginLeft: "auto", border: 0, background: "transparent", color: ueShellColors.textMuted, fontSize: "10px", cursor: "pointer" }}>
          {props.appTitle}
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", padding: "5px 12px", gap: "4px" }}>
        <button type="button" style={toolButton(true)}><span style={{ fontSize: "17px" }}>⌖</span><span>Select</span></button>
        <button type="button" style={toolButton()}><span style={{ fontSize: "17px" }}>✣</span><span>Move</span></button>
        <button type="button" style={toolButton()}><span style={{ fontSize: "17px" }}>⟳</span><span>Rotate</span></button>
        <button type="button" style={toolButton()}><span style={{ fontSize: "17px" }}>↥</span><span>Scale</span></button>

        <div style={{ width: "1px", height: "34px", background: ueShellColors.borderStrong, margin: "0 10px" }} />
        <div style={{ display: "inline-flex", border: `1px solid ${ueShellColors.borderStrong}`, borderRadius: "4px", overflow: "hidden" }}>
          <button type="button" style={{ border: 0, padding: "7px 14px", background: "#285f9b", color: "#fff", fontSize: "10px" }}>Local</button>
          <button type="button" style={{ border: 0, padding: "7px 14px", background: "#20262d", color: ueShellColors.textMuted, fontSize: "10px" }}>World</button>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "8px", color: ueShellColors.textMuted, fontSize: "10px" }}>
          <input type="checkbox" defaultChecked /> Grid Snap
          <select defaultValue="0.5" style={{ background: "#20262d", color: ueShellColors.text, border: `1px solid ${ueShellColors.borderStrong}`, borderRadius: "3px", padding: "4px 6px" }}>
            <option>0.1</option><option>0.5</option><option>1</option>
          </select>
        </label>

        <div style={{ flex: 1 }} />

        <button type="button" onClick={props.onTogglePlayMode} style={toolButton(props.playMode)}><span style={{ fontSize: "18px" }}>▶</span><span>Play</span></button>
        <button type="button" style={toolButton()}><span style={{ fontSize: "18px" }}>Ⅱ</span><span>Pause</span></button>
        <button type="button" onClick={props.playMode ? props.onTogglePlayMode : undefined} style={toolButton()}><span style={{ fontSize: "18px" }}>■</span><span>Stop</span></button>
        <button type="button" onClick={props.onExport} style={toolButton()}><span style={{ fontSize: "18px" }}>⬡</span><span>Build</span></button>
      </div>
    </div>
  );
}
