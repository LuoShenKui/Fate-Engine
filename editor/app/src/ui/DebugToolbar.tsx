import { useI18n, type Locale } from "./i18n/I18nProvider";

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
  lockStatusText: string;
  appTitle: string;
};

export default function DebugToolbar(props: DebugToolbarProps): JSX.Element {
  const { locale, switchLocale, t } = useI18n();
  const nextLocale: Locale = locale === "zh-CN" ? "en-US" : "zh-CN";
  const shellStyle = {
    display: "grid",
    gap: "10px",
    padding: "6px 2px 2px",
  } as const;
  const toolbarStyle = {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    padding: "8px 10px",
    borderRadius: "12px",
    border: "1px solid #dde3eb",
    background: "#ffffff",
    color: "#1f2f43",
  } as const;
  const appTitleStyle = {
    display: "grid",
    gap: "2px",
  } as const;
  const menuRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  } as const;
  const menuStyle = {
    position: "relative",
  } as const;
  const summaryStyle = {
    listStyle: "none",
    cursor: "pointer",
    padding: "6px 10px",
    borderRadius: "8px",
    color: "#2c3f55",
    fontSize: "13px",
    fontWeight: 700,
    border: "1px solid transparent",
  } as const;
  const menuPanelStyle = {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    minWidth: "176px",
    padding: "6px",
    borderRadius: "10px",
    border: "1px solid #dbe2eb",
    background: "#ffffff",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
    zIndex: 20,
  } as const;
  const menuItemStyle = {
    padding: "8px 10px",
    borderRadius: "8px",
    color: "#304255",
    fontSize: "13px",
    cursor: "pointer",
  } as const;
  const statusPillStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 8px",
    borderRadius: "999px",
    background: "#f3f6fa",
    border: "1px solid #dbe2eb",
    color: "#5b6c80",
    fontSize: "11px",
  } as const;
  const localeStyle = {
    padding: "6px 10px",
    borderRadius: "8px",
    border: "1px solid #d9e0ea",
    background: "#ffffff",
    color: "#2f4257",
    cursor: "pointer",
    fontWeight: 600,
  } as const;

  const renderMenuItem = (label: string, action: () => void): JSX.Element => (
    <div
      role="menuitem"
      tabIndex={0}
      style={menuItemStyle}
      onClick={action}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          action();
        }
      }}
    >
      {label}
    </div>
  );

  return (
    <div style={shellStyle}>
      <section style={toolbarStyle}>
        <div style={{ display: "flex", gap: "18px", alignItems: "center", minWidth: 0 }}>
          <div style={appTitleStyle}>
            <strong data-testid="editor-page-ready" style={{ display: "block", fontSize: "18px", letterSpacing: "0.01em", lineHeight: 1.1 }}>{props.appTitle}</strong>
            <div style={{ fontSize: "11px", color: "#6f7f92", maxWidth: "30ch" }}>{t("toolbar.subtitle")}</div>
          </div>
          <div style={menuRowStyle}>
            <details style={menuStyle}>
              <summary style={summaryStyle}>文件</summary>
              <div role="menu" style={menuPanelStyle}>
                {renderMenuItem(t("toolbar.import"), props.onImport)}
                {renderMenuItem(t("toolbar.export"), props.onExport)}
                {renderMenuItem(t("toolbar.save"), props.onSave)}
                {renderMenuItem(t("toolbar.load"), props.onLoad)}
              </div>
            </details>
            <details style={menuStyle}>
              <summary style={summaryStyle}>积木</summary>
              <div role="menu" style={menuPanelStyle}>
                {renderMenuItem(t("toolbar.importBrick"), props.onImportBrick)}
              </div>
            </details>
            <details style={menuStyle}>
              <summary style={summaryStyle}>场景</summary>
              <div role="menu" style={menuPanelStyle}>
                {renderMenuItem(t("toolbar.applyTemplate"), props.onApplyTemplate)}
                {!props.playMode ? renderMenuItem(t("toolbar.interact"), props.onInteract) : null}
                {renderMenuItem(t("toolbar.playMode", { enabled: String(props.playMode) }), props.onTogglePlayMode)}
              </div>
            </details>
            <details style={menuStyle}>
              <summary style={summaryStyle}>运行时</summary>
              <div role="menu" style={menuPanelStyle}>
                {renderMenuItem(t("toolbar.toggleLock", { locked: String(props.locked) }), props.onToggleLock)}
                {renderMenuItem(t("toolbar.adapterMode", { mode: props.adapterMode }), props.onToggleAdapterMode)}
              </div>
            </details>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={statusPillStyle}>{props.lockStatusText}</span>
          <span style={statusPillStyle}>{props.playMode ? "Play Session" : "Edit Session"}</span>
          <button type="button" onClick={() => switchLocale(nextLocale)} style={localeStyle}>
            {t("toolbar.locale.zh")} / {t("toolbar.locale.en")}
          </button>
        </div>
      </section>
    </div>
  );
}
