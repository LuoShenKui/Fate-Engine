import type { ValidationItem } from "./ValidationPanel";
import { ueGhostButton, ueShellColors } from "./ue-shell-theme";

type ValidationSummaryBarProps = {
  items: ValidationItem[];
  protocolItems: ValidationItem[];
  expanded: boolean;
  onToggleExpanded: () => void;
};

const countLevel = (items: ValidationItem[], level: ValidationItem["level"]): number => items.filter((item) => item.level === level).length;

export default function ValidationSummaryBar(props: ValidationSummaryBarProps): JSX.Element {
  const allItems = [...props.items, ...props.protocolItems];
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <strong style={{ fontSize: "13px", color: ueShellColors.text }}>校验</strong>
        <span style={{ fontSize: "12px", color: ueShellColors.textMuted }}>
          {`${countLevel(allItems, "Error")} 错误 / ${countLevel(allItems, "Warning")} 警告 / ${countLevel(allItems, "Info")} 信息`}
        </span>
      </div>
      <button
        type="button"
        onClick={props.onToggleExpanded}
        style={{ ...ueGhostButton, padding: "6px 10px", fontSize: "12px", fontWeight: 700 }}
      >
        {props.expanded ? "收起结果" : "展开结果"}
      </button>
    </div>
  );
}
