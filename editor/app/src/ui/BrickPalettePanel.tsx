import { useI18n } from "./i18n/I18nProvider";

export type BrickPaletteItem = {
  id: string;
  name: string;
  summary: string;
};

type BrickPalettePanelProps = {
  items: BrickPaletteItem[];
  onSelect: (id: string) => void;
};

export default function BrickPalettePanel(props: BrickPalettePanelProps): JSX.Element {
  const { t } = useI18n();

  return (
    <div>
      <h2>{t("panel.brickPalette.title")}</h2>
      <ul style={{ paddingLeft: "16px", margin: 0 }}>
        {props.items.map((item) => (
          <li key={item.id} style={{ marginBottom: "10px" }}>
            <button type="button" onClick={() => props.onSelect(item.id)}>
              {item.name}
            </button>
            <div style={{ fontSize: "12px", color: "#57606a" }}>{item.summary}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
