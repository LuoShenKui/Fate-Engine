.PHONY: check check-schema check-rust check-cpp check-ts check-m1 check-m2 check-m3

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

check-m1:
	@echo "[里程碑 M1] 真实3D视口 Door 占位交互检查..."
	@$(MAKE) check-cpp
	@./build/fate_demo | tee /tmp/fate_m1.log
	@grep -q "OnUsed" /tmp/fate_m1.log
	@grep -q "OnDenied" /tmp/fate_m1.log
	@echo "[里程碑 M1] 通过"

check-m2:
	@echo "[里程碑 M2] 碰撞/触发闭环检查..."
	@cargo test --manifest-path runtime/door_core/Cargo.toml trigger_zone_runtime_interact_and_validate_work
	@cargo test --manifest-path runtime/door_core/Cargo.toml door_scene_acceptance_flow_cover_trigger_lock_and_collision
	@echo "[里程碑 M2] 通过"

check-m3:
	@echo "[里程碑 M3] 可复现回放与自动化冒烟检查..."
	@python3 tools/release_local.py
	@$(MAKE) check-schema
	@$(MAKE) check-rust
	@$(MAKE) check-ts
	@echo "[里程碑 M3] 通过"

