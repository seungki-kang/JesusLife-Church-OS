"""Check registered file copies against their source of truth.

Read-only. IDENTICAL copies must keep the same bytes as their source; STALE copies
must still differ (if they become identical, update the register). Every tracked
file outside the allowed exceptions that shares bytes with another tracked file
must be registered, so new unregistered copies are reported.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path
import subprocess

REGISTER = Path("docs/governance/DUPLICATE_COPY_REGISTER.csv")
RELATIONS = {"IDENTICAL", "STALE"}
# Byte-identical files that are expected and not copies of design material:
# generated mobile platform templates and the frozen canonical snapshot.
EXEMPT_PREFIXES = ("apps/church-os/android/", "apps/church-os/ios/", "canonical/")
EXEMPT_SUFFIXES = (".gitkeep", ".png")


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def tracked_files(root: Path) -> list[str]:
    out = subprocess.run(["git", "-C", str(root), "ls-files", "-z"],
                         check=True, capture_output=True).stdout
    return [p for p in out.decode("utf-8").split("\0") if p]


def validate(root: Path, files: list[str] | None = None) -> dict:
    errors: list[dict] = []
    register = root / REGISTER
    with register.open(encoding="utf-8", newline="") as fh:
        rows = list(csv.DictReader(fh))
    ids, pairs = set(), set()
    for row in rows:
        rid = row.get("id", "")
        if rid in ids:
            errors.append(dict(id=rid, error="duplicate id"))
        ids.add(rid)
        relation = row.get("relation")
        if relation not in RELATIONS:
            errors.append(dict(id=rid, error=f"unknown relation {relation!r}"))
            continue
        src, copy = root / row["source_of_truth"], root / row["copy_path"]
        missing = [str(p.relative_to(root)) for p in (src, copy) if not p.is_file()]
        if missing:
            errors.append(dict(id=rid, error="missing file", paths=missing))
            continue
        same = digest(src) == digest(copy)
        if relation == "IDENTICAL" and not same:
            errors.append(dict(id=rid, error="copy diverged from source", copy=row["copy_path"]))
        if relation == "STALE" and same:
            errors.append(dict(id=rid, error="STALE copy now identical; update register", copy=row["copy_path"]))
        pairs.add(frozenset((row["source_of_truth"], row["copy_path"])))

    if files is None:
        files = tracked_files(root)
    groups: dict[str, list[str]] = {}
    for rel in files:
        if rel.startswith(EXEMPT_PREFIXES) or rel.endswith(EXEMPT_SUFFIXES):
            continue
        path = root / rel
        if path.is_file():
            groups.setdefault(digest(path), []).append(rel)
    registered = {p for pair in pairs for p in pair}
    for paths in groups.values():
        if len(paths) > 1 and not all(p in registered for p in paths):
            errors.append(dict(error="unregistered identical copies", paths=sorted(paths)))

    return dict(register=str(REGISTER), entries=len(rows), errors=errors,
                scope="Byte comparison only; it does not decide which copy is authoritative.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    result = validate(parser.parse_args().root.resolve())
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 1 if result["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
