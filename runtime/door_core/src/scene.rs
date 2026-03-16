use serde::{Deserialize, Serialize};

use crate::state::DoorSyncState;

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
