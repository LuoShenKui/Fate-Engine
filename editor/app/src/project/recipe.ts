export type EditorRecipeV0 = {
  version: "0";
  nodes: unknown[];
  edges: unknown[];
  params: Record<string, unknown>;
  slot_bindings: Record<string, string>;
  seed: number;
  lockfile: {
    packages: Array<{
      id: string;
      version: string;
      hash: string;
    }>;
  };
  package_lock: {
    packages: Record<string, string>;
  };
  suppress: Array<{
    ruleId: string;
    target: string;
  }>;
};

import { createDefaultEditorDemoEdges, createDefaultEditorDemoNodes, DEFAULT_EDITOR_DEMO_SEED } from "../workflow/demoScene";

const RECIPE_VERSION = "0";
const DEFAULT_LOCAL_STORAGE_KEY = "fate-engine.editor.recipe.v0";

export const createDefaultEditorDemoRecipe = (): EditorRecipeV0 => ({
  version: RECIPE_VERSION,
  nodes: createDefaultEditorDemoNodes().map((node) => ({
    ...node,
    brickId: node.type === "door" ? "fate.door.basic" : node.type === "trigger-zone" ? "fate.trigger_zone.basic" : "",
  })),
  edges: createDefaultEditorDemoEdges(),
  params: {
    selected_brick: "switch",
    fields: [],
    locked: false,
  },
  slot_bindings: {
    mesh: "asset://mesh/default-door",
  },
  seed: DEFAULT_EDITOR_DEMO_SEED,
  lockfile: {
    packages: [
      {
        id: "fate.door.basic",
        version: "0.1.1",
        hash: "sha256-door-demo-placeholder",
      },
      {
        id: "fate.trigger_zone.basic",
        version: "0.1.0",
        hash: "sha256-trigger-zone-demo-placeholder",
      },
    ],
  },
  package_lock: {
    packages: {
      editor: "0.1.0",
    },
  },
  suppress: [],
});

const ensureObject = (value: unknown): Record<string, unknown> => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const ensureStringMap = (value: unknown): Record<string, string> => {
  const obj = ensureObject(value);
  return Object.entries(obj).reduce<Record<string, string>>((acc, [key, item]) => {
    if (typeof item === "string") {
      acc[key] = item;
    }
    return acc;
  }, {});
};

export const normalizeRecipe = (raw: unknown): EditorRecipeV0 => {
  const obj = ensureObject(raw);
  const packageLock = ensureObject(obj.package_lock);
  const lockfile = ensureObject(obj.lockfile);
  const lockfilePackages = Array.isArray(lockfile.packages)
    ? lockfile.packages
        .map((item) => {
          const pkg = ensureObject(item);
          return {
            id: typeof pkg.id === "string" ? pkg.id : "",
            version: typeof pkg.version === "string" ? pkg.version : "",
            hash: typeof pkg.hash === "string" ? pkg.hash : "",
          };
        })
        .filter((pkg) => pkg.id !== "" || pkg.version !== "" || pkg.hash !== "")
    : [];

  const suppress = Array.isArray(obj.suppress)
    ? obj.suppress
        .map((item) => {
          const suppressItem = ensureObject(item);
          return {
            ruleId: typeof suppressItem.ruleId === "string" ? suppressItem.ruleId : "",
            target: typeof suppressItem.target === "string" ? suppressItem.target : "",
          };
        })
        .filter((item) => item.ruleId !== "" && item.target !== "")
    : [];

  return {
    version: RECIPE_VERSION,
    nodes: Array.isArray(obj.nodes) ? obj.nodes : [],
    edges: Array.isArray(obj.edges) ? obj.edges : [],
    params: ensureObject(obj.params),
    slot_bindings: ensureStringMap(obj.slot_bindings),
    seed: typeof obj.seed === "number" ? obj.seed : Date.now(),
    lockfile: {
      packages: lockfilePackages,
    },
    package_lock: {
      packages: ensureStringMap(packageLock.packages),
    },
    suppress,
  };
};

export const isRecipeLockfileLocked = (recipe: EditorRecipeV0): boolean => {
  if (recipe.lockfile.packages.length === 0) {
    return false;
  }
  return recipe.lockfile.packages.every((pkg) => pkg.id !== "" && pkg.version !== "" && pkg.hash !== "");
};

export const exportRecipe = (recipe: EditorRecipeV0): string => {
  return JSON.stringify(recipe, null, 2);
};

export const importRecipe = (json: string): EditorRecipeV0 | null => {
  try {
    const parsed = JSON.parse(json) as unknown;
    return normalizeRecipe(parsed);
  } catch {
    return null;
  }
};

export const saveToLocalStorage = (recipe: EditorRecipeV0, key = DEFAULT_LOCAL_STORAGE_KEY): boolean => {
  try {
    localStorage.setItem(key, exportRecipe(recipe));
    return true;
  } catch {
    return false;
  }
};

export const loadFromLocalStorage = (key = DEFAULT_LOCAL_STORAGE_KEY): EditorRecipeV0 | null => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return null;
    }
    return importRecipe(raw);
  } catch {
    return null;
  }
};

export const downloadRecipe = (json: string, filename = "editor-recipe.v0.json"): void => {
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
