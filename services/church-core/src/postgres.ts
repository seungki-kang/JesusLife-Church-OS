import {present,visible,mergeMutation,validatePatch} from './lifecycle.js';
import type {ManagedKind,MutationAction} from './lifecycle.js';
import {actorRef,fingerprint,createResponse,CommandError} from './commands.js';
import type {Pool,PoolClient} from 'pg';
import type {StorePort,SessionPort,Scope,Kind,PageRequest} from './ports.js';
class PgSession implements SessionPort {
  constructor(private readonly client:PoolClient,private readonly scope:Scope){}
  async create(kind:Kind,body:Record<string,any>,key:string){
    const actor=actorRef(this.scope.principal),route='/api/v1/church/'+kind,hash=fingerprint(body);
    await this.client.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[JSON.stringify([this.scope.tenant,actor,route,key])]);
    const prior=await this.client.query(`select request_hash,response_code,response_resource_id,response_created_at,expires_at>now() as active from church_integration.idempotency_record where tenant_id=$1 and actor_ref=$2 and route_key=$3 and idempotency_key=$4`,[this.scope.tenant,actor,route,key]);
    if(prior.rowCount){
      const p=prior.rows[0];if(!p.active)throw new CommandError(409,'IDEMPOTENCY_KEY_EXPIRED');
      if(p.request_hash!==hash)throw new CommandError(409,'IDEMPOTENCY_CONFLICT');
      if(p.response_code!==201||!p.response_resource_id||!p.response_created_at)throw new CommandError(409,'LEGACY_RECEIPT_UNSUPPORTED');
      return createResponse(kind,body,p.response_resource_id,this.scope.tenant,p.response_created_at);
    }
    let row;
    if(kind==='memberships')row=(await this.client.query(`insert into church_core.membership(tenant_id,person_ref,status,joined_on) values($1,$2,$3,$4) returning id,created_at`,[this.scope.tenant,body.personRef,body.status,body.joinedOn??null])).rows[0];
    else if(kind==='notices')row=(await this.client.query(`insert into church_core.notice(tenant_id,title,body,audience,status,publish_at,expires_at) values($1,$2,$3,$4,'DRAFT',$5,$6) returning id,created_at`,[this.scope.tenant,body.title,body.body,body.audience,body.publishAt,body.expiresAt??null])).rows[0];
    else row=(await this.client.query(`insert into church_core.church_event(tenant_id,kind,title,starts_at,ends_at,timezone,community_id,campus_id,status) values($1,$2,$3,$4,$5,$6,$7,$8,'DRAFT') returning id,created_at`,[this.scope.tenant,body.kind,body.title,body.startsAt,body.endsAt??null,body.timezone,body.communityId??null,body.campusId??null])).rows[0];
    // Audit contains resource metadata only, never the notice body or input payload.
    await this.client.query('select church_audit.append_event($1,$2,$3,$4,$5,$6)',['CREATE_'+kind.toUpperCase(),kind,row.id,this.scope.purpose,'ALLOW',this.scope.trace]);
    await this.client.query(`insert into church_integration.idempotency_record(tenant_id,actor_ref,route_key,idempotency_key,request_hash,response_code,expires_at,response_resource_id,response_created_at) values($1,$2,$3,$4,$5,201,now()+interval '24 hours',$6,$7)`,[this.scope.tenant,actor,route,key,hash,row.id,row.created_at]);
    return createResponse(kind,body,row.id,this.scope.tenant,row.created_at);
  }
  private async row(kind:ManagedKind,id:string,lock=false){
    const table=kind==='notices'?'church_core.notice':'church_core.church_event';
    const r=await this.client.query(`select * from ${table} where tenant_id=$1 and id=$2${lock?' for update':''}`,[this.scope.tenant,id]);return r.rows[0]??null;
  }
  async detail(kind:ManagedKind,id:string,roles:readonly string[]){const row=await this.row(kind,id);return row&&visible(kind,row,roles)?present(kind,row):null;}
  async mutate(kind:ManagedKind,id:string,patch:Record<string,any>,key:string,version:string,action:MutationAction){
    validatePatch(kind,patch);
    const actor=actorRef(this.scope.principal),route=(action==='patch'?'PATCH ':'POST ')+'/api/v1/church/'+kind+'/'+id+(action==='patch'?'':'/'+action),hash=fingerprint({...patch,$expectedVersion:version});
    await this.client.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[JSON.stringify([this.scope.tenant,actor,route,key])]);
    const prior=await this.client.query(`select request_hash,response_code,response_row_version,expires_at>now() as active from church_integration.idempotency_record where tenant_id=$1 and actor_ref=$2 and route_key=$3 and idempotency_key=$4`,[this.scope.tenant,actor,route,key]);
    if(prior.rowCount){const p=prior.rows[0];if(!p.active)throw new CommandError(409,'IDEMPOTENCY_KEY_EXPIRED');if(p.request_hash!==hash)throw new CommandError(409,'IDEMPOTENCY_CONFLICT');
      const row=await this.row(kind,id,true);if(!row||p.response_code!==200||String(row.row_version)!==String(p.response_row_version))throw new CommandError(409,'REPLAY_SUPERSEDED');return present(kind,row);
    }
    const row=await this.row(kind,id,true);if(!row)throw new CommandError(404,'NOT_FOUND');
    if(String(row.row_version)!==version)throw new CommandError(412,'VERSION_MISMATCH');
    const next=mergeMutation(kind,row,patch,action);
    let updated;
    if(kind==='notices')updated=(await this.client.query(`update church_core.notice set title=$4,body=$5,audience=$6,publish_at=$7,expires_at=$8,status=$9 where tenant_id=$1 and id=$2 and row_version=$3 returning *`,[this.scope.tenant,id,version,next.title,next.body,next.audience,next.publishAt,next.expiresAt??null,next.status])).rows[0];
    else updated=(await this.client.query(`update church_core.church_event set title=$4,starts_at=$5,ends_at=$6,campus_id=$7,status=$8 where tenant_id=$1 and id=$2 and row_version=$3 returning *`,[this.scope.tenant,id,version,next.title,next.startsAt,next.endsAt??null,next.campusId??null,next.status])).rows[0];
    if(!updated)throw new CommandError(412,'VERSION_MISMATCH');
    const operation=next.status!==row.status?(next.status==='PUBLISHED'?'PUBLISH':'CANCEL'):'UPDATE';
    await this.client.query('select church_audit.append_event($1,$2,$3,$4,$5,$6)',[operation+'_'+kind.toUpperCase(),kind,id,this.scope.purpose,'ALLOW',this.scope.trace]);
    await this.client.query(`insert into church_integration.idempotency_record(tenant_id,actor_ref,route_key,idempotency_key,request_hash,response_code,expires_at,response_resource_id,response_created_at,response_row_version) values($1,$2,$3,$4,$5,200,now()+interval '24 hours',$6,$7,$8)`,[this.scope.tenant,actor,route,key,hash,id,updated.created_at,updated.row_version]);
    return present(kind,updated);
  }
  async roles(){
    const r=await this.client.query(`select m.id,coalesce(array_agg(r.code) filter(where r.code is not null),'{}') as roles
      from church_access.external_subject_binding b
      join church_core.membership m on (m.tenant_id,m.id)=(b.tenant_id,b.membership_id)
      join church_core.tenant t on t.id=m.tenant_id and t.status='ACTIVE'
      left join church_access.membership_role mr on (mr.tenant_id,mr.membership_id)=(m.tenant_id,m.id)
        and mr.valid_from<=now() and (mr.valid_until is null or mr.valid_until>now())
      left join church_access.tenant_role r on (r.tenant_id,r.id)=(mr.tenant_id,mr.role_id)
      where b.tenant_id=$1 and b.issuer=$2 and b.subject_ref=$3 and b.status='ACTIVE' and m.status='ACTIVE'
      group by m.id`,[this.scope.tenant,this.scope.principal.issuer,this.scope.principal.subject]);
    return r.rowCount===1?['MEMBER',...r.rows[0].roles]:null;
  }
  async tenant(){const r=await this.client.query(`select id,name,status,timezone,created_at as "createdAt" from church_core.tenant where id=$1`,[this.scope.tenant]);return r.rows[0]??null;}
  async list(kind:Kind,page:PageRequest,roles:readonly string[]){
    const args:unknown[]=[this.scope.tenant,page.after??null,page.limit+1];
    if(kind==='memberships')return (await this.client.query(`select id,tenant_id as "tenantId",person_ref as "personRef",status,to_char(joined_on,'YYYY-MM-DD') as "joinedOn",created_at as "createdAt" from church_core.membership where tenant_id=$1 and ($2::uuid is null or id>$2::uuid) order by id limit $3`,args)).rows.map(({joinedOn,...row})=>joinedOn?{...row,joinedOn}:row);
    if(kind==='notices'){
      const allowed=['ALL_MEMBERS'];if(roles.some(r=>['LEADER','GROUP_LEADER','MINISTRY_LEADER','PASTOR','TENANT_ADMIN'].includes(r)))allowed.push('LEADERS');if(roles.some(r=>['PASTOR','TENANT_ADMIN'].includes(r)))allowed.push('STAFF');
      args.push(allowed);
      return (await this.client.query(`select id,tenant_id as "tenantId",title,body,audience,publish_at as "publishAt",expires_at as "expiresAt",status from church_core.notice where tenant_id=$1 and ($2::uuid is null or id>$2::uuid) and status='PUBLISHED' and publish_at<=now() and (expires_at is null or expires_at>now()) and audience=any($4::text[]) order by id limit $3`,args)).rows;
    }
    args.push(page.from??null,page.to??null);
    // Community-restricted events are excluded until community ACL is implemented.
    return (await this.client.query(`select id,tenant_id as "tenantId",kind,title,starts_at as "startsAt",ends_at as "endsAt",timezone,status,community_id as "communityId",campus_id as "campusId" from church_core.church_event where tenant_id=$1 and ($2::uuid is null or id>$2::uuid) and status='PUBLISHED' and community_id is null and ($4::timestamptz is null or starts_at>=$4) and ($5::timestamptz is null or starts_at<=$5) order by id limit $3`,args)).rows.map(({endsAt,...row})=>endsAt?{...row,endsAt}:row);
  }
}
export class PgStore implements StorePort {
  constructor(private readonly pool:Pool){}
  async ready(){try{const result=await this.pool.query(`select not r.rolsuper and not r.rolbypassrls and not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname like 'church_%' and c.relowner=r.oid) as safe from pg_roles r where r.rolname=current_user`);return result.rows[0]?.safe===true;}catch{return false;}}
  async scoped<T>(scope:Scope,work:(s:SessionPort)=>Promise<T>){
    if(!await this.ready())throw new Error('Unsafe or unavailable database role');
    const c=await this.pool.connect();
    try{
      await c.query('BEGIN');
      await c.query("select set_config('church.tenant_id',$1,true),set_config('church.actor_ref',$2,true),set_config('statement_timeout','5000',true)",[scope.tenant,actorRef(scope.principal)]);
      const result=await work(new PgSession(c,scope));await c.query('COMMIT');return result;
    }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
  }
}
