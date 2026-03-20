#!/usr/bin/env python3
"""端到端验证发布者 P0 主路径。"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
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
        print(result.stderr, end="", file=sys.stderr)
    if result.returncode != 0:
        raise RuntimeError(f"command failed ({result.returncode}): {' '.join(cmd)}")
    return result.stdout


def move_to_trash(path: Path) -> None:
    if not path.exists():
        return
    TRASH_DIR.mkdir(parents=True, exist_ok=True)
    target = TRASH_DIR / f"{path.name}-{int(time.time())}"
    shutil.move(str(path), str(target))


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def main() -> int:
    unique_suffix = str(time.time_ns())
    unique = f"hello_block_smoke_{unique_suffix}"
    package_id = f"fate.hello.{unique_suffix}"
    artifact_name = f"{package_id}-0.1.0.fateblock"
    package_dir = PACKAGES_DIR / unique
    artifact_path = DIST_DIR / artifact_name
    checksum_path = artifact_path.with_suffix(artifact_path.suffix + ".sha256")
    publish_receipt_path = DIST_DIR / f"{package_id}-0.1.0.publish.json"
    target_dir = Path(tempfile.mkdtemp(prefix="fate_p0_target_"))

    try:
        print(f"[p0] scaffold package={unique} package_id={package_id}")
        run(["python3", "tools/publisher_workflow.py", "scaffold", unique, "--package-id", package_id, "--version", "0.1.0"])

        print("[p0] precheck")
        run(["python3", "tools/publisher_workflow.py", "precheck", unique])

        print("[p0] preview")
        preview_output = run(
            ["python3", "tools/publisher_workflow.py", "preview", unique, "--param", "message=Hello P0"]
        )
        if "lifecycle=load -> parse_params -> onSpawn -> onUpdate" not in preview_output:
            raise RuntimeError("preview output missing lifecycle log")

        print("[p0] package")
        package_output = run(
            ["python3", "tools/publisher_workflow.py", "package", unique, "--output", artifact_name]
        )
        if "[OK] package created:" not in package_output or not artifact_path.exists() or not checksum_path.exists():
            raise RuntimeError("package step did not create artifact and checksum")

        print("[p0] publish")
        publish_output = run(
            ["python3", "tools/publisher_workflow.py", "publish", unique, "--output", artifact_name]
        )
        if "[OK] share id: local://fate/" not in publish_output or not publish_receipt_path.exists():
            raise RuntimeError("publish step did not emit share id and publish receipt")

        print("[p0] install")
        run(["python3", "tools/publisher_workflow.py", "install", str(artifact_path), str(target_dir)])

        installed_manifest = target_dir / ".fate" / "blocks" / unique / "manifest.json"
        if not installed_manifest.exists():
            raise RuntimeError("install step missing target manifest")
        installed = load_json(installed_manifest)
        if installed.get("id") != package_id or installed.get("version") != "0.1.0":
            raise RuntimeError("installed manifest content mismatch")

        print("[publisher-p0] ok scaffold -> precheck -> preview -> package -> publish -> install")
        return 0
    finally:
        move_to_trash(package_dir)
        move_to_trash(artifact_path)
        move_to_trash(checksum_path)
        move_to_trash(publish_receipt_path)
        move_to_trash(target_dir)


if __name__ == "__main__":
    raise SystemExit(main())
