#!/usr/bin/env python3
"""协议 Schema 与 package manifest 基础校验脚本（CI 可执行）。"""

from __future__ import annotations

import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_DIR = ROOT / "protocol" / "schemas"
REQUIRED_FILES = [
    "envelope.schema.json",
    "brick.publish.schema.json",
    "door.interact.request.schema.json",
    "door.interact.response.schema.json",
    "ladder.interact.request.schema.json",
    "ladder.interact.response.schema.json",
    "trigger_zone.interact.request.schema.json",
    "trigger_zone.interact.response.schema.json",
    "asset.pipeline.schema.json",
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
    {
        "name": "switch",
        "manifest": ROOT / "packages" / "switch" / "manifest.json",
        "invalid": ROOT / "packages" / "switch" / "tests" / "manifest.invalid.missing_state_version.json",
    },
    {
        "name": "container",
        "manifest": ROOT / "packages" / "container" / "manifest.json",
        "invalid": ROOT / "packages" / "container" / "tests" / "manifest.invalid.missing_state_version.json",
    },
    {
        "name": "checkpoint",
        "manifest": ROOT / "packages" / "checkpoint" / "manifest.json",
        "invalid": ROOT / "packages" / "checkpoint" / "tests" / "manifest.invalid.missing_state_version.json",
    },
    {
        "name": "teleport",
        "manifest": ROOT / "packages" / "teleport" / "manifest.json",
        "invalid": ROOT / "packages" / "teleport" / "tests" / "manifest.invalid.missing_state_version.json",
    },
]

REQUIRED_PUBLISH_FIELDS = ["package", "version", "hash", "license", "compat", "source", "registry", "lifecycle", "release", "announcement_ref"]
SHA256_PATTERN = re.compile(r"^sha256:[0-9a-f]{64}$")
SEMVER_PATTERN = re.compile(r"^[0-9]+\.[0-9]+(\.[0-9]+)?$")

LIFECYCLE_STATUS_ALLOWED = {"active", "deprecated", "revoked"}
RELEASE_CHANNEL_ALLOWED = {"canary", "stable", "lts"}


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def validate_manifest(manifest: dict) -> list[str]:
    errors: list[str] = []

    for field in REQUIRED_TOP_LEVEL_FIELDS:
        if field not in manifest:
            errors.append(f"MISSING_TOP_LEVEL_FIELD: {field}")

    if manifest.get("contract_version") != "0.1":
        errors.append('INVALID_CONTRACT_VERSION: expected 0.1')

    dependencies = manifest.get("dependencies")
    if not isinstance(dependencies, list):
        errors.append("INVALID_DEPENDENCIES_TYPE: expected array")
    else:
        for index, dep in enumerate(dependencies):
            if not isinstance(dep, dict):
                errors.append(f"INVALID_DEPENDENCY_ITEM_TYPE[{index}]: expected object")
                continue
            for key in ("id", "version", "optional"):
                if key not in dep:
                    errors.append(f"MISSING_DEPENDENCY_FIELD[{index}]: {key}")

    params = manifest.get("params")
    if not isinstance(params, dict):
        errors.append("INVALID_PARAMS_TYPE: expected object")
    else:
        for param_name, param in params.items():
            if not isinstance(param, dict):
                errors.append(f"INVALID_PARAM_ITEM_TYPE[{param_name}]: expected object")
                continue
            for key in ("key", "type", "default", "mutability", "visibility", "impact"):
                if key not in param:
                    errors.append(f"MISSING_PARAM_FIELD[{param_name}]: {key}")
            if "impact" in param and not isinstance(param["impact"], list):
                errors.append(f"INVALID_PARAM_IMPACT_TYPE[{param_name}]: expected array")
            if "range" in param and not isinstance(param["range"], dict):
                errors.append(f"INVALID_PARAM_RANGE_TYPE[{param_name}]: expected object")

    slots = manifest.get("slots")
    if not isinstance(slots, list) or len(slots) == 0:
        errors.append("INVALID_SLOTS_TYPE: expected non-empty array")
    else:
        for index, slot in enumerate(slots):
            if not isinstance(slot, dict):
                errors.append(f"INVALID_SLOT_ITEM_TYPE[{index}]: expected object")
                continue
            for key in ("slot_id", "slot_type", "fallback", "optional", "requires"):
                if key not in slot:
                    errors.append(f"MISSING_SLOT_FIELD[{index}]: {key}")

    if not isinstance(manifest.get("state_version"), str):
        errors.append("INVALID_STATE_VERSION_TYPE: expected string")

    state_migration = manifest.get("state_migration")
    if not isinstance(state_migration, dict):
        errors.append("INVALID_STATE_MIGRATION_TYPE: expected object")
    else:
        for key in ("entry", "from_previous"):
            if key not in state_migration:
                errors.append(f"MISSING_STATE_MIGRATION_FIELD: {key}")

    return errors




def validate_pipeline_summary(pipeline: object) -> list[str]:
    errors: list[str] = []

    if pipeline is None:
        return errors

    if not isinstance(pipeline, dict):
        return ["INVALID_PUBLISH_PIPELINE_TYPE: expected object"]

    for key in ("plan_id", "config_hash", "source_hashes", "tool_version"):
        if key not in pipeline:
            errors.append(f"MISSING_PUBLISH_PIPELINE_FIELD: {key}")

    for key in ("plan_id", "config_hash"):
        value = pipeline.get(key)
        if not isinstance(value, str) or not SHA256_PATTERN.match(value):
            errors.append(f"INVALID_PUBLISH_PIPELINE_HASH_FORMAT: {key} expected sha256:<hex>")

    source_hashes = pipeline.get("source_hashes")
    if not isinstance(source_hashes, list) or len(source_hashes) == 0:
        errors.append("INVALID_PUBLISH_PIPELINE_SOURCE_HASHES_TYPE: expected non-empty array")
    else:
        for index, item in enumerate(source_hashes):
            if not isinstance(item, dict):
                errors.append(f"INVALID_PUBLISH_PIPELINE_SOURCE_HASH_ITEM_TYPE[{index}]: expected object")
                continue
            if not isinstance(item.get("path"), str) or not item["path"]:
                errors.append(f"INVALID_PUBLISH_PIPELINE_SOURCE_HASH_PATH[{index}]: expected non-empty string")
            source_hash = item.get("sha256")
            if not isinstance(source_hash, str) or not SHA256_PATTERN.match(f"sha256:{source_hash}"):
                errors.append(f"INVALID_PUBLISH_PIPELINE_SOURCE_HASH_VALUE[{index}]: expected 64-lower-hex")

    tool_version = pipeline.get("tool_version")
    if not isinstance(tool_version, str) or not SEMVER_PATTERN.match(tool_version):
        errors.append("INVALID_PUBLISH_PIPELINE_TOOL_VERSION: expected x.y or x.y.z")

    return errors

def validate_publish_metadata(publish: dict, manifest: dict) -> list[str]:
    errors: list[str] = []

    for field in REQUIRED_PUBLISH_FIELDS:
        if field not in publish:
            errors.append(f"MISSING_PUBLISH_FIELD: {field}")

    if publish.get("package") != manifest.get("id"):
        errors.append("PUBLISH_PACKAGE_MISMATCH_MANIFEST_ID")

    if publish.get("version") != manifest.get("version"):
        errors.append("PUBLISH_VERSION_MISMATCH_MANIFEST_VERSION")

    if publish.get("license") != manifest.get("license"):
        errors.append("PUBLISH_LICENSE_MISMATCH_MANIFEST_LICENSE")

    hash_value = publish.get("hash")
    if not isinstance(hash_value, str) or not SHA256_PATTERN.match(hash_value):
        errors.append("INVALID_PUBLISH_HASH_FORMAT: expected sha256:<hex>")

    compat = publish.get("compat")
    if not isinstance(compat, dict) or not isinstance(compat.get("engine"), str):
        errors.append("INVALID_PUBLISH_COMPAT_ENGINE_TYPE: expected string")
    elif not isinstance(compat.get("matrix_ref"), str) or not compat.get("matrix_ref"):
        errors.append("INVALID_PUBLISH_COMPAT_MATRIX_REF: expected non-empty string")

    source = publish.get("source")
    if not isinstance(source, dict):
        errors.append("INVALID_PUBLISH_SOURCE_TYPE: expected object")
    else:
        source_type = source.get("type")
        source_uri = source.get("uri")
        if source_type not in ("file", "dir"):
            errors.append("INVALID_PUBLISH_SOURCE_TYPE_VALUE: expected file|dir")
        if not isinstance(source_uri, str) or not source_uri.startswith("file://"):
            errors.append("INVALID_PUBLISH_SOURCE_URI: expected file:// prefix")

    registry = publish.get("registry")
    if not isinstance(registry, dict):
        errors.append("INVALID_PUBLISH_REGISTRY_TYPE: expected object")
    else:
        for key in ("provider", "namespace", "channel"):
            if not isinstance(registry.get(key), str):
                errors.append(f"INVALID_PUBLISH_REGISTRY_FIELD_TYPE: {key} expected string")

    lifecycle = publish.get("lifecycle")
    if not isinstance(lifecycle, dict) or lifecycle.get("status") not in LIFECYCLE_STATUS_ALLOWED:
        errors.append("INVALID_PUBLISH_LIFECYCLE_STATUS: expected active|deprecated|revoked")

    release = publish.get("release")
    if not isinstance(release, dict) or release.get("channel") not in RELEASE_CHANNEL_ALLOWED:
        errors.append("INVALID_PUBLISH_RELEASE_CHANNEL: expected canary|stable|lts")

    announcement_ref = publish.get("announcement_ref")
    if not isinstance(announcement_ref, str) or not announcement_ref:
        errors.append("INVALID_PUBLISH_ANNOUNCEMENT_REF: expected non-empty string")

    pipeline_errors = validate_pipeline_summary(publish.get("pipeline"))
    errors.extend(pipeline_errors)

    return errors


def main() -> int:
    for file_name in REQUIRED_FILES:
        file_path = SCHEMA_DIR / file_name
        if not file_path.exists():
            print(f"[ERROR][SCHEMA_FILE_MISSING] path={file_path}")
            return 1
        try:
            schema = load_json(file_path)
        except json.JSONDecodeError as exc:
            print(f"[ERROR][INVALID_JSON] path={file_path} detail={exc}")
            return 1

        if schema.get("$schema") != "http://json-schema.org/draft-07/schema#":
            print(f"[ERROR][INVALID_SCHEMA_VERSION] path={file_path}")
            return 1

    envelope = load_json(SCHEMA_DIR / "envelope.schema.json")
    expected_required = ["protocol_version", "type", "request_id", "payload"]
    if envelope.get("required") != expected_required:
        print("[ERROR][INVALID_ENVELOPE_REQUIRED_FIELDS]")
        return 1

    error_required = envelope.get("properties", {}).get("error", {}).get("required")
    if error_required != ["code", "message", "details"]:
        print("[ERROR][INVALID_ENVELOPE_ERROR_REQUIRED_FIELDS]")
        return 1

    for package_case in PACKAGE_CASES:
        try:
            manifest = load_json(package_case["manifest"])
        except json.JSONDecodeError as exc:
            print(f"[ERROR][INVALID_JSON] path={package_case['manifest']} detail={exc}")
            return 1

        manifest_errors = validate_manifest(manifest)
        if manifest_errors:
            print(f"[ERROR][MANIFEST_VALIDATION_FAILED] package={package_case['name']} path={package_case['manifest']}")
            for item in manifest_errors:
                print(f"  - {item}")
            return 1

        publish_path = package_case["manifest"].with_name("publish.json")
        try:
            publish_metadata = load_json(publish_path)
        except json.JSONDecodeError as exc:
            print(f"[ERROR][INVALID_JSON] path={publish_path} detail={exc}")
            return 1
        except FileNotFoundError:
            print(f"[ERROR][PUBLISH_METADATA_MISSING] path={publish_path}")
            return 1

        publish_errors = validate_publish_metadata(publish_metadata, manifest)
        if publish_errors:
            print(f"[ERROR][PUBLISH_METADATA_VALIDATION_FAILED] package={package_case['name']} path={publish_path}")
            for item in publish_errors:
                print(f"  - {item}")
            return 1

        invalid_case = load_json(package_case["invalid"])
        if not any("state_version" in msg for msg in validate_manifest(invalid_case)):
            print(f"[ERROR][INVALID_CASE_NOT_TRIGGERED] package={package_case['name']} field=state_version")
            return 1

    invalid_dep_case = load_json(
        ROOT / "packages" / "door" / "tests" / "manifest.invalid.dependency_missing_version.json"
    )
    if not any("MISSING_DEPENDENCY_FIELD[0]: version" in msg for msg in validate_manifest(invalid_dep_case)):
        print("[ERROR][INVALID_CASE_NOT_TRIGGERED] package=door field=dependencies.version")
        return 1

    print("[OK] protocol schemas + package manifests validation passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
