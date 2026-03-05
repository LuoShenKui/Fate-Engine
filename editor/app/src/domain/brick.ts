export type BrickPortDirection = "input" | "output";

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
};

export type BrickDefinition = {
  id: string;
  name: string;
  summary: string;
  properties: BrickPropertySchema[];
  slots: BrickSlotSchema[];
  ports: BrickPort[];
};

export type BrickSlotSchema = {
  slotId: string;
  label: string;
  optional: boolean;
  fallbackAssetRef?: string;
};
