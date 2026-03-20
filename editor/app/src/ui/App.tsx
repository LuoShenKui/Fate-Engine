import { useEffect, useMemo, useState } from "react";
import type { BrickDefinition } from "../domain/brick";
import { DoorSceneComponent } from "../runtime/doorScene";
import {
  DoorRuntimeAdapter,
  LadderRuntimeAdapter,
  SwitchRuntimeAdapter,
  TriggerZoneRuntimeAdapter,
  type AdapterMode,
} from "../domain/door";
import { DoorProtocolAdapter } from "../protocol/envelope";
import { getBrickDefinition } from "../domain/registry";
import { type BatchValidationStats } from "../workflow/validation";
import AssetLibraryPanel, { type AssetLibraryItem } from "./AssetLibraryPanel";
import BrickLibraryPanel, { type BrickLibraryItem } from "./BrickLibraryPanel";
import BrickDetailsPanel from "./BrickDetailsPanel";
import DebugToolbar from "./DebugToolbar";
import EditorLayout from "./EditorLayout";
import GraphCanvasPanel, { type CanvasEdge, type CanvasNode } from "./GraphCanvasPanel";
import { useI18n } from "./i18n/I18nProvider";
import InstallReportPanel, { type InstallReportItem } from "./InstallReportPanel";
import LeftWorkspacePanel from "./LeftWorkspacePanel";
import PropertyInspectorPanel, { type CompositeOverrideGroup, type PropertyField, type PropertyValue } from "./PropertyInspectorPanel";
import { getScenePreviewUri } from "./preview-art";
import SceneSamplesPanel, { type SceneSampleItem } from "./SceneSamplesPanel";
import { type ValidationItem } from "./ValidationPanel";
import AppValidationDock from "./AppValidationDock";
import {
  BUILTIN_SCENE_CATEGORY,
  DEFAULT_ACTOR_TYPE,
  DEFAULT_RECOMMENDED_BRICK_IDS,
  IMPORTED_BRICK_HISTORY_STORAGE_KEY,
  IMPORTED_BRICKS_STORAGE_KEY,
  defaultEdges,
  defaultNodes,
  defaultRecipe,
} from "./app-constants";
import { builtinCatalogEntries } from "./app-catalog";
import { loadImportedBrickHistoryFromStorage, loadImportedBricksFromStorage } from "./app-imports";
import { buildResolvedPropertyFields, toPropertyFields } from "./app-property-helpers";
import { getBrickPreviewSrc, getReadinessSummary, resolveRuntimeKind } from "./app-scene";
import type { AbilityGrantState, AssetRegistryItem, BrickCatalogEntry, RuntimeEventItem } from "./app-types";
import { dockHeaderButtonStyle, renderDockSection } from "./app-chrome";
import { buildSceneSampleItems, createAppLibraryActions } from "./app-library-actions";
import { createAppRuntimeActions } from "./app-runtime-actions";
import { createAppPropertyActions } from "./app-property-actions";
import { renderAppRightPanel } from "./app-right-panel";
import { applyVisualScenarioPreset } from "./app-visual-scenarios";
import { buildWorldLabels } from "./app-world-labels";
import { buildActiveAbilityNames, buildBusinessValidationItems, buildSelectedCompositeGroups, buildSelectedEnemyBehaviorSummary } from "./app-view-models";
import { areBrickTagsCompatible } from "./brick-tags";
import { defaultHiddenPanels, toggleHiddenPanel, toggleMaximizedPanel, type WorkspacePanelKey } from "./editor-layout-state";
import { useBuiltinBrickRuntime } from "./use-builtin-brick-runtime";
export default function App(): JSX.Element {
  const visualScenario = new URLSearchParams(window.location.search).get("visualScenario");
  const [adapterMode, setAdapterMode] = useState<AdapterMode>("demo");
  const adapter = useMemo(() => new DoorProtocolAdapter(new DoorRuntimeAdapter()), []);
  const sceneDoorMap = useMemo(() => new Map<string, DoorSceneComponent>(), []);
  const ladderRuntimeMap = useMemo(() => new Map<string, LadderRuntimeAdapter>(), []);
  const switchRuntimeMap = useMemo(() => new Map<string, SwitchRuntimeAdapter>(), []);
  const triggerZoneRuntimeMap = useMemo(() => new Map<string, TriggerZoneRuntimeAdapter>(), []);
  const { t } = useI18n();
  const [importedBricks, setImportedBricks] = useState<BrickCatalogEntry[]>(loadImportedBricksFromStorage());
  const [importedBrickHistory, setImportedBrickHistory] = useState<Record<string, BrickCatalogEntry[]>>(loadImportedBrickHistoryFromStorage());
  const [events, setEvents] = useState<RuntimeEventItem[]>([]);
  const [installReportItems, setInstallReportItems] = useState<InstallReportItem[]>([]);
  const [workspaceNotices, setWorkspaceNotices] = useState<ValidationItem[]>([]);
  const [protocolErrors, setProtocolErrors] = useState<ValidationItem[]>([]);
  const [compositeOverridesByBrickId, setCompositeOverridesByBrickId] = useState<Record<string, Record<string, string | number | boolean>>>({});
  const [recentBrickIds, setRecentBrickIds] = useState<string[]>([]);
  const [requestSeq, setRequestSeq] = useState(1);
  const [locked, setLocked] = useState(false);
  const [validationItems, setValidationItems] = useState<ValidationItem[]>([{ level: "Info", message: t("validation.waiting") }]);
  const catalogEntries = useMemo(
    () => [...builtinCatalogEntries.filter((entry) => !importedBricks.some((imported) => imported.id === entry.id)), ...importedBricks],
    [importedBricks],
  );
  const brickLibraryItems: BrickLibraryItem[] = useMemo(
    () =>
      catalogEntries.map((entry) => ({
        id: entry.id,
        name: entry.name,
        summary: entry.summary,
        packageId: entry.packageId,
        version: entry.version,
        license: entry.license,
        dependencies: entry.dependencies,
        compat: entry.compat,
        source: entry.source,
        category: entry.category,
        installState: entry.installState,
        importIssues: entry.importIssues,
        rollbackAvailable: (importedBrickHistory[entry.id]?.length ?? 0) > 0,
        compositeChildren: entry.compositeChildren.map((child) => ({ id: child.id, type: child.type })),
      })),
    [catalogEntries, importedBrickHistory],
  );
  const sceneSampleItems = useMemo<SceneSampleItem[]>(() => [{ id: "template:forest_cabin_v0", name: "森林小屋 Demo", summary: "唯一主 Demo。以后新增积木都集中在这个 Demo 里做装配和 3D 测试。", kind: "template", relatedBrickIds: catalogEntries.map((entry) => entry.id), previewSrc: getScenePreviewUri("森林小屋 Demo", "template") }], [catalogEntries]); const [selectedSampleId, setSelectedSampleId] = useState("template:forest_cabin_v0");
  const highlightedBrickIds = useMemo(() => sceneSampleItems.find((item) => item.id === selectedSampleId)?.relatedBrickIds ?? [], [sceneSampleItems, selectedSampleId]);
  const [selectedBrick, setSelectedBrick] = useState(defaultNodes.find((node) => node.type !== "door")?.type ?? builtinCatalogEntries[0]?.id ?? "none");
  const recommendedBrickIds = useMemo(() => {
    const selectedEntry = catalogEntries.find((entry) => entry.id === selectedBrick);
    return DEFAULT_RECOMMENDED_BRICK_IDS.filter((id) => {
      const candidate = catalogEntries.find((entry) => entry.id === id);
      if (candidate === undefined) return false;
      return selectedEntry === undefined ? true : areBrickTagsCompatible(selectedEntry.tags, candidate.tags);
    });
  }, [catalogEntries, selectedBrick]);
  const [fieldDraftsByBrickId, setFieldDraftsByBrickId] = useState<Record<string, PropertyField[]>>(
    Object.fromEntries(builtinCatalogEntries.map((item) => [item.id, toPropertyFields(item)])),
  );
  const [fieldDraftsByNodeId, setFieldDraftsByNodeId] = useState<Record<string, PropertyField[]>>({});
  const [slotBindings, setSlotBindings] = useState<Record<string, string>>(defaultRecipe.slot_bindings);
  const [nodes, setNodes] = useState<CanvasNode[]>(defaultNodes);
  const [edges, setEdges] = useState<CanvasEdge[]>(defaultEdges);
  const [seed, setSeed] = useState<number>(defaultRecipe.seed);
  const [lastBatchStats, setLastBatchStats] = useState<BatchValidationStats>({ totalErrors: 0, totalWarnings: 0 });
  const [batchStatsDiff, setBatchStatsDiff] = useState<BatchValidationStats>({ totalErrors: 0, totalWarnings: 0 });
  const [batchEntries, setBatchEntries] = useState<Array<{ recipeId: string; items: ValidationItem[] }>>([]);
  const [playMode, setPlayMode] = useState(false);
  const [playtestFullscreen, setPlaytestFullscreen] = useState(false);
  const [hiddenPanels, setHiddenPanels] = useState(defaultHiddenPanels());
  const [validationExpanded, setValidationExpanded] = useState(false);
  const [maximizedPanel, setMaximizedPanel] = useState<WorkspacePanelKey | undefined>(undefined);
  const [activeRightPanelTab, setActiveRightPanelTab] = useState<"install" | "details" | "inspector">("install");
  const [activeEntityId, setActiveEntityId] = useState("door-1");
  const [selectedSceneNodeId, setSelectedSceneNodeId] = useState(defaultNodes.find((node) => node.type !== "door")?.id ?? defaultNodes[0]?.id ?? "door-1");
  const [actorPosition, setActorPosition] = useState<[number, number, number]>([0, 0, 2]);
  const [doorPositions, setDoorPositions] = useState<Record<string, [number, number, number]>>({});
  const [grantedAbilities, setGrantedAbilities] = useState<AbilityGrantState[]>([]);
  const [equippedAbilityPackageIds, setEquippedAbilityPackageIds] = useState<string[]>([]);
  const [assetRegistry, setAssetRegistry] = useState<AssetRegistryItem[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const assetLibraryItems: AssetLibraryItem[] = useMemo(() => assetRegistry.map((item) => ({ id: item.id, name: item.name, assetRef: item.assetRef, slotHints: item.slotHints })), [assetRegistry]);
  const worldLabels = useMemo(() => buildWorldLabels({ nodes, catalogEntries, slotBindings, assetRegistry }), [assetRegistry, catalogEntries, nodes, slotBindings]);
  const pushWorkspaceNotice = (item: ValidationItem): void => setWorkspaceNotices((prev) => [...prev.slice(-5), item]);
  const getEntryByPackageOrId = (packageIdOrBrickId: string): BrickCatalogEntry | undefined =>
    catalogEntries.find((entry) => entry.packageId === packageIdOrBrickId || entry.id === packageIdOrBrickId);
  const {
    applyRecipe,
    getRecipe,
    onInteract,
    onToggleActorAbility,
    onToggleAdapterMode,
    onToggleLock,
    onTriggerZoneStateChange,
    syncGrantedAbilitiesForSource,
    renderBatchValidate,
    lockStatusText,
  } = createAppRuntimeActions({
    t: (key, params) => t(key as Parameters<typeof t>[0], params),
    adapter,
    adapterMode,
    locked,
    requestSeq,
    playMode,
    activeEntityId,
    selectedBrick,
    selectedSceneNodeId,
    actorPosition,
    doorPositions,
    importedBricks,
    catalogEntries,
    nodes,
    edges,
    slotBindings,
    seed,
    recentBrickIds,
    fieldDraftsByBrickId,
    fieldDraftsByNodeId,
    compositeOverridesByBrickId,
    equippedAbilityPackageIds,
    assetRegistry,
    grantedAbilities,
    lastBatchStats,
    sceneDoorMap,
    ladderRuntimeMap,
    switchRuntimeMap,
    triggerZoneRuntimeMap,
    setEvents,
    setProtocolErrors,
    setValidationItems,
    setBatchStatsDiff,
    setLastBatchStats,
    setBatchEntries,
    setNodes,
    setEdges,
    setSeed,
    setGrantedAbilities,
    setEquippedAbilityPackageIds,
    setAssetRegistry,
    setRecentBrickIds,
    setFieldDraftsByNodeId,
    setSelectedSceneNodeId,
    setSelectedBrick,
    setActiveEntityId,
    setLocked,
    setAdapterMode,
    setCompositeOverridesByBrickId,
    setFieldDraftsByBrickId,
    setImportedBricks,
    setSlotBindings,
    setRequestSeq,
    pushWorkspaceNotice,
  });
  const {
    onBindAssetToSelectedSlot,
    onBindAssetToSlot,
    onCompositeOverrideChange,
    onImportSlotAsset,
    onPropertyChange,
    onResetField,
    onResetFieldToScene,
    onSlotBindingChange,
  } = createAppPropertyActions({
    t: (key, params) => t(key as Parameters<typeof t>[0], params),
    catalogEntries,
    nodes,
    selectedBrick,
    selectedSceneNodeId,
    selectedSlotId,
    fieldDraftsByBrickId,
    setNodes,
    setFieldDraftsByNodeId,
    setFieldDraftsByBrickId,
    setSlotBindings,
    setSelectedSlotId,
    setAssetRegistry,
    setCompositeOverridesByBrickId,
    pushWorkspaceNotice,
  });
  useEffect(() => {
    document.title = t("app.title");
  }, [t]);
  useEffect(() => {
    try {
      window.localStorage.setItem(IMPORTED_BRICKS_STORAGE_KEY, JSON.stringify(importedBricks));
    } catch {
      // Ignore storage failures.
    }
  }, [importedBricks]);
  useEffect(() => {
    try {
      window.localStorage.setItem(IMPORTED_BRICK_HISTORY_STORAGE_KEY, JSON.stringify(importedBrickHistory));
    } catch {
      // Ignore storage failures.
    }
  }, [importedBrickHistory]);
  useEffect(() => {
    setFieldDraftsByNodeId((prev) => {
      const validNodeIds = new Set(nodes.map((node) => node.id));
      const next = Object.entries(prev).reduce<Record<string, PropertyField[]>>((acc, [nodeId, fields]) => {
        if (validNodeIds.has(nodeId)) {
          acc[nodeId] = fields;
        }
        return acc;
      }, {});
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
  }, [nodes]);
  useEffect(() => {
    setValidationItems((prev) => {
      if (prev.length === 1 && prev[0]?.level === "Info") {
        if (prev[0].message === "等待校验" || prev[0].message === "Waiting for validation") {
          return [{ level: "Info", message: t("validation.waiting") }];
        }
      }
      return prev;
    });
  }, [t]);
  useEffect(() => {
    if (!hiddenPanels.validation && (events.some((event) => event.source !== "camera") || protocolErrors.length > 0)) setValidationExpanded(true);
  }, [events, hiddenPanels.validation, protocolErrors.length]);
  useEffect(() => {
    applyVisualScenarioPreset({
      visualScenario,
      onToggleLock,
      onInteract,
      setPlayMode,
      setEvents,
      setValidationItems,
      setBatchEntries,
      setBatchStatsDiff,
    });
  }, [visualScenario]);
  useBuiltinBrickRuntime({ playMode, actorPosition, nodes, catalogEntries, sceneDoorMap, onInteract, syncGrantedAbilitiesForSource });
  const {
    addBrickToScene,
    onApplyTemplate,
    onExport,
    onExportInstalledLockfile,
    onImport,
    onImportBrick,
    onInspectInstallReportBrick,
    onLoad,
    onOpenSampleScene,
    onOpenBlankScene,
    onOpenSceneSample,
    onQuickPreviewBrick,
    onRemoveImportedBrick,
    onResolveInstallIssue,
    onRollbackImportedBrick,
    onSave,
    onSelectSceneNode,
    previewBrickImport,
    recordRecentBrick,
  } = createAppLibraryActions({
    t: (key, params) => t(key as Parameters<typeof t>[0], params),
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
  });
  const selectedBrickDefinition = catalogEntries.find((entry) => entry.id === selectedBrick) ?? getBrickDefinition(selectedBrick);
  const selectedCatalogEntry = catalogEntries.find((entry) => entry.id === selectedBrick);
  const selectedSceneNode = nodes.find((node) => node.id === selectedSceneNodeId);
  const isEditingSceneInstance = selectedSceneNode?.type === selectedBrick;
  const selectedFields = isEditingSceneInstance
    ? buildResolvedPropertyFields(selectedBrickDefinition, fieldDraftsByBrickId[selectedBrick], fieldDraftsByNodeId[selectedSceneNodeId])
    : buildResolvedPropertyFields(selectedBrickDefinition, fieldDraftsByBrickId[selectedBrick]);
  const selectedEnemyBehaviorSummary = buildSelectedEnemyBehaviorSummary(selectedCatalogEntry?.category, selectedFields);
  const inspectorScopeLabel = isEditingSceneInstance
    ? t("panel.propertyInspector.scopeInstance", { nodeId: selectedSceneNodeId })
    : t("panel.propertyInspector.scopeScene", { brickName: selectedBrickDefinition?.name ?? selectedBrick });
  const selectedGrantedAbilityPackageIds = selectedSceneNode?.meta?.grantedAbilityPackageIds ?? selectedCatalogEntry?.grantedAbilityPackageIds ?? [];
  const selectedOverrideCount = selectedFields.filter((field) => (isEditingSceneInstance ? field.value !== field.sceneValue : field.value !== field.packageValue)).length;
  const selectedCompositeGroups: CompositeOverrideGroup[] = buildSelectedCompositeGroups(selectedCatalogEntry, selectedBrick, compositeOverridesByBrickId);
  const activeAbilityNames = buildActiveAbilityNames(
    grantedAbilities.map((grant) => grant.packageId),
    equippedAbilityPackageIds,
    (packageId) => getEntryByPackageOrId(packageId)?.name ?? packageId,
  );
  const selectedAbilityEquipped = selectedCatalogEntry !== undefined && equippedAbilityPackageIds.includes(selectedCatalogEntry.packageId);
  const businessValidationItems: ValidationItem[] = buildBusinessValidationItems(workspaceNotices, validationItems, activeAbilityNames, events, (key, params) => t(key as Parameters<typeof t>[0], params));
  const protocolValidationItems: ValidationItem[] = protocolErrors.slice(-3);
  const maximizeAction = (panel: WorkspacePanelKey): JSX.Element => (
    <button type="button" onClick={() => setMaximizedPanel((prev) => toggleMaximizedPanel(prev, panel))} style={dockHeaderButtonStyle}>
      {maximizedPanel === panel ? "restore" : "maximize"}
    </button>
  );
  const viewportActions = <><button type="button" onClick={() => { const next = !playtestFullscreen; setPlayMode(next); setPlaytestFullscreen(next); }} style={dockHeaderButtonStyle}>{playtestFullscreen ? "exit test" : "test"}</button>{maximizeAction("center")}</>;
  return (
    <EditorLayout
      top={
        <DebugToolbar
          locked={locked}
          onInteract={() => onInteract()}
          playMode={playMode}
          onTogglePlayMode={() => setPlayMode((prev) => !prev)}
          onToggleLock={onToggleLock}
          onImport={onImport}
          onImportBrick={() => onImportBrick()}
          onExport={onExport}
          onSave={onSave}
          onLoad={onLoad}
          onApplyTemplate={onApplyTemplate}
          adapterMode={adapterMode}
          onToggleAdapterMode={onToggleAdapterMode}
          hiddenPanels={hiddenPanels}
          onTogglePanel={(panel) => setHiddenPanels((prev) => toggleHiddenPanel(prev, panel))}
          playtestFullscreen={playtestFullscreen}
          onTogglePlaytestFullscreen={() => { const next = !playtestFullscreen; setPlayMode(next); setPlaytestFullscreen(next); }}
          lockStatusText={lockStatusText}
          appTitle={t("app.title")}
        />
      }
      left={playtestFullscreen ? undefined : (
        <LeftWorkspacePanel
          hiddenPanels={hiddenPanels}
          brickCount={brickLibraryItems.length}
          assetCount={assetLibraryItems.length}
          maximizeAction={maximizeAction("left")}
          brickLibrary={
            <BrickLibraryPanel
              items={brickLibraryItems}
              selectedId={selectedBrick}
              recentIds={recentBrickIds}
              recommendedIds={recommendedBrickIds}
              highlightedIds={highlightedBrickIds}
              onSelect={(id) => setSelectedBrick(id)}
              onAddToScene={addBrickToScene}
              onQuickPreview={onQuickPreviewBrick}
              onOpenSample={onOpenSampleScene}
              onImportBrick={onImportBrick}
              onPreviewBrick={previewBrickImport}
              onRemoveBrick={onRemoveImportedBrick}
              onRollbackBrick={onRollbackImportedBrick}
              onExportLockfile={onExportInstalledLockfile}
              onOpenBlankScene={onOpenBlankScene}
            />
          }
          assetLibrary={<AssetLibraryPanel items={assetLibraryItems} selectedSlotId={selectedSlotId} onBindAsset={onBindAssetToSelectedSlot} />}
        />
      )}
      center={
        renderDockSection(
          "Viewport",
          selectedSceneNodeId,
          <GraphCanvasPanel
            nodes={nodes}
            edges={edges}
            resolveNodeKind={(nodeType) => resolveRuntimeKind(nodeType ?? "generic", catalogEntries)}
            defaultNodeType={selectedBrick}
            onDropBrick={addBrickToScene}
            actorLabel="player_1 / humanoid"
            activeAbilityNames={activeAbilityNames}
            worldLabels={worldLabels}
            onChange={(next) => {
              setNodes(next.nodes);
              setEdges(next.edges);
            }}
            onSelectNode={onSelectSceneNode}
            onTriggerZoneStateChange={onTriggerZoneStateChange}
            onDoorPositionsChange={setDoorPositions}
            onActorPositionChange={setActorPosition}
            onInteract={(nodeId) => onInteract(nodeId)}
            onViewportEvent={(text) => setEvents((prev) => [...prev, { source: "camera", text }])}
            playtestFullscreen={playtestFullscreen}
            onExitPlaytestFullscreen={() => { setPlayMode(false); setPlaytestFullscreen(false); }}
          />,
          viewportActions,
        )
      }
      right={playtestFullscreen || hiddenPanels.inspector ? undefined : renderAppRightPanel({
        t: (key, params) => t(key as Parameters<typeof t>[0], params),
        activeRightPanelTab,
        setActiveRightPanelTab,
        selectedBrick,
        selectedBrickDefinition,
        selectedCatalogEntry,
        selectedGrantedAbilityPackageIds,
        selectedEnemyBehaviorSummary,
        selectedAbilityEquipped,
        activeAbilityNames,
        installReportItems,
        addBrickToScene,
        onInspectInstallReportBrick,
        onResolveInstallIssue,
        onQuickPreviewBrick,
        selectedSceneNodeId,
        inspectorScopeLabel,
        selectedFields,
        selectedOverrideCount,
        slotBindings,
        selectedSlotId,
        setSelectedSlotId,
        selectedCompositeGroups,
        onPropertyChange,
        onResetField,
        onResetFieldToScene: isEditingSceneInstance ? onResetFieldToScene : undefined,
        onSlotBindingChange,
        onImportSlotAsset,
        onBindAssetToSlot,
        onCompositeOverrideChange,
        actorType: DEFAULT_ACTOR_TYPE,
        runtimeKind: selectedCatalogEntry?.runtimeKind ?? resolveRuntimeKind(selectedBrick, catalogEntries),
        readinessSummary: getReadinessSummary(selectedCatalogEntry, (key, params) => t(key as Parameters<typeof t>[0], params)),
        previewSrc: getBrickPreviewSrc(selectedCatalogEntry),
        onToggleActorAbility: selectedCatalogEntry?.category === "ability" ? () => onToggleActorAbility(selectedCatalogEntry.id) : undefined,
        category: selectedCatalogEntry?.category ?? BUILTIN_SCENE_CATEGORY,
        tags: selectedCatalogEntry?.tags,
        maximized: maximizedPanel === "right",
        onToggleMaximize: () => setMaximizedPanel((prev) => toggleMaximizedPanel(prev, "right")),
      })}
      bottom={<AppValidationDock hidden={playtestFullscreen || (hiddenPanels.validation && !validationExpanded)} expanded={validationExpanded} items={businessValidationItems} protocolItems={protocolValidationItems} batchEntries={batchEntries} batchStatsDiff={batchStatsDiff} onToggleExpanded={() => setValidationExpanded((prev) => !prev)} onClose={() => { setValidationExpanded(false); setHiddenPanels((prev) => ({ ...prev, validation: true })); }} maximized={maximizedPanel === "bottom"} onToggleMaximize={() => setMaximizedPanel((prev) => toggleMaximizedPanel(prev, "bottom"))} />}
      fullscreenCenter={playtestFullscreen}
      maximizedPanel={playtestFullscreen ? "center" : maximizedPanel}
    />
  );
}
