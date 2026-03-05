/**
 * UI 模块：页面渲染与交互绑定。
 * 后续可在此接入积木列表/属性面板，并与协议事件连线联动。
 */
import { useMemo, useState } from "react";
import { DoorBrick, type DoorBrickEvent } from "../domain/door";
import { DoorProtocolAdapter, type Envelope } from "../protocol/envelope";

type DoorInteractRequestPayload = {
  actor_id: string;
};

type DoorInteractResponsePayload = {
  event: string;
  payload: string;
};

export default function App(): JSX.Element {
  const adapter = useMemo(() => new DoorProtocolAdapter(new DoorBrick()), []);
  const [events, setEvents] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [validateText, setValidateText] = useState("OK");

  const renderValidate = (): void => {
    const report = adapter.validate("demo_door");
    setValidateText(report.issues.length === 0 ? "OK" : report.issues.join("\n"));
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
    renderValidate();
  };

  return (
    <>
      <h1>Door 最小 UI</h1>
      <div>
        <button type="button" onClick={onInteract}>
          Interact
        </button>
        <button type="button" onClick={onToggleLock}>
          SetState(locked={String(locked)})
        </button>
      </div>

      <h2>事件</h2>
      <pre id="event-panel">{events.join("\n")}</pre>

      <h2>校验结果</h2>
      <pre id="validate-panel">{validateText}</pre>
    </>
  );
}
