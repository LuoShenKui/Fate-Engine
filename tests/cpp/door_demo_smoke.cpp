#include "demo/door_demo_logic.h"
#include "demo/manifest_loader.h"

#include <cassert>
#include <fstream>
#include <string>

int main() {
  using fate_demo::DoorBrick;
  using fate_demo::DoorState;
  using fate_demo::LoadDoorDefaults;
  using fate_demo::ValidateDoorConfig;

  const std::string manifest_path =
      std::string(FATE_ENGINE_SOURCE_DIR) + "/tests/cpp/door_demo_manifest.json";
  {
    std::ofstream manifest(manifest_path);
    manifest
        << R"({
  "id": "fate.door.basic",
  "version": "0.1.0",
  "params": {
    "locked": { "default": false },
    "open": { "default": false },
    "has_collision": { "default": true },
    "has_trigger": { "default": true }
  },
  "defaults": {},
  "license": "Proprietary",
  "dependencies": [],
  "engine_compat": "demo>=0.1.0"
})";
  }

  DoorState state = LoadDoorDefaults(manifest_path);
  DoorBrick door("fate.door.basic", state);
  auto [event, payload] = door.Interact("player_1");
  assert(event == "OnUsed");
  assert(payload.find("actor_id=player_1") != std::string::npos);

  const auto issues = ValidateDoorConfig("demo_door", door.state());
  assert(issues.empty());
  return 0;
}
