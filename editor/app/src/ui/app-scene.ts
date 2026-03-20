import type { EditorRecipeV0 } from "../project/recipe";
import type { CanvasEdge, CanvasNode } from "./GraphCanvasPanel";
import type { BrickCatalogEntry } from "./app-types";
import { DEFAULT_ACTOR_TYPE, DEFAULT_TRIGGER_DISTANCE, EDITOR_ENGINE_VERSION, SCENE_LAYOUT_COLUMNS } from "./app-constants";
import { getForestDemoPlacement } from "./forest-demo-layout";
import { getBrickPreviewUri } from "./preview-art";

export const parseAssetRegistry = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((record, index) => ({
      id: typeof record.id === "string" ? record.id : `asset-${index + 1}`,
      name: typeof record.name === "string" ? record.name : "Imported Asset",
      assetRef: typeof record.assetRef === "string" ? record.assetRef : "",
      slotHints: Array.isArray(record.slotHints) ? record.slotHints.filter((hint): hint is string => typeof hint === "string") : [],
    }))
    .filter((item) => item.assetRef.length > 0);
};

export const calcDistance = (from: [number, number, number], to: [number, number, number]): number => {
  const dx = from[0] - to[0];
  const dy = from[1] - to[1];
  const dz = from[2] - to[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

export const getEnemyPatrolRoutePoints = (routeId: string, origin: [number, number, number]): Array<[number, number, number]> => {
  if (routeId === "route_guard_loop") return [[origin[0] - 1.6, 0, origin[2] - 0.8], [origin[0] + 1.6, 0, origin[2] + 0.8]];
  if (routeId === "route_guard_gate") return [[origin[0], 0, origin[2] - 1.8], [origin[0], 0, origin[2] + 1.8]];
  return [[origin[0] - 1.4, 0, origin[2]], [origin[0] + 1.4, 0, origin[2]]];
};

export const createSceneNodeId = (brickId: string, nodes: CanvasNode[]): string => `${brickId}-${nodes.filter((node) => node.type === brickId).length + 1}`;

export const createSceneNodeTransform = (count: number): CanvasNode["transform"] => ({
  position: [((count % SCENE_LAYOUT_COLUMNS) - 1.5) * 1.8, 0, Math.floor(count / SCENE_LAYOUT_COLUMNS) * 1.8 + 2.5],
  rotation: [0, 0, 0],
});

export const applySlotFallbackBindings = (bindings: Record<string, string>, entry?: BrickCatalogEntry): Record<string, string> => {
  if (entry === undefined || entry.slots.length === 0) return bindings;
  const nextBindings = { ...bindings };
  entry.slots.forEach((slot) => {
    if ((nextBindings[slot.slotId] ?? "").trim().length === 0 && typeof slot.fallbackAssetRef === "string" && slot.fallbackAssetRef.length > 0) {
      nextBindings[slot.slotId] = slot.fallbackAssetRef;
    }
  });
  return nextBindings;
};

export const resolveRuntimeKind = (brickId: string, catalog: BrickCatalogEntry[]): BrickCatalogEntry["runtimeKind"] =>
  catalog.find((entry) => entry.id === brickId)?.runtimeKind ?? (brickId === "door" || brickId === "switch" || brickId === "ladder" || brickId === "trigger-zone" ? brickId : "generic");

export const buildQuickPreviewScene = (
  brickId: string,
  runtimeKind: BrickCatalogEntry["runtimeKind"],
  category = "custom",
  grantedAbilityPackageIds: string[] = [],
): { nodes: CanvasNode[]; edges: CanvasEdge[] } => {
  if (category === "ability") {
    return { nodes: [{ id: `${brickId}-preview`, type: brickId, transform: { position: [0, 0, 1.6], rotation: [0, 0, 0] }, meta: { grantedAbilityPackageIds: [brickId] } }], edges: [] };
  }
  if (category === "enemy") {
    return { nodes: [{ id: `${brickId}-preview`, type: brickId, transform: { position: [0, 0, 1.8], rotation: [0, 0, 0] }, meta: { patrolRoutePoints: getEnemyPatrolRoutePoints("route_guard_a", [0, 0, 1.8]) } }, { id: "patrol-zone-preview", type: "trigger-zone", transform: { position: [1.8, 0, 1.8], rotation: [0, 0, 0] } }], edges: [] };
  }
  if (runtimeKind === "door") return { nodes: [{ id: `${brickId}-preview`, type: brickId, transform: { position: [0, 0, 1.4], rotation: [0, 0, 0] } }], edges: [] };
  if (runtimeKind === "switch" || runtimeKind === "ladder" || runtimeKind === "trigger-zone") {
    return { nodes: [{ id: `${brickId}-preview`, type: brickId, transform: { position: [0, 0, 1.6], rotation: [0, 0, 0] }, meta: grantedAbilityPackageIds.length > 0 ? { grantedAbilityPackageIds } : undefined }], edges: [] };
  }
  return { nodes: [{ id: `${brickId}-preview`, type: brickId, transform: { position: [0, 0, 1.8], rotation: [0, 0, 0] } }], edges: [] };
};

const offsetPreviewScene = (
  scene: { nodes: CanvasNode[]; edges: CanvasEdge[] },
  prefix: string,
  targetOrigin: [number, number, number],
): { nodes: CanvasNode[]; edges: CanvasEdge[] } => {
  const sourceOrigin = scene.nodes[0]?.transform?.position ?? [0, 0, 0];
  const idMap = new Map<string, string>();
  const nodes = scene.nodes.map((node) => {
    const nextId = `${prefix}-${node.id}`;
    idMap.set(node.id, nextId);
    const position = node.transform?.position ?? sourceOrigin;
    return {
      ...node,
      id: nextId,
      transform: {
        position: [
          targetOrigin[0] + (position[0] - sourceOrigin[0]),
          targetOrigin[1] + (position[1] - sourceOrigin[1]),
          targetOrigin[2] + (position[2] - sourceOrigin[2]),
        ] as [number, number, number],
        rotation: node.transform?.rotation ?? [0, 0, 0],
      },
    };
  });
  const edges = scene.edges.map((edge) => ({ from: idMap.get(edge.from) ?? edge.from, to: idMap.get(edge.to) ?? edge.to }));
  return { nodes, edges };
};

const buildForestDemoModule = (
  entry: BrickCatalogEntry,
  index: number,
  catalog: BrickCatalogEntry[],
): { nodes: CanvasNode[]; edges: CanvasEdge[] } => {
  const origin = getForestDemoPlacement(entry, index);
  if (entry.category === "composite" && entry.compositeChildren.length > 0) {
    return buildCompositeSceneInsertion(entry, [], catalog, origin);
  }
  const previewScene = buildQuickPreviewScene(entry.id, entry.runtimeKind, entry.category, entry.grantedAbilityPackageIds);
  return offsetPreviewScene(previewScene, `demo-${entry.id}`, origin);
};

export const buildForestCabinDemoScene = (baseNodes: CanvasNode[], baseEdges: CanvasEdge[], catalog: BrickCatalogEntry[]): { nodes: CanvasNode[]; edges: CanvasEdge[] } => {
  const existingTypes = new Set(baseNodes.map((node) => node.type).filter((value): value is string => typeof value === "string"));
  const appendedModules = catalog
    .filter((entry) => !existingTypes.has(entry.id))
    .map((entry, index) => buildForestDemoModule(entry, index, catalog));
  return {
    nodes: [...baseNodes, ...appendedModules.flatMap((module) => module.nodes)],
    edges: [...baseEdges, ...appendedModules.flatMap((module) => module.edges)],
  };
};

export const buildCompositeSceneInsertion = (entry: BrickCatalogEntry, existingNodes: CanvasNode[], catalog: BrickCatalogEntry[], position?: [number, number, number]): { nodes: CanvasNode[]; edges: CanvasEdge[] } => {
  const compositeBaseId = `${entry.id}-${existingNodes.filter((node) => node.type === entry.id).length + 1}`;
  const childIdMap = new Map<string, string>();
  const childOrigin = entry.compositeChildren[0]?.position ?? [0, 0, 0];
  const nodes = entry.compositeChildren.map((child) => {
    const nextId = `${compositeBaseId}.${child.id}`;
    childIdMap.set(child.id, nextId);
    const childRuntimeKind = resolveRuntimeKind(child.type, catalog);
    const offsetPosition = position !== undefined ? [position[0] + (child.position[0] - childOrigin[0]), position[1] + (child.position[1] - childOrigin[1]), position[2] + (child.position[2] - childOrigin[2])] as [number, number, number] : child.position;
    return { id: nextId, type: child.type, transform: { position: offsetPosition, rotation: [0, 0, 0] as [number, number, number] }, meta: childRuntimeKind === "trigger-zone" && entry.grantedAbilityPackageIds.length > 0 ? { grantedAbilityPackageIds: entry.grantedAbilityPackageIds, compositeParentId: compositeBaseId } : { compositeParentId: compositeBaseId } };
  });
  const edges = entry.compositeEdges.map((edge) => ({ from: childIdMap.get(edge.from) ?? "", to: childIdMap.get(edge.to) ?? "" })).filter((edge) => edge.from.length > 0 && edge.to.length > 0);
  return { nodes, edges };
};

export const getBrickPreviewSrc = (entry?: BrickCatalogEntry): string | undefined => {
  if (entry === undefined) return undefined;
  return getBrickPreviewUri({ id: entry.id, name: entry.name, category: entry.category });
};

export const getReadinessSummary = (entry: BrickCatalogEntry | undefined, t: (key: string, params?: Record<string, string>) => string): Array<{ label: string; tone: "ready" | "warning" | "blocked" }> => {
  if (entry === undefined) return [];
  const issues = entry.importIssues;
  const hasDependencyIssue = issues.some((issue) => issue.startsWith("DEPENDENCY_"));
  const hasResourceIssue = issues.some((issue) => issue.startsWith("SLOT_DEFAULT_MISSING") || issue.startsWith("ENEMY_MESH_MISSING") || issue.startsWith("ENEMY_ATTACK_ANIMATION_MISSING"));
  const hasAbilityIssue = issues.some((issue) => issue.startsWith("ABILITY_"));
  const hasCompositeIssue = issues.some((issue) => issue.startsWith("COMPOSITE_CHILD_MISSING"));
  const hasCompatIssue = issues.some((issue) => issue.startsWith("ENGINE_INCOMPATIBLE") || issue.startsWith("CONTRACT_INCOMPATIBLE"));
  return [
    { label: t("panel.brickDetails.summaryDirectUse"), tone: entry.installState === "ready" ? "ready" : entry.installState === "blocked" ? "blocked" : "warning" },
    { label: t("panel.brickDetails.summaryDependencies"), tone: hasDependencyIssue ? "warning" : "ready" },
    { label: t("panel.brickDetails.summaryResources"), tone: hasResourceIssue ? "warning" : "ready" },
    { label: t("panel.brickDetails.summaryAbility"), tone: hasAbilityIssue ? "blocked" : "ready" },
    { label: t("panel.brickDetails.summaryComposite"), tone: hasCompositeIssue ? "blocked" : "ready" },
    { label: t("panel.brickDetails.summaryCompat"), tone: hasCompatIssue ? "blocked" : "ready" },
  ];
};

export const buildRecipePackageState = (
  sceneNodes: CanvasNode[],
  catalog: BrickCatalogEntry[],
  imported: BrickCatalogEntry[],
  locked: boolean,
  equippedAbilities: string[],
): Pick<EditorRecipeV0, "lockfile" | "package_lock"> => {
  const referencedBrickIds = new Set(sceneNodes.map((node) => node.type));
  const referencedAbilityIds = new Set([...sceneNodes.flatMap((node) => node.meta?.grantedAbilityPackageIds ?? []), ...equippedAbilities]);
  const referencedEntries = catalog.filter((entry) => referencedBrickIds.has(entry.id) || referencedAbilityIds.has(entry.packageId) || referencedAbilityIds.has(entry.id));
  const packageEntries = [...referencedEntries, ...imported.filter((entry) => !referencedBrickIds.has(entry.id))];
  const uniquePackages = packageEntries.reduce<Map<string, BrickCatalogEntry>>((acc, entry) => {
    if (!acc.has(entry.packageId)) acc.set(entry.packageId, entry);
    return acc;
  }, new Map());
  return {
    lockfile: { packages: [...uniquePackages.values()].map((entry) => ({ id: entry.packageId, version: entry.version, hash: locked ? `sha256-${entry.packageId.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${entry.version}` : "" })) },
    package_lock: { packages: [...uniquePackages.values()].reduce<Record<string, string>>((acc, entry) => ({ ...acc, [entry.packageId]: entry.version }), { editor: EDITOR_ENGINE_VERSION }) },
  };
};

export { DEFAULT_ACTOR_TYPE, DEFAULT_TRIGGER_DISTANCE };
