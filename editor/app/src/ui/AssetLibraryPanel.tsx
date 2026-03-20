import { useMemo, useState } from "react";
import { useI18n } from "./i18n/I18nProvider";
import { ueGhostButton, ueShellColors } from "./ue-shell-theme";

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
  const [showFullAssetNames, setShowFullAssetNames] = useState(false);
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
      return { background: "linear-gradient(135deg, #455a74 0%, #223243 100%)", label: "MESH" };
    }
    if (joined.includes("anim")) {
      return { background: "linear-gradient(135deg, #6d5632 0%, #322415 100%)", label: "ANIM" };
    }
    if (joined.includes("audio") || joined.includes("sfx")) {
      return { background: "linear-gradient(135deg, #5a476f 0%, #281f34 100%)", label: "AUDIO" };
    }
    return { background: "linear-gradient(135deg, #42505f 0%, #222d37 100%)", label: "ASSET" };
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
        style={{ padding: "8px 10px", borderRadius: "8px", border: `1px solid ${ueShellColors.borderStrong}`, background: ueShellColors.panelMuted, color: ueShellColors.text }}
      />
      <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "12px", color: "#a9b8c9" }}>
        <input
          type="checkbox"
          checked={showOnlyMatchingSlot}
          onChange={(event) => setShowOnlyMatchingSlot(event.target.checked)}
        />
        {t("panel.assetLibrary.matchSlotOnly")}
      </label>
      <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "12px", color: "#a9b8c9" }}>
        <input
          type="checkbox"
          checked={showFullAssetNames}
          onChange={(event) => setShowFullAssetNames(event.target.checked)}
        />
        {showFullAssetNames ? "Hide full asset names" : "Show full asset names"}
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
                <span style={{ fontSize: "11px", letterSpacing: "0.08em", fontWeight: 700, color: "#f2d593" }}>{getAssetAccent(item.slotHints).label}</span>
                <strong style={{ color: "#eef4fb", whiteSpace: showFullAssetNames ? "normal" : "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                <span style={{ fontSize: "11px", color: "#a9b8c9" }}>{item.slotHints.join(", ") || t("panel.assetLibrary.anySlot")}</span>
              </div>
              <div style={{ fontSize: "12px", color: "#d8e1ed", whiteSpace: showFullAssetNames ? "normal" : "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.assetRef}</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => props.onBindAsset(item.assetRef)}
                  disabled={props.selectedSlotId === undefined || props.selectedSlotId.length === 0}
                  style={{ ...ueGhostButton, padding: "7px 10px", background: props.selectedSlotId ? ueShellColors.accent : ueShellColors.panelMuted, color: props.selectedSlotId ? "#11161d" : ueShellColors.text, borderColor: props.selectedSlotId ? ueShellColors.accent : ueShellColors.borderStrong }}
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
