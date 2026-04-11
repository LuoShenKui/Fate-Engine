import AssetLibraryPanel, { type AssetLibraryItem } from "./AssetLibraryPanel";
import BrickLibraryPanel, { type BrickImportPreview, type BrickLibraryItem } from "./BrickLibraryPanel";
import LeftWorkspacePanel from "./LeftWorkspacePanel";

type AppLeftWorkspaceProps = {
  hidden: boolean;
  hiddenPanels: {
    library: boolean;
    samples: boolean;
    assets: boolean;
    inspector: boolean;
    validation: boolean;
  };
  brickCount: number;
  assetCount: number;
  maximizeAction: JSX.Element;
  brickLibraryItems: BrickLibraryItem[];
  selectedBrick: string;
  recentBrickIds: string[];
  recommendedBrickIds: string[];
  highlightedBrickIds: string[];
  onSelectBrick: (id: string) => void;
  addBrickToScene: (brickId: string, position?: [number, number, number]) => void;
  onQuickPreviewBrick: (brickId: string) => void;
  onOpenSampleScene: (sampleId: "forest-cabin" | "basketball-court" | "patrol-guard") => void;
  onImportBrick: (json: string) => { ok: boolean; message: string };
  previewBrickImport: (input: string) => BrickImportPreview;
  onRemoveImportedBrick: (brickId: string) => { ok: boolean; message: string };
  onRollbackImportedBrick: (brickId: string) => { ok: boolean; message: string };
  onExportInstalledLockfile: () => void;
  onOpenBlankScene: () => void;
  assetLibraryItems: AssetLibraryItem[];
  selectedSlotId: string;
  onBindAssetToSelectedSlot: (assetRef: string) => void;
};

export default function AppLeftWorkspace(props: AppLeftWorkspaceProps): JSX.Element | undefined {
  if (props.hidden) {
    return undefined;
  }

  return (
    <LeftWorkspacePanel
      hiddenPanels={props.hiddenPanels}
      brickCount={props.brickCount}
      assetCount={props.assetCount}
      maximizeAction={props.maximizeAction}
      brickLibrary={
        <BrickLibraryPanel
          items={props.brickLibraryItems}
          selectedId={props.selectedBrick}
          recentIds={props.recentBrickIds}
          recommendedIds={props.recommendedBrickIds}
          highlightedIds={props.highlightedBrickIds}
          onSelect={props.onSelectBrick}
          onAddToScene={props.addBrickToScene}
          onQuickPreview={props.onQuickPreviewBrick}
          onOpenSample={props.onOpenSampleScene}
          onImportBrick={props.onImportBrick}
          onPreviewBrick={props.previewBrickImport}
          onRemoveBrick={props.onRemoveImportedBrick}
          onRollbackBrick={props.onRollbackImportedBrick}
          onExportLockfile={props.onExportInstalledLockfile}
          onOpenBlankScene={props.onOpenBlankScene}
        />
      }
      assetLibrary={<AssetLibraryPanel items={props.assetLibraryItems} selectedSlotId={props.selectedSlotId} onBindAsset={props.onBindAssetToSelectedSlot} />}
    />
  );
}
