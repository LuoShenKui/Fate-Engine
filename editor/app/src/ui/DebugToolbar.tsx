import { useI18n, type Locale } from "./i18n/I18nProvider";
import ToolbarMenu from "./ToolbarMenu";
import type { EditorPanelKey, HiddenPanels } from "./editor-layout-state";
import { ueGhostButton, ueShellColors } from "./ue-shell-theme";
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
  hiddenPanels: HiddenPanels;
  onTogglePanel: (panel: EditorPanelKey) => void;
  playtestFullscreen: boolean;
  onTogglePlaytestFullscreen: () => void;
  lockStatusText: string;
  appTitle: string;
};

export default function DebugToolbar(props: DebugToolbarProps): JSX.Element {
  const { locale, switchLocale, t } = useI18n();
  const nextLocale: Locale = locale === "zh-CN" ? "en-US" : "zh-CN";
  const isEnglish = locale === "en-US";

  const panelToggleLabel = (panel: EditorPanelKey, zhLabel: string, enLabel: string): string =>
    props.hiddenPanels[panel] ? (isEnglish ? `Show ${enLabel}` : `显示${zhLabel}`) : isEnglish ? `Hide ${enLabel}` : `隐藏${zhLabel}`;

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
            <ToolbarMenu label={isEnglish ? "File" : "文件"} items={[{ label: t("toolbar.import"), onSelect: props.onImport }, { label: t("toolbar.export"), onSelect: props.onExport }, { label: t("toolbar.save"), onSelect: props.onSave }, { label: t("toolbar.load"), onSelect: props.onLoad }]} />
            <ToolbarMenu label={isEnglish ? "Bricks" : "积木"} items={[{ label: t("toolbar.importBrick"), onSelect: props.onImportBrick }]} />
            <ToolbarMenu
              label={isEnglish ? "Scene" : "场景"}
              items={[
                { label: t("toolbar.applyTemplate"), onSelect: props.onApplyTemplate },
                ...(props.playMode ? [] : [{ label: t("toolbar.interact"), onSelect: props.onInteract }]),
                { label: t("toolbar.playMode", { enabled: String(props.playMode) }), onSelect: props.onTogglePlayMode },
                { label: props.playtestFullscreen ? (isEnglish ? "Exit 3D Test" : "退出全屏测试") : isEnglish ? "Launch 3D Test" : "一键 3D 测试", onSelect: props.onTogglePlaytestFullscreen },
              ]}
            />
            <ToolbarMenu
              label={isEnglish ? "View" : "视图"}
              items={[
                { label: panelToggleLabel("library", "积木库", "Brick Registry"), onSelect: () => props.onTogglePanel("library") },
                { label: panelToggleLabel("samples", "森林小屋 Demo", "Forest Demo"), onSelect: () => props.onTogglePanel("samples") },
                { label: panelToggleLabel("assets", "资源库", "Assets"), onSelect: () => props.onTogglePanel("assets") },
                { label: panelToggleLabel("inspector", "右侧面板", "Inspector"), onSelect: () => props.onTogglePanel("inspector") },
                { label: panelToggleLabel("validation", "校验区", "Output"), onSelect: () => props.onTogglePanel("validation") },
              ]}
            />
            <ToolbarMenu label={isEnglish ? "Runtime" : "运行时"} items={[{ label: t("toolbar.toggleLock", { locked: String(props.locked) }), onSelect: props.onToggleLock }, { label: t("toolbar.adapterMode", { mode: props.adapterMode }), onSelect: props.onToggleAdapterMode }]} />
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
          <button
            type="button"
            onClick={() => switchLocale(nextLocale)}
            style={{ ...ueGhostButton, padding: "3px 7px", color: ueShellColors.text, fontWeight: 600, fontSize: "10px" }}
          >
            {t("toolbar.locale.zh")} / {t("toolbar.locale.en")}
          </button>
        </div>
      </section>
    </div>
  );
}
