use serde::{Deserialize, Serialize};

use crate::{WorldEvent, WorldSnapshot};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SnapshotReplayRecord {
    pub version: String,
    pub snapshot: WorldSnapshot,
    pub events: Vec<WorldEvent>,
}

#[derive(Debug, Default, Clone)]
pub struct RuntimeReplayLog {
    records: Vec<SnapshotReplayRecord>,
}

impl RuntimeReplayLog {
    pub fn push(&mut self, snapshot: WorldSnapshot, events: Vec<WorldEvent>) {
        self.records.push(SnapshotReplayRecord {
            version: "1.0".to_string(),
            snapshot,
            events,
        });
    }

    pub fn latest(&self) -> Option<&SnapshotReplayRecord> {
        self.records.last()
    }
}
