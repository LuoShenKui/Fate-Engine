import { useState } from "react";
import { useI18n } from "./i18n/I18nProvider";
import { ueGhostButton, ueShellColors } from "./ue-shell-theme";

export type ValidationLevel = "Error" | "Warning" | "Info";

export type ValidationItem = {
  level: ValidationLevel;
  message: string;
  ruleId?: string;
  target?: { type: "node"; nodeId: string } | { type: "edge"; edgeId: string } | { type: "brick"; brickId: string };
  evidence?: string;
  suggestion?: string;
  suppressed?: boolean;
};

type ValidationPanelProps = {
  items: ValidationItem[];
  protocolItems?: ValidationItem[];
  businessItems?: ValidationItem[];
  batchEntries?: Array<{ recipeId: string; items: ValidationItem[] }>;
  batchStatsDiff?: { totalErrors: number; totalWarnings: number };
};

const formatTarget = (target: ValidationItem["target"]): string => {
  if (target === undefined) {
    return "";
  }
  if (target.type === "node") {
    return `node:${target.nodeId}`;
  }
  if (target.type === "edge") {
    return `edge:${target.edgeId}`;
  }
  return `brick:${target.brickId}`;
};

export default function ValidationPanel(props: ValidationPanelProps): JSX.Element {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"business" | "protocol" | "batch">("business");
  const protocolItems = props.protocolItems ?? [];
  const businessItems = props.businessItems ?? props.items;
  const tabButtonStyle = (active: boolean) =>
    ({
      ...ueGhostButton,
      padding: "7px 12px",
      borderRadius: "999px",
      border: active ? `1px solid ${ueShellColors.accent}` : `1px solid ${ueShellColors.borderStrong}`,
      background: active ? ueShellColors.accent : ueShellColors.panelMuted,
      color: active ? "#11161d" : ueShellColors.text,
      fontWeight: 700,
    }) as const;
  const levelTone = (level: ValidationLevel): { bg: string; fg: string; border: string } => {
    if (level === "Error") {
      return { bg: "#3c2724", fg: "#f2b3a8", border: "#75453e" };
    }
    if (level === "Warning") {
      return { bg: "#3d3220", fg: "#f1d18b", border: "#6e5832" };
    }
    return { bg: "#213326", fg: "#b9dec0", border: "#3f6648" };
  };

  const renderList = (items: ValidationItem[]): JSX.Element =>
    items.length === 0 ? (
      <div style={{ padding: "18px 16px", borderRadius: "14px", border: `1px dashed ${ueShellColors.borderStrong}`, color: ueShellColors.textMuted, background: ueShellColors.panelMuted }}>{t("validation.ok")}</div>
    ) : (
      <div style={{ display: "grid", gap: "8px" }}>
        {items.map((item, index) => {
          const tone = levelTone(item.level);
          return (
            <article
              key={`${item.level}-${index}`}
              style={{
                display: "grid",
                gap: "8px",
                padding: "12px 14px",
                borderRadius: "14px",
                border: `1px solid ${ueShellColors.border}`,
                background: ueShellColors.panelMuted,
              }}
            >
              <div style={{ display: "flex", gap: "8px", alignItems: "start", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "start" }}>
                  <span style={{ padding: "3px 8px", borderRadius: "999px", background: tone.bg, color: tone.fg, border: `1px solid ${tone.border}`, fontSize: "11px", fontWeight: 700 }}>
                    {item.level === "Error" ? t("validation.level.Error") : item.level === "Warning" ? t("validation.level.Warning") : t("validation.level.Info")}
                  </span>
                  <div style={{ color: ueShellColors.text, lineHeight: 1.45 }}>{item.message}</div>
                </div>
                {item.ruleId !== undefined ? (
                  <span style={{ fontSize: "11px", color: ueShellColors.textMuted, whiteSpace: "nowrap" }}>{item.ruleId}</span>
                ) : null}
              </div>
              {item.target !== undefined ? (
                <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{formatTarget(item.target)}</div>
              ) : null}
              {item.evidence !== undefined ? (
                <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{`证据: ${item.evidence}`}</div>
              ) : null}
              {item.suggestion !== undefined ? (
                <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{`建议: ${item.suggestion}`}</div>
              ) : null}
            </article>
          );
        })}
      </div>
    );

  return (
    <div style={{ display: "grid", gap: "12px", maxHeight: "260px", overflow: "auto", paddingRight: "4px", color: ueShellColors.text }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "end", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "16px", color: ueShellColors.text }}>{t("panel.validation.title")}</h2>
          <div style={{ marginTop: "4px", fontSize: "12px", color: ueShellColors.textMuted }}>
            {`${businessItems.length} business / ${protocolItems.length} protocol`}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button type="button" onClick={() => setActiveTab("business")} style={tabButtonStyle(activeTab === "business")}>
            {t("panel.validation.business")}
          </button>
          <button type="button" onClick={() => setActiveTab("protocol")} style={tabButtonStyle(activeTab === "protocol")}>
            {t("panel.validation.protocol")}
          </button>
          <button type="button" onClick={() => setActiveTab("batch")} style={tabButtonStyle(activeTab === "batch")}>
            {t("panel.validation.batch")}
          </button>
        </div>
      </div>
      {activeTab === "business" ? renderList(businessItems) : null}
      {activeTab === "protocol" ? renderList(protocolItems.length > 0 ? protocolItems : [{ level: "Info", message: t("validation.ok") }]) : null}
      {props.batchStatsDiff !== undefined ? (
        <div style={{ padding: "10px 12px", borderRadius: "12px", background: ueShellColors.panelMuted, border: `1px solid ${ueShellColors.border}`, fontSize: "12px", color: ueShellColors.textMuted }}>
          {t("validation.compareDiff", {
            errorDelta: String(props.batchStatsDiff.totalErrors),
            warningDelta: String(props.batchStatsDiff.totalWarnings),
          })}
        </div>
      ) : null}
      {activeTab === "batch" && props.batchEntries !== undefined && props.batchEntries.length > 0 ? (
        <div style={{ display: "grid", gap: "10px" }}>
          {props.batchEntries.map((entry) => (
            <section key={entry.recipeId} style={{ display: "grid", gap: "8px", padding: "12px 14px", borderRadius: "14px", background: ueShellColors.panelMuted, border: `1px solid ${ueShellColors.border}` }}>
              <strong style={{ color: ueShellColors.text }}>{entry.recipeId}</strong>
              {entry.items.length === 0 ? <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{t("validation.ok")}</div> : renderList(entry.items)}
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
