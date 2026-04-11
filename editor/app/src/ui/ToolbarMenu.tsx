import { useEffect, useRef, useState } from "react";
import { ueShellColors } from "./ue-shell-theme";
import type { ToolbarMenuItem } from "./toolbar-menu-model";

type ToolbarMenuProps = {
  label: string;
  items: ToolbarMenuItem[];
};

type ToolbarMenuListProps = {
  items: ToolbarMenuItem[];
  closeAll: () => void;
};

function ToolbarMenuList(props: ToolbarMenuListProps): JSX.Element {
  return (
    <div
      role="menu"
      style={{
        minWidth: "196px",
        padding: "6px",
        borderRadius: "4px",
        border: `1px solid ${ueShellColors.borderStrong}`,
        background: ueShellColors.panel,
        boxShadow: "0 14px 24px rgba(0, 0, 0, 0.28)",
      }}
    >
      {props.items.map((item) => (
        <ToolbarMenuEntry key={item.label} item={item} closeAll={props.closeAll} />
      ))}
    </div>
  );
}

type ToolbarMenuEntryProps = {
  item: ToolbarMenuItem;
  closeAll: () => void;
};

function ToolbarMenuEntry(props: ToolbarMenuEntryProps): JSX.Element {
  const [openChild, setOpenChild] = useState(false);
  const hasChildren = (props.item.items?.length ?? 0) > 0;

  return (
    <div
      style={{
        position: "relative",
        marginTop: props.item.separatorBefore ? "6px" : 0,
        paddingTop: props.item.separatorBefore ? "6px" : 0,
        borderTop: props.item.separatorBefore ? `1px solid ${ueShellColors.border}` : "none",
      }}
      onPointerEnter={() => setOpenChild(true)}
      onPointerLeave={() => setOpenChild(false)}
    >
      <button
        type="button"
        onClick={() => {
          if (hasChildren) {
            setOpenChild((prev) => !prev);
            return;
          }
          props.closeAll();
          props.item.onSelect?.();
        }}
        style={{
          width: "100%",
          padding: "7px 9px",
          borderRadius: "3px",
          color: ueShellColors.text,
          fontSize: "11px",
          cursor: "pointer",
          border: `1px solid ${ueShellColors.panel}`,
          background: "transparent",
          textAlign: "left",
          display: "flex",
          alignItems: props.item.hint ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <span style={{ display: "grid", gap: "2px", minWidth: 0 }}>
          <span>{props.item.label}</span>
          {props.item.hint ? (
            <span style={{ color: ueShellColors.textMuted, fontSize: "9px", lineHeight: 1.3, whiteSpace: "normal" }}>{props.item.hint}</span>
          ) : null}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {props.item.shortcut ? <span style={{ color: ueShellColors.textMuted, fontSize: "9px" }}>{props.item.shortcut}</span> : null}
          {hasChildren ? <span style={{ color: ueShellColors.textMuted, fontSize: "10px" }}>▸</span> : null}
        </span>
      </button>
      {hasChildren && openChild ? (
        <div
          style={{
            position: "absolute",
            top: "-6px",
            left: "calc(100% + 6px)",
            zIndex: 45,
          }}
        >
          <ToolbarMenuList items={props.item.items ?? []} closeAll={props.closeAll} />
        </div>
      ) : null}
    </div>
  );
}

export default function ToolbarMenu(props: ToolbarMenuProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onPointerDown = (event: PointerEvent): void => {
      if (rootRef.current?.contains(event.target as Node) !== true) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          padding: "4px 8px",
          borderRadius: "4px",
          color: open ? "#11161d" : ueShellColors.text,
          fontSize: "11px",
          fontWeight: 600,
          border: `1px solid ${open ? ueShellColors.accent : "transparent"}`,
          background: open ? ueShellColors.accent : "transparent",
          cursor: "pointer",
          letterSpacing: "0.03em",
        }}
      >
        {props.label}
      </button>
      {open ? (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 40,
          }}
        >
          <ToolbarMenuList items={props.items} closeAll={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
