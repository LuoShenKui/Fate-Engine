#include "demo/door_demo_logic.h"

#include <utility>

namespace fate_demo {

DoorBrick::DoorBrick(std::string brick_id, DoorState state)
    : brick_id_(std::move(brick_id)), state_(state) {}

std::pair<std::string, std::string> DoorBrick::Interact(const std::string& actor_id) {
  if (!state_.enabled) {
    return {"OnDenied", "reason=disabled"};
  }
  if (state_.locked) {
    return {"OnDenied", "reason=locked"};
  }
  state_.open = !state_.open;
  return {"OnUsed", "actor_id=" + actor_id + ",open=" + BoolToString(state_.open)};
}

std::pair<std::string, std::string> DoorBrick::SetState(const std::string& key, bool value) {
  if (key == "enabled") {
    state_.enabled = value;
  } else if (key == "locked") {
    state_.locked = value;
  } else if (key == "open") {
    state_.open = value;
  } else if (key == "has_collision") {
    state_.has_collision = value;
  } else if (key == "has_trigger") {
    state_.has_trigger = value;
  } else {
    return {"OnDenied", "reason=unknown_state:" + key};
  }
  return {"OnStateChanged", "key=" + key + ",value=" + BoolToString(value)};
}

const DoorState& DoorBrick::state() const { return state_; }

std::string DoorBrick::BoolToString(bool value) { return value ? "true" : "false"; }

std::vector<ValidationIssue> ValidateDoorConfig(const std::string& door_name,
                                                const DoorState& state) {
  std::vector<ValidationIssue> issues;
  if (!state.has_collision) {
    issues.push_back(ValidationIssue{
        "Error",
        "MISSING_COLLISION",
        door_name + " 缺少碰撞体",
        ValidationLocation{"fate.door.basic", "collision"},
        {SuggestedFix{"set_slot", "slot_id=collision,asset_ref=default_collision"}},
    });
  }
  if (!state.has_trigger) {
    issues.push_back(ValidationIssue{
        "Error",
        "MISSING_TRIGGER",
        door_name + " 缺少触发体",
        ValidationLocation{"fate.door.basic", "trigger"},
        {SuggestedFix{"set_slot", "slot_id=trigger,asset_ref=default_trigger"}},
    });
  }
  return issues;
}

}  // namespace fate_demo
