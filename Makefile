.PHONY: check check-schema check-rust check-cpp check-ts \
	check-unit check-integration check-replay check-visual check-perf \
	check-m1 check-m2 check-m3 release-local

check:
	@echo "[检查] 开始执行全量检查：schema -> rust -> cpp -> ts -> perf"
	@$(MAKE) check-schema
	@$(MAKE) check-rust
	@$(MAKE) check-cpp
	@$(MAKE) check-ts
	@$(MAKE) check-perf
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

check-unit:
	@echo "[分层检查] Unit：协议/schema + runtime 单元测试"
	@$(MAKE) check-schema
	@$(MAKE) check-rust
	@echo "[分层检查] Unit 通过"

check-integration:
	@echo "[分层检查] Integration：runtime + editor 协议适配"
	@$(MAKE) check-ts
	@echo "[分层检查] Integration 通过"

check-replay:
	@echo "[分层检查] Replay：seed/recipe/lockfile 回放一致性"
	@python3 tools/check_replay_determinism.py
	@echo "[分层检查] Replay 通过"

release-local:
	@echo "[发布] 本地发布（会写入 dist/publish/lockfile）"
	@python3 tools/release_local.py
	@echo "[发布] 本地发布完成"

check-visual:
	@echo "[分层检查] Visual：截图基线比对"
	@cd editor/app && npx -y playwright@1.52.0 install --with-deps chromium
	@npx -y -p playwright@1.52.0 -p pixelmatch@5.3.0 -p pngjs@7.0.0 node editor/app/tools/visual_regression.mjs
	@echo "[分层检查] Visual 通过"

check-perf:
	@echo "[分层检查] Perf：性能预算门禁"
	@python3 tools/check_perf_budget.py
	@echo "[分层检查] Perf 通过"

check-m1:
	@echo "[里程碑 M1] 聚合检查：visual + perf..."
	@$(MAKE) check-visual
	@$(MAKE) check-perf
	@./build/fate_demo | tee /tmp/fate_m1.log
	@grep -q "OnUsed" /tmp/fate_m1.log
	@grep -q "OnDenied" /tmp/fate_m1.log
	@echo "[里程碑 M1] 通过"

check-m2:
	@echo "[里程碑 M2] 聚合检查：unit + integration..."
	@$(MAKE) check-unit
	@$(MAKE) check-integration
	@cargo test --manifest-path runtime/door_core/Cargo.toml trigger_zone_runtime_interact_and_validate_work
	@cargo test --manifest-path runtime/door_core/Cargo.toml door_scene_acceptance_flow_cover_trigger_lock_and_collision
	@echo "[里程碑 M2] 通过"

check-m3:
	@echo "[里程碑 M3] 聚合检查：replay + unit + integration..."
	@$(MAKE) check-replay
	@$(MAKE) check-unit
	@$(MAKE) check-integration
	@echo "[里程碑 M3] 通过"
