pub mod agent_mind;
pub mod ai_runtime;
pub mod event_bus;
pub mod fate_state;
pub mod host_adapter;
pub mod intent_action;
pub mod json_api;
pub mod protocol;
pub mod runtime;
pub mod runtime_core;
pub mod runtime_dialogue;
pub mod scene;
pub mod snapshot_replay;
pub mod state;
pub mod task_drama;
pub mod validation;
pub mod world_core;

pub use agent_mind::{AgentMemoryRecord, AgentMindState};
pub use ai_runtime::{
    DisabledRuntimeAiProvider, LocalRuntimeAiProvider, RuntimeAiProvider,
    RuntimeAiMode, RuntimeFeatureFlags,
};
pub use event_bus::EventBus;
pub use fate_state::FateStateRecord;
pub use host_adapter::{HostSignal, RuntimeHostBridge};
pub use intent_action::{resolve_intent, ActionResolution, IntentEnvelope, IntentKind};
pub use json_api::{
    handle_interact_envelope_json, interact_json, set_state_json, validate_json,
};
pub use protocol::{
    events, validation_codes, DoorInteractRequestPayload, DoorInteractResponsePayload,
    Envelope, DOOR_INTERACT_REQUEST_TYPE, DOOR_INTERACT_RESPONSE_TYPE,
    INVALID_PROTOCOL_VERSION, INVALID_REQUEST_PAYLOAD, INVALID_REQUEST_TYPE,
    PROTOCOL_VERSION, ProtocolError,
};
pub use runtime::{
    BrickEvent, DoorBrick, InteractInput, LadderBrick, PartitionDoorSpec, PartitionLoadResult,
    PartitionRuntime, PartitionSpec, SetStateInput, TriggerZoneBrick,
};
pub use runtime_dialogue::{
    build_dialogue_context, build_prompt_envelope, begin_dialogue_turn,
    resolve_dialogue_choice, DialogueContext, DialogueGenerationRecord, DialogueOption,
    DialogueOutcome, DialogueTurn, NpcPersonaProfile, NpcRelationRecord, PromptEnvelope,
    WorldBibleRecord,
};
pub use runtime_core::FateRuntimeCore;
pub use scene::{DoorSceneComponent, DoorSceneInteractResult};
pub use snapshot_replay::{RuntimeReplayLog, SnapshotReplayRecord};
pub use state::{
    CameraMode, CameraPreset, DoorState, DoorSyncState, EngineDefaults, LadderState,
    TriggerZoneState,
};
pub use task_drama::{
    derive_fate_transitions, generate_tasks, FateTransition, TaskInstance, TaskMutation, TaskSeed,
    WorldReaction,
};
pub use validation::{
    SuggestedFix, ValidateInput, ValidateOutput, ValidationIssue, ValidationLocation,
    ValidationSeverity,
};
pub use world_core::{
    ActorClass, WorldCommand, WorldCore, WorldEntity, WorldEntityId, WorldEntityKind,
    WorldEvent, WorldEventKind, WorldSnapshot,
};

#[cfg(test)]
mod tests;
