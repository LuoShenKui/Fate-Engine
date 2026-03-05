.PHONY: check check-schema check-rust check-cpp check-ts

check:
	@echo "[检查] 开始执行全量检查：schema -> rust -> cpp -> ts"
	@$(MAKE) check-schema
	@$(MAKE) check-rust
	@$(MAKE) check-cpp
	@$(MAKE) check-ts
	@echo "[检查] 全量检查完成"

check-schema:
	@echo "[检查] Schema 校验中..."
	@python3 tools/validate_schemas.py
	@echo "[检查] Schema 校验通过"

check-rust:
	@echo "[检查] Rust 测试中..."
	@cargo test --manifest-path runtime/door_core/Cargo.toml
	@echo "[检查] Rust 测试通过"

check-cpp:
	@echo "[检查] C++ 编译中（仅构建，不运行 demo）..."
	@cmake -S . -B build
	@cmake --build build
	@echo "[检查] C++ 编译通过"

check-ts:
	@echo "[检查] TS 类型检查与构建中..."
	@cd editor/app && pnpm run typecheck && pnpm run build
	@echo "[检查] TS 类型检查与构建通过"
