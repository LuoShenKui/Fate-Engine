#include <fstream>
#include <iostream>
#include <map>
#include <regex>
#include <sstream>
#include <string>
#include <stdexcept>
#include <vector>

struct DoorState {
  bool enabled = true;
  bool locked = false;
  bool open = false;
  bool has_collision = true;
  bool has_trigger = true;
};

class DoorBrick {
 public:
  explicit DoorBrick(std::string brick_id, DoorState state = {})
      : brick_id_(std::move(brick_id)), state_(state) {}

  std::pair<std::string, std::string> Interact(const std::string& actor_id) {
    if (!state_.enabled) {
      return {"OnDenied", "reason=disabled"};
    }
    if (state_.locked) {
      return {"OnDenied", "reason=locked"};
    }
    state_.open = !state_.open;
    return {"OnUsed", "actor_id=" + actor_id + ",open=" + BoolToString(state_.open)};
  }

  std::pair<std::string, std::string> SetState(const std::string& key, bool value) {
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

  const DoorState& state() const { return state_; }

 private:
  static std::string BoolToString(bool value) { return value ? "true" : "false"; }

  std::string brick_id_;
  DoorState state_;
};

std::vector<std::string> ValidateDoorConfig(const std::string& door_name,
                                            const DoorState& state) {
  std::vector<std::string> issues;
  if (!state.has_collision) {
    issues.push_back("Error:" + door_name + ":MISSING_COLLISION:Door 缺少碰撞体");
  }
  if (!state.has_trigger) {
    issues.push_back("Error:" + door_name + ":MISSING_TRIGGER:Door 缺少触发体");
  }
  return issues;
}

bool ParseDefaultBool(const std::string& content, const std::string& key,
                      bool fallback) {
  const std::regex pattern("\"" + key +
                           "\"\\s*:\\s*\\{[^\\}]*\"default\"\\s*:\\s*(true|false)");
  std::smatch match;
  if (std::regex_search(content, match, pattern) && match.size() > 1) {
    return match[1] == "true";
  }
  return fallback;
}

DoorState LoadDoorDefaults(const std::string& path) {
  std::ifstream input(path);
  if (!input) {
    throw std::runtime_error("无法读取 manifest: " + path);
  }

  std::stringstream buffer;
  buffer << input.rdbuf();
  const auto content = buffer.str();

  DoorState state;
  state.locked = ParseDefaultBool(content, "locked", false);
  state.open = ParseDefaultBool(content, "open", false);
  state.has_collision = ParseDefaultBool(content, "has_collision", true);
  state.has_trigger = ParseDefaultBool(content, "has_trigger", true);
  return state;
}

int main() {
  try {
    auto state = LoadDoorDefaults("bricks/door/manifest.json");
    DoorBrick door("fate.door.basic", state);

    std::cout << "=== Door Demo (C++) ===\n";
    std::cout << "初始状态: enabled=true"
              << ",locked=" << (door.state().locked ? "true" : "false")
              << ",open=" << (door.state().open ? "true" : "false")
              << ",has_collision=" << (door.state().has_collision ? "true" : "false")
              << ",has_trigger=" << (door.state().has_trigger ? "true" : "false") << "\n";

    auto [event1, payload1] = door.Interact("player_1");
    std::cout << "Interact -> " << event1 << " {" << payload1 << "}\n";

    auto [event2, payload2] = door.SetState("locked", true);
    std::cout << "SetState(locked=true) -> " << event2 << " {" << payload2 << "}\n";

    auto [event3, payload3] = door.Interact("player_1");
    std::cout << "Interact when locked -> " << event3 << " {" << payload3 << "}\n";

    const auto report = ValidateDoorConfig("demo_door", door.state());
    if (report.empty()) {
      std::cout << "校验报告: OK\n";
    } else {
      std::cout << "校验报告:\n";
      for (const auto& issue : report) {
        std::cout << "  - " << issue << "\n";
      }
    }
  } catch (const std::exception& ex) {
    std::cerr << "运行失败: " << ex.what() << "\n";
    return 1;
  }

  return 0;
}
