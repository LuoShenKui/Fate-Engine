import type { DoorBrickEvent } from "../domain/door";
import { LadderRuntimeAdapter, SwitchRuntimeAdapter, TriggerZoneRuntimeAdapter } from "../domain/door";
import { DoorSceneComponent } from "../runtime/doorScene";
import { DEFAULT_ACTOR_TYPE } from "./app-constants";
import type { AbilityGrantState, BrickCatalogEntry, RuntimeEventItem } from "./app-types";
import type { CanvasNode } from "./GraphCanvasPanel";

type Setter<T> = (value: T | ((prev: T) => T)) => void;

export const getSceneDoorRuntime = (sceneDoorMap: Map<string, DoorSceneComponent>, entityId: string): DoorSceneComponent => {
  const cached = sceneDoorMap.get(entityId);
  if (cached !== undefined) return cached;
  const created = new DoorSceneComponent(entityId);
  sceneDoorMap.set(entityId, created);
  return created;
};

export const getTriggerZoneRuntime = (runtimeMap: Map<string, TriggerZoneRuntimeAdapter>, entityId: string): TriggerZoneRuntimeAdapter => {
  const cached = runtimeMap.get(entityId);
  if (cached !== undefined) return cached;
  const created = new TriggerZoneRuntimeAdapter();
  runtimeMap.set(entityId, created);
  return created;
};

export const getSwitchRuntime = (runtimeMap: Map<string, SwitchRuntimeAdapter>, entityId: string): SwitchRuntimeAdapter => {
  const cached = runtimeMap.get(entityId);
  if (cached !== undefined) return cached;
  const created = new SwitchRuntimeAdapter();
  runtimeMap.set(entityId, created);
  return created;
};

export const getLadderRuntime = (runtimeMap: Map<string, LadderRuntimeAdapter>, entityId: string): LadderRuntimeAdapter => {
  const cached = runtimeMap.get(entityId);
  if (cached !== undefined) return cached;
  const created = new LadderRuntimeAdapter();
  runtimeMap.set(entityId, created);
  return created;
};

const resolveGrantedAbilityPackageIds = (sourceNodeId: string, nodes: CanvasNode[], catalogEntries: BrickCatalogEntry[]): string[] => {
  const node = nodes.find((candidate) => candidate.id === sourceNodeId);
  if (node?.meta?.grantedAbilityPackageIds !== undefined && node.meta.grantedAbilityPackageIds.length > 0) {
    return node.meta.grantedAbilityPackageIds;
  }
  const nodeType = node?.type;
  if (nodeType === undefined) return [];
  return catalogEntries.find((entry) => entry.id === nodeType)?.grantedAbilityPackageIds ?? [];
};

const getEntryByPackageOrId = (catalogEntries: BrickCatalogEntry[], packageIdOrBrickId: string): BrickCatalogEntry | undefined =>
  catalogEntries.find((entry) => entry.packageId === packageIdOrBrickId || entry.id === packageIdOrBrickId);

export const syncGrantedAbilitiesForSource = ({
  sourceNodeId,
  occupied,
  nodes,
  catalogEntries,
  setEvents,
  setGrantedAbilities,
}: {
  sourceNodeId: string;
  occupied: boolean;
  nodes: CanvasNode[];
  catalogEntries: BrickCatalogEntry[];
  setEvents: Setter<RuntimeEventItem[]>;
  setGrantedAbilities: Setter<AbilityGrantState[]>;
}): void => {
  const packageIds = resolveGrantedAbilityPackageIds(sourceNodeId, nodes, catalogEntries);
  if (packageIds.length === 0) return;

  if (occupied) {
    const nextGrants = packageIds.flatMap<AbilityGrantState>((packageId) => {
      const abilityEntry = getEntryByPackageOrId(catalogEntries, packageId);
      if (abilityEntry === undefined) {
        setEvents((prev) => [...prev, { source: "ability", text: `[ability] source=${sourceNodeId} package=${packageId} result=blocked reason=missing_package` }]);
        return [];
      }
      if (abilityEntry.category !== "ability") {
        setEvents((prev) => [...prev, { source: "ability", text: `[ability] source=${sourceNodeId} package=${packageId} result=blocked reason=not_ability_package` }]);
        return [];
      }
      if (abilityEntry.supportedActorTypes.length > 0 && !abilityEntry.supportedActorTypes.includes(DEFAULT_ACTOR_TYPE)) {
        setEvents((prev) => [...prev, { source: "ability", text: `[ability] source=${sourceNodeId} package=${packageId} result=blocked reason=actor_incompatible actor_type=${DEFAULT_ACTOR_TYPE}` }]);
        return [];
      }
      setEvents((prev) => [...prev, { source: "ability", text: `[ability] source=${sourceNodeId} package=${packageId} result=granted actor_type=${DEFAULT_ACTOR_TYPE}` }]);
      return [{ packageId, brickId: abilityEntry.id, sourceNodeId }];
    });

    if (nextGrants.length === 0) return;
    setGrantedAbilities((prev) => {
      const filtered = prev.filter((grant) => !nextGrants.some((candidate) => candidate.packageId === grant.packageId && candidate.sourceNodeId === grant.sourceNodeId));
      return [...filtered, ...nextGrants];
    });
    return;
  }

  setGrantedAbilities((prev) => {
    const revoked = prev.filter((grant) => grant.sourceNodeId === sourceNodeId && packageIds.includes(grant.packageId));
    revoked.forEach((grant) => {
      setEvents((eventPrev) => [...eventPrev, { source: "ability", text: `[ability] source=${sourceNodeId} package=${grant.packageId} result=revoked actor_type=${DEFAULT_ACTOR_TYPE}` }]);
    });
    return prev.filter((grant) => !(grant.sourceNodeId === sourceNodeId && packageIds.includes(grant.packageId)));
  });
};
