type DebugToolbarProps = {
  locked: boolean;
  onInteract: () => void;
  onToggleLock: () => void;
  onImport: () => void;
  onExport: () => void;
  onSave: () => void;
  onLoad: () => void;
};

export default function DebugToolbar(props: DebugToolbarProps): JSX.Element {
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
      <strong>DebugToolbar</strong>
      <button type="button" onClick={props.onInteract}>
        Interact
      </button>
      <button type="button" onClick={props.onToggleLock}>
        SetState(locked={String(props.locked)})
      </button>
      <button type="button" onClick={props.onImport}>
        导入
      </button>
      <button type="button" onClick={props.onExport}>
        导出
      </button>
      <button type="button" onClick={props.onSave}>
        保存
      </button>
      <button type="button" onClick={props.onLoad}>
        加载
      </button>
    </div>
  );
}
