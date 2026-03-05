#!/usr/bin/env python3
"""依赖合规检查：统一扫描 Cargo.lock 与 pnpm-lock.yaml。"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass
class PackageRecord:
    ecosystem: str
    package: str
    version: str
    license: str
    source: str


class ComplianceChecker:
    def __init__(self, policy: dict[str, Any]) -> None:
        self.policy = policy
        self.violations: list[dict[str, str]] = []

    def add_violation(self, record: PackageRecord, code: str) -> None:
        self.violations.append(
            {
                "ecosystem": record.ecosystem,
                "package": record.package,
                "version": record.version,
                "license": record.license,
                "source": record.source,
                "violation_code": code,
            }
        )

    def is_license_allowed(self, license_expr: str) -> bool:
        denylist = set(self.policy.get("license", {}).get("denylist", []))
        allowlist = set(self.policy.get("license", {}).get("allowlist", []))
        tokens = [item.strip("() ") for item in re.split(r"\s+(?:OR|AND)\s+", license_expr) if item.strip()]
        if not tokens:
            return False
        if any(token in denylist for token in tokens):
            return False
        return all(token in allowlist for token in tokens)

    def is_source_allowed(self, ecosystem: str, source: str) -> bool:
        allowed_sources: list[str] = self.policy.get("source", {}).get(ecosystem, [])
        return any(source.startswith(prefix) for prefix in allowed_sources)


def parse_semver(value: str) -> tuple[int, int, int] | None:
    match = re.search(r"(\d+)\.(\d+)\.(\d+)", value)
    if not match:
        return None
    return (int(match.group(1)), int(match.group(2)), int(match.group(3)))


def parse_cargo_requirements(cargo_toml: Path) -> dict[str, str]:
    requirements: dict[str, str] = {}
    in_deps = False
    for line in cargo_toml.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if stripped.startswith("[") and stripped.endswith("]"):
            in_deps = stripped == "[dependencies]"
            continue
        if not in_deps or not stripped or stripped.startswith("#") or "=" not in stripped:
            continue

        dep_name, raw_value = stripped.split("=", 1)
        dep_name = dep_name.strip()
        raw_value = raw_value.strip()
        if raw_value.startswith("{"):
            match = re.search(r'version\s*=\s*"([^"]+)"', raw_value)
            if match:
                requirements[dep_name] = match.group(1)
        elif raw_value.startswith('"') and raw_value.endswith('"'):
            requirements[dep_name] = raw_value.strip('"')

    return requirements


def parse_cargo_lock(cargo_lock: Path, license_map: dict[str, str]) -> list[PackageRecord]:
    records: list[PackageRecord] = []
    current: dict[str, str] = {}

    def flush_current() -> None:
        if not current:
            return
        name = current.get("name", "")
        version = current.get("version", "")
        if not name or not version:
            return
        source = current.get("source", "path")
        records.append(
            PackageRecord(
                ecosystem="cargo",
                package=name,
                version=version,
                license=license_map.get(name, "UNKNOWN"),
                source=source,
            )
        )

    for raw_line in cargo_lock.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if line == "[[package]]":
            flush_current()
            current = {}
            continue
        name_match = re.match(r'^name\s*=\s*"([^"]+)"$', line)
        if name_match:
            current["name"] = name_match.group(1)
            continue
        version_match = re.match(r'^version\s*=\s*"([^"]+)"$', line)
        if version_match:
            current["version"] = version_match.group(1)
            continue
        source_match = re.match(r'^source\s*=\s*"([^"]+)"$', line)
        if source_match:
            current["source"] = source_match.group(1)
            continue
    flush_current()
    return records


def parse_pnpm_lock(pnpm_lock: Path, license_map: dict[str, str]) -> list[PackageRecord]:
    lines = pnpm_lock.read_text(encoding="utf-8").splitlines()
    in_packages = False
    records: list[PackageRecord] = []
    pkg_pattern = re.compile(r"^\s{2}(.+):\s*$")

    for line in lines:
        if line.strip() == "packages:":
            in_packages = True
            continue
        if in_packages and line and not line.startswith(" "):
            break
        if not in_packages:
            continue

        match = pkg_pattern.match(line)
        if not match:
            continue
        raw_key = match.group(1).strip().strip("'").strip('"')
        if "@" not in raw_key:
            continue
        package_name, package_version = raw_key.rsplit("@", 1)
        if not re.match(r"^\d+\.\d+\.\d+", package_version):
            continue
        records.append(
            PackageRecord(
                ecosystem="pnpm",
                package=package_name,
                version=package_version,
                license=license_map.get(package_name, "UNKNOWN"),
                source="registry:npmjs",
            )
        )
    return records


def parse_pnpm_direct_dependencies(package_json: Path, pnpm_lock: Path) -> dict[str, tuple[str, str]]:
    package_payload = json.loads(package_json.read_text(encoding="utf-8"))
    declared: dict[str, str] = {}
    for section in ("dependencies", "devDependencies"):
        for name, spec in package_payload.get(section, {}).items():
            if isinstance(spec, str):
                declared[name] = spec

    lines = pnpm_lock.read_text(encoding="utf-8").splitlines()
    in_importer = False
    in_dot = False
    in_dep_section = False
    current_dep = ""
    resolved: dict[str, str] = {}

    for line in lines:
        if line.strip() == "importers:":
            in_importer = True
            continue
        if in_importer and line.startswith("packages:"):
            break
        if not in_importer:
            continue

        if re.match(r"^\s{2}\.:\s*$", line):
            in_dot = True
            in_dep_section = False
            continue
        if in_dot and re.match(r"^\s{2}\S", line):
            in_dot = False
            in_dep_section = False

        if not in_dot:
            continue

        if re.match(r"^\s{4}(dependencies|devDependencies):\s*$", line):
            in_dep_section = True
            continue
        if in_dep_section and re.match(r"^\s{4}\S", line):
            in_dep_section = False

        if in_dep_section:
            dep_match = re.match(r"^\s{6}(.+):\s*$", line)
            ver_match = re.match(r"^\s{8}version:\s+(.+)\s*$", line)
            if dep_match:
                current_dep = dep_match.group(1).strip().strip("'").strip('"')
                continue
            if ver_match and current_dep:
                resolved_version = ver_match.group(1).strip().strip("'").strip('"')
                resolved[current_dep] = resolved_version.split("(")[0]

    merged: dict[str, tuple[str, str]] = {}
    for dep_name, spec in declared.items():
        if dep_name in resolved:
            merged[dep_name] = (spec, resolved[dep_name])
    return merged


def load_policy(policy_path: Path) -> dict[str, Any]:
    return json.loads(policy_path.read_text(encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cargo-lock", type=Path, default=Path("runtime/door_core/Cargo.lock"))
    parser.add_argument("--cargo-toml", type=Path, default=Path("runtime/door_core/Cargo.toml"))
    parser.add_argument("--pnpm-lock", type=Path, default=Path("editor/app/pnpm-lock.yaml"))
    parser.add_argument("--package-json", type=Path, default=Path("editor/app/package.json"))
    parser.add_argument("--policy", type=Path, default=Path("protocol/compliance/dependency_policy.json"))
    parser.add_argument("--report-json", type=Path, default=Path("artifacts/dependency_compliance_report.json"))
    args = parser.parse_args()

    policy = load_policy(args.policy)
    checker = ComplianceChecker(policy)
    license_map = policy.get("license", {}).get("metadata", {})

    cargo_packages = parse_cargo_lock(args.cargo_lock, license_map.get("cargo", {}))
    pnpm_packages = parse_pnpm_lock(args.pnpm_lock, license_map.get("pnpm", {}))

    for record in cargo_packages + pnpm_packages:
        if record.license == "UNKNOWN":
            checker.add_violation(record, "LICENSE_UNKNOWN")
        elif not checker.is_license_allowed(record.license):
            checker.add_violation(record, "LICENSE_NOT_ALLOWED")

        if not checker.is_source_allowed(record.ecosystem, record.source):
            checker.add_violation(record, "SOURCE_NOT_ALLOWED")

    upgrade_policy = policy.get("upgrade", {})
    if upgrade_policy.get("mode") == "patch_only":
        exemptions = set(upgrade_policy.get("exemptions", []))

        cargo_requirements = parse_cargo_requirements(args.cargo_toml)
        cargo_lookup = {item.package: item for item in cargo_packages}
        for dep_name, requirement in cargo_requirements.items():
            if dep_name in exemptions or dep_name not in cargo_lookup:
                continue
            req_semver = parse_semver(requirement)
            lock_semver = parse_semver(cargo_lookup[dep_name].version)
            if req_semver and lock_semver and req_semver[:2] != lock_semver[:2]:
                checker.add_violation(cargo_lookup[dep_name], "UPGRADE_POLICY_PATCH_ONLY")

        direct_pnpm = parse_pnpm_direct_dependencies(args.package_json, args.pnpm_lock)
        pnpm_lookup = {item.package: item for item in pnpm_packages}
        for dep_name, (specifier, resolved_version) in direct_pnpm.items():
            if dep_name in exemptions or dep_name not in pnpm_lookup:
                continue
            spec_semver = parse_semver(specifier)
            resolved_semver = parse_semver(resolved_version)
            if spec_semver and resolved_semver and spec_semver[:2] != resolved_semver[:2]:
                checker.add_violation(pnpm_lookup[dep_name], "UPGRADE_POLICY_PATCH_ONLY")

    report = {
        "summary": {
            "cargo_packages": len(cargo_packages),
            "pnpm_packages": len(pnpm_packages),
            "violation_count": len(checker.violations),
        },
        "violations": checker.violations,
    }
    args.report_json.parent.mkdir(parents=True, exist_ok=True)
    args.report_json.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 1 if checker.violations else 0


if __name__ == "__main__":
    sys.exit(main())
