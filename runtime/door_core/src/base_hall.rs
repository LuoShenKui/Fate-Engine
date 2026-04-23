use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct HallFeatureModuleRecord {
    pub module_id: String,
    pub module_kind: String,
    pub label: String,
    pub state: String,
    pub anchor_id: String,
    pub capabilities: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct HallDecorationRecord {
    pub decoration_id: String,
    pub category: String,
    pub anchor_id: String,
    pub transform_position_meters: [f32; 3],
    pub transform_scale: [f32; 3],
    pub style_tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct HallStateRecord {
    pub hall_id: String,
    pub hall_name: String,
    pub theme_mode: String,
    pub active_spawn_anchor_id: String,
    pub modules: Vec<HallFeatureModuleRecord>,
    pub unlocked_anchor_ids: Vec<String>,
}
