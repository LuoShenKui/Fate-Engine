#!/usr/bin/env python3
"""协议 Schema 基础校验脚本（CI 可执行）。"""

from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_DIR = ROOT / "protocol" / "schemas"
REQUIRED_FILES = [
    "envelope.schema.json",
    "door.interact.request.schema.json",
    "door.interact.response.schema.json",
]


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def main() -> int:
    for file_name in REQUIRED_FILES:
        file_path = SCHEMA_DIR / file_name
        if not file_path.exists():
            print(f"[ERROR] 缺少 schema 文件: {file_path}")
            return 1
        try:
            schema = load_json(file_path)
        except json.JSONDecodeError as exc:
            print(f"[ERROR] 非法 JSON: {file_path} ({exc})")
            return 1

        if schema.get("$schema") != "http://json-schema.org/draft-07/schema#":
            print(f"[ERROR] $schema 版本不符合预期: {file_path}")
            return 1

    envelope = load_json(SCHEMA_DIR / "envelope.schema.json")
    expected_required = ["protocol_version", "type", "request_id", "payload"]
    if envelope.get("required") != expected_required:
        print("[ERROR] envelope.required 字段不符合约定")
        return 1

    error_required = envelope.get("properties", {}).get("error", {}).get("required")
    if error_required != ["code", "message", "details"]:
        print("[ERROR] envelope.error.required 字段不符合约定")
        return 1

    print("[OK] protocol schemas 校验通过")
    return 0


if __name__ == "__main__":
    sys.exit(main())
