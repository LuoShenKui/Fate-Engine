import { CAPABILITY_ORDER } from "./capability-map";
import { serializeComposeAssetRegistry, serializeComposeCatalogSnapshot } from "./catalog-snapshot";
import type {
  ComposeAuditRecord,
  ComposeBindingSummaryItem,
  ComposePlan,
  ComposeRecipeDraft,
  ComposerAssetItem,
  ComposerCatalogEntry,
} from "./types";

const NODE_POSITIONS: Record<string, [number, number, number]> = {
  "actor.humanoid": [0, 0, 0],
  "ability.locomotion": [0, 0, 2.1],
  "interaction.openable_door": [3, 0, 0],
  "interaction.locked_door": [4.5, 0, 0],
  "interaction.key_pickup": [2, 0, -1.5],
  "interaction.button": [-2, 0, 1],
  "interaction.lever": [-2.5, 0, -1],
  "interaction.pressure_plate": [-1.5, 0, 2.5],
  "interaction.ladder": [5, 0, 0],
  "interaction.pickup": [2, 0, 2],
  "interaction.throw": [2.8, 0, 2],
  "interaction.chest": [6, 0, -1.5],
  "interaction.dialog_trigger": [-3, 0, 0],
  "interaction.quest_trigger": [-4.5, 0, 0],
  "interaction.checkpoint": [8, 0, -2],
  "interaction.teleport": [9.5, 0, 0],
  "interaction.trigger_zone": [0, 0, 4],
  "interaction.damage_zone": [3, 0, 4],
  "interaction.heal_zone": [6, 0, 4],
  "interaction.item_drop": [7, 0, -3],
  "interaction.inventory_grant": [8.5, 0, -3],
  "interaction.socket_attach": [1.5, 0, 3.5],
  "interaction.destructible_prop": [4.5, 0, 3.5],
  "enemy.patrol": [10, 0, 2],
  "enemy.guard": [11.5, 0, 0],
  "enemy.melee_attack": [13, 0, 1],
  "enemy.ranged_attack": [13, 0, -1],
  "enemy.spawner": [10, 0, 4],
  "enemy.aggro_sensor": [11.5, 0, 4],
  "loot.drop_table": [9.5, 0, -4.5],
  "loot.pickup_reward": [11, 0, -4.5],
};

const getNodePosition = (capabilityId: string, index: number): [number, number, number] =>
  NODE_POSITIONS[capabilityId] ?? [index * 1.8, 0, (index % 4) * 1.6];

export const buildComposeAudit = (plan: ComposePlan, catalogEntries: ComposerCatalogEntry[]): ComposeAuditRecord[] => {
  const catalogByBrickId = new Map(catalogEntries.map((entry) => [entry.id, entry] as const));
  return plan.nodes.map((node) => {
    const entry = catalogByBrickId.get(node.brickId);
    return {
      package_id: node.packageId,
      version: node.version,
      license: entry?.license ?? "Unknown",
      reason: node.capabilityId,
      notes: entry?.notes ?? entry?.summary ?? "",
      alternatives: [],
    };
  });
};

export const assembleComposeRecipeDraft = (
  prompt: string,
  plan: ComposePlan,
  bindingSummary: ComposeBindingSummaryItem[],
  audit: ComposeAuditRecord[],
  catalogEntries: ComposerCatalogEntry[],
  assetItems: ComposerAssetItem[],
): ComposeRecipeDraft => {
  const nodes = CAPABILITY_ORDER.filter((capabilityId) => plan.nodes.some((node) => node.capabilityId === capabilityId))
    .map((capabilityId) => plan.nodes.find((node) => node.capabilityId === capabilityId)!)
    .map((node) => ({
      id: node.nodeId,
      type: node.brickId,
      brickId: node.packageId,
      transform: {
        position: getNodePosition(node.capabilityId, plan.nodes.indexOf(node)),
        rotation: [0, 0, 0] as [number, number, number],
      },
    }));

  const edges = nodes.slice(1).map((node, index) => ({
    from: nodes[index]!.id,
    to: node.id,
  }));

  return {
    version: "0",
    nodes,
    edges,
    params: {
      selected_brick: nodes[0]?.type ?? "humanoid-actor",
      fields: [],
      locked: false,
      authoring_host: "unity",
      runtime_stack: "dots-ecs",
      unit_system: "metric",
      compose_prompt: prompt,
      compose_intent: plan.nodes.map((node) => node.capabilityId),
      compose_binding_summary: bindingSummary,
      whitebox_audit: audit,
      catalog_snapshot: serializeComposeCatalogSnapshot(catalogEntries),
      asset_registry: serializeComposeAssetRegistry(assetItems),
    },
    slot_bindings: Object.fromEntries(
      bindingSummary
        .filter((binding) => binding.assetRef.length > 0)
        .map((binding) => [binding.slotId, binding.assetRef]),
    ),
    seed: 424242,
    lockfile: {
      packages: plan.nodes.map((node) => ({
        id: node.packageId,
        version: node.version,
        hash: `sha256:${node.packageId}@${node.version}`,
      })),
    },
    package_lock: {
      packages: plan.nodes.reduce<Record<string, string>>((acc, node) => {
        acc[node.packageId] = node.version;
        return acc;
      }, { editor: "0.1.0" }),
    },
    suppress: [],
  };
};
