export type DoorSyncState = "Closed" | "Open" | "Locked";

export type DoorSceneInteractResult = {
  accepted: boolean;
  reason?: "locked" | "out_of_trigger";
};

export class DoorSceneComponent {
  private openProgress = 0;
  private triggerDistance = 1.5;
  private actorDistance = Number.POSITIVE_INFINITY;
  private locked = false;

  constructor(public readonly entityId: string) {}

  syncFromProtocol(state: DoorSyncState): void {
    if (state === "Locked") {
      this.locked = true;
      this.openProgress = 0;
      return;
    }
    this.locked = false;
    this.openProgress = state === "Open" ? 1 : 0;
  }

  syncToProtocol(): DoorSyncState {
    if (this.locked) {
      return "Locked";
    }
    return this.openProgress >= 0.95 ? "Open" : "Closed";
  }

  updateActorDistance(distance: number): void {
    this.actorDistance = distance;
  }

  interact(): DoorSceneInteractResult {
    if (this.locked) {
      return { accepted: false, reason: "locked" };
    }
    if (this.actorDistance > this.triggerDistance) {
      return { accepted: false, reason: "out_of_trigger" };
    }
    this.stepAnimation(this.openProgress < 0.5 ? 1 : 0, 1);
    return { accepted: true };
  }

  stepAnimation(target: 0 | 1, alpha: number): void {
    this.openProgress += (target - this.openProgress) * Math.max(0, Math.min(1, alpha));
    if (Math.abs(this.openProgress - target) < 0.01) {
      this.openProgress = target;
    }
  }

  blocksPassage(): boolean {
    return this.openProgress < 0.95;
  }
}
