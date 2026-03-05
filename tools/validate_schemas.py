#!/usr/bin/env python3
"""协议 Schema 与 package manifest 基础校验脚本（CI 可执行）。"""

from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_DIR = ROOT / "protocol" / "schemas"
REQUIRED_FILES = [
    "envelope.schema.json",
    "door.interact.request.schema.json",
    "door.interact.response.schema.json",
    "ladder.interact.request.schema.json",
    "ladder.interact.response.schema.json",
    "trigger_zone.interact.request.schema.json",
    "trigger_zone.interact.response.schema.json",
]
REQUIRED_TOP_LEVEL_FIELDS = [
    "id",
    "version",
    "contract_version",
    "engine_compat",
    "license",
    "dependencies",
    "capabilities",
    "params",
    "slots",
    "state_version",
    "state_migration",
]
PACKAGE_CASES = [
    {
        "name": "door",
        "manifest": ROOT / "packages" / "door" / "manifest.json",
        "invalid": ROOT / "packages" / "door" / "tests" / "manifest.invalid.missing_state_version.json",
    },
    {
        "name": "ladder",
        "manifest": ROOT / "packages" / "ladder" / "manifest.json",
        "invalid": ROOT / "packages" / "ladder" / "tests" / "manifest.invalid.missing_state_version.json",
    },
    {
        "name": "trigger_zone",
        "manifest": ROOT / "packages" / "trigger_zone" / "manifest.json",
        "invalid": ROOT / "packages" / "trigger_zone" / "tests" / "manifest.invalid.missing_state_version.json",
    },
]


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def validate_manifest(manifest: dict) -> list[str]:
    errors: list[str] = []

    for field in REQUIRED_TOP_LEVEL_FIELDS:
        if field not in manifest:
            errors.append(f"缺少顶层字段: {field}")

    if manifest.get("contract_version") != "0.1":
        errors.append('contract_version 必须为 "0.1"')

    dependencies = manifest.get("dependencies")
    if not isinstance(dependencies, list):
        errors.append("dependencies 必须为数组")
    else:
        for index, dep in enumerate(dependencies):
            if not isinstance(dep, dict):
                errors.append(f"dependencies[{index}] 必须为对象")
                continue
            for key in ("id", "version", "optional"):
                if key not in dep:
                    errors.append(f"dependencies[{index}] 缺少字段: {key}")

    params = manifest.get("params")
    if not isinstance(params, dict):
        errors.append("params 必须为对象")
    else:
        for param_name, param in params.items():
            if not isinstance(param, dict):
                errors.append(f"params.{param_name} 必须为对象")
                continue
            for key in ("key", "type", "default", "mutability", "visibility", "impact"):
                if key not in param:
                    errors.append(f"params.{param_name} 缺少字段: {key}")
            if "impact" in param and not isinstance(param["impact"], list):
                errors.append(f"params.{param_name}.impact 必须为数组")
            if "range" in param and not isinstance(param["range"], dict):
                errors.append(f"params.{param_name}.range 必须为对象")

    slots = manifest.get("slots")
    if not isinstance(slots, list) or len(slots) == 0:
        errors.append("slots 必须为非空数组")
    else:
        for index, slot in enumerate(slots):
            if not isinstance(slot, dict):
                errors.append(f"slots[{index}] 必须为对象")
                continue
            for key in ("slot_id", "slot_type", "fallback", "optional", "requires"):
                if key not in slot:
                    errors.append(f"slots[{index}] 缺少字段: {key}")

    if not isinstance(manifest.get("state_version"), str):
        errors.append("state_version 必须为字符串")

    state_migration = manifest.get("state_migration")
    if not isinstance(state_migration, dict):
        errors.append("state_migration 必须为对象")
    else:
        for key in ("entry", "from_previous"):
            if key not in state_migration:
                errors.append(f"state_migration 缺少字段: {key}")

    return errors


def main() -> int:
    for file_name in REQUIRED_FILES:
        file_path = SCHEMA_DIR / file_name
        if not file_path.exists():
            print(f"[ERROR] 缺少 schema 文件: {file_path}")
            return 1
        try:
            schema = load_json(file_path)
        except json.JSONDecodeError as exc:
            print(f"[ERROR] 非法 JSON: {file_path} ({exc})")
            return 1

        if schema.get("$schema") != "http://json-schema.org/draft-07/schema#":
            print(f"[ERROR] $schema 版本不符合预期: {file_path}")
            return 1

    envelope = load_json(SCHEMA_DIR / "envelope.schema.json")
    expected_required = ["protocol_version", "type", "request_id", "payload"]
    if envelope.get("required") != expected_required:
        print("[ERROR] envelope.required 字段不符合约定")
        return 1

    error_required = envelope.get("properties", {}).get("error", {}).get("required")
    if error_required != ["code", "message", "details"]:
        print("[ERROR] envelope.error.required 字段不符合约定")
        return 1

    for package_case in PACKAGE_CASES:
        try:
            manifest = load_json(package_case["manifest"])
        except json.JSONDecodeError as exc:
            print(f"[ERROR] 非法 JSON: {package_case['manifest']} ({exc})")
            return 1

        manifest_errors = validate_manifest(manifest)
        if manifest_errors:
            print(f"[ERROR] {package_case['name']} manifest 校验失败: {package_case['manifest']}")
            for item in manifest_errors:
                print(f"  - {item}")
            return 1

        invalid_case = load_json(package_case["invalid"])
        if not any("state_version" in msg for msg in validate_manifest(invalid_case)):
            print(f"[ERROR] {package_case['name']} manifest 负例未触发 state_version 校验")
            return 1

    invalid_dep_case = load_json(
        ROOT / "packages" / "door" / "tests" / "manifest.invalid.dependency_missing_version.json"
    )
    if not any("dependencies[0] 缺少字段: version" in msg for msg in validate_manifest(invalid_dep_case)):
        print("[ERROR] manifest 负例未触发 dependencies.version 校验")
        return 1

    print("[OK] protocol schemas + package manifests 校验通过")
    return 0


if __name__ == "__main__":
    sys.exit(main())
