/**
 * UI 模块：页面渲染与交互绑定。
 * 后续可在此接入积木列表/属性面板，并与协议事件连线联动。
 */
import { useMemo, useState } from "react";
import { DoorBrick, type DoorBrickEvent } from "../domain/door";
import { DoorProtocolAdapter, type Envelope } from "../protocol/envelope";
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

export default function App(): JSX.Element {
  const adapter = useMemo(() => new DoorProtocolAdapter(new DoorBrick()), []);
  const [events, setEvents] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [validationItems, setValidationItems] = useState<ValidationItem[]>([{ level: "Info", message: "等待校验" }]);
  const [selectedBrick, setSelectedBrick] = useState(paletteItems[0]?.name ?? "None");
  const [fields, setFields] = useState<PropertyField[]>(initialFields);

  const renderValidate = (): void => {
    const report = adapter.validate("demo_door");
    const issues = report.issues.map<ValidationItem>((issue) => ({ level: "Error", message: issue }));
    setValidationItems(issues.length > 0 ? issues : [{ level: "Info", message: "OK" }]);
  };

  const appendEvent = (e: DoorBrickEvent): void => {
    const line = `${e.event} {${e.payload}}`;
    setEvents((prev) => [...prev, line]);
  };

  const onInteract = (): void => {
    const request: Envelope<DoorInteractRequestPayload> = {
      protocol_version: "1.0",
      type: "door.interact.request",
      request_id: `req-${events.length + 1}`,
      payload: { actor_id: "player_1" },
    };
    const responseText = adapter.handleInteract(JSON.stringify(request));
    const response = JSON.parse(responseText) as Envelope<DoorInteractResponsePayload>;
    appendEvent(response.payload);
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

  const validationWithEvents: ValidationItem[] = [
    ...validationItems,
    ...events.slice(-3).map((eventText) => ({ level: "Info" as const, message: `事件: ${eventText}` })),
  ];

  return (
    <EditorLayout
      top={<DebugToolbar locked={locked} onInteract={onInteract} onToggleLock={onToggleLock} />}
      left={<BrickPalettePanel items={paletteItems} onSelect={(id) => setSelectedBrick(id)} />}
      center={<GraphCanvasPanel />}
      right={<PropertyInspectorPanel nodeName={selectedBrick} fields={fields} onChange={onPropertyChange} />}
      bottom={<ValidationPanel items={validationWithEvents} />}
    />
  );
}
