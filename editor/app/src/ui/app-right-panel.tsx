import type { BrickDefinition } from "../domain/brick";
import type { AgentApplyReport, AgentComposeResult, ComposeResult } from "../composer";
import type { UnityExportManifest } from "../project/unity-export";
import BrickDetailsPanel from "./BrickDetailsPanel";
import ComposerPanel from "./ComposerPanel";
import InstallReportPanel, { type InstallReportItem } from "./InstallReportPanel";
import NarrativeDebugPanel from "./NarrativeDebugPanel";
import PropertyInspectorPanel, { type CompositeOverrideGroup, type PropertyField } from "./PropertyInspectorPanel";
import type {
  ConversationSessionRecord,
  DialogueCandidateRecord,
  DialogueTurnRecord,
  NarrativeDemoFixture,
  NarrativeHistoryTurnRecord,
  RuntimeAiHealthResponse,
  RuntimeDialogueChoiceResponse,
} from "./runtime-narrative-client";
import UnityExportPanel from "./UnityExportPanel";
import { dockHeaderButtonStyle, rightTabButtonStyle } from "./app-chrome";
import type { BrickTags } from "./brick-tags";
import type { BrickCatalogEntry } from "./app-types";
import { uePanelSurface, ueShellColors } from "./ue-shell-theme";

type RightPanelTab = "install" | "details" | "inspector" | "compose" | "export" | "narrative";
type Translate = (key: string, params?: Record<string, string>) => string;

export type RenderAppRightPanelArgs = {
  t: Translate;
  activeRightPanelTab: RightPanelTab;
  setActiveRightPanelTab: (tab: RightPanelTab) => void;
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
  runtimeKind: "door" | "switch" | "ladder" | "trigger-zone" | "enemy" | "generic";
  readinessSummary: Array<{ label: string; tone: "ready" | "warning" | "blocked" }>;
  previewSrc?: string;
  onToggleActorAbility?: () => void;
  unityExportManifest: UnityExportManifest;
  onExport: () => void;
  narrativeLoading: boolean;
  narrativeError: string | null;
  narrativeHealth: RuntimeAiHealthResponse | null;
  narrativeModels: string[];
  narrativeSessions: ConversationSessionRecord[];
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
  onNarrativeFixtureIdChange: (value: string) => void;
  onNarrativeSnapshotJsonChange: (value: string) => void;
  onNarrativeRefreshOverview: () => void;
  onNarrativeRefreshHistory: () => void;
  onNarrativeBeginFixtureSession: () => void;
  onNarrativeSubmitChoice: (optionId: string) => void;
  onNarrativeImportSnapshot: () => void;
  category: string;
  tags?: BrickTags;
  nodeValidationState?: "ready" | "incomplete" | "blocked";
  nodeValidationIssues?: string[];
  maximized?: boolean;
  onToggleMaximize?: () => void;
};

export const renderAppRightPanel = ({
  t,
  activeRightPanelTab,
  setActiveRightPanelTab,
  selectedBrick,
  selectedBrickDefinition,
  selectedCatalogEntry,
  composePrompt,
  setComposePrompt,
  composeMode,
  setComposeMode,
  composeHistory,
  composeResult,
  agentResult,
  lastAgentApplyReport,
  canRollbackAgentApply,
  onCompose,
  onApplyComposeDraft,
  onRollbackAgentApply,
  onReuseComposeHistory,
  selectedGrantedAbilityPackageIds,
  selectedEnemyBehaviorSummary,
  selectedAbilityEquipped,
  activeAbilityNames,
  installReportItems,
  addBrickToScene,
  onInspectInstallReportBrick,
  onResolveInstallIssue,
  onQuickPreviewBrick,
  selectedSceneNodeId,
  inspectorScopeLabel,
  selectedFields,
  selectedOverrideCount,
  slotBindings,
  selectedSlotId,
  setSelectedSlotId,
  selectedCompositeGroups,
  onPropertyChange,
  onResetField,
  onResetFieldToScene,
  onSlotBindingChange,
  onImportSlotAsset,
  onBindAssetToSlot,
  onCompositeOverrideChange,
  actorType,
  runtimeKind,
  readinessSummary,
  previewSrc,
  onToggleActorAbility,
  unityExportManifest,
  onExport,
  narrativeLoading,
  narrativeError,
  narrativeHealth,
  narrativeModels,
  narrativeSessions,
  narrativeFixtures,
  narrativeSelectedFixtureId,
  narrativeSessionId,
  narrativeKnownSessionIds,
  narrativeHistory,
  narrativeCurrentTurn,
  narrativeCandidates,
  narrativeLastChoiceResult,
  narrativeAuditLines,
  narrativeSnapshotAnchorId,
  narrativeSnapshotJson,
  onNarrativeSessionIdChange,
  onNarrativeFixtureIdChange,
  onNarrativeSnapshotJsonChange,
  onNarrativeRefreshOverview,
  onNarrativeRefreshHistory,
  onNarrativeBeginFixtureSession,
  onNarrativeSubmitChoice,
  onNarrativeImportSnapshot,
  category,
  tags,
  nodeValidationState,
  nodeValidationIssues,
  maximized,
  onToggleMaximize,
}: RenderAppRightPanelArgs): JSX.Element => (
  <div style={{ ...uePanelSurface, display: "grid", gap: "10px", padding: "10px", borderRadius: "10px", overflow: "hidden" }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center", flexWrap: "wrap", paddingBottom: "6px", borderBottom: `1px solid ${ueShellColors.border}` }}>
      <div style={{ display: "grid", gap: "2px" }}>
        <strong style={{ fontSize: "15px", color: ueShellColors.text }}>{selectedBrickDefinition?.name ?? selectedBrick}</strong>
        <span style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{selectedCatalogEntry?.packageId ?? `fate.${selectedBrick}`}</span>
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" onClick={() => setActiveRightPanelTab("install")} style={rightTabButtonStyle(activeRightPanelTab === "install")}>
          {t("panel.rightTabs.install")}
        </button>
        <button type="button" onClick={() => setActiveRightPanelTab("details")} style={rightTabButtonStyle(activeRightPanelTab === "details")}>
          {t("panel.rightTabs.details")}
        </button>
        <button type="button" onClick={() => setActiveRightPanelTab("inspector")} style={rightTabButtonStyle(activeRightPanelTab === "inspector")}>
          {t("panel.rightTabs.inspector")}
        </button>
        <button type="button" onClick={() => setActiveRightPanelTab("compose")} style={rightTabButtonStyle(activeRightPanelTab === "compose")}>
          Compose
        </button>
        <button type="button" onClick={() => setActiveRightPanelTab("export")} style={rightTabButtonStyle(activeRightPanelTab === "export")}>
          {t("panel.rightTabs.export")}
        </button>
        <button type="button" onClick={() => setActiveRightPanelTab("narrative")} style={rightTabButtonStyle(activeRightPanelTab === "narrative")}>
          Narrative
        </button>
        {onToggleMaximize !== undefined ? (
          <button type="button" onClick={onToggleMaximize} style={dockHeaderButtonStyle}>
            {maximized ? "restore" : "maximize"}
          </button>
        ) : null}
      </div>
    </div>
    <div style={{ padding: "0 8px 8px", minHeight: 0, overflow: "auto" }}>
      {activeRightPanelTab === "install" ? (
        <InstallReportPanel items={installReportItems} onInspectBrick={onInspectInstallReportBrick} onResolveIssue={onResolveInstallIssue} onAddToScene={addBrickToScene} onQuickPreview={onQuickPreviewBrick} />
      ) : null}
      {activeRightPanelTab === "details" ? (
        <BrickDetailsPanel
          name={selectedBrickDefinition?.name ?? selectedBrick}
          summary={selectedBrickDefinition?.summary ?? ""}
          previewSrc={previewSrc}
          readinessSummary={readinessSummary}
          packageId={selectedCatalogEntry?.packageId ?? `fate.${selectedBrick}`}
          version={selectedCatalogEntry?.version ?? "0.1.0"}
          license={selectedCatalogEntry?.license ?? "Proprietary"}
          dependencies={selectedCatalogEntry?.dependencies ?? []}
          compat={selectedCatalogEntry?.compat ?? "editor>=0.1.0"}
          source={selectedCatalogEntry?.source ?? "builtin"}
          category={category}
          runtimeKind={runtimeKind}
          installState={selectedCatalogEntry?.installState ?? "ready"}
          importIssues={selectedCatalogEntry?.importIssues ?? []}
          compositeChildCount={selectedCatalogEntry?.compositeChildren.length ?? 0}
          supportedActorTypes={selectedCatalogEntry?.supportedActorTypes ?? []}
          grantedAbilityPackageIds={selectedGrantedAbilityPackageIds}
          activeAbilityNames={activeAbilityNames}
          enemyBehaviorSummary={selectedEnemyBehaviorSummary}
          actorType={actorType}
          abilityEquipped={selectedAbilityEquipped}
          onToggleActorAbility={onToggleActorAbility}
          tags={tags}
          whiteboxMetadata={selectedCatalogEntry?.whiteboxMetadata}
          nodeValidationState={nodeValidationState}
          nodeValidationIssues={nodeValidationIssues}
          slots={selectedBrickDefinition?.slots ?? []}
          ports={selectedBrickDefinition?.ports ?? []}
        />
      ) : null}
      {activeRightPanelTab === "inspector" ? (
        <PropertyInspectorPanel
          nodeName={`${selectedBrickDefinition?.name ?? selectedBrick} / ${selectedSceneNodeId}`}
          scopeLabel={inspectorScopeLabel}
          fields={selectedFields}
          overrideCount={selectedOverrideCount}
          slots={selectedBrickDefinition?.slots ?? []}
          slotBindings={slotBindings}
          selectedSlotId={selectedSlotId}
          compositeGroups={selectedCompositeGroups}
          onChange={onPropertyChange}
          onResetField={onResetField}
          onResetFieldToScene={onResetFieldToScene}
          onSlotBindingChange={onSlotBindingChange}
          onSelectSlot={setSelectedSlotId}
          onImportSlotAsset={onImportSlotAsset}
          onBindAssetToSlot={onBindAssetToSlot}
          onCompositeOverrideChange={onCompositeOverrideChange}
        />
      ) : null}
      {activeRightPanelTab === "compose" ? (
        <ComposerPanel
          mode={composeMode}
          onModeChange={setComposeMode}
          prompt={composePrompt}
          onPromptChange={setComposePrompt}
          onCompose={onCompose}
          onApplyDraft={onApplyComposeDraft}
          onRollbackAgentApply={onRollbackAgentApply}
          composeResult={composeResult}
          agentResult={agentResult}
          lastAgentApplyReport={lastAgentApplyReport}
          canRollbackAgentApply={canRollbackAgentApply}
          composeHistory={composeHistory}
          onReuseHistory={onReuseComposeHistory}
        />
      ) : null}
      {activeRightPanelTab === "export" ? <UnityExportPanel manifest={unityExportManifest} onExport={onExport} /> : null}
      {activeRightPanelTab === "narrative" ? (
        <NarrativeDebugPanel
          loading={narrativeLoading}
          error={narrativeError}
          health={narrativeHealth}
          models={narrativeModels}
          sessions={narrativeSessions}
          fixtures={narrativeFixtures}
          selectedFixtureId={narrativeSelectedFixtureId}
          sessionId={narrativeSessionId}
          knownSessionIds={narrativeKnownSessionIds}
          history={narrativeHistory}
          currentTurn={narrativeCurrentTurn}
          candidates={narrativeCandidates}
          lastChoiceResult={narrativeLastChoiceResult}
          auditLines={narrativeAuditLines}
          snapshotAnchorId={narrativeSnapshotAnchorId}
          snapshotJson={narrativeSnapshotJson}
          onSessionIdChange={onNarrativeSessionIdChange}
          onFixtureIdChange={onNarrativeFixtureIdChange}
          onSnapshotJsonChange={onNarrativeSnapshotJsonChange}
          onRefreshOverview={onNarrativeRefreshOverview}
          onRefreshHistory={onNarrativeRefreshHistory}
          onBeginFixtureSession={onNarrativeBeginFixtureSession}
          onSubmitChoice={onNarrativeSubmitChoice}
          onImportSnapshot={onNarrativeImportSnapshot}
        />
      ) : null}
    </div>
  </div>
);
