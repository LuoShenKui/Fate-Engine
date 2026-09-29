import type { ValidationItem } from "./ValidationPanel";
import type { BatchValidationStats } from "../workflow/validation";
import type { AssetLibraryItem } from "./AssetLibraryPanel";
import ProjectConsoleDock from "./ProjectConsoleDock";

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
  assetLibraryItems: AssetLibraryItem[];
};

export default function AppBottomDock(props: AppBottomDockProps): JSX.Element {
  if (props.playtestFullscreen) return <></>;
  return <ProjectConsoleDock assets={props.assetLibraryItems} validationItems={props.items} protocolItems={props.protocolItems} />;
}
