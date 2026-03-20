export const INTERACTION_EVENTS = ["OnUsed", "OnDenied", "OnStateChanged"] as const;

export const HIGH_FREQUENCY_STATE_KEYS = [
  "enabled",
  "locked",
  "open",
  "active",
  "occupied",
  "opened",
  "activated",
  "charging",
] as const;

export const DOOR_STATE_KEYS = ["locked", "open"] as const;

export const DOOR_COMMANDS = ["open", "close", "lock", "unlock", "toggle"] as const;

export const DOOR_LINK_ACTIONS = [
  "open_on_enter",
  "close_on_exit",
  "toggle_on_use",
  "toggle_on_climb",
] as const;

export type DoorLinkAction = typeof DOOR_LINK_ACTIONS[number];
