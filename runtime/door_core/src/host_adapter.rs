use serde::{Deserialize, Serialize};

use crate::{
    DialogueOutcome, DialogueTurn, FateRuntimeCore, HallFeatureModuleRecord, HallStateRecord,
    IntentEnvelope, IntuitionDirective, WorldEvent, WorldSnapshot,
};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum HostSignal {
    Interaction {
        source: String,
        entity_id: String,
        verb: String,
    },
    Environment {
        channel: String,
        value: String,
    },
}

pub struct RuntimeHostBridge;

impl RuntimeHostBridge {
    pub fn tick(runtime: &mut FateRuntimeCore, delta_time: f32) {
        runtime.tick(delta_time);
    }

    pub fn submit_player_intent(
        runtime: &mut FateRuntimeCore,
        intent: IntentEnvelope,
    ) -> crate::ActionResolution {
        runtime.resolve_intent(intent)
    }

    pub fn submit_host_signal(runtime: &mut FateRuntimeCore, signal: HostSignal) -> Result<(), String> {
        runtime.submit_host_signal(signal)
    }

    pub fn consume_events(runtime: &mut FateRuntimeCore) -> Vec<WorldEvent> {
        runtime.consume_events()
    }

    pub fn begin_dialogue(
        runtime: &mut FateRuntimeCore,
        player_entity_id: impl Into<String>,
        npc_entity_id: impl Into<String>,
    ) -> Result<DialogueTurn, String> {
        runtime.begin_dialogue(player_entity_id.into(), npc_entity_id.into())
    }

    pub fn submit_dialogue_choice(
        runtime: &mut FateRuntimeCore,
        turn_id: impl Into<String>,
        option_id: impl Into<String>,
    ) -> Result<DialogueOutcome, String> {
        runtime.submit_dialogue_choice(turn_id.into(), option_id.into())
    }

    pub fn consume_dialogue_turns(runtime: &mut FateRuntimeCore) -> Vec<DialogueTurn> {
        runtime.consume_dialogue_turns()
    }

    pub fn export_snapshot(runtime: &FateRuntimeCore) -> WorldSnapshot {
        runtime.export_snapshot()
    }

    pub fn import_snapshot(runtime: &mut FateRuntimeCore, snapshot: WorldSnapshot) -> Result<(), String> {
        runtime.import_snapshot(snapshot)
    }

    pub fn update_hall_state(runtime: &mut FateRuntimeCore, hall_state: HallStateRecord) {
        runtime.update_hall_state(hall_state);
    }

    pub fn upsert_hall_module(runtime: &mut FateRuntimeCore, module: HallFeatureModuleRecord) -> Result<(), String> {
        runtime.upsert_hall_module(module)
    }

    pub fn deliver_intuition(runtime: &mut FateRuntimeCore, directive: IntuitionDirective) -> Result<(), String> {
        runtime.deliver_intuition(directive)
    }
}
