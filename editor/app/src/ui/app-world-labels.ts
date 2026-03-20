import type { CanvasNode } from "./GraphCanvasPanel";
import type { AssetRegistryItem, BrickCatalogEntry } from "./app-types";
import type { GraphCanvasWorldLabel } from "./graph-canvas-types";

export const buildWorldLabels = ({
  nodes,
  catalogEntries,
}: {
  nodes: CanvasNode[];
  catalogEntries: BrickCatalogEntry[];
  slotBindings: Record<string, string>;
  assetRegistry: AssetRegistryItem[];
}): GraphCanvasWorldLabel[] =>
  nodes
    .filter((node) => node.type !== "trigger-zone")
    .map((node) => {
      const entry = catalogEntries.find((candidate) => candidate.id === node.type);
      return {
        id: node.id,
        title: entry?.name ?? node.type ?? node.id,
        tone: entry?.category === "ability" ? "ability" : entry?.runtimeKind === "door" || entry?.runtimeKind === "switch" || entry?.runtimeKind === "ladder" ? "interactive" : "neutral",
      };
    });
