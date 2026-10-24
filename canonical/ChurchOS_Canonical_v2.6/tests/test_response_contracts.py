import unittest,yaml
from pathlib import Path
from jsonschema import Draft202012Validator,FormatChecker
ROOT=Path(__file__).resolve().parents[1]
class ResponseContracts(unittest.TestCase):
 def test_closed_responses_accept_read_fields_and_reject_extras(self):
  api=yaml.safe_load((ROOT/'api/openapi/church-os-v1.yaml').read_text())
  uuid='10000000-0000-0000-0000-000000000001';ts='2026-10-24T00:00:00Z'
  samples={'Membership':{'id':uuid,'tenantId':uuid,'personRef':uuid,'status':'ACTIVE','createdAt':ts},'Event':{'id':uuid,'tenantId':uuid,'kind':'WORSHIP','title':'Sunday','startsAt':ts,'timezone':'Asia/Seoul','status':'PUBLISHED'},'Notice':{'id':uuid,'tenantId':uuid,'title':'Notice','body':'Church event','audience':'ALL_MEMBERS','publishAt':ts,'status':'PUBLISHED'}}
  for name,row in samples.items():
   with self.subTest(name=name):
    v=Draft202012Validator({'$ref':'#/components/schemas/'+name,'components':api['components']},format_checker=FormatChecker());self.assertEqual([],list(v.iter_errors(row)));self.assertTrue(list(v.iter_errors({**row,'privateDiary':'forbidden'})))
