#!/usr/bin/env python3
"""本地发布脚本：校验 manifest/schema，并产出可分发压缩包、校验摘要、lockfile。"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tarfile

ROOT = Path(__file__).resolve().parents[1]
PACKAGES_DIR = ROOT / "packages"
DIST_DIR = ROOT / "dist"
LOCKFILE = PACKAGES_DIR / "brick.lock.json"
COMPAT_MATRIX_DEFAULT_REF = "docs/releases/compat_matrix.json"
LIFECYCLE_STATUS_ALLOWED = {"active", "deprecated", "revoked"}
RELEASE_CHANNEL_ALLOWED = {"canary", "stable", "lts"}
PACKAGE_KIND_ALLOWED = {"product", "logic", "asset"}
MVP_LOCAL_ONLY_VIOLATION = "MVP_LOCAL_ONLY_VIOLATION"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def run_validation(mvp_local_only: bool = True) -> None:
    cmd = ["python3", str(ROOT / "tools" / "validate_schemas.py")]
    if not mvp_local_only:
        cmd.append("--no-mvp-local-only")
    subprocess.run(cmd, check=True)


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def normalize_sha256(value: str) -> str | None:
    if not isinstance(value, str):
        return None
    if value.startswith("sha256:"):
        hex_part = value.split(":", 1)[1]
    else:
        hex_part = value
    if len(hex_part) != 64 or any(ch not in "0123456789abcdef" for ch in hex_part):
        return None
    return f"sha256:{hex_part}"


def build_pipeline_summary(plan: dict | None) -> dict | None:
    if not isinstance(plan, dict):
        return None

    required = ("plan_id", "config_hash", "source_hashes", "tool_version")
    if not all(key in plan for key in required):
        return None

    plan_id = normalize_sha256(plan.get("plan_id"))
    config_hash = normalize_sha256(plan.get("config_hash"))
    tool_version = plan.get("tool_version")
    if plan_id is None or config_hash is None or not isinstance(tool_version, str):
        return None

    source_hashes = plan.get("source_hashes")
    if not isinstance(source_hashes, list):
        return None

    normalized_sources: list[dict] = []
    for item in source_hashes:
        if not isinstance(item, dict):
            return None
        path_value = item.get("path")
        sha_value = item.get("sha256")
        if not isinstance(path_value, str) or not isinstance(sha_value, str):
            return None
        normalized_sha = normalize_sha256(sha_value)
        if normalized_sha is None:
            return None
        normalized_sources.append({"path": path_value, "sha256": normalized_sha.split(":", 1)[1]})

    return {
        "plan_id": plan_id,
        "config_hash": config_hash,
        "source_hashes": normalized_sources,
        "tool_version": tool_version,
    }


def build_mvp_violation(path: str, detail: str) -> str:
    return f"{MVP_LOCAL_ONLY_VIOLATION}: path={path} detail={detail}"


def validate_publish_mvp_local_only(publish: dict) -> None:
    source = publish.get("source")
    source_uri = source.get("uri") if isinstance(source, dict) else None
    if not isinstance(source_uri, str) or not source_uri.startswith("file://"):
        raise ValueError(build_mvp_violation("source.uri", "expected file:// prefix"))

    registry = publish.get("registry")
    if not isinstance(registry, dict):
        raise ValueError(build_mvp_violation("registry", "expected object"))

    provider = registry.get("provider")
    if provider != "local":
        raise ValueError(build_mvp_violation("registry.provider", "expected local"))

    endpoint = registry.get("endpoint")
    if endpoint not in (None, ""):
        raise ValueError(build_mvp_violation("registry.endpoint", "must be empty in MVP local-only mode"))


def validate_package_kind_and_structure(package_dir: Path, manifest: dict, publish: dict) -> None:
    manifest_kind = manifest.get("package_kind")
    publish_kind = publish.get("package_kind")

    if manifest_kind not in PACKAGE_KIND_ALLOWED:
        raise ValueError(f"{package_dir.name}: manifest.package_kind 缺失或非法（product/logic/asset）")
    if publish_kind not in PACKAGE_KIND_ALLOWED:
        raise ValueError(f"{package_dir.name}: publish.package_kind 缺失或非法（product/logic/asset）")
    if manifest_kind != publish_kind:
        raise ValueError(f"{package_dir.name}: manifest.package_kind 与 publish.package_kind 不一致")

    if manifest_kind == "asset":
        assets_dir = package_dir / "assets"
        if not assets_dir.exists() or not assets_dir.is_dir():
            raise ValueError(f"{package_dir.name}: asset 包缺少 assets 目录")
        has_file = any(child.is_file() for child in assets_dir.rglob("*"))
        if not has_file:
            raise ValueError(f"{package_dir.name}: asset 包 assets 目录为空")

    if manifest_kind == "logic":
        slots = manifest.get("slots")
        has_script_slot = False
        if isinstance(slots, list):
            for slot in slots:
                if isinstance(slot, dict) and slot.get("slot_type") == "script_ref":
                    has_script_slot = True
                    break
        if not has_script_slot:
            raise ValueError(f"{package_dir.name}: logic 包缺少 script_ref 脚本入口")


def build_package(
    package_dir: Path,
    dry_run: bool = False,
    pipeline_summary: dict | None = None,
    mvp_local_only: bool = True,
) -> dict:
    manifest = load_json(package_dir / "manifest.json")
    publish = load_json(package_dir / "publish.json")
    validate_package_kind_and_structure(package_dir, manifest, publish)
    if mvp_local_only:
        validate_publish_mvp_local_only(publish)
    lifecycle = publish.get("lifecycle")
    release = publish.get("release")
    compat = publish.get("compat")

    if not isinstance(lifecycle, dict) or lifecycle.get("status") not in LIFECYCLE_STATUS_ALLOWED:
        raise ValueError(f"{package_dir.name}: lifecycle.status 缺失或非法（active/deprecated/revoked）")
    if not isinstance(release, dict) or release.get("channel") not in RELEASE_CHANNEL_ALLOWED:
        raise ValueError(f"{package_dir.name}: release.channel 缺失或非法（canary/stable/lts）")
    if not isinstance(compat, dict):
        raise ValueError(f"{package_dir.name}: compat 缺失")

    compat_matrix_ref = compat.get("matrix_ref")
    if not isinstance(compat_matrix_ref, str) or not compat_matrix_ref:
        raise ValueError(f"{package_dir.name}: compat.matrix_ref 缺失")
    announcement_ref = publish.get("announcement_ref")
    if not isinstance(announcement_ref, str) or not announcement_ref:
        raise ValueError(f"{package_dir.name}: announcement_ref 缺失")

    package_name = publish["package"]
    version = publish["version"]

    archive_name = f"{package_name}-{version}.tar.gz"
    archive_path = DIST_DIR / archive_name

    if dry_run:
        checksum = sha256_file(package_dir / "manifest.json")
    else:
        DIST_DIR.mkdir(parents=True, exist_ok=True)
        with tarfile.open(archive_path, "w:gz") as tar:
            tar.add(package_dir, arcname=package_dir.name)

        checksum = sha256_file(archive_path)
        checksum_path = archive_path.with_suffix(archive_path.suffix + ".sha256")
        checksum_path.write_text(f"sha256:{checksum}  {archive_name}\n", encoding="utf-8")

    source_uri = f"file://{archive_path.relative_to(ROOT)}"
    publish["source"] = {"type": "file", "uri": source_uri}
    publish["artifact"] = {
        "path": str(archive_path.relative_to(ROOT)),
        "checksum": f"sha256:{checksum}",
    }
    if pipeline_summary is not None:
        publish["pipeline"] = pipeline_summary
    if not dry_run:
        (package_dir / "publish.json").write_text(json.dumps(publish, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    return {
        "package": package_name,
        "package_kind": publish["package_kind"],
        "version": version,
        "source": publish["source"],
        "checksum": f"sha256:{checksum}",
        "license": publish["license"],
        "compat": publish["compat"],
        "registry": publish["registry"],
        "lifecycle": publish["lifecycle"],
        "release": publish["release"],
        "announcement_ref": publish["announcement_ref"],
    }


def write_lockfile(entries: list[dict], dry_run: bool = False) -> None:
    lock = {
        "version": 1,
        "generated_by": "tools/release_local.py",
        "packages": sorted(entries, key=lambda item: item["package"]),
    }
    if not dry_run:
        LOCKFILE.write_text(json.dumps(lock, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("packages", nargs="*", help="要发布的包目录名，例如 door")
    parser.add_argument("--dry-run", action="store_true", help="仅做校验与流程检查，不写文件")
    parser.add_argument("--pipeline-plan", type=Path, help="可选：附带写入 publish.json.pipeline 的 plan 文件")
    parser.add_argument("--no-mvp-local-only", action="store_true", help="关闭 MVP local-only 约束")
    args = parser.parse_args()

    mvp_local_only = not args.no_mvp_local_only

    run_validation(mvp_local_only=mvp_local_only)

    package_names = args.packages or sorted(
        item.name for item in PACKAGES_DIR.iterdir() if item.is_dir() and (item / "publish.json").exists()
    )

    pipeline_summary = None
    if args.pipeline_plan is not None:
        pipeline_summary = build_pipeline_summary(load_json(args.pipeline_plan.resolve()))
        if pipeline_summary is None:
            print("[ERROR] --pipeline-plan 内容缺少必要字段: plan_id/config_hash/source_hashes/tool_version")
            return 1

    matrix_ref = COMPAT_MATRIX_DEFAULT_REF
    for name in package_names:
        package_dir = PACKAGES_DIR / name
        publish_path = package_dir / "publish.json"
        publish = load_json(publish_path)
        publish.setdefault("compat", {})
        publish["compat"]["matrix_ref"] = matrix_ref

        release_note_cmd = [
            "python3",
            str(ROOT / "tools" / "build_release_note.py"),
            "--package",
            publish["package"],
            "--version",
            publish["version"],
            "--lifecycle-status",
            str(publish.get("lifecycle", {}).get("status", "")),
            "--release-channel",
            str(publish.get("release", {}).get("channel", "")),
            "--compat-matrix-ref",
            matrix_ref,
            "--package-dir",
            name,
        ]
        if args.dry_run:
            release_note_cmd.append("--dry-run")
        release_note_ref = subprocess.run(release_note_cmd, check=True, capture_output=True, text=True).stdout.strip()
        publish["announcement_ref"] = release_note_ref
        if not args.dry_run:
            publish_path.write_text(json.dumps(publish, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    entries: list[dict] = []
    for name in package_names:
        package_dir = PACKAGES_DIR / name
        try:
            entries.append(
                build_package(
                    package_dir,
                    dry_run=args.dry_run,
                    pipeline_summary=pipeline_summary,
                    mvp_local_only=mvp_local_only,
                )
            )
        except ValueError as exc:
            print(f"[ERROR] {exc}")
            return 1
        action = "已校验(干跑)" if args.dry_run else "已发布"
        print(f"[OK] {action}: {name}")

    write_lockfile(entries, dry_run=args.dry_run)
    if not args.dry_run:
        subprocess.run(
            [
                "python3",
                str(ROOT / "tools" / "build_compat_matrix.py"),
                "--lockfile",
                str(LOCKFILE),
                "--out",
                matrix_ref,
            ],
            check=True,
        )
    if args.dry_run:
        print(f"[OK] dry-run 通过（未写入）: {LOCKFILE.relative_to(ROOT)}")
    else:
        print(f"[OK] lockfile 已更新: {LOCKFILE.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
