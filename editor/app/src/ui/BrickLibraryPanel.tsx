import { useMemo, useRef, useState } from "react";
import {
  createAuthoringTemplateManifest,
  downloadAuthoringManifest,
  normalizeBrickSlug,
  type BrickAuthoringCheckItem,
  type BrickAuthoringDraft,
  type BrickAuthoringTemplate,
} from "./brick-library-authoring";
import BrickLibraryCard from "./brick-library-panel-card";
import type { BrickImportPreview, BrickLibraryItem } from "./brick-library-panel-types";
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

export default function BrickLibraryPanel(props: BrickLibraryPanelProps): JSX.Element {
  const { t } = useI18n();
  const isEnglish = t("app.title") === "Fate Engine Editor";
  const importFileInputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [expandedCompositeIds, setExpandedCompositeIds] = useState<string[]>([]);
  const [showImportForm, setShowImportForm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [showAuthoringWizard, setShowAuthoringWizard] = useState(false);
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

  const onTemplateChange = (template: BrickAuthoringTemplate): void => {
    const labelByTemplate: Record<BrickAuthoringTemplate, string> = {
      door: "Door",
      switch: "Switch",
      "trigger-zone": "Trigger Zone",
      ladder: "Ladder",
      enemy: "Enemy",
      composite: "Composite",
      "ability-set": "Ability Set",
    };
    const presetByTemplate: Partial<Record<BrickAuthoringTemplate, Pick<BrickAuthoringDraft, "id" | "name" | "packageId" | "summary" | "category">>> = {
      enemy: { id: "patrol-guard", name: "Patrol Guard", packageId: "user.patrol-guard", summary: "A reusable enemy template with patrol and melee defaults.", category: "enemy" },
      composite: { id: "basketball-court", name: "Basketball Court", packageId: "user.basketball-court", summary: "A composite court area that grants basketball abilities inside the zone.", category: "composite" },
      "ability-set": { id: "basketball-ability", name: "Basketball Ability Set", packageId: "user.basketball-ability", summary: "A starter ability set that grants dribble and shoot interactions.", category: "ability" },
    };
    const preset = presetByTemplate[template];
    setAuthoringDraft((prev) => ({
      ...prev,
      template,
      id: preset?.id ?? (prev.id === "" || prev.id.startsWith("new-") ? `new-${template}` : prev.id),
      name: preset?.name ?? (prev.name === "" || prev.name.startsWith("New ") ? `New ${labelByTemplate[template]}` : prev.name),
      packageId: preset?.packageId ?? (prev.packageId === "" || prev.packageId.startsWith("user.new-") ? `user.new-${template}` : prev.packageId),
      category: preset?.category ?? (template === "ability-set" ? "ability" : template === "composite" ? "composite" : template === "enemy" ? "enemy" : "custom"),
      summary: preset?.summary ?? (prev.summary === "A newly authored brick package." ? `A newly authored ${labelByTemplate[template]} brick package.` : prev.summary),
    }));
  };

  const onGenerateAuthoringDraft = (): void => {
    if (authoringIssues.length > 0) {
      setImportMessage(authoringIssues[0] ?? t("import.brick.invalid"));
      return;
    }
    setImportDraft(createAuthoringTemplateManifest(authoringDraft));
    setShowImportForm(true);
    setShowImportConfirm(true);
    setShowAuthoringWizard(false);
    setImportMessage(t("panel.brickLibrary.wizardGenerated", { brickName: authoringDraft.name }));
  };

  const onPackageAuthoringDraft = (): void => {
    if (authoringIssues.length > 0) {
      setImportMessage(authoringIssues[0] ?? t("import.brick.invalid"));
      return;
    }
    const manifestJson = createAuthoringTemplateManifest(authoringDraft);
    downloadAuthoringManifest(manifestJson, authoringDraft.packageId, authoringDraft.version);
    setImportDraft(manifestJson);
    setShowImportForm(true);
    setImportMessage(t("panel.brickLibrary.packageGenerated", { brickName: authoringDraft.name }));
  };

  const onAutofillAuthoringDraft = (): void => {
    setAuthoringDraft((prev) => {
      const normalizedName = prev.name.trim().length > 0 ? prev.name : `New ${prev.template}`;
      const slug = normalizeBrickSlug(prev.id) || normalizeBrickSlug(normalizedName) || `new-${prev.template}`;
      return {
        ...prev,
        id: prev.id.trim().length > 0 ? normalizeBrickSlug(prev.id) : slug,
        name: normalizedName,
        packageId: prev.packageId.trim().length > 0 ? prev.packageId : `user.${slug}`,
        version: prev.version.trim().length > 0 ? prev.version : "0.1.0",
        summary: prev.summary.trim().length > 0 ? prev.summary : `A newly authored ${prev.template} brick package.`,
        category: prev.category.trim().length > 0 ? prev.category : prev.template === "ability-set" ? "ability" : prev.template === "composite" ? "composite" : prev.template === "enemy" ? "enemy" : "custom",
        license: prev.license.trim().length > 0 ? prev.license : "Custom",
      };
    });
    setImportMessage(t("panel.brickLibrary.wizardAutofilled"));
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
    <div style={{ display: "grid", gridTemplateRows: "auto auto auto auto auto auto minmax(0, 1fr)", gap: "12px", minHeight: 0, height: "100%", color: ueShellColors.text }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <div>
          <h2 style={panelTitleStyle}>{t("panel.brickLibrary.title")}</h2>
          <div style={{ fontSize: "12px", color: ueShellColors.textMuted, marginTop: "4px" }}>{t("panel.brickLibrary.summary", { count: String(props.items.length) })}</div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <details style={{ position: "relative" }}>
            <summary style={{ ...ueGhostButton, listStyle: "none", padding: "4px 8px", minWidth: "44px", textAlign: "center", fontSize: "11px", fontWeight: 700 }}>{isEnglish ? "File" : "文件"}</summary>
            <div role="menu" style={menuPanelStyle}>
              <div role="menuitem" tabIndex={0} style={menuItemStyle} onClick={props.onOpenBlankScene}>{isEnglish ? "Blank Scene" : "空白场景"}</div>
              <div role="menuitem" tabIndex={0} style={menuItemStyle} onClick={() => { setShowImportForm((prev) => !prev); setImportMessage(""); setShowImportConfirm(false); }}>{t("panel.brickLibrary.import")}</div>
              <div role="menuitem" tabIndex={0} style={menuItemStyle} onClick={() => importFileInputRef.current?.click()}>{t("panel.brickLibrary.importFile")}</div>
              <div role="menuitem" tabIndex={0} style={menuItemStyle} onClick={props.onExportLockfile}>{t("panel.brickLibrary.exportLockfile")}</div>
            </div>
          </details>
          <details style={{ position: "relative" }}>
            <summary style={{ ...ueGhostButton, listStyle: "none", padding: "4px 8px", minWidth: "44px", textAlign: "center", fontSize: "11px", fontWeight: 700 }}>{isEnglish ? "New" : "新建"}</summary>
            <div role="menu" style={menuPanelStyle}>
              <div role="menuitem" tabIndex={0} style={menuItemStyle} onClick={() => { setShowAuthoringWizard((prev) => !prev); setImportMessage(""); }}>{t("panel.brickLibrary.newBrick")}</div>
            </div>
          </details>
        </div>
      </div>

      <input ref={importFileInputRef} type="file" accept=".json,.lock,.fateblock,.brick" onChange={onImportFileChange} style={{ display: "none" }} />

      {showAuthoringWizard ? (
        <div style={{ ...shellCardStyle, background: "#1b2430" }}>
          <strong style={{ fontSize: "13px", color: ueShellColors.text }}>{t("panel.brickLibrary.wizardTitle")}</strong>
          <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{t("panel.brickLibrary.wizardHint")}</div>
          <label style={{ display: "grid", gap: "4px", fontSize: "12px", color: ueShellColors.text }}>
            {t("panel.brickLibrary.wizardTemplate")}
            <select value={authoringDraft.template} onChange={(event) => onTemplateChange(event.target.value as BrickAuthoringTemplate)} style={{ ...ueGhostButton, padding: "8px 10px" }}>
              <option value="door">{t("panel.brickLibrary.templateDoor")}</option>
              <option value="switch">{t("panel.brickLibrary.templateSwitch")}</option>
              <option value="trigger-zone">{t("panel.brickLibrary.templateTriggerZone")}</option>
              <option value="ladder">{t("panel.brickLibrary.templateLadder")}</option>
              <option value="enemy">{t("panel.brickLibrary.templateEnemy")}</option>
              <option value="composite">{t("panel.brickLibrary.templateComposite")}</option>
              <option value="ability-set">{t("panel.brickLibrary.templateAbilitySet")}</option>
            </select>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
            {[
              ["id", t("panel.brickLibrary.wizardId"), authoringDraft.id],
              ["name", t("panel.brickLibrary.wizardName"), authoringDraft.name],
              ["packageId", t("panel.brickLibrary.wizardPackageId"), authoringDraft.packageId],
              ["version", t("panel.brickLibrary.wizardVersion"), authoringDraft.version],
              ["category", t("panel.brickLibrary.wizardCategory"), authoringDraft.category],
              ["license", t("panel.brickLibrary.wizardLicense"), authoringDraft.license],
            ].map(([key, label, value]) => (
              <label key={key} style={{ display: "grid", gap: "4px", fontSize: "12px", color: ueShellColors.text }}>
                {label}
                <input type="text" value={value} onChange={(event) => setAuthoringDraft((prev) => ({ ...prev, [key]: event.target.value }))} style={{ ...ueGhostButton, padding: "8px 10px" }} />
              </label>
            ))}
          </div>
          <label style={{ display: "grid", gap: "4px", fontSize: "12px", color: ueShellColors.text }}>
            {t("panel.brickLibrary.wizardSummary")}
            <textarea rows={3} value={authoringDraft.summary} onChange={(event) => setAuthoringDraft((prev) => ({ ...prev, summary: event.target.value }))} style={{ ...ueGhostButton, padding: "8px 10px", resize: "vertical" }} />
          </label>
          <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{t("panel.brickLibrary.wizardPreview", { template: authoringDraft.template, packageId: authoringDraft.packageId })}</div>
          <div style={{ display: "grid", gap: "6px" }}>
            <strong style={{ fontSize: "12px", color: ueShellColors.text }}>{t("panel.brickLibrary.checkPanelTitle")}</strong>
            {authoringChecks.map((item) => (
              <div key={`${item.category}-${item.detail}`} style={{ display: "grid", gap: "4px", padding: "8px 10px", borderRadius: "10px", border: `1px solid ${ueShellColors.border}`, background: item.status === "ready" ? "#1d3222" : "#342b1d" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                  <strong style={{ fontSize: "12px", color: ueShellColors.text }}>{item.category}</strong>
                  <span style={{ fontSize: "11px", color: item.status === "ready" ? "#bde0c1" : "#f3d28b" }}>{item.status === "ready" ? t("panel.brickLibrary.checkReady") : t("panel.brickLibrary.checkWarning")}</span>
                </div>
                <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{item.detail}</div>
              </div>
            ))}
          </div>
          {authoringIssues.length > 0 ? <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#f3d28b" }}>{authoringIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{t("panel.brickLibrary.wizardReady")}</div>}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button type="button" onClick={onGenerateAuthoringDraft} style={{ ...ueGhostButton, padding: "8px 12px", background: ueShellColors.accent, borderColor: ueShellColors.accent, color: "#11161d" }}>{t("panel.brickLibrary.wizardGenerate")}</button>
            <button type="button" onClick={onAutofillAuthoringDraft} style={{ ...ueGhostButton, padding: "8px 12px" }}>{t("panel.brickLibrary.wizardAutofill")}</button>
            <button type="button" onClick={onPackageAuthoringDraft} style={{ ...ueGhostButton, padding: "8px 12px" }}>{t("panel.brickLibrary.packageGenerate")}</button>
            <button type="button" onClick={() => setShowAuthoringWizard(false)} style={{ ...ueGhostButton, padding: "8px 12px" }}>{t("panel.brickLibrary.importCancel")}</button>
          </div>
        </div>
      ) : null}

      <input type="text" value={query} placeholder={t("panel.brickLibrary.searchPlaceholder")} onChange={(event) => setQuery(event.target.value)} style={{ width: "100%", boxSizing: "border-box", ...ueGhostButton, padding: "10px 12px" }} />

      <div style={shellCardStyle}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: ueShellColors.textMuted }}>{t("panel.brickLibrary.samplesTitle")}</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button type="button" onClick={() => props.onOpenSample("forest-cabin")} style={ueGhostButton}>{t("panel.brickLibrary.sampleForestCabin")}</button>
          <button type="button" onClick={() => props.onOpenSample("basketball-court")} style={ueGhostButton}>{t("panel.brickLibrary.sampleBasketballCourt")}</button>
          <button type="button" onClick={() => props.onOpenSample("patrol-guard")} style={ueGhostButton}>{t("panel.brickLibrary.samplePatrolGuard")}</button>
        </div>
      </div>

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
          {availableCategories.map((category) => <button key={category} type="button" onClick={() => setCategoryFilter(category)} style={ghostPill(categoryFilter === category)}>{category}</button>)}
        </div>
      </div>

      {showImportForm ? (
        <div style={shellCardStyle}>
          <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{t("panel.brickLibrary.importHint")}</div>
          <textarea value={importDraft} onChange={(event) => setImportDraft(event.target.value)} placeholder={t("panel.brickLibrary.importPlaceholder")} rows={8} style={{ width: "100%", boxSizing: "border-box", ...ueGhostButton, padding: "10px 12px", resize: "vertical", fontFamily: "monospace", fontSize: "12px" }} />
          {importDraft.trim().length > 0 ? (
            <div style={{ ...shellCardStyle, background: ueShellColors.panel }}>
              <strong style={{ fontSize: "12px", color: ueShellColors.text }}>{t("panel.brickLibrary.previewTitle")}</strong>
              {preview.item === null ? (
                <div style={{ fontSize: "12px", color: "#f3d28b" }}>{preview.issues[0] ?? t("import.brick.invalid")}</div>
              ) : (
                <>
                  <div style={{ fontSize: "12px", color: ueShellColors.text }}>{preview.item.name} / {preview.item.packageId}@{preview.item.version}</div>
                  <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{t("panel.brickLibrary.previewSourceType", { sourceType: preview.sourceType })}</div>
                  <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{t("panel.brickLibrary.previewMeta", { license: preview.item.license, compat: preview.item.compat, dependencyCount: String(preview.item.dependencies.length) })}</div>
                  <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{t("panel.brickLibrary.previewContract")}</div>
                  <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: preview.issues.length > 0 ? "#f3d28b" : ueShellColors.textMuted }}>
                    {(preview.issues.length > 0 ? preview.issues : [t("panel.brickDetails.readyMessage")]).map((issue) => <li key={issue}>{issue}</li>)}
                  </ul>
                </>
              )}
            </div>
          ) : null}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button type="button" onClick={onSubmitImport} style={{ ...ueGhostButton, padding: "8px 12px", background: ueShellColors.accent, borderColor: ueShellColors.accent, color: "#11161d" }}>{t("panel.brickLibrary.importReview")}</button>
            <button type="button" onClick={() => { setShowImportForm(false); setShowImportConfirm(false); }} style={{ ...ueGhostButton, padding: "8px 12px" }}>{t("panel.brickLibrary.importCancel")}</button>
          </div>
          {importMessage.length > 0 ? <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{importMessage}</div> : null}
          {showImportConfirm && preview.item !== null ? (
            <div style={{ ...shellCardStyle, background: ueShellColors.panel }}>
              <strong style={{ fontSize: "12px", color: ueShellColors.text }}>{t("panel.brickLibrary.confirmTitle")}</strong>
              <div style={{ fontSize: "12px", color: ueShellColors.text }}>{preview.item.name} / {preview.item.packageId}@{preview.item.version}</div>
              <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{t("panel.brickLibrary.previewSourceType", { sourceType: preview.sourceType })}</div>
              <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{t("panel.brickLibrary.previewMeta", { license: preview.item.license, compat: preview.item.compat, dependencyCount: String(preview.item.dependencies.length) })}</div>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: preview.issues.length > 0 ? "#f3d28b" : ueShellColors.textMuted }}>
                {(preview.issues.length > 0 ? preview.issues : [t("panel.brickLibrary.confirmReady")]).map((issue) => <li key={issue}>{issue}</li>)}
              </ul>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" onClick={onConfirmImport} style={{ ...ueGhostButton, padding: "8px 12px", background: ueShellColors.accent, borderColor: ueShellColors.accent, color: "#11161d" }}>{t("panel.brickLibrary.confirmInstall")}</button>
                <button type="button" onClick={() => setShowImportConfirm(false)} style={{ ...ueGhostButton, padding: "8px 12px" }}>{t("panel.brickLibrary.confirmBack")}</button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: "10px", alignContent: "start", minHeight: 0, overflowY: "auto", overflowX: "hidden", paddingRight: "4px" }}>
        {renderSection(t("panel.brickLibrary.recentTitle"), recentItems)}
        {renderSection(t("panel.brickLibrary.recommendedTitle"), recommendedItems)}
        {renderSection(recentItems.length > 0 || recommendedItems.length > 0 ? t("panel.brickLibrary.allResultsTitle") : null, regularItems)}
      </div>
    </div>
  );
}
