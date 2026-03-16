#pragma once

#include "demo/door_demo_types.h"

#include <string>

namespace fate_demo {

void ValidateManifestRequiredFields(const std::string& content);
bool ParseDefaultBool(const std::string& content, const std::string& key,
                      bool fallback);
DoorState LoadDoorDefaults(const std::string& path);

}  // namespace fate_demo
