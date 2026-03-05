use serde::{Deserialize, Serialize};
use serde_json::Value;

pub const PROTOCOL_VERSION: &str = "1.0";

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
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DoorInteractResponsePayload {
    pub event: String,
    pub payload: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DoorState {
    pub enabled: bool,
    pub locked: bool,
    pub open: bool,
    pub has_collision: bool,
    pub has_trigger: bool,
}

impl Default for DoorState {
    fn default() -> Self {
        Self {
            enabled: true,
            locked: false,
            open: false,
            has_collision: true,
            has_trigger: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct InteractInput {
    pub actor_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SetStateInput {
    pub key: String,
    pub value: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct BrickEvent {
    pub event: String,
    pub payload: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ValidateInput {
    pub door_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ValidateOutput {
    pub issues: Vec<ValidationIssue>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ValidationIssue {
    pub severity: ValidationSeverity,
    pub code: String,
    pub message: String,
    pub location: ValidationLocation,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub suggested_fix: Option<Vec<SuggestedFix>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ValidationLocation {
    pub brick_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub entity_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub param_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub slot_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub node_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SuggestedFix {
    pub r#type: String,
    pub payload: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ValidationSeverity {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DoorBrick {
    pub brick_id: String,
    pub state: DoorState,
}

impl DoorBrick {
    pub fn new(brick_id: impl Into<String>, state: DoorState) -> Self {
        Self {
            brick_id: brick_id.into(),
            state,
        }
    }

    pub fn interact(&mut self, input: InteractInput) -> BrickEvent {
        if !self.state.enabled {
            return BrickEvent {
                event: "OnDenied".to_string(),
                payload: "reason=disabled".to_string(),
            };
        }
        if self.state.locked {
            return BrickEvent {
                event: "OnDenied".to_string(),
                payload: "reason=locked".to_string(),
            };
        }

        self.state.open = !self.state.open;
        BrickEvent {
            event: "OnUsed".to_string(),
            payload: format!("actor_id={},open={}", input.actor_id, self.state.open),
        }
    }

    pub fn set_state(&mut self, input: SetStateInput) -> BrickEvent {
        match input.key.as_str() {
            "enabled" => self.state.enabled = input.value,
            "locked" => self.state.locked = input.value,
            "open" => self.state.open = input.value,
            "has_collision" => self.state.has_collision = input.value,
            "has_trigger" => self.state.has_trigger = input.value,
            _ => {
                return BrickEvent {
                    event: "OnDenied".to_string(),
                    payload: format!("reason=unknown_state:{}", input.key),
                }
            }
        }

        BrickEvent {
            event: "OnStateChanged".to_string(),
            payload: format!("key={},value={}", input.key, input.value),
        }
    }

    pub fn validate(&self, input: ValidateInput) -> ValidateOutput {
        let mut issues = Vec::new();
        if !self.state.has_collision {
            issues.push(ValidationIssue {
                severity: ValidationSeverity::Error,
                code: "MISSING_COLLISION".to_string(),
                message: format!("{} 缺少碰撞体", input.door_name),
                location: ValidationLocation {
                    brick_id: self.brick_id.clone(),
                    entity_id: None,
                    param_key: None,
                    slot_id: Some("collision".to_string()),
                    node_id: None,
                },
                suggested_fix: Some(vec![SuggestedFix {
                    r#type: "set_slot".to_string(),
                    payload: serde_json::json!({
                        "slot_id": "collision",
                        "asset_ref": "default_collision"
                    }),
                }]),
            });
        }
        if !self.state.has_trigger {
            issues.push(ValidationIssue {
                severity: ValidationSeverity::Error,
                code: "MISSING_TRIGGER".to_string(),
                message: format!("{} 缺少触发体", input.door_name),
                location: ValidationLocation {
                    brick_id: self.brick_id.clone(),
                    entity_id: None,
                    param_key: None,
                    slot_id: Some("trigger".to_string()),
                    node_id: None,
                },
                suggested_fix: Some(vec![SuggestedFix {
                    r#type: "set_slot".to_string(),
                    payload: serde_json::json!({
                        "slot_id": "trigger",
                        "asset_ref": "default_trigger"
                    }),
                }]),
            });
        }
        if self.state.locked {
            issues.push(ValidationIssue {
                severity: ValidationSeverity::Warning,
                code: "LOCKED_DEFAULT".to_string(),
                message: format!("{} 默认上锁，需确认玩法预期", input.door_name),
                location: ValidationLocation {
                    brick_id: self.brick_id.clone(),
                    entity_id: None,
                    param_key: Some("locked".to_string()),
                    slot_id: None,
                    node_id: None,
                },
                suggested_fix: Some(vec![SuggestedFix {
                    r#type: "set_param".to_string(),
                    payload: serde_json::json!({
                        "key": "locked",
                        "value": false
                    }),
                }]),
            });
        }

        ValidateOutput { issues }
    }
}

pub fn interact_json(brick: &mut DoorBrick, input_json: &str) -> Result<String, serde_json::Error> {
    let input: InteractInput = serde_json::from_str(input_json)?;
    let event = brick.interact(input);
    serde_json::to_string(&event)
}

pub fn set_state_json(brick: &mut DoorBrick, input_json: &str) -> Result<String, serde_json::Error> {
    let input: SetStateInput = serde_json::from_str(input_json)?;
    let event = brick.set_state(input);
    serde_json::to_string(&event)
}

pub fn validate_json(brick: &DoorBrick, input_json: &str) -> Result<String, serde_json::Error> {
    let input: ValidateInput = serde_json::from_str(input_json)?;
    let output = brick.validate(input);
    serde_json::to_string(&output)
}

pub fn handle_interact_envelope_json(
    brick: &mut DoorBrick,
    request_json: &str,
) -> Result<String, serde_json::Error> {
    let request: Envelope = serde_json::from_str(request_json)?;
    let payload: DoorInteractRequestPayload = serde_json::from_value(request.payload)?;
    let event = brick.interact(InteractInput {
        actor_id: payload.actor_id,
    });

    let response = Envelope {
        protocol_version: PROTOCOL_VERSION.to_string(),
        r#type: "door.interact.response".to_string(),
        request_id: request.request_id,
        payload: serde_json::to_value(DoorInteractResponsePayload {
            event: event.event,
            payload: event.payload,
        })?,
        error: None,
    };

    serde_json::to_string(&response)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn interaction_events_and_validator_levels_are_covered() {
        let mut state = DoorState::default();
        state.has_collision = false;
        state.locked = false;

        let mut brick = DoorBrick::new("fate.door.basic", state);
        let used = brick.interact(InteractInput {
            actor_id: "player_1".to_string(),
        });
        assert_eq!(used.event, "OnUsed");

        let _ = brick.set_state(SetStateInput {
            key: "locked".to_string(),
            value: true,
        });
        let denied = brick.interact(InteractInput {
            actor_id: "player_1".to_string(),
        });
        assert_eq!(denied.event, "OnDenied");

        let report = brick.validate(ValidateInput {
            door_name: "demo_door".to_string(),
        });
        assert!(report
            .issues
            .iter()
            .any(|issue| issue.code == "MISSING_COLLISION" && issue.severity == ValidationSeverity::Error));
        assert!(report
            .issues
            .iter()
            .any(|issue| issue.code == "LOCKED_DEFAULT" && issue.severity == ValidationSeverity::Warning));
    }

    #[test]
    fn interact_and_lock_flow_matches_cpp_demo() {
        let mut brick = DoorBrick::new("fate.door.basic", DoorState::default());

        let e1 = brick.interact(InteractInput {
            actor_id: "player_1".to_string(),
        });
        assert_eq!(e1.event, "OnUsed");
        assert_eq!(e1.payload, "actor_id=player_1,open=true");

        let e2 = brick.set_state(SetStateInput {
            key: "locked".to_string(),
            value: true,
        });
        assert_eq!(e2.event, "OnStateChanged");
        assert_eq!(e2.payload, "key=locked,value=true");

        let e3 = brick.interact(InteractInput {
            actor_id: "player_1".to_string(),
        });
        assert_eq!(e3.event, "OnDenied");
        assert_eq!(e3.payload, "reason=locked");
    }

    #[test]
    fn validate_reports_error_and_warning_levels() {
        let mut state = DoorState::default();
        state.has_collision = false;
        state.has_trigger = false;
        state.locked = true;

        let brick = DoorBrick::new("fate.door.basic", state);
        let report = brick.validate(ValidateInput {
            door_name: "demo_door".to_string(),
        });

        assert!(report
            .issues
            .iter()
            .any(|issue| issue.code == "MISSING_COLLISION" && issue.severity == ValidationSeverity::Error));
        assert!(report
            .issues
            .iter()
            .any(|issue| issue.code == "MISSING_TRIGGER" && issue.severity == ValidationSeverity::Error));
        assert!(report
            .issues
            .iter()
            .any(|issue| issue.code == "LOCKED_DEFAULT" && issue.severity == ValidationSeverity::Warning));
    }

    #[test]
    fn validate_json_returns_structured_issues() {
        let mut state = DoorState::default();
        state.has_collision = false;
        let brick = DoorBrick::new("fate.door.basic", state);

        let output_json = validate_json(&brick, r#"{"door_name":"demo_door"}"#).unwrap();
        let output: ValidateOutput = serde_json::from_str(&output_json).unwrap();

        assert_eq!(output.issues.len(), 1);
        assert_eq!(output.issues[0].code, "MISSING_COLLISION");
        assert_eq!(output.issues[0].location.brick_id, "fate.door.basic");
        assert_eq!(output.issues[0].location.slot_id.as_deref(), Some("collision"));
    }

    #[test]
    fn interact_envelope_adapter_round_trip() {
        let mut brick = DoorBrick::new("fate.door.basic", DoorState::default());
        let request = Envelope {
            protocol_version: PROTOCOL_VERSION.to_string(),
            r#type: "door.interact.request".to_string(),
            request_id: "req-1".to_string(),
            payload: serde_json::json!({"actor_id": "player_1"}),
            error: None,
        };

        let request_json = serde_json::to_string(&request).unwrap();
        let response_json = handle_interact_envelope_json(&mut brick, &request_json).unwrap();
        let response: Envelope = serde_json::from_str(&response_json).unwrap();

        assert_eq!(response.protocol_version, PROTOCOL_VERSION);
        assert_eq!(response.r#type, "door.interact.response");
        assert_eq!(response.request_id, "req-1");
    }
}
