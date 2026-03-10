import type { CanvasEdge, CanvasNode } from "../ui/GraphCanvasPanel";
import demoSceneData from "./demoSceneData.json";

type DemoSceneData = {
  id: string;
  name: string;
  seed: number;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};

const typedDemoSceneData = demoSceneData as DemoSceneData;

export const DEFAULT_EDITOR_DEMO_SEED = typedDemoSceneData.seed;
export const DEFAULT_EDITOR_DEMO_SCENE_ID = typedDemoSceneData.id;
export const DEFAULT_EDITOR_DEMO_SCENE_NAME = typedDemoSceneData.name;

export const createDefaultEditorDemoNodes = (): CanvasNode[] =>
  typedDemoSceneData.nodes.map((node) => ({
    ...node,
    transform: node.transform === undefined
      ? undefined
      : {
          position: node.transform.position ? [...node.transform.position] as [number, number, number] : undefined,
          rotation: node.transform.rotation ? [...node.transform.rotation] as [number, number, number] : undefined,
        },
  }));

export const createDefaultEditorDemoEdges = (): CanvasEdge[] =>
  typedDemoSceneData.edges.map((edge) => ({
    ...edge,
  }));
