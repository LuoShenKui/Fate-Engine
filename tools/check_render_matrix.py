#!/usr/bin/env python3
"""Render capability matrix checker."""

import json
import subprocess
import sys
from pathlib import Path

ALLOWED_BACKENDS = {"none", "dx12", "vulkan"}
ALLOWED_TIERS = {"tier0", "tier1"}
PROBE_BASENAME = "fate_render_probe"


def candidate_probe_bins() -> list[Path]:
    names = [PROBE_BASENAME, f"{PROBE_BASENAME}.exe"]
    dirs = [Path("build-render"), Path("build-render/Release"), Path("build-render/Debug"), Path("build-render/RelWithDebInfo")]
    return [directory / name for directory in dirs for name in names]


def find_probe_bin() -> Path | None:
    for candidate in candidate_probe_bins():
        if candidate.exists():
            return candidate
    return None


def fail(message: str) -> int:
    print(f"[错误] {message}")
    return 1


def probe_backend(backend: str) -> bool:
    probe_bin = find_probe_bin()
    if probe_bin is None:
        candidates = ", ".join(str(path) for path in candidate_probe_bins())
        print(
            "[错误] 后端探测程序不存在，请先执行 cmake -S . -B build-render -DFATE_ENABLE_RENDER=ON && "
            "cmake --build build-render --target fate_render_probe；已尝试路径: " + candidates
        )
        return False

    result = subprocess.run(
        [str(probe_bin), backend],
        capture_output=True,
        text=True,
        check=False,
    )

    if result.returncode != 0:
        stderr = result.stderr.strip()
        stdout = result.stdout.strip()
        detail = stderr or stdout or f"exit={result.returncode}"
        print(f"[错误] 后端可用性探测失败: backend={backend}, detail={detail}")
        return False

    print(f"[检查] 后端可用性探测通过: backend={backend}")
    return True


def main() -> int:
    config_path = Path("protocol/runtime/render_capabilities.json")
    if not config_path.exists():
        return fail(f"未找到配置文件: {config_path}")

    try:
        data = json.loads(config_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return fail(f"配置文件 JSON 解析失败: {exc}")

    render = data.get("render")
    if not isinstance(render, dict):
        return fail("缺少对象字段 render")

    backend = render.get("backend")
    tier = render.get("feature_tier")
    fallback_chain = render.get("fallback_chain")

    if backend not in ALLOWED_BACKENDS:
        return fail(f"backend 非法: {backend}（允许: {sorted(ALLOWED_BACKENDS)}）")

    if tier not in ALLOWED_TIERS:
        return fail(f"feature_tier 非法: {tier}（允许: {sorted(ALLOWED_TIERS)}）")

    if not isinstance(fallback_chain, list) or not fallback_chain:
        return fail("fallback_chain 必须是非空数组")

    if any(item not in ALLOWED_BACKENDS for item in fallback_chain):
        return fail(f"fallback_chain 包含非法后端: {fallback_chain}")

    if len(set(fallback_chain)) != len(fallback_chain):
        return fail(f"fallback_chain 出现重复项，存在回退环路风险: {fallback_chain}")

    if fallback_chain[-1] != "none":
        return fail("fallback_chain 必须以 none 结尾以保证回退收敛")

    if backend != "none" and backend not in fallback_chain:
        print("[警告] backend 未出现在 fallback_chain 中，将按配置直接尝试 backend 后再按链路回退")

    probed = set()
    for candidate in [backend, *fallback_chain]:
        if candidate == "none" or candidate in probed:
            continue
        probed.add(candidate)
        if not probe_backend(candidate):
            return 1

    print("[检查] Render capability matrix 校验通过")
    print(f"[检查] backend={backend}, feature_tier={tier}, fallback_chain={fallback_chain}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
