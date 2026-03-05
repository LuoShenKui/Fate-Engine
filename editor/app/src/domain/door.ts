import type { BrickDefinition } from "./brick";

/**
 * Door 领域模块：定义 Door 状态、行为与校验逻辑。
 * 拆分为定义层（编辑器可见）与运行层（交互逻辑）。
 */
export type DoorState = {
  enabled: boolean;
  locked: boolean;
  open: boolean;
  has_collision: boolean;
  has_trigger: boolean;
};

export type DoorBrickEvent = {
  event: string;
  payload: string;
};

export type ValidateOutput = {
  issues: string[];
};

export const DoorBrickDefinition: BrickDefinition = {
  id: "door",
  name: "Door",
  summary: "可交互开关门",
  properties: [
    {
      key: "locked",
      label: "Locked",
      type: "boolean",
      defaultValue: false,
      description: "门是否上锁",
    },
    {
      key: "openAngle",
      label: "Open Angle",
      type: "number",
      defaultValue: 90,
      description: "开门角度",
    },
    {
      key: "displayName",
      label: "Display Name",
      type: "string",
      defaultValue: "MainDoor",
      description: "编辑器中展示名称",
    },
  ],
  ports: [
    {
      id: "on-used",
      name: "OnUsed",
      direction: "output",
      dataType: "event",
      description: "门被成功交互时触发",
    },
    {
      id: "on-denied",
      name: "OnDenied",
      direction: "output",
      dataType: "event",
      description: "门被拒绝交互时触发",
    },
  ],
};

export class DoorRuntimeAdapter {
  private state: DoorState = {
    enabled: true,
    locked: false,
    open: false,
    has_collision: true,
    has_trigger: true,
  };

  interact(actorId: string): DoorBrickEvent {
    if (!this.state.enabled) {
      return { event: "OnDenied", payload: "reason=disabled" };
    }
    if (this.state.locked) {
      return { event: "OnDenied", payload: "reason=locked" };
    }
    this.state.open = !this.state.open;
    return { event: "OnUsed", payload: `actor_id=${actorId},open=${this.state.open}` };
  }

  setState(key: keyof DoorState, value: boolean): DoorBrickEvent {
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
