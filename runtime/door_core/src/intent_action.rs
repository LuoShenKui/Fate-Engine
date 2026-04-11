use serde::{Deserialize, Serialize};

use crate::{WorldCommand, WorldEntityId, WorldEvent, WorldEventKind, WorldSnapshot};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum IntentKind {
    MoveTo,
    Interact,
    Speak,
    Listen,
    ChooseDialogueOption,
    CommitDialogueOutcome,
    Wait,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct IntentEnvelope {
    pub source_entity_id: String,
    pub kind: IntentKind,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_entity_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_position_meters: Option<[f32; 3]>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub utterance: Option<String>,
}

impl IntentEnvelope {
    pub fn move_to(source_entity_id: impl Into<String>, target_position_meters: [f32; 3]) -> Self {
        Self {
            source_entity_id: source_entity_id.into(),
            kind: IntentKind::MoveTo,
            target_entity_id: None,
            target_position_meters: Some(target_position_meters),
            utterance: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ActionResolution {
    pub status: String,
    pub message: String,
}

pub fn resolve_intent(
    snapshot: &WorldSnapshot,
    intent: IntentEnvelope,
) -> Result<(ActionResolution, Vec<WorldCommand>, WorldEvent), String> {
    let actor = snapshot
        .entities
        .iter()
        .find(|entity| entity.id.0 == intent.source_entity_id)
        .ok_or_else(|| format!("intent source not found: {}", intent.source_entity_id))?;

    match intent.kind {
        IntentKind::MoveTo => {
            let target = intent
                .target_position_meters
                .ok_or_else(|| "move intent missing target_position_meters".to_string())?;
            let delta = [
                target[0] - actor.position_meters[0],
                target[1] - actor.position_meters[1],
                target[2] - actor.position_meters[2],
            ];
            Ok((
                ActionResolution {
                    status: "accepted".to_string(),
                    message: "move command accepted".to_string(),
                },
                vec![WorldCommand::TranslateEntity {
                    entity_id: WorldEntityId::new(intent.source_entity_id.clone()),
                    delta_meters: delta,
                }],
                WorldEvent {
                    tick: snapshot.tick,
                    kind: WorldEventKind::IntentResolved,
                    entity_id: Some(intent.source_entity_id),
                    detail: "intent=move_to".to_string(),
                },
            ))
        }
        IntentKind::Interact
        | IntentKind::Speak
        | IntentKind::Listen
        | IntentKind::ChooseDialogueOption
        | IntentKind::CommitDialogueOutcome
        | IntentKind::Wait => Ok((
            ActionResolution {
                status: "accepted".to_string(),
                message: "non-movement intent accepted".to_string(),
            },
            Vec::new(),
            WorldEvent {
                tick: snapshot.tick,
                kind: WorldEventKind::IntentResolved,
                entity_id: Some(intent.source_entity_id),
                detail: "intent=non_move".to_string(),
            },
        )),
    }
}
