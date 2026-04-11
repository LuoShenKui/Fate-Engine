import test from "node:test";
import assert from "node:assert/strict";

import {
  applyAgentAssemblyPlan,
  composeRecipeWithAgent,
  normalizeAgentAssemblyPlan,
  retrieveAgentContext,
  type AgentAssemblyPlan,
  type AgentRemoteCatalogEntry,
  type ComposerAssetItem,
  type ComposerCatalogEntry,
} from "../../src/composer";
import { runAgentValidationRules } from "../../src/workflow/agent-validation";
import { runAssemblyValidationRules } from "../../src/workflow/assembly-validation";

const catalogEntries: ComposerCatalogEntry[] = [
  {
    id: "humanoid-actor",
    name: "Humanoid Actor",
    packageId: "fate.actor.humanoid",
    version: "0.1.0",
    packageKind: "product",
    installState: "ready",
    summary: "Actor",
    slots: [{ slotId: "mesh.humanoid", label: "Humanoid Mesh", optional: false, fallbackAssetRef: "builtin:mesh.humanoid" }],
    defaultAssetBindings: [],
    assetDependencies: [],
    composeHints: {
      intentAliases: ["character", "角色"],
      requiredCapabilities: ["actor.humanoid"],
      requiredSlots: ["mesh.humanoid"],
      spaceHints: { footprintMeters: [0.8, 0.8, 1.8], interactionDistanceMeters: 1.6, facing: "forward" },
      stateHints: ["spawned", "ready"],
      constraintHints: { requiredActorClass: "humanoid", conflictsWith: [] },
    },
  },
  {
    id: "locomotion-ability",
    name: "Locomotion Ability",
    packageId: "fate.ability.locomotion",
    version: "0.1.0",
    packageKind: "product",
    installState: "ready",
    summary: "Walk run jump",
    slots: [{ slotId: "anim.locomotion", label: "Locomotion", optional: false, fallbackAssetRef: "builtin:anim.locomotion" }],
    defaultAssetBindings: [],
    assetDependencies: [],
    composeHints: {
      intentAliases: ["walk", "run", "jump"],
      requiredCapabilities: ["ability.locomotion"],
      requiredSlots: ["anim.locomotion"],
      spaceHints: { footprintMeters: [0.8, 0.8, 1.8], interactionDistanceMeters: 1.6, facing: "forward" },
      stateHints: ["idle", "walk", "run"],
      constraintHints: { requiredActorClass: "humanoid", conflictsWith: [] },
    },
  },
];

const assetItems: ComposerAssetItem[] = [];

test("normalizeAgentAssemblyPlan rejects malformed model output", () => {
  const normalized = normalizeAgentAssemblyPlan({
    goal: "character foundation",
    nodes: [{ node_id: "actor-1" }],
  });

  assert.equal(normalized.plan, null);
  assert.equal(normalized.diagnostics[0]?.code, "constraint_violation");
});

test("applyAgentAssemblyPlan creates placeholder nodes for missing packages and records gap report", () => {
  const plan: AgentAssemblyPlan = {
    sessionId: "agent-session-1",
    goal: "character foundation with enemy patrol",
    reasoningSummary: "Need player setup plus an enemy package that is not installed locally.",
    sources: [
      {
        title: "Remote Patrol Enemy Package",
        url: "https://packages.example.com/patrol-enemy",
        retrievedAt: "2026-04-01T00:00:00.000Z",
        usedFor: "enemy patrol recommendation",
        packageId: "fate.enemy.patrol",
      },
    ],
    nodes: [
      {
        nodeId: "actor-1",
        packageId: "fate.actor.humanoid",
        brickId: "humanoid-actor",
        capabilityId: "actor.humanoid",
        confidence: 0.96,
      },
      {
        nodeId: "enemy-1",
        packageId: "fate.enemy.patrol",
        brickId: "enemy-patrol",
        capabilityId: "missing.protocol.capability",
        confidence: 0.52,
      },
    ],
    edges: [{ from: "actor-1", to: "enemy-1", reason: "combat encounter" }],
    paramSuggestions: [],
    bindingSuggestions: [],
    gapReport: [
      {
        type: "missing_brick",
        packageId: "fate.enemy.patrol",
        capabilityId: "missing.protocol.capability",
        message: "Enemy patrol brick is not installed locally.",
      },
    ],
  };

  const applied = applyAgentAssemblyPlan({
    prompt: "做一个角色和巡逻敌人",
    plan,
    catalogEntries,
    assetItems,
    currentRecipe: {
      version: "0",
      nodes: [],
      edges: [],
      params: { authoring_host: "unity", runtime_stack: "dots-ecs", unit_system: "metric", whitebox_audit: [] },
      slot_bindings: {},
      seed: 1,
      lockfile: { packages: [] },
      package_lock: { packages: {} },
      suppress: [],
    },
  });

  assert.equal(applied.nextRecipe.nodes.length, 2);
  assert.equal((applied.nextRecipe.nodes[1] as { type: string }).type, "agent-placeholder");
  assert.equal(((applied.nextRecipe.nodes[1] as { meta?: { placeholderKind?: string } }).meta?.placeholderKind), "missing_brick");
  assert.equal(applied.applyReport.placeholderCount, 1);
  assert.equal(applied.applyReport.gapCount, 1);
  assert.equal((applied.nextRecipe.params.agent_gap_report as Array<{ type: string }>)[0]?.type, "missing_brick");
});

test("retrieveAgentContext falls back to local catalog when remote retrieval fails", async () => {
  const remoteCatalog: AgentRemoteCatalogEntry[] = [
    {
      title: "Remote Ladder Pack",
      url: "https://packages.example.com/ladder-pack",
      summary: "Adds climbable ladder bricks.",
      packageId: "fate.remote.ladder",
      capabilityIds: ["interaction.ladder"],
      tags: ["ladder", "climb"],
    },
  ];

  const result = await retrieveAgentContext({
    prompt: "需要角色基础和梯子",
    catalogEntries,
    assetItems,
    remoteCatalogUrl: "https://packages.example.com/catalog.json",
    fetchCatalog: async () => {
      throw new Error("network down");
    },
    fallbackRemoteCatalog: remoteCatalog,
  });

  assert.equal(result.localEntries.length, 2);
  assert.equal(result.remoteSources.length, 1);
  assert.equal(result.remoteSources[0]?.packageId, "fate.remote.ladder");
  assert.equal(result.diagnostics[0]?.code, "missing_package");
});

test("composeRecipeWithAgent returns local nodes plus placeholder gaps for unsupported fragments", async () => {
  const result = await composeRecipeWithAgent({
    prompt: "做一个角色，能走跑跳，还要有巡逻敌人",
    catalogEntries,
    assetItems,
    fallbackRemoteCatalog: [
      {
        title: "Remote Patrol Enemy Package",
        url: "https://packages.example.com/patrol-enemy",
        summary: "Adds enemy patrol behaviors.",
        packageId: "fate.enemy.patrol",
        capabilityIds: ["enemy.patrol"],
        tags: ["enemy", "patrol"],
      },
    ],
  });

  assert.equal(result.plan !== null, true);
  assert.equal(result.plan?.nodes.some((node) => node.packageId === "fate.actor.humanoid"), true);
  assert.equal(result.plan?.gapReport[0]?.type, "missing_brick");
  assert.equal(result.plan?.gapReport[0]?.packageId, "fate.enemy.patrol");
});

test("runAgentValidationRules reports agent placeholder and uninstalled reference issues", () => {
  const issues = runAgentValidationRules({
    version: "0",
    nodes: [
      {
        id: "enemy-gap-1",
        type: "agent-placeholder",
        brickId: "fate.enemy.patrol",
        meta: {
          placeholderKind: "missing_brick",
          missingReason: "Enemy patrol brick is not installed locally.",
          requiredCapability: "enemy.patrol",
          agentSessionId: "agent-session-2",
        },
      },
    ],
    edges: [],
    params: {
      authoring_host: "unity",
      runtime_stack: "dots-ecs",
      unit_system: "metric",
      whitebox_audit: [],
      agent_sources: [{ title: "Remote Patrol Enemy Package", url: "https://packages.example.com/patrol-enemy", usedFor: "candidate-package:fate.enemy.patrol" }],
      agent_gap_report: [{ type: "missing_brick", packageId: "fate.enemy.patrol", capabilityId: "enemy.patrol", message: "Enemy patrol brick is not installed locally." }],
    },
    slot_bindings: {},
    seed: 2,
    lockfile: { packages: [{ id: "fate.enemy.patrol", version: "candidate", hash: "sha256:test" }] },
    package_lock: { packages: { editor: "0.1.0", "fate.enemy.patrol": "candidate" } },
    suppress: [],
  });

  assert.equal(issues.some((issue) => issue.ruleId === "agent.placeholder_present"), true);
  assert.equal(issues.some((issue) => issue.ruleId === "agent.uninstalled_reference"), true);
});

test("runAssemblyValidationRules reports missing formal bindings, actor mismatch, and space conflicts", () => {
  const issues = runAssemblyValidationRules({
    version: "0",
    nodes: [
      {
        id: "locomotion-1",
        type: "locomotion-ability",
        transform: { position: [0, 0, 0], rotation: [0, 0, 0] },
      },
      {
        id: "pickup-1",
        type: "pickup-interaction",
        transform: { position: [1, 0, 0], rotation: [0, 0, 0] },
      },
      {
        id: "throw-1",
        type: "throw-interaction",
        transform: { position: [1.1, 0, 0], rotation: [0, 0, 0] },
      },
    ],
    edges: [],
    params: {
      authoring_host: "unity",
      runtime_stack: "dots-ecs",
      unit_system: "metric",
      whitebox_audit: [],
      catalog_snapshot: [
        {
          id: "locomotion-ability",
          packageId: "fate.ability.locomotion",
          slots: [{ slotId: "anim.locomotion", optional: false, slotType: "anim" }],
          defaultAssetBindings: [{ slotId: "anim.locomotion", resourceType: "anim", assetPackageId: "fate.assets.humanoid.foundation", resourceId: "humanoid_locomotion_animset" }],
          composeHints: {
            requiredCapabilities: ["ability.locomotion"],
            spaceHints: { footprintMeters: [0.8, 0.8, 1.8], interactionDistanceMeters: 1.6 },
            constraintHints: { requiredActorClass: "humanoid", conflictsWith: [] },
          },
        },
        {
          id: "pickup-interaction",
          packageId: "fate.interaction.pickup",
          slots: [{ slotId: "socket.hand", optional: false, slotType: "script_ref" }],
          defaultAssetBindings: [{ slotId: "socket.hand", resourceType: "script_ref", assetPackageId: "fate.assets.interaction.props", resourceId: "pickup_socket_binding" }],
          composeHints: {
            requiredCapabilities: ["interaction.pickup"],
            spaceHints: { footprintMeters: [0.5, 0.5, 0.5], interactionDistanceMeters: 1.25 },
            constraintHints: { requiredActorClass: "humanoid", conflictsWith: [] },
          },
        },
        {
          id: "throw-interaction",
          packageId: "fate.interaction.throw",
          slots: [{ slotId: "fx.throw", optional: true, slotType: "vfx" }],
          defaultAssetBindings: [{ slotId: "fx.throw", resourceType: "vfx", assetPackageId: "fate.assets.interaction.props", resourceId: "throw_release_vfx" }],
          composeHints: {
            requiredCapabilities: ["interaction.throw"],
            spaceHints: { footprintMeters: [0.5, 0.5, 0.5], interactionDistanceMeters: 1.25 },
            constraintHints: { requiredActorClass: "humanoid", conflictsWith: [] },
          },
        },
      ],
      asset_registry: [
        {
          packageId: "fate.assets.interaction.props",
          resourceId: "pickup_socket_binding",
          resourceType: "script_ref",
          assetRef: "assetpkg://fate.assets.interaction.props/pickup_socket_binding",
        },
      ],
    },
    slot_bindings: {},
    seed: 3,
    lockfile: { packages: [] },
    package_lock: { packages: { editor: "0.1.0" } },
    suppress: [],
  });

  assert.equal(issues.some((issue) => issue.ruleId === "asset.binding.missing_formal"), true);
  assert.equal(issues.some((issue) => issue.ruleId === "actor.class_mismatch"), true);
  assert.equal(issues.some((issue) => issue.ruleId === "space.footprint_conflict"), true);
});
