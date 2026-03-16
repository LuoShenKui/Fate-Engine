pub mod json_api;
pub mod protocol;
pub mod runtime;
pub mod scene;
pub mod state;
pub mod validation;

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
pub use scene::{DoorSceneComponent, DoorSceneInteractResult};
pub use state::{
    CameraMode, CameraPreset, DoorState, DoorSyncState, EngineDefaults, LadderState,
    TriggerZoneState,
};
pub use validation::{
    SuggestedFix, ValidateInput, ValidateOutput, ValidationIssue, ValidationLocation,
    ValidationSeverity,
};

#[cfg(test)]
mod tests;
