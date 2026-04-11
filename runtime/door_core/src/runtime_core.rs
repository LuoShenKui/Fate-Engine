use std::collections::BTreeMap;

use crate::{
    begin_dialogue_turn, derive_fate_transitions, generate_tasks, resolve_dialogue_choice,
    resolve_intent, ActionResolution, AgentMindState, DialogueOutcome, DialogueTurn, EventBus,
    FateStateRecord, HostSignal, LocalRuntimeAiProvider, NpcPersonaProfile, RuntimeAiProvider,
    RuntimeFeatureFlags, RuntimeReplayLog, TaskInstance, WorldBibleRecord, WorldCommand,
    WorldCore, WorldEntityKind, WorldEvent, WorldEventKind, WorldSnapshot,
};

pub struct FateRuntimeCore {
    world: WorldCore,
    event_bus: EventBus,
    feature_flags: RuntimeFeatureFlags,
    replay_log: RuntimeReplayLog,
    fate_records: BTreeMap<String, FateStateRecord>,
    agent_minds: BTreeMap<String, AgentMindState>,
    tasks: Vec<TaskInstance>,
    persona_profiles: BTreeMap<String, NpcPersonaProfile>,
    world_bible: Option<WorldBibleRecord>,
    pending_dialogue_turns: Vec<DialogueTurn>,
}

impl FateRuntimeCore {
    pub fn new(seed: u64, feature_flags: RuntimeFeatureFlags) -> Self {
        Self {
            world: WorldCore::new(seed),
            event_bus: EventBus::default(),
            feature_flags,
            replay_log: RuntimeReplayLog::default(),
            fate_records: BTreeMap::new(),
            agent_minds: BTreeMap::new(),
            tasks: Vec::new(),
            persona_profiles: BTreeMap::new(),
            world_bible: None,
            pending_dialogue_turns: Vec::new(),
        }
    }

    pub fn tick(&mut self, _delta_time: f32) {
        self.event_bus.publish(self.world.tick());
        if self.feature_flags.npc_ai_enabled {
            let snapshot = self.export_snapshot();
            let provider = LocalRuntimeAiProvider;
            let npc_ids: Vec<String> = snapshot
                .entities
                .iter()
                .filter(|entity| entity.kind == WorldEntityKind::Npc)
                .map(|entity| entity.id.0.clone())
                .collect();
            for entity_id in npc_ids {
                let agent_state = self
                    .agent_minds
                    .entry(entity_id.clone())
                    .or_insert_with(|| AgentMindState::new(entity_id.clone()))
                    .clone();
                if let Ok(Some(intent)) = provider.plan_intent(&snapshot, &agent_state) {
                    let _ = self.resolve_intent(intent);
                }
            }
        }
        let snapshot = self.export_snapshot();
        self.replay_log.push(snapshot, self.event_bus.clone().drain());
    }

    pub fn apply_command(&mut self, command: WorldCommand) -> Result<(), String> {
        let event = self.world.apply_command(command)?;
        self.event_bus.publish(event);
        Ok(())
    }

    pub fn resolve_intent(&mut self, intent: crate::IntentEnvelope) -> ActionResolution {
        let snapshot = self.export_snapshot();
        match resolve_intent(&snapshot, intent) {
            Ok((resolution, commands, event)) => {
                for command in commands {
                    if let Err(err) = self.apply_command(command) {
                        return ActionResolution {
                            status: "rejected".to_string(),
                            message: err,
                        };
                    }
                }
                self.event_bus.publish(event);
                resolution
            }
            Err(err) => ActionResolution {
                status: "rejected".to_string(),
                message: err,
            },
        }
    }

    pub fn submit_host_signal(&mut self, signal: HostSignal) -> Result<(), String> {
        let detail = match signal {
            HostSignal::Interaction {
                source,
                entity_id,
                verb,
            } => format!("source={source},entity={entity_id},verb={verb}"),
            HostSignal::Environment { channel, value } => format!("channel={channel},value={value}"),
        };
        self.event_bus.publish(WorldEvent {
            tick: self.export_snapshot().tick,
            kind: WorldEventKind::HostSignalReceived,
            entity_id: None,
            detail,
        });
        Ok(())
    }

    pub fn consume_events(&mut self) -> Vec<WorldEvent> {
        self.event_bus.drain()
    }

    pub fn export_snapshot(&self) -> WorldSnapshot {
        let mut snapshot = self.world.export_snapshot(self.feature_flags);
        snapshot.world_bible = self.world_bible.clone();
        snapshot.fate_records = self.fate_records.values().cloned().collect();
        snapshot.active_tasks = self.tasks.clone();
        snapshot.agent_minds = self.agent_minds.values().cloned().collect();
        snapshot.dialogue_turns = self.pending_dialogue_turns.clone();
        snapshot
    }

    pub fn import_snapshot(&mut self, snapshot: WorldSnapshot) -> Result<(), String> {
        self.feature_flags = snapshot.feature_flags;
        self.world.import_snapshot(&snapshot);
        self.world_bible = snapshot.world_bible;
        self.fate_records = snapshot
            .fate_records
            .into_iter()
            .map(|record| (record.entity_id.clone(), record))
            .collect();
        self.tasks = snapshot.active_tasks;
        self.agent_minds = snapshot
            .agent_minds
            .into_iter()
            .map(|mind| (mind.entity_id.clone(), mind))
            .collect();
        self.pending_dialogue_turns = snapshot.dialogue_turns;
        self.event_bus.publish(WorldEvent {
            tick: snapshot.tick,
            kind: WorldEventKind::SnapshotImported,
            entity_id: None,
            detail: "snapshot imported".to_string(),
        });
        Ok(())
    }

    pub fn update_fate_record(&mut self, record: FateStateRecord) {
        self.fate_records.insert(record.entity_id.clone(), record);
        let snapshot = self.export_snapshot();
        self.tasks = generate_tasks(&snapshot, &self.fate_records.values().cloned().collect::<Vec<_>>());
        for task in &self.tasks {
            self.event_bus.publish(WorldEvent {
                tick: snapshot.tick,
                kind: WorldEventKind::TaskGenerated,
                entity_id: None,
                detail: format!("task={}", task.id),
            });
        }
    }

    pub fn register_persona_profile(&mut self, profile: NpcPersonaProfile) {
        self.persona_profiles.insert(profile.id.clone(), profile);
    }

    pub fn set_world_bible(&mut self, world_bible: WorldBibleRecord) {
        self.world_bible = Some(world_bible);
    }

    pub fn begin_dialogue(
        &mut self,
        player_entity_id: String,
        npc_entity_id: String,
    ) -> Result<DialogueTurn, String> {
        let snapshot = self.export_snapshot();
        let mind = self
            .agent_minds
            .entry(npc_entity_id.clone())
            .or_insert_with(|| AgentMindState::new(npc_entity_id.clone()))
            .clone();
        let persona = self
            .persona_profiles
            .get(&mind.persona_profile_id)
            .or_else(|| self.persona_profiles.get(&npc_entity_id))
            .cloned()
            .unwrap_or_else(|| NpcPersonaProfile {
                id: npc_entity_id.clone(),
                display_name: npc_entity_id.clone(),
                role: "witness".to_string(),
                faction: "neutral".to_string(),
                background_summary: "A resident with incomplete trust.".to_string(),
                personality_tags: vec!["guarded".to_string()],
                taboo_topics: vec!["hidden_secret".to_string()],
                public_facts: vec!["The checkpoint is unstable.".to_string()],
                secret_facts: vec!["A cover-up is in progress.".to_string()],
                relations: Vec::new(),
                initial_goals: vec!["maintain_cover".to_string()],
            });
        let mut turn = begin_dialogue_turn(
            &snapshot,
            &mind,
            &persona,
            self.fate_records.get(&npc_entity_id),
            &self.tasks,
            self.world_bible.as_ref(),
            self.feature_flags.npc_ai_enabled,
        );
        turn.player_entity_id = player_entity_id;
        self.pending_dialogue_turns.push(turn.clone());
        self.event_bus.publish(WorldEvent {
            tick: snapshot.tick,
            kind: WorldEventKind::IntentResolved,
            entity_id: Some(npc_entity_id),
            detail: format!("dialogue_begin={}", turn.turn_id),
        });
        Ok(turn)
    }

    pub fn submit_dialogue_choice(
        &mut self,
        turn_id: String,
        option_id: String,
    ) -> Result<DialogueOutcome, String> {
        let turn = self
            .pending_dialogue_turns
            .iter()
            .find(|turn| turn.turn_id == turn_id)
            .cloned()
            .ok_or_else(|| format!("dialogue turn not found: {turn_id}"))?;
        let npc_entity_id = turn.npc_entity_id.clone();
        let persona = self
            .persona_profiles
            .get(&npc_entity_id)
            .cloned()
            .unwrap_or_else(|| NpcPersonaProfile {
                id: npc_entity_id.clone(),
                display_name: npc_entity_id.clone(),
                role: "witness".to_string(),
                faction: "neutral".to_string(),
                background_summary: "A resident with incomplete trust.".to_string(),
                personality_tags: vec!["guarded".to_string()],
                taboo_topics: vec!["hidden_secret".to_string()],
                public_facts: vec!["The checkpoint is unstable.".to_string()],
                secret_facts: vec!["A cover-up is in progress.".to_string()],
                relations: Vec::new(),
                initial_goals: vec!["maintain_cover".to_string()],
            });
        let outcome = resolve_dialogue_choice(&turn, &persona, &option_id, self.feature_flags.npc_ai_enabled)?;
        let snapshot_tick = self.export_snapshot().tick;

        if let Some(mind) = self.agent_minds.get_mut(&npc_entity_id) {
            mind.conversation_state = "resolved".to_string();
            for flag in &outcome.revealed_flags {
                if !mind.short_term_memory.iter().any(|record| &record.value == flag) {
                    mind.short_term_memory.push(crate::AgentMemoryRecord {
                        key: "revealed_flag".to_string(),
                        value: flag.clone(),
                        timestamp_ms: snapshot_tick,
                    });
                }
                if !mind.long_term_memory.iter().any(|record| &record.value == flag) {
                    mind.long_term_memory.push(crate::AgentMemoryRecord {
                        key: "revealed_flag".to_string(),
                        value: flag.clone(),
                        timestamp_ms: snapshot_tick,
                    });
                }
            }
            if !mind
                .beliefs
                .iter()
                .any(|belief| belief == &format!("last_intent:{}", outcome.intent))
            {
                mind.beliefs.push(format!("last_intent:{}", outcome.intent));
            }
        }

        if !outcome.fate_effects.is_empty() {
            let records = self.fate_records.values().cloned().collect::<Vec<_>>();
            for transition in derive_fate_transitions(&records, &outcome.fate_effects) {
                if let Some(record) = self.fate_records.get_mut(&transition.entity_id) {
                    record.world_phase = transition.next_world_phase.clone();
                    record.branch_state = transition.branch_state.clone();
                    record.branch_history.push(transition.reason.clone());
                }
            }
        }

        for mutation in &outcome.task_mutations {
            if let Some(task) = self.tasks.first_mut() {
                task.state = mutation.clone();
            }
        }

        self.event_bus.publish(WorldEvent {
            tick: self.export_snapshot().tick,
            kind: WorldEventKind::IntentResolved,
            entity_id: Some(npc_entity_id),
            detail: format!("dialogue_choice={option_id}"),
        });
        for reaction in &outcome.world_reactions {
            self.event_bus.publish(WorldEvent {
                tick: self.export_snapshot().tick,
                kind: WorldEventKind::IntentResolved,
                entity_id: None,
                detail: format!("world_reaction={reaction}"),
            });
        }

        Ok(outcome)
    }

    pub fn consume_dialogue_turns(&mut self) -> Vec<DialogueTurn> {
        std::mem::take(&mut self.pending_dialogue_turns)
    }
}
