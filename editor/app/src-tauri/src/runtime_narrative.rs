use std::{
    fs::{self, File, OpenOptions},
    io::{BufRead, BufReader, Write},
    path::{Path, PathBuf},
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use door_core::{
    begin_dialogue_turn, build_prompt_envelope, resolve_dialogue_choice, AgentMindState,
    DialogueOutcome, DialogueTurn, FateStateRecord, NpcPersonaProfile, PromptEnvelope,
    TaskInstance, WorldBibleRecord, WorldSnapshot,
};
use reqwest::blocking::Client;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeNarrativeServiceConfig {
    pub db_path: PathBuf,
    pub audit_log_path: PathBuf,
    pub ollama_base_url: String,
    pub ollama_model: String,
    pub request_timeout_ms: u64,
    pub max_context_chars: usize,
    pub runtime_ai_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeDialogueRequest {
    pub session_id: Option<String>,
    pub player_utterance: Option<String>,
    pub snapshot: WorldSnapshot,
    pub agent_mind: AgentMindState,
    pub persona: NpcPersonaProfile,
    pub fate_state: Option<FateStateRecord>,
    pub tasks: Vec<TaskInstance>,
    pub world_bible: Option<WorldBibleRecord>,
}

impl RuntimeDialogueRequest {
    pub fn fixture_rules_only() -> Self {
        let mut snapshot = WorldSnapshot::empty(4242, door_core::RuntimeFeatureFlags {
            npc_ai_enabled: false,
            runtime_ai_mode: door_core::RuntimeAiMode::Disabled,
        });
        snapshot.entities.push(door_core::WorldEntity {
            id: door_core::WorldEntityId::new("player-1"),
            kind: door_core::WorldEntityKind::Player,
            actor_class: Some(door_core::ActorClass::Humanoid),
            position_meters: [0.0, 0.0, 0.0],
            state_tags: vec!["grounded".to_string()],
        });
        snapshot.entities.push(door_core::WorldEntity {
            id: door_core::WorldEntityId::new("npc-guard"),
            kind: door_core::WorldEntityKind::Npc,
            actor_class: Some(door_core::ActorClass::Humanoid),
            position_meters: [1.0, 0.0, 0.0],
            state_tags: vec!["idle".to_string()],
        });

        Self {
            session_id: None,
            player_utterance: None,
            snapshot,
            agent_mind: AgentMindState::new("npc-guard"),
            persona: NpcPersonaProfile {
                id: "npc-guard".to_string(),
                display_name: "Gate Warden".to_string(),
                role: "guard".to_string(),
                faction: "watch".to_string(),
                background_summary: "Keeps the checkpoint sealed until dawn.".to_string(),
                personality_tags: vec!["guarded".to_string(), "dutiful".to_string()],
                taboo_topics: vec!["hidden_secret".to_string()],
                public_facts: vec!["The checkpoint is unstable.".to_string()],
                secret_facts: vec!["The alarm was staged.".to_string()],
                relations: Vec::new(),
                initial_goals: vec!["maintain_cover".to_string()],
            },
            fate_state: Some(FateStateRecord {
                entity_id: "npc-guard".to_string(),
                timeline_id: "timeline.guard".to_string(),
                fate_tags: vec!["guard".to_string()],
                world_phase: "suspicion".to_string(),
                causal_flags: vec!["alarm".to_string()],
                branch_state: "intro".to_string(),
                branch_history: vec!["intro".to_string()],
                active_arc_ids: vec!["arc.guard".to_string()],
            }),
            tasks: vec![TaskInstance {
                id: "task-checkpoint".to_string(),
                seed: door_core::TaskSeed {
                    template_id: "checkpoint.truth".to_string(),
                    world_phase: "suspicion".to_string(),
                    cause: "alarm".to_string(),
                },
                title: "Investigate the checkpoint".to_string(),
                state: "active".to_string(),
            }],
            world_bible: Some(WorldBibleRecord {
                scene_id: "checkpoint_room".to_string(),
                world_rules: vec!["Nobody leaves after curfew.".to_string()],
                central_conflict: "trust_vs_survival".to_string(),
                phase_summary: "intro".to_string(),
                public_lore: vec!["The watch no longer trusts outsiders.".to_string()],
            }),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeDialogueChoiceRequest {
    pub session_id: String,
    pub turn_id: String,
    pub option_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DialogueCandidateRecord {
    pub candidate_id: String,
    pub utterance: String,
    pub tone: String,
    pub intent: String,
    pub source: String,
    pub rejected_reason: Option<String>,
    pub revealed_flags: Vec<String>,
    pub relationship_delta: i32,
    pub fate_effects: Vec<String>,
    pub task_mutations: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationSessionRecord {
    pub session_id: String,
    pub player_entity_id: String,
    pub npc_entity_id: String,
    pub timeline_id: Option<String>,
    pub created_at_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NarrativeHistoryTurnRecord {
    pub turn_id: String,
    pub session_id: String,
    pub npc_entity_id: String,
    pub player_entity_id: String,
    pub player_utterance: Option<String>,
    pub utterance: String,
    pub tone: String,
    pub intent: String,
    pub generation_mode: String,
    pub candidate_count: usize,
    pub snapshot_anchor_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DialogueGenerationRecord {
    pub generation_mode: String,
    pub prompt_envelope: PromptEnvelope,
    pub selected_candidate_id: Option<String>,
    pub candidates: Vec<DialogueCandidateRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeDialogueBeginResponse {
    pub session_id: String,
    pub generation_mode: String,
    pub turn: DialogueTurn,
    pub candidates: Vec<DialogueCandidateRecord>,
    pub generation: DialogueGenerationRecord,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeDialogueChoiceResponse {
    pub session_id: String,
    pub outcome: DialogueOutcome,
    pub snapshot_anchor_id: String,
    pub memory_writes: Vec<(String, String)>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SnapshotAnchorRecord {
    pub snapshot_anchor_id: String,
    pub session_id: String,
    pub turn_id: String,
    pub snapshot_json: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeAiHealthResponse {
    pub available: bool,
    pub base_url: String,
    pub model_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeAuditEvent {
    pub timestamp_ms: u64,
    pub session_id: String,
    pub turn_id: Option<String>,
    pub event_type: String,
    pub payload: Value,
}

#[derive(Debug, Clone)]
pub struct RuntimeNarrativeServices {
    config: RuntimeNarrativeServiceConfig,
    client: Client,
}

impl RuntimeNarrativeServices {
    pub fn new(config: RuntimeNarrativeServiceConfig) -> Result<Self, String> {
        ensure_parent_dir(&config.db_path)?;
        ensure_parent_dir(&config.audit_log_path)?;
        let conn = Connection::open(&config.db_path).map_err(|err| err.to_string())?;
        init_schema(&conn)?;
        let client = Client::builder()
            .timeout(Duration::from_millis(config.request_timeout_ms))
            .build()
            .map_err(|err| err.to_string())?;
        Ok(Self { config, client })
    }

    pub fn runtime_ai_health_check(&self) -> Result<RuntimeAiHealthResponse, String> {
        let url = format!("{}/api/tags", self.config.ollama_base_url.trim_end_matches('/'));
        let available = self.client.get(url).send().map(|response| response.status().is_success()).unwrap_or(false);
        Ok(RuntimeAiHealthResponse {
            available,
            base_url: self.config.ollama_base_url.clone(),
            model_name: self.config.ollama_model.clone(),
        })
    }

    pub fn runtime_ai_list_models(&self) -> Result<Vec<String>, String> {
        let url = format!("{}/api/tags", self.config.ollama_base_url.trim_end_matches('/'));
        let response = self.client.get(url).send().map_err(|err| err.to_string())?;
        let body: Value = response.json().map_err(|err| err.to_string())?;
        Ok(body
            .get("models")
            .and_then(Value::as_array)
            .map(|models| {
                models
                    .iter()
                    .filter_map(|model| model.get("name").and_then(Value::as_str))
                    .map(ToString::to_string)
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default())
    }

    pub fn runtime_dialogue_begin(&mut self, request: RuntimeDialogueRequest) -> Result<RuntimeDialogueBeginResponse, String> {
        let session_id = request
            .session_id
            .clone()
            .unwrap_or_else(|| format!("session-{}", now_ms()));
        let ai_enabled = self.config.runtime_ai_enabled && request.snapshot.feature_flags.npc_ai_enabled;
        let turn = begin_dialogue_turn(
            &request.snapshot,
            &request.agent_mind,
            &request.persona,
            request.fate_state.as_ref(),
            &request.tasks,
            request.world_bible.as_ref(),
            ai_enabled,
        );
        let prompt_envelope =
            build_prompt_envelope(&turn.context, &request.persona, request.player_utterance.as_deref());
        let generation = self.generate_dialogue_variants(&turn, &prompt_envelope, ai_enabled)?;
        let conn = self.open_connection()?;
        upsert_world_bible(&conn, request.world_bible.as_ref())?;
        upsert_persona(&conn, &request.persona)?;
        insert_conversation_session(&conn, &session_id, &request)?;
        insert_dialogue_turn(
            &conn,
            &session_id,
            &turn,
            if ai_enabled { "local_llm" } else { "rules_only" },
            request.player_utterance.as_deref(),
        )?;
        insert_dialogue_options(&conn, &turn)?;
        insert_dialogue_candidates(&conn, &session_id, &turn.turn_id, &generation.candidates)?;
        self.append_audit(RuntimeAuditEvent {
            timestamp_ms: now_ms(),
            session_id: session_id.clone(),
            turn_id: Some(turn.turn_id.clone()),
            event_type: "dialogue.begin".to_string(),
            payload: json!({
                "generation_mode": if ai_enabled { "local_llm" } else { "rules_only" },
                "npc": turn.npc_entity_id,
                "player": turn.player_entity_id,
                "candidate_count": generation.candidates.len(),
                "selected_candidate_id": generation.selected_candidate_id,
                "prompt_envelope": generation.prompt_envelope,
            }),
        })?;
        Ok(RuntimeDialogueBeginResponse {
            session_id,
            generation_mode: if ai_enabled { "local_llm".to_string() } else { "rules_only".to_string() },
            turn,
            candidates: generation.candidates.clone(),
            generation,
        })
    }

    pub fn runtime_dialogue_submit_choice(
        &mut self,
        request: RuntimeDialogueChoiceRequest,
    ) -> Result<RuntimeDialogueChoiceResponse, String> {
        let conn = self.open_connection()?;
        let turn = load_turn(&conn, &request.turn_id)?;
        let persona = load_persona(&conn, &turn.npc_entity_id)?;
        let outcome = resolve_dialogue_choice(
            &turn,
            &persona,
            &request.option_id,
            self.config.runtime_ai_enabled,
        )?;
        let snapshot_anchor_id = format!("snapshot-{}", now_ms());
        insert_fate_transition_rows(&conn, &request.session_id, &request.turn_id, &outcome)?;
        insert_task_mutation_rows(&conn, &request.session_id, &request.turn_id, &outcome)?;
        insert_snapshot_anchor(&conn, &snapshot_anchor_id, &request.session_id, &request.turn_id)?;
        let memory_writes =
            insert_agent_memory_write_rows(&conn, &request.session_id, &request.turn_id, &outcome)?;
        self.append_audit(RuntimeAuditEvent {
            timestamp_ms: now_ms(),
            session_id: request.session_id.clone(),
            turn_id: Some(request.turn_id.clone()),
            event_type: "dialogue.choice".to_string(),
            payload: json!({
                "option_id": request.option_id,
                "utterance": outcome.utterance,
                "fate_effects": outcome.fate_effects,
                "task_mutations": outcome.task_mutations,
                "memory_writes": memory_writes,
            }),
        })?;
        Ok(RuntimeDialogueChoiceResponse {
            session_id: request.session_id,
            outcome,
            snapshot_anchor_id,
            memory_writes,
        })
    }

    pub fn runtime_dialogue_history(
        &self,
        session_id: &str,
    ) -> Result<Vec<NarrativeHistoryTurnRecord>, String> {
        let conn = self.open_connection()?;
        let mut stmt = conn
            .prepare(
                "
                select
                    t.turn_id,
                    t.session_id,
                    t.npc_entity_id,
                    t.player_entity_id,
                    t.player_utterance,
                    t.utterance,
                    t.tone,
                    t.intent,
                    t.generation_mode,
                    count(c.candidate_id) as candidate_count,
                    max(s.snapshot_anchor_id) as snapshot_anchor_id
                from dialogue_turn t
                left join dialogue_candidate c on c.turn_id = t.turn_id
                left join runtime_snapshot_index s on s.turn_id = t.turn_id
                where t.session_id = ?1
                group by t.turn_id, t.session_id, t.npc_entity_id, t.player_entity_id, t.player_utterance, t.utterance, t.tone, t.intent, t.generation_mode, t.created_at_ms
                order by t.created_at_ms asc
                ",
            )
            .map_err(|err| err.to_string())?;
        let rows = stmt
            .query_map([session_id], |row| {
                Ok(NarrativeHistoryTurnRecord {
                    turn_id: row.get(0)?,
                    session_id: row.get(1)?,
                    npc_entity_id: row.get(2)?,
                    player_entity_id: row.get(3)?,
                    player_utterance: row.get(4)?,
                    utterance: row.get(5)?,
                    tone: row.get(6)?,
                    intent: row.get(7)?,
                    generation_mode: row.get(8)?,
                    candidate_count: row.get::<_, i64>(9)? as usize,
                    snapshot_anchor_id: row.get(10)?,
                })
            })
            .map_err(|err| err.to_string())?;
        rows.collect::<Result<Vec<_>, _>>().map_err(|err| err.to_string())
    }

    pub fn runtime_conversation_sessions(&self) -> Result<Vec<ConversationSessionRecord>, String> {
        let conn = self.open_connection()?;
        let mut stmt = conn
            .prepare(
                "select session_id, player_entity_id, npc_entity_id, timeline_id, created_at_ms from conversation_session order by created_at_ms desc",
            )
            .map_err(|err| err.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                Ok(ConversationSessionRecord {
                    session_id: row.get(0)?,
                    player_entity_id: row.get(1)?,
                    npc_entity_id: row.get(2)?,
                    timeline_id: row.get(3)?,
                    created_at_ms: row.get::<_, i64>(4)? as u64,
                })
            })
            .map_err(|err| err.to_string())?;
        rows.collect::<Result<Vec<_>, _>>().map_err(|err| err.to_string())
    }

    pub fn runtime_audit_tail(&self, max_lines: usize) -> Result<Vec<String>, String> {
        let file = File::open(&self.config.audit_log_path).map_err(|err| err.to_string())?;
        let lines = BufReader::new(file)
            .lines()
            .collect::<Result<Vec<_>, _>>()
            .map_err(|err| err.to_string())?;
        Ok(lines.into_iter().rev().take(max_lines).collect::<Vec<_>>().into_iter().rev().collect())
    }

    pub fn list_table_names(&self) -> Result<Vec<String>, String> {
        let conn = self.open_connection()?;
        let mut stmt = conn
            .prepare("select name from sqlite_master where type = 'table' order by name asc")
            .map_err(|err| err.to_string())?;
        let rows = stmt
            .query_map([], |row| row.get::<_, String>(0))
            .map_err(|err| err.to_string())?;
        rows.collect::<Result<Vec<_>, _>>().map_err(|err| err.to_string())
    }

    pub fn count_rows(&self, table: &str) -> Result<i64, String> {
        let conn = self.open_connection()?;
        let sql = format!("select count(*) from {table}");
        conn.query_row(&sql, [], |row| row.get::<_, i64>(0))
            .map_err(|err| err.to_string())
    }

    pub fn audit_log_parent_exists(&self) -> bool {
        self.config
            .audit_log_path
            .parent()
            .is_some_and(Path::exists)
    }

    pub fn audit_log_line_count(&self) -> Result<usize, String> {
        if !self.config.audit_log_path.exists() {
            return Ok(0);
        }
        let file = File::open(&self.config.audit_log_path).map_err(|err| err.to_string())?;
        Ok(BufReader::new(file).lines().count())
    }

    fn open_connection(&self) -> Result<Connection, String> {
        Connection::open(&self.config.db_path).map_err(|err| err.to_string())
    }

    pub fn dialogue_turn_player_input(&self, turn_id: &str) -> Result<Option<String>, String> {
        let conn = self.open_connection()?;
        conn.query_row(
            "select player_utterance from dialogue_turn where turn_id = ?1",
            [turn_id],
            |row| row.get::<_, Option<String>>(0),
        )
        .map_err(|err| err.to_string())
    }

    pub fn runtime_snapshot_export(&self, snapshot_anchor_id: &str) -> Result<String, String> {
        let conn = self.open_connection()?;
        conn.query_row(
            "select snapshot_json from runtime_snapshot_index where snapshot_anchor_id = ?1",
            [snapshot_anchor_id],
            |row| row.get::<_, String>(0),
        )
        .map_err(|err| err.to_string())
    }

    pub fn runtime_snapshot_import(
        &mut self,
        snapshot_anchor_id: &str,
        snapshot_json: &str,
    ) -> Result<SnapshotAnchorRecord, String> {
        let conn = self.open_connection()?;
        let (session_id, turn_id) = conn
            .query_row(
                "select session_id, turn_id from runtime_snapshot_index where snapshot_anchor_id = ?1",
                [snapshot_anchor_id],
                |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)),
            )
            .map_err(|err| err.to_string())?;
        self.append_audit(RuntimeAuditEvent {
            timestamp_ms: now_ms(),
            session_id: session_id.clone(),
            turn_id: Some(turn_id.clone()),
            event_type: "snapshot.import".to_string(),
            payload: json!({
                "snapshot_anchor_id": snapshot_anchor_id,
                "snapshot_json": snapshot_json,
            }),
        })?;
        Ok(SnapshotAnchorRecord {
            snapshot_anchor_id: snapshot_anchor_id.to_string(),
            session_id,
            turn_id,
            snapshot_json: snapshot_json.to_string(),
        })
    }

    fn append_audit(&self, event: RuntimeAuditEvent) -> Result<(), String> {
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&self.config.audit_log_path)
            .map_err(|err| err.to_string())?;
        let line = serde_json::to_string(&event).map_err(|err| err.to_string())?;
        writeln!(file, "{line}").map_err(|err| err.to_string())
    }

    fn generate_dialogue_variants(
        &self,
        turn: &DialogueTurn,
        prompt_envelope: &PromptEnvelope,
        ai_enabled: bool,
    ) -> Result<DialogueGenerationRecord, String> {
        if !ai_enabled {
            let selected = DialogueCandidateRecord {
                    candidate_id: format!("candidate-{}-selected", turn.turn_id),
                    utterance: turn.outcome.utterance.clone(),
                    tone: turn.outcome.tone.clone(),
                    intent: turn.outcome.intent.clone(),
                    source: "rules_only".to_string(),
                    rejected_reason: None,
                    revealed_flags: turn.outcome.revealed_flags.clone(),
                    relationship_delta: turn.outcome.relationship_delta,
                    fate_effects: turn.outcome.fate_effects.clone(),
                    task_mutations: turn.outcome.task_mutations.clone(),
                };
            let rejected = DialogueCandidateRecord {
                    candidate_id: format!("candidate-{}-rejected", turn.turn_id),
                    utterance: "I know exactly who staged the alarm and where the contraband is hidden.".to_string(),
                    tone: "reckless".to_string(),
                    intent: "overshare_secret".to_string(),
                    source: "rules_only".to_string(),
                    rejected_reason: Some("violates taboo_topics and secret disclosure policy".to_string()),
                    revealed_flags: vec!["secret.hidden_alarm".to_string()],
                    relationship_delta: 0,
                    fate_effects: vec!["fate.branch.illegal_revelation".to_string()],
                    task_mutations: Vec::new(),
                };
            return Ok(DialogueGenerationRecord {
                generation_mode: "rules_only".to_string(),
                prompt_envelope: prompt_envelope.clone(),
                selected_candidate_id: Some(selected.candidate_id.clone()),
                candidates: vec![selected, rejected],
            });
        }

        let prompt = format!(
            "System rules: {:?}\nPersona: {}\nWorld: {}\nPlayer: {:?}\nForbidden topics: {:?}\nAllowed topics: {:?}\nContract: {:?}\nReturn one guarded NPC line.",
            prompt_envelope.system_rules,
            prompt_envelope.persona_summary,
            prompt_envelope.world_summary,
            prompt_envelope.player_utterance,
            prompt_envelope.forbidden_topics,
            prompt_envelope.allowed_topics,
            prompt_envelope.response_contract,
        );
        let url = format!("{}/api/generate", self.config.ollama_base_url.trim_end_matches('/'));
        let payload = json!({
            "model": self.config.ollama_model,
            "prompt": truncate_chars(&prompt, self.config.max_context_chars),
            "stream": false
        });
        let generated = self
            .client
            .post(url)
            .json(&payload)
            .send()
            .ok()
            .and_then(|response| response.json::<Value>().ok())
            .and_then(|body| body.get("response").and_then(Value::as_str).map(ToString::to_string));
        let (utterance, source, rejected_reason) = match generated {
            Some(utterance) => (utterance, "ollama".to_string(), None),
            None => (
                turn.outcome.utterance.clone(),
                "ollama_fallback".to_string(),
                Some("ollama unavailable, fell back to rules candidate".to_string()),
            ),
        };
        let selected = DialogueCandidateRecord {
                candidate_id: format!("candidate-{}-selected", turn.turn_id),
                utterance,
                tone: turn.outcome.tone.clone(),
                intent: turn.outcome.intent.clone(),
                source,
                rejected_reason,
                revealed_flags: turn.outcome.revealed_flags.clone(),
                relationship_delta: turn.outcome.relationship_delta,
                fate_effects: turn.outcome.fate_effects.clone(),
                task_mutations: turn.outcome.task_mutations.clone(),
            };
        let rejected = DialogueCandidateRecord {
                candidate_id: format!("candidate-{}-rejected", turn.turn_id),
                utterance: "The staged alarm was ordered by the inner watch and the hidden ledger is under the bridge.".to_string(),
                tone: "reckless".to_string(),
                intent: "overshare_secret".to_string(),
                source: "ollama".to_string(),
                rejected_reason: Some("violates secret disclosure guardrail".to_string()),
                revealed_flags: vec!["secret.hidden_alarm".to_string(), "secret.hidden_ledger".to_string()],
                relationship_delta: 0,
                fate_effects: vec!["fate.branch.illegal_revelation".to_string()],
                task_mutations: vec!["task.break.cover".to_string()],
            };
        Ok(DialogueGenerationRecord {
            generation_mode: "local_llm".to_string(),
            prompt_envelope: prompt_envelope.clone(),
            selected_candidate_id: Some(selected.candidate_id.clone()),
            candidates: vec![selected, rejected],
        })
    }
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

fn truncate_chars(input: &str, max_chars: usize) -> String {
    input.chars().take(max_chars).collect()
}

fn ensure_parent_dir(path: &Path) -> Result<(), String> {
    let Some(parent) = path.parent() else {
        return Ok(());
    };
    fs::create_dir_all(parent).map_err(|err| err.to_string())
}

fn init_schema(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "
        create table if not exists conversation_session (
            session_id text primary key,
            player_entity_id text not null,
            npc_entity_id text not null,
            timeline_id text,
            created_at_ms integer not null
        );
        create table if not exists dialogue_turn (
            turn_id text primary key,
            session_id text not null,
            npc_entity_id text not null,
            player_entity_id text not null,
            player_utterance text,
            utterance text not null,
            tone text not null,
            intent text not null,
            generation_mode text not null,
            selected_candidate_id text,
            created_at_ms integer not null
        );
        create table if not exists dialogue_option (
            option_id text primary key,
            turn_id text not null,
            label text not null,
            intent text not null
        );
        create table if not exists dialogue_candidate (
            candidate_id text primary key,
            session_id text not null,
            turn_id text not null,
            utterance text not null,
            tone text not null,
            intent text not null,
            source text not null,
            rejected_reason text,
            revealed_flags_json text not null default '[]',
            relationship_delta integer not null default 0,
            fate_effects_json text not null default '[]',
            task_mutations_json text not null default '[]'
        );
        create table if not exists fate_transition (
            id integer primary key autoincrement,
            session_id text not null,
            turn_id text not null,
            effect text not null
        );
        create table if not exists task_mutation (
            id integer primary key autoincrement,
            session_id text not null,
            turn_id text not null,
            mutation text not null
        );
        create table if not exists agent_memory_write (
            id integer primary key autoincrement,
            session_id text not null,
            turn_id text not null,
            memory_key text not null,
            memory_value text not null
        );
        create table if not exists npc_persona (
            persona_id text primary key,
            entity_id text not null,
            display_name text not null,
            payload_json text not null
        );
        create table if not exists world_bible (
            scene_id text primary key,
            payload_json text not null
        );
        create table if not exists runtime_snapshot_index (
            snapshot_anchor_id text primary key,
            session_id text not null,
            turn_id text not null,
            snapshot_json text not null,
            created_at_ms integer not null
        );
        ",
    )
    .map_err(|err| err.to_string())?;
    ensure_column(conn, "dialogue_turn", "selected_candidate_id", "text")?;
    ensure_column(conn, "dialogue_candidate", "revealed_flags_json", "text not null default '[]'")?;
    ensure_column(conn, "dialogue_candidate", "relationship_delta", "integer not null default 0")?;
    ensure_column(conn, "dialogue_candidate", "fate_effects_json", "text not null default '[]'")?;
    ensure_column(conn, "dialogue_candidate", "task_mutations_json", "text not null default '[]'")
}

fn ensure_column(conn: &Connection, table_name: &str, column_name: &str, column_type: &str) -> Result<(), String> {
    let mut stmt = conn
        .prepare(&format!("pragma table_info({table_name})"))
        .map_err(|err| err.to_string())?;
    let columns = stmt
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|err| err.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|err| err.to_string())?;
    if columns.iter().any(|column| column == column_name) {
        return Ok(());
    }
    conn.execute(
        &format!("alter table {table_name} add column {column_name} {column_type}"),
        [],
    )
    .map_err(|err| err.to_string())?;
    Ok(())
}

fn upsert_world_bible(conn: &Connection, world_bible: Option<&WorldBibleRecord>) -> Result<(), String> {
    let Some(world_bible) = world_bible else {
        return Ok(());
    };
    conn.execute(
        "insert into world_bible (scene_id, payload_json) values (?1, ?2)
         on conflict(scene_id) do update set payload_json = excluded.payload_json",
        params![world_bible.scene_id, serde_json::to_string(world_bible).map_err(|err| err.to_string())?],
    )
    .map_err(|err| err.to_string())?;
    Ok(())
}

fn upsert_persona(conn: &Connection, persona: &NpcPersonaProfile) -> Result<(), String> {
    conn.execute(
        "insert into npc_persona (persona_id, entity_id, display_name, payload_json) values (?1, ?2, ?3, ?4)
         on conflict(persona_id) do update set payload_json = excluded.payload_json, display_name = excluded.display_name",
        params![
            persona.id,
            persona.id,
            persona.display_name,
            serde_json::to_string(persona).map_err(|err| err.to_string())?
        ],
    )
    .map_err(|err| err.to_string())?;
    Ok(())
}

fn insert_conversation_session(
    conn: &Connection,
    session_id: &str,
    request: &RuntimeDialogueRequest,
) -> Result<(), String> {
    conn.execute(
        "insert or replace into conversation_session (session_id, player_entity_id, npc_entity_id, timeline_id, created_at_ms) values (?1, ?2, ?3, ?4, ?5)",
        params![
            session_id,
            "player-1",
            request.agent_mind.entity_id,
            request.fate_state.as_ref().map(|record| record.timeline_id.clone()).unwrap_or_default(),
            now_ms() as i64
        ],
    )
    .map_err(|err| err.to_string())?;
    Ok(())
}

fn insert_dialogue_turn(
    conn: &Connection,
    session_id: &str,
    turn: &DialogueTurn,
    generation_mode: &str,
    player_utterance: Option<&str>,
) -> Result<(), String> {
    conn.execute(
        "insert into dialogue_turn (turn_id, session_id, npc_entity_id, player_entity_id, player_utterance, utterance, tone, intent, generation_mode, created_at_ms)
         values (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            turn.turn_id,
            session_id,
            turn.npc_entity_id,
            turn.player_entity_id,
            player_utterance,
            turn.outcome.utterance,
            turn.outcome.tone,
            turn.outcome.intent,
            generation_mode,
            now_ms() as i64
        ],
    )
    .map_err(|err| err.to_string())?;
    Ok(())
}

fn insert_dialogue_options(conn: &Connection, turn: &DialogueTurn) -> Result<(), String> {
    for option in &turn.options {
        conn.execute(
            "insert into dialogue_option (option_id, turn_id, label, intent) values (?1, ?2, ?3, ?4)",
            params![option.id, turn.turn_id, option.label, option.intent],
        )
        .map_err(|err| err.to_string())?;
    }
    Ok(())
}

fn insert_dialogue_candidates(
    conn: &Connection,
    session_id: &str,
    turn_id: &str,
    candidates: &[DialogueCandidateRecord],
) -> Result<(), String> {
    for candidate in candidates {
        conn.execute(
            "insert into dialogue_candidate (candidate_id, session_id, turn_id, utterance, tone, intent, source, rejected_reason, revealed_flags_json, relationship_delta, fate_effects_json, task_mutations_json)
             values (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![
                candidate.candidate_id,
                session_id,
                turn_id,
                candidate.utterance,
                candidate.tone,
                candidate.intent,
                candidate.source,
                candidate.rejected_reason,
                serde_json::to_string(&candidate.revealed_flags).map_err(|err| err.to_string())?,
                candidate.relationship_delta,
                serde_json::to_string(&candidate.fate_effects).map_err(|err| err.to_string())?,
                serde_json::to_string(&candidate.task_mutations).map_err(|err| err.to_string())?,
            ],
        )
        .map_err(|err| err.to_string())?;
    }
    Ok(())
}

fn insert_fate_transition_rows(
    conn: &Connection,
    session_id: &str,
    turn_id: &str,
    outcome: &DialogueOutcome,
) -> Result<(), String> {
    for effect in &outcome.fate_effects {
        conn.execute(
            "insert into fate_transition (session_id, turn_id, effect) values (?1, ?2, ?3)",
            params![session_id, turn_id, effect],
        )
        .map_err(|err| err.to_string())?;
    }
    Ok(())
}

fn insert_task_mutation_rows(
    conn: &Connection,
    session_id: &str,
    turn_id: &str,
    outcome: &DialogueOutcome,
) -> Result<(), String> {
    for mutation in &outcome.task_mutations {
        conn.execute(
            "insert into task_mutation (session_id, turn_id, mutation) values (?1, ?2, ?3)",
            params![session_id, turn_id, mutation],
        )
        .map_err(|err| err.to_string())?;
    }
    Ok(())
}

fn insert_agent_memory_write_rows(
    conn: &Connection,
    session_id: &str,
    turn_id: &str,
    outcome: &DialogueOutcome,
) -> Result<Vec<(String, String)>, String> {
    let mut writes = Vec::new();
    for revealed_flag in &outcome.revealed_flags {
        conn.execute(
            "insert into agent_memory_write (session_id, turn_id, memory_key, memory_value) values (?1, ?2, ?3, ?4)",
            params![session_id, turn_id, "revealed_flag", revealed_flag],
        )
        .map_err(|err| err.to_string())?;
        writes.push(("revealed_flag".to_string(), revealed_flag.clone()));
    }
    if !outcome.utterance.is_empty() {
        conn.execute(
            "insert into agent_memory_write (session_id, turn_id, memory_key, memory_value) values (?1, ?2, ?3, ?4)",
            params![session_id, turn_id, "last_utterance", outcome.utterance],
        )
        .map_err(|err| err.to_string())?;
        writes.push(("last_utterance".to_string(), outcome.utterance.clone()));
    }
    Ok(writes)
}

fn insert_snapshot_anchor(conn: &Connection, snapshot_anchor_id: &str, session_id: &str, turn_id: &str) -> Result<(), String> {
    let snapshot_json = serde_json::to_string(&json!({
        "snapshot_anchor_id": snapshot_anchor_id,
        "session_id": session_id,
        "turn_id": turn_id,
    }))
    .map_err(|err| err.to_string())?;
    conn.execute(
        "insert into runtime_snapshot_index (snapshot_anchor_id, session_id, turn_id, snapshot_json, created_at_ms) values (?1, ?2, ?3, ?4, ?5)",
        params![snapshot_anchor_id, session_id, turn_id, snapshot_json, now_ms() as i64],
    )
    .map_err(|err| err.to_string())?;
    Ok(())
}

fn load_turn(conn: &Connection, turn_id: &str) -> Result<DialogueTurn, String> {
    let (npc_entity_id, player_entity_id, utterance, tone, intent) = conn
        .query_row(
            "select npc_entity_id, player_entity_id, utterance, tone, intent from dialogue_turn where turn_id = ?1",
            [turn_id],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, String>(4)?,
                ))
            },
        )
        .map_err(|err| err.to_string())?;
    let mut stmt = conn
        .prepare("select option_id, label, intent from dialogue_option where turn_id = ?1 order by rowid asc")
        .map_err(|err| err.to_string())?;
    let options = stmt
        .query_map([turn_id], |row| {
            Ok(door_core::DialogueOption {
                id: row.get::<_, String>(0)?,
                label: row.get::<_, String>(1)?,
                intent: row.get::<_, String>(2)?,
            })
        })
        .map_err(|err| err.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|err| err.to_string())?;
    Ok(DialogueTurn {
        turn_id: turn_id.to_string(),
        npc_entity_id,
        player_entity_id,
        context: door_core::DialogueContext {
            npc_entity_id: String::new(),
            player_entity_id: String::new(),
            timeline_id: String::new(),
            world_phase: String::new(),
            central_conflict: String::new(),
            known_facts: Vec::new(),
            taboo_topics: Vec::new(),
            current_goal: String::new(),
            active_task_ids: Vec::new(),
            ai_mode: String::new(),
        },
        options,
        outcome: DialogueOutcome {
            utterance,
            tone,
            intent,
            revealed_flags: Vec::new(),
            relationship_delta: 0,
            fate_effects: Vec::new(),
            task_mutations: Vec::new(),
            world_reactions: Vec::new(),
        },
        used_local_llm: false,
    })
}

fn load_persona(conn: &Connection, persona_id: &str) -> Result<NpcPersonaProfile, String> {
    let payload = conn
        .query_row(
            "select payload_json from npc_persona where persona_id = ?1",
            [persona_id],
            |row| row.get::<_, String>(0),
        )
        .map_err(|err| err.to_string())?;
    serde_json::from_str(&payload).map_err(|err| err.to_string())
}
