import { useEffect, useRef, useState } from "react";
import { ueShellColors } from "./ue-shell-theme";

type ToolbarMenuItem = {
  label: string;
  onSelect: () => void;
};

type ToolbarMenuProps = {
  label: string;
  items: ToolbarMenuItem[];
};

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
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            minWidth: "196px",
            padding: "6px",
            borderRadius: "4px",
            border: `1px solid ${ueShellColors.borderStrong}`,
            background: ueShellColors.panel,
            boxShadow: "0 14px 24px rgba(0, 0, 0, 0.28)",
            zIndex: 40,
          }}
        >
          {props.items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setOpen(false);
                item.onSelect();
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
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
