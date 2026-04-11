import { buildResolvedPropertyFields, toPropertyFields } from "./app-property-helpers";
import { getEnemyPatrolRoutePoints } from "./app-scene";
import type { AssetRegistryItem, BrickCatalogEntry } from "./app-types";
import type { CanvasNode } from "./GraphCanvasPanel";
import type { PropertyField, PropertyValue } from "./PropertyInspectorPanel";
import type { ValidationItem } from "./ValidationPanel";

type Setter<T> = (value: T | ((prev: T) => T)) => void;
type Translate = (key: string, params?: Record<string, string>) => string;

type CreatePropertyActionsArgs = {
  t: Translate;
  catalogEntries: BrickCatalogEntry[];
  nodes: CanvasNode[];
  selectedBrick: string;
  selectedSceneNodeId: string;
  selectedSlotId: string;
  fieldDraftsByBrickId: Record<string, PropertyField[]>;
  setNodes: Setter<CanvasNode[]>;
  setFieldDraftsByNodeId: Setter<Record<string, PropertyField[]>>;
  setFieldDraftsByBrickId: Setter<Record<string, PropertyField[]>>;
  setSlotBindings: Setter<Record<string, string>>;
  setSelectedSlotId: Setter<string>;
  setAssetRegistry: Setter<AssetRegistryItem[]>;
  setCompositeOverridesByBrickId: Setter<Record<string, Record<string, string | number | boolean>>>;
  pushWorkspaceNotice: (item: ValidationItem) => void;
};

export const createAppPropertyActions = ({
  t,
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
}: CreatePropertyActionsArgs) => {
  const syncPatrolRouteMeta = (routeId: string): void => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === selectedSceneNodeId
          ? {
              ...node,
              meta: {
                ...node.meta,
                patrolRoutePoints: getEnemyPatrolRoutePoints(routeId, node.transform?.position ?? [0, 0, 0]),
              },
            }
          : node,
      ),
    );
  };

  const onPropertyChange = (key: string, value: PropertyValue): void => {
    const selectedNode = nodes.find((node) => node.id === selectedSceneNodeId);
    if (selectedNode?.type === selectedBrick) {
      if (selectedNode.meta !== undefined && key === "patrolRoute" && typeof value === "string") {
        syncPatrolRouteMeta(value);
      }
      const sceneFields = fieldDraftsByBrickId[selectedBrick] ?? toPropertyFields(catalogEntries.find((entry) => entry.id === selectedBrick));
      setFieldDraftsByNodeId((prev) => ({
        ...prev,
        [selectedSceneNodeId]: buildResolvedPropertyFields(
          catalogEntries.find((entry) => entry.id === selectedBrick),
          sceneFields,
          prev[selectedSceneNodeId],
        ).map((field) => (field.key === key ? { ...field, value } : field)),
      }));
      return;
    }

    setFieldDraftsByBrickId((prev) => ({
      ...prev,
      [selectedBrick]: buildResolvedPropertyFields(catalogEntries.find((entry) => entry.id === selectedBrick), prev[selectedBrick]).map((field) =>
        field.key === key ? { ...field, value, sceneValue: value } : field,
      ),
    }));
  };

  const onResetField = (key: string): void => {
    const selectedNode = nodes.find((node) => node.id === selectedSceneNodeId);
    if (selectedNode?.type === selectedBrick) {
      const sceneFields = fieldDraftsByBrickId[selectedBrick] ?? toPropertyFields(catalogEntries.find((entry) => entry.id === selectedBrick));
      const resetValue = sceneFields.find((field) => field.key === key)?.packageValue;
      if (selectedNode.meta !== undefined && key === "patrolRoute" && typeof resetValue === "string") {
        syncPatrolRouteMeta(resetValue);
      }
      setFieldDraftsByNodeId((prev) => ({
        ...prev,
        [selectedSceneNodeId]: buildResolvedPropertyFields(
          catalogEntries.find((entry) => entry.id === selectedBrick),
          sceneFields,
          prev[selectedSceneNodeId],
        ).map((field) => (field.key === key ? { ...field, value: field.packageValue } : field)),
      }));
      return;
    }

    setFieldDraftsByBrickId((prev) => ({
      ...prev,
      [selectedBrick]: buildResolvedPropertyFields(catalogEntries.find((entry) => entry.id === selectedBrick), prev[selectedBrick]).map((field) =>
        field.key === key ? { ...field, value: field.packageValue, sceneValue: field.packageValue } : field,
      ),
    }));
  };

  const onResetFieldToScene = (key: string): void => {
    const selectedNode = nodes.find((node) => node.id === selectedSceneNodeId);
    if (selectedNode?.type !== selectedBrick) return;

    const sceneFields = fieldDraftsByBrickId[selectedBrick] ?? toPropertyFields(catalogEntries.find((entry) => entry.id === selectedBrick));
    const sceneValue = sceneFields.find((field) => field.key === key)?.sceneValue;
    if (selectedNode.meta !== undefined && key === "patrolRoute" && typeof sceneValue === "string") {
      syncPatrolRouteMeta(sceneValue);
    }
    setFieldDraftsByNodeId((prev) => ({
      ...prev,
      [selectedSceneNodeId]: buildResolvedPropertyFields(
        catalogEntries.find((entry) => entry.id === selectedBrick),
        sceneFields,
        prev[selectedSceneNodeId],
      ).map((field) => (field.key === key ? { ...field, value: field.sceneValue } : field)),
    }));
  };

  const onSlotBindingChange = (slotId: string, assetRef: string): void => {
    setSlotBindings((prev) => ({ ...prev, [slotId]: assetRef }));
  };

  const onImportSlotAsset = (slotId: string, file: File): void => {
    const assetRef = `asset://local/${file.name}`;
    setSlotBindings((prev) => ({ ...prev, [slotId]: assetRef }));
    setSelectedSlotId(slotId);
    setAssetRegistry((prev) => {
      const nextItem: AssetRegistryItem = {
        id: `${slotId}-${file.name}`.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase(),
        name: file.name,
        assetRef,
        slotHints: [slotId],
        packageId: "local.imports",
        packageVersion: "0.0.0",
        resourceId: file.name,
        resourceType:
          slotId.startsWith("mesh") ? "mesh" :
          slotId.startsWith("material") ? "material" :
          slotId.startsWith("anim") ? "anim" :
          slotId.startsWith("audio") ? "audio" :
          slotId.startsWith("fx") ? "vfx" :
          slotId.startsWith("socket") || slotId.startsWith("input") ? "script_ref" :
          "prefab",
        unityTargetType: "LocalFile",
        licenseSource: "local-user-import",
        localPath: file.name,
        sourcePackageKind: "local",
        importStatus: "local",
      };
      const filtered = prev.filter((item) => item.assetRef !== assetRef);
      return [...filtered, nextItem];
    });
    pushWorkspaceNotice({ level: "Info", message: t("asset.imported", { slotId, fileName: file.name }) });
  };

  const onBindAssetToSelectedSlot = (assetRef: string): void => {
    if (selectedSlotId.length === 0) return;
    setSlotBindings((prev) => ({ ...prev, [selectedSlotId]: assetRef }));
    pushWorkspaceNotice({ level: "Info", message: t("asset.bound", { slotId: selectedSlotId, assetRef }) });
  };

  const onBindAssetToSlot = (slotId: string, assetRef: string): void => {
    setSelectedSlotId(slotId);
    setSlotBindings((prev) => ({ ...prev, [slotId]: assetRef }));
    pushWorkspaceNotice({ level: "Info", message: t("asset.bound", { slotId, assetRef }) });
  };

  const onCompositeOverrideChange = (groupKey: string, key: string, value: PropertyValue): void => {
    const compositeKey = `${groupKey}.${key}`;
    setCompositeOverridesByBrickId((prev) => ({
      ...prev,
      [selectedBrick]: {
        ...(prev[selectedBrick] ?? {}),
        [compositeKey]: value,
      },
    }));
  };

  return {
    onPropertyChange,
    onResetField,
    onResetFieldToScene,
    onSlotBindingChange,
    onImportSlotAsset,
    onBindAssetToSelectedSlot,
    onBindAssetToSlot,
    onCompositeOverrideChange,
  };
};
