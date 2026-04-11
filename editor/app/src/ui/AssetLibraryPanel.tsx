import { useMemo, useState } from "react";
import { useI18n } from "./i18n/I18nProvider";
import { ueGhostButton, ueShellColors } from "./ue-shell-theme";

export type AssetLibraryItem = {
  id: string;
  name: string;
  assetRef: string;
  slotHints: string[];
  packageId: string;
  packageVersion: string;
  resourceId: string;
  resourceType: "mesh" | "material" | "anim" | "prefab" | "audio" | "vfx" | "script_ref";
  unityTargetType: string;
  licenseSource: string;
  importStatus: "formal" | "fallback" | "local";
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
  const [showOptions, setShowOptions] = useState(false);
  const shellCardStyle = {
    display: "grid",
    gap: "8px",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #2a3543",
    background: "linear-gradient(180deg, rgba(43, 51, 62, 0.98) 0%, rgba(34, 42, 52, 0.98) 100%)",
  } as const;
  const getAssetAccent = (resourceType: AssetLibraryItem["resourceType"], slotHints: string[]): { background: string; label: string } => {
    const joined = `${resourceType} ${slotHints.join(" ")}`.toLowerCase();
    if (joined.includes("mesh")) {
      return { background: "linear-gradient(135deg, #455a74 0%, #223243 100%)", label: "MESH" };
    }
    if (joined.includes("material")) {
      return { background: "linear-gradient(135deg, #4d6959 0%, #213529 100%)", label: "MAT" };
    }
    if (joined.includes("anim")) {
      return { background: "linear-gradient(135deg, #6d5632 0%, #322415 100%)", label: "ANIM" };
    }
    if (joined.includes("audio") || joined.includes("sfx")) {
      return { background: "linear-gradient(135deg, #5a476f 0%, #281f34 100%)", label: "AUDIO" };
    }
    if (joined.includes("vfx")) {
      return { background: "linear-gradient(135deg, #5e5c33 0%, #312e17 100%)", label: "VFX" };
    }
    if (joined.includes("script_ref") || joined.includes("socket") || joined.includes("input")) {
      return { background: "linear-gradient(135deg, #3d5669 0%, #1c2d37 100%)", label: "BIND" };
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
      <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "12px", color: "#a9b8c9" }}>
          <input
            type="checkbox"
            checked={showOnlyMatchingSlot}
            onChange={(event) => setShowOnlyMatchingSlot(event.target.checked)}
          />
          {t("panel.assetLibrary.matchSlotOnly")}
        </label>
        <button type="button" onClick={() => setShowOptions((prev) => !prev)} style={{ ...ueGhostButton, padding: "5px 9px", fontSize: "11px" }}>
          {showOptions ? "Hide options" : "More"}
        </button>
      </div>
      {showOptions ? (
        <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "12px", color: "#a9b8c9" }}>
          <input
            type="checkbox"
            checked={showFullAssetNames}
            onChange={(event) => setShowFullAssetNames(event.target.checked)}
          />
          {showFullAssetNames ? "Hide full asset names" : "Show full asset names"}
        </label>
      ) : null}
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
              style={{
                ...shellCardStyle,
                gridTemplateColumns: "auto minmax(0, 1fr) auto",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  minHeight: "44px",
                  minWidth: "58px",
                  borderRadius: "8px",
                  padding: "8px",
                  display: "grid",
                  alignContent: "space-between",
                  background: getAssetAccent(item.resourceType, item.slotHints).background,
                }}
              >
                <span style={{ fontSize: "11px", letterSpacing: "0.08em", fontWeight: 700, color: "#f2d593" }}>{getAssetAccent(item.resourceType, item.slotHints).label}</span>
                <strong style={{ color: "#eef4fb", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.resourceType}</strong>
              </div>
              <div style={{ minWidth: 0, display: "grid", gap: "4px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <strong style={{ fontSize: "13px", color: "#eef4fb", whiteSpace: showFullAssetNames ? "normal" : "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</strong>
                  <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "999px", background: item.importStatus === "formal" ? "#1f3727" : item.importStatus === "fallback" ? "#3a321d" : "#273240", color: item.importStatus === "formal" ? "#bde0c1" : item.importStatus === "fallback" ? "#f3d28b" : "#cfe2f7" }}>{item.importStatus}</span>
                </div>
                <div style={{ fontSize: "11px", color: "#a9b8c9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.slotHints.join(", ") || t("panel.assetLibrary.anySlot")} · {item.packageId}@{item.packageVersion}
                </div>
                <div style={{ fontSize: "11px", color: "#7f93a9", whiteSpace: showFullAssetNames ? "normal" : "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.assetRef} · {item.unityTargetType}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "end" }}>
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
