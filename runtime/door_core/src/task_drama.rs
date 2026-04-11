use serde::{Deserialize, Serialize};

use crate::{FateStateRecord, WorldSnapshot};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TaskSeed {
    pub template_id: String,
    pub world_phase: String,
    pub cause: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TaskInstance {
    pub id: String,
    pub seed: TaskSeed,
    pub title: String,
    pub state: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct FateTransition {
    pub entity_id: String,
    pub next_world_phase: String,
    pub branch_state: String,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TaskMutation {
    pub task_id: String,
    pub mutation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct WorldReaction {
    pub reaction_id: String,
    pub detail: String,
}

pub fn generate_tasks(snapshot: &WorldSnapshot, fate_records: &[FateStateRecord]) -> Vec<TaskInstance> {
    fate_records
        .iter()
        .filter(|record| !record.causal_flags.is_empty())
        .map(|record| TaskInstance {
            id: format!("task-{}-{}", snapshot.tick, record.entity_id),
            seed: TaskSeed {
                template_id: "fate.runtime.reactive_task".to_string(),
                world_phase: record.world_phase.clone(),
                cause: record.causal_flags[0].clone(),
            },
            title: format!("Respond to {}", record.causal_flags[0]),
            state: "active".to_string(),
        })
        .collect()
}

pub fn derive_fate_transitions(
    fate_records: &[FateStateRecord],
    fate_effects: &[String],
) -> Vec<FateTransition> {
    fate_records
        .iter()
        .filter_map(|record| {
            if fate_effects.iter().any(|effect| effect.contains("revelation")) {
                Some(FateTransition {
                    entity_id: record.entity_id.clone(),
                    next_world_phase: "revelation".to_string(),
                    branch_state: "truth_exposed".to_string(),
                    reason: "dialogue.revelation".to_string(),
                })
            } else if fate_effects.iter().any(|effect| effect.contains("cooperation")) {
                Some(FateTransition {
                    entity_id: record.entity_id.clone(),
                    next_world_phase: "choice".to_string(),
                    branch_state: "cooperative_path".to_string(),
                    reason: "dialogue.cooperation".to_string(),
                })
            } else if fate_effects.iter().any(|effect| effect.contains("suspicion")) {
                Some(FateTransition {
                    entity_id: record.entity_id.clone(),
                    next_world_phase: "suspicion".to_string(),
                    branch_state: "trust_eroded".to_string(),
                    reason: "dialogue.suspicion".to_string(),
                })
            } else {
                None
            }
        })
        .collect()
}
