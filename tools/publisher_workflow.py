#!/usr/bin/env python3
"""发布者体验 MVP 工作流工具。

命令：
- scaffold: 生成 Hello Block 模板
- precheck: 发布前高频错误校验
- package: 打包为 .fateblock
- install: 安装到另一个项目目录
"""

from __future__ import annotations

import argparse
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

    manifest = load_json(package_dir / "manifest.json")
    package_name = manifest["id"]
    version = manifest["version"]

    DIST_DIR.mkdir(parents=True, exist_ok=True)
    output_name = args.output or f"{package_name}-{version}.fateblock"
    output_path = DIST_DIR / output_name

    with tarfile.open(output_path, "w:gz") as tar:
        tar.add(package_dir, arcname=package_dir.name)

    checksum = sha256_file(output_path)
    (output_path.with_suffix(output_path.suffix + ".sha256")).write_text(
        f"sha256:{checksum}  {output_path.name}\n", encoding="utf-8"
    )

    print(f"[OK] package created: {output_path.relative_to(ROOT)}")
    print(f"[OK] checksum: sha256:{checksum}")
    return 0


def cmd_install(args: argparse.Namespace) -> int:
    artifact = ROOT / args.artifact if not Path(args.artifact).is_absolute() else Path(args.artifact)
    target = ROOT / args.target if not Path(args.target).is_absolute() else Path(args.target)
    if not artifact.exists():
        print(f"[ERROR] artifact not found: {artifact}")
        return 1

    install_root = target / ".fate" / "blocks"
    install_root.mkdir(parents=True, exist_ok=True)

    with tarfile.open(artifact, "r:gz") as tar:
        members = tar.getmembers()
        root_dirs = {m.name.split("/", 1)[0] for m in members if m.name}
        if len(root_dirs) != 1:
            print("[ERROR] invalid package layout: should contain a single top-level directory")
            return 1
        top = next(iter(root_dirs))
        dest = install_root / top
        if dest.exists():
            shutil.rmtree(dest)
        tar.extractall(path=install_root)

    checksum = sha256_file(artifact)
    receipt = {
        "artifact": str(artifact.resolve()),
        "checksum": f"sha256:{checksum}",
        "installed_to": str((install_root / top).resolve()),
    }
    write_json(install_root / f"{top}.install.receipt.json", receipt)
    print(f"[OK] installed: {(install_root / top).relative_to(ROOT)}")
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

    package = sub.add_parser("package", help="打包为 .fateblock")
    package.add_argument("package", help="package 名称（如 door）或 packages/<name>")
    package.add_argument("--output", help="输出文件名（位于 dist/）")
    package.set_defaults(func=cmd_package)

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
