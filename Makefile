RENDER_BUILD_CONFIG ?= Release

.PHONY: check check-schema check-rust check-cpp check-ts check-compliance \
	check-unit check-integration check-replay check-visual check-perf check-perf-scenes check-stability \
	check-soak-2h check-soak-8h check-partition-streaming check-m1 check-m2 check-m3 \
	check-render-matrix check-render-backend-init release-local

check:
	@echo "[检查] 开始执行全量检查：schema -> rust -> cpp -> ts -> perf"
	@$(MAKE) check-schema
	@$(MAKE) check-rust
	@$(MAKE) check-cpp
	@$(MAKE) check-ts
	@$(MAKE) check-compliance
	@$(MAKE) check-perf-scenes
	@echo "[检查] 全量检查完成"

check-compliance:
	@echo "[检查] 依赖合规扫描中..."
	@python3 tools/check_dependency_compliance.py
	@echo "[检查] 依赖合规扫描通过"

check-schema:
	@echo "[检查] Schema 校验中..."
	@python3 tools/validate_schemas.py
	@python3 tools/check_schema_compat.py 		--baseline-dir "$${SCHEMA_BASELINE_DIR:-protocol/schemas}" 		--current-dir "$${SCHEMA_CURRENT_DIR:-protocol/schemas}" 		--docs-root "$${SCHEMA_MIGRATION_DOCS_DIR:-docs/protocol-migrations}" 		--report-json "$${SCHEMA_COMPAT_REPORT_JSON:-artifacts/schema_compat_report.json}"
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

check-stability:
	@echo "[检查] 运行时稳定性基线检查中..."
	@python3 tools/check_runtime_stability.py
	@echo "[检查] 运行时稳定性基线检查通过"


check-soak-2h:
	@echo "[检查] 运行时长稳检查（2h）..."
	@python3 tools/check_runtime_soak.py --profile 2h
	@echo "[检查] 运行时长稳检查（2h）通过"

check-soak-8h:
	@echo "[检查] 运行时长稳检查（8h）..."
	@python3 tools/check_runtime_soak.py --profile 8h
	@echo "[检查] 运行时长稳检查（8h）通过"

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

check-partition-streaming:
	@echo "[检查] 分区流送回放检查中..."
	@python3 tools/check_partition_streaming.py
	@echo "[检查] 分区流送回放检查通过"

check-render-backend-init:
	@echo "[检查] Render 后端初始化探测构建中..."
	@cmake -S . -B build-render -DFATE_ENABLE_RENDER=ON
	@cmake --build build-render --config $(RENDER_BUILD_CONFIG) --target fate_render_probe
	@echo "[检查] Render 后端初始化探测构建通过"

check-render-matrix: check-render-backend-init
	@echo "[检查] Render 能力矩阵检查中（配置合法 + 后端可用性探测）..."
	@python3 tools/check_render_matrix.py
	@echo "[检查] Render 能力矩阵检查通过"

release-local:
	@echo "[发布] 本地发布（会写入 dist/publish/lockfile）"
	@python3 tools/release_local.py
	@echo "[发布] 本地发布完成"

check-visual:
	@echo "[分层检查] Visual：截图基线比对"
	@[ -f editor/app/node_modules/playwright/package.json ] \
		&& cd editor/app && node tools/visual_regression.mjs \
		|| echo "[分层检查] Visual：未安装 playwright，跳过自动截图比对（按 docs/ScreenshotOperation.md 执行手工流程）"
	@echo "[分层检查] Visual 检查结束"

check-perf:
	@echo "[分层检查] Perf：单场景性能预算门禁（兼容目标）"
	@python3 tools/check_perf_budget.py --metrics fixtures/perf/sample_scene_metrics.json
	@echo "[分层检查] Perf 通过"

check-perf-scenes:
	@echo "[分层检查] Perf：多场景性能预算门禁"
	@mkdir -p artifacts/perf
	@set -e; \
	for file in fixtures/perf/*.json; do \
		name=$$(basename "$$file" .json); \
		python3 tools/check_perf_budget.py --metrics "$$file" --report-json "artifacts/perf/$${name}_report.json"; \
	done
	@echo "[分层检查] Perf 多场景检查通过"

check-m1:
	@echo "[里程碑 M1] 聚合检查：visual + perf..."
	@$(MAKE) check-visual
	@$(MAKE) check-perf-scenes
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
