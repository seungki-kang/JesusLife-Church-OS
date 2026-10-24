"""Read-only structural gate. Does not certify API or database runtime."""
from pathlib import Path
import csv, hashlib, json, sys
import yaml
from jsonschema import Draft202012Validator, FormatChecker
ROOT=Path(__file__).resolve().parents[1]
PROVIDERS={'NEORANG_NARANG','LIFE_DIARY','JLPRAYER','JLBIBLE','JLACADEMY','CHGO'}
def validate(root=ROOT):
 errors=[]
 def need(ok,label):
  if not ok: errors.append(label)
 try:
  manifest=root/'MANIFEST.sha256'
  lines=manifest.read_text().splitlines(); listed={}
  for line in lines:
   digest,rel=line.split('  ',1);p=root/rel
   need(p.resolve().is_relative_to(root.resolve()),'manifest traversal')
   listed[rel]=digest
   need(p.is_file() and hashlib.sha256(p.read_bytes()).hexdigest()==digest,'hash:'+rel)
  actual={str(p.relative_to(root)) for p in root.rglob('*') if p.is_file() and p.name!='MANIFEST.sha256' and not any(x in p.parts for x in ['__pycache__','node_modules','dist'])}
  need(actual==set(listed),'manifest exact coverage')
  required=['README.md','governance/CANONICAL.md','contracts/integrations.yaml','api/openapi/church-os-v1.yaml','db/migrations/V013__independent_product_academy.sql','db/migrations/V014__create_command_receipts.sql','db/migrations/V015__lifecycle_receipt_versions.sql','VALIDATION.json']
  need(all((root/p).is_file() for p in required),'required files')
  products=yaml.safe_load((root/'contracts/integrations.yaml').read_text())['products']
  need(set(products)==PROVIDERS,'six providers')
  need(all(v['independent'] and not v['shared_database'] for v in products.values()),'independent ownership')
  api=yaml.safe_load((root/'api/openapi/church-os-v1.yaml').read_text())
  need(api['openapi']=='3.1.0','openapi version')
  ops=[op for item in api['paths'].values() for method,op in item.items() if method in {'get','post','put','patch','delete'}]
  ids=[x.get('operationId') for x in ops]
  need(None not in ids and len(ids)==len(set(ids)),'operation ids')
  need(bool(api.get('security')) and all(x.get('security',api['security']) for x in ops),'authentication')
  need(all(s['url'].endswith('/api/v1/church') for s in api['servers']) and all(path.startswith('/') and not any(x in path.lower() for x in ['vault','reasoning','diary-raw']) for path in api['paths']),'church-only paths')
  def refs(x):
   if isinstance(x,dict):
    if '$ref' in x and x['$ref'].startswith('#/'):
     node=api
     try:
      for token in x['$ref'][2:].split('/'):node=node[token.replace('~1','/').replace('~0','~')]
     except (KeyError,TypeError):errors.append('unresolved ref:'+x['$ref'])
    for v in x.values():refs(v)
   elif isinstance(x,list):
    for v in x:refs(v)
  refs(api)
  need(set(api['components']['schemas']['Provider']['enum'])==PROVIDERS,'API providers')
  brand=json.loads((root/'white-label/brand-config.schema.json').read_text())
  need(brand['properties']['distribution']['properties']['mode']['enum']==['INSTANT','DEDICATED_NATIVE'],'app distributions')
  for p in list((root/'events/schemas').glob('*.json'))+[root/'white-label/brand-config.schema.json']:
   Draft202012Validator.check_schema(json.loads(p.read_text()))
  for p in (root/'white-label/examples').glob('*.json'):
   Draft202012Validator(brand,format_checker=FormatChecker()).validate(json.loads(p.read_text()))
  with (root/'db/migration_hashes.csv').open() as f:rows=list(csv.DictReader(f))
  need(len(rows)==15,'15 migrations required')
  for row in rows:
   p=root/'db/migrations'/row['file'];need(p.exists() and hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256'],'migration checksum:'+row['file'])
  for p in (root/'db/migrations').glob('*.sql'):
   t=p.read_text().strip().lower();need(t.startswith('begin;') and t.endswith('commit;'),'transaction:'+p.name)
  with (root/'ux/01_화면명세.csv').open() as f:screens=list(csv.DictReader(f))
  need(len(screens)==27 and all(x['client']=='church-app' for x in screens),'27 app screens')
 except Exception as e:errors.append(type(e).__name__+': '+str(e))
 return errors
if __name__=='__main__':
 errors=validate();print(json.dumps({'static_validation':'FAIL' if errors else 'PASS','errors':errors,'runtime':'NOT_RUN'},ensure_ascii=False,indent=2));sys.exit(bool(errors))
