import { useEffect, useMemo, useState } from "react";
import {
  createNarrativeDemoFixtures,
  runtimeConversationSessions,
  createFixtureDialogueRequest,
  runtimeAiHealthCheck,
  runtimeAiListModels,
  runtimeAuditTail,
  runtimeDialogueBegin,
  runtimeDialogueHistory,
  runtimeDialogueSubmitChoice,
  runtimeSnapshotExport,
  runtimeSnapshotImport,
  type ConversationSessionRecord,
  type DialogueCandidateRecord,
  type NarrativeHistoryTurnRecord,
  type DialogueTurnRecord,
  type RuntimeAiHealthResponse,
  type RuntimeDialogueChoiceResponse,
} from "./runtime-narrative-client";

type ParsedAuditEvent = {
  timestamp_ms?: number;
  session_id?: string;
  turn_id?: string | null;
  event_type?: string;
  payload?: Record<string, unknown>;
  raw: string;
};

const parseAuditLine = (line: string): ParsedAuditEvent => {
  try {
    const parsed = JSON.parse(line) as ParsedAuditEvent;
    return { ...parsed, raw: line };
  } catch {
    return { raw: line };
  }
};

export const useRuntimeNarrativeDebug = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<RuntimeAiHealthResponse | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [auditLines, setAuditLines] = useState<string[]>([]);
  const [sessions, setSessions] = useState<ConversationSessionRecord[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [history, setHistory] = useState<NarrativeHistoryTurnRecord[]>([]);
  const [currentTurn, setCurrentTurn] = useState<DialogueTurnRecord | null>(null);
  const [candidates, setCandidates] = useState<DialogueCandidateRecord[]>([]);
  const [lastChoiceResult, setLastChoiceResult] = useState<RuntimeDialogueChoiceResponse | null>(null);
  const [snapshotAnchorId, setSnapshotAnchorId] = useState("");
  const [snapshotJson, setSnapshotJson] = useState("");
  const fixtures = useMemo(() => createNarrativeDemoFixtures(), []);
  const [selectedFixtureId, setSelectedFixtureId] = useState(fixtures[0]?.id ?? "guard");

  const parsedAudit = useMemo(() => auditLines.map(parseAuditLine), [auditLines]);
  const knownSessionIds = useMemo(
    () =>
      sessions.length > 0
        ? sessions.map((session) => session.session_id)
        : [...new Set(parsedAudit.map((item) => item.session_id).filter((value): value is string => typeof value === "string" && value.length > 0))].slice().reverse(),
    [parsedAudit, sessions],
  );

  const runTask = async (task: () => Promise<void>): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await task();
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : String(taskError));
    } finally {
      setLoading(false);
    }
  };

  const refreshOverview = async (): Promise<void> => {
    await runTask(async () => {
      const [nextHealth, nextModels, nextSessions, nextAudit] = await Promise.all([
        runtimeAiHealthCheck(),
        runtimeAiListModels().catch(() => []),
        runtimeConversationSessions().catch(() => []),
        runtimeAuditTail(40).catch(() => []),
      ]);
      setHealth(nextHealth);
      setModels(nextModels);
      setSessions(nextSessions);
      setAuditLines(nextAudit);
    });
  };

  const refreshHistory = async (nextSessionId: string): Promise<void> => {
    if (nextSessionId.length === 0) {
      setHistory([]);
      return;
    }
    await runTask(async () => {
      const nextHistory = await runtimeDialogueHistory(nextSessionId);
      setHistory(nextHistory);
    });
  };

  const beginFixtureSession = async (): Promise<void> => {
    await runTask(async () => {
      const selectedFixture = fixtures.find((fixture) => fixture.id === selectedFixtureId)?.request ?? createFixtureDialogueRequest();
      const response = await runtimeDialogueBegin(selectedFixture);
      setSessionId(response.session_id);
      setCurrentTurn(response.turn);
      setCandidates(response.candidates);
      setLastChoiceResult(null);
      setSnapshotAnchorId("");
      setSnapshotJson("");
      const [nextHistory, nextSessions, nextAudit] = await Promise.all([
        runtimeDialogueHistory(response.session_id).catch(() => []),
        runtimeConversationSessions().catch(() => sessions),
        runtimeAuditTail(40).catch(() => []),
      ]);
      setHistory(nextHistory);
      setSessions(nextSessions);
      setAuditLines(nextAudit);
    });
  };

  const submitChoice = async (optionId: string): Promise<void> => {
    if (sessionId.length === 0 || currentTurn === null) {
      return;
    }
    await runTask(async () => {
      const response = await runtimeDialogueSubmitChoice(sessionId, currentTurn.turn_id, optionId);
      setLastChoiceResult(response);
      setSnapshotAnchorId(response.snapshot_anchor_id);
      const [nextHistory, nextAudit, nextSnapshot] = await Promise.all([
        runtimeDialogueHistory(sessionId).catch(() => history),
        runtimeAuditTail(40).catch(() => auditLines),
        runtimeSnapshotExport(response.snapshot_anchor_id).catch(() => ""),
      ]);
      setHistory(nextHistory);
      setAuditLines(nextAudit);
      setSnapshotJson(nextSnapshot);
    });
  };

  const importSnapshot = async (): Promise<void> => {
    if (snapshotAnchorId.length === 0 || snapshotJson.trim().length === 0) {
      return;
    }
    await runTask(async () => {
      await runtimeSnapshotImport(snapshotAnchorId, snapshotJson);
      const nextAudit = await runtimeAuditTail(40).catch(() => []);
      setAuditLines(nextAudit);
    });
  };

  useEffect(() => {
    void refreshOverview();
  }, []);

  useEffect(() => {
    if (sessionId.length === 0) {
      return;
    }
    void refreshHistory(sessionId);
  }, [sessionId]);

  return {
    loading,
    error,
    health,
    models,
    sessions,
    auditLines,
    parsedAudit,
    knownSessionIds,
    sessionId,
    setSessionId,
    fixtures,
    selectedFixtureId,
    setSelectedFixtureId,
    history,
    currentTurn,
    candidates,
    lastChoiceResult,
    snapshotAnchorId,
    snapshotJson,
    setSnapshotJson,
    refreshOverview,
    refreshHistory,
    beginFixtureSession,
    submitChoice,
    importSnapshot,
  };
};
