#!/usr/bin/env python3
"""Workflow 模板静态校验：节点类型、边端点、模板可实例化。"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EDITOR_APP = ROOT / "editor" / "app"
DOOR_DOMAIN = EDITOR_APP / "src" / "domain" / "door.ts"


def run(cmd: list[str], cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, cwd=cwd, check=True, text=True, capture_output=True)


def collect_brick_types() -> set[str]:
    content = DOOR_DOMAIN.read_text(encoding="utf-8")
    matches = re.findall(r"export const \w+BrickDefinition: BrickDefinition = \{\s*id: \"([^\"]+)\"", content)
    return set(matches)


def collect_templates() -> dict:
    run(["pnpm", "run", "build"], cwd=EDITOR_APP)
    script = """
import { listWorkflowTemplates, assembleWorkflowTemplate } from './dist/workflow/templates.js';
const templates = listWorkflowTemplates();
const instantiated = templates.map((tpl) => ({ id: tpl.id, graph: assembleWorkflowTemplate(tpl.id) }));
console.log(JSON.stringify({ templates, instantiated }));
"""
    result = run(["node", "--input-type=module", "-e", script], cwd=EDITOR_APP)
    return json.loads(result.stdout)


def validate(data: dict, brick_types: set[str]) -> list[str]:
    errors: list[str] = []
    templates = data.get("templates", [])
    builtin_types = {"sensor.entry", "alarm"}

    for template in templates:
        node_ids = {node["id"] for node in template.get("nodes", [])}
        for node in template.get("nodes", []):
            node_type = node.get("type")
            if node_type not in brick_types and node_type not in builtin_types:
                errors.append(f"UNKNOWN_NODE_TYPE template={template.get('id')} node={node.get('id')} type={node_type}")
        for edge in template.get("edges", []):
            if edge.get("from") not in node_ids:
                errors.append(f"EDGE_FROM_NOT_FOUND template={template.get('id')} from={edge.get('from')}")
            if edge.get("to") not in node_ids:
                errors.append(f"EDGE_TO_NOT_FOUND template={template.get('id')} to={edge.get('to')}")

    for item in data.get("instantiated", []):
        graph = item.get("graph", {})
        if not isinstance(graph.get("nodes"), list) or not isinstance(graph.get("edges"), list):
            errors.append(f"INSTANTIATION_FAILED template={item.get('id')}")

    return errors


def main() -> int:
    brick_types = collect_brick_types()
    try:
        data = collect_templates()
    except subprocess.CalledProcessError as exc:
        print(exc.stdout)
        print(exc.stderr)
        print(f"[ERROR] command failed: {' '.join(exc.cmd)}")
        return 1

    errors = validate(data, brick_types)
    if errors:
        print("[ERROR] workflow template check failed")
        for err in errors:
            print(f"  - {err}")
        return 1

    print("[OK] workflow template check passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
