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

type ValidateOutput = {
  issues: string[];
};

class DoorBrick {
  private state: DoorState = {
    enabled: true,
    locked: false,
    open: false,
    has_collision: true,
    has_trigger: true,
  };

  interact(actorId: string): BrickEvent {
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
    this.state[key] = value;
    return { event: "OnStateChanged", payload: `key=${key},value=${value}` };
  }

  validate(doorName: string): ValidateOutput {
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

import { useMemo, useState } from "react";

export default function App(): JSX.Element {
  const door = useMemo(() => new DoorBrick(), []);
  const [events, setEvents] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [validateText, setValidateText] = useState("OK");

  const renderValidate = (): void => {
    const report = door.validate("demo_door");
    setValidateText(report.issues.length === 0 ? "OK" : report.issues.join("\n"));
  };

  const appendEvent = (e: BrickEvent): void => {
    const line = `${e.event} {${e.payload}}`;
    setEvents((prev) => [...prev, line]);
  };

  const onInteract = (): void => {
    appendEvent(door.interact("player_1"));
    renderValidate();
  };

  const onToggleLock = (): void => {
    const nextLocked = !locked;
    setLocked(nextLocked);
    appendEvent(door.setState("locked", nextLocked));
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
