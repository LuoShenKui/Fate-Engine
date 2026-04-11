export type ToolbarMenuItem = {
  label: string;
  onSelect?: () => void;
  items?: ToolbarMenuItem[];
  hint?: string;
  shortcut?: string;
  separatorBefore?: boolean;
  commandId?: string;
};
