import { useI18n } from "./i18n/I18nProvider";
import { getBrickPreviewUri } from "./preview-art";

export type BrickPaletteItem = {
  id: string;
  name: string;
  summary: string;
  category: string;
};

type BrickPalettePanelProps = {
  items: BrickPaletteItem[];
  selectedId: string;
  recentIds: string[];
  highlightedIds?: string[];
  onSelect: (id: string) => void;
  onAddToScene: (id: string) => void;
};

const DRAG_BRICK_MIME = "application/x-fate-brick-id";

export default function BrickPalettePanel(props: BrickPalettePanelProps): JSX.Element {
  const { t } = useI18n();
  const panelText = "#dfe8f2";
  const cardShell = (selected: boolean, highlighted: boolean) =>
    ({
      marginBottom: "0",
      padding: "10px",
      borderRadius: "10px",
      border: selected ? "1px solid #5f8bc2" : highlighted ? "1px solid #c9a14d" : "1px solid #2a3543",
      background: selected
        ? "linear-gradient(180deg, rgba(42, 69, 104, 0.98) 0%, rgba(32, 44, 61, 0.98) 100%)"
        : highlighted
          ? "linear-gradient(180deg, rgba(83, 67, 37, 0.96) 0%, rgba(47, 39, 28, 0.98) 100%)"
          : "linear-gradient(180deg, rgba(43, 51, 62, 0.98) 0%, rgba(34, 42, 52, 0.98) 100%)",
    }) as const;
  const getBrickAccent = (category: string): { background: string; label: string } => {
    if (category === "ability") {
      return { background: "linear-gradient(135deg, #fff5d6 0%, #f1c86d 100%)", label: "ABILITY" };
    }
    if (category === "enemy") {
      return { background: "linear-gradient(135deg, #ffd9d1 0%, #d86a58 100%)", label: "ENEMY" };
    }
    if (category === "composite") {
      return { background: "linear-gradient(135deg, #dff1ff 0%, #6ca6d8 100%)", label: "COMPOSITE" };
    }
    return { background: "linear-gradient(135deg, #eaf1fb 0%, #8aa7cc 100%)", label: "BRICK" };
  };
  const createBrickPreviewUri = (item: BrickPaletteItem): string => {
    const realPreview = getBrickPreviewUri({ id: item.id, name: item.name, category: item.category });
    if (typeof realPreview === "string") return realPreview;
    const accent = getBrickAccent(item.category);
    const safeName = item.name.slice(0, 20);
    const safeCategory = item.category.slice(0, 18);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#d9e5f4"/>
          </linearGradient>
        </defs>
        <rect width="320" height="180" rx="18" fill="url(#bg)"/>
        <rect x="16" y="16" width="128" height="72" rx="12" fill="rgba(255,255,255,0.44)"/>
        <rect x="160" y="30" width="120" height="16" rx="8" fill="rgba(19,34,56,0.18)"/>
        <rect x="160" y="56" width="90" height="12" rx="6" fill="rgba(19,34,56,0.12)"/>
        <rect x="24" y="108" width="272" height="44" rx="14" fill="rgba(255,255,255,0.58)"/>
        <text x="28" y="42" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#132238">${accent.label}</text>
        <text x="28" y="132" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#132238">${safeName}</text>
        <text x="28" y="154" font-family="Arial, sans-serif" font-size="13" fill="#31455d">${safeCategory}</text>
      </svg>
    `.trim();
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };
  const recentItems = props.recentIds
    .map((id) => props.items.find((item) => item.id === id))
    .filter((item): item is BrickPaletteItem => item !== undefined)
    .slice(0, 6);
  const categoryNames = [...new Set(props.items.map((item) => item.category).filter((item) => item.trim().length > 0))];
  const groupedItems = categoryNames.map((category) => ({
    category,
    items: props.items.filter((item) => item.category === category && !recentItems.some((recent) => recent.id === item.id)),
  })).filter((group) => group.items.length > 0);
  const renderCard = (item: BrickPaletteItem): JSX.Element => {
    const accent = getBrickAccent(item.category);
    const isHighlighted = props.highlightedIds?.includes(item.id) ?? false;
    return (
      <li
        key={item.id}
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData(DRAG_BRICK_MIME, item.id);
          event.dataTransfer.effectAllowed = "copy";
        }}
        style={cardShell(props.selectedId === item.id, isHighlighted)}
      >
        <div
          style={{
            minHeight: "98px",
            borderRadius: "10px",
            padding: "10px",
            display: "grid",
            alignContent: "space-between",
            background: accent.background,
            marginBottom: "8px",
            backgroundImage: `url("${createBrickPreviewUri(item)}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <span style={{ fontSize: "11px", letterSpacing: "0.08em", fontWeight: 700, color: "#203249" }}>{accent.label}</span>
          <strong style={{ color: "#132238" }}>{item.name}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "start" }}>
          <button
            type="button"
            onClick={() => props.onSelect(item.id)}
            style={{ background: "transparent", border: "none", padding: 0, textAlign: "left", cursor: "pointer", color: panelText, fontWeight: 700 }}
          >
            {item.category}
          </button>
          <button
            type="button"
            onClick={() => props.onAddToScene(item.id)}
            style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #445264", background: "#273240", color: "#d9e3ef" }}
          >
            {t("panel.brickPalette.add")}
          </button>
        </div>
        <div style={{ marginTop: "6px", fontSize: "12px", color: "#9fb0c4" }}>{item.summary}</div>
      </li>
    );
  };

  return (
    <div style={{ display: "grid", gap: "10px", color: panelText }}>
      <div>
        <h2 style={{ margin: 0, fontSize: "16px", color: "#f3f7fb" }}>{t("panel.brickPalette.title")}</h2>
        <div style={{ marginTop: "4px", fontSize: "12px", color: "#9caec2" }}>{t("panel.brickPalette.summary", { count: String(props.items.length) })}</div>
      </div>
      {recentItems.length > 0 ? (
        <div style={{ display: "grid", gap: "8px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#b9c8d8" }}>{t("panel.brickPalette.recentTitle")}</div>
          <ul style={{ paddingLeft: 0, margin: 0, listStyle: "none", display: "grid", gap: "8px" }}>
            {recentItems.map((item) => renderCard(item))}
          </ul>
        </div>
      ) : null}
      <div style={{ display: "grid", gap: "10px" }}>
        {groupedItems.map((group) => (
          <div key={group.category} style={{ display: "grid", gap: "8px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#b9c8d8" }}>
              {t("panel.brickPalette.categoryTitle", { category: group.category })}
            </div>
            <ul style={{ paddingLeft: 0, margin: 0, listStyle: "none", display: "grid", gap: "8px" }}>
              {group.items.map((item) => renderCard(item))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
