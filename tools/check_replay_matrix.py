#!/usr/bin/env python3
"""回放矩阵检查：多版本存档迁移 + 固定 recipe/seed/lockfile 一致性。"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from check_replay_determinism import ROOT, build_summary, canonical_dump, load_json, payload_hash

DEFAULT_MATRIX = ROOT / "fixtures" / "replay" / "matrix_cases.json"
MANIFEST_GLOB = "packages/*/manifest.json"


class MatrixError(RuntimeError):
    """矩阵校验错误。"""


def load_manifests() -> dict[str, dict[str, Any]]:
    manifests: dict[str, dict[str, Any]] = {}
    for manifest_path in ROOT.glob(MANIFEST_GLOB):
        manifest = load_json(manifest_path)
        package_id = manifest.get("id")
        if not isinstance(package_id, str):
            raise MatrixError(f"manifest id missing: {manifest_path}")
        manifests[package_id] = {
            "path": manifest_path,
            "manifest": manifest,
        }
    return manifests


def parse_declared_migration(manifest: dict[str, Any], manifest_path: Path) -> tuple[str, str]:
    migration = manifest.get("state_migration", {})
    from_previous = migration.get("from_previous")
    state_version = manifest.get("state_version")
    if not isinstance(from_previous, str) or "->" not in from_previous:
        raise MatrixError(f"invalid state_migration.from_previous: {manifest_path}")
    if not isinstance(state_version, str):
        raise MatrixError(f"state_version missing: {manifest_path}")

    matched = re.search(r"([^\s]+)\s*->\s*([^:\s]+)", from_previous)
    if matched is None:
        raise MatrixError(f"cannot parse migration declaration: {manifest_path}")

    source_expr = matched.group(1)
    target_expr = matched.group(2)
    if target_expr != state_version:
        raise MatrixError(
            f"migration declaration target mismatch in {manifest_path}: "
            f"declared {target_expr}, state_version {state_version}"
        )
    return source_expr, target_expr


def is_prev_compatible(save_version: str, source_expr: str) -> bool:
    if source_expr.endswith(".x"):
        prefix = source_expr[:-1]
        return save_version.startswith(prefix)
    return save_version == source_expr


def migrate_case_state(
    save_payload: dict[str, Any],
    manifests: dict[str, dict[str, Any]],
) -> tuple[dict[str, Any], list[dict[str, Any]], list[str]]:
    migrated = json.loads(canonical_dump(save_payload))
    runtime_state = migrated.get("runtime_state")
    save_version = str(migrated.get("state_version", ""))
    if not isinstance(runtime_state, dict):
        raise MatrixError("save file missing runtime_state object")

    migration_paths: list[str] = []
    failures: list[dict[str, Any]] = []

    for package_id, package_data in runtime_state.items():
        if package_id not in manifests:
            failures.append(
                {
                    "package": package_id,
                    "reason": "manifest_missing",
                    "fields": ["runtime_state." + package_id],
                }
            )
            continue

        manifest = manifests[package_id]["manifest"]
        manifest_path = manifests[package_id]["path"]
        source_expr, target_version = parse_declared_migration(manifest, manifest_path)
        params = manifest.get("params", {})

        if save_version == target_version:
            migration_paths.append(f"{package_id}:noop({target_version})")
            continue

        if is_prev_compatible(save_version, source_expr):
            if not isinstance(package_data, dict):
                failures.append(
                    {
                        "package": package_id,
                        "reason": "runtime_state_not_object",
                        "fields": ["runtime_state." + package_id],
                    }
                )
                continue
            for field_name, field_meta in params.items():
                if field_name not in package_data and isinstance(field_meta, dict) and "default" in field_meta:
                    package_data[field_name] = field_meta["default"]
            migration_paths.append(f"{package_id}:{source_expr}->{target_version}")
            migrated["state_version"] = target_version
            continue

        failures.append(
            {
                "package": package_id,
                "reason": "unsupported_state_version",
                "fields": ["state_version"],
                "from": save_version,
                "to": target_version,
            }
        )
        migration_paths.append(f"{package_id}:unsupported({save_version}->{target_version})")

    return migrated, failures, sorted(migration_paths)


def run_case(
    case: dict[str, Any],
    manifests: dict[str, dict[str, Any]],
    replay_summary_hash: str,
) -> dict[str, Any]:
    case_id = str(case["id"])
    save_path = (ROOT / case["save"]).resolve()
    expected_path = (ROOT / case["expected_snapshot"]).resolve()
    expected_failures = case.get("expected_failures", 0)

    save_payload = load_json(save_path)
    migrated, failures, migration_paths = migrate_case_state(save_payload, manifests)
    expected = load_json(expected_path)

    mismatched_fields: list[str] = []
    if canonical_dump(migrated) != canonical_dump(expected):
        mismatched_fields.append("snapshot")
    if len(failures) != int(expected_failures):
        mismatched_fields.append("failure_count")

    report = {
        "id": case_id,
        "summary_hash": replay_summary_hash,
        "migration_paths": migration_paths,
        "status": "ok" if not mismatched_fields else "failed",
        "failed_diff_fields": mismatched_fields,
        "failures": failures,
        "actual_snapshot_hash": payload_hash(migrated),
        "expected_snapshot_hash": payload_hash(expected),
        "save": str(save_path.relative_to(ROOT)),
        "expected_snapshot": str(expected_path.relative_to(ROOT)),
    }
    return report


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--matrix", type=Path, default=DEFAULT_MATRIX)
    parser.add_argument("--report-out", type=Path, help="写出 machine-readable JSON 报告")
    args = parser.parse_args()

    matrix = load_json(args.matrix.resolve())
    replay = matrix["replay"]
    summary = build_summary(
        seed=int(replay["seed"]),
        recipe_path=(ROOT / replay["recipe"]).resolve(),
        lockfile_path=(ROOT / replay["lockfile"]).resolve(),
    )

    manifests = load_manifests()
    case_reports = [run_case(case, manifests, summary["summary_hash"]) for case in matrix.get("cases", [])]
    report = {
        "summary_hash": summary["summary_hash"],
        "seed": replay["seed"],
        "recipe": replay["recipe"],
        "lockfile": replay["lockfile"],
        "cases": case_reports,
        "failed_cases": [case["id"] for case in case_reports if case["status"] != "ok"],
    }

    rendered = json.dumps(report, ensure_ascii=False, indent=2)
    if args.report_out is not None:
        args.report_out.write_text(rendered + "\n", encoding="utf-8")
    print(rendered)

    return 1 if report["failed_cases"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
