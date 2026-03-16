#!/usr/bin/env python3
"""Checks the shared door envelope contract against schema, TS, and Rust constants."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTRACT_PATH = ROOT / "protocol" / "contracts" / "door_envelope.contract.json"
REQUEST_SCHEMA_PATH = ROOT / "protocol" / "schemas" / "door.interact.request.schema.json"
RESPONSE_SCHEMA_PATH = ROOT / "protocol" / "schemas" / "door.interact.response.schema.json"
TS_CONTRACT_PATH = ROOT / "editor" / "app" / "src" / "protocol" / "contract.ts"
RUST_PROTOCOL_PATH = ROOT / "runtime" / "door_core" / "src" / "protocol.rs"


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def extract_string_constant(source: str, name: str) -> str:
    pattern = rf'export const {re.escape(name)} = "([^"]+)";|pub const {re.escape(name)}: &str = "([^"]+)";'
    match = re.search(pattern, source)
    if not match:
        raise RuntimeError(f"missing constant {name}")
    return next(group for group in match.groups() if group is not None)


def main() -> int:
    contract = load_json(CONTRACT_PATH)
    request_schema = load_json(REQUEST_SCHEMA_PATH)
    response_schema = load_json(RESPONSE_SCHEMA_PATH)
    ts_source = TS_CONTRACT_PATH.read_text(encoding="utf-8")
    rust_source = RUST_PROTOCOL_PATH.read_text(encoding="utf-8")

    request_type = request_schema["allOf"][1]["properties"]["type"]["const"]
    response_type = response_schema["allOf"][1]["properties"]["type"]["const"]

    assert contract["protocol_version"] == extract_string_constant(ts_source, "PROTOCOL_VERSION")
    assert contract["protocol_version"] == extract_string_constant(rust_source, "PROTOCOL_VERSION")
    assert contract["request_type"] == request_type
    assert contract["response_type"] == response_type
    assert contract["request_type"] == extract_string_constant(ts_source, "DOOR_INTERACT_REQUEST_TYPE")
    assert contract["response_type"] == extract_string_constant(ts_source, "DOOR_INTERACT_RESPONSE_TYPE")
    assert contract["request_type"] == extract_string_constant(rust_source, "DOOR_INTERACT_REQUEST_TYPE")
    assert contract["response_type"] == extract_string_constant(rust_source, "DOOR_INTERACT_RESPONSE_TYPE")

    for code in contract["error_codes"]:
        extract_string_constant(ts_source, code)
        extract_string_constant(rust_source, code)

    print("[protocol-contract] ok")
    return 0


if __name__ == "__main__":
    try:
      raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001
      print(f"[protocol-contract] failed: {exc}", file=sys.stderr)
      raise
