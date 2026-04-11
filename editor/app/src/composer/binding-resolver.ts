import { withDefaultComposeHints } from "./default-hints";
import type {
  ComposeBindingSummaryItem,
  ComposeDiagnostic,
  ComposePlanNode,
  ComposerAssetItem,
  ComposerCatalogEntry,
} from "./types";

const emptySource = {
  sourcePackageId: "builtin",
  sourcePackageVersion: "n/a",
  sourceResourceId: "fallback",
} as const;

const inferSlotType = (slot: ComposerCatalogEntry["slots"][number], defaultResourceType?: string): string => {
  if (typeof slot.slotType === "string" && slot.slotType.length > 0) {
    return slot.slotType;
  }
  if (typeof defaultResourceType === "string" && defaultResourceType.length > 0) {
    return defaultResourceType;
  }
  const prefix = slot.slotId.split(".")[0];
  return prefix === "mesh" || prefix === "material" || prefix === "anim" || prefix === "prefab" || prefix === "audio" || prefix === "vfx" || prefix === "volume"
    ? prefix
    : slot.slotId.startsWith("socket.") || slot.slotId.startsWith("ui.") || slot.slotId.startsWith("input.") || slot.slotId.startsWith("data.")
      ? "script_ref"
      : "unknown";
};

export const resolveComposeBindings = (
  plannedNodes: ComposePlanNode[],
  catalogEntries: ComposerCatalogEntry[],
  assetItems: ComposerAssetItem[],
): { bindingSummary: ComposeBindingSummaryItem[]; diagnostics: ComposeDiagnostic[] } => {
  const diagnostics: ComposeDiagnostic[] = [];
  const bindingSummary: ComposeBindingSummaryItem[] = [];
  const catalogByBrickId = new Map(catalogEntries.map((entry) => [entry.id, withDefaultComposeHints(entry)] as const));

  for (const plannedNode of plannedNodes) {
    const entry = catalogByBrickId.get(plannedNode.brickId);
    if (entry === undefined) {
      continue;
    }
    for (const slot of entry.slots) {
      const defaultBinding = entry.defaultAssetBindings.find((binding) => binding.slotId === slot.slotId);
      const expectedSlotType = inferSlotType(slot, defaultBinding?.resourceType);
      const formalAssetById = defaultBinding === undefined
        ? undefined
        : assetItems.find(
            (assetItem) =>
              assetItem.packageId === defaultBinding.assetPackageId
              && assetItem.resourceId === defaultBinding.resourceId,
          );
      const formalAsset = formalAssetById?.resourceType === defaultBinding?.resourceType ? formalAssetById : undefined;

      if (formalAsset !== undefined) {
        bindingSummary.push({
          slotId: slot.slotId,
          bindingKind: "formal",
          resolutionStatus: "formal_resolved",
          assetRef: formalAsset.assetRef,
          resourceType: formalAsset.resourceType,
          expectedSlotType,
          resolvedResourceType: formalAsset.resourceType,
          sourcePackageId: formalAsset.packageId,
          sourcePackageVersion: formalAsset.packageVersion,
          sourceResourceId: formalAsset.resourceId,
          issues: [],
          reason: `Matched formal asset binding from ${formalAsset.packageId}.`,
        });
        continue;
      }

      if (typeof slot.fallbackAssetRef === "string" && slot.fallbackAssetRef.trim().length > 0) {
        const formalIssues =
          defaultBinding === undefined
            ? []
            : formalAssetById === undefined
              ? [`FORMAL_BINDING_UNAVAILABLE: ${defaultBinding.assetPackageId}/${defaultBinding.resourceId}`]
              : [`FORMAL_BINDING_TYPE_MISMATCH: expected ${defaultBinding.resourceType}, got ${formalAssetById.resourceType}`];
        bindingSummary.push({
          slotId: slot.slotId,
          bindingKind: "fallback",
          resolutionStatus: defaultBinding === undefined ? "fallback_only" : "formal_missing",
          assetRef: slot.fallbackAssetRef,
          resourceType: defaultBinding?.resourceType ?? "unknown",
          expectedSlotType,
          resolvedResourceType: defaultBinding?.resourceType ?? "unknown",
          ...emptySource,
          issues: formalIssues,
          reason: `Using product fallback for ${slot.slotId}.`,
        });
        if (defaultBinding !== undefined) {
          diagnostics.push({
            code: formalAssetById === undefined ? "missing_formal_binding" : "slot_type_mismatch",
            severity: "error",
            message:
              formalAssetById === undefined
                ? `Formal binding is missing for ${plannedNode.brickId}/${slot.slotId}.`
                : `Formal binding type mismatch for ${plannedNode.brickId}/${slot.slotId}.`,
            target: `${plannedNode.brickId}:${slot.slotId}`,
          });
        }
        continue;
      }

      bindingSummary.push({
        slotId: slot.slotId,
        bindingKind: "unresolved",
        resolutionStatus: "unresolved",
        assetRef: "",
        resourceType: defaultBinding?.resourceType ?? "unknown",
        expectedSlotType,
        resolvedResourceType: "",
        ...emptySource,
        issues: [`ASSET_BINDING_MISSING: ${slot.slotId}`],
        reason: `No formal asset or fallback was available for ${slot.slotId}.`,
      });
      diagnostics.push({
        code: "missing_asset_binding",
        severity: slot.optional ? "warning" : "error",
        message: `No binding could be resolved for ${plannedNode.brickId}/${slot.slotId}.`,
        target: `${plannedNode.brickId}:${slot.slotId}`,
      });
    }
  }

  return { bindingSummary, diagnostics };
};
