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

export type SwitchState = {
  enabled: boolean;
  active: boolean;
};

export type ContainerState = {
  enabled: boolean;
  opened: boolean;
};

export type CheckpointState = {
  enabled: boolean;
  activated: boolean;
};

export type TeleportState = {
  enabled: boolean;
  charging: boolean;
};

export type DoorStateSyncPayload = {
  entity_id: string;
  state: "Closed" | "Open" | "Locked";
};

export type DoorBrickEvent = {
  event: string;
  payload: string;
};

export type AdapterMode = "demo" | "runtime";

export type RuntimeEventLog = {
  requestId: string;
  mode: AdapterMode;
  event: string;
  payload: string;
};

export function formatRuntimeEventLog(log: RuntimeEventLog): string {
  return `[door_event] mode=${log.mode} request_id=${log.requestId} event=${log.event} payload=${log.payload}`;
}

export const DOOR_EVENTS = {
  ON_SPAWN: "OnSpawn",
  ON_ENABLE: "OnEnable",
  ON_DISABLE: "OnDisable",
  ON_DESTROY: "OnDestroy",
  ON_USED: "OnUsed",
  ON_DENIED: "OnDenied",
  ON_STATE_CHANGED: "OnStateChanged",
  ON_VALIDATE: "OnValidate",
  ON_TICK_LOW_FREQ: "OnTickLowFreq",
} as const;

export const DOOR_VALIDATION_CODES = {
  MISSING_COLLISION: "MISSING_COLLISION",
  MISSING_TRIGGER: "MISSING_TRIGGER",
  LOCKED_DEFAULT: "LOCKED_DEFAULT",
} as const;

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
  properties: [
    {
      key: "enabled",
      label: "Enabled",
      type: "boolean",
      defaultValue: true,
      description: "梯子是否可用",
    },
    {
      key: "has_top_anchor",
      label: "Top Anchor",
      type: "boolean",
      defaultValue: true,
      description: "顶部锚点是否存在",
    },
  ],
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
  properties: [
    {
      key: "enabled",
      label: "Enabled",
      type: "boolean",
      defaultValue: true,
      description: "触发区是否启用",
    },
  ],
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

export const SwitchBrickDefinition: BrickDefinition = {
  id: "switch",
  name: "Switch",
  summary: "可触发开关",
  properties: [
    {
      key: "enabled",
      label: "Enabled",
      type: "boolean",
      defaultValue: true,
      description: "开关是否可用",
    },
    {
      key: "active",
      label: "Active",
      type: "boolean",
      defaultValue: false,
      description: "当前是否激活",
    },
  ],
  slots: [
    {
      slotId: "mesh",
      label: "Switch Mesh",
      optional: false,
    },
  ],
  ports: [
    {
      id: "on-used",
      name: "OnUsed",
      direction: "output",
      dataType: "event",
      description: "开关切换时触发",
    },
    {
      id: "on-denied",
      name: "OnDenied",
      direction: "output",
      dataType: "event",
      description: "开关不可用时触发",
    },
  ],
};

export const ContainerBrickDefinition: BrickDefinition = {
  id: "container",
  name: "Container",
  summary: "可打开容器",
  properties: [],
  slots: [
    {
      slotId: "mesh",
      label: "Container Mesh",
      optional: false,
    },
  ],
  ports: [
    {
      id: "on-used",
      name: "OnUsed",
      direction: "output",
      dataType: "event",
      description: "容器开启/关闭时触发",
    },
    {
      id: "on-denied",
      name: "OnDenied",
      direction: "output",
      dataType: "event",
      description: "容器不可用时触发",
    },
  ],
};

export const CheckpointBrickDefinition: BrickDefinition = {
  id: "checkpoint",
  name: "Checkpoint",
  summary: "存档检查点",
  properties: [],
  slots: [
    {
      slotId: "vfx-mark",
      label: "Checkpoint VFX",
      optional: true,
      fallbackAssetRef: "asset://vfx/default-checkpoint",
    },
  ],
  ports: [
    {
      id: "on-used",
      name: "OnUsed",
      direction: "output",
      dataType: "event",
      description: "触发检查点时触发",
    },
    {
      id: "on-denied",
      name: "OnDenied",
      direction: "output",
      dataType: "event",
      description: "检查点不可用时触发",
    },
  ],
};

export const TeleportBrickDefinition: BrickDefinition = {
  id: "teleport",
  name: "Teleport",
  summary: "传送装置",
  properties: [],
  slots: [
    {
      slotId: "vfx-portal",
      label: "Portal VFX",
      optional: true,
      fallbackAssetRef: "asset://vfx/default-portal",
    },
  ],
  ports: [
    {
      id: "on-used",
      name: "OnUsed",
      direction: "output",
      dataType: "event",
      description: "传送成功时触发",
    },
    {
      id: "on-denied",
      name: "OnDenied",
      direction: "output",
      dataType: "event",
      description: "传送失败时触发",
    },
  ],
};

export class DoorRuntimeAdapter {
  private readonly states = new Map<string, DoorState>();

  private getState(entityId: string): DoorState {
    const cached = this.states.get(entityId);
    if (cached !== undefined) {
      return cached;
    }
    const created: DoorState = {
      enabled: true,
      locked: false,
      open: false,
      has_collision: true,
      has_trigger: true,
    };
    this.states.set(entityId, created);
    return created;
  }

  interact(actorId: string, entityId: string): DoorBrickEvent {
    const state = this.getState(entityId);
    if (!state.enabled) {
      return { event: DOOR_EVENTS.ON_DENIED, payload: `entity_id=${entityId},actor_id=${actorId},reason=disabled` };
    }
    if (state.locked) {
      return { event: DOOR_EVENTS.ON_DENIED, payload: `entity_id=${entityId},actor_id=${actorId},reason=locked` };
    }
    state.open = !state.open;
    return { event: DOOR_EVENTS.ON_USED, payload: `entity_id=${entityId},actor_id=${actorId},state=${state.open ? "Open" : "Closed"}` };
  }

  setState(entityId: string, key: keyof DoorState, value: boolean): DoorBrickEvent {
    const state = this.getState(entityId);
    state[key] = value;
    return { event: DOOR_EVENTS.ON_STATE_CHANGED, payload: `entity_id=${entityId},key=${key},value=${value}` };
  }


  syncState(payload: DoorStateSyncPayload): DoorBrickEvent {
    const state = this.getState(payload.entity_id);
    state.locked = payload.state === "Locked";
    state.open = payload.state === "Open";
    return { event: DOOR_EVENTS.ON_STATE_CHANGED, payload: `entity_id=${payload.entity_id},state=${payload.state}` };
  }

  validate(doorName: string, entityId = doorName): ValidateOutput {
    const state = this.getState(entityId);
    const issues: string[] = [];
    if (!state.has_collision) {
      issues.push(`Error:${doorName}:${DOOR_VALIDATION_CODES.MISSING_COLLISION}:DOOR_MISSING_COLLISION`);
    }
    if (!state.has_trigger) {
      issues.push(`Error:${doorName}:${DOOR_VALIDATION_CODES.MISSING_TRIGGER}:DOOR_MISSING_TRIGGER`);
    }
    if (state.locked) {
      issues.push(`Warning:${doorName}:${DOOR_VALIDATION_CODES.LOCKED_DEFAULT}:DOOR_LOCKED_BY_DEFAULT`);
    }
    return { issues };
  }
}

export class LadderRuntimeAdapter {
  private readonly states = new Map<string, LadderState>();

  private getState(entityId: string): LadderState {
    const cached = this.states.get(entityId);
    if (cached !== undefined) {
      return cached;
    }
    const created: LadderState = {
      enabled: true,
      occupied: false,
      has_top_anchor: true,
    };
    this.states.set(entityId, created);
    return created;
  }

  interact(actorId: string, entityId: string): DoorBrickEvent {
    const state = this.getState(entityId);
    if (!state.enabled) {
      return { event: "OnDenied", payload: "reason=disabled" };
    }
    state.occupied = !state.occupied;
    return { event: "OnUsed", payload: `entity_id=${entityId},actor_id=${actorId},occupied=${state.occupied}` };
  }

  validate(ladderName: string, entityId = ladderName): ValidateOutput {
    const state = this.getState(entityId);
    const issues: string[] = [];
    if (!state.has_top_anchor) {
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

  interact(actorId: string, entityId: string): DoorBrickEvent {
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

export class SwitchRuntimeAdapter {
  private readonly states = new Map<string, SwitchState>();

  private getState(entityId: string): SwitchState {
    const cached = this.states.get(entityId);
    if (cached !== undefined) {
      return cached;
    }
    const created: SwitchState = {
      enabled: true,
      active: false,
    };
    this.states.set(entityId, created);
    return created;
  }

  interact(actorId: string, entityId: string): DoorBrickEvent {
    const state = this.getState(entityId);
    if (!state.enabled) {
      return { event: "OnDenied", payload: "reason=disabled" };
    }
    state.active = !state.active;
    return { event: "OnUsed", payload: `entity_id=${entityId},actor_id=${actorId},active=${state.active}` };
  }
}

export class ContainerRuntimeAdapter {
  private state: ContainerState = {
    enabled: true,
    opened: false,
  };

  interact(actorId: string, entityId: string): DoorBrickEvent {
    if (!this.state.enabled) {
      return { event: "OnDenied", payload: "reason=disabled" };
    }
    this.state.opened = !this.state.opened;
    return { event: "OnUsed", payload: `actor_id=${actorId},opened=${this.state.opened}` };
  }
}

export class CheckpointRuntimeAdapter {
  private state: CheckpointState = {
    enabled: true,
    activated: false,
  };

  interact(actorId: string, entityId: string): DoorBrickEvent {
    if (!this.state.enabled) {
      return { event: "OnDenied", payload: "reason=disabled" };
    }
    this.state.activated = true;
    return { event: "OnUsed", payload: `actor_id=${actorId},activated=${this.state.activated}` };
  }
}

export class TeleportRuntimeAdapter {
  private state: TeleportState = {
    enabled: true,
    charging: false,
  };

  interact(actorId: string, entityId: string): DoorBrickEvent {
    if (!this.state.enabled) {
      return { event: "OnDenied", payload: "reason=disabled" };
    }
    this.state.charging = !this.state.charging;
    return { event: "OnUsed", payload: `actor_id=${actorId},charging=${this.state.charging}` };
  }
}
