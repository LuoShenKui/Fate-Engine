type DebugToolbarProps = {
  locked: boolean;
  onInteract: () => void;
  onToggleLock: () => void;
};

export default function DebugToolbar(props: DebugToolbarProps): JSX.Element {
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <strong>DebugToolbar</strong>
      <button type="button" onClick={props.onInteract}>
        Interact
      </button>
      <button type="button" onClick={props.onToggleLock}>
        SetState(locked={String(props.locked)})
      </button>
    </div>
  );
}
