import type { BrickDefinition, BrickWhiteboxMetadata } from "../domain/brick";
import type { InstallReportItem } from "./InstallReportPanel";
import { BUILTIN_SCENE_CATEGORY } from "./app-constants";
import { emptyBrickTags } from "./brick-tags";
import { getDefaultComposeHints } from "./compose-hints";
import type { BrickCatalogEntry } from "./app-types";

const defaultWhiteboxMetadata = (): BrickWhiteboxMetadata => ({
  style: "neutral",
  artStyle: "prototype",
  semanticTags: [],
  notes: "",
  realWorldScale: "1 unit = 1 meter",
  actorClass: "generic",
  interactionIntent: "general",
  unitSystem: "metric",
});

export const toCatalogEntry = (definition: BrickDefinition, source: "builtin" | "imported", overrides?: Partial<BrickCatalogEntry>): BrickCatalogEntry => ({
  ...definition,
  packageId: overrides?.packageId ?? `fate.${definition.id}`,
  version: overrides?.version ?? "0.1.0",
  license: overrides?.license ?? "Proprietary",
  dependencies: overrides?.dependencies ?? [],
  compat: overrides?.compat ?? "editor>=0.1.0",
  contractVersion: overrides?.contractVersion ?? "0.1",
  packageKind: overrides?.packageKind ?? "product",
  supportedActorTypes: overrides?.supportedActorTypes ?? [],
  category: overrides?.category ?? BUILTIN_SCENE_CATEGORY,
  source,
  installState: overrides?.installState ?? "ready",
  importIssues: overrides?.importIssues ?? [],
  runtimeKind: overrides?.runtimeKind ?? (definition.id === "door" || definition.id === "switch" || definition.id === "ladder" || definition.id === "trigger-zone" || definition.id === "enemy" ? definition.id : "generic"),
  compositeChildren: overrides?.compositeChildren ?? [],
  compositeEdges: overrides?.compositeEdges ?? [],
  compositeParamGroups: overrides?.compositeParamGroups ?? [],
  grantedAbilityPackageIds: overrides?.grantedAbilityPackageIds ?? [],
  assetDependencies: overrides?.assetDependencies ?? [],
  defaultAssetBindings: overrides?.defaultAssetBindings ?? [],
  resources: overrides?.resources ?? [],
  tags: overrides?.tags ?? emptyBrickTags(),
  whiteboxMetadata: overrides?.whiteboxMetadata ?? definition.metadata ?? defaultWhiteboxMetadata(),
  composeHints: overrides?.composeHints ?? getDefaultComposeHints(definition.id),
});

export const compareSemver = (left: string, right: string): number => {
  const leftParts = left.split(".").map((part) => Number(part));
  const rightParts = right.split(".").map((part) => Number(part));
  for (let index = 0; index < 3; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;
    if (leftValue < rightValue) return -1;
    if (leftValue > rightValue) return 1;
  }
  return 0;
};

export const versionMatches = (version: string, requirement: string): boolean => {
  const match = /^(>=|<=|>|<|=)?([0-9]+\.[0-9]+\.[0-9]+)$/.exec(requirement.trim());
  if (match === null) {
    return false;
  }
  const operator = match[1] ?? "=";
  const requiredVersion = match[2];
  const result = compareSemver(version, requiredVersion);
  if (operator === "=") return result === 0;
  if (operator === ">") return result > 0;
  if (operator === ">=") return result >= 0;
  if (operator === "<") return result < 0;
  if (operator === "<=") return result <= 0;
  return false;
};

export const parseDependencyList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    if (typeof item === "string") {
      return [item];
    }
    if (typeof item === "object" && item !== null) {
      const dep = item as Record<string, unknown>;
      const depId = typeof dep.id === "string" ? dep.id : null;
      const depVersion = typeof dep.version === "string" ? dep.version : null;
      if (depId !== null && depVersion !== null) {
        return [`${depId}@${depVersion}`];
      }
      if (depId !== null) {
        return [depId];
      }
    }
    return [];
  });
};

export const parseDependencyRequirement = (raw: string): { id: string; requirement: string | null } => {
  const atIndex = raw.indexOf("@");
  if (atIndex <= 0) {
    return { id: raw, requirement: null };
  }
  return { id: raw.slice(0, atIndex), requirement: raw.slice(atIndex + 1) };
};

export const normalizeDependencyVersion = (requirement: string | null, fallback: string): string => {
  if (requirement === null) {
    return fallback;
  }
  const match = /([0-9]+\.[0-9]+\.[0-9]+)/.exec(requirement);
  return match?.[1] ?? fallback;
};

export const inferRuntimeKindFromPackageId = (packageId: string): BrickCatalogEntry["runtimeKind"] => {
  const normalized = packageId.toLowerCase();
  if (normalized.includes("trigger")) return "trigger-zone";
  if (normalized.includes("ladder")) return "ladder";
  if (normalized.includes("switch") || normalized.includes("button") || normalized.includes("lever")) return "switch";
  if (normalized.includes("door")) return "door";
  if (normalized.includes("enemy") || normalized.includes("guard") || normalized.includes("aggro") || normalized.includes("spawner")) return "enemy";
  return "generic";
};

export const toInstallReportItems = (entries: BrickCatalogEntry[]): InstallReportItem[] =>
  entries.reduce<InstallReportItem[]>((acc, entry) => {
    if (entry.importIssues.length === 0) {
      acc.push({ level: "Info", code: "READY", brickId: entry.id, brickName: entry.name, detail: `${entry.packageId}@${entry.version} is ready to use.` });
      return acc;
    }
    entry.importIssues.forEach((issue) => {
      if (issue.startsWith("ENGINE_INCOMPATIBLE")) {
        acc.push({ level: "Error", code: "ENGINE_INCOMPATIBLE", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Use a compatible engine version or import a compatible brick version." });
        return;
      }
      if (issue.startsWith("DEPENDENCY_MISSING")) {
        acc.push({ level: "Warning", code: "DEPENDENCY_MISSING", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Install the required dependency package first." });
        return;
      }
      if (issue.startsWith("DEPENDENCY_VERSION_CONFLICT")) {
        acc.push({ level: "Warning", code: "DEPENDENCY_VERSION_CONFLICT", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Roll back or upgrade the dependency to a matching version." });
        return;
      }
      if (issue.startsWith("CONTRACT_INCOMPATIBLE")) {
        acc.push({ level: "Error", code: "CONTRACT_INCOMPATIBLE", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Switch to a package built for the supported contract version." });
        return;
      }
      if (issue.startsWith("SLOT_DEFAULT_MISSING")) {
        acc.push({ level: "Warning", code: "SLOT_DEFAULT_MISSING", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Provide a fallback asset or bind the slot before using this package." });
        return;
      }
      if (issue.startsWith("MANIFEST_METADATA_MISSING")) {
        acc.push({ level: "Warning", code: "MANIFEST_METADATA_MISSING", brickId: entry.id, brickName: entry.name, detail: issue, suggestion: "Import a package with embedded manifest details for direct use." });
        return;
      }
      acc.push({ level: "Warning", code: "IMPORT_REVIEW", brickId: entry.id, brickName: entry.name, detail: issue });
    });
    return acc;
  }, []);

