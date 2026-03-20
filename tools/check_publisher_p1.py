#!/usr/bin/env python3
"""端到端验证发布者 P1 主路径。"""

from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKAGES_DIR = ROOT / "packages"
DIST_DIR = ROOT / "dist"
TRASH_DIR = ROOT / ".trash"


def run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True)
    if result.stdout:
        print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="")
    if result.returncode != 0:
        raise RuntimeError(f"command failed ({result.returncode}): {' '.join(cmd)}")
    return result.stdout


def run_capture(cmd: list[str]) -> tuple[int, str]:
    result = subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True)
    output = f"{result.stdout}{result.stderr}"
    if output:
        print(output, end="")
    return result.returncode, output


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def move_to_trash(path: Path) -> None:
    if not path.exists():
        return
    TRASH_DIR.mkdir(parents=True, exist_ok=True)
    target = TRASH_DIR / f"{path.name}-{int(time.time())}"
    shutil.move(str(path), str(target))


def build_lockfile(path: Path, package_id: str, version: str, artifact: Path, checksum: str, announcement_ref: str) -> None:
    write_json(
        path,
        {
            "version": 1,
            "generated_by": "tools/check_publisher_p1.py",
            "packages": [
                {
                    "package": package_id,
                    "version": version,
                    "source": {"type": "file", "uri": f"file://{artifact.relative_to(ROOT)}"},
                    "checksum": checksum,
                    "license": "MIT",
                    "compat": {"engine": ">=0.1.0", "contract": "0.1", "matrix_ref": "docs/releases/compat_matrix.json"},
                    "registry": {"provider": "local", "namespace": "fate", "channel": "stable", "endpoint": ""},
                    "lifecycle": {"status": "active"},
                    "release": {"channel": "stable"},
                    "announcement_ref": announcement_ref,
                }
            ],
        },
    )


def main() -> int:
    unique = str(time.time_ns())
    package_dir_name = f"hello_block_p1_{unique}"
    package_id = "fate.hello.p1"
    target_dir = Path(tempfile.mkdtemp(prefix="fate_p1_target_"))
    package_dir = PACKAGES_DIR / package_dir_name
    artifact_v1 = DIST_DIR / f"{package_id}-{unique}-0.1.0.fateblock"
    artifact_v2 = DIST_DIR / f"{package_id}-{unique}-0.1.1.fateblock"
    lock_v1 = DIST_DIR / f"{package_id}-{unique}-0.1.0.lock.json"
    lock_v2 = DIST_DIR / f"{package_id}-{unique}-0.1.1.lock.json"
    dep_pkg_dir = PACKAGES_DIR / f"hello_dep_p1_{unique}"
    dep_artifact = DIST_DIR / f"fate.hello.depcheck-{unique}-0.1.0.fateblock"
    dep_lock = DIST_DIR / f"fate.hello.depcheck-{unique}-dep.lock.json"

    try:
        run(["python3", "tools/publisher_workflow.py", "scaffold", package_dir_name, "--package-id", package_id, "--version", "0.1.0"])

        run(["python3", "tools/publisher_workflow.py", "package", package_dir_name, "--output", artifact_v1.name])
        checksum_v1 = "sha256:" + artifact_v1.with_suffix(".fateblock.sha256").read_text(encoding="utf-8").split()[0].split(":", 1)[1]
        build_lockfile(lock_v1, package_id, "0.1.0", artifact_v1, checksum_v1, "docs/releases/pending-p1-v1.md")

        install_v1 = run(
            ["python3", "tools/publisher_workflow.py", "install-from-lockfile", str(lock_v1), package_id, str(target_dir)]
        )
        if "[OK] installed:" not in install_v1:
            raise RuntimeError("install-from-lockfile v1 failed")

        manifest_path = package_dir / "manifest.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest["version"] = "0.1.1"
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        publish_path = package_dir / "publish.json"
        publish = json.loads(publish_path.read_text(encoding="utf-8"))
        publish["version"] = "0.1.1"
        publish["hash"] = publish["hash"]
        publish_path.write_text(json.dumps(publish, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        run(["python3", "tools/publisher_workflow.py", "package", package_dir_name, "--output", artifact_v2.name])
        checksum_v2 = "sha256:" + artifact_v2.with_suffix(".fateblock.sha256").read_text(encoding="utf-8").split()[0].split(":", 1)[1]
        build_lockfile(lock_v2, package_id, "0.1.1", artifact_v2, checksum_v2, "docs/releases/pending-p1-v2.md")

        install_v2 = run(
            ["python3", "tools/publisher_workflow.py", "install-from-lockfile", str(lock_v2), package_id, str(target_dir)]
        )
        if "[WARN] version transition:" not in install_v2:
            raise RuntimeError("upgrade risk warning missing")
        if "[INFO] release note:" not in install_v2:
            raise RuntimeError("release note hint missing")

        rollback_output = run(["python3", "tools/publisher_workflow.py", "rollback", package_id, str(target_dir)])
        if "[OK] installed:" not in rollback_output:
            raise RuntimeError("rollback failed")

        registry = json.loads((target_dir / ".fate" / "install_registry.json").read_text(encoding="utf-8"))
        current = registry["packages"][package_id]["current"]
        history = registry["packages"][package_id]["history"]
        if current["version"] != "0.1.0":
            raise RuntimeError("rollback did not restore 0.1.0")
        if not any(item.get("version") == "0.1.1" for item in history):
            raise RuntimeError("install history missing upgraded version")
        if current.get("license") != "MIT":
            raise RuntimeError("license not recorded in current receipt")

        run(
            [
                "python3",
                "tools/publisher_workflow.py",
                "scaffold",
                dep_pkg_dir.name,
                "--package-id",
                "fate.hello.depcheck",
                "--version",
                "0.1.0",
            ]
        )
        dep_manifest_path = dep_pkg_dir / "manifest.json"
        dep_manifest = json.loads(dep_manifest_path.read_text(encoding="utf-8"))
        dep_manifest["dependencies"] = [{"id": "fate.missing.dep", "version": ">=1.2.0"}]
        dep_manifest_path.write_text(json.dumps(dep_manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        run(["python3", "tools/publisher_workflow.py", "package", dep_pkg_dir.name, "--output", dep_artifact.name])
        dep_checksum = dep_artifact.with_suffix(".fateblock.sha256").read_text(encoding="utf-8").split()[0]
        build_lockfile(dep_lock, "fate.hello.depcheck", "0.1.0", dep_artifact, dep_checksum, "docs/releases/pending-dep.md")
        dep_code, dep_output = run_capture(
            [
                "python3",
                "tools/publisher_workflow.py",
                "install-from-lockfile",
                str(dep_lock),
                "fate.hello.depcheck",
                str(target_dir),
            ]
        )
        if dep_code == 0:
            raise RuntimeError("dependency validation should have failed")
        if "DEPENDENCY_MISSING" not in dep_output or "hint: python3 tools/publisher_workflow.py install-from-lockfile" not in dep_output:
            raise RuntimeError("dependency error hint missing")

        print("[publisher-p1] ok lockfile install -> upgrade -> release note -> rollback -> receipt history -> dependency hint")
        return 0
    finally:
        move_to_trash(package_dir)
        move_to_trash(artifact_v1)
        move_to_trash(artifact_v1.with_suffix(".fateblock.sha256"))
        move_to_trash(artifact_v2)
        move_to_trash(artifact_v2.with_suffix(".fateblock.sha256"))
        move_to_trash(lock_v1)
        move_to_trash(lock_v2)
        move_to_trash(dep_pkg_dir)
        move_to_trash(dep_artifact)
        move_to_trash(dep_artifact.with_suffix(".fateblock.sha256"))
        move_to_trash(dep_lock)
        move_to_trash(target_dir)


if __name__ == "__main__":
    raise SystemExit(main())
