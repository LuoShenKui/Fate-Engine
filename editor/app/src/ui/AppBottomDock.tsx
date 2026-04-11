import AppValidationDock from "./AppValidationDock";
import type { ValidationItem } from "./ValidationPanel";
import type { BatchValidationStats } from "../workflow/validation";

type AppBottomDockProps = {
  playtestFullscreen: boolean;
  validationHidden: boolean;
  validationExpanded: boolean;
  items: ValidationItem[];
  protocolItems: ValidationItem[];
  batchEntries: Array<{ recipeId: string; items: ValidationItem[] }>;
  batchStatsDiff: BatchValidationStats;
  onToggleExpanded: () => void;
  onClose: () => void;
  maximized: boolean;
  onToggleMaximize: () => void;
};

export default function AppBottomDock(props: AppBottomDockProps): JSX.Element {
  return (
    <AppValidationDock
      hidden={props.playtestFullscreen || (props.validationHidden && !props.validationExpanded)}
      expanded={props.validationExpanded}
      items={props.items}
      protocolItems={props.protocolItems}
      batchEntries={props.batchEntries}
      batchStatsDiff={props.batchStatsDiff}
      onToggleExpanded={props.onToggleExpanded}
      onClose={props.onClose}
      maximized={props.maximized}
      onToggleMaximize={props.onToggleMaximize}
    />
  );
}
