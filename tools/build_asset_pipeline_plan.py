#!/usr/bin/env python3
"""只读资产流水线计划生成器：根据资源清单与策略配置生成可复现 plan。"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sys

TOOL_VERSION = "0.1.0"


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def sha256_prefixed(payload: bytes) -> str:
    return f"sha256:{sha256_bytes(payload)}"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def normalized_json_hash(data: object) -> str:
    canonical = json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return sha256_prefixed(canonical)


def parse_resources(manifest: dict, base_dir: Path) -> list[dict]:
    resources = manifest.get("resources")
    if not isinstance(resources, list) or not resources:
        raise ValueError("resources 字段必须是非空数组")

    result: list[dict] = []
    for index, item in enumerate(resources):
        if isinstance(item, str):
            rel_path = item
            logical_id = Path(item).stem
        elif isinstance(item, dict):
            rel_path = item.get("path")
            logical_id = item.get("id") or item.get("name") or Path(str(rel_path or "")).stem
        else:
            raise ValueError(f"resources[{index}] 必须为字符串或对象")

        if not isinstance(rel_path, str) or not rel_path:
            raise ValueError(f"resources[{index}].path 缺失")

        file_path = (base_dir / rel_path).resolve()
        if not file_path.exists() or not file_path.is_file():
            raise ValueError(f"资源文件不存在: {rel_path}")

        result.append(
            {
                "id": logical_id,
                "path": rel_path,
                "sha256": sha256_file(file_path),
            }
        )

    return sorted(result, key=lambda item: item["path"])


def build_plan(manifest_path: Path, config_path: Path) -> dict:
    manifest = load_json(manifest_path)
    config = load_json(config_path)

    source_hashes = parse_resources(manifest, manifest_path.parent)
    config_hash = normalized_json_hash(config)
    source_set_hash = normalized_json_hash(source_hashes)
    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    plan_id_payload = {
        "config_hash": config_hash,
        "source_set_hash": source_set_hash,
        "tool_version": TOOL_VERSION,
    }

    return {
        "plan_id": sha256_prefixed(json.dumps(plan_id_payload, sort_keys=True, separators=(",", ":")).encode("utf-8")),
        "generated_at": generated_at,
        "tool_version": TOOL_VERSION,
        "config_path": str(config_path),
        "config_hash": config_hash,
        "source_manifest": str(manifest_path),
        "source_set_hash": source_set_hash,
        "source_hashes": source_hashes,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-manifest", required=True, type=Path, help="DCC 资源清单 JSON 文件")
    parser.add_argument("--pipeline-config", required=True, type=Path, help="流水线策略配置 JSON 文件")
    parser.add_argument("--output", type=Path, help="输出 plan 路径（不填则输出到 stdout）")
    args = parser.parse_args()

    try:
        plan = build_plan(args.source_manifest.resolve(), args.pipeline_config.resolve())
    except (json.JSONDecodeError, OSError, ValueError) as exc:
        print(f"[ERROR] {exc}", file=sys.stderr)
        return 1

    output = json.dumps(plan, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(output, encoding="utf-8")
        print(f"[OK] plan 已写入: {args.output}")
    else:
        print(output, end="")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
