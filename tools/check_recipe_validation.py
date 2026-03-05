#!/usr/bin/env python3
"""发布门禁：读取配方校验 JSON，Error 阻断，Warning 放行并统计。"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def summarize(report: dict[str, Any]) -> tuple[int, int, int]:
    entries = report.get("entries", [])
    total_errors = 0
    total_warnings = 0
    suppressed = 0

    for entry in entries:
        for issue in entry.get("issues", []):
            if issue.get("suppressed"):
                suppressed += 1
                continue
            level = issue.get("level")
            if level == "Error":
                total_errors += 1
            elif level == "Warning":
                total_warnings += 1

    return total_errors, total_warnings, suppressed


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", type=Path, required=True, help="runBatchValidate 输出 JSON 文件")
    args = parser.parse_args()

    report = load_json(args.report.resolve())
    errors, warnings, suppressed = summarize(report)

    print(f"[RecipeValidation] errors={errors} warnings={warnings} suppressed={suppressed}")
    if errors > 0:
        print("[RecipeValidation][ERROR] 存在 Error 级别问题，阻断发布。")
        return 1

    if warnings > 0:
        print("[RecipeValidation][WARNING] 仅存在 Warning，允许放行。")
    else:
        print("[RecipeValidation] 未发现 Error/Warning，允许放行。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
