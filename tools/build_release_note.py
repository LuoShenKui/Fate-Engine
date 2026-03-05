#!/usr/bin/env python3
"""根据模板生成包发布公告。"""

from __future__ import annotations

import argparse
import datetime as dt
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE_PATH = ROOT / "docs" / "releases" / "templates" / "package_release_note.md"


def render_template(template: str, context: dict[str, str]) -> str:
    content = template
    for key, value in context.items():
        content = content.replace(f"{{{{{key}}}}}", value)
    return content


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--package", required=True)
    parser.add_argument("--version", required=True)
    parser.add_argument("--lifecycle-status", required=True)
    parser.add_argument("--release-channel", required=True)
    parser.add_argument("--compat-matrix-ref", required=True)
    parser.add_argument("--date", help="可选，默认 UTC 日期 YYYYMMDD")
    parser.add_argument("--package-dir", required=True, help="包目录名，用于输出文件名")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    date_value = args.date or dt.datetime.utcnow().strftime("%Y%m%d")
    output_rel = Path("docs") / "releases" / f"{date_value}-{args.package_dir}-{args.version}.md"
    output_path = ROOT / output_rel
    output_path.parent.mkdir(parents=True, exist_ok=True)

    template = TEMPLATE_PATH.read_text(encoding="utf-8")
    rendered = render_template(
        template,
        {
            "package": args.package,
            "version": args.version,
            "date": date_value,
            "lifecycle_status": args.lifecycle_status,
            "release_channel": args.release_channel,
            "compat_matrix_ref": args.compat_matrix_ref,
            "package_dir_name": args.package_dir,
        },
    )
    if not args.dry_run:
        output_path.write_text(rendered, encoding="utf-8")
    print(output_rel.as_posix())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
