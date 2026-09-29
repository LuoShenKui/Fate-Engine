import { useState } from "react";
import AssetLibraryPanel, { type AssetLibraryItem } from "./AssetLibraryPanel";
import BrickLibraryPanel, { type BrickImportPreview, type BrickLibraryItem } from "./BrickLibraryPanel";
import LeftWorkspacePanel from "./LeftWorkspacePanel";
import HierarchyPanel from "./HierarchyPanel";
import type { CanvasNode } from "./GraphCanvasPanel";
import { ueShellColors } from "./ue-shell-theme";

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
  nodes: CanvasNode[];
  selectedSceneNodeId: string;
  onSelectSceneNode: (nodeId: string) => void;
};

export default function AppLeftWorkspace(props: AppLeftWorkspaceProps): JSX.Element | undefined {
  const [mode, setMode] = useState<"hierarchy" | "advanced">("hierarchy");
  if (props.hidden) return undefined;

  return (
    <div style={{ display: "grid", gridTemplateRows: "30px minmax(0,1fr)", height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 8px", borderBottom: `1px solid ${ueShellColors.border}`, background: ueShellColors.panelMuted }}>
        <button type="button" onClick={() => setMode("hierarchy")} style={{ border: 0, background: "transparent", color: mode === "hierarchy" ? "#fff" : ueShellColors.textMuted, fontWeight: 700, fontSize: "11px", cursor: "pointer" }}>Hierarchy</button>
        <button type="button" onClick={() => setMode("advanced")} style={{ border: 0, background: "transparent", color: mode === "advanced" ? "#fff" : ueShellColors.textMuted, fontWeight: 700, fontSize: "11px", cursor: "pointer" }}>Advanced</button>
      </div>
      <div style={{ minHeight: 0 }}>
        {mode === "hierarchy" ? (
          <HierarchyPanel nodes={props.nodes} selectedNodeId={props.selectedSceneNodeId} onSelectNode={props.onSelectSceneNode} />
        ) : (
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
        )}
      </div>
    </div>
  );
}
