use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

use crate::{
    AgentMindState, DialogueTurn, FateStateRecord, RuntimeFeatureFlags, TaskInstance,
    WorldBibleRecord,
};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub struct WorldEntityId(pub String);

impl WorldEntityId {
    pub fn new(value: impl Into<String>) -> Self {
        Self(value.into())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum WorldEntityKind {
    Player,
    Npc,
    Object,
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ActorClass {
    Humanoid,
    Generic,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct WorldEntity {
    pub id: WorldEntityId,
    pub kind: WorldEntityKind,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub actor_class: Option<ActorClass>,
    pub position_meters: [f32; 3],
    pub state_tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum WorldCommand {
    SpawnEntity(WorldEntity),
    TranslateEntity {
        entity_id: WorldEntityId,
        delta_meters: [f32; 3],
    },
    ApplyStateTag {
        entity_id: WorldEntityId,
        tag: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum WorldEventKind {
    Spawned,
    Translated,
    TickAdvanced,
    IntentResolved,
    HostSignalReceived,
    SnapshotImported,
    TaskGenerated,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct WorldEvent {
    pub tick: u64,
    pub kind: WorldEventKind,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub entity_id: Option<String>,
    pub detail: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct WorldSnapshot {
    pub seed: u64,
    pub tick: u64,
    pub feature_flags: RuntimeFeatureFlags,
    pub entities: Vec<WorldEntity>,
    pub world_bible: Option<WorldBibleRecord>,
    pub fate_records: Vec<FateStateRecord>,
    pub active_tasks: Vec<TaskInstance>,
    pub agent_minds: Vec<AgentMindState>,
    pub dialogue_turns: Vec<DialogueTurn>,
}

impl WorldSnapshot {
    pub fn empty(seed: u64, feature_flags: RuntimeFeatureFlags) -> Self {
        Self {
            seed,
            tick: 0,
            feature_flags,
            entities: Vec::new(),
            world_bible: None,
            fate_records: Vec::new(),
            active_tasks: Vec::new(),
            agent_minds: Vec::new(),
            dialogue_turns: Vec::new(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct WorldCore {
    seed: u64,
    tick: u64,
    entities: BTreeMap<WorldEntityId, WorldEntity>,
}

impl WorldCore {
    pub fn new(seed: u64) -> Self {
        Self {
            seed,
            tick: 0,
            entities: BTreeMap::new(),
        }
    }

    pub fn tick(&mut self) -> WorldEvent {
        self.tick += 1;
        WorldEvent {
            tick: self.tick,
            kind: WorldEventKind::TickAdvanced,
            entity_id: None,
            detail: format!("tick={}", self.tick),
        }
    }

    pub fn apply_command(&mut self, command: WorldCommand) -> Result<WorldEvent, String> {
        match command {
            WorldCommand::SpawnEntity(entity) => {
                let entity_id = entity.id.0.clone();
                self.entities.insert(entity.id.clone(), entity);
                Ok(WorldEvent {
                    tick: self.tick,
                    kind: WorldEventKind::Spawned,
                    entity_id: Some(entity_id.clone()),
                    detail: format!("spawned={entity_id}"),
                })
            }
            WorldCommand::TranslateEntity {
                entity_id,
                delta_meters,
            } => {
                let entity = self
                    .entities
                    .get_mut(&entity_id)
                    .ok_or_else(|| format!("entity not found: {}", entity_id.0))?;
                entity.position_meters[0] += delta_meters[0];
                entity.position_meters[1] += delta_meters[1];
                entity.position_meters[2] += delta_meters[2];
                Ok(WorldEvent {
                    tick: self.tick,
                    kind: WorldEventKind::Translated,
                    entity_id: Some(entity_id.0.clone()),
                    detail: format!(
                        "delta={:.2}/{:.2}/{:.2}",
                        delta_meters[0], delta_meters[1], delta_meters[2]
                    ),
                })
            }
            WorldCommand::ApplyStateTag { entity_id, tag } => {
                let entity = self
                    .entities
                    .get_mut(&entity_id)
                    .ok_or_else(|| format!("entity not found: {}", entity_id.0))?;
                if !entity.state_tags.iter().any(|item| item == &tag) {
                    entity.state_tags.push(tag.clone());
                }
                Ok(WorldEvent {
                    tick: self.tick,
                    kind: WorldEventKind::IntentResolved,
                    entity_id: Some(entity_id.0.clone()),
                    detail: format!("tag={tag}"),
                })
            }
        }
    }

    pub fn export_snapshot(&self, feature_flags: RuntimeFeatureFlags) -> WorldSnapshot {
        WorldSnapshot {
            seed: self.seed,
            tick: self.tick,
            feature_flags,
            entities: self.entities.values().cloned().collect(),
            world_bible: None,
            fate_records: Vec::new(),
            active_tasks: Vec::new(),
            agent_minds: Vec::new(),
            dialogue_turns: Vec::new(),
        }
    }

    pub fn import_snapshot(&mut self, snapshot: &WorldSnapshot) {
        self.seed = snapshot.seed;
        self.tick = snapshot.tick;
        self.entities = snapshot
            .entities
            .iter()
            .cloned()
            .map(|entity| (entity.id.clone(), entity))
            .collect();
    }
}
