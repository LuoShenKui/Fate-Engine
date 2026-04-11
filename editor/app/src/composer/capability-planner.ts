import { withDefaultComposeHints } from "./default-hints";
import { CAPABILITY_ORDER, PREFERRED_ENTRY_IDS, nodeIdForCapability } from "./capability-map";
import type { ComposeCapabilityId, ComposeDiagnostic, ComposeIntent, ComposePlan, ComposePlanNode, ComposerCatalogEntry } from "./types";

const findEntryForCapability = (capabilityId: ComposeCapabilityId, catalogEntries: ComposerCatalogEntry[]): ComposerCatalogEntry | undefined => {
  const preferredId = PREFERRED_ENTRY_IDS[capabilityId];
  const normalizedEntries = catalogEntries.map(withDefaultComposeHints).filter((entry) => entry.packageKind !== "asset" && entry.installState !== "blocked");
  return (
    normalizedEntries.find((entry) => entry.id === preferredId) ??
    normalizedEntries.find((entry) => entry.composeHints?.requiredCapabilities.includes(capabilityId))
  );
};

export const buildComposePlan = (
  intent: ComposeIntent,
  catalogEntries: ComposerCatalogEntry[],
): { plan: ComposePlan; diagnostics: ComposeDiagnostic[] } => {
  const nodes: ComposePlanNode[] = [];
  const diagnostics: ComposeDiagnostic[] = [];
  const requiredAssetPackages = new Set<string>();
  const missingCapabilities: ComposeCapabilityId[] = [];

  for (const capabilityId of CAPABILITY_ORDER.filter((candidate) => intent.capabilityIds.includes(candidate))) {
    const entry = findEntryForCapability(capabilityId, catalogEntries);
    if (entry === undefined) {
      missingCapabilities.push(capabilityId);
      diagnostics.push({
        code: "missing_package",
        severity: "error",
        message: `No installable package was found for ${capabilityId}.`,
        target: capabilityId,
      });
      continue;
    }
    entry.assetDependencies.forEach((assetPackageId) => requiredAssetPackages.add(assetPackageId));
    nodes.push({
      capabilityId,
      nodeId: nodeIdForCapability(capabilityId),
      brickId: entry.id,
      packageId: entry.packageId,
      version: entry.version,
      summary: entry.summary,
    });
  }

  return {
    plan: {
      nodes,
      missingCapabilities,
      requiredAssetPackages: [...requiredAssetPackages],
    },
    diagnostics,
  };
};
