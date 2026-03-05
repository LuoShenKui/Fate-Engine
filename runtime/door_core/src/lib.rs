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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DoorState {
    pub enabled: bool,
    pub locked: bool,
    pub open: bool,
    pub has_collision: bool,
    pub has_trigger: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum DoorSyncState {
    Closed,
    Open,
    Locked,
}


#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DoorSceneInteractResult {
    pub accepted: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DoorSceneComponent {
    pub entity_id: String,
    pub has_collision: bool,
    pub has_trigger: bool,
    pub locked: bool,
    pub open_progress: f32,
    pub trigger_radius_m: f32,
    pub actor_distance_m: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct LadderState {
    pub enabled: bool,
    pub occupied: bool,
    pub has_top_anchor: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TriggerZoneState {
    pub enabled: bool,
    pub occupied: bool,
    pub has_bounds: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum CameraMode {
    FirstPerson,
    SecondPerson,
    ThirdPerson,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CameraPreset {
    pub mode: CameraMode,
    pub offset_cm: [i32; 3],
    pub collision_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct EngineDefaults {
    pub gravity_enabled: bool,
    pub gravity_direction: [i32; 3],
    pub active_camera: CameraMode,
}

impl Default for EngineDefaults {
    fn default() -> Self {
        Self {
            gravity_enabled: true,
            gravity_direction: [0, 0, -1],
            active_camera: CameraMode::FirstPerson,
        }
    }
}

impl EngineDefaults {
    pub fn disable_gravity_globally(&mut self) {
        self.gravity_enabled = false;
    }

    pub fn switch_camera(&mut self, mode: CameraMode) {
        self.active_camera = mode;
    }

    pub fn active_camera_preset(&self) -> CameraPreset {
        match self.active_camera {
            CameraMode::FirstPerson => CameraPreset {
                mode: CameraMode::FirstPerson,
                offset_cm: [0, 0, 0],
                collision_enabled: true,
            },
            CameraMode::SecondPerson => CameraPreset {
                mode: CameraMode::SecondPerson,
                offset_cm: [100, 0, 0],
                collision_enabled: true,
            },
            CameraMode::ThirdPerson => CameraPreset {
                mode: CameraMode::ThirdPerson,
                offset_cm: [-200, 0, 120],
                collision_enabled: true,
            },
        }
    }
}

impl Default for LadderState {
    fn default() -> Self {
        Self {
            enabled: true,
            occupied: false,
            has_top_anchor: true,
        }
    }
}

impl Default for TriggerZoneState {
    fn default() -> Self {
        Self {
            enabled: true,
            occupied: false,
            has_bounds: true,
        }
    }
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

impl DoorSceneComponent {
    pub fn new(entity_id: impl Into<String>) -> Self {
        Self {
            entity_id: entity_id.into(),
            has_collision: true,
            has_trigger: true,
            locked: false,
            open_progress: 0.0,
            trigger_radius_m: 1.5,
            actor_distance_m: Some(0.0),
        }
    }

    pub fn sync_state_from_protocol(&mut self, state: DoorSyncState) {
        match state {
            DoorSyncState::Locked => {
                self.locked = true;
                self.open_progress = 0.0;
            }
            DoorSyncState::Open => {
                self.locked = false;
                self.open_progress = 1.0;
            }
            DoorSyncState::Closed => {
                self.locked = false;
                self.open_progress = 0.0;
            }
        }
    }

    pub fn sync_state_to_protocol(&self) -> DoorSyncState {
        if self.locked {
            DoorSyncState::Locked
        } else if self.open_progress >= 0.999 {
            DoorSyncState::Open
        } else {
            DoorSyncState::Closed
        }
    }

    pub fn update_actor_distance(&mut self, distance_m: f32) {
        self.actor_distance_m = Some(distance_m);
    }

    pub fn can_interact(&self) -> bool {
        self.has_trigger
            && self
                .actor_distance_m
                .map(|distance| distance <= self.trigger_radius_m)
                .unwrap_or(false)
    }

    pub fn interact(&mut self) -> DoorSceneInteractResult {
        if self.locked {
            return DoorSceneInteractResult {
                accepted: false,
                reason: Some("locked".to_string()),
            };
        }
        if !self.can_interact() {
            return DoorSceneInteractResult {
                accepted: false,
                reason: Some("out_of_trigger".to_string()),
            };
        }

        let target_open = self.open_progress < 0.5;
        self.step_open_animation(target_open, 1.0);
        DoorSceneInteractResult {
            accepted: true,
            reason: None,
        }
    }

    pub fn step_open_animation(&mut self, target_open: bool, alpha: f32) {
        let clamped_alpha = alpha.clamp(0.0, 1.0);
        let target = if target_open { 1.0 } else { 0.0 };
        self.open_progress += (target - self.open_progress) * clamped_alpha;
        if (self.open_progress - target).abs() < 0.01 {
            self.open_progress = target;
        }
    }

    pub fn blocks_passage(&self) -> bool {
        self.has_collision && self.open_progress < 0.95
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
pub struct LadderBrick {
    pub brick_id: String,
    pub state: LadderState,
}

impl LadderBrick {
    pub fn new(brick_id: impl Into<String>, state: LadderState) -> Self {
        Self {
            brick_id: brick_id.into(),
            state,
        }
    }

    pub fn interact(&mut self, input: InteractInput) -> BrickEvent {
        if !self.state.enabled {
            return BrickEvent {
                event: events::ON_DENIED.to_string(),
                payload: "reason=disabled".to_string(),
            };
        }

        self.state.occupied = !self.state.occupied;
        BrickEvent {
            event: events::ON_USED.to_string(),
            payload: format!(
                "actor_id={},occupied={}",
                input.actor_id, self.state.occupied
            ),
        }
    }

    pub fn validate(&self) -> ValidateOutput {
        let mut issues = Vec::new();
        if !self.state.has_top_anchor {
            issues.push(ValidationIssue {
                severity: ValidationSeverity::Error,
                code: "MISSING_TOP_ANCHOR".to_string(),
                message: "Ladder 缺少顶部锚点".to_string(),
                location: ValidationLocation {
                    brick_id: self.brick_id.clone(),
                    entity_id: None,
                    param_key: None,
                    slot_id: Some("top_anchor".to_string()),
                    node_id: None,
                },
                suggested_fix: None,
            });
        }
        ValidateOutput { issues }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TriggerZoneBrick {
    pub brick_id: String,
    pub state: TriggerZoneState,
}

impl TriggerZoneBrick {
    pub fn new(brick_id: impl Into<String>, state: TriggerZoneState) -> Self {
        Self {
            brick_id: brick_id.into(),
            state,
        }
    }

    pub fn interact(&mut self, input: InteractInput) -> BrickEvent {
        if !self.state.enabled {
            return BrickEvent {
                event: events::ON_DENIED.to_string(),
                payload: "reason=disabled".to_string(),
            };
        }

        self.state.occupied = !self.state.occupied;
        BrickEvent {
            event: events::ON_USED.to_string(),
            payload: format!(
                "actor_id={},occupied={}",
                input.actor_id, self.state.occupied
            ),
        }
    }

    pub fn validate(&self) -> ValidateOutput {
        let mut issues = Vec::new();
        if !self.state.has_bounds {
            issues.push(ValidationIssue {
                severity: ValidationSeverity::Error,
                code: "MISSING_BOUNDS".to_string(),
                message: "TriggerZone 缺少触发范围".to_string(),
                location: ValidationLocation {
                    brick_id: self.brick_id.clone(),
                    entity_id: None,
                    param_key: None,
                    slot_id: Some("bounds".to_string()),
                    node_id: None,
                },
                suggested_fix: None,
            });
        }
        ValidateOutput { issues }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DoorBrick {
    pub brick_id: String,
    pub state: DoorState,
    low_freq_tick_counter: u64,
    pub scene: DoorSceneComponent,
}

impl DoorBrick {
    pub fn new(brick_id: impl Into<String>, state: DoorState) -> Self {
        Self {
            brick_id: brick_id.into(),
            state,
            low_freq_tick_counter: 0,
            scene: DoorSceneComponent::new("door_entity_1"),
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
                payload: format!("entity_id={},actor_id={},reason=locked", self.scene.entity_id, input.actor_id),
            };
        }

        if !self.scene.can_interact() {
            return BrickEvent {
                event: events::ON_DENIED.to_string(),
                payload: format!("entity_id={},actor_id={},reason=out_of_trigger", self.scene.entity_id, input.actor_id),
            };
        }

        self.state.open = !self.state.open;
        self.scene.step_open_animation(self.state.open, 1.0);
        BrickEvent {
            event: events::ON_USED.to_string(),
            payload: format!(
                "entity_id={},actor_id={},state={}",
                self.scene.entity_id,
                input.actor_id,
                if self.state.open { "Open" } else { "Closed" }
            ),
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

        if input.key == "locked" {
            self.scene.sync_state_from_protocol(if input.value {
                DoorSyncState::Locked
            } else if self.state.open {
                DoorSyncState::Open
            } else {
                DoorSyncState::Closed
            });
        }
        if input.key == "open" {
            self.scene.sync_state_from_protocol(if self.state.locked {
                DoorSyncState::Locked
            } else if input.value {
                DoorSyncState::Open
            } else {
                DoorSyncState::Closed
            });
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
                code: validation_codes::MISSING_COLLISION.to_string(),
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
                code: validation_codes::MISSING_TRIGGER.to_string(),
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
                code: validation_codes::LOCKED_DEFAULT.to_string(),
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

    let payload: DoorInteractRequestPayload = match serde_json::from_value(request.payload.clone())
    {
        Ok(payload) => payload,
        Err(_) => {
            let response = error_envelope(
                &request,
                "INVALID_REQUEST_PAYLOAD",
                "payload 缺失或格式错误",
                serde_json::json!({
                    "required": ["actor_id", "entity_id"]
                }),
            );
            return serde_json::to_string(&response);
        }
    };
    brick.scene.entity_id = payload.entity_id;
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
        assert_eq!(e1.payload, "entity_id=door_entity_1,actor_id=player_1,state=Open");

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
        assert_eq!(e3.payload, "entity_id=door_entity_1,actor_id=player_1,reason=locked");
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
            payload: serde_json::json!({"actor_id": "player_1", "entity_id": "door-1"}),
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
            payload: serde_json::json!({"actor_id": "player_1", "entity_id": "door-1"}),
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
            payload: serde_json::json!({"actor_id": "player_1", "entity_id": "door-1"}),
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

    #[test]
    fn ladder_runtime_interact_and_validate_work() {
        let mut state = LadderState::default();
        state.has_top_anchor = false;
        let mut brick = LadderBrick::new("fate.ladder.basic", state);

        let event = brick.interact(InteractInput {
            actor_id: "player_2".to_string(),
        });
        assert_eq!(event.event, events::ON_USED);
        assert_eq!(event.payload, "actor_id=player_2,occupied=true");

        let report = brick.validate();
        assert!(report
            .issues
            .iter()
            .any(|issue| issue.code == "MISSING_TOP_ANCHOR"));
    }

    #[test]
    fn trigger_zone_runtime_interact_and_validate_work() {
        let mut state = TriggerZoneState::default();
        state.has_bounds = false;
        let mut brick = TriggerZoneBrick::new("fate.trigger_zone.basic", state);

        let event = brick.interact(InteractInput {
            actor_id: "player_3".to_string(),
        });
        assert_eq!(event.event, events::ON_USED);
        assert_eq!(event.payload, "actor_id=player_3,occupied=true");

        let report = brick.validate();
        assert!(report
            .issues
            .iter()
            .any(|issue| issue.code == "MISSING_BOUNDS"));
    }


    #[test]
    fn door_scene_acceptance_flow_cover_trigger_lock_and_collision() {
        let mut scene = DoorSceneComponent::new("door-acceptance");

        scene.update_actor_distance(1.0);
        assert!(scene.interact().accepted);
        assert_eq!(scene.sync_state_to_protocol(), DoorSyncState::Open);
        assert!(!scene.blocks_passage());

        scene.sync_state_from_protocol(DoorSyncState::Locked);
        scene.update_actor_distance(1.0);
        let locked = scene.interact();
        assert!(!locked.accepted);
        assert_eq!(locked.reason.as_deref(), Some("locked"));

        scene.sync_state_from_protocol(DoorSyncState::Open);
        assert!(!scene.blocks_passage());

        scene.sync_state_from_protocol(DoorSyncState::Closed);
        assert!(scene.blocks_passage());
    }

    #[test]
    fn engine_defaults_cover_gravity_and_three_cameras() {
        let mut defaults = EngineDefaults::default();
        assert!(defaults.gravity_enabled);
        assert_eq!(defaults.gravity_direction, [0, 0, -1]);
        assert_eq!(defaults.active_camera, CameraMode::FirstPerson);

        defaults.disable_gravity_globally();
        assert!(!defaults.gravity_enabled);

        defaults.switch_camera(CameraMode::SecondPerson);
        let second = defaults.active_camera_preset();
        assert_eq!(second.mode, CameraMode::SecondPerson);
        assert_eq!(second.offset_cm, [100, 0, 0]);
        assert!(second.collision_enabled);

        defaults.switch_camera(CameraMode::ThirdPerson);
        let third = defaults.active_camera_preset();
        assert_eq!(third.mode, CameraMode::ThirdPerson);
        assert_eq!(third.offset_cm, [-200, 0, 120]);
        assert!(third.collision_enabled);
    }
}
