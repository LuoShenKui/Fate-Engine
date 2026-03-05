#!/usr/bin/env python3
"""基于 lockfile + manifest 生成 machine-readable 兼容矩阵。"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_LOCKFILE = ROOT / "packages" / "brick.lock.json"
DEFAULT_OUT = ROOT / "docs" / "releases" / "compat_matrix.json"


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lockfile", type=Path, default=DEFAULT_LOCKFILE)
    parser.add_argument("--packages-dir", type=Path, default=ROOT / "packages")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()

    lockfile = load_json(args.lockfile)
    matrix_entries: list[dict] = []
    for package in lockfile.get("packages", []):
        package_id = package["package"]
        package_version = package["version"]
        package_dir_name = package_id.split(".")[1] if "." in package_id else package_id
        manifest_path = args.packages_dir / package_dir_name / "manifest.json"
        manifest = load_json(manifest_path)

        matrix_entries.append(
            {
                "package": package_id,
                "package_version": package_version,
                "engine": manifest.get("engine_compat"),
                "contract": manifest.get("contract_version"),
                "manifest": str(manifest_path.relative_to(ROOT)),
            }
        )

    payload = {
        "version": 1,
        "generated_by": "tools/build_compat_matrix.py",
        "entries": sorted(matrix_entries, key=lambda x: x["package"]),
    }

    out_path = args.out if args.out.is_absolute() else ROOT / args.out
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(str(out_path.relative_to(ROOT)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
