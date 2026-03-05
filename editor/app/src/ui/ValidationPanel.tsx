import { useI18n } from "./i18n/I18nProvider";

export type ValidationLevel = "Error" | "Warning" | "Info";

export type ValidationItem = {
  level: ValidationLevel;
  message: string;
};

type ValidationPanelProps = {
  items: ValidationItem[];
  batchEntries?: Array<{ recipeId: string; items: ValidationItem[] }>;
  batchStatsDiff?: { totalErrors: number; totalWarnings: number };
};

export default function ValidationPanel(props: ValidationPanelProps): JSX.Element {
  const { t } = useI18n();

  return (
    <div>
      <h2>{t("panel.validation.title")}</h2>
      <ul style={{ margin: 0, paddingLeft: "18px" }}>
        {props.items.map((item, index) => (
          <li key={`${item.level}-${index}`}>
            <strong>[{item.level === "Error" ? t("validation.level.Error") : item.level === "Warning" ? t("validation.level.Warning") : t("validation.level.Info")}]</strong> {item.message}
          </li>
        ))}
      </ul>
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
