#!/usr/bin/env python3
"""回放一致性检查（只读）：基于 recipe/seed/lockfile 生成标准化快照并比对。"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_RECIPE = ROOT / "fixtures" / "replay" / "fixed_recipe.json"
DEFAULT_LOCKFILE = ROOT / "packages" / "brick.lock.json"
DEFAULT_SEED = 123


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def canonical_dump(payload: Any) -> str:
    return json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def payload_hash(payload: Any) -> str:
    return hashlib.sha256(canonical_dump(payload).encode("utf-8")).hexdigest()


def build_summary(seed: int, recipe_path: Path, lockfile_path: Path) -> dict[str, Any]:
    recipe = load_json(recipe_path)
    lockfile = load_json(lockfile_path)

    packages = lockfile.get("packages", [])
    package_ids = sorted(f"{item['package']}@{item['version']}" for item in packages)

    summary: dict[str, Any] = {
        "seed": seed,
        "recipe": {
            "path": str(recipe_path.relative_to(ROOT)),
            "sha256": sha256_file(recipe_path),
            "id": recipe.get("id"),
            "steps": len(recipe.get("steps", [])),
            "content_hash": payload_hash(recipe),
        },
        "lockfile": {
            "path": str(lockfile_path.relative_to(ROOT)),
            "sha256": sha256_file(lockfile_path),
            "version": lockfile.get("version"),
            "package_count": len(packages),
            "package_ids": package_ids,
            "content_hash": payload_hash(lockfile),
        },
    }
    summary["summary_hash"] = payload_hash(summary)
    return summary


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--recipe", type=Path, default=DEFAULT_RECIPE)
    parser.add_argument("--lockfile", type=Path, default=DEFAULT_LOCKFILE)
    parser.add_argument("--expected", type=Path, help="期望快照路径（JSON）。提供后将与该快照比对。")
    parser.add_argument("--snapshot-out", type=Path, help="将当前快照写入文件（可选）。")
    args = parser.parse_args()

    recipe_path = args.recipe.resolve()
    lockfile_path = args.lockfile.resolve()

    current = build_summary(args.seed, recipe_path, lockfile_path)

    if args.snapshot_out is not None:
        args.snapshot_out.write_text(json.dumps(current, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    if args.expected is not None:
        expected = load_json(args.expected.resolve())
        if canonical_dump(current) != canonical_dump(expected):
            print("[ERROR] replay snapshot mismatch against expected file")
            print(f"current={current['summary_hash']}")
            print(f"expected={expected.get('summary_hash', '<missing>')}")
            return 1
    else:
        rerun = build_summary(args.seed, recipe_path, lockfile_path)
        if canonical_dump(current) != canonical_dump(rerun):
            print("[ERROR] replay snapshot mismatch between two runs")
            print(f"run_1={current['summary_hash']}")
            print(f"run_2={rerun['summary_hash']}")
            return 1

    print(json.dumps(current, ensure_ascii=False, sort_keys=True, indent=2))
    print(f"[OK] replay determinism check passed: {current['summary_hash']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
