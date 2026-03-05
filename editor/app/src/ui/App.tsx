/**
 * UI 模块：页面渲染与交互绑定。
 * 后续可在此接入积木列表/属性面板，并与协议事件连线联动。
 */
import { useEffect, useMemo, useState } from "react";
import { DoorSceneComponent } from "../runtime/doorScene";
import { DoorRuntimeAdapter, type AdapterMode, type DoorBrickEvent, DoorBrickDefinition, formatRuntimeEventLog } from "../domain/door";
import { DoorProtocolAdapter, type Envelope } from "../protocol/envelope";
import { getBrickDefinition, listBrickDefinitions } from "../domain/registry";
import {
  downloadRecipe,
  exportRecipe,
  importRecipe,
  isRecipeLockfileLocked,
  loadFromLocalStorage,
  saveToLocalStorage,
  type EditorRecipeV0,
} from "../project/recipe";
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

const paletteItems: BrickPaletteItem[] = listBrickDefinitions().map((definition) => ({
  id: definition.id,
  name: definition.name,
  summary: definition.summary,
}));

const initialFields: PropertyField[] = DoorBrickDefinition.properties.map((property) => ({
  key: property.key,
  label: property.label,
  value: property.defaultValue,
}));

const defaultNodes: CanvasNode[] = [{ id: "door-1", type: "door" }];
const defaultEdges: CanvasEdge[] = [];
const DEFAULT_TRIGGER_DISTANCE = 1.5;

const calcDistance = (from: [number, number, number], to: [number, number, number]): number => {
  const dx = from[0] - to[0];
  const dy = from[1] - to[1];
  const dz = from[2] - to[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

export default function App(): JSX.Element {
  const [adapterMode, setAdapterMode] = useState<AdapterMode>("demo");
  const adapter = useMemo(() => new DoorProtocolAdapter(new DoorRuntimeAdapter()), []);
  const sceneDoorMap = useMemo(() => new Map<string, DoorSceneComponent>(), []);
  const { t } = useI18n();
  const [events, setEvents] = useState<string[]>([]);
  const [protocolErrors, setProtocolErrors] = useState<ValidationItem[]>([]);
  const [requestSeq, setRequestSeq] = useState(1);
  const [locked, setLocked] = useState(false);
  const [validationItems, setValidationItems] = useState<ValidationItem[]>([{ level: "Info", message: t("validation.waiting") }]);
  const [selectedBrick, setSelectedBrick] = useState(paletteItems[0]?.id ?? "none");
  const [fields, setFields] = useState<PropertyField[]>(initialFields);
  const [slotBindings, setSlotBindings] = useState<Record<string, string>>({ mesh: "asset://mesh/default-door" });
  const [nodes, setNodes] = useState<CanvasNode[]>(defaultNodes);
  const [edges, setEdges] = useState<CanvasEdge[]>(defaultEdges);
  const [seed, setSeed] = useState<number>(Date.now());
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

  const renderValidate = (): void => {
    const report = adapter.validate("demo_door");
    const issues = report.issues.map<ValidationItem>((issue) => ({ level: "Error", message: `${issue} [brick=door node=door-1 slot=mesh]` }));
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
        items: entry.issues.map((issue) => ({ level: issue.level, message: issue.message })),
      })),
    );
  };

  const appendEvent = (requestId: string, e: DoorBrickEvent): void => {
    const line = formatRuntimeEventLog({ requestId, mode: adapterMode, event: e.event, payload: e.payload });
    setEvents((prev) => [...prev, line]);
  };

  const getRecipe = (): EditorRecipeV0 => ({
    version: "0",
    nodes,
    edges,
    params: {
      selected_brick: selectedBrick,
      fields,
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
        setFields(validFields);
      }
    }

    renderBatchValidate(recipe);
  };

  const onInteract = (sourceNodeId?: string): void => {
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

  const onToggleLock = (): void => {
    const nextLocked = !locked;
    const entityId = activeEntityId;
    const sceneDoor = getSceneDoor(entityId);
    const requestId = `req-${requestSeq}`;
    setRequestSeq((prev) => prev + 1);
    setLocked(nextLocked);
    appendEvent(requestId, adapter.setState("locked", nextLocked));
    adapter.syncState({ entity_id: entityId, state: nextLocked ? "Locked" : "Closed" });
    sceneDoor.syncFromProtocol(nextLocked ? "Locked" : "Closed");
    setFields((prev) => prev.map((field) => (field.key === "locked" ? { ...field, value: nextLocked } : field)));
    renderValidate();
    renderBatchValidate({ ...getRecipe(), params: { ...getRecipe().params, locked: nextLocked }, lockfile: { packages: [{ id: "fate-door-ui", version: "0.1.0", hash: nextLocked ? "sha256-placeholder" : "" }] } });
  };

  const onToggleAdapterMode = (): void => {
    setAdapterMode((prev) => {
      const nextMode: AdapterMode = prev === "demo" ? "runtime" : "demo";
      setEvents((eventsPrev) => [...eventsPrev, `[adapter_mode] switched_to=${nextMode}`]);
      return nextMode;
    });
  };

  const onPropertyChange = (key: string, value: PropertyValue): void => {
    setFields((prev) => prev.map((field) => (field.key === key ? { ...field, value } : field)));
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
    const assembled = assembleWorkflowTemplate("warehouse_gate_v0");
    setNodes(assembled.nodes as CanvasNode[]);
    setEdges(assembled.edges as CanvasEdge[]);
    const recipe = { ...getRecipe(), nodes: assembled.nodes, edges: assembled.edges };
    renderBatchValidate(recipe);
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
  const lockStatusText = isRecipeLockfileLocked(getRecipe()) ? t("lockfile.locked") : t("lockfile.unlocked");

  const businessValidationItems: ValidationItem[] = [
    ...validationItems,
    ...events.slice(-3).map((eventText) => ({ level: "Info" as const, message: t("validation.eventPrefix", { eventText }) })),
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
          onDoorPositionsChange={setDoorPositions}
          onActorPositionChange={setActorPosition}
          onInteract={(nodeId) => onInteract(nodeId)}
        />
      }
      right={
        <PropertyInspectorPanel
          nodeName={selectedBrickDefinition?.name ?? selectedBrick}
          fields={fields}
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
