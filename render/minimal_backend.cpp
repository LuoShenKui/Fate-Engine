#include "minimal_backend.h"

#include <cstdlib>

namespace fate::render {

bool IsBackendAvailable(const std::string& backend) {
  if (backend == "none") {
    return true;
  }

  if (backend == "vulkan") {
#if FATE_RENDER_ENABLE_VULKAN_SIM
    return std::getenv("FATE_RENDER_DISABLE_VULKAN_SIM") == nullptr;
#else
    return false;
#endif
  }

  if (backend == "dx12") {
    return false;
  }

  return false;
}

} // namespace fate::render
