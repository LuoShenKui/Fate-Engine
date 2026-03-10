/**
 * UI 模块：页面渲染与交互绑定。
 * 后续可在此接入积木列表/属性面板，并与协议事件连线联动。
 */
import { useEffect, useMemo, useState } from "react";
import { DoorSceneComponent } from "../runtime/doorScene";
import {
  DoorRuntimeAdapter,
  LadderRuntimeAdapter,
  SwitchRuntimeAdapter,
  TriggerZoneRuntimeAdapter,
  type AdapterMode,
  type DoorBrickEvent,
  DoorBrickDefinition,
  formatRuntimeEventLog,
} from "../domain/door";
import { DoorProtocolAdapter, type Envelope } from "../protocol/envelope";
import { getBrickDefinition, listBrickDefinitions } from "../domain/registry";
import {
  createDefaultEditorDemoRecipe,
  downloadRecipe,
  exportRecipe,
  importRecipe,
  isRecipeLockfileLocked,
  loadFromLocalStorage,
  saveToLocalStorage,
  type EditorRecipeV0,
} from "../project/recipe";
import { getLinkedDoorIds, planTriggerZoneDoorActions } from "../workflow/sceneRouting";
import { assembleWorkflowTemplate } from "../workflow/templates";
import { runBatchValidate, type BatchValidationStats } from "../workflow/validation";
import BrickPalettePanel, { type BrickPaletteItem } from "./BrickPalettePanel";
import DebugToolbar from "./DebugToolbar";
import EditorLayout from "./EditorLayout";
import GraphCanvasPanel, { type CanvasEdge, type CanvasNode } from "./GraphCanvasPanel";
import { useI18n } from "./i18n/I18nProvider";
import PropertyInspectorPanel, { type PropertyField, type PropertyValue } from "./PropertyInspectorPanel";
import ValidationPanel, { type ValidationItem } from "./ValidationPanel";

type DoorInteractRequestPayload = {
  actor_id: string;
  entity_id: string;
};

type DoorInteractResponsePayload = {
  event: string;
  payload: string;
};

type RuntimeEventItem = {
  source: "door" | "switch" | "ladder" | "trigger-zone" | "link" | "adapter";
  text: string;
};

const paletteItems: BrickPaletteItem[] = listBrickDefinitions().map((definition) => ({
  id: definition.id,
  name: definition.name,
  summary: definition.summary,
}));

const toPropertyFields = (brickId: string): PropertyField[] =>
  (getBrickDefinition(brickId)?.properties ?? DoorBrickDefinition.properties).map((property) => ({
    key: property.key,
    label: property.label,
    value: property.defaultValue,
  }));

const initialFields: PropertyField[] = DoorBrickDefinition.properties.map((property) => ({
  key: property.key,
  label: property.label,
  value: property.defaultValue,
}));

const DEFAULT_TRIGGER_DISTANCE = 1.5;
const defaultRecipe = createDefaultEditorDemoRecipe();
const defaultNodes = defaultRecipe.nodes as CanvasNode[];
const defaultEdges = defaultRecipe.edges as CanvasEdge[];

const calcDistance = (from: [number, number, number], to: [number, number, number]): number => {
  const dx = from[0] - to[0];
  const dy = from[1] - to[1];
  const dz = from[2] - to[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

export default function App(): JSX.Element {
  const visualScenario = new URLSearchParams(window.location.search).get("visualScenario");
  const [adapterMode, setAdapterMode] = useState<AdapterMode>("demo");
  const adapter = useMemo(() => new DoorProtocolAdapter(new DoorRuntimeAdapter()), []);
  const sceneDoorMap = useMemo(() => new Map<string, DoorSceneComponent>(), []);
  const ladderRuntimeMap = useMemo(() => new Map<string, LadderRuntimeAdapter>(), []);
  const switchRuntimeMap = useMemo(() => new Map<string, SwitchRuntimeAdapter>(), []);
  const triggerZoneRuntimeMap = useMemo(() => new Map<string, TriggerZoneRuntimeAdapter>(), []);
  const { t } = useI18n();
  const [events, setEvents] = useState<RuntimeEventItem[]>([]);
  const [protocolErrors, setProtocolErrors] = useState<ValidationItem[]>([]);
  const [requestSeq, setRequestSeq] = useState(1);
  const [locked, setLocked] = useState(false);
  const [validationItems, setValidationItems] = useState<ValidationItem[]>([{ level: "Info", message: t("validation.waiting") }]);
  const [selectedBrick, setSelectedBrick] = useState(paletteItems[0]?.id ?? "none");
  const [fieldDraftsByBrickId, setFieldDraftsByBrickId] = useState<Record<string, PropertyField[]>>(
    Object.fromEntries(paletteItems.map((item) => [item.id, toPropertyFields(item.id)])),
  );
  const [slotBindings, setSlotBindings] = useState<Record<string, string>>(defaultRecipe.slot_bindings);
  const [nodes, setNodes] = useState<CanvasNode[]>(defaultNodes);
  const [edges, setEdges] = useState<CanvasEdge[]>(defaultEdges);
  const [seed, setSeed] = useState<number>(defaultRecipe.seed);
  const [lastBatchStats, setLastBatchStats] = useState<BatchValidationStats>({ totalErrors: 0, totalWarnings: 0 });
  const [batchStatsDiff, setBatchStatsDiff] = useState<BatchValidationStats>({ totalErrors: 0, totalWarnings: 0 });
  const [batchEntries, setBatchEntries] = useState<Array<{ recipeId: string; items: ValidationItem[] }>>([]);
  const [playMode, setPlayMode] = useState(false);
  const [activeEntityId, setActiveEntityId] = useState("door-1");
  const [actorPosition, setActorPosition] = useState<[number, number, number]>([0, 0, 2]);
  const [doorPositions, setDoorPositions] = useState<Record<string, [number, number, number]>>({});

  const getSceneDoor = (entityId: string): DoorSceneComponent => {
    const cached = sceneDoorMap.get(entityId);
    if (cached !== undefined) {
      return cached;
    }
    const created = new DoorSceneComponent(entityId);
    sceneDoorMap.set(entityId, created);
    return created;
  };

  const getTriggerZoneRuntime = (entityId: string): TriggerZoneRuntimeAdapter => {
    const cached = triggerZoneRuntimeMap.get(entityId);
    if (cached !== undefined) {
      return cached;
    }
    const created = new TriggerZoneRuntimeAdapter();
    triggerZoneRuntimeMap.set(entityId, created);
    return created;
  };

  const getSwitchRuntime = (entityId: string): SwitchRuntimeAdapter => {
    const cached = switchRuntimeMap.get(entityId);
    if (cached !== undefined) {
      return cached;
    }
    const created = new SwitchRuntimeAdapter();
    switchRuntimeMap.set(entityId, created);
    return created;
  };

  const getLadderRuntime = (entityId: string): LadderRuntimeAdapter => {
    const cached = ladderRuntimeMap.get(entityId);
    if (cached !== undefined) {
      return cached;
    }
    const created = new LadderRuntimeAdapter();
    ladderRuntimeMap.set(entityId, created);
    return created;
  };

  useEffect(() => {
    document.title = t("app.title");
  }, [t]);

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
    if (visualScenario === null) {
      return;
    }
    if (visualScenario === "door-lock-unlock") {
      onToggleLock();
      onToggleLock();
      onInteract("door-1");
      return;
    }
    if (visualScenario === "trigger-zone-door-link") {
      setPlayMode(true);
      setEvents([
        {
          source: "trigger-zone",
          text: "[trigger_zone] request_id=req-visual entity_id=trigger-zone-1 occupied=true event=OnUsed payload=actor_id=player_1,occupied=true",
        },
        {
          source: "link",
          text: "[trigger_zone_link] source=trigger-zone-1 target=door-1 action=open_on_enter result=interact previous_state=Closed",
        },
        {
          source: "door",
          text: "[door_event] mode=demo request_id=req-visual event=OnUsed payload=entity_id=door-1,actor_id=player_1,state=Open",
        },
      ]);
      return;
    }
    if (visualScenario === "trigger-zone-door-2-link") {
      setPlayMode(true);
      setEvents([
        {
          source: "trigger-zone",
          text: "[trigger_zone] request_id=req-visual-2 entity_id=trigger-zone-2 occupied=true event=OnUsed payload=actor_id=player_1,occupied=true",
        },
        {
          source: "link",
          text: "[trigger_zone_link] source=trigger-zone-2 target=door-2 action=open_on_enter result=interact previous_state=Closed",
        },
        {
          source: "door",
          text: "[door_event] mode=demo request_id=req-visual-2 event=OnUsed payload=entity_id=door-2,actor_id=player_1,state=Open",
        },
      ]);
      return;
    }
    if (visualScenario === "switch-door-link") {
      setPlayMode(true);
      setEvents([
        {
          source: "switch",
          text: "[switch] request_id=req-switch entity_id=switch-1 event=OnUsed payload=entity_id=switch-1,actor_id=player_1,active=true",
        },
        {
          source: "link",
          text: "[switch_link] source=switch-1 target=door-2 action=toggle_on_use result=interact previous_state=Closed",
        },
        {
          source: "door",
          text: "[door_event] mode=demo request_id=req-switch event=OnUsed payload=entity_id=door-2,actor_id=player_1,state=Open",
        },
      ]);
      return;
    }
    if (visualScenario === "ladder-door-link") {
      setPlayMode(true);
      setEvents([
        {
          source: "ladder",
          text: "[ladder] request_id=req-ladder entity_id=ladder-1 event=OnUsed payload=entity_id=ladder-1,actor_id=player_1,occupied=true",
        },
        {
          source: "link",
          text: "[ladder_link] source=ladder-1 target=door-1 action=toggle_on_climb result=interact previous_state=Closed",
        },
        {
          source: "door",
          text: "[door_event] mode=demo request_id=req-ladder event=OnUsed payload=entity_id=door-1,actor_id=player_1,state=Open",
        },
      ]);
      return;
    }
    if (visualScenario === "validation-levels") {
      setValidationItems([
        { level: "Error", message: "脚本化回归：Error 示例" },
        { level: "Warning", message: "脚本化回归：Warning 示例" },
        { level: "Info", message: "脚本化回归：Info 示例" },
      ]);
      setBatchEntries([
        {
          recipeId: "visual-validation-levels",
          items: [
            { level: "Error", message: "脚本化回归：Error 示例" },
            { level: "Warning", message: "脚本化回归：Warning 示例" },
            { level: "Info", message: "脚本化回归：Info 示例" },
          ],
        },
      ]);
      setBatchStatsDiff({ totalErrors: 1, totalWarnings: 1 });
    }
  }, [visualScenario]);

  const renderValidate = (): void => {
    const entityId = activeEntityId;
    const report = adapter.validate("demo_door", entityId);
    const issues = report.issues.map<ValidationItem>((issue) => ({ level: "Error", message: `${issue} [brick=door node=${entityId} slot=mesh]` }));
    setValidationItems(issues.length > 0 ? issues : [{ level: "Info", message: t("validation.ok") }]);
  };

  const renderBatchValidate = (recipe: EditorRecipeV0): void => {
    const report = runBatchValidate([{ recipeId: "current", recipe }]);
    const nextStats = report.stats;
    setBatchStatsDiff({
      totalErrors: nextStats.totalErrors - lastBatchStats.totalErrors,
      totalWarnings: nextStats.totalWarnings - lastBatchStats.totalWarnings,
    });
    setLastBatchStats(nextStats);
    setBatchEntries(
      report.entries.map((entry) => ({
        recipeId: entry.recipeId,
        items: entry.issues.map((issue) => ({
          level: issue.level,
          message: issue.message,
          ruleId: issue.ruleId,
          target: issue.target,
          evidence: issue.evidence,
          suggestion: issue.suggestion,
          suppressed: issue.suppressed,
        })),
      })),
    );
  };

  const appendEvent = (requestId: string, e: DoorBrickEvent): void => {
    const line = formatRuntimeEventLog({ requestId, mode: adapterMode, event: e.event, payload: e.payload });
    setEvents((prev) => [...prev, { source: "door", text: line }]);
  };

  const getRecipe = (): EditorRecipeV0 => ({
    version: "0",
    nodes,
    edges,
    params: {
      selected_brick: selectedBrick,
      fields: fieldDraftsByBrickId[selectedBrick] ?? [],
      locked,
    },
    slot_bindings: slotBindings,
    seed,
    lockfile: {
      packages: [
        {
          id: "fate-door-ui",
          version: "0.1.0",
          hash: locked ? "sha256-placeholder" : "",
        },
      ],
    },
    package_lock: {
      packages: {
        editor: "0.1.0",
      },
    },
    suppress: [],
  });

  const applyRecipe = (recipe: EditorRecipeV0): void => {
    setNodes(recipe.nodes as CanvasNode[]);
    setEdges(recipe.edges as CanvasEdge[]);
    setSeed(recipe.seed);

    const selected = typeof recipe.params.selected_brick === "string" ? recipe.params.selected_brick : selectedBrick;
    setSelectedBrick(selected);

    if (typeof recipe.params.locked === "boolean") {
      setLocked(recipe.params.locked);
    }

    setSlotBindings(recipe.slot_bindings);

    if (Array.isArray(recipe.params.fields)) {
      const validFields = recipe.params.fields.filter(
        (field): field is PropertyField =>
          typeof field === "object" &&
          field !== null &&
          "key" in field &&
          "label" in field &&
          "value" in field &&
          typeof (field as { key: unknown }).key === "string" &&
          typeof (field as { label: unknown }).label === "string",
      );
      if (validFields.length > 0) {
        setFieldDraftsByBrickId((prev: Record<string, PropertyField[]>) => ({
          ...prev,
          [selected]: validFields,
        }));
      }
    }

    renderBatchValidate(recipe);
  };

  const onDoorInteract = (sourceNodeId?: string): void => {
    const entityId = sourceNodeId ?? "door-1";
    setActiveEntityId(entityId);
    const sceneDoor = getSceneDoor(entityId);
    if (playMode) {
      sceneDoor.setTriggerDistance(DEFAULT_TRIGGER_DISTANCE);
      const doorPosition = doorPositions[entityId];
      const distance = doorPosition === undefined ? Number.POSITIVE_INFINITY : calcDistance(actorPosition, doorPosition);
      const inTrigger = distance <= DEFAULT_TRIGGER_DISTANCE;
      console.debug("[door_scene] interact distance check", {
        entityId,
        actorPosition,
        doorPosition,
        distance,
        triggerDistance: DEFAULT_TRIGGER_DISTANCE,
        inTrigger,
      });
      sceneDoor.updateActorDistance(distance);
      const sceneResult = sceneDoor.interact();
      console.debug("[door_scene] interact result", {
        entityId,
        accepted: sceneResult.accepted,
        reason: sceneResult.reason,
      });
      if (!sceneResult.accepted) {
        appendEvent(`req-${requestSeq}`, { event: "OnDenied", payload: `entity_id=${entityId},reason=${sceneResult.reason}` });
        setRequestSeq((prev) => prev + 1);
        return;
      }
    }

    const requestId = `req-${requestSeq}`;
    const request: Envelope<DoorInteractRequestPayload> = {
      protocol_version: "1.0",
      type: "door.interact.request",
      request_id: requestId,
      payload: { actor_id: sourceNodeId ?? "player_1", entity_id: entityId },
    };
    setRequestSeq((prev) => prev + 1);
    const responseText = adapter.handleInteract(JSON.stringify(request));
    const response = JSON.parse(responseText) as Envelope<DoorInteractResponsePayload>;
    if (response.error !== undefined) {
      const protocolError = response.error;
      setProtocolErrors((prev) => [
        ...prev,
        {
          level: "Error",
          message: `[request_id=${requestId}] ${protocolError.code}: ${protocolError.message} (${JSON.stringify(protocolError.details)}) [brick=door node=${entityId} slot=mesh]`,
        },
      ]);
    } else {
      appendEvent(requestId, response.payload);
      const stateText = response.payload.payload.includes("state=Open") ? "Open" : "Closed";
      adapter.syncState({ entity_id: entityId, state: locked ? "Locked" : stateText as "Open" | "Closed" });
      sceneDoor.syncFromProtocol(locked ? "Locked" : stateText as "Open" | "Closed");
      appendEvent(requestId, {
        event: "OnStateChanged",
        payload: `entity_id=${entityId},state=${sceneDoor.syncToProtocol()},blocked=${sceneDoor.blocksPassage()}` ,
      });
    }
    renderValidate();
    renderBatchValidate(getRecipe());
  };

  const onSwitchInteract = (entityId: string): void => {
    const requestId = `req-${requestSeq}`;
    setRequestSeq((prev) => prev + 1);
    const runtime = getSwitchRuntime(entityId);
    const switchEvent = runtime.interact("player_1", entityId);
    setEvents((prev) => [
      ...prev,
      {
        source: "switch",
        text: `[switch] request_id=${requestId} entity_id=${entityId} event=${switchEvent.event} payload=${switchEvent.payload}`,
      },
    ]);

    const linkedDoorIds = getLinkedDoorIds(nodes, edges, entityId);
    const plannedActions = planTriggerZoneDoorActions(linkedDoorIds, true, (doorId) => getSceneDoor(doorId).syncToProtocol());
    plannedActions.forEach(({ doorId, shouldToggle, previousState }) => {
      setEvents((prev) => [
        ...prev,
        {
          source: "link",
          text: `[switch_link] source=${entityId} target=${doorId} action=toggle_on_use result=${shouldToggle ? "interact" : "noop"} previous_state=${previousState}`,
        },
      ]);
      if (shouldToggle) {
        onDoorInteract(doorId);
      }
    });
  };

  const onLadderInteract = (entityId: string): void => {
    const requestId = `req-${requestSeq}`;
    setRequestSeq((prev) => prev + 1);
    const runtime = getLadderRuntime(entityId);
    const ladderEvent = runtime.interact("player_1", entityId);
    setEvents((prev) => [
      ...prev,
      {
        source: "ladder",
        text: `[ladder] request_id=${requestId} entity_id=${entityId} event=${ladderEvent.event} payload=${ladderEvent.payload}`,
      },
    ]);

    const linkedDoorIds = getLinkedDoorIds(nodes, edges, entityId);
    const plannedActions = planTriggerZoneDoorActions(linkedDoorIds, true, (doorId) => getSceneDoor(doorId).syncToProtocol());
    plannedActions.forEach(({ doorId, shouldToggle, previousState }) => {
      setEvents((prev) => [
        ...prev,
        {
          source: "link",
          text: `[ladder_link] source=${entityId} target=${doorId} action=toggle_on_climb result=${shouldToggle ? "interact" : "noop"} previous_state=${previousState}`,
        },
      ]);
      if (shouldToggle) {
        onDoorInteract(doorId);
      }
    });
  };

  const onInteract = (sourceNodeId?: string): void => {
    const entityId = sourceNodeId ?? "door-1";
    const nodeType = nodes.find((node) => node.id === entityId)?.type ?? "door";
    if (nodeType === "switch") {
      onSwitchInteract(entityId);
      return;
    }
    if (nodeType === "ladder") {
      onLadderInteract(entityId);
      return;
    }
    onDoorInteract(entityId);
  };

  const onToggleLock = (): void => {
    const nextLocked = !locked;
    const entityId = activeEntityId;
    const sceneDoor = getSceneDoor(entityId);
    const requestId = `req-${requestSeq}`;
    setRequestSeq((prev) => prev + 1);
    setLocked(nextLocked);
    appendEvent(requestId, adapter.setState(entityId, "locked", nextLocked));
    adapter.syncState({ entity_id: entityId, state: nextLocked ? "Locked" : "Closed" });
    sceneDoor.syncFromProtocol(nextLocked ? "Locked" : "Closed");
    setFieldDraftsByBrickId((prev: Record<string, PropertyField[]>) => ({
      ...prev,
      door: (prev.door ?? initialFields).map((field: PropertyField) => (field.key === "locked" ? { ...field, value: nextLocked } : field)),
    }));
    renderValidate();
    renderBatchValidate({ ...getRecipe(), params: { ...getRecipe().params, locked: nextLocked }, lockfile: { packages: [{ id: "fate-door-ui", version: "0.1.0", hash: nextLocked ? "sha256-placeholder" : "" }] } });
  };

  const onToggleAdapterMode = (): void => {
    setAdapterMode((prev) => {
      const nextMode: AdapterMode = prev === "demo" ? "runtime" : "demo";
      setEvents((eventsPrev) => [...eventsPrev, { source: "adapter", text: `[adapter_mode] switched_to=${nextMode}` }]);
      return nextMode;
    });
  };

  const onPropertyChange = (key: string, value: PropertyValue): void => {
    setFieldDraftsByBrickId((prev: Record<string, PropertyField[]>) => ({
      ...prev,
      [selectedBrick]: (prev[selectedBrick] ?? toPropertyFields(selectedBrick)).map((field: PropertyField) => (field.key === key ? { ...field, value } : field)),
    }));
  };

  const onTriggerZoneStateChange = (zoneId: string, occupied: boolean): void => {
    const runtime = getTriggerZoneRuntime(zoneId);
    const requestId = `req-${requestSeq}`;
    setRequestSeq((prev) => prev + 1);
    const triggerEvent = runtime.interact("player_1", zoneId);
    setEvents((prev) => [
      ...prev,
      {
        source: "trigger-zone",
        text: `[trigger_zone] request_id=${requestId} entity_id=${zoneId} occupied=${occupied} event=${triggerEvent.event} payload=${triggerEvent.payload}`,
      },
    ]);

    const linkedDoorIds = getLinkedDoorIds(nodes, edges, zoneId);
    const plannedActions = planTriggerZoneDoorActions(linkedDoorIds, occupied, (doorId) => getSceneDoor(doorId).syncToProtocol());

    plannedActions.forEach(({ doorId, action, shouldToggle, previousState }) => {
      if (!shouldToggle) {
        setEvents((prev) => [
          ...prev,
          { source: "link", text: `[trigger_zone_link] source=${zoneId} target=${doorId} action=${action} result=noop state=${previousState}` },
        ]);
        return;
      }

      setEvents((prev) => [
        ...prev,
        { source: "link", text: `[trigger_zone_link] source=${zoneId} target=${doorId} action=${action} result=interact previous_state=${previousState}` },
      ]);
      onInteract(doorId);
    });
  };

  const onSlotBindingChange = (slotId: string, assetRef: string): void => {
    setSlotBindings((prev) => ({ ...prev, [slotId]: assetRef }));
  };

  const onExport = (): void => {
    const recipe = getRecipe();
    const json = exportRecipe(recipe);
    downloadRecipe(json);
    window.alert(t("export.started"));
  };

  const onApplyTemplate = (): void => {
    const baseRecipe = createDefaultEditorDemoRecipe();
    const assembled = assembleWorkflowTemplate("forest_cabin_v0");
    const nextRecipe: EditorRecipeV0 = {
      ...baseRecipe,
      nodes: assembled.nodes as CanvasNode[],
      edges: assembled.edges as CanvasEdge[],
      params: {
        ...baseRecipe.params,
        selected_brick: "door",
      },
    };
    applyRecipe(nextRecipe);
    window.alert(t("template.applied"));
  };

  const onImport = (): void => {
    const json = window.prompt(t("import.prompt"));
    if (json === null) {
      return;
    }
    const recipe = importRecipe(json);
    if (recipe === null) {
      window.alert(t("import.failed"));
      return;
    }
    applyRecipe(recipe);
    window.alert(t("import.success"));
  };

  const onSave = (): void => {
    const recipe = getRecipe();
    renderBatchValidate(recipe);
    const ok = saveToLocalStorage(recipe);
    window.alert(ok ? t("save.success") : t("save.failed"));
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

  const selectedBrickDefinition = getBrickDefinition(selectedBrick);
  const selectedFields = fieldDraftsByBrickId[selectedBrick] ?? toPropertyFields(selectedBrick);
  const lockStatusText = isRecipeLockfileLocked(getRecipe()) ? t("lockfile.locked") : t("lockfile.unlocked");

  const businessValidationItems: ValidationItem[] = [
    ...validationItems,
    ...events.slice(-4).map((eventItem) => ({
      level: "Info" as const,
      message: t("validation.eventPrefix", {
        source: t(`validation.eventSource.${eventItem.source}`),
        eventText: eventItem.text,
      }),
    })),
  ];
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
      left={<BrickPalettePanel items={paletteItems} onSelect={(id) => setSelectedBrick(id)} />}
      center={
        <GraphCanvasPanel
          nodes={nodes}
          edges={edges}
          onChange={(next) => {
            setNodes(next.nodes);
            setEdges(next.edges);
          }}
          onTriggerZoneStateChange={onTriggerZoneStateChange}
          onDoorPositionsChange={setDoorPositions}
          onActorPositionChange={setActorPosition}
          onInteract={(nodeId) => onInteract(nodeId)}
        />
      }
      right={
        <PropertyInspectorPanel
          nodeName={selectedBrickDefinition?.name ?? selectedBrick}
          fields={selectedFields}
          slots={selectedBrickDefinition?.slots ?? []}
          slotBindings={slotBindings}
          onChange={onPropertyChange}
          onSlotBindingChange={onSlotBindingChange}
        />
      }
      bottom={<ValidationPanel items={businessValidationItems} businessItems={businessValidationItems} protocolItems={protocolValidationItems} batchEntries={batchEntries} batchStatsDiff={batchStatsDiff} />}
    />
  );
}
