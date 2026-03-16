#pragma once

#include "demo/door_demo_types.h"

#include <string>
#include <utility>
#include <vector>

namespace fate_demo {

class DoorBrick {
 public:
  explicit DoorBrick(std::string brick_id, DoorState state = {});

  std::pair<std::string, std::string> Interact(const std::string& actor_id);
  std::pair<std::string, std::string> SetState(const std::string& key, bool value);
  const DoorState& state() const;

 private:
  static std::string BoolToString(bool value);

  std::string brick_id_;
  DoorState state_;
};

std::vector<ValidationIssue> ValidateDoorConfig(const std::string& door_name,
                                                const DoorState& state);

}  // namespace fate_demo
