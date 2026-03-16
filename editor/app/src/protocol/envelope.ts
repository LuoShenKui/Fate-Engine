/**
 * 协议模块：定义 Envelope/错误结构与 Door 协议适配器。
 * 后续可在此扩展事件连线与多协议编解码。
 */
import { DoorRuntimeAdapter, type AdapterMode, type DoorBrickEvent, type DoorState, type DoorStateSyncPayload, type ValidateOutput } from "../domain/door";
import {
  DOOR_INTERACT_REQUEST_TYPE,
  DOOR_INTERACT_RESPONSE_TYPE,
  INVALID_PROTOCOL_VERSION,
  INVALID_REQUEST_PAYLOAD,
  INVALID_REQUEST_TYPE,
  PROTOCOL_VERSION,
} from "./contract";

export type ProtocolError = {
  code: string;
  message: string;
  details: unknown;
};

export type Envelope<TPayload> = {
  protocol_version: string;
  type: string;
  request_id: string;
  payload: TPayload;
  error?: ProtocolError;
};

type DoorInteractRequestPayload = {
  actor_id: string;
  entity_id: string;
};

type DoorInteractResponsePayload = {
  event: string;
  payload: string;
};

export class DoorProtocolAdapter {
  constructor(
    private readonly door: DoorRuntimeAdapter,
    private readonly mode: AdapterMode = "demo",
  ) {}

  getMode(): AdapterMode {
    return this.mode;
  }

  private buildErrorEnvelope(requestId: string, code: string, message: string, details: unknown): Envelope<Record<string, never>> {
    return {
      protocol_version: "1.0",
      type: DOOR_INTERACT_RESPONSE_TYPE,
      request_id: requestId,
      payload: {},
      error: {
        code,
        message,
        details,
      },
    };
  }

  handleInteract(rawRequest: string): string {
    let parsedRequest: unknown;
    try {
      parsedRequest = JSON.parse(rawRequest);
    } catch {
      return JSON.stringify(
        this.buildErrorEnvelope("", INVALID_REQUEST_PAYLOAD, "INVALID_JSON_PAYLOAD", {
          raw: rawRequest,
        }),
      );
    }

    if (typeof parsedRequest !== "object" || parsedRequest === null) {
      return JSON.stringify(
        this.buildErrorEnvelope("", INVALID_REQUEST_PAYLOAD, "REQUEST_MUST_BE_OBJECT", {
          field: "root",
        }),
      );
    }

    const request = parsedRequest as Partial<Envelope<DoorInteractRequestPayload>>;
    const requestId = typeof request.request_id === "string" ? request.request_id : "";

    if (request.protocol_version !== PROTOCOL_VERSION) {
      return JSON.stringify(
        this.buildErrorEnvelope(requestId, INVALID_PROTOCOL_VERSION, "INVALID_PROTOCOL_VERSION", {
          expected: PROTOCOL_VERSION,
          actual: request.protocol_version,
        }),
      );
    }

    if (request.type !== DOOR_INTERACT_REQUEST_TYPE) {
      return JSON.stringify(
        this.buildErrorEnvelope(requestId, INVALID_REQUEST_TYPE, "INVALID_REQUEST_TYPE", {
          expected: DOOR_INTERACT_REQUEST_TYPE,
          actual: request.type,
        }),
      );
    }

    if (typeof request.request_id !== "string" || request.request_id.trim() === "") {
      return JSON.stringify(
        this.buildErrorEnvelope("", INVALID_REQUEST_PAYLOAD, "REQUEST_ID_MUST_BE_NON_EMPTY_STRING", {
          field: "request_id",
        }),
      );
    }

    if (
      typeof request.payload !== "object" ||
      request.payload === null ||
      typeof request.payload.actor_id !== "string" ||
      request.payload.actor_id.trim() === "" ||
      typeof request.payload.entity_id !== "string" ||
      request.payload.entity_id.trim() === ""
    ) {
      return JSON.stringify(
        this.buildErrorEnvelope(request.request_id, INVALID_REQUEST_PAYLOAD, "ACTOR_ID_MUST_BE_NON_EMPTY_STRING", {
          field: "payload.actor_id/payload.entity_id",
        }),
      );
    }

    const event = this.door.interact(request.payload.actor_id, request.payload.entity_id);
    const response: Envelope<DoorInteractResponsePayload> = {
      protocol_version: PROTOCOL_VERSION,
      type: DOOR_INTERACT_RESPONSE_TYPE,
      request_id: request.request_id,
      payload: {
        event: event.event,
        payload: event.payload,
      },
    };
    return JSON.stringify(response);
  }

  setState(entityId: string, key: keyof DoorState, value: boolean): DoorBrickEvent {
    return this.door.setState(entityId, key, value);
  }

  validate(doorName: string, entityId?: string): ValidateOutput {
    return this.door.validate(doorName, entityId);
  }

  syncState(payload: DoorStateSyncPayload): DoorBrickEvent {
    return this.door.syncState(payload);
  }
}
