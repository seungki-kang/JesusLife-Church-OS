import importlib.util, tempfile, shutil, unittest, hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('gate',ROOT/'tools/validate.py');gate=importlib.util.module_from_spec(spec);spec.loader.exec_module(gate)
class GateTests(unittest.TestCase):
 def test_valid_package(self):self.assertEqual([],gate.validate())
 def mutation(self,change):
  with tempfile.TemporaryDirectory() as d:
   r=Path(d)/'copy';shutil.copytree(ROOT,r,ignore=shutil.ignore_patterns('__pycache__','node_modules','dist'));change(r);self.assertTrue(gate.validate(r))
 def test_missing_file(self):self.mutation(lambda r:(r/'contracts/integrations.yaml').unlink())
 def test_tampered_api(self):self.mutation(lambda r:(r/'api/openapi/church-os-v1.yaml').write_text('paths: {}'))
 def test_unlisted_file(self):self.mutation(lambda r:(r/'unexpected.txt').write_text('extra'))
 def test_missing_migration(self):self.mutation(lambda r:(r/'db/migrations/V013__independent_product_academy.sql').unlink())
 def test_incomplete_manifest(self):self.mutation(lambda r:(r/'MANIFEST.sha256').write_text(''))
if __name__=='__main__':unittest.main()
