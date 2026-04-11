import { useEffect, useMemo, useState } from "react";
import type { ToolbarCommand } from "./toolbar-command-registry";
import { ueGhostButton, ueShellColors } from "./ue-shell-theme";

const RECENT_COMMANDS_STORAGE_KEY = "fate-engine-recent-commands";

const readRecentCommandIds = (): string[] => {
  const raw = window.localStorage.getItem(RECENT_COMMANDS_STORAGE_KEY);
  if (raw === null) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
};

type ToolbarCommandPaletteProps = {
  open: boolean;
  commands: ToolbarCommand[];
  onClose: () => void;
};

export default function ToolbarCommandPalette(props: ToolbarCommandPaletteProps): JSX.Element | null {
  const [query, setQuery] = useState("");
  const [recentCommandIds, setRecentCommandIds] = useState<string[]>(readRecentCommandIds());
  const [selectedCommandId, setSelectedCommandId] = useState<string | null>(null);

  useEffect(() => {
    if (!props.open) {
      setQuery("");
      setSelectedCommandId(null);
      return;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        props.onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [props.open, props.onClose]);

  const filteredCommands = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length === 0) {
      return props.commands;
    }
    return props.commands.filter((command) => [command.label, command.shortcut, command.id, command.path].some((value) => value.toLowerCase().includes(normalized)));
  }, [props.commands, query]);
  const recentCommands = useMemo(
    () =>
      recentCommandIds
        .map((id) => props.commands.find((command) => command.id === id))
        .filter((command): command is ToolbarCommand => command !== undefined)
        .slice(0, 6),
    [props.commands, recentCommandIds],
  );
  const groupedCommands = useMemo(() => {
    const groups = new Map<string, ToolbarCommand[]>();
    filteredCommands.forEach((command) => {
      const existing = groups.get(command.group) ?? [];
      existing.push(command);
      groups.set(command.group, existing);
    });
    return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [filteredCommands]);
  const groupedCommandsWithoutRecent = useMemo(() => {
    if (query.trim().length > 0) {
      return groupedCommands;
    }
    const recentIds = new Set(recentCommands.map((command) => command.id));
    return groupedCommands
      .map(([group, commands]) => [group, commands.filter((command) => !recentIds.has(command.id))] as const)
      .filter(([, commands]) => commands.length > 0);
  }, [groupedCommands, query, recentCommands]);
  const visibleCommands = useMemo(
    () => (query.trim().length === 0 ? [...recentCommands, ...groupedCommandsWithoutRecent.flatMap(([, commands]) => commands)] : groupedCommands.flatMap(([, commands]) => commands)),
    [groupedCommands, groupedCommandsWithoutRecent, query, recentCommands],
  );

  useEffect(() => {
    if (!props.open) {
      return;
    }
    const firstCommandId = visibleCommands[0]?.id ?? null;
    setSelectedCommandId((prev) => (prev !== null && visibleCommands.some((command) => command.id === prev) ? prev : firstCommandId));
  }, [props.open, visibleCommands]);

  const recordRecentCommand = (commandId: string): void => {
    setRecentCommandIds((prev) => {
      const next = [commandId, ...prev.filter((id) => id !== commandId)].slice(0, 8);
      window.localStorage.setItem(RECENT_COMMANDS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const executeCommand = (command: ToolbarCommand): void => {
    recordRecentCommand(command.id);
    command.onSelect();
    props.onClose();
  };

  useEffect(() => {
    if (!props.open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (visibleCommands.length === 0) {
          return;
        }
        const currentIndex = visibleCommands.findIndex((command) => command.id === selectedCommandId);
        const safeIndex = currentIndex >= 0 ? currentIndex : 0;
        const nextIndex =
          event.key === "ArrowDown"
            ? (safeIndex + 1) % visibleCommands.length
            : (safeIndex - 1 + visibleCommands.length) % visibleCommands.length;
        setSelectedCommandId(visibleCommands[nextIndex]?.id ?? null);
      }
      if (event.key === "Enter") {
        const selected = visibleCommands.find((command) => command.id === selectedCommandId) ?? visibleCommands[0];
        if (selected !== undefined) {
          event.preventDefault();
          executeCommand(selected);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [props.open, selectedCommandId, visibleCommands]);

  if (!props.open) {
    return null;
  }

  return (
    <div
      onPointerDown={props.onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 160,
        background: "rgba(7, 10, 14, 0.62)",
        display: "grid",
        placeItems: "start center",
        paddingTop: "8vh",
      }}
    >
      <div
        onPointerDown={(event) => event.stopPropagation()}
        style={{
          width: "min(760px, calc(100vw - 32px))",
          borderRadius: "12px",
          border: `1px solid ${ueShellColors.borderStrong}`,
          background: ueShellColors.panel,
          boxShadow: "0 28px 70px rgba(0, 0, 0, 0.42)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "grid", gap: "10px", padding: "12px", borderBottom: `1px solid ${ueShellColors.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <strong style={{ fontSize: "13px", color: ueShellColors.text }}>Command Palette</strong>
            <button type="button" onClick={props.onClose} style={{ ...ueGhostButton, padding: "5px 10px", fontSize: "10px" }}>
              Esc
            </button>
          </div>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search commands, shortcuts, or ids"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "11px 12px",
              borderRadius: "8px",
              border: `1px solid ${ueShellColors.borderStrong}`,
              background: ueShellColors.panelMuted,
              color: ueShellColors.text,
              outline: "none",
            }}
          />
        </div>
        <div style={{ maxHeight: "60vh", overflow: "auto", display: "grid", gap: "4px", padding: "10px" }}>
          {query.trim().length === 0 && recentCommands.length > 0 ? (
            <div style={{ display: "grid", gap: "6px", marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: ueShellColors.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Recent</div>
              {recentCommands.map((command) => (
                <button
                  key={`recent-${command.id}`}
                  type="button"
                  onClick={() => {
                    executeCommand(command);
                  }}
                  onPointerEnter={() => setSelectedCommandId(command.id)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: `1px solid ${selectedCommandId === command.id ? ueShellColors.accent : ueShellColors.border}`,
                    background: selectedCommandId === command.id ? "#2b3340" : ueShellColors.panelMuted,
                    color: ueShellColors.text,
                    textAlign: "left",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ display: "grid", gap: "2px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700 }}>{command.label}</span>
                    <span style={{ fontSize: "10px", color: ueShellColors.textMuted }}>{command.path}</span>
                  </span>
                  <span style={{ fontSize: "10px", color: ueShellColors.textMuted }}>{command.shortcut}</span>
                </button>
              ))}
            </div>
          ) : null}
          <div style={{ display: "grid", gap: "8px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: ueShellColors.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {query.trim().length === 0 ? "Grouped Commands" : "Search Results"}
            </div>
          </div>
          {(query.trim().length === 0 ? groupedCommandsWithoutRecent : groupedCommands).map(([group, commands]) => (
            <div key={group} style={{ display: "grid", gap: "6px", marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: ueShellColors.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{group}</div>
              {commands.map((command) => (
                <button
                  key={command.id}
                  type="button"
                  onClick={() => executeCommand(command)}
                  onPointerEnter={() => setSelectedCommandId(command.id)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: `1px solid ${selectedCommandId === command.id ? ueShellColors.accent : ueShellColors.border}`,
                    background: selectedCommandId === command.id ? "#2b3340" : ueShellColors.panelMuted,
                    color: ueShellColors.text,
                    textAlign: "left",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ display: "grid", gap: "2px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700 }}>{command.label}</span>
                    <span style={{ fontSize: "10px", color: ueShellColors.textMuted }}>{command.path}</span>
                  </span>
                  <span style={{ fontSize: "10px", color: ueShellColors.textMuted }}>{command.shortcut}</span>
                </button>
              ))}
            </div>
          ))}
          {filteredCommands.length === 0 ? <div style={{ padding: "12px", fontSize: "12px", color: ueShellColors.textMuted }}>No commands match the current query.</div> : null}
        </div>
      </div>
    </div>
  );
}
