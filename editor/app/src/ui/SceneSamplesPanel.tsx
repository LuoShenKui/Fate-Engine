import { useI18n } from "./i18n/I18nProvider";

export type SceneSampleItem = {
  id: string;
  name: string;
  summary: string;
  kind: "template" | "preview";
  relatedBrickIds?: string[];
  previewSrc?: string;
};

type SceneSamplesPanelProps = {
  items: SceneSampleItem[];
  selectedId?: string;
  onOpenSample: (sampleId: string) => void;
};

const getSampleAccent = (kind: SceneSampleItem["kind"]): { background: string; label: string } =>
  kind === "template"
    ? { background: "linear-gradient(135deg, #dff1ff 0%, #6ca6d8 100%)", label: "TEMPLATE" }
    : { background: "linear-gradient(135deg, #fff3d8 0%, #d9a76c 100%)", label: "PREVIEW" };

const createSamplePreviewUri = (item: SceneSampleItem): string => {
  if (typeof item.previewSrc === "string" && item.previewSrc.length > 0) {
    return item.previewSrc;
  }
  const accent = getSampleAccent(item.kind);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#d9e5f4"/>
        </linearGradient>
      </defs>
      <rect width="320" height="180" rx="18" fill="url(#bg)"/>
      <rect x="18" y="18" width="120" height="72" rx="12" fill="rgba(255,255,255,0.44)"/>
      <rect x="152" y="28" width="122" height="16" rx="8" fill="rgba(19,34,56,0.18)"/>
      <rect x="152" y="54" width="92" height="12" rx="6" fill="rgba(19,34,56,0.12)"/>
      <rect x="24" y="108" width="272" height="44" rx="14" fill="rgba(255,255,255,0.58)"/>
      <text x="28" y="42" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#132238">${accent.label}</text>
      <text x="28" y="132" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#132238">${item.name.slice(0, 22)}</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export default function SceneSamplesPanel(props: SceneSamplesPanelProps): JSX.Element {
  const { t } = useI18n();
  const shellCard = (selected: boolean) =>
    ({
      display: "grid",
      gap: "8px",
      padding: "12px",
      borderRadius: "10px",
      border: selected ? "1px solid #5f8bc2" : "1px solid #2a3543",
      background: selected
        ? "linear-gradient(180deg, rgba(42, 69, 104, 0.98) 0%, rgba(32, 44, 61, 0.98) 100%)"
        : "linear-gradient(180deg, rgba(43, 51, 62, 0.98) 0%, rgba(34, 42, 52, 0.98) 100%)",
    }) as const;

  return (
    <section style={{ display: "grid", gap: "10px", color: "#dfe8f2" }}>
      <div>
        <h2 style={{ margin: 0, fontSize: "16px", color: "#f3f7fb" }}>{t("panel.sceneSamples.title")}</h2>
        <div style={{ marginTop: "4px", fontSize: "12px", color: "#9caec2" }}>
          {t("panel.sceneSamples.summary", { count: String(props.items.length) })}
        </div>
      </div>
      <div style={{ display: "grid", gap: "8px" }}>
        {props.items.map((item) => {
          const accent = getSampleAccent(item.kind);
          const isSelected = props.selectedId === item.id;
          return (
            <article
              key={item.id}
              style={shellCard(isSelected)}
            >
              <div
                style={{
                  minHeight: "94px",
                  borderRadius: "10px",
                  padding: "10px",
                  display: "grid",
                  alignContent: "space-between",
                  background: accent.background,
                  backgroundImage: `url("${createSamplePreviewUri(item)}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <span style={{ fontSize: "11px", letterSpacing: "0.08em", fontWeight: 700, color: "#203249" }}>{accent.label}</span>
                <strong style={{ color: "#132238" }}>{item.name}</strong>
              </div>
              <div style={{ fontSize: "12px", color: "#d8e1ed" }}>{item.summary}</div>
              {(item.relatedBrickIds ?? []).length > 0 ? <div style={{ fontSize: "11px", color: "#a9b8c9" }}>{t("panel.sceneSamples.relatedBricks", { bricks: item.relatedBrickIds?.join(", ") ?? "" })}</div> : null}
              <button
                type="button"
                onClick={() => props.onOpenSample(item.id)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #5378aa", background: "#2d4d74", color: "#fff" }}
              >
                {t("panel.sceneSamples.open")}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
