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
import AppTopToolbar from "./AppTopToolbar";
import AppBottomDock from "./AppBottomDock";
import AppLeftWorkspace from "./AppLeftWorkspace";
import AppViewportSection from "./AppViewportSection";
import ToolbarCommandPalette from "./ToolbarCommandPalette";
import EditorLayout from "./EditorLayout";
import type { CanvasEdge, CanvasNode } from "./GraphCanvasPanel";
import { useI18n } from "./i18n/I18nProvider";
import type { AssetLibraryItem } from "./AssetLibraryPanel";
import type { BrickLibraryItem } from "./BrickLibraryPanel";
import type { InstallReportItem } from "./InstallReportPanel";
import type { CompositeOverrideGroup, PropertyField } from "./PropertyInspectorPanel";
import { getScenePreviewUri } from "./preview-art";
import type { SceneSampleItem } from "./SceneSamplesPanel";
import { type ValidationItem } from "./ValidationPanel";
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
import { buildUnityExportManifest } from "../project/unity-export";
import type { AbilityGrantState, AssetRegistryItem, BrickCatalogEntry, RuntimeEventItem } from "./app-types";
import { dockHeaderButtonStyle } from "./app-chrome";
import { buildSceneSampleItems, createAppLibraryActions } from "./app-library-actions";
import { CHARACTER_FOUNDATION_SAMPLE_ID } from "../workflow/characterFoundationDemo";
import { createAppRuntimeActions } from "./app-runtime-actions";
import { createAppPropertyActions } from "./app-property-actions";
import { renderAppRightPanel } from "./app-right-panel";
import { buildRightPanelState } from "./app-right-panel-state";
import { useAppComposer } from "./use-app-composer";
import { applyVisualScenarioPreset } from "./app-visual-scenarios";
import { buildWorldLabels } from "./app-world-labels";
import { buildActiveAbilityNames, buildBusinessValidationItems, buildSelectedCompositeGroups, buildSelectedEnemyBehaviorSummary } from "./app-view-models";
import { buildAssetRegistryFromCatalog } from "./asset-package-model";
import { areBrickTagsCompatible } from "./brick-tags";
import { defaultHiddenPanels, toggleMaximizedPanel, type WorkspacePanelKey } from "./editor-layout-state";
import { useBuiltinBrickRuntime } from "./use-builtin-brick-runtime";
import { useAppCommandWorkflow } from "./use-app-command-workflow";
import { useAppHousekeeping } from "./use-app-housekeeping";
import { buildAppToolbarState } from "./app-toolbar-state";
import { useRuntimeNarrativeDebug } from "./use-runtime-narrative-debug";
export default function App(): JSX.Element {
  const visualScenario = new URLSearchParams(window.location.search).get("visualScenario");
  const [adapterMode, setAdapterMode] = useState<AdapterMode>("demo");
  const adapter = useMemo(() => new DoorProtocolAdapter(new DoorRuntimeAdapter()), []);
  const sceneDoorMap = useMemo(() => new Map<string, DoorSceneComponent>(), []);
  const ladderRuntimeMap = useMemo(() => new Map<string, LadderRuntimeAdapter>(), []);
  const switchRuntimeMap = useMemo(() => new Map<string, SwitchRuntimeAdapter>(), []);
  const triggerZoneRuntimeMap = useMemo(() => new Map<string, TriggerZoneRuntimeAdapter>(), []);
  const { locale, switchLocale, t } = useI18n();
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
  const sceneSampleItems = useMemo<SceneSampleItem[]>(() => buildSceneSampleItems(), []);
  const [selectedSampleId, setSelectedSampleId] = useState(CHARACTER_FOUNDATION_SAMPLE_ID);
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
  const [activeRightPanelTab, setActiveRightPanelTab] = useState<"install" | "details" | "inspector" | "compose" | "export" | "narrative">("install");
  const [activeEntityId, setActiveEntityId] = useState("door-1");
  const [selectedSceneNodeId, setSelectedSceneNodeId] = useState(defaultNodes.find((node) => node.type !== "door")?.id ?? defaultNodes[0]?.id ?? "door-1");
  const [actorPosition, setActorPosition] = useState<[number, number, number]>([0, 0, 2]);
  const [doorPositions, setDoorPositions] = useState<Record<string, [number, number, number]>>({});
  const [grantedAbilities, setGrantedAbilities] = useState<AbilityGrantState[]>([]);
  const [equippedAbilityPackageIds, setEquippedAbilityPackageIds] = useState<string[]>([]);
  const [assetRegistry, setAssetRegistry] = useState<AssetRegistryItem[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const assetLibraryItems: AssetLibraryItem[] = useMemo(() => buildAssetRegistryFromCatalog(catalogEntries, assetRegistry), [assetRegistry, catalogEntries]);
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
  useAppHousekeeping({
    t: (key) => t(key as Parameters<typeof t>[0]),
    importedBricks,
    importedBrickHistory,
    nodes,
    hiddenPanelsValidation: hiddenPanels.validation,
    events,
    protocolErrorsLength: protocolErrors.length,
    setFieldDraftsByNodeId,
    setValidationItems,
    setValidationExpanded,
  });
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
    assetLibraryItems,
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
  const {
    composeMode,
    setComposeMode,
    composePrompt,
    setComposePrompt,
    composeHistory,
    composeResult,
    agentResult,
    lastAgentApplyReport,
    canRollbackAgentApply,
    onCompose,
    onApplyDraft,
    onRollbackAgentApply,
    onReuseHistory,
  } = useAppComposer({
    catalogEntries,
    assetLibraryItems,
    getRecipe,
    applyRecipe,
    renderBatchValidate,
    pushWorkspaceNotice,
  });
  const unityExportManifest = buildUnityExportManifest(getRecipe(), catalogEntries, assetLibraryItems);
  const narrativeDebug = useRuntimeNarrativeDebug();
  const rightPanelState = buildRightPanelState({
    t: (key, params) => t(key as Parameters<typeof t>[0], params),
    activeRightPanelTab,
    setActiveRightPanelTab,
    selectedBrick,
    selectedBrickDefinition,
    selectedCatalogEntry,
    composePrompt,
    setComposePrompt,
    composeMode,
    setComposeMode,
    composeHistory,
    composeResult,
    agentResult,
    lastAgentApplyReport,
    canRollbackAgentApply,
    onCompose,
    onApplyComposeDraft: onApplyDraft,
    onRollbackAgentApply,
    onReuseComposeHistory: onReuseHistory,
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
    catalogEntries,
    onToggleActorAbility: selectedCatalogEntry?.category === "ability" ? () => onToggleActorAbility(selectedCatalogEntry.id) : undefined,
    unityExportManifest,
    onExport,
    narrativeLoading: narrativeDebug.loading,
    narrativeError: narrativeDebug.error,
    narrativeHealth: narrativeDebug.health,
    narrativeModels: narrativeDebug.models,
    narrativeSessions: narrativeDebug.sessions,
    narrativeFixtures: narrativeDebug.fixtures,
    narrativeSelectedFixtureId: narrativeDebug.selectedFixtureId,
    narrativeSessionId: narrativeDebug.sessionId,
    narrativeKnownSessionIds: narrativeDebug.knownSessionIds,
    narrativeHistory: narrativeDebug.history,
    narrativeCurrentTurn: narrativeDebug.currentTurn,
    narrativeCandidates: narrativeDebug.candidates,
    narrativeLastChoiceResult: narrativeDebug.lastChoiceResult,
    narrativeAuditLines: narrativeDebug.auditLines,
    narrativeSnapshotAnchorId: narrativeDebug.snapshotAnchorId,
    narrativeSnapshotJson: narrativeDebug.snapshotJson,
    onNarrativeSessionIdChange: narrativeDebug.setSessionId,
    onNarrativeFixtureIdChange: narrativeDebug.setSelectedFixtureId,
    onNarrativeSnapshotJsonChange: narrativeDebug.setSnapshotJson,
    onNarrativeRefreshOverview: narrativeDebug.refreshOverview,
    onNarrativeRefreshHistory: () => {
      void narrativeDebug.refreshHistory(narrativeDebug.sessionId);
    },
    onNarrativeBeginFixtureSession: () => {
      void narrativeDebug.beginFixtureSession();
    },
    onNarrativeSubmitChoice: (optionId) => {
      void narrativeDebug.submitChoice(optionId);
    },
    onNarrativeImportSnapshot: () => {
      void narrativeDebug.importSnapshot();
    },
    category: selectedCatalogEntry?.category ?? BUILTIN_SCENE_CATEGORY,
    tags: selectedCatalogEntry?.tags,
    nodeValidationState: isEditingSceneInstance ? selectedSceneNode?.meta?.validationState : undefined,
    nodeValidationIssues: isEditingSceneInstance ? selectedSceneNode?.meta?.validationIssues : undefined,
    maximized: maximizedPanel === "right",
    onToggleMaximize: () => setMaximizedPanel((prev) => toggleMaximizedPanel(prev, "right")),
  });
  const toolbarState = buildAppToolbarState({
    hiddenPanels,
    playMode,
    playtestFullscreen,
    setPlayMode,
    setPlaytestFullscreen,
    setHiddenPanels,
    setActiveRightPanelTab,
    setMaximizedPanel,
  });
  const { commandPaletteOpen, openCommandPalette, closeCommandPalette, toolbarMenus, toolbarCommands } = useAppCommandWorkflow({
    locale,
    switchLocale,
    t,
    hiddenPanels: toolbarState.hiddenPanels,
    locked,
    adapterMode,
    playMode: toolbarState.playMode,
    playtestFullscreen,
    onInteract: () => onInteract(),
    onToggleAdapterMode,
    onTogglePlayMode: toolbarState.onTogglePlayMode,
    onToggleLock,
    onImport,
    onImportBrick: () => onImportBrick(),
    onExport,
    onSave,
    onLoad,
    onApplyTemplate,
    onOpenInstall: toolbarState.onOpenInstall,
    onOpenDetails: toolbarState.onOpenDetails,
    onOpenInspector: toolbarState.onOpenInspector,
    onOpenCompose: toolbarState.onOpenCompose,
    onOpenExportReview: toolbarState.onOpenExportReview,
    onOpenNarrativeDebug: toolbarState.onOpenNarrativeDebug,
    onBeginNarrativeFixtureSession: () => {
      toolbarState.onOpenNarrativeDebug();
      void narrativeDebug.beginFixtureSession();
    },
    onOpenBrickLibrary: toolbarState.onOpenBrickLibrary,
    onOpenAssetLibrary: toolbarState.onOpenAssetLibrary,
    onOpenValidation: toolbarState.onOpenValidation,
    onTogglePanel: toolbarState.onTogglePanel,
    onTogglePlaytestFullscreen: toolbarState.onTogglePlaytestFullscreen,
  });
  const maximizeAction = (panel: WorkspacePanelKey): JSX.Element => (
    <button type="button" onClick={() => setMaximizedPanel((prev) => toggleMaximizedPanel(prev, panel))} style={dockHeaderButtonStyle}>
      {maximizedPanel === panel ? "restore" : "maximize"}
    </button>
  );
  return (
    <>
      <EditorLayout
        top={
          <AppTopToolbar
            locked={locked}
            adapterMode={adapterMode}
            onToggleAdapterMode={onToggleAdapterMode}
            onInteract={() => onInteract()}
            playMode={toolbarState.playMode}
            onTogglePlayMode={toolbarState.onTogglePlayMode}
            onToggleLock={onToggleLock}
            onImport={onImport}
            onImportBrick={() => onImportBrick()}
            onExport={onExport}
            onSave={onSave}
            onLoad={onLoad}
            onApplyTemplate={onApplyTemplate}
            onOpenCommandPalette={openCommandPalette}
            onOpenCompose={toolbarState.onOpenCompose}
            onOpenExportReview={toolbarState.onOpenExportReview}
            hiddenPanels={toolbarState.hiddenPanels}
            onTogglePanel={toolbarState.onTogglePanel}
            playtestFullscreen={playtestFullscreen}
            onTogglePlaytestFullscreen={toolbarState.onTogglePlaytestFullscreen}
            lockStatusText={lockStatusText}
            appTitle={t("app.title")}
            menus={toolbarMenus}
          />
        }
        left={<AppLeftWorkspace
          hidden={playtestFullscreen}
          hiddenPanels={hiddenPanels}
          brickCount={brickLibraryItems.length}
          assetCount={assetLibraryItems.length}
          maximizeAction={maximizeAction("left")}
          brickLibraryItems={brickLibraryItems}
          selectedBrick={selectedBrick}
          recentBrickIds={recentBrickIds}
          recommendedBrickIds={recommendedBrickIds}
          highlightedBrickIds={highlightedBrickIds}
          onSelectBrick={(id) => setSelectedBrick(id)}
          addBrickToScene={addBrickToScene}
          onQuickPreviewBrick={onQuickPreviewBrick}
          onOpenSampleScene={onOpenSampleScene}
          onImportBrick={onImportBrick}
          previewBrickImport={previewBrickImport}
          onRemoveImportedBrick={onRemoveImportedBrick}
          onRollbackImportedBrick={onRollbackImportedBrick}
          onExportInstalledLockfile={onExportInstalledLockfile}
          onOpenBlankScene={onOpenBlankScene}
          assetLibraryItems={assetLibraryItems}
          selectedSlotId={selectedSlotId}
          onBindAssetToSelectedSlot={onBindAssetToSelectedSlot}
        />}
        center={<AppViewportSection
          selectedSceneNodeId={selectedSceneNodeId}
          nodes={nodes}
          edges={edges}
          catalogEntries={catalogEntries}
          selectedBrick={selectedBrick}
          addBrickToScene={addBrickToScene}
          activeAbilityNames={activeAbilityNames}
          worldLabels={worldLabels}
          onGraphChange={(next) => {
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
          onExitPlaytestFullscreen={() => {
            setPlayMode(false);
            setPlaytestFullscreen(false);
          }}
          onTogglePlaytestFullscreen={toolbarState.onTogglePlaytestFullscreen}
          maximizeAction={maximizeAction("center")}
        />}
        right={playtestFullscreen || hiddenPanels.inspector ? undefined : renderAppRightPanel(rightPanelState)}
        bottom={<AppBottomDock
          playtestFullscreen={playtestFullscreen}
          validationHidden={hiddenPanels.validation}
          validationExpanded={validationExpanded}
          items={businessValidationItems}
          protocolItems={protocolValidationItems}
          batchEntries={batchEntries}
          batchStatsDiff={batchStatsDiff}
          onToggleExpanded={() => setValidationExpanded((prev) => !prev)}
          onClose={() => {
            setValidationExpanded(false);
            setHiddenPanels((prev) => ({ ...prev, validation: true }));
          }}
          maximized={maximizedPanel === "bottom"}
          onToggleMaximize={() => setMaximizedPanel((prev) => toggleMaximizedPanel(prev, "bottom"))}
        />}
        fullscreenCenter={playtestFullscreen}
        maximizedPanel={playtestFullscreen ? "center" : maximizedPanel}
      />
      <ToolbarCommandPalette open={commandPaletteOpen} commands={toolbarCommands} onClose={closeCommandPalette} />
    </>
  );
}
