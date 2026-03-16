import { useMemo, useRef, useState } from "react";
import type { BrickSlotSchema } from "../domain/brick";
import { useI18n } from "./i18n/I18nProvider";

export type PropertyValue = boolean | number | string;

export type PropertyField = {
  key: string;
  label: string;
  value: PropertyValue;
  defaultValue: PropertyValue;
  packageValue: PropertyValue;
  sceneValue: PropertyValue;
  group: string;
};

export type CompositeOverrideGroup = {
  key: string;
  label: string;
  values: Array<{ key: string; value: PropertyValue }>;
};

type PropertyInspectorPanelProps = {
  nodeName: string;
  scopeLabel?: string;
  fields: PropertyField[];
  overrideCount?: number;
  slots: BrickSlotSchema[];
  slotBindings: Record<string, string>;
  selectedSlotId?: string;
  compositeGroups?: CompositeOverrideGroup[];
  onChange: (key: string, value: PropertyValue) => void;
  onResetField?: (key: string) => void;
  onResetFieldToScene?: (key: string) => void;
  onSlotBindingChange: (slotId: string, assetRef: string) => void;
  onSelectSlot?: (slotId: string) => void;
  onImportSlotAsset?: (slotId: string, file: File) => void;
  onBindAssetToSlot?: (slotId: string, assetRef: string) => void;
  onCompositeOverrideChange?: (groupKey: string, key: string, value: PropertyValue) => void;
};

const DRAG_ASSET_MIME = "application/x-fate-asset-ref";

const shellStyle = {
  display: "grid",
  gap: "10px",
  color: "#dfe8f2",
} as const;

const sectionStyle = {
  display: "grid",
  gap: "8px",
} as const;

const cardStyle = {
  display: "grid",
  gap: "8px",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #2a3543",
  background: "linear-gradient(180deg, rgba(43, 51, 62, 0.98) 0%, rgba(34, 42, 52, 0.98) 100%)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
} as const;

const groupButtonStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "9px 10px",
  borderRadius: "8px",
  border: "1px solid #394759",
  background: "#202a36",
  color: "#dfe8f2",
  fontSize: "12px",
  fontWeight: 700,
} as const;

const textInputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid #435062",
  background: "#1b2430",
  color: "#edf3fb",
  boxSizing: "border-box",
} as const;

const subtleButtonStyle = {
  padding: "6px 10px",
  borderRadius: "8px",
  border: "1px solid #445264",
  background: "#273240",
  color: "#d9e3ef",
  fontSize: "12px",
} as const;

const activePillStyle = {
  fontSize: "11px",
  padding: "2px 8px",
  borderRadius: "999px",
  background: "#2b4d73",
  color: "#dbeeff",
  border: "1px solid #5f8bc2",
} as const;

export default function PropertyInspectorPanel(props: PropertyInspectorPanelProps): JSX.Element {
  const { t } = useI18n();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const [draggedSlotId, setDraggedSlotId] = useState("");

  const groupedFields = useMemo(
    () =>
      props.fields.reduce<Record<string, PropertyField[]>>((acc, field) => {
        const groupKey = field.group || t("panel.propertyInspector.groupGeneral");
        acc[groupKey] = [...(acc[groupKey] ?? []), field];
        return acc;
      }, {}),
    [props.fields, t],
  );

  return (
    <div style={shellStyle}>
      <div>
        <h2 style={{ margin: 0, fontSize: "16px", color: "#f3f7fb" }}>{t("panel.propertyInspector.title")}</h2>
        <div style={{ marginTop: "4px", color: "#9caec2", fontSize: "12px" }}>{t("panel.propertyInspector.summary")}</div>
      </div>

      <div style={{ fontSize: "12px", color: "#a9b8c9" }}>{t("panel.propertyInspector.currentNode", { nodeName: props.nodeName })}</div>
      {props.scopeLabel !== undefined ? <div style={{ fontSize: "12px", color: "#8fa1b6" }}>{props.scopeLabel}</div> : null}
      {props.overrideCount !== undefined ? <div style={{ fontSize: "12px", color: "#8fa1b6" }}>{t("panel.propertyInspector.overrideCount", { count: String(props.overrideCount) })}</div> : null}

      {Object.entries(groupedFields).map(([groupName, fields]) => {
        const collapsed = collapsedGroups.includes(groupName);
        return (
          <section key={groupName} style={sectionStyle}>
            <button
              type="button"
              onClick={() =>
                setCollapsedGroups((prev) => (prev.includes(groupName) ? prev.filter((item) => item !== groupName) : [...prev, groupName]))
              }
              style={groupButtonStyle}
            >
              <span>{groupName}</span>
              <span>{collapsed ? t("panel.propertyInspector.expandGroup") : t("panel.propertyInspector.collapseGroup")}</span>
            </button>
            {!collapsed
              ? fields.map((field) => {
                  const value = field.value;
                  const changed = props.onResetFieldToScene !== undefined ? field.value !== field.sceneValue : field.value !== field.packageValue;
                  return (
                    <div key={field.key} style={{ ...cardStyle, border: changed ? "1px solid #6189c1" : cardStyle.border }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center" }}>
                        <label style={{ display: "block", fontSize: "12px", color: "#f3f7fb", fontWeight: 700 }}>{field.label}</label>
                        {changed ? <span style={activePillStyle}>{t("panel.propertyInspector.overridden")}</span> : null}
                      </div>
                      <div style={{ fontSize: "11px", color: "#90a3b9" }}>{t("panel.propertyInspector.packageValue", { value: String(field.packageValue) })}</div>
                      <div style={{ fontSize: "11px", color: "#90a3b9" }}>{t("panel.propertyInspector.sceneValue", { value: String(field.sceneValue) })}</div>
                      {typeof value === "boolean" ? (
                        <input type="checkbox" checked={value} onChange={(event) => props.onChange(field.key, event.target.checked)} />
                      ) : typeof value === "number" ? (
                        <input type="number" value={value} onChange={(event) => props.onChange(field.key, Number(event.target.value))} style={textInputStyle} />
                      ) : (
                        <input type="text" value={value} onChange={(event) => props.onChange(field.key, event.target.value)} style={textInputStyle} />
                      )}
                      <div style={{ marginTop: "2px", display: "flex", justifyContent: "flex-end", gap: "8px", flexWrap: "wrap" }}>
                        {props.onResetFieldToScene !== undefined && field.value !== field.sceneValue ? (
                          <button type="button" onClick={() => props.onResetFieldToScene?.(field.key)} style={subtleButtonStyle}>
                            {t("panel.propertyInspector.resetScene")}
                          </button>
                        ) : null}
                        <button type="button" onClick={() => props.onResetField?.(field.key)} style={subtleButtonStyle}>
                          {t("panel.propertyInspector.resetPackage")}
                        </button>
                      </div>
                    </div>
                  );
                })
              : null}
          </section>
        );
      })}

      <section style={sectionStyle}>
        <h3 style={{ fontSize: "14px", margin: 0, color: "#f3f7fb" }}>{t("panel.propertyInspector.slots")}</h3>
        {props.slots.length === 0 ? <div style={{ color: "#9caec2", fontSize: "12px" }}>{t("panel.propertyInspector.slotsEmpty")}</div> : null}
        {props.slots.map((slot) => {
          const currentValue = props.slotBindings[slot.slotId] ?? "";
          const placeholder = slot.fallbackAssetRef ?? "asset://...";
          return (
            <div
              key={slot.slotId}
              onDragOver={(event) => {
                if (event.dataTransfer.types.includes(DRAG_ASSET_MIME)) {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "copy";
                  setDraggedSlotId(slot.slotId);
                }
              }}
              onDragLeave={() => setDraggedSlotId((prev) => (prev === slot.slotId ? "" : prev))}
              onDrop={(event) => {
                const assetRef = event.dataTransfer.getData(DRAG_ASSET_MIME);
                if (assetRef.length === 0) {
                  return;
                }
                event.preventDefault();
                setDraggedSlotId("");
                props.onBindAssetToSlot?.(slot.slotId, assetRef);
              }}
              style={{
                ...cardStyle,
                border: draggedSlotId === slot.slotId ? "1px solid #5f8bc2" : cardStyle.border,
                background: draggedSlotId === slot.slotId ? "linear-gradient(180deg, rgba(41,72,108,0.96) 0%, rgba(34,42,52,0.98) 100%)" : cardStyle.background,
              }}
            >
              <label style={{ display: "block", fontSize: "12px", color: "#f3f7fb", fontWeight: 700 }}>
                {slot.label} ({slot.slotId}) {slot.optional ? t("panel.propertyInspector.slotOptional") : t("panel.propertyInspector.slotRequired")}
              </label>
              <button
                type="button"
                onClick={() => props.onSelectSlot?.(slot.slotId)}
                style={{ ...subtleButtonStyle, borderRadius: "999px", width: "fit-content", background: props.selectedSlotId === slot.slotId ? "#2d4d74" : "#202a36" }}
              >
                {props.selectedSlotId === slot.slotId ? t("panel.propertyInspector.slotSelected") : t("panel.propertyInspector.selectSlot")}
              </button>
              <input type="text" value={currentValue} placeholder={placeholder} onChange={(event) => props.onSlotBindingChange(slot.slotId, event.target.value)} style={textInputStyle} />
              {draggedSlotId === slot.slotId ? <div style={{ fontSize: "12px", color: "#dbeeff", fontWeight: 700 }}>{t("panel.propertyInspector.slotDropHint")}</div> : null}
              <div style={{ display: "flex", gap: "8px", marginTop: "2px", flexWrap: "wrap" }}>
                <button type="button" onClick={() => fileInputRefs.current[slot.slotId]?.click()} style={subtleButtonStyle}>
                  {t("panel.propertyInspector.importAsset")}
                </button>
                <button type="button" onClick={() => props.onSlotBindingChange(slot.slotId, placeholder)} style={subtleButtonStyle}>
                  {t("panel.propertyInspector.useFallback")}
                </button>
              </div>
              <input
                ref={(node) => {
                  fileInputRefs.current[slot.slotId] = node;
                }}
                type="file"
                style={{ display: "none" }}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file !== undefined) {
                    props.onImportSlotAsset?.(slot.slotId, file);
                  }
                  event.target.value = "";
                }}
              />
            </div>
          );
        })}
      </section>

      {props.compositeGroups !== undefined && props.compositeGroups.length > 0 ? (
        <section style={sectionStyle}>
          <h3 style={{ fontSize: "14px", margin: 0, color: "#f3f7fb" }}>{t("panel.propertyInspector.compositeOverrides")}</h3>
          {props.compositeGroups.map((group) => (
            <div key={group.key} style={cardStyle}>
              <strong style={{ fontSize: "12px", color: "#f3f7fb" }}>{group.label}</strong>
              {group.values.map((field) => (
                <div key={`${group.key}-${field.key}`} style={{ display: "grid", gap: "4px" }}>
                  <label style={{ display: "block", fontSize: "12px", color: "#cfd9e5" }}>{field.key}</label>
                  {typeof field.value === "boolean" ? (
                    <input type="checkbox" checked={field.value} onChange={(event) => props.onCompositeOverrideChange?.(group.key, field.key, event.target.checked)} />
                  ) : typeof field.value === "number" ? (
                    <input type="number" value={field.value} onChange={(event) => props.onCompositeOverrideChange?.(group.key, field.key, Number(event.target.value))} style={textInputStyle} />
                  ) : (
                    <input type="text" value={field.value} onChange={(event) => props.onCompositeOverrideChange?.(group.key, field.key, event.target.value)} style={textInputStyle} />
                  )}
                </div>
              ))}
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
