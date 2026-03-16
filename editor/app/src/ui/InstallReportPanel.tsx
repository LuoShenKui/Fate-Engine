import { useI18n } from "./i18n/I18nProvider";

export type InstallReportItem = {
  level: "Error" | "Warning" | "Info";
  code: string;
  brickId: string;
  brickName: string;
  detail: string;
  suggestion?: string;
};

type InstallReportPanelProps = {
  items: InstallReportItem[];
  onInspectBrick: (brickId: string) => void;
  onResolveIssue: (item: InstallReportItem) => void;
  onAddToScene: (brickId: string) => void;
  onQuickPreview: (brickId: string) => void;
};

export default function InstallReportPanel(props: InstallReportPanelProps): JSX.Element {
  const { t } = useI18n();
  const levelTone = (level: InstallReportItem["level"]): { bg: string; border: string; badge: string; fg: string } => {
    if (level === "Error") {
      return { bg: "#fff5f3", border: "#ead1cb", badge: "#b95a52", fg: "#8c3f39" };
    }
    if (level === "Warning") {
      return { bg: "#fff9ee", border: "#eadfbf", badge: "#a27a29", fg: "#7c5b18" };
    }
    return { bg: "#f7f9fc", border: "#dbe2eb", badge: "#6d8296", fg: "#536679" };
  };

  const menuPanelStyle = {
    position: "absolute",
    top: "calc(100% + 6px)",
    right: 0,
    minWidth: "164px",
    padding: "6px",
    borderRadius: "10px",
    border: "1px solid #dbe2eb",
    background: "#ffffff",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
    zIndex: 10,
  } as const;

  const menuItemStyle = {
    padding: "8px 10px",
    borderRadius: "8px",
    color: "#304255",
    fontSize: "13px",
    cursor: "pointer",
  } as const;

  return (
    <section style={{ display: "grid", gap: "10px", color: "#324255" }}>
      <div>
        <h2 style={{ margin: 0, fontSize: "16px", color: "#1c2c3f" }}>{t("panel.installReport.title")}</h2>
        <div style={{ marginTop: "4px", fontSize: "12px", color: "#728398" }}>{t("panel.installReport.summary")}</div>
      </div>
      <div style={{ display: "grid", gap: "8px" }}>
        {props.items.length === 0 ? (
          <div style={{ padding: "12px", borderRadius: "10px", border: "1px solid #dbe2eb", background: "#f8fafc", fontSize: "12px", color: "#73869a" }}>
            {t("panel.installReport.empty")}
          </div>
        ) : (
          props.items.map((item, index) => {
            const tone = levelTone(item.level);
            return (
            <article
              key={`${item.code}-${item.brickName}-${index}`}
              style={{
                display: "grid",
                gap: "8px",
                padding: "12px",
                borderRadius: "10px",
                border: `1px solid ${tone.border}`,
                background: tone.bg,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                <strong style={{ color: "#1d2d40" }}>{item.brickName}</strong>
                <span style={{ fontSize: "11px", color: tone.fg, padding: "2px 8px", borderRadius: "999px", background: tone.badge }}>{item.code}</span>
              </div>
              <div style={{ fontSize: "12px", color: "#45586d" }}>{item.detail}</div>
              {item.suggestion !== undefined ? <div style={{ fontSize: "12px", color: tone.fg }}>{item.suggestion}</div> : null}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => props.onInspectBrick(item.brickId)}
                  style={{ padding: 0, border: "none", background: "transparent", color: "#284c75", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                >
                  {t("panel.installReport.inspect")}
                </button>
                <details style={{ position: "relative" }}>
                  <summary style={{ listStyle: "none", cursor: "pointer", padding: "6px 10px", borderRadius: "8px", border: "1px solid #d5dde7", background: "#ffffff", color: "#314357", fontSize: "12px", fontWeight: 700 }}>
                    操作
                  </summary>
                  <div role="menu" style={menuPanelStyle}>
                    {item.code === "READY" ? (
                      <div role="menuitem" tabIndex={0} style={menuItemStyle} onClick={() => props.onAddToScene(item.brickId)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); props.onAddToScene(item.brickId); } }}>
                        {t("panel.installReport.addToScene")}
                      </div>
                    ) : null}
                    {item.code === "READY" ? (
                      <div role="menuitem" tabIndex={0} style={menuItemStyle} onClick={() => props.onQuickPreview(item.brickId)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); props.onQuickPreview(item.brickId); } }}>
                        {t("panel.installReport.quickPreview")}
                      </div>
                    ) : null}
                    {item.level !== "Info" ? (
                      <div role="menuitem" tabIndex={0} style={menuItemStyle} onClick={() => props.onResolveIssue(item)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); props.onResolveIssue(item); } }}>
                        {t("panel.installReport.resolve")}
                      </div>
                    ) : null}
                  </div>
                </details>
              </div>
            </article>
          );
          })
        )}
      </div>
    </section>
  );
}
