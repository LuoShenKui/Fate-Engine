import type { BrickCatalogEntry } from "./app-types";
import GraphCanvasPanel, { type CanvasEdge, type CanvasNode } from "./GraphCanvasPanel";
import { dockHeaderButtonStyle, renderDockSection } from "./app-chrome";
import type { GraphCanvasWorldLabel } from "./graph-canvas-types";
import { resolveRuntimeKind } from "./app-scene";

type AppViewportSectionProps = {
  selectedSceneNodeId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  catalogEntries: BrickCatalogEntry[];
  selectedBrick: string;
  addBrickToScene: (brickId: string, position?: [number, number, number]) => void;
  activeAbilityNames: string[];
  worldLabels: GraphCanvasWorldLabel[];
  onGraphChange: (next: { nodes: CanvasNode[]; edges: CanvasEdge[] }) => void;
  onSelectNode: (nodeId: string) => void;
  onTriggerZoneStateChange: (zoneId: string, active: boolean) => void;
  onDoorPositionsChange: (positions: Record<string, [number, number, number]>) => void;
  onActorPositionChange: (position: [number, number, number]) => void;
  onInteract: (nodeId?: string) => void;
  onViewportEvent: (text: string) => void;
  playtestFullscreen: boolean;
  onExitPlaytestFullscreen: () => void;
  onTogglePlaytestFullscreen: () => void;
  maximizeAction: JSX.Element;
};

export default function AppViewportSection(props: AppViewportSectionProps): JSX.Element {
  const viewportActions = (
    <>
      <span style={{ fontSize: "10px", color: "#91a0b2", padding: "0 4px" }}>Shaded</span>
      <button type="button" onClick={props.onTogglePlaytestFullscreen} style={dockHeaderButtonStyle}>
        {props.playtestFullscreen ? "Game" : "Scene / Game"}
      </button>
      {props.maximizeAction}
    </>
  );

  return renderDockSection(
    "Scene",
    `Selected: ${props.selectedSceneNodeId}`,
    <GraphCanvasPanel
      nodes={props.nodes}
      edges={props.edges}
      resolveNodeKind={(nodeType) => resolveRuntimeKind(nodeType ?? "generic", props.catalogEntries)}
      defaultNodeType={props.selectedBrick}
      onDropBrick={props.addBrickToScene}
      actorLabel="player_1 / humanoid"
      activeAbilityNames={props.activeAbilityNames}
      worldLabels={props.worldLabels}
      onChange={props.onGraphChange}
      onSelectNode={props.onSelectNode}
      onTriggerZoneStateChange={props.onTriggerZoneStateChange}
      onDoorPositionsChange={props.onDoorPositionsChange}
      onActorPositionChange={props.onActorPositionChange}
      onInteract={props.onInteract}
      onViewportEvent={props.onViewportEvent}
      playtestFullscreen={props.playtestFullscreen}
      onExitPlaytestFullscreen={props.onExitPlaytestFullscreen}
    />,
    viewportActions,
  );
}
