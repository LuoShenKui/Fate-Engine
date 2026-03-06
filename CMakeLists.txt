cmake_minimum_required(VERSION 3.16)
project(FateEngineDemo LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

option(FATE_ENABLE_RENDER "Enable render placeholder module" OFF)
option(FATE_RENDER_ENABLE_VULKAN_SIM "Enable simulated Vulkan backend in minimal render layer" ON)

if(FATE_ENABLE_RENDER)
    add_library(fate_render_placeholder STATIC render/render_placeholder.cpp)
    add_library(fate_render_minimal STATIC render/minimal_backend.cpp)
    target_compile_definitions(
        fate_render_minimal
        PUBLIC
            FATE_RENDER_ENABLE_VULKAN_SIM=$<BOOL:${FATE_RENDER_ENABLE_VULKAN_SIM}>
    )
    add_executable(fate_render_probe render/render_probe_main.cpp)
    target_link_libraries(fate_render_probe PRIVATE fate_render_minimal)
endif()

add_executable(fate_demo src/main.cpp)
