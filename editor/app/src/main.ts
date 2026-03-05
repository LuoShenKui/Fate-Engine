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

const door = new DoorBrick();
let locked = false;

const eventPanel = document.querySelector<HTMLPreElement>("#event-panel");
const validatePanel = document.querySelector<HTMLPreElement>("#validate-panel");
const interactBtn = document.querySelector<HTMLButtonElement>("#interact-btn");
const lockBtn = document.querySelector<HTMLButtonElement>("#lock-btn");

if (!eventPanel || !validatePanel || !interactBtn || !lockBtn) {
  throw new Error("UI 初始化失败：缺少必要节点");
}

const eventPanelEl = eventPanel;
const validatePanelEl = validatePanel;

function renderValidate(): void {
  const report = door.validate("demo_door");
  validatePanelEl.textContent = report.issues.length === 0 ? "OK" : report.issues.join("\n");
}

function appendEvent(e: BrickEvent): void {
  const line = `${e.event} {${e.payload}}`;
  eventPanelEl.textContent = eventPanelEl.textContent
    ? `${eventPanelEl.textContent}\n${line}`
    : line;
}

interactBtn.addEventListener("click", () => {
  appendEvent(door.interact("player_1"));
  renderValidate();
});

lockBtn.addEventListener("click", () => {
  locked = !locked;
  appendEvent(door.setState("locked", locked));
  lockBtn.textContent = `SetState(locked=${locked})`;
  renderValidate();
});

renderValidate();
