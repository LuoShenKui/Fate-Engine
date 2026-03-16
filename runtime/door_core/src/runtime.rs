use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::{
    events, validation_codes, DoorSceneComponent, DoorState, DoorSyncState, LadderState,
    TriggerZoneState, ValidateInput, ValidateOutput, ValidationIssue, ValidationLocation,
    ValidationSeverity, SuggestedFix,
};

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
            payload: format!("actor_id={},occupied={}", input.actor_id, self.state.occupied),
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
            payload: format!("actor_id={},occupied={}", input.actor_id, self.state.occupied),
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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PartitionDoorSpec {
    pub entity_id: String,
    pub initial_state: DoorState,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PartitionSpec {
    pub partition_id: String,
    pub doors: Vec<PartitionDoorSpec>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PartitionLoadResult {
    pub partition_id: String,
    pub door_count: usize,
}

#[derive(Debug, Default)]
pub struct PartitionRuntime {
    pub active_partition: Option<String>,
    loaded_doors: HashMap<String, DoorBrick>,
    mounted_states: HashMap<String, DoorState>,
    partition_entities: HashMap<String, Vec<String>>,
}

impl PartitionRuntime {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn load_partition(&mut self, spec: &PartitionSpec) -> PartitionLoadResult {
        let mut entities = Vec::with_capacity(spec.doors.len());
        for door in &spec.doors {
            let mut brick = DoorBrick::new("fate.door.basic", door.initial_state.clone());
            brick.scene.entity_id = door.entity_id.clone();
            if let Some(mounted) = self.mounted_states.get(&door.entity_id) {
                brick.state = mounted.clone();
            }
            entities.push(door.entity_id.clone());
            self.loaded_doors.insert(door.entity_id.clone(), brick);
        }

        self.partition_entities
            .insert(spec.partition_id.clone(), entities);
        self.active_partition = Some(spec.partition_id.clone());
        PartitionLoadResult {
            partition_id: spec.partition_id.clone(),
            door_count: spec.doors.len(),
        }
    }

    pub fn unload_partition(&mut self, partition_id: &str) -> bool {
        let Some(entities) = self.partition_entities.remove(partition_id) else {
            return false;
        };

        for entity_id in entities {
            if let Some(brick) = self.loaded_doors.remove(&entity_id) {
                self.mounted_states.insert(entity_id, brick.state);
            }
        }

        if self.active_partition.as_deref() == Some(partition_id) {
            self.active_partition = None;
        }
        true
    }

    pub fn switch_partition(&mut self, next: &PartitionSpec) -> PartitionLoadResult {
        if let Some(current) = self.active_partition.clone() {
            let _ = self.unload_partition(&current);
        }
        self.load_partition(next)
    }

    pub fn door_mut(&mut self, entity_id: &str) -> Option<&mut DoorBrick> {
        self.loaded_doors.get_mut(entity_id)
    }

    pub fn door_state(&self, entity_id: &str) -> Option<&DoorState> {
        self.loaded_doors.get(entity_id).map(|brick| &brick.state)
    }
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
                payload: format!(
                    "entity_id={},actor_id={},reason=locked",
                    self.scene.entity_id, input.actor_id
                ),
            };
        }

        if !self.scene.can_interact() {
            return BrickEvent {
                event: events::ON_DENIED.to_string(),
                payload: format!(
                    "entity_id={},actor_id={},reason=out_of_trigger",
                    self.scene.entity_id, input.actor_id
                ),
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
