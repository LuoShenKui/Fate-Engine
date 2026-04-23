import type { BrickDefinition } from "../domain/brick";
import type { AgentApplyReport, AgentComposeResult, ComposeResult } from "../composer";
import type { UnityExportManifest } from "../project/unity-export";
import type {
  AvatarTemplateRecord,
  ConversationSessionRecord,
  DialogueCandidateRecord,
  DialogueTurnRecord,
  NarrativeDemoFixture,
  NarrativeHistoryTurnRecord,
  PlayerAvatarRecord,
  RuntimeAiHealthResponse,
  RuntimeDialogueChoiceResponse,
} from "./runtime-narrative-client";
import { getBrickPreviewSrc, getReadinessSummary, resolveRuntimeKind } from "./app-scene";
import type { BrickCatalogEntry } from "./app-types";
import type { RenderAppRightPanelArgs } from "./app-right-panel";
import type { CompositeOverrideGroup, PropertyField } from "./PropertyInspectorPanel";
import type { InstallReportItem } from "./InstallReportPanel";
import type { BrickTags } from "./brick-tags";

type Translate = (key: string, params?: Record<string, string>) => string;

type BuildRightPanelStateArgs = {
  t: Translate;
  activeRightPanelTab: RenderAppRightPanelArgs["activeRightPanelTab"];
  setActiveRightPanelTab: RenderAppRightPanelArgs["setActiveRightPanelTab"];
  selectedBrick: string;
  selectedBrickDefinition?: BrickDefinition;
  selectedCatalogEntry?: BrickCatalogEntry;
  composePrompt: string;
  setComposePrompt: (value: string) => void;
  composeMode: "rules" | "agent";
  setComposeMode: (value: "rules" | "agent") => void;
  composeHistory: string[];
  composeResult: ComposeResult | null;
  agentResult: AgentComposeResult | null;
  lastAgentApplyReport: AgentApplyReport | null;
  canRollbackAgentApply: boolean;
  onCompose: () => Promise<void> | void;
  onApplyComposeDraft: () => void;
  onRollbackAgentApply: () => void;
  onReuseComposeHistory: (value: string) => void;
  selectedGrantedAbilityPackageIds: string[];
  selectedEnemyBehaviorSummary: Array<{ label: string; value: string }>;
  selectedAbilityEquipped: boolean;
  activeAbilityNames: string[];
  installReportItems: InstallReportItem[];
  addBrickToScene: (brickId: string, position?: [number, number, number]) => void;
  onInspectInstallReportBrick: (brickId: string) => void;
  onResolveInstallIssue: (item: InstallReportItem) => void;
  onQuickPreviewBrick: (brickId: string) => void;
  selectedSceneNodeId: string;
  inspectorScopeLabel: string;
  selectedFields: PropertyField[];
  selectedOverrideCount: number;
  slotBindings: Record<string, string>;
  selectedSlotId: string;
  setSelectedSlotId: (slotId: string) => void;
  selectedCompositeGroups: CompositeOverrideGroup[];
  onPropertyChange: (key: string, value: PropertyField["value"]) => void;
  onResetField: (key: string) => void;
  onResetFieldToScene?: (key: string) => void;
  onSlotBindingChange: (slotId: string, assetRef: string) => void;
  onImportSlotAsset: (slotId: string, file: File) => void;
  onBindAssetToSlot: (slotId: string, assetRef: string) => void;
  onCompositeOverrideChange: (groupKey: string, key: string, value: PropertyField["value"]) => void;
  actorType: string;
  catalogEntries: BrickCatalogEntry[];
  onToggleActorAbility?: () => void;
  unityExportManifest: UnityExportManifest;
  onExport: () => void;
  narrativeLoading: boolean;
  narrativeError: string | null;
  narrativeHealth: RuntimeAiHealthResponse | null;
  narrativeModels: string[];
  narrativeSessions: ConversationSessionRecord[];
  narrativeAvatarTemplates: AvatarTemplateRecord[];
  narrativeAvatars: PlayerAvatarRecord[];
  narrativeSelectedAvatarTemplateId: string;
  narrativeFixtures: NarrativeDemoFixture[];
  narrativeSelectedFixtureId: string;
  narrativeSessionId: string;
  narrativeKnownSessionIds: string[];
  narrativeHistory: NarrativeHistoryTurnRecord[];
  narrativeCurrentTurn: DialogueTurnRecord | null;
  narrativeCandidates: DialogueCandidateRecord[];
  narrativeLastChoiceResult: RuntimeDialogueChoiceResponse | null;
  narrativeAuditLines: string[];
  narrativeSnapshotAnchorId: string;
  narrativeSnapshotJson: string;
  onNarrativeSessionIdChange: (value: string) => void;
  onNarrativeAvatarTemplateIdChange: (value: string) => void;
  onNarrativeFixtureIdChange: (value: string) => void;
  onNarrativeSnapshotJsonChange: (value: string) => void;
  onNarrativeRefreshOverview: () => void;
  onNarrativeRefreshHistory: () => void;
  onNarrativeBeginFixtureSession: () => void;
  onNarrativeCreateFallbackAvatar: () => void;
  onNarrativeSwitchAvatarPresentation: (avatarId: string, presentationMode: string) => void;
  onNarrativeSubmitChoice: (optionId: string) => void;
  onNarrativeImportSnapshot: () => void;
  category: string;
  tags?: BrickTags;
  nodeValidationState?: "ready" | "incomplete" | "blocked";
  nodeValidationIssues?: string[];
  maximized?: boolean;
  onToggleMaximize?: () => void;
};

export const buildRightPanelState = (args: BuildRightPanelStateArgs): RenderAppRightPanelArgs => ({
  t: args.t,
  activeRightPanelTab: args.activeRightPanelTab,
  setActiveRightPanelTab: args.setActiveRightPanelTab,
  selectedBrick: args.selectedBrick,
  selectedBrickDefinition: args.selectedBrickDefinition,
  selectedCatalogEntry: args.selectedCatalogEntry,
  composePrompt: args.composePrompt,
  setComposePrompt: args.setComposePrompt,
  composeMode: args.composeMode,
  setComposeMode: args.setComposeMode,
  composeHistory: args.composeHistory,
  composeResult: args.composeResult,
  agentResult: args.agentResult,
  lastAgentApplyReport: args.lastAgentApplyReport,
  canRollbackAgentApply: args.canRollbackAgentApply,
  onCompose: args.onCompose,
  onApplyComposeDraft: args.onApplyComposeDraft,
  onRollbackAgentApply: args.onRollbackAgentApply,
  onReuseComposeHistory: args.onReuseComposeHistory,
  selectedGrantedAbilityPackageIds: args.selectedGrantedAbilityPackageIds,
  selectedEnemyBehaviorSummary: args.selectedEnemyBehaviorSummary,
  selectedAbilityEquipped: args.selectedAbilityEquipped,
  activeAbilityNames: args.activeAbilityNames,
  installReportItems: args.installReportItems,
  addBrickToScene: args.addBrickToScene,
  onInspectInstallReportBrick: args.onInspectInstallReportBrick,
  onResolveInstallIssue: args.onResolveInstallIssue,
  onQuickPreviewBrick: args.onQuickPreviewBrick,
  selectedSceneNodeId: args.selectedSceneNodeId,
  inspectorScopeLabel: args.inspectorScopeLabel,
  selectedFields: args.selectedFields,
  selectedOverrideCount: args.selectedOverrideCount,
  slotBindings: args.slotBindings,
  selectedSlotId: args.selectedSlotId,
  setSelectedSlotId: args.setSelectedSlotId,
  selectedCompositeGroups: args.selectedCompositeGroups,
  onPropertyChange: args.onPropertyChange,
  onResetField: args.onResetField,
  onResetFieldToScene: args.onResetFieldToScene,
  onSlotBindingChange: args.onSlotBindingChange,
  onImportSlotAsset: args.onImportSlotAsset,
  onBindAssetToSlot: args.onBindAssetToSlot,
  onCompositeOverrideChange: args.onCompositeOverrideChange,
  actorType: args.actorType,
  runtimeKind: args.selectedCatalogEntry?.runtimeKind ?? resolveRuntimeKind(args.selectedBrick, args.catalogEntries),
  readinessSummary: getReadinessSummary(args.selectedCatalogEntry, args.t),
  previewSrc: getBrickPreviewSrc(args.selectedCatalogEntry),
  onToggleActorAbility: args.onToggleActorAbility,
  unityExportManifest: args.unityExportManifest,
  onExport: args.onExport,
  narrativeLoading: args.narrativeLoading,
  narrativeError: args.narrativeError,
  narrativeHealth: args.narrativeHealth,
  narrativeModels: args.narrativeModels,
  narrativeSessions: args.narrativeSessions,
  narrativeAvatarTemplates: args.narrativeAvatarTemplates,
  narrativeAvatars: args.narrativeAvatars,
  narrativeSelectedAvatarTemplateId: args.narrativeSelectedAvatarTemplateId,
  narrativeFixtures: args.narrativeFixtures,
  narrativeSelectedFixtureId: args.narrativeSelectedFixtureId,
  narrativeSessionId: args.narrativeSessionId,
  narrativeKnownSessionIds: args.narrativeKnownSessionIds,
  narrativeHistory: args.narrativeHistory,
  narrativeCurrentTurn: args.narrativeCurrentTurn,
  narrativeCandidates: args.narrativeCandidates,
  narrativeLastChoiceResult: args.narrativeLastChoiceResult,
  narrativeAuditLines: args.narrativeAuditLines,
  narrativeSnapshotAnchorId: args.narrativeSnapshotAnchorId,
  narrativeSnapshotJson: args.narrativeSnapshotJson,
  onNarrativeSessionIdChange: args.onNarrativeSessionIdChange,
  onNarrativeAvatarTemplateIdChange: args.onNarrativeAvatarTemplateIdChange,
  onNarrativeFixtureIdChange: args.onNarrativeFixtureIdChange,
  onNarrativeSnapshotJsonChange: args.onNarrativeSnapshotJsonChange,
  onNarrativeRefreshOverview: args.onNarrativeRefreshOverview,
  onNarrativeRefreshHistory: args.onNarrativeRefreshHistory,
  onNarrativeBeginFixtureSession: args.onNarrativeBeginFixtureSession,
  onNarrativeCreateFallbackAvatar: args.onNarrativeCreateFallbackAvatar,
  onNarrativeSwitchAvatarPresentation: args.onNarrativeSwitchAvatarPresentation,
  onNarrativeSubmitChoice: args.onNarrativeSubmitChoice,
  onNarrativeImportSnapshot: args.onNarrativeImportSnapshot,
  category: args.category,
  tags: args.tags,
  nodeValidationState: args.nodeValidationState,
  nodeValidationIssues: args.nodeValidationIssues,
  maximized: args.maximized,
  onToggleMaximize: args.onToggleMaximize,
});
