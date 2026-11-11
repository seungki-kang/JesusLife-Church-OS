import 'reflect-metadata';
import {Controller,Get,Post,Patch,Res,HttpCode,Param,Query,Req,Inject,Module,HttpException,Catch} from '@nestjs/common';
import type {ExceptionFilter,ArgumentsHost} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {FastifyAdapter} from '@nestjs/platform-fastify';
import type {NestFastifyApplication} from '@nestjs/platform-fastify';
import {expectedVersion,etag,validatePatch} from './lifecycle.js';
import type {ManagedKind,MutationAction} from './lifecycle.js';
import type {FastifyReply,FastifyRequest} from 'fastify';
import {CommandError,validateCommand} from './commands.js';
import {randomUUID} from 'node:crypto';
import {IDENTITY,STORE,AUDIT} from './ports.js';
import type {IdentityPort,StorePort,AuditPort,Scope,Kind,SessionPort,PageRequest} from './ports.js';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function fail(status:number,code:string):never{throw new HttpException(code,status);}
@Catch()
class Problems implements ExceptionFilter {
  catch(error:unknown,host:ArgumentsHost){
    const ctx=host.switchToHttp(),req=ctx.getRequest<FastifyRequest>(),res=ctx.getResponse();
    const dbCode=(error as any)?.code;
    const status=error instanceof CommandError?error.status:error instanceof HttpException?error.getStatus():dbCode==='23505'?409:['23503','23514','22007','22008'].includes(dbCode)?422:503;
    const code=error instanceof CommandError?error.code:dbCode==='23505'?'RESOURCE_CONFLICT':['23503','23514','22007','22008'].includes(dbCode)?'INVALID_REFERENCE_OR_VALUE':error instanceof HttpException && typeof error.getResponse()==='string' && /^[A-Z_]+$/.test(error.getResponse() as string)?error.getResponse():(error instanceof HttpException?'HTTP_ERROR':'SERVICE_UNAVAILABLE');
    res.status(status).header('content-type','application/problem+json').send({type:'about:blank',title:code,status,code,traceId:req.id});
  }
}
@Controller()
class CoreController {
 constructor(@Inject(IDENTITY)private identity:IdentityPort,@Inject(STORE)private store:StorePort){}
 @Get('/health/live')live(){return {status:'LIVE'};}
 @Get('/health/ready')async ready(){if(!await this.store.ready())fail(503,'NOT_READY');return {status:'READY',scope:'DATABASE_ONLY'};}
 async scoped<T>(req:FastifyRequest,tenant:string,kind:string,work:(s:SessionPort,roles:string[])=>Promise<T>){
   const auth=req.headers.authorization;if(!auth?.startsWith('Bearer ')||auth.length>16384)fail(401,'UNAUTHORIZED');
   let principal;try{principal=await this.identity.verify(auth.slice(7));}catch{fail(401,'UNAUTHORIZED');}
   if(!uuid.test(tenant))fail(400,'INVALID_TENANT');
   const purpose=req.headers['x-purpose-code'];if(purpose!=='CHURCH_OPERATION')fail(403,'PURPOSE_DENIED');
   const scope:Scope=Object.freeze({tenant,principal,purpose,trace:req.id});
   return this.store.scoped(scope,async session=>{
     const roles=await session.roles();if(!roles)fail(403,'MEMBERSHIP_REQUIRED');
     if(kind==='memberships'&&!roles.some(x=>['PASTOR','TENANT_ADMIN'].includes(x)))fail(403,'ROLE_DENIED');
     return work(session,roles);
   });
 }
 @Get('/api/v1/church/tenants/:tenantId')tenant(@Req()req:FastifyRequest,@Param('tenantId')tenant:string){
   const header=req.headers['x-church-tenant'];if(header&&header!==tenant)fail(403,'TENANT_MISMATCH');
   return this.scoped(req,tenant,'tenant',async s=>{const row=await s.tenant();if(!row)fail(404,'NOT_FOUND');return row;});
 }
 async page(req:FastifyRequest,query:Record<string,string>,kind:Kind){
   const tenant=req.headers['x-church-tenant'];if(typeof tenant!=='string')fail(400,'INVALID_TENANT');
   const allowed=kind==='events'?['cursor','limit','from','to']:['cursor','limit'];if(Object.keys(query).some(k=>!allowed.includes(k)))fail(400,'INVALID_QUERY');
   const limit=query.limit===undefined?20:Number(query.limit);if(!Number.isInteger(limit)||limit<1||limit>100)fail(400,'INVALID_LIMIT');
   const page:PageRequest={limit};
   if(query.cursor){try{const decoded=JSON.parse(Buffer.from(query.cursor,'base64url').toString());if(query.cursor.length>512||decoded.tenant!==tenant||decoded.kind!==kind||!uuid.test(decoded.after))throw Error();page.after=decoded.after;}catch{fail(400,'INVALID_CURSOR');}}
   for(const name of ['from','to'] as const)if(query[name]){if(!/^\d{4}-\d{2}-\d{2}T.*(Z|[+-]\d{2}:\d{2})$/.test(query[name])||!Number.isFinite(Date.parse(query[name])))fail(400,'INVALID_DATE');page[name]=query[name];}
   if(page.from&&page.to&&Date.parse(page.from)>Date.parse(page.to))fail(400,'INVALID_DATE_RANGE');
   return this.scoped(req,tenant,kind,async(s,roles)=>{
     const rows=await s.list(kind,page,roles);const items=rows.slice(0,limit);
     const nextCursor=rows.length>limit?Buffer.from(JSON.stringify({tenant,kind,after:items.at(-1)!.id})).toString('base64url'):null;
     return {items,nextCursor};
   });
 }
 async create(req:FastifyRequest,kind:Kind){
   const tenant=req.headers['x-church-tenant'];if(typeof tenant!=='string')fail(400,'INVALID_TENANT');
   return this.scoped(req,tenant,'write',async(session,roles)=>{
     if(!roles.includes('TENANT_ADMIN'))fail(403,'ROLE_DENIED');
     const key=req.headers['idempotency-key'];if(typeof key!=='string'||!/^[\x21-\x7E]{16,128}$/.test(key))fail(400,'INVALID_IDEMPOTENCY_KEY');
     if(Object.keys(req.query as object).length)fail(400,'INVALID_QUERY');
     const body=validateCommand(kind,req.body);return session.create(kind,body,key);
   });
 }
 @Post('/api/v1/church/memberships')createMember(@Req()req:FastifyRequest){return this.create(req,'memberships');}
 @Post('/api/v1/church/notices')createNotice(@Req()req:FastifyRequest){return this.create(req,'notices');}
 @Post('/api/v1/church/events')createEvent(@Req()req:FastifyRequest){return this.create(req,'events');}
 async detail(req:FastifyRequest,kind:ManagedKind,id:string,reply:FastifyReply){
   const tenant=req.headers['x-church-tenant'];if(typeof tenant!=='string')fail(400,'INVALID_TENANT');
   return this.scoped(req,tenant,'detail',async(s,roles)=>{if(!uuid.test(id))fail(400,'INVALID_ID');if(Object.keys(req.query as object).length)fail(400,'INVALID_QUERY');const row=await s.detail(kind,id,roles);if(!row)fail(404,'NOT_FOUND');reply.header('ETag',etag(row.rowVersion));return row;});
 }
 async mutate(req:FastifyRequest,kind:ManagedKind,id:string,reply:FastifyReply,action:MutationAction){
   const tenant=req.headers['x-church-tenant'];if(typeof tenant!=='string')fail(400,'INVALID_TENANT');
   return this.scoped(req,tenant,'write',async(s,roles)=>{
     if(!roles.includes('TENANT_ADMIN'))fail(403,'ROLE_DENIED');if(!uuid.test(id))fail(400,'INVALID_ID');
     const version=expectedVersion(req.headers['if-match']),key=req.headers['idempotency-key'];if(typeof key!=='string'||!/^[\x21-\x7E]{16,128}$/.test(key))fail(400,'INVALID_IDEMPOTENCY_KEY');
     if(Object.keys(req.query as object).length)fail(400,'INVALID_QUERY');
     let patch;
     if(action==='patch')patch=validatePatch(kind,req.body);
     else{const body=req.body??{};if(typeof body!=='object'||Array.isArray(body)||body===null||Object.keys(body).length)fail(422,'INVALID_BODY');patch={status:action==='publish'?'PUBLISHED':'CANCELLED'};}
     const row=await s.mutate(kind,id,patch,key,version,action);reply.header('ETag',etag(row.rowVersion));return row;
   });
 }
 @Get('/api/v1/church/notices/:noticeId')noticeDetail(@Req()r:FastifyRequest,@Param('noticeId')id:string,@Res({passthrough:true})reply:FastifyReply){return this.detail(r,'notices',id,reply);}
 @Get('/api/v1/church/events/:eventId')eventDetail(@Req()r:FastifyRequest,@Param('eventId')id:string,@Res({passthrough:true})reply:FastifyReply){return this.detail(r,'events',id,reply);}
 @Patch('/api/v1/church/notices/:noticeId')patchNotice(@Req()r:FastifyRequest,@Param('noticeId')id:string,@Res({passthrough:true})reply:FastifyReply){return this.mutate(r,'notices',id,reply,'patch');}
 @Patch('/api/v1/church/events/:eventId')patchEvent(@Req()r:FastifyRequest,@Param('eventId')id:string,@Res({passthrough:true})reply:FastifyReply){return this.mutate(r,'events',id,reply,'patch');}
 @HttpCode(200)
 @Post('/api/v1/church/notices/:noticeId/publish')publishNotice(@Req()r:FastifyRequest,@Param('noticeId')id:string,@Res({passthrough:true})reply:FastifyReply){return this.mutate(r,'notices',id,reply,'publish');}
 @HttpCode(200)
 @Post('/api/v1/church/notices/:noticeId/cancel')cancelNotice(@Req()r:FastifyRequest,@Param('noticeId')id:string,@Res({passthrough:true})reply:FastifyReply){return this.mutate(r,'notices',id,reply,'cancel');}
 @HttpCode(200)
 @Post('/api/v1/church/events/:eventId/publish')publishEvent(@Req()r:FastifyRequest,@Param('eventId')id:string,@Res({passthrough:true})reply:FastifyReply){return this.mutate(r,'events',id,reply,'publish');}
 @HttpCode(200)
 @Post('/api/v1/church/events/:eventId/cancel')cancelEvent(@Req()r:FastifyRequest,@Param('eventId')id:string,@Res({passthrough:true})reply:FastifyReply){return this.mutate(r,'events',id,reply,'cancel');}
 @Get('/api/v1/church/memberships')members(@Req()req:FastifyRequest,@Query()query:Record<string,string>){return this.page(req,query,'memberships');}
 @Get('/api/v1/church/notices')notices(@Req()req:FastifyRequest,@Query()query:Record<string,string>){return this.page(req,query,'notices');}
 @Get('/api/v1/church/events')events(@Req()req:FastifyRequest,@Query()query:Record<string,string>){return this.page(req,query,'events');}
}
export async function buildApp(identity:IdentityPort,store:StorePort,audit:AuditPort):Promise<NestFastifyApplication>{
 @Module({controllers:[CoreController],providers:[{provide:IDENTITY,useValue:identity},{provide:STORE,useValue:store},{provide:AUDIT,useValue:audit}]})class AppModule{}
 const adapter=new FastifyAdapter({logger:false,bodyLimit:32768,genReqId:()=>randomUUID()});
 const fastify=adapter.getInstance();fastify.addHook('onRequest',async(_req,reply)=>{reply.header('cache-control','no-store');});
 fastify.addHook('onResponse',async(req,reply)=>{audit.record({traceId:req.id,action:req.routeOptions.url??'UNMATCHED',status:reply.statusCode});});
 const app=await NestFactory.create<NestFastifyApplication>(AppModule,adapter,{logger:false});app.useGlobalFilters(new Problems());await app.init();await fastify.ready();return app;
}
