import { getBrickDefinition } from "../domain/registry";
import {
  createDefaultEditorDemoRecipe,
  downloadRecipe,
  exportRecipe,
  importRecipe,
  loadFromLocalStorage,
  saveToLocalStorage,
  type EditorRecipeV0,
} from "../project/recipe";
import { assembleWorkflowTemplate, listWorkflowTemplates, type WorkflowTemplateId } from "../workflow/templates";
import type { BrickImportPreview, BrickLibraryItem } from "./BrickLibraryPanel";
import { RECENT_BRICKS_LIMIT } from "./app-constants";
import {
  parseDependencyRequirement,
  toInstallReportItems,
} from "./app-catalog";
import {
  assessImportedEntries,
  createDependencyCandidateEntry,
  detectImportSourceType,
  exportInstalledBrickLockfile,
  extractDependencyIdFromIssue,
  parseImportedBrickBatch,
} from "./app-imports";
import { toPropertyFields } from "./app-property-helpers";
import {
  applySlotFallbackBindings,
  buildForestCabinDemoScene,
  buildCompositeSceneInsertion,
  buildQuickPreviewScene,
  createSceneNodeId,
  createSceneNodeTransform,
  getEnemyPatrolRoutePoints,
} from "./app-scene";
import type { CanvasNode, CanvasEdge } from "./GraphCanvasPanel";
import type { InstallReportItem } from "./InstallReportPanel";
import type { PropertyField } from "./PropertyInspectorPanel";
import { getBrickPreviewUri, getScenePreviewUri } from "./preview-art";
import type { SceneSampleItem } from "./SceneSamplesPanel";
import type { AbilityGrantState, BrickCatalogEntry } from "./app-types";
import type { ValidationItem } from "./ValidationPanel";

type Setter<T> = (value: T | ((prev: T) => T)) => void;

export const buildSceneSampleItems = (): SceneSampleItem[] => [
  ...listWorkflowTemplates().map((template) => ({
    id: `template:${template.id}`,
    name: template.name,
    summary: `${template.nodes.length} nodes / ${template.edges.length} edges`,
    kind: "template" as const,
    relatedBrickIds: [...new Set(template.nodes.map((node) => node.type).filter((type): type is string => typeof type === "string"))],
    previewSrc: getScenePreviewUri(template.name, "template"),
  })),
  {
    id: "preview:basketball-court",
    name: "Basketball Court Preview",
    summary: "Open the composite court preview with ability grant behavior.",
    kind: "preview" as const,
    relatedBrickIds: ["basketball-court", "basketball-ability", "door", "trigger-zone"],
    previewSrc: getScenePreviewUri("Basketball Court", "preview"),
  },
  {
    id: "preview:patrol-guard",
    name: "Patrol Guard Preview",
    summary: "Open the enemy template preview with patrol guard defaults.",
    kind: "preview" as const,
    relatedBrickIds: ["patrol-guard", "trigger-zone"],
    previewSrc: getBrickPreviewUri({ id: "patrol-guard", name: "Patrol Guard", category: "enemy" }),
  },
];

type Translate = (key: string, params?: Record<string, string>) => string;

type CreateLibraryActionsArgs = {
  t: Translate;
  getRecipe: () => EditorRecipeV0;
  applyRecipe: (recipe: EditorRecipeV0) => void;
  renderBatchValidate: (recipe: EditorRecipeV0) => void;
  pushWorkspaceNotice: (item: ValidationItem) => void;
  catalogEntries: BrickCatalogEntry[];
  importedBricks: BrickCatalogEntry[];
  importedBrickHistory: Record<string, BrickCatalogEntry[]>;
  sceneSampleItems: SceneSampleItem[];
  nodes: CanvasNode[];
  slotBindings: Record<string, string>;
  fieldDraftsByBrickId: Record<string, PropertyField[]>;
  selectedBrick: string;
  setInstallReportItems: Setter<InstallReportItem[]>;
  setImportedBrickHistory: Setter<Record<string, BrickCatalogEntry[]>>;
  setImportedBricks: Setter<BrickCatalogEntry[]>;
  setFieldDraftsByBrickId: Setter<Record<string, PropertyField[]>>;
  setSelectedBrick: Setter<string>;
  setRecentBrickIds: Setter<string[]>;
  setSelectedSampleId: Setter<string>;
  setActiveRightPanelTab: Setter<"install" | "details" | "inspector">;
  setNodes: Setter<CanvasNode[]>;
  setEdges: Setter<CanvasEdge[]>;
  setSlotBindings: Setter<Record<string, string>>;
  setSelectedSceneNodeId: Setter<string>;
  setGrantedAbilities: Setter<AbilityGrantState[]>;
  addQuickNotice?: boolean;
};

export const createAppLibraryActions = ({
  t,
  getRecipe,
  applyRecipe,
  renderBatchValidate,
  pushWorkspaceNotice,
  catalogEntries,
  importedBricks,
  importedBrickHistory,
  sceneSampleItems,
  nodes,
  slotBindings,
  fieldDraftsByBrickId,
  selectedBrick,
  setInstallReportItems,
  setImportedBrickHistory,
  setImportedBricks,
  setFieldDraftsByBrickId,
  setSelectedBrick,
  setRecentBrickIds,
  setSelectedSampleId,
  setActiveRightPanelTab,
  setNodes,
  setEdges,
  setSlotBindings,
  setSelectedSceneNodeId,
  setGrantedAbilities,
}: CreateLibraryActionsArgs) => {
  const recordRecentBrick = (brickId: string): void => {
    setRecentBrickIds((prev) => [brickId, ...prev.filter((id) => id !== brickId)].slice(0, RECENT_BRICKS_LIMIT));
  };

  const onQuickPreviewBrick = (brickId: string): void => {
    const definition = catalogEntries.find((entry) => entry.id === brickId);
    if (definition === undefined) {
      return;
    }
    recordRecentBrick(brickId);
    const previewScene =
      definition.category === "composite" && definition.compositeChildren.length > 0
        ? buildCompositeSceneInsertion(definition, [], catalogEntries)
        : buildQuickPreviewScene(brickId, definition.runtimeKind, definition.category, definition.grantedAbilityPackageIds);
    const nextBindings = previewScene.nodes.reduce<Record<string, string>>((acc, node) => {
      const entry = catalogEntries.find((candidate) => candidate.id === node.type);
      return applySlotFallbackBindings(acc, entry);
    }, {});
    setGrantedAbilities([]);
    setNodes(previewScene.nodes);
    setEdges(previewScene.edges);
    setSlotBindings(nextBindings);
    setSelectedBrick(brickId);
    setSelectedSceneNodeId(previewScene.nodes[0]?.id ?? brickId);
    pushWorkspaceNotice({ level: "Info", message: t("scene.previewReady", { brickName: definition.name }) });
  };

  const addBrickToScene = (brickId: string, position?: [number, number, number]): void => {
    recordRecentBrick(brickId);
    const definition = catalogEntries.find((entry) => entry.id === brickId);
    if (definition !== undefined && definition.category === "ability") {
      onQuickPreviewBrick(brickId);
      pushWorkspaceNotice({ level: definition.installState === "ready" ? "Info" : "Warning", message: t("scene.abilityPreviewReady", { brickName: definition.name }) });
      return;
    }
    if (definition !== undefined && definition.category === "composite" && definition.compositeChildren.length > 0) {
      const insertion = buildCompositeSceneInsertion(definition, nodes, catalogEntries, position);
      setNodes((prev) => [...prev, ...insertion.nodes]);
      setEdges((prev) => [...prev, ...insertion.edges]);
      const nextBindings = insertion.nodes.reduce<Record<string, string>>((acc, node) => {
        const entry = catalogEntries.find((candidate) => candidate.id === node.type);
        return applySlotFallbackBindings(acc, entry);
      }, { ...slotBindings });
      setSlotBindings(nextBindings);
      setSelectedSceneNodeId(insertion.nodes[0]?.id ?? brickId);
      setSelectedBrick(brickId);
      pushWorkspaceNotice({ level: definition.installState === "ready" ? "Info" : "Warning", message: t("scene.compositeAdded", { brickName: definition.name, count: String(insertion.nodes.length) }) });
      return;
    }
    const nextTransform: NonNullable<CanvasNode["transform"]> = position !== undefined ? { position, rotation: [0, 0, 0] as [number, number, number] } : createSceneNodeTransform(nodes.length) ?? { position: [0, 0, 0], rotation: [0, 0, 0] };
    const nextPosition = nextTransform.position ?? [0, 0, 0];
    const enemyRouteField = (fieldDraftsByBrickId[brickId] ?? []).find((field) => field.key === "patrolRoute");
    const enemyRouteId = typeof enemyRouteField?.value === "string" ? enemyRouteField.value : "route_guard_a";
    const nextNode: CanvasNode = {
      id: createSceneNodeId(brickId, nodes),
      type: brickId,
      transform: nextTransform,
      meta: definition?.category === "enemy" ? { patrolRoutePoints: getEnemyPatrolRoutePoints(enemyRouteId, nextPosition) } : definition?.grantedAbilityPackageIds.length ? { grantedAbilityPackageIds: definition.grantedAbilityPackageIds } : undefined,
    };
    setNodes((prev) => [...prev, nextNode]);
    setSlotBindings((prev) => applySlotFallbackBindings(prev, definition));
    setSelectedSceneNodeId(nextNode.id);
    setSelectedBrick(brickId);
    if (definition !== undefined) {
      const message = t("scene.added", { brickName: definition.name });
      pushWorkspaceNotice({ level: definition.installState === "ready" ? "Info" : "Warning", message });
      window.alert(message);
    }
  };

  const onExport = (): void => {
    const json = exportRecipe(getRecipe());
    downloadRecipe(json);
    window.alert(t("export.started"));
  };

  const onApplyTemplate = (): void => {
    const baseRecipe = createDefaultEditorDemoRecipe();
    const assembled = assembleWorkflowTemplate("forest_cabin_v0");
    const forestDemo = buildForestCabinDemoScene(assembled.nodes as CanvasNode[], assembled.edges as CanvasEdge[], catalogEntries);
    applyRecipe({ ...baseRecipe, nodes: forestDemo.nodes, edges: forestDemo.edges, params: { ...baseRecipe.params, selected_brick: forestDemo.nodes.find((node) => node.type !== "door")?.type ?? forestDemo.nodes[0]?.type ?? "door" } });
    window.alert(t("template.applied"));
  };

  const onOpenBlankScene = (): void => {
    const baseRecipe = createDefaultEditorDemoRecipe();
    applyRecipe({ ...baseRecipe, nodes: [], edges: [], params: { ...baseRecipe.params, selected_brick: selectedBrick } });
    setSelectedSceneNodeId("");
    setGrantedAbilities([]);
    pushWorkspaceNotice({ level: "Info", message: "Blank scene ready." });
  };

  const onApplyWorkflowTemplate = (templateId: WorkflowTemplateId): void => {
    const baseRecipe = createDefaultEditorDemoRecipe();
    const assembled = assembleWorkflowTemplate(templateId);
    const nextScene = templateId === "forest_cabin_v0" ? buildForestCabinDemoScene(assembled.nodes as CanvasNode[], assembled.edges as CanvasEdge[], catalogEntries) : { nodes: assembled.nodes as CanvasNode[], edges: assembled.edges as CanvasEdge[] };
    applyRecipe({ ...baseRecipe, nodes: nextScene.nodes, edges: nextScene.edges, params: { ...baseRecipe.params, selected_brick: nextScene.nodes[0]?.type ?? "door" } });
    pushWorkspaceNotice({ level: "Info", message: t("template.applied") });
  };

  const onOpenSampleScene = (sampleId: "forest-cabin" | "basketball-court" | "patrol-guard"): void => {
    if (sampleId === "forest-cabin") return onApplyTemplate();
    if (sampleId === "basketball-court") {
      recordRecentBrick("basketball-court");
      return onQuickPreviewBrick("basketball-court");
    }
    recordRecentBrick("patrol-guard");
    onQuickPreviewBrick("patrol-guard");
  };

  const onOpenSceneSample = (sampleId: string): void => {
    setSelectedSampleId(sampleId);
    const firstRelatedBrickId = sceneSampleItems.find((item) => item.id === sampleId)?.relatedBrickIds?.[0];
    if (typeof firstRelatedBrickId === "string") {
      setSelectedBrick(firstRelatedBrickId);
      setActiveRightPanelTab("details");
    }
    if (sampleId.startsWith("template:")) return onApplyWorkflowTemplate(sampleId.replace("template:", "") as WorkflowTemplateId);
    if (sampleId === "preview:basketball-court") return onOpenSampleScene("basketball-court");
    if (sampleId === "preview:patrol-guard") return onOpenSampleScene("patrol-guard");
  };

  const onImport = (): void => {
    const json = window.prompt(t("import.prompt"));
    if (json === null) return;
    const recipe = importRecipe(json);
    if (recipe === null) {
      window.alert(t("import.failed"));
      return;
    }
    applyRecipe(recipe);
    window.alert(t("import.success"));
  };

  const onImportBrick = (json?: string): { ok: boolean; message: string } => {
    const source = json ?? window.prompt(t("panel.brickLibrary.importPlaceholder")) ?? "";
    const importedEntries = parseImportedBrickBatch(source);
    if (importedEntries === null) {
      const message = t("import.brick.invalid");
      pushWorkspaceNotice({ level: "Error", message });
      if (json === undefined) window.alert(message);
      return { ok: false, message };
    }
    const assessedEntries = assessImportedEntries(importedEntries, catalogEntries);
    setInstallReportItems(toInstallReportItems(assessedEntries));
    setImportedBrickHistory((prev) => {
      const next = { ...prev };
      assessedEntries.forEach((entry) => {
        const current = importedBricks.find((installed) => installed.id === entry.id);
        if (current !== undefined) next[entry.id] = [current, ...(next[entry.id] ?? [])].slice(0, 5);
      });
      return next;
    });
    const importedIds = new Set(assessedEntries.map((entry) => entry.id));
    const replacedCount = assessedEntries.filter((entry) => catalogEntries.some((catalogEntry) => catalogEntry.id === entry.id)).length;
    setImportedBricks((prev) => [...prev.filter((entry) => !importedIds.has(entry.id)), ...assessedEntries]);
    setFieldDraftsByBrickId((prev) => {
      const next = { ...prev };
      assessedEntries.forEach((entry) => {
        next[entry.id] = prev[entry.id] ?? toPropertyFields(entry);
      });
      return next;
    });
    const firstImported = assessedEntries[0];
    if (firstImported !== undefined) setSelectedBrick(firstImported.id);
    const message = importedEntries.length === 1 && firstImported !== undefined ? (replacedCount > 0 ? t("import.brick.replaced", { brickName: firstImported.name }) : t("import.brick.success", { brickName: firstImported.name })) : t("import.brick.batchSuccess", { count: String(importedEntries.length), replacedCount: String(replacedCount) });
    pushWorkspaceNotice({ level: assessedEntries.some((entry) => entry.importIssues.length > 0) ? "Warning" : "Info", message });
    if (json === undefined) window.alert(message);
    return { ok: true, message };
  };

  const previewBrickImport = (json: string): BrickImportPreview => {
    const sourceType = detectImportSourceType(json);
    if (json.trim().length === 0) return { item: null, issues: [], sourceType };
    const importedEntries = parseImportedBrickBatch(json);
    if (importedEntries === null) return { item: null, issues: [t("import.brick.invalid")], sourceType };
    const assessedEntries = assessImportedEntries(importedEntries, catalogEntries);
    setInstallReportItems(toInstallReportItems(assessedEntries));
    const imported = assessedEntries[0];
    const previewIssues = assessedEntries.flatMap((entry) => {
      const issues = [...entry.importIssues];
      const existingEntry = catalogEntries.find((catalogEntry) => catalogEntry.id === entry.id);
      if (existingEntry !== undefined) issues.unshift(t("import.brick.previewReplace", { brickName: existingEntry.name }));
      return issues.map((issue) => `${entry.name}: ${issue}`);
    });
    if (importedEntries.length > 1) previewIssues.unshift(t("import.brick.batchPreview", { count: String(importedEntries.length) }));
    return {
      item: {
        id: imported.id,
        name: imported.name,
        summary: imported.summary,
        packageId: imported.packageId,
        version: imported.version,
        license: imported.license,
        dependencies: imported.dependencies,
        compat: imported.compat,
        source: imported.source,
        category: imported.category,
        installState: imported.installState,
        importIssues: imported.importIssues,
        rollbackAvailable: (importedBrickHistory[imported.id]?.length ?? 0) > 0,
      },
      issues: previewIssues,
      sourceType,
    };
  };

  const onRemoveImportedBrick = (brickId: string): { ok: boolean; message: string } => {
    const target = importedBricks.find((entry) => entry.id === brickId);
    if (target === undefined) return { ok: false, message: t("import.brick.invalid") };
    const instanceCount = nodes.filter((node) => node.type === brickId).length;
    if (instanceCount > 0) {
      const message = t("import.brick.removeBlocked", { brickName: target.name, count: String(instanceCount) });
      pushWorkspaceNotice({ level: "Warning", message });
      return { ok: false, message };
    }
    setImportedBricks((prev) => prev.filter((entry) => entry.id !== brickId));
    setFieldDraftsByBrickId((prev) => {
      const next = { ...prev };
      delete next[brickId];
      return next;
    });
    if (selectedBrick === brickId) setSelectedBrick("door");
    const message = t("import.brick.removed", { brickName: target.name });
    pushWorkspaceNotice({ level: "Info", message });
    return { ok: true, message };
  };

  const onRollbackImportedBrick = (brickId: string): { ok: boolean; message: string } => {
    const historyEntries = importedBrickHistory[brickId] ?? [];
    const previousEntry = historyEntries[0];
    const currentEntry = importedBricks.find((entry) => entry.id === brickId);
    if (previousEntry === undefined || currentEntry === undefined) {
      const message = t("import.brick.rollbackMissing", { brickName: currentEntry?.name ?? brickId });
      pushWorkspaceNotice({ level: "Warning", message });
      return { ok: false, message };
    }
    setImportedBricks((prev) => [...prev.filter((entry) => entry.id !== brickId), previousEntry]);
    setImportedBrickHistory((prev) => ({ ...prev, [brickId]: [currentEntry, ...historyEntries.slice(1)].slice(0, 5) }));
    setFieldDraftsByBrickId((prev) => ({ ...prev, [brickId]: prev[brickId] ?? toPropertyFields(previousEntry) }));
    setSelectedBrick(previousEntry.id);
    const message = t("import.brick.rollback", { brickName: previousEntry.name });
    pushWorkspaceNotice({ level: "Info", message });
    return { ok: true, message };
  };

  const onExportInstalledLockfile = (): void => {
    downloadRecipe(exportInstalledBrickLockfile(importedBricks), "installed-bricks.lock.json");
    pushWorkspaceNotice({ level: "Info", message: "Exported installed brick lockfile." });
  };

  const onInspectInstallReportBrick = (brickId: string): void => {
    const target = catalogEntries.find((entry) => entry.id === brickId);
    if (target === undefined) return;
    setSelectedBrick(target.id);
    pushWorkspaceNotice({ level: "Info", message: t("import.brick.resolve.selectBrick", { brickName: target.name }) });
  };

  const onResolveInstallIssue = (item: InstallReportItem): void => {
    if (item.code === "DEPENDENCY_MISSING" || item.code === "DEPENDENCY_VERSION_CONFLICT") {
      const dependencyId = extractDependencyIdFromIssue(item.detail);
      if (dependencyId !== null) {
        const parsedDependency = parseDependencyRequirement(item.detail.replace(/^.*DEPENDENCY_(?:MISSING|VERSION_CONFLICT):\s*/, ""));
        const dependency = catalogEntries.find((entry) => entry.packageId === dependencyId || entry.id === dependencyId);
        if (dependency !== undefined) {
          setSelectedBrick(dependency.id);
          pushWorkspaceNotice({ level: "Info", message: t("import.brick.resolve.selectDependency", { brickName: dependency.name }) });
          return;
        }
        const candidate = createDependencyCandidateEntry(dependencyId, parsedDependency.requirement, catalogEntries);
        if (candidate !== null) {
          setImportedBricks((prev) => [...prev.filter((entry) => entry.id !== candidate.id), candidate]);
          setFieldDraftsByBrickId((prev) => ({ ...prev, [candidate.id]: prev[candidate.id] ?? toPropertyFields(candidate) }));
          setSelectedBrick(candidate.id);
          pushWorkspaceNotice({ level: "Info", message: t("import.brick.resolve.installedCandidate", { brickName: candidate.name }) });
          return;
        }
        pushWorkspaceNotice({ level: "Warning", message: t("import.brick.resolve.missingDependency", { dependencyId }) });
        return;
      }
    }
    onInspectInstallReportBrick(item.brickId);
  };

  const onSave = (): void => {
    const recipe = getRecipe();
    renderBatchValidate(recipe);
    window.alert(saveToLocalStorage(recipe) ? t("save.success") : t("save.failed"));
  };

  const onLoad = (): void => {
    const recipe = loadFromLocalStorage();
    if (recipe === null) {
      window.alert(t("load.notFound"));
      return;
    }
    applyRecipe(recipe);
    window.alert(t("load.success"));
  };

  const onSelectSceneNode = (nodeId: string): void => {
    setSelectedSceneNodeId(nodeId);
    const nodeType = nodes.find((node) => node.id === nodeId)?.type ?? getBrickDefinition(nodeId)?.id;
    if (typeof nodeType === "string") setSelectedBrick(nodeType);
  };

  return {
    recordRecentBrick,
    addBrickToScene,
    onQuickPreviewBrick,
    onExport,
    onApplyTemplate,
    onOpenBlankScene,
    onApplyWorkflowTemplate,
    onOpenSampleScene,
    onOpenSceneSample,
    onImport,
    onImportBrick,
    previewBrickImport,
    onRemoveImportedBrick,
    onRollbackImportedBrick,
    onExportInstalledLockfile,
    onInspectInstallReportBrick,
    onResolveInstallIssue,
    onSave,
    onLoad,
    onSelectSceneNode,
  };
};
