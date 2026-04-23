use std::collections::BTreeMap;

use crate::{
    begin_dialogue_turn, derive_fate_transitions, generate_tasks, resolve_dialogue_choice,
    resolve_intent, ActionResolution, AgentMindState, DialogueOutcome, DialogueTurn, EventBus,
    FateStateRecord, HeadFitProfile, HostSignal, IdentityParameterProfile,
    LocalRuntimeAiProvider, NpcPersonaProfile, PlayerAvatarRecord, PublicPersonaProfile,
    RuntimeAiProvider, RuntimeFeatureFlags, RuntimeReplayLog, TaskInstance, WorldBibleRecord,
    WorldCommand, WorldCore, WorldEntityKind, WorldEvent, WorldEventKind, WorldSnapshot,
    AvatarBodyModel, AvatarTuningProfile, HallFeatureModuleRecord, HallStateRecord,
    IntuitionDirective,
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
    hall_state: Option<HallStateRecord>,
    pending_dialogue_turns: Vec<DialogueTurn>,
    player_avatars: BTreeMap<String, PlayerAvatarRecord>,
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
            hall_state: None,
            pending_dialogue_turns: Vec::new(),
            player_avatars: BTreeMap::new(),
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
        snapshot.hall_state = self.hall_state.clone();
        snapshot.fate_records = self.fate_records.values().cloned().collect();
        snapshot.active_tasks = self.tasks.clone();
        snapshot.agent_minds = self.agent_minds.values().cloned().collect();
        snapshot.dialogue_turns = self.pending_dialogue_turns.clone();
        snapshot.player_avatars = self.player_avatars.values().cloned().collect();
        snapshot
    }

    pub fn import_snapshot(&mut self, snapshot: WorldSnapshot) -> Result<(), String> {
        self.feature_flags = snapshot.feature_flags;
        self.world.import_snapshot(&snapshot);
        self.world_bible = snapshot.world_bible;
        self.hall_state = snapshot.hall_state;
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
        self.player_avatars = snapshot
            .player_avatars
            .into_iter()
            .map(|avatar| (avatar.avatar_id.clone(), avatar))
            .collect();
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

    pub fn update_hall_state(&mut self, hall_state: HallStateRecord) {
        self.hall_state = Some(hall_state);
    }

    pub fn upsert_hall_module(&mut self, module: HallFeatureModuleRecord) -> Result<(), String> {
        let hall_state = self
            .hall_state
            .get_or_insert(HallStateRecord {
                hall_id: "xr-base-hall".to_string(),
                hall_name: "Master Hall".to_string(),
                theme_mode: "realistic_base".to_string(),
                active_spawn_anchor_id: "spawn-point".to_string(),
                modules: Vec::new(),
                unlocked_anchor_ids: vec!["spawn-point".to_string()],
            });
        if let Some(existing) = hall_state.modules.iter_mut().find(|item| item.module_id == module.module_id) {
            *existing = module;
        } else {
            hall_state.modules.push(module);
        }
        Ok(())
    }

    pub fn deliver_intuition(&mut self, directive: IntuitionDirective) -> Result<(), String> {
        let recipient = self
            .agent_minds
            .entry(directive.recipient_entity_id.clone())
            .or_insert_with(|| AgentMindState::new(directive.recipient_entity_id.clone()));
        recipient.intuition_inbox.push(directive.clone());
        self.event_bus.publish(WorldEvent {
            tick: self.export_snapshot().tick,
            kind: WorldEventKind::HostSignalReceived,
            entity_id: Some(directive.recipient_entity_id),
            detail: format!("sixth_sense={}", directive.summary),
        });
        Ok(())
    }

    pub fn upsert_player_avatar(&mut self, avatar: PlayerAvatarRecord) {
        self.player_avatars.insert(avatar.avatar_id.clone(), avatar);
    }

    pub fn switch_avatar_presentation_mode(
        &mut self,
        avatar_id: &str,
        presentation_mode: &str,
    ) -> Result<(), String> {
        let avatar = self
            .player_avatars
            .get_mut(avatar_id)
            .ok_or_else(|| format!("avatar not found: {avatar_id}"))?;
        avatar.public_persona.presentation_mode = presentation_mode.to_string();
        Ok(())
    }

    pub fn create_template_avatar(
        &self,
        avatar_id: String,
        player_entity_id: String,
        template_id: String,
    ) -> PlayerAvatarRecord {
        PlayerAvatarRecord {
            avatar_id: avatar_id.clone(),
            player_entity_id: player_entity_id.clone(),
            identity: IdentityParameterProfile {
                avatar_id: avatar_id.clone(),
                player_entity_id: player_entity_id.clone(),
                height_meters: 1.72,
                build_index: 0.0,
                shoulder_width_meters: 0.43,
                leg_length_ratio: 0.5,
                skin_tone: "neutral_light".to_string(),
                gender_style_tendency: "androgynous".to_string(),
                age_tendency: "young_adult".to_string(),
                facial_feature_params: BTreeMap::new(),
            },
            head_fit: HeadFitProfile {
                avatar_id: avatar_id.clone(),
                capture_mode: "template_fallback".to_string(),
                fit_status: "template_based_avatar".to_string(),
                topology_profile: "standard_humanoid_head".to_string(),
                resemblance_notes: "fallback template avatar".to_string(),
                texture_profile: "hall_face_neutral".to_string(),
                scan_summary: "No passthrough capture available. Template fallback used.".to_string(),
            },
            body_model: AvatarBodyModel {
                avatar_id: avatar_id.clone(),
                template_id: template_id.clone(),
                body_archetype: template_id,
                body_scale: [1.0, 1.0, 1.0],
                template_based_avatar: true,
            },
            tuning: AvatarTuningProfile {
                avatar_id: avatar_id.clone(),
                build_offset: 0.0,
                shoulder_offset: 0.0,
                waist_offset: 0.0,
                hairstyle_id: "hair_short_a".to_string(),
                top_id: "uniform_top_a".to_string(),
                bottom_id: "uniform_bottom_a".to_string(),
                shoes_id: "hall_shoes_a".to_string(),
                eyewear_id: None,
            },
            public_persona: PublicPersonaProfile {
                avatar_id: avatar_id.clone(),
                presentation_mode: "realistic_3d".to_string(),
                anime_persona_id: format!("{avatar_id}-anime"),
                realistic_persona_id: format!("{avatar_id}-real"),
            },
            equipment: vec![
                "hair_short_a".to_string(),
                "uniform_top_a".to_string(),
                "uniform_bottom_a".to_string(),
                "hall_shoes_a".to_string(),
            ],
        }
    }
}
