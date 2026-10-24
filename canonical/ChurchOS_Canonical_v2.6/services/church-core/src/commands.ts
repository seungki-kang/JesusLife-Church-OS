import {createHash} from 'node:crypto';
import type {Kind,Principal} from './ports.js';
export class CommandError extends Error {constructor(public readonly status:number,public readonly code:string){super(code);}}
export function reject(code='INVALID_BODY'):never{throw new CommandError(422,code);}
export const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function text(x:unknown,max:number){if(typeof x!=='string'||!x.trim()||Array.from(x).length>max)reject();}
function day(x:unknown){return typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;}
function timestamp(x:unknown){return typeof x==='string'&&/^\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}:\d{2}(\.\d+)?([Zz]|[+-]\d{2}:\d{2})$/.test(x)&&day(x.slice(0,10))&&Number.isFinite(Date.parse(x));}
export function validateCommand(kind:Kind,value:unknown):Record<string,any>{
 if(value===null||typeof value!=='object'||Array.isArray(value))reject();
 const b=value as Record<string,any>;
 const fields=kind==='memberships'?['personRef','status','joinedOn']:kind==='notices'?['title','body','audience','publishAt','expiresAt']:['kind','title','startsAt','endsAt','timezone','communityId','campusId'];
 if(Object.keys(b).some(k=>!fields.includes(k)))reject();
 if(kind==='memberships'){
  if(typeof b.personRef!=='string'||!UUID.test(b.personRef)||!['PENDING','ACTIVE','INACTIVE'].includes(b.status))reject();
  if(b.joinedOn!==undefined&&!day(b.joinedOn))reject('INVALID_DATE');
 }else if(kind==='notices'){
  text(b.title,160);text(b.body,4000);if(!['ALL_MEMBERS','LEADERS','STAFF'].includes(b.audience)||!timestamp(b.publishAt))reject();
  if(b.expiresAt!==undefined&&b.expiresAt!==null&&(!timestamp(b.expiresAt)||Date.parse(b.expiresAt)<=Date.parse(b.publishAt)))reject('INVALID_DATE_RANGE');
 }else{
  text(b.title,200);text(b.timezone,64);try{new Intl.DateTimeFormat('en',{timeZone:b.timezone});}catch{reject('INVALID_TIMEZONE');}
  if(!['WORSHIP','GATHERING','CLASS','SERVICE','OTHER'].includes(b.kind)||!timestamp(b.startsAt))reject();
  if(b.endsAt!==undefined&&(!timestamp(b.endsAt)||Date.parse(b.endsAt)<Date.parse(b.startsAt)))reject('INVALID_DATE_RANGE');
  for(const field of ['communityId','campusId'])if(b[field]!==undefined&&b[field]!==null&&(typeof b[field]!=='string'||!UUID.test(b[field])))reject();
 }
 return b;
}
export function fingerprint(value:Record<string,any>):string{return createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0)))).digest('hex');}
export function actorRef(p:Principal):string{return createHash('sha256').update(JSON.stringify([p.issuer,p.subject])).digest('hex');}
export function createResponse(kind:Kind,body:Record<string,any>,id:string,tenant:string,createdAt:Date|string){return {...body,id,tenantId:tenant,...(kind==='memberships'?{createdAt:new Date(createdAt).toISOString()}:{status:'DRAFT'})};}
