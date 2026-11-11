import 'reflect-metadata';
import {test} from 'node:test';import assert from 'node:assert/strict';
import {generateKeyPair,exportJWK,createLocalJWKSet,SignJWT} from 'jose';
import {CommandError} from '../src/commands.js';
import {buildApp} from '../src/app.js';import {JwtIdentity} from '../src/identity.js';
import type {Scope,StorePort} from '../src/ports.js';
const A='10000000-0000-0000-0000-000000000001',B='20000000-0000-0000-0000-000000000002',ID='30000000-0000-0000-0000-000000000003';
const issuer='https://issuer.example.invalid',audience='churchos-api';
const keys=await generateKeyPair('RS256');const jwk=await exportJWK(keys.publicKey);jwk.kid='test-key';
const identity=new JwtIdentity(createLocalJWKSet({keys:[jwk]}),issuer,audience);
async function token(sub='admin',aud=audience,iss=issuer,expired=false){return new SignJWT({roles:['TENANT_ADMIN'],tenant:B}).setProtectedHeader({alg:'RS256',kid:'test-key'}).setSubject(sub).setIssuer(iss).setAudience(aud).setIssuedAt().setExpirationTime(expired?Math.floor(Date.now()/1000)-60:'5m').sign(keys.privateKey);}
let revoked=false,available=true;const audits:unknown[]=[];
const store:StorePort={ready:async()=>available,scoped:async<T>(scope:Scope,work:any):Promise<T>=>work({
 detail:async(kind:string,id:string)=>id===ID?{id:ID,tenantId:A,rowVersion:'1',status:'DRAFT',title:'Synthetic'}:null,
 mutate:async(kind:string,id:string,patch:any,key:string,version:string)=>{if(version!=='1')throw new CommandError(412,'VERSION_MISMATCH');return {id,tenantId:A,rowVersion:'2',...patch};},
 create:async()=>({id:ID,tenantId:A}),
 roles:async()=>scope.tenant!==A||revoked?null:scope.principal.subject==='admin'?['MEMBER','TENANT_ADMIN']:scope.principal.subject==='member'?['MEMBER']:null,
 tenant:async()=>({id:A,name:'Synthetic Church',status:'ACTIVE',timezone:'Asia/Seoul',createdAt:'2026-10-24T00:00:00Z'}),
 list:async(kind:string,page:any)=>[{id:ID,tenantId:scope.tenant,...(kind==='memberships'?{personRef:ID,status:'ACTIVE',createdAt:'2026-10-24T00:00:00Z'}:{title:'Synthetic'})},...(page.limit===1?[{id:'40000000-0000-0000-0000-000000000004',tenantId:scope.tenant}]:[])]
},[])};
const app=await buildApp(identity,store,{record:e=>audits.push(e)});const server=app.getHttpAdapter().getInstance();
async function get(path:string,t?:string,tenant=A,extra:Record<string,string>={}){return server.inject({method:'GET',url:path,headers:{...(t?{authorization:'Bearer '+t}:{}),'x-church-tenant':tenant,'x-purpose-code':'CHURCH_OPERATION',...extra}});}
const root='/api/v1/church';
test('HTTP authorization and tenant boundary',async t=>{
 await t.test('live without authentication',async()=>assert.equal((await get('/health/live')).statusCode,200));
 await t.test('ready reflects dependency failure',async()=>{available=false;assert.equal((await get('/health/ready')).statusCode,503);available=true;});
 await t.test('missing token denied',async()=>assert.equal((await get(root+'/memberships')).statusCode,401));
 await t.test('forged token denied',async()=>assert.equal((await get(root+'/memberships','not-a-jwt')).statusCode,401));
 await t.test('wrong audience denied',async()=>assert.equal((await get(root+'/memberships',await token('admin','other'))).statusCode,401));
 await t.test('wrong issuer denied',async()=>assert.equal((await get(root+'/memberships',await token('admin',audience,'https://other.invalid'))).statusCode,401));
 await t.test('expired token denied',async()=>assert.equal((await get(root+'/memberships',await token('admin',audience,issuer,true))).statusCode,401));
 await t.test('valid admin reads own tenant',async()=>{const r=await get(root+'/memberships',await token());assert.equal(r.statusCode,200);assert.equal(r.json().items[0].tenantId,A);});
 await t.test('foreign tenant header denied',async()=>assert.equal((await get(root+'/memberships',await token(),B)).statusCode,403));
 await t.test('token role claims cannot grant DB role',async()=>assert.equal((await get(root+'/memberships',await token('member'))).statusCode,403));
 await t.test('revoked binding denied',async()=>{revoked=true;assert.equal((await get(root+'/notices',await token())).statusCode,403);revoked=false;});
 await t.test('unknown subject denied',async()=>assert.equal((await get(root+'/events',await token('stranger'))).statusCode,403));
 await t.test('tenant path mismatch denied',async()=>assert.equal((await get(root+'/tenants/'+B,await token())).statusCode,403));
 await t.test('unregistered purpose denied',async()=>assert.equal((await get(root+'/notices',await token(),A,{'x-purpose-code':'MARKETING'})).statusCode,403));
 await t.test('invalid UUID denied',async()=>assert.equal((await get(root+'/notices',await token(),'bad')).statusCode,400));
 await t.test('pagination limit rejected',async()=>assert.equal((await get(root+'/notices?limit=101',await token())).statusCode,400));
 await t.test('cross-resource cursor rejected',async()=>{const r=await get(root+'/memberships?limit=1',await token());assert.ok(r.json().nextCursor);const cursor=encodeURIComponent(r.json().nextCursor);assert.equal((await get(root+'/notices?cursor='+cursor,await token())).statusCode,400);});
 await t.test('query role injection rejected',async()=>assert.equal((await get(root+'/notices?role=TENANT_ADMIN',await token())).statusCode,400));
 await t.test('invalid date range rejected',async()=>assert.equal((await get(root+'/events?from=2026-12-01T00:00:00Z&to=2026-01-01T00:00:00Z',await token())).statusCode,400));
 await t.test('writes require authentication',async()=>assert.equal((await server.inject({method:'POST',url:root+'/memberships',headers:{'x-church-tenant':A}})).statusCode,401));
 await t.test('errors have trace and no JWT',async()=>{const r=await get(root+'/memberships','secret-token');assert.ok(r.json().traceId);assert.equal(r.headers['cache-control'],'no-store');assert.ok(!r.body.includes('secret-token'));});
 async function post(kind:string,body:unknown,sub='admin',key='unit-create-key-0001') {return server.inject({method:'POST',url:root+'/'+kind,headers:{authorization:'Bearer '+await token(sub),'x-church-tenant':A,'x-purpose-code':'CHURCH_OPERATION','idempotency-key':key},payload:body as any});}
 await t.test('member cannot create membership',async()=>assert.equal((await post('memberships',{personRef:ID,status:'ACTIVE'},'member')).statusCode,403));
 await t.test('member cannot create notice',async()=>assert.equal((await post('notices',{},'member')).statusCode,403));
 await t.test('member cannot create event',async()=>assert.equal((await post('events',{},'member')).statusCode,403));
 await t.test('admin create uses 201',async()=>assert.equal((await post('memberships',{personRef:ID,status:'ACTIVE'})).statusCode,201));
 await t.test('foreign tenant body field rejected',async()=>assert.equal((await post('memberships',{personRef:ID,status:'ACTIVE',tenantId:B})).statusCode,422));
 await t.test('short request key rejected',async()=>assert.equal((await post('memberships',{personRef:ID,status:'ACTIVE'},'admin','short')).statusCode,400));
 async function change(path:string,method:'PATCH'|'POST',body:unknown,match:string|undefined='"rv-1"',sub='admin'){return server.inject({method,url:root+path,headers:{authorization:'Bearer '+await token(sub),'x-church-tenant':A,'x-purpose-code':'CHURCH_OPERATION','idempotency-key':'lifecycle-unit-key-0001',...(match?{'if-match':match}:{})},payload:body as any});}
 await t.test('detail returns strong ETag',async()=>{const r=await get(root+'/notices/'+ID,await token());assert.equal(r.statusCode,200);assert.equal(r.headers.etag,'"rv-1"');});
 await t.test('missing mutation precondition returns 428',async()=>assert.equal((await change('/notices/'+ID,'PATCH',{title:'Edit'},'')).statusCode,428));
 await t.test('weak precondition returns 400',async()=>assert.equal((await change('/notices/'+ID,'PATCH',{title:'Edit'},'W/"rv-1"')).statusCode,400));
 await t.test('member cannot edit',async()=>assert.equal((await change('/notices/'+ID,'PATCH',{title:'Edit'},'"rv-1"','member')).statusCode,403));
 await t.test('patch returns updated ETag',async()=>{const r=await change('/notices/'+ID,'PATCH',{title:'Edit'});assert.equal(r.statusCode,200);assert.equal(r.headers.etag,'"rv-2"');});
 await t.test('stale precondition returns 412',async()=>assert.equal((await change('/events/'+ID,'PATCH',{title:'Edit'},'"rv-9"')).statusCode,412));
 await t.test('publish uses 200 rather than create 201',async()=>assert.equal((await change('/notices/'+ID+'/publish','POST',{})).statusCode,200));
 await t.test('cancel rejects unexpected request body',async()=>assert.equal((await change('/events/'+ID+'/cancel','POST',{reason:'raw text'})).statusCode,422));
 for(const path of ['/api/v1/church/%zz','/api/v1/church/tenants/%FF','/public/%00'])await t.test('malformed unauthenticated URL does not return protected data: '+path,async()=>{const r=await get(path);assert.ok([400,401,403,404].includes(r.statusCode));assert.ok(!r.body.includes('Synthetic Church'));assert.ok(!r.body.includes('personRef'));});
 await t.test('audit contains no raw token',()=>{assert.ok(audits.length>0);assert.ok(!JSON.stringify(audits).includes('Bearer'));});
 await app.close();
});
