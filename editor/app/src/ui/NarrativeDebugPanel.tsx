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
import { ueGhostButton, uePanelSurface, ueShellColors } from "./ue-shell-theme";

type NarrativeDebugPanelProps = {
  loading: boolean;
  error: string | null;
  health: RuntimeAiHealthResponse | null;
  models: string[];
  sessions: ConversationSessionRecord[];
  avatarTemplates: AvatarTemplateRecord[];
  avatars: PlayerAvatarRecord[];
  selectedAvatarTemplateId: string;
  fixtures: NarrativeDemoFixture[];
  selectedFixtureId: string;
  sessionId: string;
  knownSessionIds: string[];
  history: NarrativeHistoryTurnRecord[];
  currentTurn: DialogueTurnRecord | null;
  candidates: DialogueCandidateRecord[];
  lastChoiceResult: RuntimeDialogueChoiceResponse | null;
  auditLines: string[];
  snapshotAnchorId: string;
  snapshotJson: string;
  onSessionIdChange: (value: string) => void;
  onAvatarTemplateIdChange: (value: string) => void;
  onFixtureIdChange: (value: string) => void;
  onSnapshotJsonChange: (value: string) => void;
  onRefreshOverview: () => void;
  onRefreshHistory: () => void;
  onBeginFixtureSession: () => void;
  onCreateFallbackAvatar: () => void;
  onSwitchAvatarPresentation: (avatarId: string, presentationMode: string) => void;
  onSubmitChoice: (optionId: string) => void;
  onImportSnapshot: () => void;
};

const sectionTitleStyle = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: ueShellColors.textMuted,
};

export default function NarrativeDebugPanel(props: NarrativeDebugPanelProps): JSX.Element {
  return (
    <div style={{ display: "grid", gap: "12px" }}>
      <div style={{ ...uePanelSurface, display: "grid", gap: "10px", padding: "12px" }}>
        <div style={sectionTitleStyle}>Avatar Runtime</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={props.selectedAvatarTemplateId}
            onChange={(event) => props.onAvatarTemplateIdChange(event.target.value)}
            style={{
              padding: "7px 10px",
              borderRadius: "8px",
              border: `1px solid ${ueShellColors.borderStrong}`,
              background: ueShellColors.panelMuted,
              color: ueShellColors.text,
            }}
          >
            {props.avatarTemplates.map((template) => (
              <option key={template.template_id} value={template.template_id}>
                {template.label}
              </option>
            ))}
          </select>
          <button type="button" onClick={props.onCreateFallbackAvatar} style={ueGhostButton}>
            Create Fallback Avatar
          </button>
        </div>
        {props.avatars.length === 0 ? (
          <span style={{ color: ueShellColors.textMuted, fontSize: "12px" }}>No avatar profile stored yet.</span>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            {props.avatars.map((avatar) => (
              <div key={avatar.avatar_id} style={{ border: `1px solid ${ueShellColors.border}`, borderRadius: "8px", padding: "10px", background: ueShellColors.panelMuted, display: "grid", gap: "6px" }}>
                <strong style={{ fontSize: "12px", color: ueShellColors.text }}>
                  {avatar.avatar_id} / {avatar.body_model.template_id}
                </strong>
                <span style={{ fontSize: "11px", color: ueShellColors.textMuted }}>
                  {avatar.head_fit.capture_mode} / {avatar.head_fit.fit_status} / mode={avatar.public_persona.presentation_mode}
                </span>
                <span style={{ fontSize: "11px", color: ueShellColors.textMuted }}>
                  height={avatar.identity.height_meters.toFixed(2)}m / hair={avatar.tuning.hairstyle_id} / top={avatar.tuning.top_id}
                </span>
                <span style={{ fontSize: "11px", color: ueShellColors.textMuted }}>{avatar.head_fit.scan_summary}</span>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => props.onSwitchAvatarPresentation(avatar.avatar_id, "realistic_3d")} style={ueGhostButton}>
                    Realistic
                  </button>
                  <button type="button" onClick={() => props.onSwitchAvatarPresentation(avatar.avatar_id, "anime_public_persona")} style={ueGhostButton}>
                    Anime Persona
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ ...uePanelSurface, display: "grid", gap: "10px", padding: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: "2px" }}>
            <strong style={{ fontSize: "14px", color: ueShellColors.text }}>Narrative Runtime Debug</strong>
            <span style={{ fontSize: "11px", color: ueShellColors.textMuted }}>Local LLM, dialogue persistence, audit, and snapshot controls.</span>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <select
              value={props.selectedFixtureId}
              onChange={(event) => props.onFixtureIdChange(event.target.value)}
              style={{
                padding: "7px 10px",
                borderRadius: "8px",
                border: `1px solid ${ueShellColors.borderStrong}`,
                background: ueShellColors.panelMuted,
                color: ueShellColors.text,
              }}
            >
              {props.fixtures.map((fixture) => (
                <option key={fixture.id} value={fixture.id}>
                  {fixture.label}
                </option>
              ))}
            </select>
            <button type="button" onClick={props.onRefreshOverview} style={ueGhostButton}>
              Refresh
            </button>
            <button type="button" onClick={props.onBeginFixtureSession} style={ueGhostButton}>
              Begin Fixture Session
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gap: "4px", color: ueShellColors.text, fontSize: "12px" }}>
          <span>
            AI backend:{" "}
            <strong style={{ color: props.health?.available ? "#91d18b" : "#f2b56b" }}>
              {props.health === null ? "unknown" : props.health.available ? "available" : "fallback-only"}
            </strong>
          </span>
          <span>Model: {props.health?.model_name ?? "-"}</span>
          <span>Endpoint: {props.health?.base_url ?? "-"}</span>
          <span>Registered models: {props.models.length > 0 ? props.models.join(", ") : "none reported"}</span>
          {props.loading ? <span style={{ color: ueShellColors.textMuted }}>Loading...</span> : null}
          {props.error !== null ? <span style={{ color: "#ff8b8b" }}>{props.error}</span> : null}
        </div>
      </div>

      <div style={{ ...uePanelSurface, display: "grid", gap: "10px", padding: "12px" }}>
        <div style={sectionTitleStyle}>Conversation</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            value={props.sessionId}
            onChange={(event) => props.onSessionIdChange(event.target.value)}
            placeholder="session id"
            style={{
              flex: "1 1 260px",
              minWidth: "220px",
              padding: "9px 10px",
              borderRadius: "8px",
              border: `1px solid ${ueShellColors.borderStrong}`,
              background: ueShellColors.panelMuted,
              color: ueShellColors.text,
            }}
          />
          <button type="button" onClick={props.onRefreshHistory} style={ueGhostButton}>
            Load Session
          </button>
        </div>
          {props.knownSessionIds.length > 0 ? (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {props.knownSessionIds.map((knownSessionId) => (
              <button key={knownSessionId} type="button" onClick={() => props.onSessionIdChange(knownSessionId)} style={ueGhostButton}>
                {knownSessionId}
              </button>
            ))}
          </div>
        ) : null}
        {props.sessions.length > 0 ? (
          <div style={{ display: "grid", gap: "6px" }}>
            {props.sessions.slice(0, 5).map((session) => (
              <div key={session.session_id} style={{ border: `1px solid ${ueShellColors.border}`, borderRadius: "8px", padding: "8px 10px", background: ueShellColors.panelMuted, display: "grid", gap: "2px" }}>
                <strong style={{ fontSize: "12px", color: ueShellColors.text }}>{session.session_id}</strong>
                <span style={{ fontSize: "11px", color: ueShellColors.textMuted }}>
                  {session.player_entity_id} {"->"} {session.npc_entity_id} / {session.timeline_id ?? "no timeline"}
                </span>
              </div>
            ))}
          </div>
        ) : null}
        <div style={{ display: "grid", gap: "8px" }}>
          <div style={sectionTitleStyle}>Current Turn</div>
          {props.currentTurn === null ? (
            <span style={{ color: ueShellColors.textMuted, fontSize: "12px" }}>No active dialogue turn yet.</span>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              <div style={{ fontSize: "12px", color: ueShellColors.text }}>
                <strong>{props.currentTurn.npc_entity_id}</strong>: {props.currentTurn.outcome.utterance}
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {props.currentTurn.options.map((option) => (
                  <button key={option.id} type="button" onClick={() => props.onSubmitChoice(option.id)} style={ueGhostButton}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "grid", gap: "8px" }}>
          <div style={sectionTitleStyle}>Dialogue Candidates</div>
          {props.candidates.length === 0 ? (
            <span style={{ color: ueShellColors.textMuted, fontSize: "12px" }}>No candidate data loaded.</span>
          ) : (
            props.candidates.map((candidate) => (
              <div key={candidate.candidate_id} style={{ border: `1px solid ${ueShellColors.border}`, borderRadius: "8px", padding: "10px", background: ueShellColors.panelMuted, display: "grid", gap: "4px" }}>
                <strong style={{ fontSize: "12px", color: ueShellColors.text }}>{candidate.utterance}</strong>
                <span style={{ fontSize: "11px", color: ueShellColors.textMuted }}>
                  {candidate.source} / {candidate.intent} / {candidate.tone}
                </span>
                {candidate.rejected_reason ? <span style={{ fontSize: "11px", color: "#f2b56b" }}>Rejected: {candidate.rejected_reason}</span> : null}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ ...uePanelSurface, display: "grid", gap: "10px", padding: "12px" }}>
        <div style={sectionTitleStyle}>Outcome and Fate</div>
        {props.lastChoiceResult === null ? (
          <span style={{ color: ueShellColors.textMuted, fontSize: "12px" }}>No committed dialogue outcome yet.</span>
        ) : (
          <div style={{ display: "grid", gap: "6px", fontSize: "12px", color: ueShellColors.text }}>
            <span>
              <strong>Utterance:</strong> {props.lastChoiceResult.outcome.utterance}
            </span>
            <span>
              <strong>Relationship delta:</strong> {props.lastChoiceResult.outcome.relationship_delta}
            </span>
            <span>
              <strong>Fate effects:</strong> {props.lastChoiceResult.outcome.fate_effects.join(", ") || "none"}
            </span>
            <span>
              <strong>Task mutations:</strong> {props.lastChoiceResult.outcome.task_mutations.join(", ") || "none"}
            </span>
            <span>
              <strong>World reactions:</strong> {props.lastChoiceResult.outcome.world_reactions.join(", ") || "none"}
            </span>
            <span>
              <strong>Snapshot anchor:</strong> {props.snapshotAnchorId || props.lastChoiceResult.snapshot_anchor_id}
            </span>
            <span>
              <strong>Memory writes:</strong>{" "}
              {props.lastChoiceResult.memory_writes.map(([key, value]) => `${key}=${value}`).join(", ") || "none"}
            </span>
          </div>
        )}
      </div>

      <div style={{ ...uePanelSurface, display: "grid", gap: "10px", padding: "12px" }}>
        <div style={sectionTitleStyle}>Session History</div>
        {props.history.length === 0 ? (
          <span style={{ color: ueShellColors.textMuted, fontSize: "12px" }}>No dialogue history loaded.</span>
        ) : (
          <div style={{ display: "grid", gap: "6px" }}>
            {props.history.map((turn) => (
              <div key={turn.turn_id} style={{ border: `1px solid ${ueShellColors.border}`, borderRadius: "8px", padding: "8px 10px", background: ueShellColors.panelMuted, fontSize: "12px", color: ueShellColors.text, display: "grid", gap: "4px" }}>
                <strong>{turn.utterance}</strong>
                <span style={{ fontSize: "11px", color: ueShellColors.textMuted }}>
                  {turn.npc_entity_id} / {turn.intent} / {turn.tone} / {turn.generation_mode}
                </span>
                {turn.player_utterance ? <span style={{ fontSize: "11px", color: ueShellColors.textMuted }}>Player: {turn.player_utterance}</span> : null}
                <span style={{ fontSize: "11px", color: ueShellColors.textMuted }}>
                  candidates={turn.candidate_count} / snapshot={turn.snapshot_anchor_id ?? "none"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ ...uePanelSurface, display: "grid", gap: "10px", padding: "12px" }}>
        <div style={sectionTitleStyle}>Snapshot Restore</div>
        <textarea
          value={props.snapshotJson}
          onChange={(event) => props.onSnapshotJsonChange(event.target.value)}
          placeholder="snapshot json"
          style={{
            width: "100%",
            minHeight: "120px",
            resize: "vertical",
            boxSizing: "border-box",
            padding: "10px",
            borderRadius: "8px",
            border: `1px solid ${ueShellColors.borderStrong}`,
            background: ueShellColors.panelMuted,
            color: ueShellColors.text,
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: ueShellColors.textMuted }}>Anchor: {props.snapshotAnchorId || "none"}</span>
          <button type="button" onClick={props.onImportSnapshot} style={ueGhostButton}>
            Import Snapshot
          </button>
        </div>
      </div>

      <div style={{ ...uePanelSurface, display: "grid", gap: "10px", padding: "12px" }}>
        <div style={sectionTitleStyle}>Audit Tail</div>
        {props.auditLines.length === 0 ? (
          <span style={{ color: ueShellColors.textMuted, fontSize: "12px" }}>No audit lines loaded.</span>
        ) : (
          <div style={{ display: "grid", gap: "6px", maxHeight: "240px", overflow: "auto" }}>
            {props.auditLines.map((line, index) => (
              <pre
                key={`${index}-${line.slice(0, 24)}`}
                style={{
                  margin: 0,
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: `1px solid ${ueShellColors.border}`,
                  background: ueShellColors.panelMuted,
                  color: ueShellColors.textMuted,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: "11px",
                  lineHeight: 1.45,
                }}
              >
                {line}
              </pre>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
