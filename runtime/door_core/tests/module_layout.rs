use door_core::{
    json_api,
    protocol::{Envelope, PROTOCOL_VERSION},
    runtime::DoorBrick,
    scene::DoorSceneComponent,
    state::DoorState,
    validation::ValidateInput,
};

#[test]
fn module_split_surfaces_stable_runtime_entrypoints() {
    let mut brick = DoorBrick::new("fate.door.basic", DoorState::default());
    let scene = DoorSceneComponent::new("door-module-layout");
    let envelope = Envelope {
        protocol_version: PROTOCOL_VERSION.to_string(),
        r#type: "door.interact.request".to_string(),
        request_id: "req-module-layout".to_string(),
        payload: serde_json::json!({
            "actor_id": "player_1",
            "entity_id": scene.entity_id,
        }),
        error: None,
    };

    let response = json_api::handle_interact_envelope_json(
        &mut brick,
        &serde_json::to_string(&envelope).expect("request serializes"),
    )
    .expect("adapter returns json");
    assert!(response.contains("door.interact.response"));

    let report = brick.validate(ValidateInput {
        door_name: "module_layout".to_string(),
    });
    assert!(report.issues.is_empty());
}
