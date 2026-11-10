"""Failure-focused checks for the documentation validator."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

p = Path(__file__).resolve().parents[2] / "tools/validation/validate_design_docs.py"
spec = importlib.util.spec_from_file_location("design_validator", p)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class DocumentationValidation(unittest.TestCase):
    def run_files(self, files):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            for name, text in files.items():
                target = root / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(text)
            return module.validate(root, [Path(x) for x in files])

    def test_missing_target_rejected(self):
        r = self.run_files({"a.md": "[target](missing.md)"})
        self.assertEqual(r["status"], "FAIL")

    def test_anchor_typo_rejected(self):
        r = self.run_files({"a.md": "# 소개\n\n[bad](#다른-소개)"})
        self.assertIn("missing anchor", r["errors"][0]["error"])

    def test_unicode_duplicate_headings_and_reference_link(self):
        r = self.run_files({"a.md": "# 교회 소개\n# 교회 소개\n\n[보기][intro]\n\n[intro]: #교회-소개-1"})
        self.assertEqual((r["status"], r["anchor_links"]), ("PASS", 1))

    def test_code_examples_not_scanned_as_links(self):
        r = self.run_files({"a.md": "```md\n[example](missing.md)\n```\n"})
        self.assertEqual((r["status"], r["internal_links"]), ("PASS", 0))

    def test_percent_encoded_filename(self):
        r = self.run_files({"a.md": "[한글](교회%20소개.md)", "교회 소개.md": "# 제목"})
        self.assertEqual(r["status"], "PASS")

    def test_path_traversal_rejected(self):
        r = self.run_files({"a.md": "[outside](../outside.md)"})
        self.assertIn("outside repository", r["errors"][0]["error"])

    def test_csv_blank_rows_valid_but_wrong_width_rejected(self):
        good = self.run_files({"a.csv": "id,status\na,PASS\n\n"})
        bad = self.run_files({"a.csv": "id,status\na,PASS,extra\n"})
        self.assertEqual((good["status"], bad["status"]), ("PASS", "FAIL"))

    def test_duplicate_json_keys_rejected(self):
        r = self.run_files({"a.json": '{"status":"PASS","status":"FAIL"}'})
        self.assertEqual(r["status"], "FAIL")

    def test_decision_sequence_gap_rejected(self):
        r = self.run_files({"docs/decisions/DESIGN_DECISIONS.md":
                            "## COS-CHURCH-001\n## COS-CHURCH-003\n## COS-JOIN-001\n## COS-SSO-001\n"})
        self.assertTrue(any("sequence gap" in e["error"] for e in r["errors"]))

    def test_handoff_mismatch_rejected(self):
        r = self.run_files({
            "recovery-design/BASIC_MVP_HANDOFF.csv":
            "id,screen,action,authority,data_owner_record,failure_recovery,acceptance,blockers\n"
            "MVP01,login,read,auth,account,retry,deny,B01\n",
            "recovery-design/BASIC_MVP_DEVELOPMENT_HANDOFF.md": "# table not synchronized"})
        self.assertTrue(any("CSV/table mismatch" in e["error"] for e in r["errors"]))

    def test_explicit_html_anchor(self):
        r = self.run_files({"a.md": '<a id="intro"></a>\n\n[go](#intro)'})
        self.assertEqual(r["status"], "PASS")

    def test_external_links_are_not_fetched(self):
        r = self.run_files({"a.md": "[external](https://invalid.example/missing)"})
        self.assertEqual((r["status"], r["external_links_skipped"]), ("PASS", 1))

    def test_non_json_number_rejected(self):
        self.assertEqual(self.run_files({"a.json": '{"value": NaN}'})["status"], "FAIL")

    def test_corrupt_docx_rejected(self):
        self.assertEqual(self.run_files({"a.docx": "not a zip"})["status"], "FAIL")

    def test_recovery_duplicate_id_rejected(self):
        r = self.run_files({"recovery-design/RECOVERY_DECISIONS.md":
                            "| REC-001 | a |\n| REC-001 | b |\n"})
        self.assertTrue(any("REC sequence" in e["error"] for e in r["errors"]))


if __name__ == "__main__":
    unittest.main()
