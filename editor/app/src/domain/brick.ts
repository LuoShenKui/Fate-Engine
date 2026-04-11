export type BrickPortDirection = "input" | "output";

export type BrickWhiteboxMetadata = {
  style: string;
  artStyle: string;
  semanticTags: string[];
  notes: string;
  realWorldScale: string;
  actorClass: string;
  interactionIntent: string;
  unitSystem: "metric" | "imperial";
};

export type BrickPort = {
  id: string;
  name: string;
  direction: BrickPortDirection;
  dataType: string;
  description: string;
};

export type BrickPropertySchema = {
  key: string;
  label: string;
  type: "boolean" | "number" | "string";
  defaultValue: boolean | number | string;
  description: string;
  group?: string;
  unit?: string;
};

export type BrickDefinition = {
  id: string;
  name: string;
  summary: string;
  properties: BrickPropertySchema[];
  slots: BrickSlotSchema[];
  ports: BrickPort[];
  metadata?: BrickWhiteboxMetadata;
};

export type BrickSlotSchema = {
  slotId: string;
  label: string;
  optional: boolean;
  fallbackAssetRef?: string;
  slotType?: "mesh" | "material" | "anim" | "prefab" | "audio" | "vfx" | "script_ref" | "volume";
};
