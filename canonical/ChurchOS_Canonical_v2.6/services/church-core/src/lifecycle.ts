import {CommandError,reject,validateCommand} from './commands.js';
export type ManagedKind='notices'|'events';
export type MutationAction='patch'|'publish'|'cancel';
export function expectedVersion(header:unknown):string {
 if(header===undefined)throw new CommandError(428,'IF_MATCH_REQUIRED');
 if(typeof header!=='string'||!/^"rv-[1-9][0-9]{0,18}"$/.test(header))throw new CommandError(400,'INVALID_IF_MATCH');
 const value=header.slice(4,-1);if(BigInt(value)>9223372036854775807n)throw new CommandError(400,'INVALID_IF_MATCH');return value;
}
export function etag(version:unknown):string{return '"rv-'+String(version)+'"';}
export function validatePatch(kind:ManagedKind,value:unknown):Record<string,any>{
 if(value===null||typeof value!=='object'||Array.isArray(value))reject();
 const patch=value as Record<string,any>;
 const fields=kind==='notices'?['title','body','audience','publishAt','expiresAt','status']:['title','startsAt','endsAt','campusId','status'];
 if(!Object.keys(patch).length||Object.keys(patch).some(k=>!fields.includes(k)))reject();
 if(patch.status!==undefined&&!(kind==='notices'?['DRAFT','PUBLISHED','CANCELLED']:['DRAFT','PUBLISHED','CANCELLED','COMPLETED']).includes(patch.status))reject('INVALID_STATUS');return patch;
}
export function visible(kind:ManagedKind,row:Record<string,any>,roles:readonly string[],now=new Date()):boolean {
 if(roles.includes('TENANT_ADMIN'))return true;
 if(row.status!=='PUBLISHED')return false;
 if(kind==='events')return row.community_id===null;
 if(new Date(row.publish_at).getTime()>now.getTime()||(row.expires_at!==null&&new Date(row.expires_at).getTime()<=now.getTime()))return false;
 if(row.audience==='ALL_MEMBERS')return true;
 if(row.audience==='STAFF')return roles.includes('PASTOR');
 return row.audience==='LEADERS'&&roles.some(r=>['LEADER','GROUP_LEADER','MINISTRY_LEADER','PASTOR'].includes(r));
}
export function present(kind:ManagedKind,row:Record<string,any>):Record<string,any>{
 const common={id:row.id,tenantId:row.tenant_id,status:row.status,rowVersion:String(row.row_version)};
 if(kind==='notices')return {...common,title:row.title,body:row.body,audience:row.audience,publishAt:new Date(row.publish_at).toISOString(),expiresAt:row.expires_at===null?null:new Date(row.expires_at).toISOString()};
 return {...common,kind:row.kind,title:row.title,startsAt:new Date(row.starts_at).toISOString(),timezone:row.timezone,communityId:row.community_id,campusId:row.campus_id,...(row.ends_at===null?{}:{endsAt:new Date(row.ends_at).toISOString()})};
}
export function mergeMutation(kind:ManagedKind,row:Record<string,any>,patch:Record<string,any>,action:MutationAction,now=new Date()):Record<string,any>{
 if(['CANCELLED','EXPIRED','COMPLETED'].includes(row.status))throw new CommandError(409,'TERMINAL_STATE');
 const current=present(kind,row),next={...current,...patch};
 if(typeof next.status!=='string'||!['DRAFT','PUBLISHED','CANCELLED','COMPLETED','EXPIRED'].includes(next.status))reject('INVALID_STATUS');
 if(['COMPLETED','EXPIRED'].includes(next.status)||(row.status==='PUBLISHED'&&next.status==='DRAFT'))throw new CommandError(409,'INVALID_TRANSITION');
 if(action!=='patch'&&next.status===row.status)throw new CommandError(409,'NO_STATE_CHANGE');
 if(Object.keys(patch).length===1&&patch.status===row.status)throw new CommandError(409,'NO_STATE_CHANGE');
 const allowed=kind==='notices'?['title','body','audience','publishAt','expiresAt']:['kind','title','startsAt','endsAt','timezone','communityId','campusId'];
 const body=Object.fromEntries(allowed.filter(k=>next[k]!==undefined&&!(k==='endsAt'&&next[k]===null)).map(k=>[k,next[k]]));
 validateCommand(kind,body);
 if(kind==='notices'&&next.status==='PUBLISHED'&&next.expiresAt!==null&&next.expiresAt!==undefined&&new Date(next.expiresAt).getTime()<=now.getTime())throw new CommandError(409,'NOTICE_EXPIRED');
 return next;
}
