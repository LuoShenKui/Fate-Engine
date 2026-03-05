#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EDITOR_DIR="$ROOT_DIR/editor/app"

mode="${1:-all}"

print_usage() {
  cat <<'USAGE'
用法:
  bash tools/start_test.sh [all|editor|cpp|rust|schema]

说明:
  all    : 执行 schema/rust/cpp/editor 检查，并启动 editor 预览（默认）
  editor : 执行 editor 依赖安装 + typecheck + build + preview
  cpp    : 编译并运行 C++ demo
  rust   : 运行 Rust 测试
  schema : 运行 schema 校验
USAGE
}

run_schema() {
  echo "[1/4] Schema 校验..."
  python3 "$ROOT_DIR/tools/validate_schemas.py"
}

run_rust() {
  echo "[2/4] Rust 测试..."
  cargo test --manifest-path "$ROOT_DIR/runtime/door_core/Cargo.toml"
}

run_cpp() {
  echo "[3/4] C++ 编译并运行 Demo..."
  cmake -S "$ROOT_DIR" -B "$ROOT_DIR/build"
  cmake --build "$ROOT_DIR/build"
  "$ROOT_DIR/build/fate_demo"
}

run_editor() {
  echo "[4/4] Editor 安装依赖、类型检查、构建并启动预览..."
  cd "$EDITOR_DIR"
  pnpm install
  pnpm run typecheck
  pnpm run build
  echo "[完成] 正在启动预览：http://localhost:5173"
  pnpm run preview -- --host 0.0.0.0 --port 5173
}

case "$mode" in
  all)
    run_schema
    run_rust
    run_cpp
    run_editor
    ;;
  editor)
    run_editor
    ;;
  cpp)
    run_cpp
    ;;
  rust)
    run_rust
    ;;
  schema)
    run_schema
    ;;
  -h|--help|help)
    print_usage
    ;;
  *)
    echo "未知模式: $mode"
    print_usage
    exit 1
    ;;
esac
