import type { ToolbarMenuGroup } from "./toolbar-menu-config";
import type { ToolbarMenuItem } from "./toolbar-menu-model";

export type ToolbarCommand = {
  id: string;
  label: string;
  shortcut: string;
  onSelect: () => void;
  group: string;
  path: string;
};

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select";
};

const normalizeShortcut = (shortcut: string): string =>
  shortcut
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean)
    .sort()
    .join("+");

const normalizeKeyboardEvent = (event: KeyboardEvent): string => {
  const parts: string[] = [];
  if (event.shiftKey) {
    parts.push("shift");
  }
  if (event.metaKey || event.ctrlKey) {
    parts.push("cmd");
  }
  if (event.altKey) {
    parts.push("alt");
  }
  const key = event.key === " " ? "space" : event.key.toLowerCase();
  parts.push(key);
  return parts.sort().join("+");
};

export const collectToolbarCommands = (groups: ToolbarMenuGroup[]): ToolbarCommand[] => {
  const commands: ToolbarCommand[] = [];

  const visit = (groupLabel: string, parents: string[], entry: ToolbarMenuItem): void => {
    const pathParts = [...parents, entry.label];
    if (entry.shortcut && entry.onSelect) {
      commands.push({
        id: entry.commandId ?? entry.label,
        label: entry.label,
        shortcut: entry.shortcut,
        onSelect: entry.onSelect,
        group: groupLabel,
        path: pathParts.join(" / "),
      });
    }
    entry.items?.forEach((child) => visit(groupLabel, pathParts, child));
  };

  groups.forEach((group) => {
    group.items.forEach((item) => visit(group.label, [group.label], item));
  });
  return commands;
};

export const executeToolbarShortcut = (event: KeyboardEvent, commands: ToolbarCommand[]): boolean => {
  if (isEditableTarget(event.target)) {
    return false;
  }
  const matched = commands.find((command) => normalizeShortcut(command.shortcut) === normalizeKeyboardEvent(event));
  if (matched === undefined) {
    return false;
  }
  event.preventDefault();
  matched.onSelect();
  return true;
};
