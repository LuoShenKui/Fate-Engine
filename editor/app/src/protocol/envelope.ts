/**
 * 协议模块：定义 Envelope/错误结构与 Door 协议适配器。
 * 后续可在此扩展事件连线与多协议编解码。
 */
import { DoorBrick, type DoorBrickEvent, type DoorState, type ValidateOutput } from "../domain/door";

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
};

type DoorInteractResponsePayload = {
  event: string;
  payload: string;
};

export class DoorProtocolAdapter {
  constructor(private readonly door: DoorBrick) {}

  handleInteract(rawRequest: string): string {
    const request = JSON.parse(rawRequest) as Envelope<DoorInteractRequestPayload>;
    const event = this.door.interact(request.payload.actor_id);
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

  setState(key: keyof DoorState, value: boolean): DoorBrickEvent {
    return this.door.setState(key, value);
  }

  validate(doorName: string): ValidateOutput {
    return this.door.validate(doorName);
  }
}
