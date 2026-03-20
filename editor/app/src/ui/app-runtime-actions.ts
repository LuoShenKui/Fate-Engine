import { DoorRuntimeAdapter, LadderRuntimeAdapter, SwitchRuntimeAdapter, TriggerZoneRuntimeAdapter, formatRuntimeEventLog, type AdapterMode, type DoorBrickEvent } from "../domain/door";
import type { Envelope } from "../protocol/envelope";
import type { DoorSceneComponent } from "../runtime/doorScene";
import { isRecipeLockfileLocked, type EditorRecipeV0 } from "../project/recipe";
import { DOOR_LINK_ACTIONS } from "../workflow/interactionContract";
import { getLinkedDoorIds, planTriggerZoneDoorActions } from "../workflow/sceneRouting";
import { runBatchValidate, type BatchValidationStats } from "../workflow/validation";
import { DEFAULT_ACTOR_TYPE, DEFAULT_TRIGGER_DISTANCE, RECENT_BRICKS_LIMIT } from "./app-constants";
import { builtinCatalogEntries } from "./app-catalog";
import { deserializeInstalledBricks, serializeInstalledBricks } from "./app-imports";
import { buildResolvedPropertyFields, inferPropertyGroup, initialFields, parseFieldDraftMap, parseInstanceFieldDrafts, toPropertyFields } from "./app-property-helpers";
import { buildRecipePackageState, calcDistance, getEnemyPatrolRoutePoints, parseAssetRegistry, resolveRuntimeKind } from "./app-scene";
import { getLadderRuntime, getSceneDoorRuntime, getSwitchRuntime, getTriggerZoneRuntime, syncGrantedAbilitiesForSource } from "./app-runtime-helpers";
import type { AbilityGrantState, AssetRegistryItem, BrickCatalogEntry, RuntimeEventItem } from "./app-types";
import type { CanvasEdge, CanvasNode } from "./GraphCanvasPanel";
import type { PropertyField } from "./PropertyInspectorPanel";
import type { ValidationItem } from "./ValidationPanel";

type Setter<T> = (value: T | ((prev: T) => T)) => void;

type DoorInteractRequestPayload = {
  actor_id: string;
  entity_id: string;
};

type DoorInteractResponsePayload = {
  event: string;
  payload: string;
};

type Translate = (key: string, params?: Record<string, string>) => string;

type CreateRuntimeActionsArgs = {
  t: Translate;
  adapter: {
    validate: (brickId: string, entityId: string) => { issues: string[] };
    handleInteract: (requestJson: string) => string;
    syncState: (state: { entity_id: string; state: "Open" | "Closed" | "Locked" }) => void;
    setState: (entityId: string, key: "locked", value: boolean) => DoorBrickEvent;
  };
  adapterMode: AdapterMode;
  locked: boolean;
  requestSeq: number;
  playMode: boolean;
  activeEntityId: string;
  selectedBrick: string;
  selectedSceneNodeId: string;
  actorPosition: [number, number, number];
  doorPositions: Record<string, [number, number, number]>;
  importedBricks: BrickCatalogEntry[];
  catalogEntries: BrickCatalogEntry[];
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  slotBindings: Record<string, string>;
  seed: number;
  recentBrickIds: string[];
  fieldDraftsByBrickId: Record<string, PropertyField[]>;
  fieldDraftsByNodeId: Record<string, PropertyField[]>;
  compositeOverridesByBrickId: Record<string, Record<string, string | number | boolean>>;
  equippedAbilityPackageIds: string[];
  assetRegistry: AssetRegistryItem[];
  grantedAbilities: AbilityGrantState[];
  lastBatchStats: BatchValidationStats;
  sceneDoorMap: Map<string, DoorSceneComponent>;
  ladderRuntimeMap: Map<string, LadderRuntimeAdapter>;
  switchRuntimeMap: Map<string, SwitchRuntimeAdapter>;
  triggerZoneRuntimeMap: Map<string, TriggerZoneRuntimeAdapter>;
  setEvents: Setter<RuntimeEventItem[]>;
  setProtocolErrors: Setter<ValidationItem[]>;
  setValidationItems: Setter<ValidationItem[]>;
  setBatchStatsDiff: Setter<BatchValidationStats>;
  setLastBatchStats: Setter<BatchValidationStats>;
  setBatchEntries: Setter<Array<{ recipeId: string; items: ValidationItem[] }>>;
  setNodes: Setter<CanvasNode[]>;
  setEdges: Setter<CanvasEdge[]>;
  setSeed: Setter<number>;
  setGrantedAbilities: Setter<AbilityGrantState[]>;
  setEquippedAbilityPackageIds: Setter<string[]>;
  setAssetRegistry: Setter<AssetRegistryItem[]>;
  setRecentBrickIds: Setter<string[]>;
  setFieldDraftsByNodeId: Setter<Record<string, PropertyField[]>>;
  setSelectedSceneNodeId: Setter<string>;
  setSelectedBrick: Setter<string>;
  setActiveEntityId: Setter<string>;
  setLocked: Setter<boolean>;
  setAdapterMode: Setter<AdapterMode>;
  setCompositeOverridesByBrickId: Setter<Record<string, Record<string, string | number | boolean>>>;
  setFieldDraftsByBrickId: Setter<Record<string, PropertyField[]>>;
  setImportedBricks: Setter<BrickCatalogEntry[]>;
  setSlotBindings: Setter<Record<string, string>>;
  setRequestSeq: Setter<number>;
  pushWorkspaceNotice: (item: ValidationItem) => void;
};

export const createAppRuntimeActions = ({
  t,
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
}: CreateRuntimeActionsArgs) => {
  const getEntryByPackageOrId = (packageIdOrBrickId: string): BrickCatalogEntry | undefined =>
    catalogEntries.find((entry) => entry.packageId === packageIdOrBrickId || entry.id === packageIdOrBrickId);

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

  const appendEvent = (requestId: string, event: DoorBrickEvent): void => {
    const line = formatRuntimeEventLog({ requestId, mode: adapterMode, event: event.event, payload: event.payload });
    setEvents((prev) => [...prev, { source: "door", text: line }]);
  };

  const getRecipe = (): EditorRecipeV0 => {
    const packageState = buildRecipePackageState(nodes, catalogEntries, importedBricks, locked, equippedAbilityPackageIds);
    return {
      version: "0",
      nodes,
      edges,
      params: {
        selected_brick: selectedBrick,
        fields: fieldDraftsByBrickId[selectedBrick] ?? [],
        brick_fields: fieldDraftsByBrickId,
        locked,
        installed_bricks: serializeInstalledBricks(importedBricks),
        instance_fields: fieldDraftsByNodeId,
        composite_overrides: compositeOverridesByBrickId,
        actor_abilities: equippedAbilityPackageIds,
        asset_registry: assetRegistry,
        recent_bricks: recentBrickIds,
      },
      slot_bindings: slotBindings,
      seed,
      lockfile: packageState.lockfile,
      package_lock: packageState.package_lock,
      suppress: [],
    };
  };

  const applyRecipe = (recipe: EditorRecipeV0): void => {
    setNodes(recipe.nodes as CanvasNode[]);
    setEdges(recipe.edges as CanvasEdge[]);
    setSeed(recipe.seed);
    setGrantedAbilities([]);
    setEquippedAbilityPackageIds(
      Array.isArray(recipe.params.actor_abilities) ? recipe.params.actor_abilities.filter((item): item is string => typeof item === "string") : [],
    );
    setAssetRegistry(parseAssetRegistry(recipe.params.asset_registry));
    setRecentBrickIds(
      Array.isArray(recipe.params.recent_bricks)
        ? recipe.params.recent_bricks.filter((item): item is string => typeof item === "string").slice(0, RECENT_BRICKS_LIMIT)
        : [],
    );
    setFieldDraftsByNodeId(parseInstanceFieldDrafts(recipe.params.instance_fields));
    setSelectedSceneNodeId((recipe.nodes as CanvasNode[])[0]?.id ?? "door-1");

    const selected = typeof recipe.params.selected_brick === "string" ? recipe.params.selected_brick : selectedBrick;
    setSelectedBrick(selected);

    if (typeof recipe.params.locked === "boolean") {
      setLocked(recipe.params.locked);
    }

    if (typeof recipe.params.composite_overrides === "object" && recipe.params.composite_overrides !== null && !Array.isArray(recipe.params.composite_overrides)) {
      const rawOverrides = recipe.params.composite_overrides as Record<string, unknown>;
      const nextOverrides = Object.entries(rawOverrides).reduce<Record<string, Record<string, string | number | boolean>>>((acc, [brickId, value]) => {
        if (typeof value !== "object" || value === null || Array.isArray(value)) return acc;
        const normalized = Object.entries(value as Record<string, unknown>).reduce<Record<string, string | number | boolean>>((inner, [key, rawValue]) => {
          if (typeof rawValue === "string" || typeof rawValue === "number" || typeof rawValue === "boolean") {
            inner[key] = rawValue;
          }
          return inner;
        }, {});
        acc[brickId] = normalized;
        return acc;
      }, {});
      setCompositeOverridesByBrickId(nextOverrides);
    }

    if (typeof recipe.params.brick_fields === "object" && recipe.params.brick_fields !== null && !Array.isArray(recipe.params.brick_fields)) {
      setFieldDraftsByBrickId((prev) => ({
        ...prev,
        ...parseFieldDraftMap(recipe.params.brick_fields),
      }));
    }

    if (Array.isArray(recipe.params.installed_bricks)) {
      const restoredImportedBricks = deserializeInstalledBricks(recipe.params.installed_bricks);
      setImportedBricks(restoredImportedBricks);
      setFieldDraftsByBrickId((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (!builtinCatalogEntries.some((entry) => entry.id === key) && !restoredImportedBricks.some((entry) => entry.id === key)) {
            delete next[key];
          }
        });
        restoredImportedBricks.forEach((entry) => {
          next[entry.id] = prev[entry.id] ?? toPropertyFields(entry);
        });
        return next;
      });
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
        const defaultFields = toPropertyFields(catalogEntries.find((entry) => entry.id === selected));
        setFieldDraftsByBrickId((prev) => ({
          ...prev,
          [selected]: validFields.map((field) => ({
            ...field,
            defaultValue: defaultFields.find((candidate) => candidate.key === field.key)?.defaultValue ?? field.value,
            group: defaultFields.find((candidate) => candidate.key === field.key)?.group ?? inferPropertyGroup(field.key),
          })),
        }));
      }
    }

    renderBatchValidate(recipe);
  };

  const onDoorInteract = (sourceNodeId?: string): void => {
    const entityId = sourceNodeId ?? "door-1";
    const sceneDoor = getSceneDoorRuntime(sceneDoorMap, entityId);
    setActiveEntityId(entityId);
    setSelectedSceneNodeId(entityId);

    if (playMode) {
      sceneDoor.setTriggerDistance(DEFAULT_TRIGGER_DISTANCE);
      const doorPosition = doorPositions[entityId];
      const distance = doorPosition === undefined ? Number.POSITIVE_INFINITY : calcDistance(actorPosition, doorPosition);
      sceneDoor.updateActorDistance(distance);
      const sceneResult = sceneDoor.interact();
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
      adapter.syncState({ entity_id: entityId, state: locked ? "Locked" : (stateText as "Open" | "Closed") });
      sceneDoor.syncFromProtocol(locked ? "Locked" : (stateText as "Open" | "Closed"));
      appendEvent(requestId, {
        event: "OnStateChanged",
        payload: `entity_id=${entityId},state=${sceneDoor.syncToProtocol()},blocked=${sceneDoor.blocksPassage()}`,
      });
    }

    renderValidate();
    renderBatchValidate(getRecipe());
  };

  const onSwitchInteract = (entityId: string): void => {
    const requestId = `req-${requestSeq}`;
    setRequestSeq((prev) => prev + 1);
    const runtime = getSwitchRuntime(switchRuntimeMap, entityId);
    const switchEvent = runtime.interact("player_1", entityId);
    setEvents((prev) => [...prev, { source: "switch", text: `[switch] request_id=${requestId} entity_id=${entityId} event=${switchEvent.event} payload=${switchEvent.payload}` }]);

    const linkedDoorIds = getLinkedDoorIds(nodes, edges, entityId);
    const plannedActions = planTriggerZoneDoorActions(linkedDoorIds, true, (doorId) => getSceneDoorRuntime(sceneDoorMap, doorId).syncToProtocol());
    plannedActions.forEach(({ doorId, shouldToggle, previousState }) => {
      setEvents((prev) => [
        ...prev,
        { source: "link", text: `[switch_link] source=${entityId} target=${doorId} action=${DOOR_LINK_ACTIONS[2]} result=${shouldToggle ? "interact" : "noop"} previous_state=${previousState}` },
      ]);
      if (shouldToggle) onDoorInteract(doorId);
    });
  };

  const onLadderInteract = (entityId: string): void => {
    const requestId = `req-${requestSeq}`;
    setRequestSeq((prev) => prev + 1);
    const runtime = getLadderRuntime(ladderRuntimeMap, entityId);
    const ladderEvent = runtime.interact("player_1", entityId);
    setEvents((prev) => [...prev, { source: "ladder", text: `[ladder] request_id=${requestId} entity_id=${entityId} event=${ladderEvent.event} payload=${ladderEvent.payload}` }]);

    const linkedDoorIds = getLinkedDoorIds(nodes, edges, entityId);
    const plannedActions = planTriggerZoneDoorActions(linkedDoorIds, true, (doorId) => getSceneDoorRuntime(sceneDoorMap, doorId).syncToProtocol());
    plannedActions.forEach(({ doorId, shouldToggle, previousState }) => {
      setEvents((prev) => [
        ...prev,
        { source: "link", text: `[ladder_link] source=${entityId} target=${doorId} action=${DOOR_LINK_ACTIONS[3]} result=${shouldToggle ? "interact" : "noop"} previous_state=${previousState}` },
      ]);
      if (shouldToggle) onDoorInteract(doorId);
    });
  };

  const onInteract = (sourceNodeId?: string): void => {
    const entityId = sourceNodeId ?? "door-1";
    setSelectedSceneNodeId(entityId);
    const nodeType = nodes.find((node) => node.id === entityId)?.type ?? "door";
    const runtimeKind = resolveRuntimeKind(nodeType, catalogEntries);
    setSelectedBrick(nodeType);
    if (runtimeKind === "switch") return onSwitchInteract(entityId);
    if (runtimeKind === "ladder") return onLadderInteract(entityId);
    onDoorInteract(entityId);
  };

  const onToggleLock = (): void => {
    const nextLocked = !locked;
    const entityId = activeEntityId;
    const sceneDoor = getSceneDoorRuntime(sceneDoorMap, entityId);
    const requestId = `req-${requestSeq}`;
    setRequestSeq((prev) => prev + 1);
    setLocked(nextLocked);
    appendEvent(requestId, adapter.setState(entityId, "locked", nextLocked));
    adapter.syncState({ entity_id: entityId, state: nextLocked ? "Locked" : "Closed" });
    sceneDoor.syncFromProtocol(nextLocked ? "Locked" : "Closed");
    setFieldDraftsByBrickId((prev) => ({
      ...prev,
      door: (prev.door ?? initialFields).map((field) => (field.key === "locked" ? { ...field, value: nextLocked } : field)),
    }));
    renderValidate();
    renderBatchValidate({
      ...getRecipe(),
      params: { ...getRecipe().params, locked: nextLocked },
      lockfile: { packages: [{ id: "fate-door-ui", version: "0.1.0", hash: nextLocked ? "sha256-placeholder" : "" }] },
    });
  };

  const onToggleAdapterMode = (): void => {
    setAdapterMode((prev) => {
      const nextMode: AdapterMode = prev === "demo" ? "runtime" : "demo";
      setEvents((eventPrev) => [...eventPrev, { source: "adapter", text: `[adapter_mode] switched_to=${nextMode}` }]);
      return nextMode;
    });
  };

  const onToggleActorAbility = (brickId: string): void => {
    const abilityEntry = catalogEntries.find((entry) => entry.id === brickId);
    if (abilityEntry === undefined || abilityEntry.category !== "ability") return;
    if (abilityEntry.supportedActorTypes.length > 0 && !abilityEntry.supportedActorTypes.includes(DEFAULT_ACTOR_TYPE)) {
      pushWorkspaceNotice({
        level: "Warning",
        message: t("import.brick.resolve.actorIncompatible", { brickName: abilityEntry.name, actorType: DEFAULT_ACTOR_TYPE }),
      });
      return;
    }
    setEquippedAbilityPackageIds((prev) => {
      const equipped = prev.includes(abilityEntry.packageId);
      const next = equipped ? prev.filter((packageId) => packageId !== abilityEntry.packageId) : [...prev, abilityEntry.packageId];
      setEvents((eventPrev) => [...eventPrev, { source: "ability", text: `[ability] source=actor package=${abilityEntry.packageId} result=${equipped ? "revoked" : "granted"} actor_type=${DEFAULT_ACTOR_TYPE}` }]);
      return next;
    });
  };

  const onTriggerZoneStateChange = (zoneId: string, occupied: boolean): void => {
    const runtime = getTriggerZoneRuntime(triggerZoneRuntimeMap, zoneId);
    const requestId = `req-${requestSeq}`;
    setRequestSeq((prev) => prev + 1);
    const triggerEvent = runtime.interact("player_1", zoneId);
    setEvents((prev) => [...prev, { source: "trigger-zone", text: `[trigger_zone] request_id=${requestId} entity_id=${zoneId} occupied=${occupied} event=${triggerEvent.event} payload=${triggerEvent.payload}` }]);
    syncGrantedAbilitiesForSource({ sourceNodeId: zoneId, occupied, nodes, catalogEntries, setEvents, setGrantedAbilities });

    const linkedDoorIds = getLinkedDoorIds(nodes, edges, zoneId);
    const plannedActions = planTriggerZoneDoorActions(linkedDoorIds, occupied, (doorId) => getSceneDoorRuntime(sceneDoorMap, doorId).syncToProtocol());
    plannedActions.forEach(({ doorId, action, shouldToggle, previousState }) => {
      if (!shouldToggle) {
        setEvents((prev) => [...prev, { source: "link", text: `[trigger_zone_link] source=${zoneId} target=${doorId} action=${action} result=noop state=${previousState}` }]);
        return;
      }
      setEvents((prev) => [...prev, { source: "link", text: `[trigger_zone_link] source=${zoneId} target=${doorId} action=${action} result=interact previous_state=${previousState}` }]);
      onInteract(doorId);
    });
  };

  const lockStatusText = isRecipeLockfileLocked(getRecipe()) ? t("lockfile.locked") : t("lockfile.unlocked");

  return {
    appendEvent,
    renderValidate,
    renderBatchValidate,
    getRecipe,
    applyRecipe,
    onInteract,
    onToggleLock,
    onToggleAdapterMode,
    onToggleActorAbility,
    onTriggerZoneStateChange,
    syncGrantedAbilitiesForSource: (sourceNodeId: string, occupied: boolean) => syncGrantedAbilitiesForSource({ sourceNodeId, occupied, nodes, catalogEntries, setEvents, setGrantedAbilities }),
    lockStatusText,
  };
};
