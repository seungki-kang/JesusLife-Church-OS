import 'reflect-metadata';
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
import {Pool,Client} from 'pg';
import {generateKeyPair,exportJWK,createLocalJWKSet,SignJWT} from 'jose';
import {buildApp} from '../src/app.js';
import {JwtIdentity} from '../src/identity.js';
import {PgStore} from '../src/postgres.js';
import type {NestFastifyApplication} from '@nestjs/platform-fastify';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../../..');
const output=process.env.API_DB_EVIDENCE;
import {EXPECTED,assess} from './evidence.js';
const report:{[key:string]:any}={artifact:'ChurchOS_Canonical_v2.6',runtime:'INCOMPLETE',started_at:new Date().toISOString(),transport:'HTTP over loopback TCP; real PostgreSQL protocol',oidc:'LOCAL_RSA_TEST_KEYS; EXTERNAL_PROVIDER_NOT_RUN',checks:[],migration_hashes:{}};
async function save(){if(output){await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');}}
async function check(id:string,fn:()=>Promise<void>){try{await fn();report.checks.push({id,status:'PASS'});}catch(error){report.checks.push({id,status:'FAIL'});report.failed_check=id;const code=(error as any)?.code;report.failure_code=typeof code==='string'&&/^[A-Z0-9_]+$/.test(code)?code:'CHECK_FAILED';throw error;}finally{await save();}}
if(process.env.COS_DISPOSABLE_CLUSTER!=='1'||!output){report.reason='COS_DISPOSABLE_CLUSTER=1 and API_DB_EVIDENCE are required';await save();console.error('Integration prerequisites missing; no database action performed.');process.exit(2);}
const suffix=randomBytes(6).toString('hex'),db='cos_api_'+suffix,owner='cos_api_owner_'+suffix,login='cos_api_app_'+suffix,password=randomBytes(24).toString('hex');
const connection={host:process.env.PGHOST??'localhost',port:Number(process.env.PGPORT??5432),user:process.env.PGUSER??'postgres',password:process.env.PGPASSWORD,database:process.env.PGDATABASE??'postgres',connectionTimeoutMillis:5000};
const admin=new Client(connection);let source:Client|undefined,app:NestFastifyApplication|undefined,pool:Pool|undefined,rolesCreated=false,dbCreated=false;
const A='10000000-0000-0000-0000-000000000001',B='20000000-0000-0000-0000-000000000002';
const MA='11000000-0000-0000-0000-000000000001',MB='22000000-0000-0000-0000-000000000002',MEM='13000000-0000-0000-0000-000000000003';
const RA='14000000-0000-0000-0000-000000000004',RB='24000000-0000-0000-0000-000000000004';
const issuer='https://integration-issuer.example.invalid',audience='churchos-api';
try{
 await admin.connect();
 await check('postgres16',async()=>{const r=await admin.query('show server_version_num');report.postgres_version_num=Number(r.rows[0].server_version_num);assert.ok(report.postgres_version_num>=160000&&report.postgres_version_num<170000);});
 await check('bootstrap',async()=>{
  await admin.query(`begin; do $$ begin
   if not exists(select from pg_roles where rolname='church_os_app') then create role church_os_app nologin nosuperuser nobypassrls; end if;
   if not exists(select from pg_roles where rolname='church_os_auditor') then create role church_os_auditor nologin nosuperuser nobypassrls; end if;
  end $$;
  create role ${owner} login password '${password}' nosuperuser nobypassrls createrole;
  create role ${login} login password '${password}' nosuperuser nobypassrls nocreaterole nocreatedb inherit;
  grant church_os_app to ${owner} with set true;
  grant church_os_app to ${login}; commit;`);rolesCreated=true;
  await admin.query(`create database ${db} owner ${owner}`);dbCreated=true;
 });
 await check('migrate15',async()=>{
  const migrator=new Client({...connection,database:db,user:owner,password});await migrator.connect();
  try{const files=(await readdir(resolve(root,'db/migrations'))).filter(n=>/^V\d+.*\.sql$/.test(n)).sort();assert.equal(files.length,15);
   for(const name of files){const sql=await readFile(resolve(root,'db/migrations',name),'utf8');report.migration_hashes[name]=createHash('sha256').update(sql).digest('hex');await migrator.query(sql);}
  }finally{await migrator.end();}
 });
 source=new Client({...connection,database:db});await source.connect();
 await check('seed',async()=>{
  await source!.query(`insert into church_core.tenant(id,slug,name,status,timezone) values($1,'integration-a','Church A','ACTIVE','Asia/Seoul'),($2,'integration-b','Church B','ACTIVE','Asia/Seoul')`,[A,B]);
  for(const [tenant,member,subject] of [[A,MA,'admin-a'],[B,MB,'admin-b'],[A,MEM,'member-a']]){
   await source!.query(`insert into church_core.membership(tenant_id,id,person_ref,status) values($1,$2,$2,'ACTIVE')`,[tenant,member]);
   await source!.query(`insert into church_access.external_subject_binding(tenant_id,membership_id,issuer,subject_ref,status) values($1,$2,$3,$4,'ACTIVE')`,[tenant,member,issuer,subject]);
  }
  for(const [tenant,role,member] of [[A,RA,MA],[B,RB,MB]]){
   await source!.query(`insert into church_access.tenant_role(tenant_id,id,code) values($1,$2,'TENANT_ADMIN')`,[tenant,role]);
   await source!.query(`insert into church_access.membership_role(tenant_id,membership_id,role_id) values($1,$2,$3)`,[tenant,member,role]);
   for(const aud of ['ALL_MEMBERS','LEADERS','STAFF'])await source!.query(`insert into church_core.notice(tenant_id,title,body,audience,status,publish_at) values($1,$2,'Synthetic notice',$3,'PUBLISHED',now()-interval '1 hour')`,[tenant,'notice-'+aud,aud]);
   await source!.query(`insert into church_core.notice(tenant_id,title,body,audience,status,publish_at) values($1,'draft-hidden','Synthetic','ALL_MEMBERS','DRAFT',now()),($1,'future-hidden','Synthetic','ALL_MEMBERS','PUBLISHED',now()+interval '1 day')`,[tenant]);
   await source!.query(`insert into church_core.church_event(tenant_id,kind,title,starts_at,timezone,status) values($1,'WORSHIP','public-event','2026-11-01T00:00:00Z','Asia/Seoul','PUBLISHED'),($1,'WORSHIP','draft-event','2026-11-01T00:00:00Z','Asia/Seoul','DRAFT')`,[tenant]);
  }
  const group=await source!.query(`insert into church_core.community(tenant_id,kind,name,status) values($1,'GROUP','Restricted Group','ACTIVE') returning id`,[A]);
  await source!.query(`insert into church_core.church_event(tenant_id,community_id,kind,title,starts_at,timezone,status) values($1,$2,'GATHERING','restricted-event',now(),'Asia/Seoul','PUBLISHED')`,[A,group.rows[0].id]);
 });
 pool=new Pool({...connection,database:db,user:login,password,max:2});
 const store=new PgStore(pool);
 await check('runtime-role-safe',async()=>{assert.equal(await store.ready(),true);const r=await pool!.query(`select rolsuper,rolbypassrls from pg_roles where rolname=current_user`);assert.deepEqual(r.rows[0],{rolsuper:false,rolbypassrls:false});});
 const key=await generateKeyPair('RS256');const jwk=await exportJWK(key.publicKey);jwk.kid='integration';
 const identity=new JwtIdentity(createLocalJWKSet({keys:[jwk]}),issuer,audience);
 const token=async(sub:string)=>new SignJWT({roles:['TENANT_ADMIN'],tenant:B}).setProtectedHeader({alg:'RS256',kid:'integration'}).setSubject(sub).setIssuer(issuer).setAudience(audience).setIssuedAt().setExpirationTime('5m').sign(key.privateKey);
 const ta=await token('admin-a'),tb=await token('admin-b'),tm=await token('member-a');
 let base='';
 await check('listen',async()=>{app=await buildApp(identity,store,{record:()=>{}});await app.listen(0,'127.0.0.1');base=await app.getUrl();});
 async function request(path:string,t=ta,tenant=A){const res=await fetch(base+'/api/v1/church/'+path,{headers:{Authorization:'Bearer '+t,'X-Church-Tenant':tenant,'X-Purpose-Code':'CHURCH_OPERATION'}});return {status:res.status,body:await res.json() as any};}
 await check('tenant-a-own-data',async()=>{const r=await request('memberships');assert.equal(r.status,200);assert.equal(r.body.items.length,2);assert.ok(r.body.items.every((x:any)=>x.tenantId===A));});
 await check('tenant-b-own-data',async()=>{const r=await request('memberships',tb,B);assert.equal(r.status,200);assert.equal(r.body.items.length,1);assert.ok(r.body.items.every((x:any)=>x.tenantId===B));});
 await check('cross-tenant-denied',async()=>{assert.equal((await request('memberships',ta,B)).status,403);assert.equal((await request('tenants/'+B,ta,B)).status,403);});
 await check('member-cannot-list-memberships',async()=>assert.equal((await request('memberships',tm)).status,403));
 await check('member-notice-audience',async()=>{const r=await request('notices',tm);assert.equal(r.status,200);assert.equal(r.body.items.length,1);assert.equal(r.body.items[0].audience,'ALL_MEMBERS');});
 await check('admin-notice-audience',async()=>{const r=await request('notices');assert.equal(r.status,200);assert.equal(r.body.items.length,3);});
 await check('unpublished-notices-hidden',async()=>{const r=await request('notices');assert.ok(r.body.items.every((x:any)=>!x.title.endsWith('hidden')));});
 await check('public-events-only',async()=>{const r=await request('events');assert.equal(r.status,200);assert.deepEqual(r.body.items.map((x:any)=>x.title),['public-event']);});
 await check('event-date-range',async()=>{const r=await request('events?from=2026-12-01T00:00:00Z');assert.equal(r.status,200);assert.deepEqual(r.body.items,[]);});
 await check('pagination',async()=>{const first=await request('memberships?limit=1');assert.equal(first.status,200);assert.ok(first.body.nextCursor);const second=await request('memberships?limit=1&cursor='+encodeURIComponent(first.body.nextCursor));assert.equal(second.status,200);assert.notEqual(first.body.items[0].id,second.body.items[0].id);assert.equal(second.body.nextCursor,null);});
 await check('concurrent-tenants',async()=>{for(let i=0;i<5;i++){const [a,b]=await Promise.all([request('memberships'),request('memberships',tb,B)]);assert.equal(a.status,200);assert.equal(b.status,200);assert.ok(a.body.items.every((x:any)=>x.tenantId===A));assert.ok(b.body.items.every((x:any)=>x.tenantId===B));}});
 await check('pool-context-reset',async()=>{const clients=await Promise.all([pool!.connect(),pool!.connect()]);try{for(const c of clients){const r=await c.query(`select nullif(current_setting('church.tenant_id',true),'') as tenant,nullif(current_setting('church.actor_ref',true),'') as actor`);assert.deepEqual(r.rows[0],{tenant:null,actor:null});}}finally{clients.forEach(c=>c.release());}});
 await check('role-expiry',async()=>{await source!.query(`update church_access.membership_role set valid_from=now()-interval '2 days',valid_until=now()-interval '1 day' where tenant_id=$1 and membership_id=$2`,[A,MA]);assert.equal((await request('memberships')).status,403);await source!.query(`update church_access.membership_role set valid_until=null where tenant_id=$1 and membership_id=$2`,[A,MA]);});
 await check('membership-inactive',async()=>{await source!.query(`update church_core.membership set status='INACTIVE' where tenant_id=$1 and id=$2`,[A,MA]);assert.equal((await request('notices')).status,403);await source!.query(`update church_core.membership set status='ACTIVE' where tenant_id=$1 and id=$2`,[A,MA]);});
 await check('binding-revoked',async()=>{await source!.query(`update church_access.external_subject_binding set status='REVOKED',revoked_at=now() where tenant_id=$1 and membership_id=$2`,[A,MA]);assert.equal((await request('notices')).status,403);await source!.query(`update church_access.external_subject_binding set status='ACTIVE',revoked_at=null where tenant_id=$1 and membership_id=$2`,[A,MA]);});
 await check('tenant-suspended',async()=>{await source!.query(`update church_core.tenant set status='SUSPENDED' where id=$1`,[A]);assert.equal((await request('notices')).status,403);await source!.query(`update church_core.tenant set status='ACTIVE' where id=$1`,[A]);});
 await check('forged-jwt',async()=>assert.equal((await request('notices','not.a.valid-token')).status,401));
 await check('rollback-and-next-request',async()=>{assert.equal((await request('memberships',ta,B)).status,403);const r=await request('memberships');assert.equal(r.status,200);assert.ok(r.body.items.every((x:any)=>x.tenantId===A));});

 async function post(kind:string,body:unknown,key:string,t=ta,tenant=A){const res=await fetch(base+'/api/v1/church/'+kind,{method:'POST',headers:{Authorization:'Bearer '+t,'X-Church-Tenant':tenant,'X-Purpose-Code':'CHURCH_OPERATION','Idempotency-Key':key,'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:res.status,body:await res.json() as any};}
 const person='51000000-0000-0000-0000-000000000005',body={personRef:person,status:'ACTIVE'},createKey='membership-create-key-0001';let created:any,notice:any,event:any;
 await check('write-member-denied',async()=>{for(const kind of ['memberships','notices','events'])assert.equal((await post(kind,body,'member-denied-key-0001',tm)).status,403);});
 await check('write-cross-tenant-denied',async()=>assert.equal((await post('memberships',body,'foreign-tenant-key-0001',ta,B)).status,403));
 await check('membership-create',async()=>{const r=await post('memberships',body,createKey);assert.equal(r.status,201);created=r.body;assert.equal(created.tenantId,A);const n=await source!.query('select count(*)::int as n from church_core.membership where tenant_id=$1 and person_ref=$2',[A,person]);assert.equal(n.rows[0].n,1);});
 await check('membership-replay',async()=>{const r=await post('memberships',{status:'ACTIVE',personRef:person},createKey);assert.equal(r.status,201);assert.deepEqual(r.body,created);});
 await check('membership-key-conflict',async()=>assert.equal((await post('memberships',{...body,status:'PENDING'},createKey)).status,409));
 await check('membership-concurrent',async()=>{const concurrentBody={personRef:'52000000-0000-0000-0000-000000000005',status:'PENDING'};const [a,b]=await Promise.all([post('memberships',concurrentBody,'concurrent-create-key-0001'),post('memberships',concurrentBody,'concurrent-create-key-0001')]);assert.equal(a.status,201);assert.equal(b.status,201);assert.deepEqual(a.body,b.body);const n=await source!.query('select count(*)::int as n from church_core.membership where person_ref=$1',[concurrentBody.personRef]);assert.equal(n.rows[0].n,1);});
 await check('membership-unique-conflict',async()=>assert.equal((await post('memberships',body,'different-create-key-0001')).status,409));
 await check('notice-create-draft',async()=>{const b={title:'New draft',body:'Synthetic church notice',audience:'ALL_MEMBERS',publishAt:'2026-11-01T00:00:00Z'};const r=await post('notices',b,'notice-create-key-0001');assert.equal(r.status,201);notice=r.body;assert.equal(notice.status,'DRAFT');assert.deepEqual((await post('notices',b,'notice-create-key-0001')).body,notice);const rows=await source!.query('select status from church_core.notice where tenant_id=$1 and id=$2',[A,notice.id]);assert.equal(rows.rows[0].status,'DRAFT');});
 await check('event-create-draft',async()=>{const b={kind:'WORSHIP',title:'New worship',startsAt:'2026-11-02T00:00:00Z',timezone:'Asia/Seoul'};const r=await post('events',b,'event-create-key-0001');assert.equal(r.status,201);event=r.body;assert.equal(event.status,'DRAFT');assert.deepEqual((await post('events',b,'event-create-key-0001')).body,event);});
 await check('invalid-body-no-write',async()=>{assert.equal((await post('memberships',{...body,tenantId:B},'invalid-body-key-0001')).status,422);const n=await source!.query('select count(*)::int as n from church_integration.idempotency_record where idempotency_key=$1',['invalid-body-key-0001']);assert.equal(n.rows[0].n,0);});
 await check('foreign-community-denied',async()=>{const group=await source!.query(`insert into church_core.community(tenant_id,kind,name,status) values($1,'GROUP','Foreign group','ACTIVE') returning id`,[B]);const r=await post('events',{kind:'GATHERING',title:'Bad reference',startsAt:'2026-11-01T00:00:00Z',timezone:'Asia/Seoul',communityId:group.rows[0].id},'foreign-reference-key-0001');assert.equal(r.status,422);});
 await check('atomic-audit-once',async()=>{for(const item of [created,notice,event]){const a=await source!.query('select action_code,actor_ref from church_audit.audit_event where tenant_id=$1 and resource_ref=$2',[A,item.id]);assert.equal(a.rowCount,1);assert.match(a.rows[0].action_code,/^CREATE_/);assert.match(a.rows[0].actor_ref,/^[0-9a-f]{64}$/);}const a=await source!.query('select response_resource_id from church_integration.idempotency_record where idempotency_key=$1',[createKey]);assert.equal(a.rows[0].response_resource_id,created.id);});
 await check('audit-failure-rolls-back',async()=>{await source!.query('revoke execute on function church_audit.append_event(text,text,text,text,text,text) from church_os_app');try{const p='53000000-0000-0000-0000-000000000005';assert.equal((await post('memberships',{personRef:p,status:'ACTIVE'},'audit-fail-key-0001')).status,503);const n=await source!.query('select count(*)::int as n from church_core.membership where person_ref=$1',[p]);assert.equal(n.rows[0].n,0);const k=await source!.query('select count(*)::int as n from church_integration.idempotency_record where idempotency_key=$1',['audit-fail-key-0001']);assert.equal(k.rows[0].n,0);}finally{await source!.query('grant execute on function church_audit.append_event(text,text,text,text,text,text) to church_os_app');}});
 await check('expired-key-rejected',async()=>{await source!.query(`update church_integration.idempotency_record set created_at=now()-interval '2 days',expires_at=now()-interval '1 day' where idempotency_key=$1`,[createKey]);assert.equal((await post('memberships',body,createKey)).status,409);});
 async function detail(kind:string,id:string,t=ta,tenant=A){const r=await fetch(base+'/api/v1/church/'+kind+'/'+id,{headers:{Authorization:'Bearer '+t,'X-Church-Tenant':tenant,'X-Purpose-Code':'CHURCH_OPERATION'}});return {status:r.status,body:await r.json() as any,etag:r.headers.get('etag')};}
 async function mutate(kind:string,id:string,action:string,body:unknown,key:string,match:string|undefined,t=ta,tenant=A){const r=await fetch(base+'/api/v1/church/'+kind+'/'+id+(action==='patch'?'':'/'+action),{method:action==='patch'?'PATCH':'POST',headers:{Authorization:'Bearer '+t,'X-Church-Tenant':tenant,'X-Purpose-Code':'CHURCH_OPERATION','Idempotency-Key':key,'Content-Type':'application/json',...(match?{'If-Match':match}:{})},body:JSON.stringify(body)});return {status:r.status,body:await r.json() as any,etag:r.headers.get('etag')};}
 const edit={title:'Edited draft',publishAt:'2020-01-01T00:00:00Z'};let notice2:any;
 await check('lifecycle-draft-detail',async()=>{const r=await detail('notices',notice.id);assert.equal(r.status,200);assert.equal(r.etag,'"rv-1"');assert.equal(r.body.rowVersion,'1');});
 await check('lifecycle-member-hidden',async()=>assert.equal((await detail('notices',notice.id,tm)).status,404));
 await check('lifecycle-foreign-hidden',async()=>assert.equal((await detail('notices',notice.id,tb,B)).status,404));
 await check('lifecycle-member-write-denied',async()=>assert.equal((await mutate('notices',notice.id,'patch',edit,'lifecycle-member-key-01','"rv-1"',tm)).status,403));
 await check('lifecycle-precondition-required',async()=>assert.equal((await mutate('notices',notice.id,'patch',edit,'lifecycle-missing-key-01',undefined)).status,428));
 await check('lifecycle-weak-etag-denied',async()=>assert.equal((await mutate('notices',notice.id,'patch',edit,'lifecycle-weak-key-01','W/"rv-1"')).status,400));
 await check('notice-patch-version',async()=>{const r=await mutate('notices',notice.id,'patch',edit,'lifecycle-edit-key-01','"rv-1"');assert.equal(r.status,200);assert.equal(r.etag,'"rv-2"');assert.equal(r.body.title,edit.title);notice2=r.body;});
 await check('notice-patch-replay',async()=>{const r=await mutate('notices',notice.id,'patch',edit,'lifecycle-edit-key-01','"rv-1"');assert.equal(r.status,200);assert.deepEqual(r.body,notice2);});
 await check('notice-stale-patch-denied',async()=>assert.equal((await mutate('notices',notice.id,'patch',{title:'Stale edit'},'lifecycle-stale-key-01','"rv-1"')).status,412));
 await check('notice-key-conflict',async()=>assert.equal((await mutate('notices',notice.id,'patch',{title:'Changed input'},'lifecycle-edit-key-01','"rv-1"')).status,409));
 await check('notice-publish',async()=>{const r=await mutate('notices',notice.id,'publish',{},'lifecycle-publish-key-01','"rv-2"');assert.equal(r.status,200);assert.equal(r.body.status,'PUBLISHED');assert.equal(r.etag,'"rv-3"');});
 await check('notice-member-published',async()=>{const r=await detail('notices',notice.id,tm);assert.equal(r.status,200);assert.equal(r.body.title,edit.title);});
 await check('event-concurrent-version',async()=>{const [a,b]=await Promise.all([mutate('events',event.id,'patch',{title:'Winner A'},'event-concurrent-key-01','"rv-1"'),mutate('events',event.id,'patch',{title:'Winner B'},'event-concurrent-key-02','"rv-1"')]);assert.deepEqual([a.status,b.status].sort(),[200,412]);assert.equal((await detail('events',event.id)).etag,'"rv-2"');});
 await check('event-publish',async()=>{const r=await mutate('events',event.id,'publish',{},'event-publish-key-01','"rv-2"');assert.equal(r.status,200);assert.equal(r.etag,'"rv-3"');assert.equal((await detail('events',event.id,tm)).status,200);});
 await check('event-cancel',async()=>{const r=await mutate('events',event.id,'cancel',{},'event-cancel-key-01','"rv-3"');assert.equal(r.status,200);assert.equal(r.etag,'"rv-4"');assert.equal((await detail('events',event.id,tm)).status,404);});
 await check('event-cancel-replay',async()=>{const r=await mutate('events',event.id,'cancel',{},'event-cancel-key-01','"rv-3"');assert.equal(r.status,200);assert.equal(r.etag,'"rv-4"');});
 await check('event-terminal-denied',async()=>assert.equal((await mutate('events',event.id,'publish',{},'event-republish-key-01','"rv-4"')).status,409));
 await check('expired-notice-publish-denied',async()=>{const n=await post('notices',{title:'Old notice',body:'Synthetic',audience:'ALL_MEMBERS',publishAt:'2020-01-01T00:00:00Z',expiresAt:'2020-01-02T00:00:00Z'},'expired-notice-create-key-01');assert.equal(n.status,201);assert.equal((await mutate('notices',n.body.id,'publish',{},'expired-notice-publish-key-01','"rv-1"')).status,409);});
 await check('lifecycle-audit-rollback',async()=>{await source!.query('revoke execute on function church_audit.append_event(text,text,text,text,text,text) from church_os_app');try{assert.equal((await mutate('notices',notice.id,'patch',{title:'Must rollback'},'lifecycle-audit-fail-key-01','"rv-3"')).status,503);const r=await detail('notices',notice.id);assert.equal(r.body.title,edit.title);assert.equal(r.etag,'"rv-3"');}finally{await source!.query('grant execute on function church_audit.append_event(text,text,text,text,text,text) to church_os_app');}});
 await check('lifecycle-superseded-replay',async()=>assert.equal((await mutate('notices',notice.id,'patch',edit,'lifecycle-edit-key-01','"rv-1"')).status,409));
 await check('notice-cancel',async()=>{const r=await mutate('notices',notice.id,'cancel',{},'notice-cancel-key-01','"rv-3"');assert.equal(r.status,200);assert.equal(r.etag,'"rv-4"');assert.equal((await detail('notices',notice.id,tm)).status,404);});
 await check('lifecycle-audit-history',async()=>{for(const [item,kind] of [[notice,'NOTICES'],[event,'EVENTS']] as const){const r=await source!.query('select action_code from church_audit.audit_event where tenant_id=$1 and resource_ref=$2',[A,item.id]);assert.equal(r.rowCount,4);assert.deepEqual(r.rows.map(x=>x.action_code).sort(),['CREATE_'+kind,'UPDATE_'+kind,'PUBLISH_'+kind,'CANCEL_'+kind].sort());}});
 await check('replay-after-revocation-denied',async()=>{await source!.query(`update church_access.external_subject_binding set status='REVOKED',revoked_at=now() where tenant_id=$1 and membership_id=$2`,[A,MA]);assert.equal((await post('notices',{title:'New draft',body:'Synthetic church notice',audience:'ALL_MEMBERS',publishAt:'2026-11-01T00:00:00Z'},'notice-create-key-0001')).status,403);});
}catch{
 report.reason='Integration failed; inspect failed_check. Raw SQL, tokens and server error text are intentionally omitted.';
}finally{
 await check('shutdown',async()=>{await app?.close();await pool?.end();await source?.end();}).catch(()=>{});
 await check('cleanup',async()=>{if(dbCreated)await admin.query(`drop database ${db} with (force)`);if(rolesCreated)await admin.query(`drop role ${login}; drop role ${owner}`);}).catch(()=>{});
 await admin.end().catch(()=>{});
 const hashes:Record<string,string>={};for(const name of (await readdir(resolve(root,'db/migrations'))).filter(n=>/^V\d+.*\.sql$/.test(n)))hashes[name]=createHash('sha256').update(await readFile(resolve(root,'db/migrations',name))).digest('hex');
 report.runtime=assess(report,hashes)?'PASS':'INCOMPLETE';report.finished_at=new Date().toISOString();await save();
}
console.log(JSON.stringify({runtime:report.runtime,checks:report.checks.length,evidence:output}));
process.exitCode=report.runtime==='PASS'?0:1;
