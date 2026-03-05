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


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def run_validation() -> None:
    subprocess.run(["python3", str(ROOT / "tools" / "validate_schemas.py")], check=True)


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def build_package(package_dir: Path) -> dict:
    publish = load_json(package_dir / "publish.json")
    package_name = publish["package"]
    version = publish["version"]

    DIST_DIR.mkdir(parents=True, exist_ok=True)
    archive_name = f"{package_name}-{version}.tar.gz"
    archive_path = DIST_DIR / archive_name

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
    (package_dir / "publish.json").write_text(json.dumps(publish, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    return {
        "package": package_name,
        "version": version,
        "source": publish["source"],
        "checksum": f"sha256:{checksum}",
        "license": publish["license"],
        "compat": publish["compat"],
        "registry": publish["registry"],
    }


def write_lockfile(entries: list[dict]) -> None:
    lock = {
        "version": 1,
        "generated_by": "tools/release_local.py",
        "packages": sorted(entries, key=lambda item: item["package"]),
    }
    LOCKFILE.write_text(json.dumps(lock, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("packages", nargs="*", help="要发布的包目录名，例如 door")
    args = parser.parse_args()

    run_validation()

    package_names = args.packages or sorted(
        item.name for item in PACKAGES_DIR.iterdir() if item.is_dir() and (item / "publish.json").exists()
    )

    entries: list[dict] = []
    for name in package_names:
        package_dir = PACKAGES_DIR / name
        entries.append(build_package(package_dir))
        print(f"[OK] 已发布: {name}")

    write_lockfile(entries)
    print(f"[OK] lockfile 已更新: {LOCKFILE.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
