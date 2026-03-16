use serde::{Deserialize, Serialize};
use serde_json::Value;

pub const PROTOCOL_VERSION: &str = "1.0";
pub const DOOR_INTERACT_REQUEST_TYPE: &str = "door.interact.request";
pub const DOOR_INTERACT_RESPONSE_TYPE: &str = "door.interact.response";
pub const INVALID_PROTOCOL_VERSION: &str = "INVALID_PROTOCOL_VERSION";
pub const INVALID_REQUEST_TYPE: &str = "INVALID_REQUEST_TYPE";
pub const INVALID_REQUEST_PAYLOAD: &str = "INVALID_REQUEST_PAYLOAD";

pub mod events {
    pub const ON_SPAWN: &str = "OnSpawn";
    pub const ON_ENABLE: &str = "OnEnable";
    pub const ON_DISABLE: &str = "OnDisable";
    pub const ON_DESTROY: &str = "OnDestroy";
    pub const ON_USED: &str = "OnUsed";
    pub const ON_DENIED: &str = "OnDenied";
    pub const ON_STATE_CHANGED: &str = "OnStateChanged";
    pub const ON_VALIDATE: &str = "OnValidate";
    pub const ON_TICK_LOW_FREQ: &str = "OnTickLowFreq";

    pub const REQUIRED_EVENTS: [&str; 9] = [
        ON_SPAWN,
        ON_ENABLE,
        ON_DISABLE,
        ON_DESTROY,
        ON_USED,
        ON_DENIED,
        ON_STATE_CHANGED,
        ON_VALIDATE,
        ON_TICK_LOW_FREQ,
    ];
}

pub mod validation_codes {
    pub const MISSING_COLLISION: &str = "MISSING_COLLISION";
    pub const MISSING_TRIGGER: &str = "MISSING_TRIGGER";
    pub const LOCKED_DEFAULT: &str = "LOCKED_DEFAULT";

    pub const REQUIRED_CODES: [&str; 3] = [MISSING_COLLISION, MISSING_TRIGGER, LOCKED_DEFAULT];
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ProtocolError {
    pub code: String,
    pub message: String,
    pub details: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Envelope {
    pub protocol_version: String,
    pub r#type: String,
    pub request_id: String,
    pub payload: Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<ProtocolError>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DoorInteractRequestPayload {
    pub actor_id: String,
    pub entity_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DoorInteractResponsePayload {
    pub event: String,
    pub payload: String,
}
