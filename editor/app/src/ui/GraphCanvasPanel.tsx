import { useI18n } from "./i18n/I18nProvider";

export default function GraphCanvasPanel(): JSX.Element {
  const { t } = useI18n();

  return (
    <div>
      <h2>{t("panel.graphCanvas.title")}</h2>
      <div
        style={{
          height: "100%",
          minHeight: "320px",
          border: "1px dashed #8c959f",
          borderRadius: "6px",
          display: "grid",
          placeItems: "center",
          color: "#57606a",
        }}
      >
        {t("panel.graphCanvas.placeholder")}
      </div>
    </div>
  );
}
