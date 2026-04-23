use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum IntuitionDirectiveKind {
    TreasureHint,
    ThreatHint,
    QuestHint,
    SystemNotice,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct IntuitionDirective {
    pub directive_id: String,
    pub source: String,
    pub recipient_entity_id: String,
    pub kind: IntuitionDirectiveKind,
    pub summary: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_position_meters: Option<[f32; 3]>,
    pub confidence: f32,
    pub expires_at_tick: u64,
}
