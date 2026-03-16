import { useMemo, useState } from "react";
import { useI18n } from "./i18n/I18nProvider";

export type AssetLibraryItem = {
  id: string;
  name: string;
  assetRef: string;
  slotHints: string[];
};

type AssetLibraryPanelProps = {
  items: AssetLibraryItem[];
  selectedSlotId?: string;
  onBindAsset: (assetRef: string) => void;
};

const DRAG_ASSET_MIME = "application/x-fate-asset-ref";

export default function AssetLibraryPanel(props: AssetLibraryPanelProps): JSX.Element {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [showOnlyMatchingSlot, setShowOnlyMatchingSlot] = useState(false);
  const shellCardStyle = {
    display: "grid",
    gap: "8px",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #2a3543",
    background: "linear-gradient(180deg, rgba(43, 51, 62, 0.98) 0%, rgba(34, 42, 52, 0.98) 100%)",
  } as const;
  const getAssetAccent = (slotHints: string[]): { background: string; label: string } => {
    const joined = slotHints.join(" ").toLowerCase();
    if (joined.includes("mesh")) {
      return { background: "linear-gradient(135deg, #dff1ff 0%, #7ca8d9 100%)", label: "MESH" };
    }
    if (joined.includes("anim")) {
      return { background: "linear-gradient(135deg, #fff0d7 0%, #d8a15e 100%)", label: "ANIM" };
    }
    if (joined.includes("audio") || joined.includes("sfx")) {
      return { background: "linear-gradient(135deg, #efe0ff 0%, #9b79d2 100%)", label: "AUDIO" };
    }
    return { background: "linear-gradient(135deg, #eef2f7 0%, #93a4bb 100%)", label: "ASSET" };
  };
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return props.items.filter((item) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.assetRef.toLowerCase().includes(normalizedQuery) ||
        item.slotHints.some((slotHint) => slotHint.toLowerCase().includes(normalizedQuery));
      const matchesSlot =
        !showOnlyMatchingSlot ||
        props.selectedSlotId === undefined ||
        props.selectedSlotId.length === 0 ||
        item.slotHints.length === 0 ||
        item.slotHints.includes(props.selectedSlotId);
      return matchesQuery && matchesSlot;
    });
  }, [props.items, props.selectedSlotId, query, showOnlyMatchingSlot]);

  return (
    <section style={{ display: "grid", gap: "10px", color: "#dfe8f2" }}>
      <div>
        <h2 style={{ margin: 0, fontSize: "16px", color: "#f3f7fb" }}>{t("panel.assetLibrary.title")}</h2>
        <div style={{ marginTop: "4px", fontSize: "12px", color: "#9caec2" }}>
          {t("panel.assetLibrary.summary", { count: String(filteredItems.length) })}
        </div>
      </div>
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("panel.assetLibrary.searchPlaceholder")}
        style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #435062", background: "#1b2430", color: "#edf3fb" }}
      />
      <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "12px", color: "#a9b8c9" }}>
        <input
          type="checkbox"
          checked={showOnlyMatchingSlot}
          onChange={(event) => setShowOnlyMatchingSlot(event.target.checked)}
        />
        {t("panel.assetLibrary.matchSlotOnly")}
      </label>
      <div style={{ fontSize: "12px", color: "#8fa1b6" }}>
        {props.selectedSlotId !== undefined && props.selectedSlotId.length > 0
          ? t("panel.assetLibrary.targetSlot", { slotId: props.selectedSlotId })
          : t("panel.assetLibrary.noTarget")}
      </div>
      <div style={{ display: "grid", gap: "8px" }}>
        {filteredItems.length === 0 ? (
          <div style={{ ...shellCardStyle, fontSize: "12px", color: "#b7c4d3" }}>
            {t("panel.assetLibrary.empty")}
          </div>
        ) : (
          filteredItems.map((item) => (
            <article
              key={item.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData(DRAG_ASSET_MIME, item.assetRef);
                event.dataTransfer.effectAllowed = "copy";
              }}
              style={shellCardStyle}
            >
              <div
                style={{
                  minHeight: "62px",
                  borderRadius: "10px",
                  padding: "10px",
                  display: "grid",
                  alignContent: "space-between",
                  background: getAssetAccent(item.slotHints).background,
                }}
              >
                <span style={{ fontSize: "11px", letterSpacing: "0.08em", fontWeight: 700, color: "#203249" }}>{getAssetAccent(item.slotHints).label}</span>
                <strong style={{ color: "#132238" }}>{item.name}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                <span style={{ fontSize: "11px", color: "#a9b8c9" }}>{item.slotHints.join(", ") || t("panel.assetLibrary.anySlot")}</span>
              </div>
              <div style={{ fontSize: "12px", color: "#d8e1ed" }}>{item.assetRef}</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => props.onBindAsset(item.assetRef)}
                  disabled={props.selectedSlotId === undefined || props.selectedSlotId.length === 0}
                  style={{ padding: "7px 10px", borderRadius: "8px", border: "1px solid #5378aa", background: props.selectedSlotId ? "#2d4d74" : "#2a3543", color: "#fff" }}
                >
                  {t("panel.assetLibrary.bind")}
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
