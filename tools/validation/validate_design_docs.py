"""Read-only documentation checks; no network, DB or application execution."""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
import re
import subprocess
import unicodedata
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET
import zipfile

from markdown_it import MarkdownIt


def slug(text: str) -> str:
    text = re.sub(r"<[^>]*>", "", text).lower()
    return "".join(c for c in text if c in "-_ " or unicodedata.category(c)[0] not in "PS").replace(" ", "-")


def json_pairs(items):
    if len(dict(items)) != len(items):
        raise ValueError("duplicate JSON key")
    return dict(items)


def validate(root: Path, files: list[Path]) -> dict:
    root = root.resolve()
    result = dict(markdown_files=0, internal_links=0, anchor_links=0,
                  external_links_skipped=0, csv_files=0, json_files=0,
                  docx_files=0, decision_groups={}, errors=[])
    parsed, anchors = {}, {}
    parser = MarkdownIt("commonmark")

    def error(rel, message):
        result["errors"].append(dict(file=str(rel), error=message))

    for rel in sorted(set(files)):
        p = root / rel
        try:
            if rel.suffix == ".md":
                tokens = parser.parse(p.read_text(encoding="utf-8"))
                parsed[rel] = tokens
                ids, counts = set(), {}
                for i, token in enumerate(tokens):
                    if token.type == "heading_open":
                        text = "".join(c.content for c in (tokens[i + 1].children or [])
                                       if c.type in ("text", "code_inline", "html_inline"))
                        key = slug(text)
                        number = counts.get(key, 0)
                        counts[key] = number + 1
                        ids.add(key + (f"-{number}" if number else ""))
                    if token.type in ("html_block", "inline"):
                        ids.update(re.findall(r'(?:id|name)=["\x27]([^"\x27]+)["\x27]', token.content))
                anchors[rel] = ids
                result["markdown_files"] += 1
            elif rel.suffix == ".csv":
                result["csv_files"] += 1
                with p.open(encoding="utf-8-sig", newline="") as f:
                    rows = list(csv.reader(f))
                if not rows or not rows[0]:
                    raise ValueError("empty CSV/header")
                if len(set(rows[0])) != len(rows[0]):
                    error(rel, "duplicate CSV header")
                for number, row in enumerate(rows[1:], 2):
                    # Blank physical rows are valid; a row containing empty cells is checked.
                    if row and len(row) != len(rows[0]):
                        error(rel, f"CSV row {number}: {len(row)} columns; expected {len(rows[0])}")
            elif rel.suffix == ".json":
                result["json_files"] += 1
                json.loads(p.read_text(encoding="utf-8"), object_pairs_hook=json_pairs,
                           parse_constant=lambda value: (_ for _ in ()).throw(ValueError("non-JSON number: " + value)))
            elif rel.suffix == ".docx":
                result["docx_files"] += 1
                with zipfile.ZipFile(p) as archive:
                    if archive.testzip():
                        raise ValueError("DOCX CRC mismatch")
                    ET.fromstring(archive.read("word/document.xml"))
        except (OSError, ValueError, ET.ParseError, zipfile.BadZipFile, KeyError) as exc:
            error(rel, f"{type(exc).__name__}: {exc}")

    for rel, tokens in parsed.items():
        for token in tokens:
            for child in token.children or []:
                if child.type not in ("link_open", "image"):
                    continue
                href = child.attrGet("href" if child.type == "link_open" else "src")
                uri = urlsplit(href)
                if uri.scheme or uri.netloc:
                    result["external_links_skipped"] += 1
                    continue
                result["internal_links"] += 1
                path = unquote(uri.path)
                target = (root / path.lstrip("/") if path.startswith("/") else
                          (root / rel).parent / path if path else root / rel)
                try:
                    target_rel = target.resolve().relative_to(root)
                except ValueError:
                    error(rel, "link outside repository: " + href)
                    continue
                if not target.exists():
                    error(rel, "missing link: " + href)
                elif uri.fragment and target_rel in anchors:
                    result["anchor_links"] += 1
                    if unquote(uri.fragment) not in anchors[target_rel]:
                        error(rel, "missing anchor: " + href)

    decisions = root / "docs/decisions/DESIGN_DECISIONS.md"
    if decisions.is_file():
        text = decisions.read_text()
        for prefix in ("COS-CHURCH", "COS-JOIN", "COS-SSO"):
            numbers = [int(x) for x in re.findall(r"^## " + prefix + r"-(\d+)\s*$", text, re.M)]
            result["decision_groups"][prefix] = len(numbers)
            if not numbers or numbers != list(range(1, max(numbers) + 1)):
                error(decisions.relative_to(root), prefix + " sequence gap/duplicate")
    recovery = root / "recovery-design/RECOVERY_DECISIONS.md"
    if recovery.is_file():
        text = recovery.read_text()
        table = [int(x) for x in re.findall(r"^\| REC-(\d+) \|", text, re.M)]
        headings = [int(x) for x in re.findall(r"^## REC-(\d+)", text, re.M)]
        numbers = sorted(set(table + headings))
        result["decision_groups"]["REC"] = len(numbers)
        if (not numbers or numbers != list(range(1, max(numbers) + 1))
                or len(table) != len(set(table)) or len(headings) != len(set(headings))):
            error(recovery.relative_to(root), "REC sequence gap/duplicate")

    handoff = root / "recovery-design/BASIC_MVP_HANDOFF.csv"
    rendered = root / "recovery-design/BASIC_MVP_DEVELOPMENT_HANDOFF.md"
    if handoff.is_file() and rendered.is_file():
        with handoff.open(newline="") as f:
            rows = list(csv.DictReader(f))
        ids = [row.get("id", "") for row in rows]
        if ids != [f"MVP{i:02d}" for i in range(1, len(rows) + 1)]:
            error(handoff.relative_to(root), "MVP sequence gap/duplicate")
        table = rendered.read_text()
        keys = ("action", "authority", "data_owner_record", "failure_recovery", "acceptance", "blockers")
        for row in rows:
            if any(not isinstance(row.get(key), str) for key in ("id", "screen", *keys)):
                error(handoff.relative_to(root), "malformed handoff row")
                continue
            expected = "| " + " | ".join([row["id"] + " " + row["screen"], *(row[k] for k in keys)]) + " |"
            if table.count(expected) != 1:
                error(rendered.relative_to(root), "CSV/table mismatch: " + row["id"])
    for name, required in (
        ("DOMAIN_OWNERSHIP.csv", {"id", "record_family", "owner_module", "source_product", "write_entry", "read_boundary", "design_status"}),
        ("DEVELOPMENT_SLICES.csv", {"id", "slice", "depends_on", "entry_gates", "completion_evidence", "not_allowed", "execution_status"}),
    ):
        rel = Path("docs/development") / name
        if not (root / rel).is_file():
            continue
        with (root / rel).open(encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            if set(reader.fieldnames or []) != required:
                error(rel, "development CSV schema mismatch")
                continue
        if not rows or any(any(row.get(k) is None or not row[k].strip()
                                   for k in required - {"depends_on"}) for row in rows):
            error(rel, "empty development row/required cell")
            continue
        ids = [row["id"] for row in rows]
        if len(ids) != len(set(ids)):
            error(rel, "duplicate development ID")
        if name == "DOMAIN_OWNERSHIP.csv":
            families = [row["record_family"] for row in rows]
            if len(families) != len(set(families)):
                error(rel, "duplicate record ownership")
        else:
            graph = {row["id"]: [x.strip() for x in row["depends_on"].split(";") if x.strip()]
                     for row in rows}
            unknown = {dep for deps in graph.values() for dep in deps if dep not in graph}
            if unknown:
                error(rel, "unknown dependency: " + ", ".join(sorted(unknown)))
            visiting, visited = set(), set()

            def visit(node):
                if node in visiting:
                    return False
                if node in visited:
                    return True
                visiting.add(node)
                for dep in graph[node]:
                    if dep in graph and not visit(dep):
                        return False
                visiting.remove(node)
                visited.add(node)
                return True

            if any(not visit(node) for node in graph):
                error(rel, "development dependency cycle")
            if any(row["execution_status"] not in {"NOT_RUN", "PASS", "FAIL", "BLOCKED"} for row in rows):
                error(rel, "invalid execution status")
    result["status"] = "FAIL" if result["errors"] else "PASS"
    result["runtime"] = "NOT_RUN"
    return result


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    args = cli.parse_args()
    raw = subprocess.check_output(
        ["git", "ls-files", "-z", "--cached", "--others", "--exclude-standard"], cwd=args.root)
    files = [Path(x) for x in raw.decode().split("\0") if x]
    result = validate(args.root, files)
    result["limitations"] = [
        "Local Markdown links/heading anchors only; external URLs are counted, not fetched.",
        "DOCX validation checks ZIP integrity and document XML, not prose or visual layout.",
        "Static structure does not certify authorization, theology, legal compliance or runtime.",
    ]
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return int(result["status"] != "PASS")


if __name__ == "__main__":
    raise SystemExit(main())
