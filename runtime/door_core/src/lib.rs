use serde::{Deserialize, Serialize};
use serde_json::Value;

pub const PROTOCOL_VERSION: &str = "1.0";

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
    low_freq_tick_counter: u64,
}

impl DoorBrick {
    pub fn new(brick_id: impl Into<String>, state: DoorState) -> Self {
        Self {
            brick_id: brick_id.into(),
            state,
            low_freq_tick_counter: 0,
        }
    }

    pub fn on_spawn(&self) -> BrickEvent {
        BrickEvent {
            event: events::ON_SPAWN.to_string(),
            payload: "status=noop".to_string(),
        }
    }

    pub fn on_enable(&self) -> BrickEvent {
        BrickEvent {
            event: events::ON_ENABLE.to_string(),
            payload: "status=noop".to_string(),
        }
    }

    pub fn on_disable(&self) -> BrickEvent {
        BrickEvent {
            event: events::ON_DISABLE.to_string(),
            payload: "status=noop".to_string(),
        }
    }

    pub fn on_destroy(&self) -> BrickEvent {
        BrickEvent {
            event: events::ON_DESTROY.to_string(),
            payload: "status=noop".to_string(),
        }
    }

    pub fn interact(&mut self, input: InteractInput) -> BrickEvent {
        if !self.state.enabled {
            return BrickEvent {
                event: events::ON_DENIED.to_string(),
                payload: "reason=disabled".to_string(),
            };
        }
        if self.state.locked {
            return BrickEvent {
                event: events::ON_DENIED.to_string(),
                payload: "reason=locked".to_string(),
            };
        }

        self.state.open = !self.state.open;
        BrickEvent {
            event: events::ON_USED.to_string(),
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
                    event: events::ON_DENIED.to_string(),
                    payload: format!("reason=unknown_state:{}", input.key),
                }
            }
        }

        BrickEvent {
            event: events::ON_STATE_CHANGED.to_string(),
            payload: format!("key={},value={}", input.key, input.value),
        }
    }

    pub fn on_tick_low_freq(&mut self) -> BrickEvent {
        self.low_freq_tick_counter += 1;
        let throttle_window = 5;
        if self.low_freq_tick_counter % throttle_window == 0 {
            return BrickEvent {
                event: events::ON_TICK_LOW_FREQ.to_string(),
                payload: format!(
                    "tick={},check=state_snapshot,open={},locked={}",
                    self.low_freq_tick_counter, self.state.open, self.state.locked
                ),
            };
        }

        BrickEvent {
            event: events::ON_TICK_LOW_FREQ.to_string(),
            payload: format!(
                "tick={},check=skipped,throttle={}",
                self.low_freq_tick_counter, throttle_window
            ),
        }
    }

    fn run_validate(&self, input: ValidateInput) -> ValidateOutput {
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

    pub fn on_validate(&self, input: ValidateInput) -> BrickEvent {
        let output = self.run_validate(input);
        BrickEvent {
            event: events::ON_VALIDATE.to_string(),
            payload: serde_json::to_string(&output)
                .unwrap_or_else(|_| "{\"issues\":[]}".to_string()),
        }
    }

    pub fn validate(&self, input: ValidateInput) -> ValidateOutput {
        let event = self.on_validate(input);
        serde_json::from_str::<ValidateOutput>(&event.payload)
            .unwrap_or_else(|_| ValidateOutput { issues: vec![] })
    }
}

pub fn interact_json(brick: &mut DoorBrick, input_json: &str) -> Result<String, serde_json::Error> {
    let input: InteractInput = serde_json::from_str(input_json)?;
    let event = brick.interact(input);
    serde_json::to_string(&event)
}

pub fn set_state_json(
    brick: &mut DoorBrick,
    input_json: &str,
) -> Result<String, serde_json::Error> {
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
    fn error_envelope(request: &Envelope, code: &str, message: &str, details: Value) -> Envelope {
        Envelope {
            protocol_version: PROTOCOL_VERSION.to_string(),
            r#type: "door.interact.response".to_string(),
            request_id: request.request_id.clone(),
            payload: serde_json::json!({}),
            error: Some(ProtocolError {
                code: code.to_string(),
                message: message.to_string(),
                details,
            }),
        }
    }

    let request: Envelope = serde_json::from_str(request_json)?;

    if request.protocol_version != PROTOCOL_VERSION {
        let response = error_envelope(
            &request,
            "INVALID_PROTOCOL_VERSION",
            "protocol_version 不匹配",
            serde_json::json!({
                "expected": PROTOCOL_VERSION,
                "actual": request.protocol_version,
            }),
        );
        return serde_json::to_string(&response);
    }

    if request.r#type != "door.interact.request" {
        let response = error_envelope(
            &request,
            "INVALID_REQUEST_TYPE",
            "type 不匹配",
            serde_json::json!({
                "expected": "door.interact.request",
                "actual": request.r#type,
            }),
        );
        return serde_json::to_string(&response);
    }

    let payload: DoorInteractRequestPayload = match serde_json::from_value(request.payload.clone()) {
        Ok(payload) => payload,
        Err(_) => {
            let response = error_envelope(
                &request,
                "INVALID_REQUEST_PAYLOAD",
                "payload 缺失或格式错误",
                serde_json::json!({
                    "required": ["actor_id"]
                }),
            );
            return serde_json::to_string(&response);
        }
    };
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
        assert_eq!(used.event, events::ON_USED);

        let _ = brick.set_state(SetStateInput {
            key: "locked".to_string(),
            value: true,
        });
        let denied = brick.interact(InteractInput {
            actor_id: "player_1".to_string(),
        });
        assert_eq!(denied.event, events::ON_DENIED);

        let report = brick.validate(ValidateInput {
            door_name: "demo_door".to_string(),
        });
        assert!(report
            .issues
            .iter()
            .any(|issue| issue.code == "MISSING_COLLISION"
                && issue.severity == ValidationSeverity::Error));
        assert!(report
            .issues
            .iter()
            .any(|issue| issue.code == "LOCKED_DEFAULT"
                && issue.severity == ValidationSeverity::Warning));
    }

    #[test]
    fn interact_and_lock_flow_matches_cpp_demo() {
        let mut brick = DoorBrick::new("fate.door.basic", DoorState::default());

        let e1 = brick.interact(InteractInput {
            actor_id: "player_1".to_string(),
        });
        assert_eq!(e1.event, events::ON_USED);
        assert_eq!(e1.payload, "actor_id=player_1,open=true");

        let e2 = brick.set_state(SetStateInput {
            key: "locked".to_string(),
            value: true,
        });
        assert_eq!(e2.event, events::ON_STATE_CHANGED);
        assert_eq!(e2.payload, "key=locked,value=true");

        let e3 = brick.interact(InteractInput {
            actor_id: "player_1".to_string(),
        });
        assert_eq!(e3.event, events::ON_DENIED);
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
            .any(|issue| issue.code == "MISSING_COLLISION"
                && issue.severity == ValidationSeverity::Error));
        assert!(report
            .issues
            .iter()
            .any(|issue| issue.code == "MISSING_TRIGGER"
                && issue.severity == ValidationSeverity::Error));
        assert!(report
            .issues
            .iter()
            .any(|issue| issue.code == "LOCKED_DEFAULT"
                && issue.severity == ValidationSeverity::Warning));
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
        assert_eq!(
            output.issues[0].location.slot_id.as_deref(),
            Some("collision")
        );
    }

    #[test]
    fn lifecycle_entrypoints_and_required_events_exist() {
        let brick = DoorBrick::new("fate.door.basic", DoorState::default());
        assert_eq!(brick.on_spawn().event, events::ON_SPAWN);
        assert_eq!(brick.on_enable().event, events::ON_ENABLE);
        assert_eq!(brick.on_disable().event, events::ON_DISABLE);
        assert_eq!(brick.on_destroy().event, events::ON_DESTROY);
        assert!(events::REQUIRED_EVENTS.contains(&events::ON_VALIDATE));
        assert!(events::REQUIRED_EVENTS.contains(&events::ON_TICK_LOW_FREQ));
    }

    #[test]
    fn validate_and_on_validate_share_the_same_path() {
        let mut state = DoorState::default();
        state.has_collision = false;
        let brick = DoorBrick::new("fate.door.basic", state);

        let direct = brick.validate(ValidateInput {
            door_name: "demo_door".to_string(),
        });

        let event = brick.on_validate(ValidateInput {
            door_name: "demo_door".to_string(),
        });
        assert_eq!(event.event, events::ON_VALIDATE);

        let from_event: ValidateOutput = serde_json::from_str(&event.payload).unwrap();
        assert_eq!(direct, from_event);
    }

    #[test]
    fn low_freq_tick_event_can_be_triggered() {
        let mut brick = DoorBrick::new("fate.door.basic", DoorState::default());
        let mut last = BrickEvent {
            event: String::new(),
            payload: String::new(),
        };

        for _ in 0..5 {
            last = brick.on_tick_low_freq();
        }

        assert_eq!(last.event, events::ON_TICK_LOW_FREQ);
        assert!(last.payload.contains("tick=5"));
        assert!(last.payload.contains("check=state_snapshot"));
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
        assert!(response.error.is_none());
    }

    #[test]
    fn interact_envelope_adapter_rejects_invalid_protocol_version() {
        let mut brick = DoorBrick::new("fate.door.basic", DoorState::default());
        let request = Envelope {
            protocol_version: "9.9".to_string(),
            r#type: "door.interact.request".to_string(),
            request_id: "req-err-version".to_string(),
            payload: serde_json::json!({"actor_id": "player_1"}),
            error: None,
        };

        let response_json =
            handle_interact_envelope_json(&mut brick, &serde_json::to_string(&request).unwrap())
                .unwrap();
        let response: Envelope = serde_json::from_str(&response_json).unwrap();

        assert_eq!(response.r#type, "door.interact.response");
        assert_eq!(response.request_id, "req-err-version");
        assert_eq!(response.error.unwrap().code, "INVALID_PROTOCOL_VERSION");
    }

    #[test]
    fn interact_envelope_adapter_rejects_invalid_type() {
        let mut brick = DoorBrick::new("fate.door.basic", DoorState::default());
        let request = Envelope {
            protocol_version: PROTOCOL_VERSION.to_string(),
            r#type: "door.foo.request".to_string(),
            request_id: "req-err-type".to_string(),
            payload: serde_json::json!({"actor_id": "player_1"}),
            error: None,
        };

        let response_json =
            handle_interact_envelope_json(&mut brick, &serde_json::to_string(&request).unwrap())
                .unwrap();
        let response: Envelope = serde_json::from_str(&response_json).unwrap();

        assert_eq!(response.r#type, "door.interact.response");
        assert_eq!(response.request_id, "req-err-type");
        assert_eq!(response.error.unwrap().code, "INVALID_REQUEST_TYPE");
    }

    #[test]
    fn interact_envelope_adapter_rejects_missing_actor_id() {
        let mut brick = DoorBrick::new("fate.door.basic", DoorState::default());
        let request = Envelope {
            protocol_version: PROTOCOL_VERSION.to_string(),
            r#type: "door.interact.request".to_string(),
            request_id: "req-err-payload".to_string(),
            payload: serde_json::json!({}),
            error: None,
        };

        let response_json =
            handle_interact_envelope_json(&mut brick, &serde_json::to_string(&request).unwrap())
                .unwrap();
        let response: Envelope = serde_json::from_str(&response_json).unwrap();

        assert_eq!(response.r#type, "door.interact.response");
        assert_eq!(response.request_id, "req-err-payload");
        assert_eq!(response.error.unwrap().code, "INVALID_REQUEST_PAYLOAD");
    }
}
