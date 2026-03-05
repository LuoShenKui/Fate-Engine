#!/usr/bin/env python3
"""Schema 兼容性检查：对比基线与当前 schema，并校验迁移文档完整性。"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any


SECTION_VERSION = re.compile(r"^#{1,6}\s*(版本|version)\b", re.IGNORECASE)
SECTION_IMPACT = re.compile(r"^#{1,6}\s*(影响面|impact)\b", re.IGNORECASE)
SECTION_ROLLBACK = re.compile(r"^#{1,6}\s*(回滚策略|rollback)\b", re.IGNORECASE)


@dataclass
class Finding:
    level: str
    code: str
    schema: str
    path: str
    message: str

    def as_dict(self) -> dict[str, str]:
        return {
            "level": self.level,
            "code": self.code,
            "schema": self.schema,
            "path": self.path,
            "message": self.message,
        }


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def normalize_type(value: Any) -> tuple[str, ...] | None:
    if isinstance(value, str):
        return (value,)
    if isinstance(value, list) and all(isinstance(item, str) for item in value):
        return tuple(sorted(value))
    return None


def compare_schema(
    baseline: dict[str, Any],
    current: dict[str, Any],
    schema_name: str,
    pointer: str,
    findings: list[Finding],
) -> None:
    baseline_props = baseline.get("properties") if isinstance(baseline, dict) else None
    current_props = current.get("properties") if isinstance(current, dict) else None

    if isinstance(baseline_props, dict) and isinstance(current_props, dict):
        for field in sorted(baseline_props.keys()):
            next_pointer = f"{pointer}/properties/{field}"
            if field not in current_props:
                findings.append(
                    Finding("error", "FIELD_REMOVED", schema_name, next_pointer, f"字段 `{field}` 被删除")
                )
                continue

            baseline_field = baseline_props[field]
            current_field = current_props[field]

            baseline_type = normalize_type(baseline_field.get("type") if isinstance(baseline_field, dict) else None)
            current_type = normalize_type(current_field.get("type") if isinstance(current_field, dict) else None)
            if baseline_type and current_type and baseline_type != current_type:
                findings.append(
                    Finding(
                        "error",
                        "TYPE_CHANGED",
                        schema_name,
                        next_pointer,
                        f"字段 `{field}` 类型变化: {baseline_type} -> {current_type}",
                    )
                )

            baseline_enum = baseline_field.get("enum") if isinstance(baseline_field, dict) else None
            current_enum = current_field.get("enum") if isinstance(current_field, dict) else None
            if isinstance(baseline_enum, list) and isinstance(current_enum, list):
                base_set = set(baseline_enum)
                curr_set = set(current_enum)
                if curr_set < base_set:
                    findings.append(
                        Finding(
                            "error",
                            "ENUM_TIGHTENED",
                            schema_name,
                            next_pointer,
                            f"字段 `{field}` enum 收紧: 移除 {sorted(base_set - curr_set)}",
                        )
                    )
                elif not base_set.issubset(curr_set):
                    findings.append(
                        Finding(
                            "warn",
                            "ENUM_CHANGED",
                            schema_name,
                            next_pointer,
                            "字段 enum 出现非兼容变化",
                        )
                    )

            if isinstance(baseline_field, dict) and isinstance(current_field, dict):
                compare_schema(baseline_field, current_field, schema_name, next_pointer, findings)

        baseline_required = baseline.get("required") if isinstance(baseline.get("required"), list) else []
        current_required = current.get("required") if isinstance(current.get("required"), list) else []
        baseline_required_set = {item for item in baseline_required if isinstance(item, str)}
        current_required_set = {item for item in current_required if isinstance(item, str)}
        for field in sorted((current_required_set - baseline_required_set) & set(baseline_props.keys())):
            findings.append(
                Finding(
                    "error",
                    "OPTIONAL_TO_REQUIRED",
                    schema_name,
                    f"{pointer}/required/{field}",
                    f"字段 `{field}` 从 optional 变更为 required",
                )
            )

    baseline_ap = baseline.get("additionalProperties") if isinstance(baseline, dict) else None
    current_ap = current.get("additionalProperties") if isinstance(current, dict) else None
    baseline_relaxed = baseline_ap is None or baseline_ap is True
    current_strict = current_ap is False or isinstance(current_ap, dict)
    if baseline_relaxed and current_strict:
        findings.append(
            Finding(
                "error",
                "ADDITIONAL_PROPERTIES_RESTRICTED",
                schema_name,
                f"{pointer}/additionalProperties",
                "additionalProperties 从宽松改为严格",
            )
        )


def schema_doc_name(schema_file_name: str) -> str:
    if schema_file_name.endswith(".schema.json"):
        return schema_file_name[: -len(".schema.json")]
    if schema_file_name.endswith(".json"):
        return schema_file_name[: -len(".json")]
    return schema_file_name


def detect_version(schema: dict[str, Any]) -> str | None:
    candidates = [schema.get("version"), schema.get("x-version")]
    for candidate in candidates:
        if isinstance(candidate, str) and candidate.strip():
            return candidate.strip()
    return None


def check_migration_doc(
    docs_root: Path,
    schema_name: str,
    schema_obj: dict[str, Any],
    findings: list[Finding],
) -> None:
    version = detect_version(schema_obj)
    if not version:
        findings.append(
            Finding(
                "error",
                "MIGRATION_VERSION_MISSING",
                schema_name,
                "/version",
                "schema 发生变更但缺少 version/x-version，无法定位迁移文档",
            )
        )
        return

    doc_path = docs_root / schema_doc_name(schema_name) / f"{version}.md"
    if not doc_path.exists():
        findings.append(
            Finding(
                "error",
                "MIGRATION_DOC_MISSING",
                schema_name,
                str(doc_path),
                "缺少迁移文档",
            )
        )
        return

    lines = doc_path.read_text(encoding="utf-8").splitlines()
    has_version = any(SECTION_VERSION.search(line.strip()) for line in lines)
    has_impact = any(SECTION_IMPACT.search(line.strip()) for line in lines)
    has_rollback = any(SECTION_ROLLBACK.search(line.strip()) for line in lines)

    if not has_version:
        findings.append(Finding("error", "MIGRATION_DOC_SECTION_MISSING", schema_name, str(doc_path), "缺少【版本】段落"))
    if not has_impact:
        findings.append(Finding("error", "MIGRATION_DOC_SECTION_MISSING", schema_name, str(doc_path), "缺少【影响面】段落"))
    if not has_rollback:
        findings.append(Finding("error", "MIGRATION_DOC_SECTION_MISSING", schema_name, str(doc_path), "缺少【回滚策略】段落"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline-dir", type=Path, required=True)
    parser.add_argument("--current-dir", type=Path, required=True)
    parser.add_argument("--docs-root", type=Path, default=Path("docs/protocol-migrations"))
    parser.add_argument("--report-json", type=Path, default=Path("artifacts/schema_compat_report.json"))
    args = parser.parse_args()

    baseline_files = {path.name: path for path in sorted(args.baseline_dir.glob("*.json"))}
    current_files = {path.name: path for path in sorted(args.current_dir.glob("*.json"))}

    findings: list[Finding] = []
    changed_schemas: set[str] = set()

    for removed in sorted(set(baseline_files) - set(current_files)):
        findings.append(Finding("error", "SCHEMA_REMOVED", removed, "/", "schema 文件被删除"))

    for added in sorted(set(current_files) - set(baseline_files)):
        findings.append(Finding("warn", "SCHEMA_ADDED", added, "/", "新增 schema，请确认兼容策略"))
        changed_schemas.add(added)

    for name in sorted(set(baseline_files) & set(current_files)):
        baseline_payload = load_json(baseline_files[name])
        current_payload = load_json(current_files[name])
        if baseline_payload != current_payload:
            changed_schemas.add(name)
        if isinstance(baseline_payload, dict) and isinstance(current_payload, dict):
            compare_schema(baseline_payload, current_payload, name, "#", findings)

    for name in sorted(changed_schemas):
        current_file = current_files.get(name)
        if not current_file:
            continue
        current_payload = load_json(current_file)
        if isinstance(current_payload, dict):
            check_migration_doc(args.docs_root, name, current_payload, findings)

    report = {
        "baseline_dir": str(args.baseline_dir),
        "current_dir": str(args.current_dir),
        "docs_root": str(args.docs_root),
        "summary": {
            "total": len(findings),
            "error": sum(1 for item in findings if item.level == "error"),
            "warn": sum(1 for item in findings if item.level == "warn"),
            "changed_schemas": sorted(changed_schemas),
        },
        "findings": [item.as_dict() for item in findings],
    }

    args.report_json.parent.mkdir(parents=True, exist_ok=True)
    args.report_json.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(
        "[schema-compat] "
        f"changed={len(changed_schemas)} total={report['summary']['total']} "
        f"error={report['summary']['error']} warn={report['summary']['warn']}"
    )
    for item in findings[:20]:
        print(f"[{item.level.upper()}][{item.code}] schema={item.schema} path={item.path} detail={item.message}")
    if len(findings) > 20:
        print(f"[schema-compat] ... 省略其余 {len(findings) - 20} 条，详见 {args.report_json}")

    return 1 if report["summary"]["error"] > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
