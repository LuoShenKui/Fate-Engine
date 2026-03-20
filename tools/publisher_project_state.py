#!/usr/bin/env python3
"""发布者工作流的项目安装状态与本地垃圾箱辅助。"""

from __future__ import annotations

import json
import shutil
import time
from pathlib import Path


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def registry_path(target: Path) -> Path:
    return target / ".fate" / "install_registry.json"


def local_trash_dir(target: Path) -> Path:
    return target / ".fate" / "trash"


def load_install_registry(target: Path) -> dict:
    path = registry_path(target)
    if not path.exists():
        return {"version": 1, "packages": {}}
    data = load_json(path)
    if not isinstance(data, dict):
        return {"version": 1, "packages": {}}
    packages = data.get("packages")
    if not isinstance(packages, dict):
        data["packages"] = {}
    data.setdefault("version", 1)
    return data


def write_install_registry(target: Path, data: dict) -> None:
    write_json(registry_path(target), data)


def move_path_to_local_trash(target: Path, path: Path) -> Path | None:
    if not path.exists():
        return None
    trash_dir = local_trash_dir(target)
    trash_dir.mkdir(parents=True, exist_ok=True)
    candidate = trash_dir / f"{path.name}-{int(time.time())}"
    shutil.move(str(path), str(candidate))
    return candidate


def append_install_history(
    target: Path,
    package_id: str,
    record: dict,
) -> dict:
    registry = load_install_registry(target)
    packages = registry.setdefault("packages", {})
    package_entry = packages.setdefault(package_id, {"current": None, "history": []})
    current = package_entry.get("current")
    history = package_entry.setdefault("history", [])
    if isinstance(current, dict):
        history.append(current)
    package_entry["current"] = record
    write_install_registry(target, registry)
    return registry


def find_rollback_record(target: Path, package_id: str, version: str | None = None) -> dict | None:
    registry = load_install_registry(target)
    package_entry = registry.get("packages", {}).get(package_id)
    if not isinstance(package_entry, dict):
        return None
    history = package_entry.get("history", [])
    if not isinstance(history, list):
        return None
    if version is None:
        for item in reversed(history):
            if isinstance(item, dict):
                return item
        return None
    for item in reversed(history):
        if isinstance(item, dict) and item.get("version") == version:
            return item
    return None


def iter_installed_package_dirs(target: Path) -> list[tuple[Path, dict]]:
    install_root = target / ".fate" / "blocks"
    if not install_root.exists():
        return []
    results: list[tuple[Path, dict]] = []
    for manifest_path in install_root.glob("*/manifest.json"):
        try:
            manifest = load_json(manifest_path)
        except (OSError, json.JSONDecodeError):
            continue
        results.append((manifest_path.parent, manifest))
    return results
