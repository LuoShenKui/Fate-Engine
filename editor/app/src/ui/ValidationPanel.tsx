import { useI18n } from "./i18n/I18nProvider";

export type ValidationLevel = "Error" | "Warning" | "Info";

export type ValidationItem = {
  level: ValidationLevel;
  message: string;
};

type ValidationPanelProps = {
  items: ValidationItem[];
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
    </div>
  );
}
