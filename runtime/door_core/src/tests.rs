use crate::*;

#[test]
fn interaction_events_and_validator_levels_are_covered() {
    let mut state = DoorState::default();
    state.has_collision = false;
    state.locked = false;

    let mut brick = DoorBrick::new("fate.door.basic", state);
    let used = brick.interact(InteractInput {
        actor_id: "player_1".to_string(),
    });
    assert_eq!(used.event, events::ON_USED);

    let _ = brick.set_state(SetStateInput {
        key: "locked".to_string(),
        value: true,
    });
    let denied = brick.interact(InteractInput {
        actor_id: "player_1".to_string(),
    });
    assert_eq!(denied.event, events::ON_DENIED);

    let report = brick.validate(ValidateInput {
        door_name: "demo_door".to_string(),
    });
    assert!(report
        .issues
        .iter()
        .any(|issue| issue.code == "MISSING_COLLISION"
            && issue.severity == ValidationSeverity::Error));
    assert!(report
        .issues
        .iter()
        .any(|issue| issue.code == "LOCKED_DEFAULT"
            && issue.severity == ValidationSeverity::Warning));
}

#[test]
fn interact_and_lock_flow_matches_cpp_demo() {
    let mut brick = DoorBrick::new("fate.door.basic", DoorState::default());

    let e1 = brick.interact(InteractInput {
        actor_id: "player_1".to_string(),
    });
    assert_eq!(e1.event, events::ON_USED);
    assert_eq!(
        e1.payload,
        "entity_id=door_entity_1,actor_id=player_1,state=Open"
    );

    let e2 = brick.set_state(SetStateInput {
        key: "locked".to_string(),
        value: true,
    });
    assert_eq!(e2.event, events::ON_STATE_CHANGED);
    assert_eq!(e2.payload, "key=locked,value=true");

    let e3 = brick.interact(InteractInput {
        actor_id: "player_1".to_string(),
    });
    assert_eq!(e3.event, events::ON_DENIED);
    assert_eq!(
        e3.payload,
        "entity_id=door_entity_1,actor_id=player_1,reason=locked"
    );
}

#[test]
fn validate_reports_error_and_warning_levels() {
    let mut state = DoorState::default();
    state.has_collision = false;
    state.has_trigger = false;
    state.locked = true;

    let brick = DoorBrick::new("fate.door.basic", state);
    let report = brick.validate(ValidateInput {
        door_name: "demo_door".to_string(),
    });

    assert!(report
        .issues
        .iter()
        .any(|issue| issue.code == "MISSING_COLLISION"
            && issue.severity == ValidationSeverity::Error));
    assert!(report
        .issues
        .iter()
        .any(|issue| issue.code == "MISSING_TRIGGER"
            && issue.severity == ValidationSeverity::Error));
    assert!(report
        .issues
        .iter()
        .any(|issue| issue.code == "LOCKED_DEFAULT"
            && issue.severity == ValidationSeverity::Warning));
}

#[test]
fn validate_json_returns_structured_issues() {
    let mut state = DoorState::default();
    state.has_collision = false;
    let brick = DoorBrick::new("fate.door.basic", state);

    let output_json = validate_json(&brick, r#"{"door_name":"demo_door"}"#).unwrap();
    let output: ValidateOutput = serde_json::from_str(&output_json).unwrap();

    assert_eq!(output.issues.len(), 1);
    assert_eq!(output.issues[0].code, "MISSING_COLLISION");
    assert_eq!(output.issues[0].location.brick_id, "fate.door.basic");
    assert_eq!(
        output.issues[0].location.slot_id.as_deref(),
        Some("collision")
    );
}

#[test]
fn lifecycle_entrypoints_and_required_events_exist() {
    let brick = DoorBrick::new("fate.door.basic", DoorState::default());
    assert_eq!(brick.on_spawn().event, events::ON_SPAWN);
    assert_eq!(brick.on_enable().event, events::ON_ENABLE);
    assert_eq!(brick.on_disable().event, events::ON_DISABLE);
    assert_eq!(brick.on_destroy().event, events::ON_DESTROY);
    assert!(events::REQUIRED_EVENTS.contains(&events::ON_VALIDATE));
    assert!(events::REQUIRED_EVENTS.contains(&events::ON_TICK_LOW_FREQ));
}

#[test]
fn validate_and_on_validate_share_the_same_path() {
    let mut state = DoorState::default();
    state.has_collision = false;
    let brick = DoorBrick::new("fate.door.basic", state);

    let direct = brick.validate(ValidateInput {
        door_name: "demo_door".to_string(),
    });

    let event = brick.on_validate(ValidateInput {
        door_name: "demo_door".to_string(),
    });
    assert_eq!(event.event, events::ON_VALIDATE);

    let from_event: ValidateOutput = serde_json::from_str(&event.payload).unwrap();
    assert_eq!(direct, from_event);
}

#[test]
fn low_freq_tick_event_can_be_triggered() {
    let mut brick = DoorBrick::new("fate.door.basic", DoorState::default());
    let mut last = BrickEvent {
        event: String::new(),
        payload: String::new(),
    };

    for _ in 0..5 {
        last = brick.on_tick_low_freq();
    }

    assert_eq!(last.event, events::ON_TICK_LOW_FREQ);
    assert!(last.payload.contains("tick=5"));
    assert!(last.payload.contains("check=state_snapshot"));
}

#[test]
fn interact_envelope_adapter_round_trip() {
    let mut brick = DoorBrick::new("fate.door.basic", DoorState::default());
    let request = Envelope {
        protocol_version: PROTOCOL_VERSION.to_string(),
        r#type: "door.interact.request".to_string(),
        request_id: "req-1".to_string(),
        payload: serde_json::json!({"actor_id": "player_1", "entity_id": "door-1"}),
        error: None,
    };

    let request_json = serde_json::to_string(&request).unwrap();
    let response_json = handle_interact_envelope_json(&mut brick, &request_json).unwrap();
    let response: Envelope = serde_json::from_str(&response_json).unwrap();

    assert_eq!(response.protocol_version, PROTOCOL_VERSION);
    assert_eq!(response.r#type, "door.interact.response");
    assert_eq!(response.request_id, "req-1");
    assert!(response.error.is_none());
}

#[test]
fn interact_envelope_adapter_rejects_invalid_protocol_version() {
    let mut brick = DoorBrick::new("fate.door.basic", DoorState::default());
    let request = Envelope {
        protocol_version: "9.9".to_string(),
        r#type: "door.interact.request".to_string(),
        request_id: "req-err-version".to_string(),
        payload: serde_json::json!({"actor_id": "player_1", "entity_id": "door-1"}),
        error: None,
    };

    let response_json =
        handle_interact_envelope_json(&mut brick, &serde_json::to_string(&request).unwrap())
            .unwrap();
    let response: Envelope = serde_json::from_str(&response_json).unwrap();

    assert_eq!(response.r#type, "door.interact.response");
    assert_eq!(response.request_id, "req-err-version");
    assert_eq!(response.error.unwrap().code, "INVALID_PROTOCOL_VERSION");
}

#[test]
fn interact_envelope_adapter_rejects_invalid_type() {
    let mut brick = DoorBrick::new("fate.door.basic", DoorState::default());
    let request = Envelope {
        protocol_version: PROTOCOL_VERSION.to_string(),
        r#type: "door.foo.request".to_string(),
        request_id: "req-err-type".to_string(),
        payload: serde_json::json!({"actor_id": "player_1", "entity_id": "door-1"}),
        error: None,
    };

    let response_json =
        handle_interact_envelope_json(&mut brick, &serde_json::to_string(&request).unwrap())
            .unwrap();
    let response: Envelope = serde_json::from_str(&response_json).unwrap();

    assert_eq!(response.r#type, "door.interact.response");
    assert_eq!(response.request_id, "req-err-type");
    assert_eq!(response.error.unwrap().code, "INVALID_REQUEST_TYPE");
}

#[test]
fn interact_envelope_adapter_rejects_missing_actor_id() {
    let mut brick = DoorBrick::new("fate.door.basic", DoorState::default());
    let request = Envelope {
        protocol_version: PROTOCOL_VERSION.to_string(),
        r#type: "door.interact.request".to_string(),
        request_id: "req-err-payload".to_string(),
        payload: serde_json::json!({}),
        error: None,
    };

    let response_json =
        handle_interact_envelope_json(&mut brick, &serde_json::to_string(&request).unwrap())
            .unwrap();
    let response: Envelope = serde_json::from_str(&response_json).unwrap();

    assert_eq!(response.r#type, "door.interact.response");
    assert_eq!(response.request_id, "req-err-payload");
    assert_eq!(response.error.unwrap().code, "INVALID_REQUEST_PAYLOAD");
}

#[test]
fn ladder_runtime_interact_and_validate_work() {
    let mut state = LadderState::default();
    state.has_top_anchor = false;
    let mut brick = LadderBrick::new("fate.ladder.basic", state);

    let event = brick.interact(InteractInput {
        actor_id: "player_2".to_string(),
    });
    assert_eq!(event.event, events::ON_USED);
    assert_eq!(event.payload, "actor_id=player_2,occupied=true");

    let report = brick.validate();
    assert!(report
        .issues
        .iter()
        .any(|issue| issue.code == "MISSING_TOP_ANCHOR"));
}

#[test]
fn trigger_zone_runtime_interact_and_validate_work() {
    let mut state = TriggerZoneState::default();
    state.has_bounds = false;
    let mut brick = TriggerZoneBrick::new("fate.trigger_zone.basic", state);

    let event = brick.interact(InteractInput {
        actor_id: "player_3".to_string(),
    });
    assert_eq!(event.event, events::ON_USED);
    assert_eq!(event.payload, "actor_id=player_3,occupied=true");

    let report = brick.validate();
    assert!(report
        .issues
        .iter()
        .any(|issue| issue.code == "MISSING_BOUNDS"));
}

#[test]
fn door_scene_acceptance_flow_cover_trigger_lock_and_collision() {
    let mut scene = DoorSceneComponent::new("door-acceptance");

    scene.update_actor_distance(1.0);
    assert!(scene.interact().accepted);
    assert_eq!(scene.sync_state_to_protocol(), DoorSyncState::Open);
    assert!(!scene.blocks_passage());

    scene.sync_state_from_protocol(DoorSyncState::Locked);
    scene.update_actor_distance(1.0);
    let locked = scene.interact();
    assert!(!locked.accepted);
    assert_eq!(locked.reason.as_deref(), Some("locked"));

    scene.sync_state_from_protocol(DoorSyncState::Open);
    assert!(!scene.blocks_passage());

    scene.sync_state_from_protocol(DoorSyncState::Closed);
    assert!(scene.blocks_passage());
}

#[test]
fn engine_defaults_cover_gravity_and_three_cameras() {
    let mut defaults = EngineDefaults::default();
    assert!(defaults.gravity_enabled);
    assert_eq!(defaults.gravity_direction, [0, 0, -1]);
    assert_eq!(defaults.active_camera, CameraMode::FirstPerson);

    defaults.disable_gravity_globally();
    assert!(!defaults.gravity_enabled);

    defaults.switch_camera(CameraMode::SecondPerson);
    let second = defaults.active_camera_preset();
    assert_eq!(second.mode, CameraMode::SecondPerson);
    assert_eq!(second.offset_cm, [100, 0, 0]);
    assert!(second.collision_enabled);

    defaults.switch_camera(CameraMode::ThirdPerson);
    let third = defaults.active_camera_preset();
    assert_eq!(third.mode, CameraMode::ThirdPerson);
    assert_eq!(third.offset_cm, [-200, 0, 120]);
    assert!(third.collision_enabled);
}

#[test]
#[ignore = "long-running soak entry, run explicitly in nightly"]
fn door_runtime_stability_soak_entry() {
    let soak_seconds = std::env::var("DOOR_SOAK_SECONDS")
        .ok()
        .and_then(|value| value.parse::<u64>().ok())
        .unwrap_or(30);

    let start = std::time::Instant::now();
    let mut brick = DoorBrick::new("fate.door.basic", DoorState::default());
    let mut tick_total = 0_u64;

    while start.elapsed().as_secs() < soak_seconds {
        if tick_total % 11 == 0 {
            let _ = brick.set_state(SetStateInput {
                key: "locked".to_string(),
                value: tick_total % 22 == 0,
            });
        }

        let interact = brick.interact(InteractInput {
            actor_id: format!("soak_actor_{}", tick_total % 16),
        });
        assert!(interact.event == events::ON_USED || interact.event == events::ON_DENIED);

        let tick = brick.on_tick_low_freq();
        assert_eq!(tick.event, events::ON_TICK_LOW_FREQ);
        tick_total += 1;
    }

    assert!(tick_total > 0);
}

#[test]
fn door_runtime_stability_smoke_10k_ticks() {
    let mut brick = DoorBrick::new("fate.door.basic", DoorState::default());

    let mut snapshot_ticks = 0;
    for i in 0..10_000 {
        if i % 7 == 0 {
            let event = brick.set_state(SetStateInput {
                key: "locked".to_string(),
                value: i % 14 == 0,
            });
            assert_eq!(event.event, events::ON_STATE_CHANGED);
        }

        let interact = brick.interact(InteractInput {
            actor_id: format!("soak_actor_{}", i % 8),
        });
        assert!(
            interact.event == events::ON_USED || interact.event == events::ON_DENIED,
            "unexpected interact event at tick {}: {}",
            i,
            interact.event
        );

        let tick = brick.on_tick_low_freq();
        assert_eq!(tick.event, events::ON_TICK_LOW_FREQ);
        assert!(
            tick.payload.contains("check=state_snapshot")
                || tick.payload.contains("check=skipped")
        );
        if tick.payload.contains("check=state_snapshot") {
            snapshot_ticks += 1;
        }
    }

    assert!(snapshot_ticks > 0);

    let report = brick.validate(ValidateInput {
        door_name: "soak_door".to_string(),
    });
    assert!(report
        .issues
        .iter()
        .all(|issue| issue.severity != ValidationSeverity::Error));
}

#[test]
fn partition_switch_round_trip_keeps_door_state() {
    let mut runtime = PartitionRuntime::new();
    let partition_a = PartitionSpec {
        partition_id: "p_a".to_string(),
        doors: vec![PartitionDoorSpec {
            entity_id: "door_a_1".to_string(),
            initial_state: DoorState::default(),
        }],
    };
    let partition_b = PartitionSpec {
        partition_id: "p_b".to_string(),
        doors: vec![],
    };

    let _ = runtime.load_partition(&partition_a);
    let door = runtime
        .door_mut("door_a_1")
        .expect("door should be loaded in partition A");
    let _ = door.set_state(SetStateInput {
        key: "open".to_string(),
        value: true,
    });
    let _ = door.set_state(SetStateInput {
        key: "locked".to_string(),
        value: true,
    });

    let _ = runtime.switch_partition(&partition_b);
    let _ = runtime.switch_partition(&partition_a);

    let restored = runtime
        .door_state("door_a_1")
        .expect("door should be restored after switching back");
    assert!(restored.open);
    assert!(restored.locked);
}
