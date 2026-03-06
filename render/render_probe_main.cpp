#include <iostream>
#include <string>

#include "minimal_backend.h"

int main(int argc, char** argv) {
  if (argc != 2) {
    std::cerr << "usage: fate_render_probe <backend>" << std::endl;
    return 2;
  }

  const std::string backend = argv[1];
  const bool available = fate::render::IsBackendAvailable(backend);

  if (!available) {
    std::cerr << "backend_unavailable=" << backend << std::endl;
    return 1;
  }

  std::cout << "backend_available=" << backend << std::endl;
  return 0;
}
