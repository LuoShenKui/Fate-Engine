#!/usr/bin/env python3
"""校验高频交互接口是否遵循共享契约。"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTRACT_PATH = ROOT / "protocol" / "contracts" / "interaction_surface.contract.json"
TS_CONTRACT_PATH = ROOT / "editor" / "app" / "src" / "workflow" / "interactionContract.ts"
SCENE_ROUTING_PATH = ROOT / "editor" / "app" / "src" / "workflow" / "sceneRouting.ts"
RUNTIME_ACTIONS_PATH = ROOT / "editor" / "app" / "src" / "ui" / "app-runtime-actions.ts"
VISUAL_SCENARIOS_PATH = ROOT / "editor" / "app" / "src" / "ui" / "app-visual-scenarios.ts"
MANIFEST_GLOB = ROOT / "packages"


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def parse_ts_const_array(source: str, const_name: str) -> list[str]:
    match = re.search(rf"export const {re.escape(const_name)} = \[(.*?)\] as const;", source, re.S)
    if match is None:
        raise ValueError(f"missing TS const array: {const_name}")
    return re.findall(r'"([^"]+)"', match.group(1))


def extract_actions_from_logs(source: str) -> list[str]:
    return re.findall(r"action=([a-z_]+)", source)


def main() -> int:
    contract = load_json(CONTRACT_PATH)
    ts_source = read_text(TS_CONTRACT_PATH)
    errors: list[str] = []

    contract_arrays = {
        "INTERACTION_EVENTS": contract.get("events", []),
        "HIGH_FREQUENCY_STATE_KEYS": contract.get("high_frequency_state_keys", []),
        "DOOR_STATE_KEYS": contract.get("door_state_keys", []),
        "DOOR_COMMANDS": contract.get("door_commands", []),
        "DOOR_LINK_ACTIONS": contract.get("door_link_actions", []),
    }
    for ts_name, expected in contract_arrays.items():
        actual = parse_ts_const_array(ts_source, ts_name)
        if actual != expected:
            errors.append(f"{ts_name} mismatch: expected {expected}, got {actual}")

    high_frequency_keys = set(contract["high_frequency_state_keys"])
    for manifest_path in sorted(MANIFEST_GLOB.glob("*/manifest.json")):
        manifest = load_json(manifest_path)
        params = manifest.get("params", {})
        if not isinstance(params, dict):
            continue
        for key in params.keys():
            if key in {"enabled", "locked", "open", "active", "occupied", "opened", "activated", "charging"} and key not in high_frequency_keys:
                errors.append(f"{manifest_path.relative_to(ROOT)} uses non-standardized high-frequency key: {key}")

        capabilities = manifest.get("capabilities", [])
        if isinstance(capabilities, list):
            for capability in capabilities:
                if not isinstance(capability, dict):
                    continue
                if capability.get("capability_id") == "interaction.open_close":
                    exposed = capability.get("exposed_params", [])
                    if not isinstance(exposed, list):
                        errors.append(f"{manifest_path.relative_to(ROOT)} capability interaction.open_close exposed_params must be a list")
                        continue
                    missing = [key for key in contract["door_state_keys"] if key not in exposed]
                    if missing:
                        errors.append(
                            f"{manifest_path.relative_to(ROOT)} interaction.open_close missing standardized params: {missing}"
                        )

    allowed_actions = set(contract["door_link_actions"])
    for path in (SCENE_ROUTING_PATH, RUNTIME_ACTIONS_PATH, VISUAL_SCENARIOS_PATH):
        actions = extract_actions_from_logs(read_text(path))
        for action in actions:
            if action not in allowed_actions:
                errors.append(f"{path.relative_to(ROOT)} uses non-standardized link action: {action}")

    if errors:
        print("[interaction-contract] failed")
        for item in errors:
            print(f"  - {item}")
        return 1

    print("[interaction-contract] ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
