"""Closed OpenAPI response schemas accept read fields and reject unknown fields.

Derived from canonical v2.6 tests/test_response_contracts.py; reads the active
service's OpenAPI copy.
"""
import unittest
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[1]


class ResponseContracts(unittest.TestCase):
    def test_closed_responses_accept_read_fields_and_reject_extras(self):
        api = yaml.safe_load((ROOT / "openapi/church-os-v1.yaml").read_text(encoding="utf-8"))
        uuid = "10000000-0000-0000-0000-000000000001"
        ts = "2026-10-24T00:00:00Z"
        samples = {
            "Membership": {"id": uuid, "tenantId": uuid, "personRef": uuid, "status": "ACTIVE", "createdAt": ts},
            "Event": {"id": uuid, "tenantId": uuid, "kind": "WORSHIP", "title": "Sunday", "startsAt": ts,
                      "timezone": "Asia/Seoul", "status": "PUBLISHED"},
            "Notice": {"id": uuid, "tenantId": uuid, "title": "Notice", "body": "Church event",
                       "audience": "ALL_MEMBERS", "publishAt": ts, "status": "PUBLISHED"},
        }
        for name, row in samples.items():
            with self.subTest(name=name):
                validator = Draft202012Validator({"$ref": "#/components/schemas/" + name, "components": api["components"]},
                                                 format_checker=FormatChecker())
                self.assertEqual([], list(validator.iter_errors(row)))
                self.assertTrue(list(validator.iter_errors({**row, "privateDiary": "forbidden"})))


if __name__ == "__main__":
    unittest.main()
