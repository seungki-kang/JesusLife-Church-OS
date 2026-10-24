import copy, importlib.util, unittest,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('db_verify',ROOT/'tools/db_verify.py');db=importlib.util.module_from_spec(spec);spec.loader.exec_module(db)
class EvidenceTests(unittest.TestCase):
 def fixture(self):
  return {'steps':[{'id':x,'exit_code':0,'status':'PASS'} for x in db.expected_steps()], 'source_fingerprint':'a'*32+'\n1\n23|23','restore_fingerprint':'a'*32+'\n1\n23|23','postgres_version_num':160002,'package_migrations':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((ROOT/'db/migrations').glob('V*.sql'))}}
 def test_complete(self):self.assertTrue(db.assess_evidence(self.fixture()))
 def test_missing_last_test(self):
  e=self.fixture();e['steps'].pop(-2);self.assertFalse(db.assess_evidence(e))
 def test_failure_even_with_pass_label(self):
  e=self.fixture();e['steps'][5]['exit_code']=1;self.assertFalse(db.assess_evidence(e))
 def test_skip(self):
  e=self.fixture();e['steps'][2]['status']='SKIP';self.assertFalse(db.assess_evidence(e))
 def test_duplicate(self):
  e=self.fixture();e['steps'].append(e['steps'][0]);self.assertFalse(db.assess_evidence(e))
 def test_wrong_order(self):
  e=self.fixture();e['steps'][1],e['steps'][2]=e['steps'][2],e['steps'][1];self.assertFalse(db.assess_evidence(e))
 def test_restore_mismatch(self):
  e=self.fixture();e['restore_fingerprint']='different';self.assertFalse(db.assess_evidence(e))
 def test_missing_backup(self):
  e=self.fixture();e['steps']=[x for x in e['steps'] if x['id']!='dump'];self.assertFalse(db.assess_evidence(e))
 def test_wrong_migration_hash(self):
  e=self.fixture();e['package_migrations'][db.MIGRATIONS[0]]='wrong';self.assertFalse(db.assess_evidence(e))
 def test_empty_matching_fingerprints_rejected(self):
  e=self.fixture();e['source_fingerprint']='';e['restore_fingerprint']='';self.assertFalse(db.assess_evidence(e))
 def test_wrong_server_version_rejected(self):
  e=self.fixture();e['postgres_version_num']=170000;self.assertFalse(db.assess_evidence(e))
 def test_empty_backup_rejected(self):
  e=self.fixture();e['source_fingerprint']='a'*32+'\n0\n23|23';e['restore_fingerprint']=e['source_fingerprint'];self.assertFalse(db.assess_evidence(e))
 def test_missing_server_version_rejected(self):
  e=self.fixture();del e['postgres_version_num'];self.assertFalse(db.assess_evidence(e))
 def test_no_environment_never_passes(self):self.assertFalse(db.assess_evidence({'steps':[]}))
if __name__=='__main__':unittest.main()
