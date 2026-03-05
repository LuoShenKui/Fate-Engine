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

export type LadderState = {
  enabled: boolean;
  occupied: boolean;
  has_top_anchor: boolean;
};

export type TriggerZoneState = {
  enabled: boolean;
  occupied: boolean;
  has_bounds: boolean;
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
  slots: [
    {
      slotId: "mesh",
      label: "Door Mesh",
      optional: false,
    },
    {
      slotId: "sfx-open",
      label: "Open SFX",
      optional: true,
      fallbackAssetRef: "asset://audio/default-door-open",
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

export const LadderBrickDefinition: BrickDefinition = {
  id: "ladder",
  name: "Ladder",
  summary: "可上下攀爬",
  properties: [],
  slots: [
    {
      slotId: "mesh",
      label: "Ladder Mesh",
      optional: false,
    },
  ],
  ports: [
    {
      id: "on-used",
      name: "OnUsed",
      direction: "output",
      dataType: "event",
      description: "玩家开始/结束攀爬时触发",
    },
    {
      id: "on-denied",
      name: "OnDenied",
      direction: "output",
      dataType: "event",
      description: "攀爬被拒绝时触发",
    },
  ],
};

export const TriggerZoneBrickDefinition: BrickDefinition = {
  id: "trigger-zone",
  name: "TriggerZone",
  summary: "区域触发器",
  properties: [],
  slots: [
    {
      slotId: "vfx-enter",
      label: "Enter VFX",
      optional: true,
      fallbackAssetRef: "asset://vfx/default-enter",
    },
  ],
  ports: [
    {
      id: "on-used",
      name: "OnUsed",
      direction: "output",
      dataType: "event",
      description: "进入/离开触发区时触发",
    },
    {
      id: "on-denied",
      name: "OnDenied",
      direction: "output",
      dataType: "event",
      description: "触发被拒绝时触发",
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

export class LadderRuntimeAdapter {
  private state: LadderState = {
    enabled: true,
    occupied: false,
    has_top_anchor: true,
  };

  interact(actorId: string): DoorBrickEvent {
    if (!this.state.enabled) {
      return { event: "OnDenied", payload: "reason=disabled" };
    }
    this.state.occupied = !this.state.occupied;
    return { event: "OnUsed", payload: `actor_id=${actorId},occupied=${this.state.occupied}` };
  }

  validate(ladderName: string): ValidateOutput {
    const issues: string[] = [];
    if (!this.state.has_top_anchor) {
      issues.push(`Error:${ladderName}:MISSING_TOP_ANCHOR:Ladder 缺少顶部锚点`);
    }
    return { issues };
  }
}

export class TriggerZoneRuntimeAdapter {
  private state: TriggerZoneState = {
    enabled: true,
    occupied: false,
    has_bounds: true,
  };

  interact(actorId: string): DoorBrickEvent {
    if (!this.state.enabled) {
      return { event: "OnDenied", payload: "reason=disabled" };
    }
    this.state.occupied = !this.state.occupied;
    return { event: "OnUsed", payload: `actor_id=${actorId},occupied=${this.state.occupied}` };
  }

  validate(zoneName: string): ValidateOutput {
    const issues: string[] = [];
    if (!this.state.has_bounds) {
      issues.push(`Error:${zoneName}:MISSING_BOUNDS:TriggerZone 缺少触发范围`);
    }
    return { issues };
  }
}
