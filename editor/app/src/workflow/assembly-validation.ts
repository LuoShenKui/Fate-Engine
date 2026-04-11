import type { EditorRecipeV0 } from "../project/recipe";
import type { BatchValidationIssue, ValidationRule } from "./validation-types";

type SnapshotSlot = {
  slotId: string;
  optional: boolean;
  slotType?: string;
  fallbackAssetRef?: string;
};

type SnapshotBinding = {
  slotId: string;
  resourceType: string;
  assetPackageId: string;
  resourceId: string;
};

type SnapshotEntry = {
  id: string;
  packageId: string;
  slots: SnapshotSlot[];
  defaultAssetBindings: SnapshotBinding[];
  composeHints?: {
    requiredCapabilities?: string[];
    spaceHints?: {
      footprintMeters?: [number, number, number];
      interactionDistanceMeters?: number;
    };
    constraintHints?: {
      requiredActorClass?: string;
      conflictsWith?: string[];
    };
  };
};

type SnapshotAsset = {
  packageId: string;
  resourceId: string;
  resourceType: string;
};

type SnapshotNode = {
  nodeId: string;
  type: string;
  position: [number, number, number] | null;
  entry?: SnapshotEntry;
};

const asRecord = (value: unknown): Record<string, unknown> => (typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {});
const asString = (value: unknown): string => (typeof value === "string" ? value : "");
const asNumber = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);

const inferSlotType = (slot: SnapshotSlot, binding?: SnapshotBinding): string => {
  if (typeof slot.slotType === "string" && slot.slotType.length > 0) return slot.slotType;
  if (typeof binding?.resourceType === "string" && binding.resourceType.length > 0) return binding.resourceType;
  const prefix = slot.slotId.split(".")[0];
  return prefix === "mesh" || prefix === "material" || prefix === "anim" || prefix === "prefab" || prefix === "audio" || prefix === "vfx" || prefix === "volume"
    ? prefix
    : slot.slotId.startsWith("socket.") || slot.slotId.startsWith("ui.") || slot.slotId.startsWith("input.") || slot.slotId.startsWith("data.")
      ? "script_ref"
      : "unknown";
};

const parseCatalogSnapshot = (recipe: EditorRecipeV0): SnapshotEntry[] => {
  const snapshot = Array.isArray(recipe.params.catalog_snapshot) ? recipe.params.catalog_snapshot : [];
  return snapshot.map((item) => {
    const record = asRecord(item);
    const composeHints = asRecord(record.composeHints);
    const spaceHints = asRecord(composeHints.spaceHints);
    const constraintHints = asRecord(composeHints.constraintHints);
    return {
      id: asString(record.id),
      packageId: asString(record.packageId),
      slots: Array.isArray(record.slots)
        ? record.slots.map((slot) => {
            const slotRecord = asRecord(slot);
            return {
              slotId: asString(slotRecord.slotId),
              optional: slotRecord.optional === true,
              slotType: asString(slotRecord.slotType),
              fallbackAssetRef: asString(slotRecord.fallbackAssetRef),
            };
          })
        : [],
      defaultAssetBindings: Array.isArray(record.defaultAssetBindings)
        ? record.defaultAssetBindings.map((binding) => {
            const bindingRecord = asRecord(binding);
            return {
              slotId: asString(bindingRecord.slotId),
              resourceType: asString(bindingRecord.resourceType),
              assetPackageId: asString(bindingRecord.assetPackageId),
              resourceId: asString(bindingRecord.resourceId),
            };
          })
        : [],
      composeHints: {
        requiredCapabilities: Array.isArray(composeHints.requiredCapabilities)
          ? composeHints.requiredCapabilities.filter((candidate): candidate is string => typeof candidate === "string")
          : [],
        spaceHints: {
          footprintMeters: Array.isArray(spaceHints.footprintMeters)
            ? [
                asNumber(spaceHints.footprintMeters[0]) ?? 0,
                asNumber(spaceHints.footprintMeters[1]) ?? 0,
                asNumber(spaceHints.footprintMeters[2]) ?? 0,
              ]
            : undefined,
          interactionDistanceMeters: asNumber(spaceHints.interactionDistanceMeters) ?? undefined,
        },
        constraintHints: {
          requiredActorClass: asString(constraintHints.requiredActorClass),
          conflictsWith: Array.isArray(constraintHints.conflictsWith)
            ? constraintHints.conflictsWith.filter((candidate): candidate is string => typeof candidate === "string")
            : [],
        },
      },
    };
  });
};

const parseAssetRegistry = (recipe: EditorRecipeV0): SnapshotAsset[] => {
  const assets = Array.isArray(recipe.params.asset_registry) ? recipe.params.asset_registry : [];
  return assets.map((item) => {
    const record = asRecord(item);
    return {
      packageId: asString(record.packageId),
      resourceId: asString(record.resourceId),
      resourceType: asString(record.resourceType),
    };
  });
};

const parseNodes = (recipe: EditorRecipeV0, entries: SnapshotEntry[]): SnapshotNode[] => {
  const entryById = new Map(entries.map((entry) => [entry.id, entry] as const));
  return recipe.nodes.map((node, index) => {
    const record = asRecord(node);
    const transform = asRecord(record.transform);
    const position = Array.isArray(transform.position) ? transform.position : [];
    const x = asNumber(position[0]);
    const y = asNumber(position[1]);
    const z = asNumber(position[2]);
    const type = asString(record.type);
    return {
      nodeId: asString(record.id) || `node-${index}`,
      type,
      position: x === null || y === null || z === null ? null : [x, y, z],
      entry: entryById.get(type),
    };
  });
};

const overlapsAabb = (leftPos: [number, number, number], leftSize: [number, number, number], rightPos: [number, number, number], rightSize: [number, number, number]): boolean =>
  Math.abs(leftPos[0] - rightPos[0]) < (leftSize[0] + rightSize[0]) / 2 &&
  Math.abs(leftPos[1] - rightPos[1]) < (leftSize[1] + rightSize[1]) / 2 &&
  Math.abs(leftPos[2] - rightPos[2]) < (leftSize[2] + rightSize[2]) / 2;

const distanceBetween = (left: [number, number, number], right: [number, number, number]): number => {
  const dx = left[0] - right[0];
  const dy = left[1] - right[1];
  const dz = left[2] - right[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

const assetBindingRule: ValidationRule = {
  id: "assembly.asset",
  run: (recipe) => {
    const entries = parseCatalogSnapshot(recipe);
    const nodes = parseNodes(recipe, entries);
    const assets = parseAssetRegistry(recipe);
    const issues: BatchValidationIssue[] = [];

    for (const node of nodes) {
      if (node.entry === undefined) continue;
      for (const slot of node.entry.slots) {
        const defaultBinding = node.entry.defaultAssetBindings.find((binding) => binding.slotId === slot.slotId);
        if (defaultBinding === undefined) continue;
        const formalAsset = assets.find((asset) => asset.packageId === defaultBinding.assetPackageId && asset.resourceId === defaultBinding.resourceId);
        if (formalAsset === undefined) {
          issues.push({
            level: "Error",
            ruleId: "asset.binding.missing_formal",
            target: { type: "node", nodeId: node.nodeId },
            evidence: `${defaultBinding.assetPackageId}/${defaultBinding.resourceId}`,
            suggestion: "补齐 formal 资源或修正 default_asset_bindings。",
            message: `Formal 资源缺失: ${node.type}/${slot.slotId}`,
          });
          continue;
        }
        const expectedSlotType = inferSlotType(slot, defaultBinding);
        if (formalAsset.resourceType !== defaultBinding.resourceType || (expectedSlotType !== "unknown" && formalAsset.resourceType !== expectedSlotType)) {
          issues.push({
            level: "Error",
            ruleId: "asset.binding.slot_mismatch",
            target: { type: "node", nodeId: node.nodeId },
            evidence: `${slot.slotId}: expected ${expectedSlotType}, got ${formalAsset.resourceType}`,
            suggestion: "修正 slot_type、default_asset_bindings 或 asset resource_type。",
            message: `Slot 类型不匹配: ${node.type}/${slot.slotId}`,
          });
        }
      }
    }
    return issues;
  },
};

const capabilityConstraintRule: ValidationRule = {
  id: "assembly.capability",
  run: (recipe) => {
    const entries = parseCatalogSnapshot(recipe);
    const nodes = parseNodes(recipe, entries);
    const graphCapabilities = new Set<string>();
    const actorClasses = new Set<string>();
    for (const node of nodes) {
      const capabilities = node.entry?.composeHints?.requiredCapabilities ?? [];
      capabilities.forEach((capability) => graphCapabilities.add(capability));
      const actorClass = node.entry?.composeHints?.constraintHints?.requiredActorClass;
      if (capabilities.some((capability) => capability.startsWith("actor.")) && typeof actorClass === "string" && actorClass.length > 0) {
        actorClasses.add(actorClass);
      }
    }
    const issues: BatchValidationIssue[] = [];
    for (const node of nodes) {
      if (node.entry === undefined) continue;
      const requiredCapabilities = node.entry.composeHints?.requiredCapabilities ?? [];
      const conflictsWith = node.entry.composeHints?.constraintHints?.conflictsWith ?? [];
      const requiredActorClass = node.entry.composeHints?.constraintHints?.requiredActorClass ?? "";
      for (const capability of requiredCapabilities) {
        if (!graphCapabilities.has(capability)) {
          issues.push({
            level: "Error",
            ruleId: "capability.required_missing",
            target: { type: "node", nodeId: node.nodeId },
            evidence: capability,
            suggestion: "把对应 capability 节点加入当前图。",
            message: `缺少必需 capability: ${node.type} -> ${capability}`,
          });
        }
      }
      for (const capability of conflictsWith) {
        if (graphCapabilities.has(capability)) {
          issues.push({
            level: "Error",
            ruleId: "capability.conflict",
            target: { type: "node", nodeId: node.nodeId },
            evidence: capability,
            suggestion: "移除冲突 capability 或更换积木。",
            message: `命中 capability 冲突: ${node.type} x ${capability}`,
          });
        }
      }
      if (requiredActorClass !== "" && requiredActorClass !== "generic" && !actorClasses.has(requiredActorClass)) {
        issues.push({
          level: "Error",
          ruleId: "actor.class_mismatch",
          target: { type: "node", nodeId: node.nodeId },
          evidence: requiredActorClass,
          suggestion: "加入兼容 actor 节点，或调整 required_actor_class。",
          message: `Actor class 不满足: ${node.type} 需要 ${requiredActorClass}`,
        });
      }
    }
    return issues;
  },
};

const spaceConstraintRule: ValidationRule = {
  id: "assembly.space",
  run: (recipe) => {
    const entries = parseCatalogSnapshot(recipe);
    const nodes = parseNodes(recipe, entries);
    const issues: BatchValidationIssue[] = [];

    for (const node of nodes) {
      const footprint = node.entry?.composeHints?.spaceHints?.footprintMeters;
      if (node.position === null || footprint === undefined || footprint.some((value) => value <= 0)) {
        issues.push({
          level: "Error",
          ruleId: "space.installation_missing",
          target: { type: "node", nodeId: node.nodeId },
          evidence: node.position === null ? "missing_position" : "invalid_footprint",
          suggestion: "补齐 transform.position 和有效 footprintMeters。",
          message: `缺少可安装空间数据: ${node.type}`,
        });
      }
    }

    for (let index = 0; index < nodes.length; index += 1) {
      const left = nodes[index]!;
      const leftFootprint = left.entry?.composeHints?.spaceHints?.footprintMeters;
      if (left.position === null || leftFootprint === undefined) continue;
      for (let inner = index + 1; inner < nodes.length; inner += 1) {
        const right = nodes[inner]!;
        const rightFootprint = right.entry?.composeHints?.spaceHints?.footprintMeters;
        if (right.position === null || rightFootprint === undefined) continue;
        if (overlapsAabb(left.position, leftFootprint, right.position, rightFootprint)) {
          issues.push({
            level: "Error",
            ruleId: "space.footprint_conflict",
            target: { type: "node", nodeId: right.nodeId },
            evidence: `${left.nodeId}<->${right.nodeId}`,
            suggestion: "拉开节点距离或缩小 footprintMeters。",
            message: `节点占位冲突: ${left.type} 与 ${right.type}`,
          });
        }
      }
    }

    const byCapability = new Map<string, SnapshotNode>();
    nodes.forEach((node) => {
      node.entry?.composeHints?.requiredCapabilities?.forEach((capability) => {
        if (!byCapability.has(capability)) byCapability.set(capability, node);
      });
    });

    const pairRules: Array<[string, string]> = [
      ["interaction.key_pickup", "interaction.locked_door"],
      ["interaction.pickup", "interaction.throw"],
      ["enemy.patrol", "enemy.melee_attack"],
      ["enemy.patrol", "enemy.ranged_attack"],
    ];

    for (const [leftCapability, rightCapability] of pairRules) {
      const left = byCapability.get(leftCapability);
      const right = byCapability.get(rightCapability);
      if (left?.position === null || left?.position === undefined || right?.position === null || right?.position === undefined) continue;
      const maxDistance = Math.max(left.entry?.composeHints?.spaceHints?.interactionDistanceMeters ?? 0, right.entry?.composeHints?.spaceHints?.interactionDistanceMeters ?? 0);
      if (maxDistance > 0 && distanceBetween(left.position, right.position) > maxDistance) {
        issues.push({
          level: "Error",
          ruleId: "space.footprint_conflict",
          target: { type: "node", nodeId: right.nodeId },
          evidence: `${leftCapability}<->${rightCapability}`,
          suggestion: "将相关节点移动到可达交互距离内。",
          message: `交互距离不可达: ${left.type} 与 ${right.type}`,
        });
      }
    }

    return issues;
  },
};

export const runAssemblyValidationRules = (recipe: EditorRecipeV0): BatchValidationIssue[] => [
  ...assetBindingRule.run(recipe),
  ...capabilityConstraintRule.run(recipe),
  ...spaceConstraintRule.run(recipe),
];

export const assemblyValidationRules: ValidationRule[] = [
  { id: "assembly.asset", run: (recipe) => assetBindingRule.run(recipe) },
  { id: "assembly.capability", run: (recipe) => capabilityConstraintRule.run(recipe) },
  { id: "assembly.space", run: (recipe) => spaceConstraintRule.run(recipe) },
];
