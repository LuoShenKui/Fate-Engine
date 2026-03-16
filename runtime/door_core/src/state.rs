use serde::{Deserialize, Serialize};

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
