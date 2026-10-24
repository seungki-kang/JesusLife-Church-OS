"""Ephemeral PostgreSQL 16 verification. Requires a dedicated disposable cluster.
Never points migrations at a caller-specified existing database.
"""
import argparse, hashlib, json, os, re, secrets, shutil, subprocess, sys, uuid
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
MIGRATIONS=[p.name for p in sorted((ROOT/'db/migrations').glob('V*.sql'))]
TESTS=[p.name for p in sorted((ROOT/'db/security-tests').glob('*.sql'))]
def expected_steps():
 return ['server-version','bootstrap','create-source']+['migration:'+x for x in MIGRATIONS]+['test:source:'+x for x in TESTS]+['fixture','source-fingerprint','backup-role','dump','create-restore','restore','restore-fingerprint','fingerprint-match']+['test:restore:'+x for x in TESTS]+['cleanup']
def assess_evidence(e):
 expected=expected_steps();steps=e.get('steps',[]);names=[s.get('id') for s in steps]
 return (len(MIGRATIONS)==15 and len(TESTS)==6 and names==expected and
  all(s.get('exit_code')==0 and s.get('status')=='PASS' for s in steps) and
  isinstance(e.get('postgres_version_num'),int) and 160000 <= e['postgres_version_num'] < 170000 and
  isinstance(e.get('source_fingerprint'),str) and re.fullmatch(r'[0-9a-f]{32}\n1\n23\|23',e['source_fingerprint']) is not None and e.get('source_fingerprint')==e.get('restore_fingerprint') and
  e.get('package_migrations')=={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((ROOT/'db/migrations').glob('V*.sql'))})
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--disposable-cluster',action='store_true',help='Only use a dedicated temporary PostgreSQL cluster');parser.add_argument('--output',required=True);args=parser.parse_args()
 evidence={'artifact':'ChurchOS_Canonical_v2.6','runtime':'INCOMPLETE','steps':[], 'package_migrations':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((ROOT/'db/migrations').glob('V*.sql'))}}
 output=Path(args.output);output.parent.mkdir(parents=True,exist_ok=True)
 def save():output.write_text(json.dumps(evidence,indent=2)+'\n')
 if not args.disposable_cluster or any(shutil.which(x) is None for x in ['psql','pg_dump','pg_restore']):
  evidence['reason']='Dedicated disposable cluster and psql/pg_dump/pg_restore are required; no database action performed.';save();return 2
 # Passwords never appear in process arguments or evidence.
 suffix=uuid.uuid4().hex[:12];owner='cos_owner_'+suffix;backup='cos_backup_'+suffix
 source='cos_verify_'+suffix;restored=source+'_restore';password=secrets.token_hex(24)
 admin=dict(os.environ);admin.setdefault('PGDATABASE','postgres');admin.setdefault('PGCONNECT_TIMEOUT','5')
 def env(db,user=None):
  e=dict(admin);e['PGDATABASE']=db
  if user:e.update(PGUSER=user,PGPASSWORD=password)
  return e
 def run(step,cmd,environment,sql=None,required_marker=None):
  result=subprocess.run(cmd,input=sql,text=True,capture_output=True,env=environment)
  ok=result.returncode==0 and (required_marker is None or required_marker in result.stdout)
  evidence['steps'].append({'id':step,'exit_code':result.returncode,'status':'PASS' if ok else 'FAIL','output_sha256':hashlib.sha256(result.stdout.encode()).hexdigest()})
  # Do not write server errors or SQL payloads to logs; command ID identifies the failing stage.
  save()
  if not ok:raise RuntimeError('Failed stage: '+step)
  return result.stdout
 def sql(step,text,environment,marker=None):return run(step,['psql','-X','-qAt','-v','ON_ERROR_STOP=1'],environment,text,marker)
 created_roles=False;dbs=[]
 try:
  version=sql('server-version','show server_version_num;',admin).strip()
  if not version.isdigit() or not 160000<=int(version)<170000:raise RuntimeError('PostgreSQL 16 required')
  evidence['postgres_version_num']=int(version)
  # Fixed group roles are provisioned by admin, never adopted on an application cluster.
  bootstrap=f"""begin; do $$ begin
  if not exists(select from pg_roles where rolname='church_os_app') then create role church_os_app nologin nosuperuser nobypassrls; end if;
  if not exists(select from pg_roles where rolname='church_os_auditor') then create role church_os_auditor nologin nosuperuser nobypassrls; end if;
  end $$;
  create role {owner} login password '{password}' nosuperuser nobypassrls createdb createrole;
  create role {backup} login password '{password}' nosuperuser bypassrls nocreatedb nocreaterole;
  grant church_os_app to {owner} with set true;
  grant pg_read_all_data to {backup}; commit;"""
  sql('bootstrap',bootstrap,admin);created_roles=True
  sql('create-source',f'create database {source} owner {owner};',admin);dbs.append(source)
  for name in MIGRATIONS:run('migration:'+name,['psql','-X','-qAt','-v','ON_ERROR_STOP=1','-f',str(ROOT/'db/migrations'/name)],env(source,owner))
  for name in TESTS:run('test:source:'+name,['psql','-X','-qAt','-v','ON_ERROR_STOP=1','-f',str(ROOT/'db/security-tests'/name)],env(source,owner),required_marker='PASS|')
  fixture="""begin;
  select set_config('church.tenant_id','90000000-0000-0000-0000-000000000009',true);
  select set_config('church.actor_ref','synthetic-backup-check',true);
  insert into church_core.tenant(id,slug,name,status,timezone) values('90000000-0000-0000-0000-000000000009','synthetic-restore-check','Synthetic Church','ACTIVE','Asia/Seoul');
  commit;"""
  sql('fixture',fixture,env(source,owner))
  # Superuser only reads synthetic fixture to confirm the backup did not omit FORCE-RLS data.
  fingerprint="""select md5(coalesce(string_agg(row_to_json(t)::text,'|' order by id),'')) from church_core.tenant t;
  select count(*) from church_core.tenant;
  select count(*),count(*) filter(where c.relrowsecurity and c.relforcerowsecurity)
  from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='r' and n.nspname in ('church_core','church_access','church_integration','church_audit') and c.relname<>'system_role_template';"""
  evidence['source_fingerprint']=sql('source-fingerprint',fingerprint,env(source)).strip()
  sql('backup-role',"select case when not rolsuper and rolbypassrls and pg_has_role(current_user,'pg_read_all_data','MEMBER') then 'BACKUP_OK' else 'UNSAFE' end from pg_roles where rolname=current_user;",env(source,backup),marker='BACKUP_OK')
  dump=output.parent/(source+'.dump')
  run('dump',['pg_dump','-Fc','-f',str(dump)],env(source,backup))
  sql('create-restore',f'create database {restored} owner {owner};',admin);dbs.append(restored)
  # Bootstrap admin restores original ownership/ACL, then all tests run as original non-superuser owner.
  run('restore',['pg_restore','--exit-on-error','--dbname',restored,str(dump)],env(restored))
  evidence['restore_fingerprint']=sql('restore-fingerprint',fingerprint,env(restored)).strip()
  matched=evidence['source_fingerprint']==evidence['restore_fingerprint']
  evidence['steps'].append({'id':'fingerprint-match','exit_code':0 if matched else 1,'status':'PASS' if matched else 'FAIL'})
  if not matched:raise RuntimeError('Restored fixture/schema posture differs')
  for name in TESTS:run('test:restore:'+name,['psql','-X','-qAt','-v','ON_ERROR_STOP=1','-f',str(ROOT/'db/security-tests'/name)],env(restored,owner),required_marker='PASS|')
 except (RuntimeError,OSError) as exc:
  evidence['reason']=str(exc) if isinstance(exc,RuntimeError) else 'Required executable failed'
 finally:
  try:
   for db in reversed(dbs):
    result=subprocess.run(['psql','-X','-qAt','-v','ON_ERROR_STOP=1'],input=f'drop database if exists {db} with (force);',text=True,capture_output=True,env=admin)
    if result.returncode:raise RuntimeError('Temporary DB cleanup failed')
   if created_roles:
    result=subprocess.run(['psql','-X','-qAt','-v','ON_ERROR_STOP=1'],input=f'drop role {backup}; drop role {owner};',text=True,capture_output=True,env=admin)
    if result.returncode:raise RuntimeError('Temporary role cleanup failed')
   evidence['steps'].append({'id':'cleanup','exit_code':0,'status':'PASS'})
  except RuntimeError:
   evidence['steps'].append({'id':'cleanup','exit_code':1,'status':'FAIL'})
  evidence['runtime']='PASS' if assess_evidence(evidence) else 'INCOMPLETE';save()
 print(json.dumps({'runtime':evidence['runtime'],'evidence':str(output)}))
 return 0 if evidence['runtime']=='PASS' else 1
if __name__=='__main__':sys.exit(main())
