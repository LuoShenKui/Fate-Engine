#include "demo/door_demo_logic.h"
#include "demo/manifest_loader.h"

#include <exception>
#include <iostream>
#include <string>

int main(int argc, char* argv[]) {
  try {
    const std::string manifest_path =
        (argc > 1) ? std::string(argv[1]) : "packages/door/manifest.json";
    std::cout << "实际使用的 manifest 路径: " << manifest_path << "\n";

    auto state = fate_demo::LoadDoorDefaults(manifest_path);
    fate_demo::DoorBrick door("fate.door.basic", state);

    std::cout << "=== Door Demo (C++) ===\n";
    std::cout << "初始状态: enabled=true"
              << ",locked=" << (door.state().locked ? "true" : "false")
              << ",open=" << (door.state().open ? "true" : "false")
              << ",has_collision=" << (door.state().has_collision ? "true" : "false")
              << ",has_trigger=" << (door.state().has_trigger ? "true" : "false")
              << "\n";

    auto [event1, payload1] = door.Interact("player_1");
    std::cout << "Interact -> " << event1 << " {" << payload1 << "}\n";

    auto [event2, payload2] = door.SetState("locked", true);
    std::cout << "SetState(locked=true) -> " << event2 << " {" << payload2 << "}\n";

    auto [event3, payload3] = door.Interact("player_1");
    std::cout << "Interact when locked -> " << event3 << " {" << payload3 << "}\n";

    const auto report = fate_demo::ValidateDoorConfig("demo_door", door.state());
    if (report.empty()) {
      std::cout << "校验报告: OK\n";
    } else {
      std::cout << "校验报告:\n";
      for (const auto& issue : report) {
        std::cout << "  - severity=" << issue.severity << ",code=" << issue.code
                  << ",message=" << issue.message
                  << ",location.brick_id=" << issue.location.brick_id
                  << ",location.slot_id=" << issue.location.slot_id;
        if (!issue.suggested_fix.empty()) {
          std::cout << ",suggested_fix[0].type=" << issue.suggested_fix[0].type
                    << ",suggested_fix[0].payload=" << issue.suggested_fix[0].payload;
        }
        std::cout << "\n";
      }
    }
  } catch (const std::exception& ex) {
    std::cerr << "运行失败: " << ex.what() << "\n";
    return 1;
  }

  return 0;
}
