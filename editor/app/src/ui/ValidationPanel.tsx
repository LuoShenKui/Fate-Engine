import { useState } from "react";
import { useI18n } from "./i18n/I18nProvider";

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
      padding: "7px 12px",
      borderRadius: "999px",
      border: active ? "1px solid #8cb8eb" : "1px solid #c7d3e3",
      background: active ? "linear-gradient(180deg, #eef6ff 0%, #dbeaff 100%)" : "rgba(255,255,255,0.74)",
      color: active ? "#1e466f" : "#42546a",
      fontWeight: 700,
      cursor: "pointer",
    }) as const;
  const levelTone = (level: ValidationLevel): { bg: string; fg: string; border: string } => {
    if (level === "Error") {
      return { bg: "#ffe6e1", fg: "#8b2d1f", border: "#f0b1a8" };
    }
    if (level === "Warning") {
      return { bg: "#fff2d8", fg: "#7b5b05", border: "#ebcf92" };
    }
    return { bg: "#e3f2e4", fg: "#27623a", border: "#b7ddbe" };
  };

  const renderList = (items: ValidationItem[]): JSX.Element =>
    items.length === 0 ? (
      <div style={{ padding: "18px 16px", borderRadius: "14px", border: "1px dashed #c7d3e3", color: "#5d6d80", background: "rgba(255,255,255,0.62)" }}>{t("validation.ok")}</div>
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
                border: "1px solid #d2dcea",
                background: "rgba(255,255,255,0.82)",
              }}
            >
              <div style={{ display: "flex", gap: "8px", alignItems: "start", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "start" }}>
                  <span style={{ padding: "3px 8px", borderRadius: "999px", background: tone.bg, color: tone.fg, border: `1px solid ${tone.border}`, fontSize: "11px", fontWeight: 700 }}>
                    {item.level === "Error" ? t("validation.level.Error") : item.level === "Warning" ? t("validation.level.Warning") : t("validation.level.Info")}
                  </span>
                  <div style={{ color: "#22364d", lineHeight: 1.45 }}>{item.message}</div>
                </div>
                {item.ruleId !== undefined ? (
                  <span style={{ fontSize: "11px", color: "#63758b", whiteSpace: "nowrap" }}>{item.ruleId}</span>
                ) : null}
              </div>
              {item.target !== undefined ? (
                <div style={{ fontSize: "12px", color: "#55677e" }}>{formatTarget(item.target)}</div>
              ) : null}
              {item.evidence !== undefined ? (
                <div style={{ fontSize: "12px", color: "#42546a" }}>{`证据: ${item.evidence}`}</div>
              ) : null}
              {item.suggestion !== undefined ? (
                <div style={{ fontSize: "12px", color: "#42546a" }}>{`建议: ${item.suggestion}`}</div>
              ) : null}
            </article>
          );
        })}
      </div>
    );

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "end", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "16px", color: "#132238" }}>{t("panel.validation.title")}</h2>
          <div style={{ marginTop: "4px", fontSize: "12px", color: "#607286" }}>
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
        <div style={{ padding: "10px 12px", borderRadius: "12px", background: "rgba(255,255,255,0.72)", border: "1px solid #d2dcea", fontSize: "12px", color: "#42546a" }}>
          {t("validation.compareDiff", {
            errorDelta: String(props.batchStatsDiff.totalErrors),
            warningDelta: String(props.batchStatsDiff.totalWarnings),
          })}
        </div>
      ) : null}
      {activeTab === "batch" && props.batchEntries !== undefined && props.batchEntries.length > 0 ? (
        <div style={{ display: "grid", gap: "10px" }}>
          {props.batchEntries.map((entry) => (
            <section key={entry.recipeId} style={{ display: "grid", gap: "8px", padding: "12px 14px", borderRadius: "14px", background: "rgba(255,255,255,0.82)", border: "1px solid #d2dcea" }}>
              <strong style={{ color: "#203249" }}>{entry.recipeId}</strong>
              {entry.items.length === 0 ? <div style={{ fontSize: "12px", color: "#607286" }}>{t("validation.ok")}</div> : renderList(entry.items)}
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
