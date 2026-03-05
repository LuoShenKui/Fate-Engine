#!/usr/bin/env python3
"""运行时长稳检查：支持 2h/8h 档位并输出统一 JSON 摘要。"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import shutil
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CARGO_MANIFEST = ROOT / "runtime" / "door_core" / "Cargo.toml"
THRESHOLD_CONFIG = ROOT / "protocol" / "perf" / "runtime_soak_thresholds.json"
DEFAULT_RECIPE = ROOT / "fixtures" / "replay" / "fixed_recipe.json"
DEFAULT_LOCKFILE = ROOT / "packages" / "brick.lock.json"
CRASH_ROOT = ROOT / "artifacts" / "crash"

PROFILE_TO_SECONDS = {
    "2h": 2 * 60 * 60,
    "8h": 8 * 60 * 60,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Runtime soak checker")
    parser.add_argument("--profile", choices=["2h", "8h"], required=True)
    parser.add_argument("--seed", type=int, default=123)
    parser.add_argument("--recipe", type=Path, default=DEFAULT_RECIPE)
    parser.add_argument("--lockfile", type=Path, default=DEFAULT_LOCKFILE)
    parser.add_argument("--threshold-config", type=Path, default=THRESHOLD_CONFIG)
    parser.add_argument(
        "--duration-seconds",
        type=int,
        default=None,
        help="调试用途，可覆盖 profile 对应时长",
    )
    return parser.parse_args()


def read_rss_mb(pid: int) -> float:
    status_path = Path(f"/proc/{pid}/status")
    if not status_path.exists():
        return 0.0
    for line in status_path.read_text(encoding="utf-8", errors="ignore").splitlines():
        if line.startswith("VmRSS:"):
            parts = line.split()
            if len(parts) >= 2 and parts[1].isdigit():
                return int(parts[1]) / 1024.0
    return 0.0


def load_threshold(profile: str, path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    profile_data = data["profiles"][profile]
    return {
        "max_rss_mb": float(profile_data["max_rss_mb"]),
        "max_error_count": int(profile_data.get("max_error_count", 0)),
    }


def archive_failure(
    *,
    stderr_text: str,
    stdout_text: str,
    args: argparse.Namespace,
    command: list[str],
) -> Path:
    ts = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    archive_dir = CRASH_ROOT / f"runtime_soak_{ts}"
    archive_dir.mkdir(parents=True, exist_ok=True)

    (archive_dir / "stderr.log").write_text(stderr_text, encoding="utf-8")
    (archive_dir / "backtrace.log").write_text(stderr_text, encoding="utf-8")
    (archive_dir / "stdout.log").write_text(stdout_text, encoding="utf-8")

    runtime_params = {
        "timestamp_utc": ts,
        "profile": args.profile,
        "seed": args.seed,
        "recipe": str(args.recipe),
        "lockfile": str(args.lockfile),
        "duration_seconds": args.duration_seconds,
        "command": command,
    }
    (archive_dir / "run_params.json").write_text(
        json.dumps(runtime_params, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    if args.recipe.exists():
        shutil.copy2(args.recipe, archive_dir / "recipe.json")
    if args.lockfile.exists():
        shutil.copy2(args.lockfile, archive_dir / "lockfile.json")

    return archive_dir


def main() -> int:
    args = parse_args()
    thresholds = load_threshold(args.profile, args.threshold_config)
    soak_seconds = args.duration_seconds or PROFILE_TO_SECONDS[args.profile]

    command = [
        "cargo",
        "run",
        "--manifest-path",
        str(CARGO_MANIFEST),
        "--bin",
        "soak_runner",
        "--",
        "--duration-seconds",
        str(soak_seconds),
        "--seed",
        str(args.seed),
    ]

    started = time.time()
    proc = subprocess.Popen(
        command,
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env={**os.environ, "RUST_BACKTRACE": "1"},
    )

    max_rss_mb = 0.0
    while proc.poll() is None:
        max_rss_mb = max(max_rss_mb, read_rss_mb(proc.pid))
        time.sleep(1)

    stdout_text, stderr_text = proc.communicate()
    max_rss_mb = max(max_rss_mb, read_rss_mb(proc.pid))

    duration = round(time.time() - started, 3)
    runtime_summary = None
    for line in reversed(stdout_text.splitlines()):
        line = line.strip()
        if not line:
            continue
        try:
            runtime_summary = json.loads(line)
            break
        except json.JSONDecodeError:
            continue

    if runtime_summary is None:
        runtime_summary = {"tick_total": 0, "error_count": 1, "duration": duration}

    error_count = int(runtime_summary.get("error_count", 0))
    over_rss = max_rss_mb > thresholds["max_rss_mb"]
    over_error = error_count > thresholds["max_error_count"]
    passed = proc.returncode == 0 and (not over_rss) and (not over_error)

    summary = {
        "duration": float(runtime_summary.get("duration", duration)),
        "tick_total": int(runtime_summary.get("tick_total", 0)),
        "error_count": error_count,
        "max_rss_mb": round(max_rss_mb, 2),
        "profile": args.profile,
        "passed": passed,
    }

    if not passed:
        archive_dir = archive_failure(
            stderr_text=stderr_text,
            stdout_text=stdout_text,
            args=args,
            command=command,
        )
        summary["archive_dir"] = str(archive_dir.relative_to(ROOT))

    print(json.dumps(summary, ensure_ascii=False))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
