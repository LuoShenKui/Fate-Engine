#!/usr/bin/env python3
"""Render capability matrix checker."""

import json
import sys
from pathlib import Path

ALLOWED_BACKENDS = {"none", "dx12", "vulkan"}
ALLOWED_TIERS = {"tier0", "tier1"}


def fail(message: str) -> int:
    print(f"[错误] {message}")
    return 1


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

    print("[检查] Render capability matrix 校验通过")
    print(f"[检查] backend={backend}, feature_tier={tier}, fallback_chain={fallback_chain}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
