import type { BrickCatalogEntry, RuntimeEventItem } from "./app-types";
import type { CompositeOverrideGroup, PropertyField } from "./PropertyInspectorPanel";
import type { ValidationItem } from "./ValidationPanel";

type Translate = (key: string, params?: Record<string, string>) => string;

export const buildSelectedEnemyBehaviorSummary = (category: string | undefined, selectedFields: PropertyField[]): Array<{ label: string; value: string }> =>
  category === "enemy"
    ? [
        { label: "Health", value: String(selectedFields.find((field) => field.key === "health")?.value ?? "-") },
        { label: "Patrol Route", value: String(selectedFields.find((field) => field.key === "patrolRoute")?.value ?? "-") },
        { label: "Attack Style", value: String(selectedFields.find((field) => field.key === "attackStyle")?.value ?? "-") },
      ]
    : [];

export const buildSelectedCompositeGroups = (
  selectedCatalogEntry: BrickCatalogEntry | undefined,
  selectedBrick: string,
  compositeOverridesByBrickId: Record<string, Record<string, string | number | boolean>>,
): CompositeOverrideGroup[] =>
  selectedCatalogEntry?.compositeParamGroups.map((group) => ({
    key: group.key,
    label: group.label,
    values: Object.entries(group.values).map(([key, defaultValue]) => ({
      key,
      value: compositeOverridesByBrickId[selectedBrick]?.[`${group.key}.${key}`] ?? defaultValue,
    })),
  })) ?? [];

export const buildActiveAbilityNames = (
  grantedPackageIds: string[],
  equippedPackageIds: string[],
  resolveAbilityName: (packageId: string) => string,
): string[] => [...new Set([...grantedPackageIds.map(resolveAbilityName), ...equippedPackageIds.map(resolveAbilityName)])];

export const buildBusinessValidationItems = (
  workspaceNotices: ValidationItem[],
  validationItems: ValidationItem[],
  activeAbilityNames: string[],
  events: RuntimeEventItem[],
  t: Translate,
): ValidationItem[] => [
  ...workspaceNotices,
  ...validationItems,
  ...(activeAbilityNames.length > 0 ? [{ level: "Info" as const, message: t("validation.activeAbilities", { count: String(activeAbilityNames.length), abilities: activeAbilityNames.join(", ") }) }] : []),
  ...events.filter((eventItem) => eventItem.source !== "camera").slice(-4).map((eventItem) => ({
    level: "Info" as const,
    message: t("validation.eventPrefix", {
      source: t(`validation.eventSource.${eventItem.source}`),
      eventText: eventItem.text,
    }),
  })),
];
