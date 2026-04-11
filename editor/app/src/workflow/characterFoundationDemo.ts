import type { EditorRecipeV0 } from "../project/recipe";
import type { CanvasNode, CanvasEdge } from "../ui/GraphCanvasPanel";

export const CHARACTER_FOUNDATION_TEMPLATE_ID = "character_foundation_v0";
export const CHARACTER_FOUNDATION_SAMPLE_ID = `template:${CHARACTER_FOUNDATION_TEMPLATE_ID}`;

const nodes: CanvasNode[] = [
  { id: "actor-1", type: "humanoid-actor", transform: { position: [0, 0, 0], rotation: [0, 0, 0] } },
  { id: "locomotion-1", type: "locomotion-ability", transform: { position: [0, 0, 1.5], rotation: [0, 0, 0] } },
  { id: "ladder-1", type: "ladder", transform: { position: [5, 0, 0], rotation: [0, 0, 0] } },
  { id: "pickup-1", type: "pickup-interaction", transform: { position: [2, 0, 2], rotation: [0, 0, 0] } },
  { id: "throw-1", type: "throw-interaction", transform: { position: [7, 0, 2], rotation: [0, 0, 0] } },
];

const edges: CanvasEdge[] = [];

export const createCharacterFoundationTemplateNodes = (): CanvasNode[] =>
  nodes.map((node) => ({
    ...node,
    transform: {
      position: [...(node.transform?.position ?? [0, 0, 0])] as [number, number, number],
      rotation: [...(node.transform?.rotation ?? [0, 0, 0])] as [number, number, number],
    },
  }));

export const createCharacterFoundationTemplateEdges = (): CanvasEdge[] => edges.map((edge) => ({ ...edge }));

export const createCharacterFoundationDemoRecipe = (): EditorRecipeV0 => ({
  version: "0",
  nodes: createCharacterFoundationTemplateNodes().map((node) => ({
    ...node,
    brickId:
      node.type === "humanoid-actor" ? "fate.actor.humanoid" :
      node.type === "locomotion-ability" ? "fate.ability.locomotion" :
      node.type === "ladder" ? "fate.ladder.basic" :
      node.type === "pickup-interaction" ? "fate.interaction.pickup" :
      node.type === "throw-interaction" ? "fate.interaction.throw" :
      node.type,
  })),
  edges: createCharacterFoundationTemplateEdges(),
  params: {
    selected_brick: "humanoid-actor",
    fields: [],
    brick_fields: {},
    locked: false,
    authoring_host: "unity",
    runtime_stack: "dots-ecs",
    unit_system: "metric",
    world_schema: {
      terrain_mode: "validation-room",
      terrain_extent_meters: 24,
    },
    whitebox_audit: [],
  },
  slot_bindings: {
    "mesh.humanoid": "assetpkg://fate.assets.humanoid.foundation/humanoid_mesh_main",
    "anim.controller": "builtin:unity.humanoid.controller",
    "anim.locomotion": "assetpkg://fate.assets.humanoid.foundation/humanoid_locomotion_animset",
    "input.map": "builtin:unity.input.third_person",
    "mesh.primary": "assetpkg://fate.assets.ladder.foundation/ladder_mesh_primary",
    "anim.ladder": "assetpkg://fate.assets.ladder.foundation/ladder_climb_anim",
    "audio.ladder": "assetpkg://fate.assets.ladder.foundation/ladder_rattle_audio",
    "fx.ladder": "assetpkg://fate.assets.ladder.foundation/ladder_dust_vfx",
    "socket.hand": "assetpkg://fate.assets.interaction.props/pickup_socket_binding",
    "fx.pickup": "assetpkg://fate.assets.interaction.props/pickup_highlight_vfx",
    "fx.throw": "assetpkg://fate.assets.interaction.props/throw_release_vfx",
    "audio.throw": "assetpkg://fate.assets.interaction.props/throw_release_audio",
  },
  seed: 424242,
  lockfile: {
    packages: [
      { id: "fate.actor.humanoid", version: "0.1.0", hash: "sha256:actor-demo-placeholder" },
      { id: "fate.ability.locomotion", version: "0.1.0", hash: "sha256:locomotion-demo-placeholder" },
      { id: "fate.ladder.basic", version: "0.1.0", hash: "sha256:ladder-demo-placeholder" },
      { id: "fate.interaction.pickup", version: "0.1.0", hash: "sha256:pickup-demo-placeholder" },
      { id: "fate.interaction.throw", version: "0.1.0", hash: "sha256:throw-demo-placeholder" },
      { id: "fate.assets.humanoid.foundation", version: "0.1.0", hash: "sha256:humanoid-assets-demo" },
      { id: "fate.assets.interaction.props", version: "0.1.0", hash: "sha256:interaction-assets-demo" },
      { id: "fate.assets.ladder.foundation", version: "0.1.0", hash: "sha256:ladder-assets-demo" },
    ],
  },
  package_lock: {
    packages: {
      editor: "0.1.0",
      "fate.actor.humanoid": "0.1.0",
      "fate.ability.locomotion": "0.1.0",
      "fate.ladder.basic": "0.1.0",
      "fate.interaction.pickup": "0.1.0",
      "fate.interaction.throw": "0.1.0",
    },
  },
  suppress: [],
});
