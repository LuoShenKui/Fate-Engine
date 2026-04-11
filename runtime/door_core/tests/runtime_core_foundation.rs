use door_core::{
    ActorClass, AgentMemoryRecord, DisabledRuntimeAiProvider, FateRuntimeCore,
    FateStateRecord, HostSignal, IntentEnvelope, IntentKind, LocalRuntimeAiProvider,
    NpcPersonaProfile, RuntimeAiMode, RuntimeAiProvider, RuntimeFeatureFlags, RuntimeHostBridge,
    TaskInstance, TaskSeed, WorldBibleRecord, WorldCommand, WorldEntity, WorldEntityId,
    WorldEntityKind, WorldEventKind, WorldSnapshot,
};

#[test]
fn world_snapshot_round_trip_is_deterministic_for_same_seed_and_commands() {
    let mut left = FateRuntimeCore::new(4242, RuntimeFeatureFlags::default());
    let mut right = FateRuntimeCore::new(4242, RuntimeFeatureFlags::default());

    let actor = WorldEntity {
        id: WorldEntityId::new("actor-1"),
        kind: WorldEntityKind::Player,
        actor_class: Some(ActorClass::Humanoid),
        position_meters: [0.0, 0.0, 0.0],
        state_tags: vec!["spawned".to_string()],
    };

    left.apply_command(WorldCommand::SpawnEntity(actor.clone()))
        .expect("spawn succeeds");
    right
        .apply_command(WorldCommand::SpawnEntity(actor))
        .expect("spawn succeeds");

    left.apply_command(WorldCommand::TranslateEntity {
        entity_id: WorldEntityId::new("actor-1"),
        delta_meters: [1.0, 0.0, 0.0],
    })
    .expect("translate succeeds");
    right
        .apply_command(WorldCommand::TranslateEntity {
            entity_id: WorldEntityId::new("actor-1"),
            delta_meters: [1.0, 0.0, 0.0],
        })
        .expect("translate succeeds");

    left.tick(0.016);
    right.tick(0.016);

    assert_eq!(left.export_snapshot(), right.export_snapshot());
}

#[test]
fn runtime_ai_feature_flag_can_be_disabled_without_breaking_world_tick() {
    let mut runtime = FateRuntimeCore::new(
        7,
        RuntimeFeatureFlags {
            npc_ai_enabled: false,
            runtime_ai_mode: RuntimeAiMode::Disabled,
        },
    );
    runtime
        .apply_command(WorldCommand::SpawnEntity(WorldEntity {
            id: WorldEntityId::new("npc-1"),
            kind: WorldEntityKind::Npc,
            actor_class: Some(ActorClass::Humanoid),
            position_meters: [0.0, 0.0, 0.0],
            state_tags: vec![],
        }))
        .expect("spawn succeeds");

    runtime.tick(0.033);
    let snapshot = runtime.export_snapshot();

    assert_eq!(snapshot.entities.len(), 1);
    assert!(!snapshot.feature_flags.npc_ai_enabled);
}

#[test]
fn disabled_runtime_ai_provider_never_emits_intents() {
    let provider = DisabledRuntimeAiProvider::default();
    let snapshot = WorldSnapshot::empty(10, RuntimeFeatureFlags::default());
    let agent_state = door_core::AgentMindState::new("npc-1");

    assert!(provider
        .plan_intent(&snapshot, &agent_state)
        .expect("provider succeeds")
        .is_none());
}

#[test]
fn local_runtime_ai_provider_emits_intent_but_world_changes_only_after_resolution() {
    let provider = LocalRuntimeAiProvider::default();
    let mut runtime = FateRuntimeCore::new(9, RuntimeFeatureFlags::default());
    let npc = WorldEntity {
        id: WorldEntityId::new("npc-1"),
        kind: WorldEntityKind::Npc,
        actor_class: Some(ActorClass::Humanoid),
        position_meters: [0.0, 0.0, 0.0],
        state_tags: vec!["idle".to_string()],
    };
    runtime
        .apply_command(WorldCommand::SpawnEntity(npc))
        .expect("spawn succeeds");
    let snapshot = runtime.export_snapshot();

    let intent = provider
        .plan_intent(&snapshot, &door_core::AgentMindState::new("npc-1"))
        .expect("provider succeeds")
        .expect("local provider emits");
    assert_eq!(intent.kind, IntentKind::MoveTo);

    let before = runtime.export_snapshot();
    assert_eq!(before.entities[0].position_meters, [0.0, 0.0, 0.0]);

    let resolution = runtime.resolve_intent(intent);
    assert_eq!(resolution.status, "accepted");

    let after = runtime.export_snapshot();
    assert_ne!(after.entities[0].position_meters, [0.0, 0.0, 0.0]);
}

#[test]
fn runtime_host_bridge_supports_tick_signals_intents_events_and_snapshot_import_export() {
    let mut runtime = FateRuntimeCore::new(99, RuntimeFeatureFlags::default());
    runtime
        .apply_command(WorldCommand::SpawnEntity(WorldEntity {
            id: WorldEntityId::new("player-1"),
            kind: WorldEntityKind::Player,
            actor_class: Some(ActorClass::Humanoid),
            position_meters: [0.0, 0.0, 0.0],
            state_tags: vec![],
        }))
        .expect("spawn succeeds");

    RuntimeHostBridge::tick(&mut runtime, 0.016);
    let resolution = RuntimeHostBridge::submit_player_intent(
        &mut runtime,
        IntentEnvelope::move_to("player-1", [2.0, 0.0, 0.0]),
    );
    assert_eq!(resolution.status, "accepted");

    RuntimeHostBridge::submit_host_signal(
        &mut runtime,
        HostSignal::Interaction {
            source: "unity".to_string(),
            entity_id: "player-1".to_string(),
            verb: "inspect".to_string(),
        },
    )
    .expect("host signal succeeds");

    let events = RuntimeHostBridge::consume_events(&mut runtime);
    assert!(events.iter().any(|event| event.kind == WorldEventKind::IntentResolved));
    assert!(events.iter().any(|event| event.kind == WorldEventKind::HostSignalReceived));

    let snapshot = RuntimeHostBridge::export_snapshot(&runtime);
    let mut restored = FateRuntimeCore::new(1, RuntimeFeatureFlags::default());
    RuntimeHostBridge::import_snapshot(&mut restored, snapshot.clone()).expect("import succeeds");
    assert_eq!(restored.export_snapshot(), snapshot);
}

#[test]
fn agent_mind_fate_state_and_task_records_are_serializable_runtime_contracts() {
    let mut agent = door_core::AgentMindState::new("npc-42");
    agent.short_term_memory.push(AgentMemoryRecord {
        key: "last_seen_player".to_string(),
        value: "player-1".to_string(),
        timestamp_ms: 12,
    });
    agent.goals.push("guard_gate".to_string());

    let fate = FateStateRecord {
        entity_id: "npc-42".to_string(),
        timeline_id: "timeline.guard".to_string(),
        fate_tags: vec!["suspect".to_string(), "branch.guard".to_string()],
        world_phase: "night_watch".to_string(),
        causal_flags: vec!["heard_alarm".to_string()],
        branch_state: "intro".to_string(),
        branch_history: vec!["intro".to_string()],
        active_arc_ids: vec!["arc.guard".to_string()],
    };

    let task = TaskInstance {
        id: "task-1".to_string(),
        seed: TaskSeed {
            template_id: "guard.investigate".to_string(),
            world_phase: "night_watch".to_string(),
            cause: "heard_alarm".to_string(),
        },
        title: "Investigate alarm".to_string(),
        state: "active".to_string(),
    };

    let payload = serde_json::to_string(&(agent, fate, task)).expect("serializes");
    assert!(payload.contains("npc-42"));
    assert!(payload.contains("guard_gate"));
    assert!(payload.contains("night_watch"));
}

#[test]
fn dialogue_turns_are_deterministic_and_update_fate_and_tasks() {
    let mut runtime = FateRuntimeCore::new(333, RuntimeFeatureFlags::default());
    runtime
        .apply_command(WorldCommand::SpawnEntity(WorldEntity {
            id: WorldEntityId::new("player-1"),
            kind: WorldEntityKind::Player,
            actor_class: Some(ActorClass::Humanoid),
            position_meters: [0.0, 0.0, 0.0],
            state_tags: vec![],
        }))
        .expect("spawn player");
    runtime
        .apply_command(WorldCommand::SpawnEntity(WorldEntity {
            id: WorldEntityId::new("npc-guard"),
            kind: WorldEntityKind::Npc,
            actor_class: Some(ActorClass::Humanoid),
            position_meters: [1.0, 0.0, 0.0],
            state_tags: vec![],
        }))
        .expect("spawn npc");
    runtime.register_persona_profile(NpcPersonaProfile {
        id: "npc-guard".to_string(),
        display_name: "Gate Warden".to_string(),
        role: "guard".to_string(),
        faction: "watch".to_string(),
        background_summary: "Keeps the checkpoint closed.".to_string(),
        personality_tags: vec!["guarded".to_string(), "dutiful".to_string()],
        taboo_topics: vec!["hidden_secret".to_string()],
        public_facts: vec!["The checkpoint has been unstable.".to_string()],
        secret_facts: vec!["The alarm was staged.".to_string()],
        relations: vec![],
        initial_goals: vec!["maintain_cover".to_string()],
    });
    runtime.set_world_bible(WorldBibleRecord {
        scene_id: "checkpoint_room".to_string(),
        world_rules: vec!["No one leaves after curfew.".to_string()],
        central_conflict: "trust_vs_survival".to_string(),
        phase_summary: "intro".to_string(),
        public_lore: vec!["The town fears another breach.".to_string()],
    });
    runtime.update_fate_record(FateStateRecord {
        entity_id: "npc-guard".to_string(),
        timeline_id: "timeline.guard".to_string(),
        fate_tags: vec!["guard".to_string()],
        world_phase: "suspicion".to_string(),
        causal_flags: vec!["alarm".to_string()],
        branch_state: "intro".to_string(),
        branch_history: vec!["intro".to_string()],
        active_arc_ids: vec!["arc.guard".to_string()],
    });

    let turn = RuntimeHostBridge::begin_dialogue(&mut runtime, "player-1", "npc-guard")
        .expect("begin dialogue");
    assert_eq!(turn.npc_entity_id, "npc-guard");
    assert!(turn.used_local_llm);
    assert_eq!(turn.context.world_phase, "suspicion");

    let outcome = RuntimeHostBridge::submit_dialogue_choice(&mut runtime, turn.turn_id.clone(), "ask_truth")
        .expect("submit choice");
    assert!(outcome.revealed_flags.iter().any(|flag| flag == "clue.checkpoint_watch"));
    assert!(outcome.fate_effects.iter().any(|flag| flag == "fate.branch.revelation"));

    let snapshot = runtime.export_snapshot();
    assert_eq!(snapshot.fate_records.len(), 1);
    assert_eq!(snapshot.fate_records[0].world_phase, "revelation");
    assert!(!snapshot.active_tasks.is_empty());
}

#[test]
fn disabled_ai_still_runs_dialogue_in_rules_mode() {
    let mut runtime = FateRuntimeCore::new(
        444,
        RuntimeFeatureFlags {
            npc_ai_enabled: false,
            runtime_ai_mode: RuntimeAiMode::Disabled,
        },
    );
    runtime
        .apply_command(WorldCommand::SpawnEntity(WorldEntity {
            id: WorldEntityId::new("player-1"),
            kind: WorldEntityKind::Player,
            actor_class: Some(ActorClass::Humanoid),
            position_meters: [0.0, 0.0, 0.0],
            state_tags: vec![],
        }))
        .expect("spawn player");
    runtime
        .apply_command(WorldCommand::SpawnEntity(WorldEntity {
            id: WorldEntityId::new("npc-1"),
            kind: WorldEntityKind::Npc,
            actor_class: Some(ActorClass::Humanoid),
            position_meters: [1.0, 0.0, 0.0],
            state_tags: vec![],
        }))
        .expect("spawn npc");

    let turn = RuntimeHostBridge::begin_dialogue(&mut runtime, "player-1", "npc-1")
        .expect("begin dialogue");
    assert!(!turn.used_local_llm);
    assert_eq!(turn.context.ai_mode, "rules_only");
}
