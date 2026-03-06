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
  const protocolItems = props.protocolItems ?? [];
  const businessItems = props.businessItems ?? props.items;

  const renderList = (items: ValidationItem[]): JSX.Element => (
    <ul style={{ margin: 0, paddingLeft: "18px" }}>
      {items.map((item, index) => (
        <li key={`${item.level}-${index}`}>
          <strong>[{item.level === "Error" ? t("validation.level.Error") : item.level === "Warning" ? t("validation.level.Warning") : t("validation.level.Info")}]</strong> {item.message}
          {item.ruleId !== undefined && (
            <span style={{ marginLeft: "6px", opacity: 0.75 }}>
              ({item.ruleId}{item.target !== undefined ? ` @ ${formatTarget(item.target)}` : ""}{item.suppressed ? " / suppressed" : ""})
            </span>
          )}
          {(item.evidence !== undefined || item.suggestion !== undefined) && (
            <span style={{ marginLeft: "6px", opacity: 0.75 }}>
              {item.evidence !== undefined ? `证据: ${item.evidence}` : ""}
              {item.evidence !== undefined && item.suggestion !== undefined ? "；" : ""}
              {item.suggestion !== undefined ? `建议: ${item.suggestion}` : ""}
            </span>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div>
      <h2>{t("panel.validation.title")}</h2>
      <h3 style={{ marginBottom: "6px" }}>{t("panel.validation.business")}</h3>
      {renderList(businessItems)}
      <h3 style={{ marginTop: "8px", marginBottom: "6px" }}>{t("panel.validation.protocol")}</h3>
      {renderList(protocolItems.length > 0 ? protocolItems : [{ level: "Info", message: t("validation.ok") }])}
      {props.batchStatsDiff !== undefined && (
        <p style={{ marginTop: "8px", marginBottom: "4px" }}>
          {t("validation.compareDiff", {
            errorDelta: String(props.batchStatsDiff.totalErrors),
            warningDelta: String(props.batchStatsDiff.totalWarnings),
          })}
        </p>
      )}
      {props.batchEntries !== undefined && props.batchEntries.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: "18px" }}>
          {props.batchEntries.map((entry) => (
            <li key={entry.recipeId}>
              <strong>{entry.recipeId}</strong>
              <ul style={{ margin: 0, paddingLeft: "18px" }}>
                {entry.items.length === 0 && <li>{t("validation.ok")}</li>}
                {entry.items.map((item, index) => (
                  <li key={`${entry.recipeId}-${item.level}-${index}`}>
                    <strong>[{item.level === "Error" ? t("validation.level.Error") : item.level === "Warning" ? t("validation.level.Warning") : t("validation.level.Info")}]</strong> {item.message}
                    {item.ruleId !== undefined && (
                      <span style={{ marginLeft: "6px", opacity: 0.75 }}>
                        ({item.ruleId}{item.target !== undefined ? ` @ ${formatTarget(item.target)}` : ""}{item.suppressed ? " / suppressed" : ""})
                      </span>
                    )}
                    {(item.evidence !== undefined || item.suggestion !== undefined) && (
                      <span style={{ marginLeft: "6px", opacity: 0.75 }}>
                        {item.evidence !== undefined ? `证据: ${item.evidence}` : ""}
                        {item.evidence !== undefined && item.suggestion !== undefined ? "；" : ""}
                        {item.suggestion !== undefined ? `建议: ${item.suggestion}` : ""}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
