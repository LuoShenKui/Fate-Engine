export type BrickTagGroup = "styleTags" | "platformTags" | "themeTags" | "interactionTags";

export type BrickTags = {
  styleTags: string[];
  platformTags: string[];
  themeTags: string[];
  interactionTags: string[];
};

export const emptyBrickTags = (): BrickTags => ({
  styleTags: [],
  platformTags: [],
  themeTags: [],
  interactionTags: [],
});

const normalizeTagList = (value: unknown): string[] =>
  Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter((item) => item.length > 0))] : [];

export const parseBrickTags = (value: unknown): BrickTags => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return emptyBrickTags();
  }
  const record = value as Record<string, unknown>;
  return {
    styleTags: normalizeTagList(record.styleTags ?? record.style_tags),
    platformTags: normalizeTagList(record.platformTags ?? record.platform_tags),
    themeTags: normalizeTagList(record.themeTags ?? record.theme_tags),
    interactionTags: normalizeTagList(record.interactionTags ?? record.interaction_tags),
  };
};

export const hasTagOverlap = (left: string[], right: string[]): boolean => left.length === 0 || right.length === 0 || left.some((item) => right.includes(item));

export const areBrickTagsCompatible = (left: BrickTags, right: BrickTags): boolean =>
  hasTagOverlap(left.styleTags, right.styleTags) &&
  hasTagOverlap(left.platformTags, right.platformTags) &&
  hasTagOverlap(left.themeTags, right.themeTags);

export const formatBrickTags = (tags: BrickTags): Array<{ label: string; values: string[] }> => [
  { label: "Style", values: tags.styleTags },
  { label: "Platform", values: tags.platformTags },
  { label: "Theme", values: tags.themeTags },
  { label: "Interaction", values: tags.interactionTags },
].filter((item) => item.values.length > 0);
