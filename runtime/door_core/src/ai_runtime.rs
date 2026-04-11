use serde::{Deserialize, Serialize};

use crate::{AgentMindState, IntentEnvelope, WorldEntityKind, WorldSnapshot};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum RuntimeAiMode {
    Disabled,
    Enabled,
    HybridReserved,
}

pub trait RuntimeAiProvider {
    fn plan_intent(
        &self,
        snapshot: &WorldSnapshot,
        agent_state: &AgentMindState,
    ) -> Result<Option<IntentEnvelope>, String>;
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub struct RuntimeFeatureFlags {
    pub npc_ai_enabled: bool,
    pub runtime_ai_mode: RuntimeAiMode,
}

impl Default for RuntimeFeatureFlags {
    fn default() -> Self {
        Self {
            npc_ai_enabled: true,
            runtime_ai_mode: RuntimeAiMode::Enabled,
        }
    }
}

#[derive(Debug, Default, Clone, Copy)]
pub struct DisabledRuntimeAiProvider;

impl RuntimeAiProvider for DisabledRuntimeAiProvider {
    fn plan_intent(
        &self,
        _snapshot: &WorldSnapshot,
        _agent_state: &AgentMindState,
    ) -> Result<Option<IntentEnvelope>, String> {
        Ok(None)
    }
}

#[derive(Debug, Default, Clone, Copy)]
pub struct LocalRuntimeAiProvider;

impl RuntimeAiProvider for LocalRuntimeAiProvider {
    fn plan_intent(
        &self,
        snapshot: &WorldSnapshot,
        agent_state: &AgentMindState,
    ) -> Result<Option<IntentEnvelope>, String> {
        let entity = snapshot
            .entities
            .iter()
            .find(|item| item.id.0 == agent_state.entity_id && item.kind == WorldEntityKind::Npc);
        let Some(entity) = entity else {
            return Ok(None);
        };
        Ok(Some(IntentEnvelope::move_to(
            agent_state.entity_id.clone(),
            [
                entity.position_meters[0] + 1.0,
                entity.position_meters[1],
                entity.position_meters[2],
            ],
        )))
    }
}
