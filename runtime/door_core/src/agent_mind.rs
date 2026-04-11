use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AgentMemoryRecord {
    pub key: String,
    pub value: String,
    pub timestamp_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AgentMindState {
    pub entity_id: String,
    pub persona_profile_id: String,
    pub world_knowledge_refs: Vec<String>,
    pub beliefs: Vec<String>,
    pub short_term_memory: Vec<AgentMemoryRecord>,
    pub long_term_memory: Vec<AgentMemoryRecord>,
    pub goals: Vec<String>,
    pub social_relations: Vec<String>,
    pub secret_flags: Vec<String>,
    pub conversation_state: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub current_focus: Option<String>,
}

impl AgentMindState {
    pub fn new(entity_id: impl Into<String>) -> Self {
        let entity_id = entity_id.into();
        Self {
            persona_profile_id: entity_id.clone(),
            entity_id,
            world_knowledge_refs: Vec::new(),
            beliefs: Vec::new(),
            short_term_memory: Vec::new(),
            long_term_memory: Vec::new(),
            goals: Vec::new(),
            social_relations: Vec::new(),
            secret_flags: Vec::new(),
            conversation_state: "idle".to_string(),
            current_focus: None,
        }
    }
}
