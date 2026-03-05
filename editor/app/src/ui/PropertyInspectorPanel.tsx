import { useI18n } from "./i18n/I18nProvider";

export type PropertyValue = boolean | number | string;

export type PropertyField = {
  key: string;
  label: string;
  value: PropertyValue;
};

type PropertyInspectorPanelProps = {
  nodeName: string;
  fields: PropertyField[];
  onChange: (key: string, value: PropertyValue) => void;
};

export default function PropertyInspectorPanel(props: PropertyInspectorPanelProps): JSX.Element {
  const { t } = useI18n();

  return (
    <div>
      <h2>{t("panel.propertyInspector.title")}</h2>
      <div style={{ marginBottom: "10px", color: "#57606a" }}>
        {t("panel.propertyInspector.currentNode", { nodeName: props.nodeName })}
      </div>
      {props.fields.map((field) => {
        const value = field.value;
        return (
          <div key={field.key} style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", fontSize: "12px", marginBottom: "4px" }}>{field.label}</label>
            {typeof value === "boolean" ? (
              <input
                type="checkbox"
                checked={value}
                onChange={(event) => props.onChange(field.key, event.target.checked)}
              />
            ) : typeof value === "number" ? (
              <input
                type="number"
                value={value}
                onChange={(event) => props.onChange(field.key, Number(event.target.value))}
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(event) => props.onChange(field.key, event.target.value)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
