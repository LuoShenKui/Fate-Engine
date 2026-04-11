import { useMemo, useRef, useState } from "react";
import { createAuthoringTemplateManifest, type BrickAuthoringCheckItem, type BrickAuthoringDraft } from "./brick-library-authoring";
import BrickLibraryCard from "./brick-library-panel-card";
import type { BrickImportPreview, BrickLibraryItem } from "./brick-library-panel-types";
import BrickLibraryToolsPanel from "./brick-library-tools-panel";
import { useI18n } from "./i18n/I18nProvider";
import { ueGhostButton, ueShellColors } from "./ue-shell-theme";

export type { BrickImportPreview, BrickLibraryItem } from "./brick-library-panel-types";

type BrickLibraryPanelProps = {
  items: BrickLibraryItem[];
  selectedId: string;
  recentIds: string[];
  recommendedIds: string[];
  highlightedIds?: string[];
  onSelect: (id: string) => void;
  onAddToScene: (id: string) => void;
  onQuickPreview: (id: string) => void;
  onOpenSample: (sampleId: "forest-cabin" | "basketball-court" | "patrol-guard") => void;
  onImportBrick: (json: string) => { ok: boolean; message: string };
  onPreviewBrick: (json: string) => BrickImportPreview;
  onRemoveBrick: (id: string) => { ok: boolean; message: string };
  onRollbackBrick: (id: string) => { ok: boolean; message: string };
  onExportLockfile: () => void;
  onOpenBlankScene: () => void;
};

const panelTitleStyle = {
  margin: 0,
  fontSize: "16px",
  fontWeight: 700,
  color: "#f4f7fb",
} as const;

const shellCardStyle = {
  display: "grid",
  gap: "8px",
  padding: "12px",
  borderRadius: "10px",
  border: `1px solid ${ueShellColors.border}`,
  background: ueShellColors.panelMuted,
} as const;

const ghostPill = (active: boolean, tone: "default" | "success" | "warning" | "danger" = "default") =>
  ({
    ...ueGhostButton,
    padding: "6px 10px",
    borderRadius: "999px",
    background:
      tone === "success" ? (active ? "#233827" : ueShellColors.panel) : tone === "warning" ? (active ? "#40321f" : ueShellColors.panel) : tone === "danger" ? (active ? "#3f2624" : ueShellColors.panel) : active ? "#2a3543" : ueShellColors.panel,
    color: ueShellColors.text,
    fontSize: "12px",
  }) as const;

const CATEGORY_LABELS: Record<string, string> = {
  actor: "Actor",
  ability: "Ability",
  interaction: "Interaction",
  enemy: "Enemy",
  loot: "Loot",
  zone: "Zone",
  "asset-package": "Asset Package",
};

const formatCategoryLabel = (category: string): string => CATEGORY_LABELS[category] ?? category;

export default function BrickLibraryPanel(props: BrickLibraryPanelProps): JSX.Element {
  const { t } = useI18n();
  const isEnglish = t("app.title") === "Fate Engine Editor";
  const importFileInputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [expandedCompositeIds, setExpandedCompositeIds] = useState<string[]>([]);
  const [showImportForm, setShowImportForm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [showAuthoringWizard, setShowAuthoringWizard] = useState(false);
  const [showToolsPanel, setShowToolsPanel] = useState(false);
  const [importDraft, setImportDraft] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [authoringDraft, setAuthoringDraft] = useState<BrickAuthoringDraft>({
    template: "door",
    id: "new-door",
    name: "New Door",
    packageId: "user.new-door",
    version: "0.1.0",
    summary: "A newly authored brick package.",
    category: "custom",
    license: "Custom",
  });
  const [sourceFilter, setSourceFilter] = useState<"all" | "builtin" | "imported">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "ready" | "incomplete" | "blocked">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const preview = useMemo(() => props.onPreviewBrick(importDraft), [importDraft, props]);

  const availableCategories = useMemo(
    () => [...new Set(props.items.map((item) => item.category).filter((value) => value.trim().length > 0))].sort((left, right) => left.localeCompare(right)),
    [props.items],
  );

  const authoringIssues = useMemo(() => {
    const issues: string[] = [];
    if (authoringDraft.id.trim().length === 0) issues.push(t("panel.brickLibrary.wizardIssueId"));
    if (authoringDraft.name.trim().length === 0) issues.push(t("panel.brickLibrary.wizardIssueName"));
    if (authoringDraft.packageId.trim().length === 0) issues.push(t("panel.brickLibrary.wizardIssuePackageId"));
    return issues;
  }, [authoringDraft, t]);

  const authoringChecks = useMemo<BrickAuthoringCheckItem[]>(() => {
    const generated = JSON.parse(createAuthoringTemplateManifest(authoringDraft)) as Record<string, unknown>;
    const properties = Array.isArray(generated.properties) ? generated.properties.length : 0;
    const slots = Array.isArray(generated.slots) ? generated.slots.length : 0;
    const ports = Array.isArray(generated.ports) ? generated.ports.length : 0;
    const slotNames = Array.isArray(generated.slots)
      ? generated.slots
          .map((slot) => (typeof slot === "object" && slot !== null && "slotId" in slot && typeof (slot as { slotId: unknown }).slotId === "string" ? (slot as { slotId: string }).slotId : null))
          .filter((slotId): slotId is string => slotId !== null)
      : [];
    return [
      { category: t("panel.brickLibrary.checkMetadata"), status: authoringIssues.length === 0 ? "ready" : "warning", detail: authoringIssues.length === 0 ? t("panel.brickLibrary.checkMetadataReady", { packageId: authoringDraft.packageId, version: authoringDraft.version }) : authoringIssues.join(" ") },
      { category: t("panel.brickLibrary.checkParameters"), status: properties > 0 ? "ready" : "warning", detail: t("panel.brickLibrary.checkParametersDetail", { count: String(properties) }) },
      { category: t("panel.brickLibrary.checkResources"), status: slots > 0 ? "ready" : "warning", detail: t("panel.brickLibrary.checkResourcesDetail", { count: String(slots), slots: slotNames.join(", ") || "n/a" }) },
      { category: t("panel.brickLibrary.checkPorts"), status: ports > 0 ? "ready" : "warning", detail: t("panel.brickLibrary.checkPortsDetail", { count: String(ports) }) },
    ];
  }, [authoringDraft, authoringIssues, t]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return props.items.filter((item) => {
      const matchesQuery = normalizedQuery.length === 0 || [item.id, item.name, item.summary, item.packageId, item.category].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesSource = sourceFilter === "all" || item.source === sourceFilter;
      const matchesStatus = statusFilter === "all" || item.installState === statusFilter;
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      return matchesQuery && matchesSource && matchesStatus && matchesCategory;
    });
  }, [categoryFilter, props.items, query, sourceFilter, statusFilter]);

  const recentItems = useMemo(
    () =>
      props.recentIds
        .map((id) => filteredItems.find((item) => item.id === id))
        .filter((item): item is BrickLibraryItem => item !== undefined)
        .slice(0, 6),
    [filteredItems, props.recentIds],
  );
  const recommendedItems = useMemo(
    () =>
      props.recommendedIds
        .map((id) => filteredItems.find((item) => item.id === id))
        .filter((item): item is BrickLibraryItem => item !== undefined && !recentItems.some((recent) => recent.id === item.id))
        .slice(0, 6),
    [filteredItems, props.recommendedIds, recentItems],
  );
  const regularItems = useMemo(
    () => filteredItems.filter((item) => !recentItems.some((recent) => recent.id === item.id) && !recommendedItems.some((recommended) => recommended.id === item.id)),
    [filteredItems, recentItems, recommendedItems],
  );

  const onSubmitImport = (): void => {
    if (preview.item === null) {
      setImportMessage(t("import.brick.invalid"));
      return;
    }
    setShowImportConfirm(true);
  };

  const onConfirmImport = (): void => {
    const result = props.onImportBrick(importDraft);
    setImportMessage(result.message);
    if (result.ok) {
      setImportDraft("");
      setShowImportForm(false);
      setShowImportConfirm(false);
    }
  };

  const onImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (file === undefined) return;
    try {
      const text = await file.text();
      setImportDraft(text);
      setShowImportForm(true);
      setShowImportConfirm(false);
      setImportMessage(t("panel.brickLibrary.fileLoaded", { fileName: file.name }));
    } catch {
      setImportMessage(t("panel.brickLibrary.fileLoadFailed", { fileName: file.name }));
    } finally {
      event.target.value = "";
    }
  };

  const renderSection = (title: string | null, items: BrickLibraryItem[]): JSX.Element | null =>
    items.length === 0 ? null : (
      <div style={{ display: "grid", gap: "10px" }}>
        {title !== null ? <div style={{ fontSize: "12px", fontWeight: 700, color: ueShellColors.textMuted }}>{title}</div> : null}
        {items.map((item) => (
          <BrickLibraryCard
            key={`${item.source}-${item.id}`}
            item={item}
            isSelected={item.id === props.selectedId}
            isHighlighted={props.highlightedIds?.includes(item.id) ?? false}
            t={t}
            expandedCompositeIds={expandedCompositeIds}
            setExpandedCompositeIds={setExpandedCompositeIds}
            onSelect={props.onSelect}
            onAddToScene={props.onAddToScene}
            onQuickPreview={props.onQuickPreview}
            onRemoveBrick={props.onRemoveBrick}
            onRollbackBrick={props.onRollbackBrick}
            setImportMessage={setImportMessage}
          />
        ))}
      </div>
    );

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto auto auto auto minmax(0, 1fr)", gap: "12px", minHeight: 0, height: "100%", color: ueShellColors.text }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <div>
          <h2 style={panelTitleStyle}>{t("panel.brickLibrary.title")}</h2>
          <div style={{ fontSize: "12px", color: ueShellColors.textMuted, marginTop: "4px" }}>{t("panel.brickLibrary.summary", { count: String(props.items.length) })}</div>
        </div>
        <button
          type="button"
          onClick={() => setShowToolsPanel((prev) => !prev)}
          style={{ ...ueGhostButton, padding: "6px 10px", minWidth: "64px", textAlign: "center", fontSize: "11px", fontWeight: 700 }}
        >
          {showToolsPanel ? (isEnglish ? "Hide Tools" : "收起工具") : (isEnglish ? "Tools" : "工具")}
        </button>
      </div>

      <input ref={importFileInputRef} type="file" accept=".json,.lock,.fateblock,.brick" onChange={onImportFileChange} style={{ display: "none" }} />

      <input type="text" value={query} placeholder={t("panel.brickLibrary.searchPlaceholder")} onChange={(event) => setQuery(event.target.value)} style={{ width: "100%", boxSizing: "border-box", ...ueGhostButton, padding: "10px 12px" }} />

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button type="button" onClick={() => { setSourceFilter("all"); setStatusFilter("all"); setCategoryFilter("all"); }} style={ghostPill(sourceFilter === "all" && statusFilter === "all" && categoryFilter === "all")}>{t("panel.brickLibrary.filterAll")}</button>
        <button type="button" onClick={() => setSourceFilter("builtin")} style={ghostPill(sourceFilter === "builtin")}>{t("panel.brickLibrary.sourceBuiltin")}</button>
        <button type="button" onClick={() => setSourceFilter("imported")} style={ghostPill(sourceFilter === "imported")}>{t("panel.brickLibrary.sourceImported")}</button>
        <button type="button" onClick={() => setStatusFilter("ready")} style={ghostPill(statusFilter === "ready", "success")}>{t("panel.brickLibrary.statusReady")}</button>
        <button type="button" onClick={() => setStatusFilter("incomplete")} style={ghostPill(statusFilter === "incomplete", "warning")}>{t("panel.brickLibrary.statusIncomplete")}</button>
        <button type="button" onClick={() => setStatusFilter("blocked")} style={ghostPill(statusFilter === "blocked", "danger")}>{t("panel.brickLibrary.statusBlocked")}</button>
      </div>

      <div style={{ display: "grid", gap: "6px" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: ueShellColors.textMuted }}>{t("panel.brickLibrary.categoryFilterTitle")}</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button type="button" onClick={() => setCategoryFilter("all")} style={ghostPill(categoryFilter === "all")}>{t("panel.brickLibrary.filterAll")}</button>
          {availableCategories.map((category) => <button key={category} type="button" onClick={() => setCategoryFilter(category)} style={ghostPill(categoryFilter === category)}>{formatCategoryLabel(category)}</button>)}
        </div>
      </div>

      {showToolsPanel ? (
        <BrickLibraryToolsPanel
          isEnglish={isEnglish}
          importFileInputRef={importFileInputRef}
          showImportForm={showImportForm}
          setShowImportForm={setShowImportForm}
          showImportConfirm={showImportConfirm}
          setShowImportConfirm={setShowImportConfirm}
          showAuthoringWizard={showAuthoringWizard}
          setShowAuthoringWizard={setShowAuthoringWizard}
          importDraft={importDraft}
          setImportDraft={setImportDraft}
          importMessage={importMessage}
          setImportMessage={setImportMessage}
          authoringDraft={authoringDraft}
          setAuthoringDraft={setAuthoringDraft}
          authoringIssues={authoringIssues}
          authoringChecks={authoringChecks}
          preview={preview}
          t={t}
          onOpenBlankScene={props.onOpenBlankScene}
          onOpenSample={props.onOpenSample}
          onExportLockfile={props.onExportLockfile}
          onSubmitImport={onSubmitImport}
          onConfirmImport={onConfirmImport}
        />
      ) : null}

      <div style={{ display: "grid", gap: "10px", alignContent: "start", minHeight: 0, overflowY: "auto", overflowX: "hidden", paddingRight: "4px" }}>
        {renderSection(recentItems.length > 0 || recommendedItems.length > 0 ? t("panel.brickLibrary.allResultsTitle") : null, regularItems)}
        {recentItems.length > 0 ? (
          <details>
            <summary style={{ cursor: "pointer", fontSize: "12px", fontWeight: 700, color: ueShellColors.textMuted }}>{t("panel.brickLibrary.recentTitle")}</summary>
            <div style={{ display: "grid", gap: "10px", marginTop: "10px" }}>{recentItems.map((item) => (
              <BrickLibraryCard
                key={`recent-${item.source}-${item.id}`}
                item={item}
                isSelected={item.id === props.selectedId}
                isHighlighted={props.highlightedIds?.includes(item.id) ?? false}
                t={t}
                expandedCompositeIds={expandedCompositeIds}
                setExpandedCompositeIds={setExpandedCompositeIds}
                onSelect={props.onSelect}
                onAddToScene={props.onAddToScene}
                onQuickPreview={props.onQuickPreview}
                onRemoveBrick={props.onRemoveBrick}
                onRollbackBrick={props.onRollbackBrick}
                setImportMessage={setImportMessage}
              />
            ))}</div>
          </details>
        ) : null}
        {recommendedItems.length > 0 ? (
          <details>
            <summary style={{ cursor: "pointer", fontSize: "12px", fontWeight: 700, color: ueShellColors.textMuted }}>{t("panel.brickLibrary.recommendedTitle")}</summary>
            <div style={{ display: "grid", gap: "10px", marginTop: "10px" }}>{recommendedItems.map((item) => (
              <BrickLibraryCard
                key={`recommended-${item.source}-${item.id}`}
                item={item}
                isSelected={item.id === props.selectedId}
                isHighlighted={props.highlightedIds?.includes(item.id) ?? false}
                t={t}
                expandedCompositeIds={expandedCompositeIds}
                setExpandedCompositeIds={setExpandedCompositeIds}
                onSelect={props.onSelect}
                onAddToScene={props.onAddToScene}
                onQuickPreview={props.onQuickPreview}
                onRemoveBrick={props.onRemoveBrick}
                onRollbackBrick={props.onRollbackBrick}
                setImportMessage={setImportMessage}
              />
            ))}</div>
          </details>
        ) : null}
      </div>
    </div>
  );
}
