#pragma once

#include <string>
#include <vector>

namespace fate_demo {

struct DoorState {
  bool enabled = true;
  bool locked = false;
  bool open = false;
  bool has_collision = true;
  bool has_trigger = true;
};

struct ValidationLocation {
  std::string brick_id;
  std::string slot_id;
};

struct SuggestedFix {
  std::string type;
  std::string payload;
};

struct ValidationIssue {
  std::string severity;
  std::string code;
  std::string message;
  ValidationLocation location;
  std::vector<SuggestedFix> suggested_fix;
};

}  // namespace fate_demo
