import type { BrickSlotSchema } from "../domain/brick";
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
  slots: BrickSlotSchema[];
  slotBindings: Record<string, string>;
  onChange: (key: string, value: PropertyValue) => void;
  onSlotBindingChange: (slotId: string, assetRef: string) => void;
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

      <div style={{ marginTop: "16px" }}>
        <h3 style={{ fontSize: "14px", margin: "0 0 8px" }}>Slot 绑定</h3>
        {props.slots.length === 0 && <div style={{ color: "#57606a", fontSize: "12px" }}>当前积木无 slot</div>}
        {props.slots.map((slot) => {
          const currentValue = props.slotBindings[slot.slotId] ?? "";
          const placeholder = slot.fallbackAssetRef ?? "asset://...";
          return (
            <div key={slot.slotId} style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px" }}>
                {slot.label} ({slot.slotId}) {slot.optional ? "可选" : "必填"}
              </label>
              <input
                type="text"
                value={currentValue}
                placeholder={placeholder}
                onChange={(event) => props.onSlotBindingChange(slot.slotId, event.target.value)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
