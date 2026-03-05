type DoorState = {
  enabled: boolean;
  locked: boolean;
  open: boolean;
  has_collision: boolean;
  has_trigger: boolean;
};

type BrickEvent = {
  event: string;
  payload: string;
};

type ProtocolError = {
  code: string;
  message: string;
  details: unknown;
};

type Envelope<TPayload> = {
  protocol_version: string;
  type: string;
  request_id: string;
  payload: TPayload;
  error?: ProtocolError;
};

type DoorInteractRequestPayload = {
  actor_id: string;
};

type DoorInteractResponsePayload = {
  event: string;
  payload: string;
};

type ValidateOutput = {
  issues: string[];
};

class DoorBrick {
  // Demo mirror: 与 runtime/door_core 的 DoorBrick 行为保持对照（Rust: DoorBrick::interact / DoorBrick::set_state / DoorBrick::validate）。
  private state: DoorState = {
    enabled: true,
    locked: false,
    open: false,
    has_collision: true,
    has_trigger: true,
  };

  interact(actorId: string): BrickEvent {
    // Demo mirror: 对齐 Rust 事件常量 events::ON_DENIED / events::ON_USED。
    if (!this.state.enabled) {
      return { event: "OnDenied", payload: "reason=disabled" };
    }
    if (this.state.locked) {
      return { event: "OnDenied", payload: "reason=locked" };
    }
    this.state.open = !this.state.open;
    return { event: "OnUsed", payload: `actor_id=${actorId},open=${this.state.open}` };
  }

  setState(key: keyof DoorState, value: boolean): BrickEvent {
    // Demo mirror: 对齐 Rust 事件常量 events::ON_STATE_CHANGED。
    this.state[key] = value;
    return { event: "OnStateChanged", payload: `key=${key},value=${value}` };
  }

  validate(doorName: string): ValidateOutput {
    // Demo mirror: 对齐 Rust validate 错误码 MISSING_COLLISION / MISSING_TRIGGER。
    const issues: string[] = [];
    if (!this.state.has_collision) {
      issues.push(`Error:${doorName}:MISSING_COLLISION:Door 缺少碰撞体`);
    }
    if (!this.state.has_trigger) {
      issues.push(`Error:${doorName}:MISSING_TRIGGER:Door 缺少触发体`);
    }
    return { issues };
  }
}

class DoorProtocolAdapter {
  constructor(private readonly door: DoorBrick) {}

  handleInteract(rawRequest: string): string {
    const request = JSON.parse(rawRequest) as Envelope<DoorInteractRequestPayload>;
    const event = this.door.interact(request.payload.actor_id);
    const response: Envelope<DoorInteractResponsePayload> = {
      protocol_version: "1.0",
      type: "door.interact.response",
      request_id: request.request_id,
      payload: {
        event: event.event,
        payload: event.payload,
      },
    };
    return JSON.stringify(response);
  }

  setState(key: keyof DoorState, value: boolean): BrickEvent {
    return this.door.setState(key, value);
  }

  validate(doorName: string): ValidateOutput {
    return this.door.validate(doorName);
  }
}

import { useMemo, useState } from "react";

export default function App(): JSX.Element {
  const adapter = useMemo(() => new DoorProtocolAdapter(new DoorBrick()), []);
  const [events, setEvents] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [validateText, setValidateText] = useState("OK");

  const renderValidate = (): void => {
    const report = adapter.validate("demo_door");
    setValidateText(report.issues.length === 0 ? "OK" : report.issues.join("\n"));
  };

  const appendEvent = (e: BrickEvent): void => {
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
