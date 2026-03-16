/**
 * UI 模块：页面渲染与交互绑定。
 * 后续可在此接入积木列表/属性面板，并与协议事件连线联动。
 */
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
import BrickPalettePanel, { type BrickPaletteItem } from "./BrickPalettePanel";
import BrickLibraryPanel, { type BrickLibraryItem } from "./BrickLibraryPanel";
import BrickDetailsPanel from "./BrickDetailsPanel";
import DebugToolbar from "./DebugToolbar";
import EditorLayout from "./EditorLayout";
import GraphCanvasPanel, { type CanvasEdge, type CanvasNode } from "./GraphCanvasPanel";
import { useI18n } from "./i18n/I18nProvider";
import InstallReportPanel, { type InstallReportItem } from "./InstallReportPanel";
import PropertyInspectorPanel, { type CompositeOverrideGroup, type PropertyField, type PropertyValue } from "./PropertyInspectorPanel";
import SceneSamplesPanel, { type SceneSampleItem } from "./SceneSamplesPanel";
import ValidationPanel, { type ValidationItem } from "./ValidationPanel";
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
import { renderDockSection } from "./app-chrome";
import { buildSceneSampleItems, createAppLibraryActions } from "./app-library-actions";
import { createAppRuntimeActions } from "./app-runtime-actions";
import { createAppPropertyActions } from "./app-property-actions";
import { renderAppRightPanel } from "./app-right-panel";
import { applyVisualScenarioPreset } from "./app-visual-scenarios";
import { buildActiveAbilityNames, buildBusinessValidationItems, buildSelectedCompositeGroups, buildSelectedEnemyBehaviorSummary } from "./app-view-models";

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
  const paletteItems: BrickPaletteItem[] = useMemo(
    () =>
      catalogEntries.map((definition) => ({
        id: definition.id,
        name: definition.name,
        summary: definition.summary,
        category: definition.category,
      })),
    [catalogEntries],
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
  const recommendedBrickIds = useMemo(
    () => DEFAULT_RECOMMENDED_BRICK_IDS.filter((id) => catalogEntries.some((entry) => entry.id === id)),
    [catalogEntries],
  );
  const sceneSampleItems = useMemo<SceneSampleItem[]>(() => buildSceneSampleItems(), []);
  const [selectedSampleId, setSelectedSampleId] = useState("");
  const highlightedBrickIds = useMemo(
    () => sceneSampleItems.find((item) => item.id === selectedSampleId)?.relatedBrickIds ?? [],
    [sceneSampleItems, selectedSampleId],
  );
  const [selectedBrick, setSelectedBrick] = useState(builtinCatalogEntries[0]?.id ?? "none");
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
  const [activeRightPanelTab, setActiveRightPanelTab] = useState<"install" | "details" | "inspector">("install");
  const [activeEntityId, setActiveEntityId] = useState("door-1");
  const [selectedSceneNodeId, setSelectedSceneNodeId] = useState(defaultNodes[0]?.id ?? "door-1");
  const [actorPosition, setActorPosition] = useState<[number, number, number]>([0, 0, 2]);
  const [doorPositions, setDoorPositions] = useState<Record<string, [number, number, number]>>({});
  const [grantedAbilities, setGrantedAbilities] = useState<AbilityGrantState[]>([]);
  const [equippedAbilityPackageIds, setEquippedAbilityPackageIds] = useState<string[]>([]);
  const [assetRegistry, setAssetRegistry] = useState<AssetRegistryItem[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const assetLibraryItems: AssetLibraryItem[] = useMemo(
    () => assetRegistry.map((item) => ({ id: item.id, name: item.name, assetRef: item.assetRef, slotHints: item.slotHints })),
    [assetRegistry],
  );

  const pushWorkspaceNotice = (item: ValidationItem): void => {
    setWorkspaceNotices((prev) => [...prev.slice(-5), item]);
  };

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
          onImportBrick={() => {
            onImportBrick();
          }}
          onExport={onExport}
          onSave={onSave}
          onLoad={onLoad}
          onApplyTemplate={onApplyTemplate}
          adapterMode={adapterMode}
          onToggleAdapterMode={onToggleAdapterMode}
          lockStatusText={lockStatusText}
          appTitle={t("app.title")}
        />
      }
      left={
        <div style={{ display: "grid", gap: "12px" }}>
          {renderDockSection(
            "Brick Registry",
            `${brickLibraryItems.length} packages`,
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
            />,
          )}
          {renderDockSection(
            "Palette",
            `${paletteItems.length} ready`,
            <BrickPalettePanel items={paletteItems} selectedId={selectedBrick} recentIds={recentBrickIds} highlightedIds={highlightedBrickIds} onSelect={(id) => setSelectedBrick(id)} onAddToScene={addBrickToScene} />,
          )}
          {renderDockSection(
            "Samples",
            `${sceneSampleItems.length} scenes`,
            <SceneSamplesPanel items={sceneSampleItems} selectedId={selectedSampleId} onOpenSample={onOpenSceneSample} />,
          )}
          {renderDockSection(
            "Assets",
            `${assetLibraryItems.length} imported`,
            <AssetLibraryPanel items={assetLibraryItems} selectedSlotId={selectedSlotId} onBindAsset={onBindAssetToSelectedSlot} />,
          )}
        </div>
      }
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
            onChange={(next) => {
              setNodes(next.nodes);
              setEdges(next.edges);
            }}
            onSelectNode={onSelectSceneNode}
            onTriggerZoneStateChange={onTriggerZoneStateChange}
            onDoorPositionsChange={setDoorPositions}
            onActorPositionChange={setActorPosition}
            onInteract={(nodeId) => onInteract(nodeId)}
          />,
        )
      }
      right={renderAppRightPanel({
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
      })}
      bottom={<ValidationPanel items={businessValidationItems} businessItems={businessValidationItems} protocolItems={protocolValidationItems} batchEntries={batchEntries} batchStatsDiff={batchStatsDiff} />}
    />
  );
}
