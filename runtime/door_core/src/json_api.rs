use serde_json::Value;

use crate::{
    DoorBrick, DoorInteractRequestPayload, DoorInteractResponsePayload, Envelope,
    InteractInput, SetStateInput, ValidateInput, DOOR_INTERACT_REQUEST_TYPE,
    DOOR_INTERACT_RESPONSE_TYPE, INVALID_PROTOCOL_VERSION, INVALID_REQUEST_PAYLOAD,
    INVALID_REQUEST_TYPE, PROTOCOL_VERSION, ProtocolError,
};

pub fn interact_json(brick: &mut DoorBrick, input_json: &str) -> Result<String, serde_json::Error> {
    let input: InteractInput = serde_json::from_str(input_json)?;
    let event = brick.interact(input);
    serde_json::to_string(&event)
}

pub fn set_state_json(
    brick: &mut DoorBrick,
    input_json: &str,
) -> Result<String, serde_json::Error> {
    let input: SetStateInput = serde_json::from_str(input_json)?;
    let event = brick.set_state(input);
    serde_json::to_string(&event)
}

pub fn validate_json(brick: &DoorBrick, input_json: &str) -> Result<String, serde_json::Error> {
    let input: ValidateInput = serde_json::from_str(input_json)?;
    let output = brick.validate(input);
    serde_json::to_string(&output)
}

pub fn handle_interact_envelope_json(
    brick: &mut DoorBrick,
    request_json: &str,
) -> Result<String, serde_json::Error> {
    fn error_envelope(request: &Envelope, code: &str, message: &str, details: Value) -> Envelope {
        Envelope {
            protocol_version: PROTOCOL_VERSION.to_string(),
            r#type: DOOR_INTERACT_RESPONSE_TYPE.to_string(),
            request_id: request.request_id.clone(),
            payload: serde_json::json!({}),
            error: Some(ProtocolError {
                code: code.to_string(),
                message: message.to_string(),
                details,
            }),
        }
    }

    let request: Envelope = serde_json::from_str(request_json)?;

    if request.protocol_version != PROTOCOL_VERSION {
        let response = error_envelope(
            &request,
            INVALID_PROTOCOL_VERSION,
            "protocol_version 不匹配",
            serde_json::json!({
                "expected": PROTOCOL_VERSION,
                "actual": request.protocol_version,
            }),
        );
        return serde_json::to_string(&response);
    }

    if request.r#type != DOOR_INTERACT_REQUEST_TYPE {
        let response = error_envelope(
            &request,
            INVALID_REQUEST_TYPE,
            "type 不匹配",
            serde_json::json!({
                "expected": DOOR_INTERACT_REQUEST_TYPE,
                "actual": request.r#type,
            }),
        );
        return serde_json::to_string(&response);
    }

    let payload: DoorInteractRequestPayload = match serde_json::from_value(request.payload.clone())
    {
        Ok(payload) => payload,
        Err(_) => {
            let response = error_envelope(
                &request,
                INVALID_REQUEST_PAYLOAD,
                "payload 缺失或格式错误",
                serde_json::json!({
                    "required": ["actor_id", "entity_id"]
                }),
            );
            return serde_json::to_string(&response);
        }
    };
    brick.scene.entity_id = payload.entity_id;
    let event = brick.interact(InteractInput {
        actor_id: payload.actor_id,
    });

    let response = Envelope {
        protocol_version: PROTOCOL_VERSION.to_string(),
        r#type: DOOR_INTERACT_RESPONSE_TYPE.to_string(),
        request_id: request.request_id,
        payload: serde_json::to_value(DoorInteractResponsePayload {
            event: event.event,
            payload: event.payload,
        })?,
        error: None,
    };

    serde_json::to_string(&response)
}
