import csv
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "validation"))
from validate_duplicate_copies import REGISTER, validate  # noqa: E402

HEADER = ["id", "group", "source_of_truth", "copy_path", "relation", "note"]


class DuplicateCopyTests(unittest.TestCase):
    def make(self, files: dict[str, str], rows: list[list[str]]) -> Path:
        root = Path(tempfile.mkdtemp())
        for rel, text in files.items():
            (root / rel).parent.mkdir(parents=True, exist_ok=True)
            (root / rel).write_text(text, encoding="utf-8")
        (root / REGISTER).parent.mkdir(parents=True, exist_ok=True)
        with (root / REGISTER).open("w", newline="", encoding="utf-8") as fh:
            writer = csv.writer(fh)
            writer.writerow(HEADER)
            writer.writerows(rows)
        return root

    def run_on(self, root: Path) -> list[dict]:
        files = [str(p.relative_to(root)) for p in root.rglob("*") if p.is_file()]
        return validate(root, files)["errors"]

    def test_repository_register_passes(self):
        self.assertEqual(validate(ROOT)["errors"], [])

    def test_identical_copy_passes(self):
        root = self.make({"a/x.sql": "1", "b/x.sql": "1"},
                         [["D1", "g", "a/x.sql", "b/x.sql", "IDENTICAL", ""]])
        self.assertEqual(self.run_on(root), [])

    def test_diverged_identical_copy_fails(self):
        root = self.make({"a/x.sql": "1", "b/x.sql": "2"},
                         [["D1", "g", "a/x.sql", "b/x.sql", "IDENTICAL", ""]])
        self.assertIn("copy diverged from source", [e["error"] for e in self.run_on(root)])

    def test_stale_copy_that_matches_fails(self):
        root = self.make({"a/x.json": "1", "b/x.json": "1"},
                         [["D1", "g", "a/x.json", "b/x.json", "STALE", ""]])
        self.assertIn("STALE copy now identical; update register", [e["error"] for e in self.run_on(root)])

    def test_unregistered_copy_fails(self):
        root = self.make({"a/x.sql": "same", "c/y.sql": "same"}, [])
        self.assertIn("unregistered identical copies", [e["error"] for e in self.run_on(root)])

    def test_missing_file_and_bad_relation_fail(self):
        root = self.make({"a/x.sql": "1"},
                         [["D1", "g", "a/x.sql", "b/x.sql", "IDENTICAL", ""],
                          ["D2", "g", "a/x.sql", "a/x.sql", "COPY", ""]])
        errors = [e["error"] for e in self.run_on(root)]
        self.assertIn("missing file", errors)
        self.assertIn("unknown relation 'COPY'", errors)


if __name__ == "__main__":
    unittest.main()
