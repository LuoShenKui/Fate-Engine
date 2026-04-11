import type { BrickDefinition } from "../domain/brick";
import { DoorBrickDefinition } from "../domain/door";
import type { PropertyField } from "./PropertyInspectorPanel";

export const inferPropertyGroup = (key: string): string => {
  const normalized = key.toLowerCase();
  if (normalized.includes("height") || normalized.includes("radius") || normalized.includes("mass") || normalized.includes("distance") || normalized.includes("stride")) {
    return "Scale";
  }
  if (normalized.includes("speed") || normalized.includes("jump") || normalized.includes("cooldown") || normalized.includes("aircontrol")) {
    return "Movement";
  }
  if (normalized.includes("mesh") || normalized.includes("display") || normalized.includes("theme")) {
    return "Presentation";
  }
  if (normalized.includes("route") || normalized.includes("attack") || normalized.includes("angle") || normalized.includes("radius")) {
    return "Gameplay";
  }
  if (normalized.includes("enabled") || normalized.includes("locked") || normalized.includes("open") || normalized.includes("active")) {
    return "State";
  }
  if (normalized.includes("input") || normalized.includes("ability")) {
    return "Integration";
  }
  return "General";
};

export const parseFieldDraftMap = (value: unknown): Record<string, PropertyField[]> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, PropertyField[]>>((acc, [id, rawFields]) => {
    if (!Array.isArray(rawFields)) {
      return acc;
    }
    const fields = rawFields
      .filter((field): field is Record<string, unknown> => typeof field === "object" && field !== null)
      .map((field) => {
        const value = field.value;
        const defaultValue = "defaultValue" in field ? field.defaultValue : value;
        const packageValue = "packageValue" in field ? field.packageValue : defaultValue;
        const sceneValue = "sceneValue" in field ? field.sceneValue : value;
        return {
          key: typeof field.key === "string" ? field.key : "",
          label: typeof field.label === "string" ? field.label : "",
          value: typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? value : "",
          defaultValue: typeof defaultValue === "string" || typeof defaultValue === "number" || typeof defaultValue === "boolean" ? defaultValue : "",
          packageValue: typeof packageValue === "string" || typeof packageValue === "number" || typeof packageValue === "boolean" ? packageValue : "",
          sceneValue: typeof sceneValue === "string" || typeof sceneValue === "number" || typeof sceneValue === "boolean" ? sceneValue : "",
          group: typeof field.group === "string" && field.group.length > 0 ? field.group : inferPropertyGroup(typeof field.key === "string" ? field.key : ""),
        };
      })
      .filter((field) => field.key.length > 0 && field.label.length > 0);
    if (fields.length > 0) {
      acc[id] = fields;
    }
    return acc;
  }, {});
};

export const toPropertyFields = (definition?: BrickDefinition): PropertyField[] =>
  (definition?.properties ?? DoorBrickDefinition.properties).map((property) => ({
    key: property.key,
    label: property.label,
    value: property.defaultValue,
    defaultValue: property.defaultValue,
    packageValue: property.defaultValue,
    sceneValue: property.defaultValue,
    group: inferPropertyGroup(property.key),
  }));

export const buildResolvedPropertyFields = (
  definition: BrickDefinition | undefined,
  sceneFields?: PropertyField[],
  instanceFields?: PropertyField[],
): PropertyField[] => {
  const baseFields = toPropertyFields(definition);
  return baseFields.map((baseField) => {
    const sceneField = sceneFields?.find((field) => field.key === baseField.key);
    const sceneValue = sceneField?.value ?? baseField.packageValue;
    const instanceField = instanceFields?.find((field) => field.key === baseField.key);
    const value = instanceField?.value ?? sceneValue;
    return {
      ...baseField,
      value,
      defaultValue: baseField.packageValue,
      packageValue: baseField.packageValue,
      sceneValue,
      group: sceneField?.group ?? instanceField?.group ?? baseField.group,
    };
  });
};

export const parseInstanceFieldDrafts = (value: unknown): Record<string, PropertyField[]> => parseFieldDraftMap(value);

export const initialFields: PropertyField[] = DoorBrickDefinition.properties.map((property) => ({
  key: property.key,
  label: property.label,
  value: property.defaultValue,
  defaultValue: property.defaultValue,
  packageValue: property.defaultValue,
  sceneValue: property.defaultValue,
  group: inferPropertyGroup(property.key),
}));
