#!/usr/bin/env python3
"""检查 Door Checklist 与 editor/runtime 关键常量是否一致。"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHECKLIST = ROOT / "docs" / "DoorParityChecklist.md"
EDITOR = ROOT / "editor" / "app" / "src" / "domain" / "door.ts"
RUNTIME = ROOT / "runtime" / "door_core" / "src" / "lib.rs"


def extract_doc_events(text: str) -> dict[str, str]:
    return {
        key: value
        for key, value in re.findall(r"- `([A-Z_]+) = \"([A-Za-z0-9]+)\"`", text)
        if key.startswith("ON_")
    }


def extract_doc_codes(text: str) -> dict[str, str]:
    return dict(re.findall(r"- `([A-Z_]+)`（(Error|Warning)）", text))


def extract_ts_block(text: str, name: str) -> dict[str, str]:
    m = re.search(rf"export const {name} = \{{(.*?)\}} as const;", text, flags=re.S)
    if not m:
        return {}
    return dict(re.findall(r"\s*([A-Z_]+): \"([A-Za-z0-9_]+)\",", m.group(1)))


def extract_rs_events(text: str) -> dict[str, str]:
    block = re.search(r"pub mod events \{(.*?)\n\}", text, flags=re.S)
    if not block:
        return {}
    return {
        key: value
        for key, value in re.findall(r'pub const (ON_[A-Z_]+): &str = "([A-Za-z0-9]+)";', block.group(1))
    }


def extract_rs_codes(text: str) -> list[str]:
    block = re.search(r"pub mod validation_codes \{(.*?)\n\}", text, flags=re.S)
    if not block:
        return []
    return re.findall(r'pub const ([A-Z_]+): &str = "[A-Z_]+";', block.group(1))


def compare(name: str, expected, actual) -> list[str]:
    if expected == actual:
        return []
    return [f"[{name}] 不一致\n  expected={expected}\n  actual={actual}"]


def main() -> int:
    checklist_text = CHECKLIST.read_text(encoding="utf-8")
    editor_text = EDITOR.read_text(encoding="utf-8")
    runtime_text = RUNTIME.read_text(encoding="utf-8")

    doc_events = extract_doc_events(checklist_text)
    doc_codes = extract_doc_codes(checklist_text)

    ts_events = extract_ts_block(editor_text, "DOOR_EVENTS")
    ts_codes = extract_ts_block(editor_text, "DOOR_VALIDATION_CODES")
    rs_events = extract_rs_events(runtime_text)
    rs_codes = extract_rs_codes(runtime_text)

    mismatches: list[str] = []
    mismatches += compare("events: docs vs editor", doc_events, ts_events)
    mismatches += compare("events: docs vs runtime", doc_events, rs_events)
    mismatches += compare("error_codes: docs vs editor", sorted(doc_codes.keys()), sorted(ts_codes.keys()))
    mismatches += compare("error_codes: docs vs runtime", sorted(doc_codes.keys()), sorted(rs_codes))

    if mismatches:
        print("Door parity check failed:")
        for item in mismatches:
            print(item)
        return 1

    print("Door parity check passed.")
    print(f"Events: {len(doc_events)}; Error Codes: {len(doc_codes)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
