#!/usr/bin/env python3
"""A1 运行时稳定性基线检查：执行长循环 smoke test 并输出可机检摘要。"""

from __future__ import annotations

import json
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CARGO_MANIFEST = ROOT / "runtime" / "door_core" / "Cargo.toml"
TEST_NAME = "door_runtime_stability_smoke_10k_ticks"


def main() -> int:
    start = time.time()
    proc = subprocess.run(
        [
            "cargo",
            "test",
            "--manifest-path",
            str(CARGO_MANIFEST),
            TEST_NAME,
            "--",
            "--nocapture",
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    duration_ms = int((time.time() - start) * 1000)

    summary = {
        "check": "runtime_stability_a1",
        "test": TEST_NAME,
        "duration_ms": duration_ms,
        "passed": proc.returncode == 0,
    }

    print(json.dumps(summary, ensure_ascii=False))
    if proc.returncode != 0:
        print(proc.stdout)
        print(proc.stderr)
    return proc.returncode


if __name__ == "__main__":
    raise SystemExit(main())
