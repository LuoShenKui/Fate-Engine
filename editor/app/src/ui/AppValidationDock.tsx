import ValidationPanel, { type ValidationItem } from "./ValidationPanel";
import ValidationSummaryBar from "./ValidationSummaryBar";
import { ueGhostButton, uePanelSurface, ueShellColors } from "./ue-shell-theme";

type AppValidationDockProps = {
  hidden: boolean;
  expanded: boolean;
  items: ValidationItem[];
  protocolItems: ValidationItem[];
  batchEntries: Array<{ recipeId: string; items: ValidationItem[] }>;
  batchStatsDiff: { totalErrors: number; totalWarnings: number };
  onToggleExpanded: () => void;
  onClose: () => void;
  maximized?: boolean;
  onToggleMaximize?: () => void;
};

export default function AppValidationDock(props: AppValidationDockProps): JSX.Element | undefined {
  if (props.hidden) {
    return undefined;
  }

  return (
    <div style={{ ...uePanelSurface, display: "grid", gap: "8px", padding: "8px", borderRadius: "8px", background: ueShellColors.frameRaised }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center" }}>
        <ValidationSummaryBar items={props.items} protocolItems={props.protocolItems} expanded={props.expanded} onToggleExpanded={props.onToggleExpanded} />
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {props.onToggleMaximize !== undefined ? (
            <button type="button" onClick={props.onToggleMaximize} style={{ ...ueGhostButton, padding: "3px 8px", fontSize: "10px" }}>
              {props.maximized ? "restore" : "maximize"}
            </button>
          ) : null}
          <button type="button" onClick={props.onClose} style={{ ...ueGhostButton, padding: "3px 8px", fontSize: "10px" }}>
            close
          </button>
        </div>
      </div>
      {props.expanded ? <ValidationPanel items={props.items} businessItems={props.items} protocolItems={props.protocolItems} batchEntries={props.batchEntries} batchStatsDiff={props.batchStatsDiff} /> : null}
    </div>
  );
}
