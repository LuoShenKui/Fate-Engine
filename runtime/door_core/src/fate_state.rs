use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct FateStateRecord {
    pub entity_id: String,
    pub timeline_id: String,
    pub fate_tags: Vec<String>,
    pub world_phase: String,
    pub causal_flags: Vec<String>,
    pub branch_state: String,
    pub branch_history: Vec<String>,
    pub active_arc_ids: Vec<String>,
}
