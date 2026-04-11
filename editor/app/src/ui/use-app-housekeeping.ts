import { useEffect } from "react";
import { IMPORTED_BRICK_HISTORY_STORAGE_KEY, IMPORTED_BRICKS_STORAGE_KEY } from "./app-constants";
import type { BrickCatalogEntry } from "./app-types";
import type { PropertyField } from "./PropertyInspectorPanel";
import type { ValidationItem } from "./ValidationPanel";
import type { CanvasNode } from "./GraphCanvasPanel";

type Setter<T> = (value: T | ((prev: T) => T)) => void;

type UseAppHousekeepingArgs = {
  t: (key: string) => string;
  importedBricks: BrickCatalogEntry[];
  importedBrickHistory: Record<string, BrickCatalogEntry[]>;
  nodes: CanvasNode[];
  hiddenPanelsValidation: boolean;
  events: Array<{ source: string }>;
  protocolErrorsLength: number;
  setFieldDraftsByNodeId: Setter<Record<string, PropertyField[]>>;
  setValidationItems: Setter<ValidationItem[]>;
  setValidationExpanded: Setter<boolean>;
};

export const useAppHousekeeping = ({
  t,
  importedBricks,
  importedBrickHistory,
  nodes,
  hiddenPanelsValidation,
  events,
  protocolErrorsLength,
  setFieldDraftsByNodeId,
  setValidationItems,
  setValidationExpanded,
}: UseAppHousekeepingArgs): void => {
  useEffect(() => {
    document.title = t("app.title");
  }, [t]);

  useEffect(() => {
    try {
      window.localStorage.setItem(IMPORTED_BRICKS_STORAGE_KEY, JSON.stringify(importedBricks));
    } catch {
      // Ignore storage failures.
    }
  }, [importedBricks]);

  useEffect(() => {
    try {
      window.localStorage.setItem(IMPORTED_BRICK_HISTORY_STORAGE_KEY, JSON.stringify(importedBrickHistory));
    } catch {
      // Ignore storage failures.
    }
  }, [importedBrickHistory]);

  useEffect(() => {
    setFieldDraftsByNodeId((prev) => {
      const validNodeIds = new Set(nodes.map((node) => node.id));
      const next = Object.entries(prev).reduce<Record<string, PropertyField[]>>((acc, [nodeId, fields]) => {
        if (validNodeIds.has(nodeId)) {
          acc[nodeId] = fields;
        }
        return acc;
      }, {});
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
  }, [nodes, setFieldDraftsByNodeId]);

  useEffect(() => {
    setValidationItems((prev) => {
      if (prev.length === 1 && prev[0]?.level === "Info" && (prev[0].message === "等待校验" || prev[0].message === "Waiting for validation")) {
        return [{ level: "Info", message: t("validation.waiting") }];
      }
      return prev;
    });
  }, [setValidationItems, t]);

  useEffect(() => {
    if (!hiddenPanelsValidation && (events.some((event) => event.source !== "camera") || protocolErrorsLength > 0)) {
      setValidationExpanded(true);
    }
  }, [events, hiddenPanelsValidation, protocolErrorsLength, setValidationExpanded]);
};
