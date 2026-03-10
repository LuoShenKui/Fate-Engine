/**
 * 协议模块：定义 Envelope/错误结构与 Door 协议适配器。
 * 后续可在此扩展事件连线与多协议编解码。
 */
import { DoorRuntimeAdapter, type AdapterMode, type DoorBrickEvent, type DoorState, type DoorStateSyncPayload, type ValidateOutput } from "../domain/door";

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
      type: "door.interact.response",
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
        this.buildErrorEnvelope("", "INVALID_JSON", "INVALID_JSON_PAYLOAD", {
          raw: rawRequest,
        }),
      );
    }

    if (typeof parsedRequest !== "object" || parsedRequest === null) {
      return JSON.stringify(
        this.buildErrorEnvelope("", "INVALID_REQUEST", "REQUEST_MUST_BE_OBJECT", {
          field: "root",
        }),
      );
    }

    const request = parsedRequest as Partial<Envelope<DoorInteractRequestPayload>>;
    const requestId = typeof request.request_id === "string" ? request.request_id : "";

    if (request.type !== "door.interact.request") {
      return JSON.stringify(
        this.buildErrorEnvelope(requestId, "INVALID_TYPE", "INVALID_REQUEST_TYPE", {
          expected: "door.interact.request",
          actual: request.type,
        }),
      );
    }

    if (typeof request.request_id !== "string" || request.request_id.trim() === "") {
      return JSON.stringify(
        this.buildErrorEnvelope("", "INVALID_REQUEST_ID", "REQUEST_ID_MUST_BE_NON_EMPTY_STRING", {
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
        this.buildErrorEnvelope(request.request_id, "INVALID_ACTOR_ID", "ACTOR_ID_MUST_BE_NON_EMPTY_STRING", {
          field: "payload.actor_id/payload.entity_id",
        }),
      );
    }

    const event = this.door.interact(request.payload.actor_id, request.payload.entity_id);
    const response: Envelope<DoorInteractResponsePayload> = {
      protocol_version: "1.0",
      type: "door.interact.response",
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
