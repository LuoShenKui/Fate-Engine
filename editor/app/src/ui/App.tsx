/**
 * UI 模块：页面渲染与交互绑定。
 * 后续可在此接入积木列表/属性面板，并与协议事件连线联动。
 */
import { useEffect, useMemo, useState } from "react";
import { DoorRuntimeAdapter, type DoorBrickEvent, DoorBrickDefinition } from "../domain/door";
import { DoorProtocolAdapter, type Envelope } from "../protocol/envelope";
import { getBrickDefinition, listBrickDefinitions } from "../domain/registry";
import {
  downloadRecipe,
  exportRecipe,
  importRecipe,
  isRecipeLockfileLocked,
  loadFromLocalStorage,
  saveToLocalStorage,
  type EditorRecipeV0,
} from "../project/recipe";
import { assembleWorkflowTemplate } from "../workflow/templates";
import { runBatchValidate, type BatchValidationStats } from "../workflow/validation";
import BrickPalettePanel, { type BrickPaletteItem } from "./BrickPalettePanel";
import DebugToolbar from "./DebugToolbar";
import EditorLayout from "./EditorLayout";
import GraphCanvasPanel from "./GraphCanvasPanel";
import { useI18n } from "./i18n/I18nProvider";
import PropertyInspectorPanel, { type PropertyField, type PropertyValue } from "./PropertyInspectorPanel";
import ValidationPanel, { type ValidationItem } from "./ValidationPanel";

type DoorInteractRequestPayload = {
  actor_id: string;
};

type DoorInteractResponsePayload = {
  event: string;
  payload: string;
};

const paletteItems: BrickPaletteItem[] = listBrickDefinitions().map((definition) => ({
  id: definition.id,
  name: definition.name,
  summary: definition.summary,
}));

const initialFields: PropertyField[] = DoorBrickDefinition.properties.map((property) => ({
  key: property.key,
  label: property.label,
  value: property.defaultValue,
}));

const defaultNodes = [{ id: "door-1", type: "door" }];
const defaultEdges: unknown[] = [];

export default function App(): JSX.Element {
  const adapter = useMemo(() => new DoorProtocolAdapter(new DoorRuntimeAdapter()), []);
  const { t } = useI18n();
  const [events, setEvents] = useState<string[]>([]);
  const [protocolErrors, setProtocolErrors] = useState<string[]>([]);
  const [requestSeq, setRequestSeq] = useState(1);
  const [locked, setLocked] = useState(false);
  const [validationItems, setValidationItems] = useState<ValidationItem[]>([{ level: "Info", message: t("validation.waiting") }]);
  const [selectedBrick, setSelectedBrick] = useState(paletteItems[0]?.id ?? "none");
  const [fields, setFields] = useState<PropertyField[]>(initialFields);
  const [nodes, setNodes] = useState<unknown[]>(defaultNodes);
  const [edges, setEdges] = useState<unknown[]>(defaultEdges);
  const [seed, setSeed] = useState<number>(Date.now());
  const [lastBatchStats, setLastBatchStats] = useState<BatchValidationStats>({ totalErrors: 0, totalWarnings: 0 });
  const [batchStatsDiff, setBatchStatsDiff] = useState<BatchValidationStats>({ totalErrors: 0, totalWarnings: 0 });
  const [batchEntries, setBatchEntries] = useState<Array<{ recipeId: string; items: ValidationItem[] }>>([]);

  useEffect(() => {
    document.title = t("app.title");
  }, [t]);

  useEffect(() => {
    setValidationItems((prev) => {
      if (prev.length === 1 && prev[0]?.level === "Info") {
        if (prev[0].message === "等待校验" || prev[0].message === "Waiting for validation") {
          return [{ level: "Info", message: t("validation.waiting") }];
        }
      }
      return prev;
    });
  }, [t]);

  const renderValidate = (): void => {
    const report = adapter.validate("demo_door");
    const issues = report.issues.map<ValidationItem>((issue) => ({ level: "Error", message: issue }));
    setValidationItems(issues.length > 0 ? issues : [{ level: "Info", message: t("validation.ok") }]);
  };

  const renderBatchValidate = (recipe: EditorRecipeV0): void => {
    const report = runBatchValidate([{ recipeId: "current", recipe }]);
    const nextStats = report.stats;
    setBatchStatsDiff({
      totalErrors: nextStats.totalErrors - lastBatchStats.totalErrors,
      totalWarnings: nextStats.totalWarnings - lastBatchStats.totalWarnings,
    });
    setLastBatchStats(nextStats);
    setBatchEntries(
      report.entries.map((entry) => ({
        recipeId: entry.recipeId,
        items: entry.issues.map((issue) => ({ level: issue.level, message: issue.message })),
      })),
    );
  };

  const appendEvent = (e: DoorBrickEvent): void => {
    const line = `${e.event} {${e.payload}}`;
    setEvents((prev) => [...prev, line]);
  };

  const getRecipe = (): EditorRecipeV0 => ({
    version: "0",
    nodes,
    edges,
    params: {
      selected_brick: selectedBrick,
      fields,
      locked,
    },
    seed,
    lockfile: {
      packages: [
        {
          id: "fate-door-ui",
          version: "0.1.0",
          hash: locked ? "sha256-placeholder" : "",
        },
      ],
    },
    package_lock: {
      packages: {
        editor: "0.1.0",
      },
    },
  });

  const applyRecipe = (recipe: EditorRecipeV0): void => {
    setNodes(recipe.nodes);
    setEdges(recipe.edges);
    setSeed(recipe.seed);

    const selected = typeof recipe.params.selected_brick === "string" ? recipe.params.selected_brick : selectedBrick;
    setSelectedBrick(selected);

    if (typeof recipe.params.locked === "boolean") {
      setLocked(recipe.params.locked);
    }

    if (Array.isArray(recipe.params.fields)) {
      const validFields = recipe.params.fields.filter(
        (field): field is PropertyField =>
          typeof field === "object" &&
          field !== null &&
          "key" in field &&
          "label" in field &&
          "value" in field &&
          typeof (field as { key: unknown }).key === "string" &&
          typeof (field as { label: unknown }).label === "string",
      );
      if (validFields.length > 0) {
        setFields(validFields);
      }
    }

    renderBatchValidate(recipe);
  };

  const onInteract = (): void => {
    const request: Envelope<DoorInteractRequestPayload> = {
      protocol_version: "1.0",
      type: "door.interact.request",
      request_id: `req-${requestSeq}`,
      payload: { actor_id: "player_1" },
    };
    setRequestSeq((prev) => prev + 1);
    const responseText = adapter.handleInteract(JSON.stringify(request));
    const response = JSON.parse(responseText) as Envelope<DoorInteractResponsePayload>;
    if (response.error !== undefined) {
      const protocolError = response.error;
      setProtocolErrors((prev) => [
        ...prev,
        `${protocolError.code}: ${protocolError.message} (${JSON.stringify(protocolError.details)})`,
      ]);
    } else {
      appendEvent(response.payload);
    }
    renderValidate();
    renderBatchValidate(getRecipe());
  };

  const onToggleLock = (): void => {
    const nextLocked = !locked;
    setLocked(nextLocked);
    appendEvent(adapter.setState("locked", nextLocked));
    setFields((prev) => prev.map((field) => (field.key === "locked" ? { ...field, value: nextLocked } : field)));
    renderValidate();
    renderBatchValidate({ ...getRecipe(), params: { ...getRecipe().params, locked: nextLocked }, lockfile: { packages: [{ id: "fate-door-ui", version: "0.1.0", hash: nextLocked ? "sha256-placeholder" : "" }] } });
  };

  const onPropertyChange = (key: string, value: PropertyValue): void => {
    setFields((prev) => prev.map((field) => (field.key === key ? { ...field, value } : field)));
  };

  const onExport = (): void => {
    const recipe = getRecipe();
    const json = exportRecipe(recipe);
    downloadRecipe(json);
    window.alert(t("export.started"));
  };

  const onApplyTemplate = (): void => {
    const assembled = assembleWorkflowTemplate("warehouse_gate_v0");
    setNodes(assembled.nodes);
    setEdges(assembled.edges);
    const recipe = { ...getRecipe(), nodes: assembled.nodes, edges: assembled.edges };
    renderBatchValidate(recipe);
    window.alert(t("template.applied"));
  };

  const onImport = (): void => {
    const json = window.prompt(t("import.prompt"));
    if (json === null) {
      return;
    }
    const recipe = importRecipe(json);
    if (recipe === null) {
      window.alert(t("import.failed"));
      return;
    }
    applyRecipe(recipe);
    window.alert(t("import.success"));
  };

  const onSave = (): void => {
    const recipe = getRecipe();
    renderBatchValidate(recipe);
    const ok = saveToLocalStorage(recipe);
    window.alert(ok ? t("save.success") : t("save.failed"));
  };

  const onLoad = (): void => {
    const recipe = loadFromLocalStorage();
    if (recipe === null) {
      window.alert(t("load.notFound"));
      return;
    }
    applyRecipe(recipe);
    window.alert(t("load.success"));
  };

  const selectedBrickDefinition = getBrickDefinition(selectedBrick);
  const lockStatusText = isRecipeLockfileLocked(getRecipe()) ? t("lockfile.locked") : t("lockfile.unlocked");

  const validationWithEvents: ValidationItem[] = [
    ...validationItems,
    ...protocolErrors
      .slice(-3)
      .map((errorText) => ({ level: "Error" as const, message: t("validation.protocolErrorPrefix", { errorText }) })),
    ...events.slice(-3).map((eventText) => ({ level: "Info" as const, message: t("validation.eventPrefix", { eventText }) })),
  ];

  return (
    <EditorLayout
      top={
        <DebugToolbar
          locked={locked}
          onInteract={onInteract}
          onToggleLock={onToggleLock}
          onImport={onImport}
          onExport={onExport}
          onSave={onSave}
          onLoad={onLoad}
          onApplyTemplate={onApplyTemplate}
          lockStatusText={lockStatusText}
        />
      }
      left={<BrickPalettePanel items={paletteItems} onSelect={(id) => setSelectedBrick(id)} />}
      center={<GraphCanvasPanel />}
      right={<PropertyInspectorPanel nodeName={selectedBrickDefinition?.name ?? selectedBrick} fields={fields} onChange={onPropertyChange} />}
      bottom={<ValidationPanel items={validationWithEvents} batchEntries={batchEntries} batchStatsDiff={batchStatsDiff} />}
    />
  );
}
