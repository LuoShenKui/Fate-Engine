import { createDefaultEditorDemoRecipe } from "../project/recipe";
import type { CanvasEdge, CanvasNode } from "./GraphCanvasPanel";

export const BUILTIN_SCENE_CATEGORY = "scene-interaction";
export const SCENE_LAYOUT_COLUMNS = 4;
export const IMPORTED_BRICKS_STORAGE_KEY = "fate-engine.editor.imported-bricks.v0";
export const IMPORTED_BRICK_HISTORY_STORAGE_KEY = "fate-engine.editor.imported-brick-history.v0";
export const COMPOSER_HISTORY_STORAGE_KEY = "fate-engine.editor.compose-history.v0";
export const RECENT_BRICKS_LIMIT = 8;
export const EDITOR_ENGINE_VERSION = "0.1.0";
export const DEFAULT_ACTOR_TYPE = "humanoid";
export const DEFAULT_RECOMMENDED_BRICK_IDS = [
  "humanoid-actor",
  "locomotion-ability",
  "pickup-interaction",
  "throw-interaction",
  "door",
  "switch",
  "trigger-zone",
  "ladder",
  "small-house",
  "warehouse-zone",
  "basketball-court",
  "basketball-ability",
  "patrol-guard",
];
export const DEFAULT_TRIGGER_DISTANCE = 1.5;

const defaultRecipeValue = createDefaultEditorDemoRecipe();

export const defaultRecipe = defaultRecipeValue;
export const defaultNodes = defaultRecipeValue.nodes as CanvasNode[];
export const defaultEdges = defaultRecipeValue.edges as CanvasEdge[];
