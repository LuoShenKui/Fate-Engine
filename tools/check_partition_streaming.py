#!/usr/bin/env python3
"""分区流送回放检查：输出切换耗时统计与状态一致性结果。"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_FIXTURE = ROOT / "fixtures" / "partition" / "minimal_partition_scene.json"
DEFAULT_EXPECTED = ROOT / "fixtures" / "partition" / "minimal_partition_expected.json"


def percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    rank = max(0, int((len(ordered) - 1) * p))
    return float(ordered[rank])


class PartitionRuntime:
    def __init__(self) -> None:
        self.mounted: dict[str, dict[str, Any]] = {}
        self.loaded: dict[str, dict[str, Any]] = {}

    def load(self, doors: list[dict[str, Any]]) -> None:
        self.loaded = {}
        for door in doors:
            entity_id = door["entity_id"]
            self.loaded[entity_id] = self.mounted.get(entity_id, door["initial_state"]).copy()

    def unload(self) -> None:
        for entity_id, state in self.loaded.items():
            self.mounted[entity_id] = state.copy()
        self.loaded = {}

    def set_state(self, entity_id: str, patch: dict[str, Any]) -> None:
        if entity_id in self.loaded:
            self.loaded[entity_id].update(patch)


def build_summary(fixture: dict[str, Any]) -> dict[str, Any]:
    runtime = PartitionRuntime()
    partitions = fixture["partitions"]

    for partition in fixture["stream"]:
        runtime.unload()
        runtime.load(partitions[partition]["doors"])
        for action in fixture.get("actions", []):
            if action["partition"] == partition:
                runtime.set_state(action["entity_id"], action["set"])
    runtime.unload()

    durations = [float(v) for v in fixture["switch_durations_ms"]]
    metrics = {
        "p50_ms": percentile(durations, 0.50),
        "p95_ms": percentile(durations, 0.95),
        "max_ms": max(durations) if durations else 0.0,
    }

    thresholds = fixture.get("thresholds", {"p95_ms": 35.0, "max_ms": 50.0})
    consistency_checks = fixture.get("consistency_checks", [])
    consistent = True
    for check in consistency_checks:
        entity_id = check["entity_id"]
        expected = check["expected_state"]
        actual = runtime.mounted.get(entity_id)
        if actual != expected:
            consistent = False

    smooth = metrics["p95_ms"] <= thresholds["p95_ms"] and metrics["max_ms"] <= thresholds["max_ms"]
    return {
        "fixture": fixture.get("id", "partition-streaming"),
        "metrics": metrics,
        "thresholds": thresholds,
        "smooth_no_spike": smooth,
        "state_consistent": consistent,
        "final_mounted_state": runtime.mounted,
    }


def canonical(payload: Any) -> str:
    return json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fixture", type=Path, default=DEFAULT_FIXTURE)
    parser.add_argument("--expected", type=Path, default=DEFAULT_EXPECTED)
    parser.add_argument("--snapshot-out", type=Path)
    args = parser.parse_args()

    fixture = json.loads(args.fixture.read_text(encoding="utf-8"))
    summary = build_summary(fixture)

    if args.snapshot_out:
        args.snapshot_out.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    expected = json.loads(args.expected.read_text(encoding="utf-8"))
    if canonical(summary) != canonical(expected):
        print("[ERROR] partition streaming snapshot mismatch")
        return 1

    print(json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True))
    print("[OK] partition streaming check passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
