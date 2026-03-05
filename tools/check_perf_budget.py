#!/usr/bin/env python3
"""性能预算检查：读取离线指标并生成 JSON 报告与摘要。"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BUDGET = ROOT / "protocol" / "perf" / "perf_budget.json"
DEFAULT_METRICS = ROOT / "fixtures" / "perf" / "sample_scene_metrics.json"
DEFAULT_REPORT = ROOT / "artifacts" / "perf_budget_report.json"


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def calc_status(value: float, warning: float, error: float, lower_is_better: bool) -> str:
    if lower_is_better:
        if value > error:
            return "error"
        if value > warning:
            return "warning"
    else:
        if value < error:
            return "error"
        if value < warning:
            return "warning"
    return "ok"


def build_report(budget: dict[str, Any], metrics_payload: dict[str, Any]) -> dict[str, Any]:
    budget_metrics = budget.get("metrics", {})
    input_metrics = metrics_payload.get("metrics", {})

    items: list[dict[str, Any]] = []
    status_count = {"ok": 0, "warning": 0, "error": 0, "missing": 0}

    for metric_name, thresholds in budget_metrics.items():
        warning = float(thresholds["warning"])
        error = float(thresholds["error"])
        lower_is_better = bool(thresholds.get("lower_is_better", True))

        value = input_metrics.get(metric_name)
        if value is None:
            status = "missing"
            status_count[status] += 1
            items.append(
                {
                    "metric": metric_name,
                    "status": status,
                    "warning": warning,
                    "error": error,
                    "lower_is_better": lower_is_better,
                    "message": "metric missing in input payload",
                }
            )
            continue

        numeric_value = float(value)
        status = calc_status(numeric_value, warning, error, lower_is_better)
        status_count[status] += 1
        items.append(
            {
                "metric": metric_name,
                "value": numeric_value,
                "status": status,
                "warning": warning,
                "error": error,
                "lower_is_better": lower_is_better,
            }
        )

    summary_status = "ok"
    if status_count["error"] > 0 or status_count["missing"] > 0:
        summary_status = "error"
    elif status_count["warning"] > 0:
        summary_status = "warning"

    return {
        "scene": metrics_payload.get("scene", "<unknown-scene>"),
        "build": metrics_payload.get("build", "<unknown-build>"),
        "budget_profile": budget.get("target_profile", "default"),
        "status": summary_status,
        "status_count": status_count,
        "items": items,
    }


def print_human_summary(report: dict[str, Any]) -> None:
    print(
        f"[PerfBudget] scene={report['scene']} build={report['build']} "
        f"profile={report['budget_profile']} status={report['status']}"
    )
    for item in report["items"]:
        metric = item["metric"]
        status = item["status"].upper()
        value = item.get("value", "<missing>")
        warning = item["warning"]
        error = item["error"]
        print(f" - {metric}: {value} (warning={warning}, error={error}) => {status}")

    if report["status_count"]["warning"] > 0:
        print("[PerfBudget][WARNING] 存在 warning 阈值超标，请在 CI 中打标跟踪。")
    if report["status"] == "error":
        print("[PerfBudget][ERROR] 存在 error 阈值超标或缺失关键指标。")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--budget", type=Path, default=DEFAULT_BUDGET)
    parser.add_argument("--metrics", type=Path, default=DEFAULT_METRICS)
    parser.add_argument("--report-json", type=Path, default=DEFAULT_REPORT)
    args = parser.parse_args()

    budget = load_json(args.budget.resolve())
    metrics_payload = load_json(args.metrics.resolve())
    report = build_report(budget, metrics_payload)

    args.report_json.parent.mkdir(parents=True, exist_ok=True)
    args.report_json.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print_human_summary(report)
    print(f"[PerfBudget] structured report => {args.report_json}")

    if report["status"] == "error":
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
