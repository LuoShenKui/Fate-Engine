mod runtime_narrative;

use std::{path::PathBuf, sync::Mutex};

use runtime_narrative::{
    ConversationSessionRecord, NarrativeHistoryTurnRecord, RuntimeAiHealthResponse,
    RuntimeDialogueBeginResponse, RuntimeDialogueChoiceRequest, RuntimeDialogueChoiceResponse,
    RuntimeDialogueRequest, RuntimeNarrativeServiceConfig, RuntimeNarrativeServices,
    SnapshotAnchorRecord,
};
use tauri::Manager;

pub use runtime_narrative::{
    ConversationSessionRecord as NarrativeConversationSessionRecord, DialogueCandidateRecord,
    NarrativeHistoryTurnRecord as NarrativeHistoryTurnRecordExport, RuntimeAuditEvent,
    RuntimeNarrativeServiceConfig as NarrativeConfig, RuntimeNarrativeServices as NarrativeServices,
    SnapshotAnchorRecord as NarrativeSnapshotAnchorRecord,
};
pub struct AppState {
    services: Mutex<RuntimeNarrativeServices>,
}

fn default_runtime_config(app_data_dir: PathBuf) -> RuntimeNarrativeServiceConfig {
    RuntimeNarrativeServiceConfig {
        db_path: app_data_dir.join("runtime").join("narrative.sqlite3"),
        audit_log_path: app_data_dir.join("runtime").join("narrative-audit.jsonl"),
        ollama_base_url: "http://127.0.0.1:11434".to_string(),
        ollama_model: "llama3".to_string(),
        request_timeout_ms: 8_000,
        max_context_chars: 8_192,
        runtime_ai_enabled: true,
    }
}

#[tauri::command]
fn runtime_ai_health_check(state: tauri::State<'_, AppState>) -> Result<RuntimeAiHealthResponse, String> {
    state
        .services
        .lock()
        .map_err(|err| err.to_string())?
        .runtime_ai_health_check()
}

#[tauri::command]
fn runtime_ai_list_models(state: tauri::State<'_, AppState>) -> Result<Vec<String>, String> {
    state
        .services
        .lock()
        .map_err(|err| err.to_string())?
        .runtime_ai_list_models()
}

#[tauri::command]
fn runtime_dialogue_begin(
    state: tauri::State<'_, AppState>,
    request: RuntimeDialogueRequest,
) -> Result<RuntimeDialogueBeginResponse, String> {
    state
        .services
        .lock()
        .map_err(|err| err.to_string())?
        .runtime_dialogue_begin(request)
}

#[tauri::command]
fn runtime_dialogue_submit_choice(
    state: tauri::State<'_, AppState>,
    request: RuntimeDialogueChoiceRequest,
) -> Result<RuntimeDialogueChoiceResponse, String> {
    state
        .services
        .lock()
        .map_err(|err| err.to_string())?
        .runtime_dialogue_submit_choice(request)
}

#[tauri::command]
fn runtime_dialogue_history(
    state: tauri::State<'_, AppState>,
    session_id: String,
) -> Result<Vec<NarrativeHistoryTurnRecord>, String> {
    state
        .services
        .lock()
        .map_err(|err| err.to_string())?
        .runtime_dialogue_history(&session_id)
}

#[tauri::command]
fn runtime_conversation_sessions(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<ConversationSessionRecord>, String> {
    state
        .services
        .lock()
        .map_err(|err| err.to_string())?
        .runtime_conversation_sessions()
}

#[tauri::command]
fn runtime_audit_tail(
    state: tauri::State<'_, AppState>,
    max_lines: usize,
) -> Result<Vec<String>, String> {
    state
        .services
        .lock()
        .map_err(|err| err.to_string())?
        .runtime_audit_tail(max_lines)
}

#[tauri::command]
fn runtime_snapshot_export(
    state: tauri::State<'_, AppState>,
    snapshot_anchor_id: String,
) -> Result<String, String> {
    state
        .services
        .lock()
        .map_err(|err| err.to_string())?
        .runtime_snapshot_export(&snapshot_anchor_id)
}

#[tauri::command]
fn runtime_snapshot_import(
    state: tauri::State<'_, AppState>,
    snapshot_anchor_id: String,
    snapshot_json: String,
) -> Result<SnapshotAnchorRecord, String> {
    state
        .services
        .lock()
        .map_err(|err| err.to_string())?
        .runtime_snapshot_import(&snapshot_anchor_id, &snapshot_json)
}

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .map_err(|err| std::io::Error::other(err.to_string()))?;
            let services = RuntimeNarrativeServices::new(default_runtime_config(app_data_dir))
                .map_err(std::io::Error::other)?;
            app.manage(AppState {
                services: Mutex::new(services),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            runtime_ai_health_check,
            runtime_ai_list_models,
            runtime_dialogue_begin,
            runtime_dialogue_submit_choice,
            runtime_dialogue_history,
            runtime_conversation_sessions,
            runtime_audit_tail,
            runtime_snapshot_export,
            runtime_snapshot_import
        ])
        .run(tauri::generate_context!())
        .expect("error while running fate editor tauri application");
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use super::{
        RuntimeDialogueChoiceRequest, RuntimeDialogueRequest, RuntimeNarrativeServiceConfig,
        RuntimeNarrativeServices,
    };

    fn temp_paths(test_name: &str) -> (PathBuf, PathBuf) {
        let root = std::env::temp_dir().join(format!("fate-editor-shell-{test_name}-{}", std::process::id()));
        let db_path = root.join("runtime.sqlite3");
        let audit_path = root.join("runtime-audit.jsonl");
        (db_path, audit_path)
    }

    #[test]
    fn init_creates_sqlite_schema_and_audit_log_path() {
        let (db_path, audit_path) = temp_paths("schema");
        let services = RuntimeNarrativeServices::new(RuntimeNarrativeServiceConfig {
            db_path: db_path.clone(),
            audit_log_path: audit_path.clone(),
            ollama_base_url: "http://127.0.0.1:11434".to_string(),
            ollama_model: "llama3".to_string(),
            request_timeout_ms: 2000,
            max_context_chars: 4000,
            runtime_ai_enabled: false,
        })
        .expect("services init");

        let tables = services.list_table_names().expect("table names");
        assert!(tables.iter().any(|name| name == "conversation_session"));
        assert!(tables.iter().any(|name| name == "dialogue_turn"));
        assert!(tables.iter().any(|name| name == "dialogue_candidate"));
        assert!(tables.iter().any(|name| name == "runtime_snapshot_index"));
        assert!(services.audit_log_parent_exists());
    }

    #[test]
    fn begin_dialogue_rules_mode_persists_session_turn_options_and_audit() {
        let (db_path, audit_path) = temp_paths("begin-dialogue");
        let mut services = RuntimeNarrativeServices::new(RuntimeNarrativeServiceConfig {
            db_path,
            audit_log_path: audit_path,
            ollama_base_url: "http://127.0.0.1:11434".to_string(),
            ollama_model: "llama3".to_string(),
            request_timeout_ms: 2000,
            max_context_chars: 4000,
            runtime_ai_enabled: false,
        })
        .expect("services init");

        let response = services
            .runtime_dialogue_begin(RuntimeDialogueRequest::fixture_rules_only())
            .expect("begin dialogue");

        assert_eq!(response.generation_mode, "rules_only");
        assert!(!response.turn.options.is_empty());
        assert_eq!(services.count_rows("conversation_session").expect("count"), 1);
        assert_eq!(services.count_rows("dialogue_turn").expect("count"), 1);
        assert!(services.count_rows("dialogue_option").expect("count") >= 1);
        assert!(services.audit_log_line_count().expect("audit lines") >= 1);
    }

    #[test]
    fn submit_dialogue_choice_persists_outcome_and_snapshot_anchor() {
        let (db_path, audit_path) = temp_paths("submit-choice");
        let mut services = RuntimeNarrativeServices::new(RuntimeNarrativeServiceConfig {
            db_path,
            audit_log_path: audit_path,
            ollama_base_url: "http://127.0.0.1:11434".to_string(),
            ollama_model: "llama3".to_string(),
            request_timeout_ms: 2000,
            max_context_chars: 4000,
            runtime_ai_enabled: false,
        })
        .expect("services init");

        let begin = services
            .runtime_dialogue_begin(RuntimeDialogueRequest::fixture_rules_only())
            .expect("begin dialogue");
        let option_id = begin.turn.options[0].id.clone();

        let result = services
            .runtime_dialogue_submit_choice(RuntimeDialogueChoiceRequest {
                session_id: begin.session_id.clone(),
                turn_id: begin.turn.turn_id.clone(),
                option_id,
            })
            .expect("submit choice");

        assert_eq!(result.session_id, begin.session_id);
        assert!(!result.outcome.utterance.is_empty());
        assert_eq!(services.count_rows("fate_transition").expect("count"), 1);
        assert_eq!(services.count_rows("runtime_snapshot_index").expect("count"), 1);
        assert!(services.audit_log_line_count().expect("audit lines") >= 2);
    }

    #[test]
    fn begin_dialogue_persists_player_input_and_rejected_candidates() {
        let (db_path, audit_path) = temp_paths("player-input");
        let mut services = RuntimeNarrativeServices::new(RuntimeNarrativeServiceConfig {
            db_path,
            audit_log_path: audit_path,
            ollama_base_url: "http://127.0.0.1:11434".to_string(),
            ollama_model: "llama3".to_string(),
            request_timeout_ms: 200,
            max_context_chars: 4000,
            runtime_ai_enabled: true,
        })
        .expect("services init");

        let mut request = RuntimeDialogueRequest::fixture_rules_only();
        request.player_utterance = Some("Tell me the truth about the alarm.".to_string());
        request.snapshot.feature_flags.npc_ai_enabled = true;
        request.snapshot.feature_flags.runtime_ai_mode = door_core::RuntimeAiMode::Enabled;

        let response = services.runtime_dialogue_begin(request).expect("begin dialogue");

        assert_eq!(services.dialogue_turn_player_input(&response.turn.turn_id).expect("player input"), Some("Tell me the truth about the alarm.".to_string()));
        assert!(response.candidates.iter().any(|candidate| candidate.rejected_reason.is_some()));
    }

    #[test]
    fn snapshot_export_and_import_round_trip_for_session_anchor() {
        let (db_path, audit_path) = temp_paths("snapshot-roundtrip");
        let mut services = RuntimeNarrativeServices::new(RuntimeNarrativeServiceConfig {
            db_path,
            audit_log_path: audit_path,
            ollama_base_url: "http://127.0.0.1:11434".to_string(),
            ollama_model: "llama3".to_string(),
            request_timeout_ms: 2000,
            max_context_chars: 4000,
            runtime_ai_enabled: false,
        })
        .expect("services init");

        let begin = services
            .runtime_dialogue_begin(RuntimeDialogueRequest::fixture_rules_only())
            .expect("begin dialogue");
        let option_id = begin.turn.options[0].id.clone();
        let result = services
            .runtime_dialogue_submit_choice(RuntimeDialogueChoiceRequest {
                session_id: begin.session_id.clone(),
                turn_id: begin.turn.turn_id.clone(),
                option_id,
            })
            .expect("submit choice");

        let exported = services
            .runtime_snapshot_export(&result.snapshot_anchor_id)
            .expect("snapshot export");
        let imported = services
            .runtime_snapshot_import(&result.snapshot_anchor_id, &exported)
            .expect("snapshot import");

        assert_eq!(imported.turn_id, begin.turn.turn_id);
        assert!(services.audit_log_line_count().expect("audit lines") >= 3);
    }
}
