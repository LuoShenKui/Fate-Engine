import type { BatchValidationStats } from "../workflow/validation";
import type { RuntimeEventItem } from "./app-types";
import type { ValidationItem } from "./ValidationPanel";

type Setter<T> = (value: T | ((prev: T) => T)) => void;

type ApplyVisualScenarioPresetArgs = {
  visualScenario: string | null;
  onToggleLock: () => void;
  onInteract: (nodeId?: string) => void;
  setPlayMode: Setter<boolean>;
  setEvents: Setter<RuntimeEventItem[]>;
  setValidationItems: Setter<ValidationItem[]>;
  setBatchEntries: Setter<Array<{ recipeId: string; items: ValidationItem[] }>>;
  setBatchStatsDiff: Setter<BatchValidationStats>;
};

export const applyVisualScenarioPreset = ({
  visualScenario,
  onToggleLock,
  onInteract,
  setPlayMode,
  setEvents,
  setValidationItems,
  setBatchEntries,
  setBatchStatsDiff,
}: ApplyVisualScenarioPresetArgs): void => {
  if (visualScenario === null) return;

  if (visualScenario === "door-lock-unlock") {
    onToggleLock();
    onToggleLock();
    onInteract("door-1");
    return;
  }

  if (visualScenario === "trigger-zone-door-link") {
    setPlayMode(true);
    setEvents([
      { source: "trigger-zone", text: "[trigger_zone] request_id=req-visual entity_id=trigger-zone-1 occupied=true event=OnUsed payload=actor_id=player_1,occupied=true" },
      { source: "link", text: "[trigger_zone_link] source=trigger-zone-1 target=door-1 action=open_on_enter result=interact previous_state=Closed" },
      { source: "door", text: "[door_event] mode=demo request_id=req-visual event=OnUsed payload=entity_id=door-1,actor_id=player_1,state=Open" },
    ]);
    return;
  }

  if (visualScenario === "trigger-zone-door-2-link") {
    setPlayMode(true);
    setEvents([
      { source: "trigger-zone", text: "[trigger_zone] request_id=req-visual-2 entity_id=trigger-zone-2 occupied=true event=OnUsed payload=actor_id=player_1,occupied=true" },
      { source: "link", text: "[trigger_zone_link] source=trigger-zone-2 target=door-2 action=open_on_enter result=interact previous_state=Closed" },
      { source: "door", text: "[door_event] mode=demo request_id=req-visual-2 event=OnUsed payload=entity_id=door-2,actor_id=player_1,state=Open" },
    ]);
    return;
  }

  if (visualScenario === "switch-door-link") {
    setPlayMode(true);
    setEvents([
      { source: "switch", text: "[switch] request_id=req-switch entity_id=switch-1 event=OnUsed payload=entity_id=switch-1,actor_id=player_1,active=true" },
      { source: "link", text: "[switch_link] source=switch-1 target=door-2 action=toggle_on_use result=interact previous_state=Closed" },
      { source: "door", text: "[door_event] mode=demo request_id=req-switch event=OnUsed payload=entity_id=door-2,actor_id=player_1,state=Open" },
    ]);
    return;
  }

  if (visualScenario === "ladder-door-link") {
    setPlayMode(true);
    setEvents([
      { source: "ladder", text: "[ladder] request_id=req-ladder entity_id=ladder-1 event=OnUsed payload=entity_id=ladder-1,actor_id=player_1,occupied=true" },
      { source: "link", text: "[ladder_link] source=ladder-1 target=door-1 action=toggle_on_climb result=interact previous_state=Closed" },
      { source: "door", text: "[door_event] mode=demo request_id=req-ladder event=OnUsed payload=entity_id=door-1,actor_id=player_1,state=Open" },
    ]);
    return;
  }

  if (visualScenario === "validation-levels") {
    const items: ValidationItem[] = [
      { level: "Error", message: "脚本化回归：Error 示例" },
      { level: "Warning", message: "脚本化回归：Warning 示例" },
      { level: "Info", message: "脚本化回归：Info 示例" },
    ];
    setValidationItems(items);
    setBatchEntries([{ recipeId: "visual-validation-levels", items }]);
    setBatchStatsDiff({ totalErrors: 1, totalWarnings: 1 });
  }
};
