import { useEffect, useMemo } from "react";
import { useI18n } from "./i18n/I18nProvider";
import ToolbarMenu from "./ToolbarMenu";
import type { EditorPanelKey, HiddenPanels } from "./editor-layout-state";
import { ueGhostButton, ueShellColors } from "./ue-shell-theme";
import type { ToolbarMenuGroup } from "./toolbar-menu-config";
import { collectToolbarCommands, executeToolbarShortcut } from "./toolbar-command-registry";
import appLogo from "../../../../Logo.png";

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

export default function DebugToolbar(props: DebugToolbarProps): JSX.Element {
  const { locale, t } = useI18n();
  const isEnglish = locale === "en-US";
  const toolbarCommands = useMemo(() => collectToolbarCommands(props.menus), [props.menus]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      executeToolbarShortcut(event, toolbarCommands);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [toolbarCommands]);

  return (
    <div style={{ display: "grid", gap: "6px", padding: "2px 0 0" }}>
      <section
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "center",
          padding: "5px 8px",
          borderRadius: "6px",
          border: "1px solid #2d343d",
          background: "#1d2229",
          color: "#d7e0eb",
        }}
      >
        <div style={{ display: "flex", gap: "18px", alignItems: "center", minWidth: 0 }}>
          <div style={{ display: "grid", gap: "2px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img src={appLogo} alt="Fate Editor Logo" style={{ width: "18px", height: "18px", borderRadius: "4px", objectFit: "cover", border: "1px solid #39424d", background: "#fff" }} />
              <strong data-testid="editor-page-ready" style={{ display: "block", fontSize: "12px", letterSpacing: "0.01em", lineHeight: 1.1, color: "#f3f6f9" }}>
                {props.appTitle}
              </strong>
            </div>
            <div style={{ fontSize: "9px", color: "#8c9aa9", maxWidth: "32ch", paddingLeft: "28px" }}>{t("toolbar.subtitle")}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "2px", flexWrap: "wrap" }}>
            {props.menus.map((menu) => (
              <ToolbarMenu key={menu.label} label={menu.label} items={menu.items} />
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "2px 6px", borderRadius: "3px", background: "#232a32", border: "1px solid #343d47", color: "#9fb0c3", fontSize: "10px" }}>
            {props.lockStatusText}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "2px 6px", borderRadius: "3px", background: "#232a32", border: "1px solid #343d47", color: "#9fb0c3", fontSize: "10px" }}>
            {props.playMode ? "Play Session" : "Edit Session"}
          </span>
          <button
            type="button"
            onClick={props.onTogglePlaytestFullscreen}
            style={{
              ...ueGhostButton,
              padding: "4px 10px",
              background: ueShellColors.accent,
              borderColor: ueShellColors.accent,
              color: "#11161d",
              fontWeight: 700,
              fontSize: "10px",
            }}
          >
            {props.playtestFullscreen ? (isEnglish ? "Exit Test" : "退出测试") : isEnglish ? "Test" : "测试"}
          </button>
        </div>
      </section>
    </div>
  );
}
