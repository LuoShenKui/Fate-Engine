/**
 * UI 模块：页面渲染与交互绑定。
 * 后续可在此接入积木列表/属性面板，并与协议事件连线联动。
 */
import { useMemo, useState } from "react";
import { DoorBrick, type DoorBrickEvent } from "../domain/door";
import { DoorProtocolAdapter, type Envelope } from "../protocol/envelope";
import {
  downloadRecipe,
  exportRecipe,
  importRecipe,
  loadFromLocalStorage,
  saveToLocalStorage,
  type EditorRecipeV0,
} from "../project/recipe";
import BrickPalettePanel, { type BrickPaletteItem } from "./BrickPalettePanel";
import DebugToolbar from "./DebugToolbar";
import EditorLayout from "./EditorLayout";
import GraphCanvasPanel from "./GraphCanvasPanel";
import PropertyInspectorPanel, { type PropertyField, type PropertyValue } from "./PropertyInspectorPanel";
import ValidationPanel, { type ValidationItem } from "./ValidationPanel";

type DoorInteractRequestPayload = {
  actor_id: string;
};

type DoorInteractResponsePayload = {
  event: string;
  payload: string;
};

const paletteItems: BrickPaletteItem[] = [
  { id: "door", name: "Door", summary: "可交互开关门" },
  { id: "ladder", name: "Ladder", summary: "可上下攀爬" },
  { id: "trigger-zone", name: "TriggerZone", summary: "区域触发器" },
];

const initialFields: PropertyField[] = [
  { key: "locked", label: "Locked", value: false },
  { key: "openAngle", label: "Open Angle", value: 90 },
  { key: "displayName", label: "Display Name", value: "MainDoor" },
];

const defaultNodes = [{ id: "door-1", type: "door" }];
const defaultEdges: unknown[] = [];

export default function App(): JSX.Element {
  const adapter = useMemo(() => new DoorProtocolAdapter(new DoorBrick()), []);
  const [events, setEvents] = useState<string[]>([]);
  const [protocolErrors, setProtocolErrors] = useState<string[]>([]);
  const [requestSeq, setRequestSeq] = useState(1);
  const [locked, setLocked] = useState(false);
  const [validationItems, setValidationItems] = useState<ValidationItem[]>([{ level: "Info", message: "等待校验" }]);
  const [selectedBrick, setSelectedBrick] = useState(paletteItems[0]?.name ?? "None");
  const [fields, setFields] = useState<PropertyField[]>(initialFields);
  const [nodes, setNodes] = useState<unknown[]>(defaultNodes);
  const [edges, setEdges] = useState<unknown[]>(defaultEdges);
  const [seed, setSeed] = useState<number>(Date.now());

  const renderValidate = (): void => {
    const report = adapter.validate("demo_door");
    const issues = report.issues.map<ValidationItem>((issue) => ({ level: "Error", message: issue }));
    setValidationItems(issues.length > 0 ? issues : [{ level: "Info", message: "OK" }]);
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
  };

  const onToggleLock = (): void => {
    const nextLocked = !locked;
    setLocked(nextLocked);
    appendEvent(adapter.setState("locked", nextLocked));
    setFields((prev) => prev.map((field) => (field.key === "locked" ? { ...field, value: nextLocked } : field)));
    renderValidate();
  };

  const onPropertyChange = (key: string, value: PropertyValue): void => {
    setFields((prev) => prev.map((field) => (field.key === key ? { ...field, value } : field)));
  };

  const onExport = (): void => {
    const recipe = getRecipe();
    const json = exportRecipe(recipe);
    downloadRecipe(json);
  };

  const onImport = (): void => {
    const json = window.prompt("请粘贴配方 JSON");
    if (json === null) {
      return;
    }
    const recipe = importRecipe(json);
    if (recipe === null) {
      window.alert("导入失败：JSON 无法解析");
      return;
    }
    applyRecipe(recipe);
    window.alert("导入成功");
  };

  const onSave = (): void => {
    const ok = saveToLocalStorage(getRecipe());
    window.alert(ok ? "已保存到本地" : "保存失败");
  };

  const onLoad = (): void => {
    const recipe = loadFromLocalStorage();
    if (recipe === null) {
      window.alert("未找到可加载的本地数据");
      return;
    }
    applyRecipe(recipe);
    window.alert("加载成功");
  };

  const validationWithEvents: ValidationItem[] = [
    ...validationItems,
    ...protocolErrors.slice(-3).map((errorText) => ({ level: "Error" as const, message: `协议错误: ${errorText}` })),
    ...events.slice(-3).map((eventText) => ({ level: "Info" as const, message: `事件: ${eventText}` })),
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
        />
      }
      left={<BrickPalettePanel items={paletteItems} onSelect={(id) => setSelectedBrick(id)} />}
      center={<GraphCanvasPanel />}
      right={<PropertyInspectorPanel nodeName={selectedBrick} fields={fields} onChange={onPropertyChange} />}
      bottom={<ValidationPanel items={validationWithEvents} />}
    />
  );
}
