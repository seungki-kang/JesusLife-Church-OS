#!/usr/bin/env python3
"""Expand YAML merge keys and model X-Purpose-Code as a normal required header."""
from copy import deepcopy
from pathlib import Path
import yaml

path = Path(__file__).resolve().parents[1] / "api/openapi/church-os-v1.yaml"
document = yaml.safe_load(path.read_text(encoding="utf-8"))
document.pop("x-common-errors", None)
document["security"] = [{"churchOidc": []}]
document["components"]["securitySchemes"].pop("purposeCode", None)
document["components"]["parameters"]["PurposeCode"] = {
    "name": "X-Purpose-Code", "in": "header", "required": True,
    "description": "Authorized processing purpose, validated and written to audit context.",
    "schema": {"type": "string", "pattern": "^[A-Z][A-Z0-9_]{2,63}$"},
}
for item in document["paths"].values():
    for method, operation in item.items():
        if method not in {"get", "post", "put", "patch", "delete"}: continue
        parameters = operation.setdefault("parameters", [])
        ref = {"$ref": "#/components/parameters/PurposeCode"}
        if ref not in parameters: parameters.insert(0, ref)
        operation["responses"] = deepcopy(operation["responses"])

class NoAliasDumper(yaml.SafeDumper):
    def ignore_aliases(self, data): return True

path.write_text(yaml.dump(document, Dumper=NoAliasDumper, allow_unicode=True,
                          sort_keys=False, width=120), encoding="utf-8")
