import { useI18n } from "./i18n/I18nProvider";
import { getBrickPreviewUri } from "./preview-art";
import { ueGhostButton, ueShellColors } from "./ue-shell-theme";
import type { BrickLibraryItem } from "./brick-library-panel-types";

const menuPanelStyle = {
  position: "absolute",
  top: "calc(100% + 6px)",
  right: 0,
  minWidth: "172px",
  padding: "6px",
  borderRadius: "6px",
  border: `1px solid ${ueShellColors.borderStrong}`,
  background: ueShellColors.panel,
  boxShadow: "0 14px 28px rgba(0, 0, 0, 0.28)",
  zIndex: 10,
} as const;

const menuItemStyle = {
  padding: "8px 10px",
  borderRadius: "4px",
  color: ueShellColors.text,
  fontSize: "12px",
  cursor: "pointer",
} as const;

const getBrickAccent = (category: string): { background: string; border: string; label: string } => {
  if (category === "ability") return { background: "linear-gradient(135deg, #70562a 0%, #2c2417 100%)", border: "#a97a2a", label: "ABILITY" };
  if (category === "enemy") return { background: "linear-gradient(135deg, #743d37 0%, #2f1f1d 100%)", border: "#b85d52", label: "ENEMY" };
  if (category === "composite") return { background: "linear-gradient(135deg, #35516d 0%, #1d2a39 100%)", border: "#668cb0", label: "COMPOSITE" };
  return { background: "linear-gradient(135deg, #46596d 0%, #212d38 100%)", border: "#7d97b2", label: "BRICK" };
};

const createBrickPreviewUri = (item: BrickLibraryItem): string => {
  return getBrickPreviewUri({ id: item.id, name: item.name, category: item.category });
};

type BrickLibraryCardProps = {
  item: BrickLibraryItem;
  isSelected: boolean;
  isHighlighted: boolean;
  t: ReturnType<typeof useI18n>["t"];
  expandedCompositeIds: string[];
  setExpandedCompositeIds: React.Dispatch<React.SetStateAction<string[]>>;
  onSelect: (id: string) => void;
  onAddToScene: (id: string) => void;
  onQuickPreview: (id: string) => void;
  onRemoveBrick: (id: string) => { ok: boolean; message: string };
  onRollbackBrick: (id: string) => { ok: boolean; message: string };
  setImportMessage: React.Dispatch<React.SetStateAction<string>>;
};

export default function BrickLibraryCard(props: BrickLibraryCardProps): JSX.Element {
  const { item, isSelected, isHighlighted, t } = props;
  const isEnglish = t("app.title") === "Fate Engine Editor";
  const accent = getBrickAccent(item.category);
  const isExpanded = props.expandedCompositeIds.includes(item.id);
  const shellStyle = {
    display: "grid",
    gap: "10px",
    padding: "12px",
    borderRadius: "10px",
    border: isSelected ? `1px solid ${ueShellColors.accent}` : isHighlighted ? "1px solid #8b7240" : `1px solid ${ueShellColors.border}`,
    background: isSelected ? "#211d14" : isHighlighted ? "#1f2020" : ueShellColors.panelMuted,
  } as const;
  const actionButton = (tone: "default" | "accent" = "default") =>
    ({
      ...ueGhostButton,
      padding: "7px 10px",
      background: tone === "accent" ? ueShellColors.accent : ueShellColors.panel,
      borderColor: tone === "accent" ? ueShellColors.accent : ueShellColors.borderStrong,
      color: tone === "accent" ? "#11161d" : ueShellColors.text,
      fontSize: "12px",
      fontWeight: 600,
    }) as const;

  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("application/x-fate-brick-id", item.id);
        event.dataTransfer.effectAllowed = "copy";
      }}
      style={shellStyle}
    >
      <div
        style={{
          minHeight: "110px",
          borderRadius: "10px",
          padding: "12px",
          display: "grid",
          alignContent: "space-between",
          background: accent.background,
          border: `1px solid ${accent.border}`,
          backgroundImage: `url("${createBrickPreviewUri(item)}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "start" }}>
          <span style={{ fontSize: "11px", letterSpacing: "0.08em", fontWeight: 700, color: "#f3ddb1" }}>{accent.label}</span>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "end" }}>
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", background: "#1c2630", color: "#dbe5ef", border: `1px solid ${ueShellColors.border}` }}>
              {item.source === "builtin" ? t("panel.brickLibrary.sourceBuiltin") : t("panel.brickLibrary.sourceImported")}
            </span>
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", background: item.installState === "ready" ? "#203526" : item.installState === "blocked" ? "#3a2421" : "#3c3220", color: item.installState === "blocked" ? "#f4b8ac" : item.installState === "ready" ? "#bde0c1" : "#f3d28b" }}>
              {item.installState === "ready" ? t("panel.brickLibrary.statusReady") : item.installState === "blocked" ? t("panel.brickLibrary.statusBlocked") : t("panel.brickLibrary.statusIncomplete")}
            </span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#f4f7fb" }}>{item.name}</div>
          <div style={{ fontSize: "12px", color: "#c3d0df", marginTop: "4px" }}>{item.category}</div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{item.packageId}@{item.version}</div>
        <div style={{ fontSize: "12px", color: ueShellColors.text, marginTop: "6px" }}>{item.summary}</div>
      </div>

      <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>
        {t("panel.brickLibrary.meta", { license: item.license, compat: item.compat, dependencyCount: String(item.dependencies.length) })}
      </div>

      {item.importIssues.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: "18px", color: "#f3d28b", fontSize: "12px" }}>
          {item.importIssues.slice(0, 3).map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}

      {isExpanded && (item.compositeChildren?.length ?? 0) > 0 ? (
        <div style={{ display: "grid", gap: "4px", padding: "8px 10px", borderRadius: "8px", background: ueShellColors.panel, border: `1px solid ${ueShellColors.border}` }}>
          <strong style={{ fontSize: "12px", color: ueShellColors.text }}>{t("panel.brickLibrary.childrenTitle")}</strong>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: ueShellColors.textMuted }}>
            {item.compositeChildren?.map((child) => (
              <li key={`${item.id}-${child.id}`}>{child.id} {" -> "} {child.type}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" onClick={() => props.onSelect(item.id)} style={{ padding: 0, border: "none", background: "transparent", color: ueShellColors.accent, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
          {t("panel.brickLibrary.inspect")}
        </button>
        <details style={{ position: "relative" }}>
          <summary style={{ ...ueGhostButton, listStyle: "none", padding: "6px 10px", fontSize: "12px", fontWeight: 700 }}>
            {isEnglish ? "Actions" : "操作"}
          </summary>
          <div role="menu" style={menuPanelStyle}>
            <div style={menuItemStyle}><button type="button" onClick={() => props.onSelect(item.id)} style={actionButton()}>{t("panel.brickLibrary.inspect")}</button></div>
            <div style={menuItemStyle}><button type="button" onClick={() => props.onAddToScene(item.id)} style={actionButton("accent")}>{t("panel.brickLibrary.addToScene")}</button></div>
            <div style={menuItemStyle}><button type="button" onClick={() => props.onQuickPreview(item.id)} style={actionButton()}>{t("panel.brickLibrary.quickPreview")}</button></div>
            {item.category === "composite" && (item.compositeChildren?.length ?? 0) > 0 ? (
              <div
                role="menuitem"
                tabIndex={0}
                style={menuItemStyle}
                onClick={() => props.setExpandedCompositeIds((prev) => (prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    props.setExpandedCompositeIds((prev) => (prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]));
                  }
                }}
              >
                {isExpanded ? t("panel.brickLibrary.hideChildren") : t("panel.brickLibrary.showChildren")}
              </div>
            ) : null}
            {item.source === "imported" ? (
              <div
                role="menuitem"
                tabIndex={0}
                style={menuItemStyle}
                onClick={() => props.setImportMessage(props.onRemoveBrick(item.id).message)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    props.setImportMessage(props.onRemoveBrick(item.id).message);
                  }
                }}
              >
                {t("panel.brickLibrary.remove")}
              </div>
            ) : null}
            {item.source === "imported" && item.rollbackAvailable ? (
              <div
                role="menuitem"
                tabIndex={0}
                style={menuItemStyle}
                onClick={() => props.setImportMessage(props.onRollbackBrick(item.id).message)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    props.setImportMessage(props.onRollbackBrick(item.id).message);
                  }
                }}
              >
                {t("panel.brickLibrary.rollback")}
              </div>
            ) : null}
          </div>
        </details>
      </div>
    </article>
  );
}
