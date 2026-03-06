#!/usr/bin/env python3
"""发布者体验 MVP 工作流工具。

命令：
- scaffold: 生成 Hello Block 模板
- precheck: 发布前高频错误校验
- preview: 本地预览参数与生命周期日志
- package: 打包为 .fateblock
- publish: 本地发布并生成可分享标识
- install: 安装到另一个项目目录
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import re
import shutil
import tarfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKAGES_DIR = ROOT / "packages"
DIST_DIR = ROOT / "dist"
SEMVER_PATTERN = re.compile(r"^[0-9]+\.[0-9]+\.[0-9]+$")
ENGINE_COMPAT_PATTERN = re.compile(r"^(>=|<=|>|<|=)?[0-9]+\.[0-9]+\.[0-9]+$")
SUPPORTED_CONTRACT_VERSIONS = {"0.1"}
DEFAULT_ENGINE_VERSION = "0.1.0"


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def compare_semver(left: str, right: str) -> int:
    left_parts = tuple(int(part) for part in left.split("."))
    right_parts = tuple(int(part) for part in right.split("."))
    if left_parts < right_parts:
        return -1
    if left_parts > right_parts:
        return 1
    return 0


def parse_version_requirement(raw: str) -> tuple[str, str] | None:
    match = re.match(r"^(>=|<=|>|<|=)?([0-9]+\.[0-9]+\.[0-9]+)$", raw)
    if not match:
        return None
    return match.group(1) or "=", match.group(2)


def version_matches(version: str, requirement: str) -> bool:
    parsed = parse_version_requirement(requirement)
    if parsed is None:
        return False
    op, req_ver = parsed
    cmp = compare_semver(version, req_ver)
    if op == "=":
        return cmp == 0
    if op == ">":
        return cmp > 0
    if op == ">=":
        return cmp >= 0
    if op == "<":
        return cmp < 0
    if op == "<=":
        return cmp <= 0
    return False


def read_manifest_from_artifact(artifact: Path) -> tuple[dict, str] | tuple[None, None]:
    with tarfile.open(artifact, "r:gz") as tar:
        members = tar.getmembers()
        root_dirs = {m.name.split("/", 1)[0] for m in members if m.name}
        if len(root_dirs) != 1:
            print("[ERROR] invalid package layout: should contain a single top-level directory")
            return None, None
        top = next(iter(root_dirs))
        manifest_member = next((m for m in members if m.name == f"{top}/manifest.json"), None)
        if manifest_member is None:
            print("[ERROR] invalid package layout: manifest.json missing")
            return None, None
        manifest_file = tar.extractfile(manifest_member)
        if manifest_file is None:
            print("[ERROR] invalid package layout: manifest.json unreadable")
            return None, None
        manifest = json.load(manifest_file)
    return manifest, top


def load_target_project_context(target: Path) -> dict:
    context = {
        "engine_version": DEFAULT_ENGINE_VERSION,
        "supported_contract_versions": sorted(SUPPORTED_CONTRACT_VERSIONS),
        "installed_packages": {},
    }
    context_path = target / ".fate" / "project_context.json"
    if context_path.exists():
        raw_context = load_json(context_path)
        engine_version = raw_context.get("engine_version")
        if isinstance(engine_version, str) and SEMVER_PATTERN.match(engine_version):
            context["engine_version"] = engine_version
        contracts = raw_context.get("supported_contract_versions")
        if isinstance(contracts, list):
            filtered = [item for item in contracts if isinstance(item, str)]
            if filtered:
                context["supported_contract_versions"] = filtered

    install_root = target / ".fate" / "blocks"
    if install_root.exists():
        for manifest_path in install_root.glob("*/manifest.json"):
            manifest = load_json(manifest_path)
            package_id = manifest.get("id")
            package_version = manifest.get("version")
            if isinstance(package_id, str) and isinstance(package_version, str):
                context["installed_packages"][package_id] = package_version
    return context


def validate_for_install(manifest: dict, target_project_context: dict) -> list[dict]:
    failures: list[dict] = []
    engine_compat = manifest.get("engine_compat")
    engine_version = target_project_context.get("engine_version", DEFAULT_ENGINE_VERSION)
    if not isinstance(engine_compat, str) or not version_matches(engine_version, engine_compat):
        failures.append(
            {
                "code": "ENGINE_INCOMPATIBLE",
                "required": engine_compat,
                "current": engine_version,
            }
        )

    contract_version = manifest.get("contract_version")
    supported_contracts = set(target_project_context.get("supported_contract_versions", []))
    if not isinstance(contract_version, str) or contract_version not in supported_contracts:
        failures.append(
            {
                "code": "CONTRACT_INCOMPATIBLE",
                "required": contract_version,
                "supported": sorted(supported_contracts),
            }
        )

    dependencies = manifest.get("dependencies")
    installed_packages = target_project_context.get("installed_packages", {})
    if isinstance(dependencies, list):
        for dep in dependencies:
            if not isinstance(dep, dict):
                continue
            dep_id = dep.get("id")
            dep_version_req = dep.get("version")
            if not isinstance(dep_id, str) or not isinstance(dep_version_req, str):
                continue
            current_version = installed_packages.get(dep_id)
            if current_version is None:
                failures.append(
                    {
                        "code": "DEPENDENCY_MISSING",
                        "package_id": dep_id,
                        "required": dep_version_req,
                        "current": None,
                    }
                )
                continue
            if not version_matches(current_version, dep_version_req):
                failures.append(
                    {
                        "code": "DEPENDENCY_VERSION_CONFLICT",
                        "package_id": dep_id,
                        "required": dep_version_req,
                        "current": current_version,
                    }
                )
    return failures


def make_hello_manifest(package_id: str, version: str) -> dict:
    return {
        "id": package_id,
        "version": version,
        "contract_version": "0.1",
        "engine_compat": ">=0.1.0",
        "license": "MIT",
        "dependencies": [],
        "capabilities": [{"capability_id": "interaction.hello", "level": 1, "exposed_params": ["message"]}],
        "params": {
            "message": {
                "key": "message",
                "type": "string",
                "default": "Hello Block",
                "mutability": "runtime",
                "visibility": "basic",
                "impact": ["gameplay"],
            }
        },
        "slots": [
            {
                "slot_id": "script.logic",
                "slot_type": "script_ref",
                "fallback": "file://scripts/hello_logic.ts",
                "optional": False,
                "requires": "true",
            }
        ],
        "defaults": {"enabled": True},
        "state_version": "1.0.0",
        "state_migration": {
            "entry": "packages/{name}/manifest/README.md#migration".format(name=package_id.split(".")[-1]),
            "from_previous": "none -> 1.0.0: 初始化 message 参数。",
        },
    }


def make_hello_publish(package_id: str, version: str, manifest_path: Path) -> dict:
    return {
        "package": package_id,
        "version": version,
        "hash": f"sha256:{sha256_file(manifest_path)}",
        "license": "MIT",
        "compat": {"engine": ">=0.1.0", "contract": "0.1", "matrix_ref": "docs/releases/compat_matrix.json"},
        "source": {"type": "dir", "uri": f"file://packages/{package_id.split('.')[-1]}"},
        "registry": {"provider": "local", "namespace": "fate", "channel": "canary", "endpoint": ""},
        "lifecycle": {"status": "active"},
        "release": {"channel": "canary"},
        "announcement_ref": "docs/releases/templates/package_release_note.md",
    }


def cmd_scaffold(args: argparse.Namespace) -> int:
    package_dir = PACKAGES_DIR / args.name
    if package_dir.exists():
        print(f"[ERROR] package already exists: {package_dir}")
        return 1

    package_id = args.package_id or f"fate.{args.name}.hello"
    if not SEMVER_PATTERN.match(args.version):
        print("[ERROR] --version must be semver, e.g. 0.1.0")
        return 1

    (package_dir / "scripts").mkdir(parents=True, exist_ok=False)
    (package_dir / "manifest").mkdir(parents=True, exist_ok=False)
    (package_dir / "assets").mkdir(parents=True, exist_ok=False)
    (package_dir / "tests").mkdir(parents=True, exist_ok=False)

    manifest = make_hello_manifest(package_id, args.version)
    write_json(package_dir / "manifest.json", manifest)

    publish = make_hello_publish(package_id, args.version, package_dir / "manifest.json")
    write_json(package_dir / "publish.json", publish)

    (package_dir / "scripts" / "hello_logic.ts").write_text(
        """export function onSpawn(message: string): void {\n  console.log(`[hello-block] spawn: ${message}`);\n}\n\nexport function onUpdate(message: string): void {\n  console.log(`[hello-block] update: ${message}`);\n}\n""",
        encoding="utf-8",
    )

    (package_dir / "manifest" / "README.md").write_text(
        "# Migration\n\n## migration\n- 1.0.0: 初始化状态，无历史迁移。\n", encoding="utf-8"
    )
    (package_dir / "assets" / "README.md").write_text("# Assets\n\n占位资源目录。\n", encoding="utf-8")
    (package_dir / "tests" / "manifest.invalid.missing_state_version.json").write_text(
        json.dumps({k: v for k, v in manifest.items() if k != "state_version"}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"[OK] scaffold created: {package_dir.relative_to(ROOT)}")
    return 0


def validate_manifest_for_precheck(package_dir: Path, manifest: dict) -> list[str]:
    errors: list[str] = []

    engine_compat = manifest.get("engine_compat")
    if not isinstance(engine_compat, str) or not ENGINE_COMPAT_PATTERN.match(engine_compat):
        errors.append("ENGINE_COMPAT_INVALID: expected format like >=0.1.0")

    params = manifest.get("params")
    if not isinstance(params, dict):
        errors.append("PARAMS_TYPE_INVALID: expected object")
    else:
        allowed_types = {"bool", "int", "float", "string"}
        for name, item in params.items():
            if not isinstance(item, dict):
                errors.append(f"PARAM_ITEM_INVALID: {name} expected object")
                continue
            p_type = item.get("type")
            if p_type not in allowed_types:
                errors.append(f"PARAM_TYPE_INVALID: {name} type={p_type}")

    migration_entry = manifest.get("state_migration", {}).get("entry")
    if not isinstance(migration_entry, str) or "#" not in migration_entry:
        errors.append("ENTRY_EXPORT_MISSING: state_migration.entry must contain file#anchor")
    else:
        file_part, _anchor = migration_entry.split("#", 1)
        entry_path = ROOT / file_part
        if not entry_path.exists():
            errors.append(f"ENTRY_FILE_MISSING: {file_part}")

    for slot in manifest.get("slots", []):
        fallback = slot.get("fallback") if isinstance(slot, dict) else None
        if not isinstance(fallback, str):
            continue
        if fallback.startswith("file://"):
            rel = fallback[len("file://") :]
            resource_path = package_dir / rel
            if not resource_path.exists():
                errors.append(f"RESOURCE_MISSING: {resource_path.relative_to(ROOT)}")

    return errors


def cmd_precheck(args: argparse.Namespace) -> int:
    package_dir = (PACKAGES_DIR / args.package) if not args.package.startswith("packages/") else (ROOT / args.package)
    manifest_path = package_dir / "manifest.json"
    if not manifest_path.exists():
        print(f"[ERROR] manifest not found: {manifest_path}")
        return 1

    manifest = load_json(manifest_path)
    errors = validate_manifest_for_precheck(package_dir, manifest)
    if errors:
        print(f"[ERROR] precheck failed: {package_dir.relative_to(ROOT)}")
        for item in errors:
            print(f"  - {item}")
        return 1

    print(f"[OK] precheck passed: {package_dir.relative_to(ROOT)}")
    return 0


def cmd_package(args: argparse.Namespace) -> int:
    package_dir = (PACKAGES_DIR / args.package) if not args.package.startswith("packages/") else (ROOT / args.package)
    if not (package_dir / "manifest.json").exists():
        print(f"[ERROR] manifest not found: {package_dir / 'manifest.json'}")
        return 1

    precheck_errors = validate_manifest_for_precheck(package_dir, load_json(package_dir / "manifest.json"))
    if precheck_errors:
        print("[ERROR] package aborted by precheck")
        for item in precheck_errors:
            print(f"  - {item}")
        return 1

    output_path, checksum = build_package_artifact(package_dir, args.output)

    print(f"[OK] package created: {output_path.relative_to(ROOT)}")
    print(f"[OK] checksum: sha256:{checksum}")
    return 0


def parse_param_value(raw: str, expected_type: str) -> object:
    if expected_type == "string":
        return raw
    if expected_type == "bool":
        normalized = raw.strip().lower()
        if normalized in {"true", "1", "yes", "y"}:
            return True
        if normalized in {"false", "0", "no", "n"}:
            return False
        raise ValueError(f"bool value expected, got: {raw}")
    if expected_type == "int":
        return int(raw)
    if expected_type == "float":
        return float(raw)
    raise ValueError(f"unsupported param type: {expected_type}")


def cmd_preview(args: argparse.Namespace) -> int:
    package_dir = (PACKAGES_DIR / args.package) if not args.package.startswith("packages/") else (ROOT / args.package)
    manifest_path = package_dir / "manifest.json"
    if not manifest_path.exists():
        print(f"[ERROR] manifest not found: {manifest_path}")
        return 1

    manifest = load_json(manifest_path)
    params = manifest.get("params")
    if not isinstance(params, dict):
        print("[ERROR] manifest params invalid: expected object")
        return 1

    resolved: dict[str, object] = {}
    for name, item in params.items():
        if isinstance(item, dict) and "default" in item:
            resolved[name] = item["default"]

    for raw_pair in args.param:
        if "=" not in raw_pair:
            print(f"[ERROR] invalid --param format: {raw_pair}, expected key=value")
            return 1
        key, value = raw_pair.split("=", 1)
        item = params.get(key)
        if not isinstance(item, dict):
            print(f"[ERROR] param not found in manifest: {key}")
            return 1
        expected_type = item.get("type")
        try:
            resolved[key] = parse_param_value(value, expected_type)
        except (TypeError, ValueError) as exc:
            print(f"[ERROR] param parse failed: {key} ({exc})")
            return 1

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"[preview][{timestamp}] package={manifest.get('id')} version={manifest.get('version')}")
    print("[preview] lifecycle=load -> parse_params -> onSpawn -> onUpdate")
    print(f"[preview] params={json.dumps(resolved, ensure_ascii=False, sort_keys=True)}")
    print(f"[preview] log:onSpawn message={resolved.get('message', '<none>')}")
    print(f"[preview] log:onUpdate message={resolved.get('message', '<none>')}")
    print("[OK] preview completed")
    return 0


def build_package_artifact(package_dir: Path, output_name: str | None) -> tuple[Path, str]:
    manifest = load_json(package_dir / "manifest.json")
    package_name = manifest["id"]
    version = manifest["version"]

    DIST_DIR.mkdir(parents=True, exist_ok=True)
    resolved_output_name = output_name or f"{package_name}-{version}.fateblock"
    output_path = DIST_DIR / resolved_output_name

    with tarfile.open(output_path, "w:gz") as tar:
        tar.add(package_dir, arcname=package_dir.name)

    checksum = sha256_file(output_path)
    (output_path.with_suffix(output_path.suffix + ".sha256")).write_text(
        f"sha256:{checksum}  {output_path.name}\n", encoding="utf-8"
    )
    return output_path, checksum


def cmd_publish(args: argparse.Namespace) -> int:
    package_dir = (PACKAGES_DIR / args.package) if not args.package.startswith("packages/") else (ROOT / args.package)
    if not (package_dir / "manifest.json").exists():
        print(f"[ERROR] manifest not found: {package_dir / 'manifest.json'}")
        return 1

    precheck_errors = validate_manifest_for_precheck(package_dir, load_json(package_dir / "manifest.json"))
    if precheck_errors:
        print("[ERROR] publish aborted by precheck")
        for item in precheck_errors:
            print(f"  - {item}")
        return 1

    output_path, checksum = build_package_artifact(package_dir, args.output)
    manifest = load_json(package_dir / "manifest.json")
    share_id = f"local://fate/{manifest['id']}@{manifest['version']}"

    publish_receipt = {
        "package": manifest["id"],
        "version": manifest["version"],
        "share_id": share_id,
        "artifact": str(output_path.relative_to(ROOT)),
        "checksum": f"sha256:{checksum}",
    }
    write_json(DIST_DIR / f"{manifest['id']}-{manifest['version']}.publish.json", publish_receipt)
    print(f"[OK] publish completed: {output_path.relative_to(ROOT)}")
    print(f"[OK] share id: {share_id}")
    return 0


def cmd_install(args: argparse.Namespace) -> int:
    artifact = ROOT / args.artifact if not Path(args.artifact).is_absolute() else Path(args.artifact)
    target = ROOT / args.target if not Path(args.target).is_absolute() else Path(args.target)
    if not artifact.exists():
        print(f"[ERROR] artifact not found: {artifact}")
        return 1

    manifest, top = read_manifest_from_artifact(artifact)
    if manifest is None or top is None:
        return 1

    target_project_context = load_target_project_context(target)
    failures = validate_for_install(manifest, target_project_context)
    if failures:
        print("[ERROR] install blocked by pre-import validation")
        for failure in failures:
            print(f"  - {failure['code']}: {json.dumps(failure, ensure_ascii=False, sort_keys=True)}")

        missing_items = [item for item in failures if item["code"] == "DEPENDENCY_MISSING"]
        conflict_items = [item for item in failures if item["code"] == "DEPENDENCY_VERSION_CONFLICT"]
        if missing_items:
            print("[ERROR] 缺失项清单:")
            for item in missing_items:
                print(
                    "  - id={id}, required={required}, current=<none>".format(
                        id=item["package_id"], required=item["required"]
                    )
                )
        if conflict_items:
            print("[ERROR] 冲突项清单:")
            for item in conflict_items:
                print(
                    "  - id={id}, required={required}, current={current}".format(
                        id=item["package_id"], required=item["required"], current=item["current"]
                    )
                )
        return 1

    install_root = target / ".fate" / "blocks"
    install_root.mkdir(parents=True, exist_ok=True)

    with tarfile.open(artifact, "r:gz") as tar:
        dest = install_root / top
        if dest.exists():
            shutil.rmtree(dest)
        tar.extractall(path=install_root)

    checksum = sha256_file(artifact)
    installed_path = install_root / top
    receipt = {
        "artifact": str(artifact.resolve()),
        "checksum": f"sha256:{checksum}",
        "installed_to": str(installed_path.resolve()),
    }
    write_json(install_root / f"{top}.install.receipt.json", receipt)
    try:
        display_path = installed_path.relative_to(ROOT)
    except ValueError:
        display_path = installed_path.resolve()
    print(f"[OK] installed: {display_path}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fate 发布者体验工作流工具")
    sub = parser.add_subparsers(dest="command", required=True)

    scaffold = sub.add_parser("scaffold", help="创建 Hello Block 模板")
    scaffold.add_argument("name", help="package 目录名，例如 hello_block")
    scaffold.add_argument("--package-id", help="完整 package id，例如 fate.hello.block")
    scaffold.add_argument("--version", default="0.1.0", help="版本号（semver）")
    scaffold.set_defaults(func=cmd_scaffold)

    precheck = sub.add_parser("precheck", help="发布前自动检查")
    precheck.add_argument("package", help="package 名称（如 door）或 packages/<name>")
    precheck.set_defaults(func=cmd_precheck)

    preview = sub.add_parser("preview", help="本地预览（日志与参数解析）")
    preview.add_argument("package", help="package 名称（如 door）或 packages/<name>")
    preview.add_argument(
        "--param", action="append", default=[], help="覆盖参数，格式 key=value；可重复传入"
    )
    preview.set_defaults(func=cmd_preview)

    package = sub.add_parser("package", help="打包为 .fateblock")
    package.add_argument("package", help="package 名称（如 door）或 packages/<name>")
    package.add_argument("--output", help="输出文件名（位于 dist/）")
    package.set_defaults(func=cmd_package)

    publish = sub.add_parser("publish", help="本地发布（含 precheck + package）")
    publish.add_argument("package", help="package 名称（如 door）或 packages/<name>")
    publish.add_argument("--output", help="输出文件名（位于 dist/）")
    publish.set_defaults(func=cmd_publish)

    install = sub.add_parser("install", help="安装 .fateblock 到项目")
    install.add_argument("artifact", help=".fateblock 文件路径")
    install.add_argument("target", help="目标项目路径")
    install.set_defaults(func=cmd_install)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
