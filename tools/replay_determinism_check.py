#!/usr/bin/env python3
"""检查同 seed/recipe/lockfile 的回放摘要是否稳定。"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_RECIPE = ROOT / "fixtures" / "replay" / "fixed_recipe.json"
DEFAULT_LOCKFILE = ROOT / "packages" / "brick.lock.json"
DEFAULT_SEED = 123


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def canonical_json_hash(payload: dict) -> str:
    encoded = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def build_summary(seed: int, recipe_path: Path, lockfile_path: Path) -> dict:
    recipe = load_json(recipe_path)
    lockfile = load_json(lockfile_path)
    package_ids = sorted(f"{item['package']}@{item['version']}" for item in lockfile.get("packages", []))

    return {
        "seed": seed,
        "recipe_path": str(recipe_path.relative_to(ROOT)),
        "lockfile_path": str(lockfile_path.relative_to(ROOT)),
        "recipe_sha256": sha256_file(recipe_path),
        "lockfile_sha256": sha256_file(lockfile_path),
        "recipe_id": recipe.get("id"),
        "recipe_steps": len(recipe.get("steps", [])),
        "package_ids": package_ids,
    }


def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--recipe", type=Path, default=DEFAULT_RECIPE)
    parser.add_argument("--lockfile", type=Path, default=DEFAULT_LOCKFILE)
    parser.add_argument("--output-dir", type=Path, default=ROOT / "dist" / "replay-determinism")
    args = parser.parse_args()

    recipe_path = args.recipe.resolve()
    lockfile_path = args.lockfile.resolve()
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    summary_1 = build_summary(args.seed, recipe_path, lockfile_path)
    summary_2 = build_summary(args.seed, recipe_path, lockfile_path)

    hash_1 = canonical_json_hash(summary_1)
    hash_2 = canonical_json_hash(summary_2)

    write_json(output_dir / "summary_run_1.json", summary_1)
    write_json(output_dir / "summary_run_2.json", summary_2)
    (output_dir / "summary_hashes.txt").write_text(
        f"run_1={hash_1}\nrun_2={hash_2}\n",
        encoding="utf-8",
    )

    print(f"seed={args.seed}")
    print(f"recipe={summary_1['recipe_path']}")
    print(f"lockfile={summary_1['lockfile_path']}")
    print(f"lockfile_sha256={summary_1['lockfile_sha256']}")

    if hash_1 != hash_2:
        print("[ERROR] replay summary hash mismatch")
        return 1

    print(f"[OK] replay summary hash stable: {hash_1}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
