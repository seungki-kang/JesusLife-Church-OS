import type {ManagedKind,MutationAction} from './lifecycle.js';
export type Principal = Readonly<{issuer:string;subject:string}>;
export type Scope = Readonly<{tenant:string;principal:Principal;purpose:string;trace:string}>;
export type Kind = 'memberships'|'notices'|'events';
export interface IdentityPort { verify(token:string):Promise<Principal> }
export interface PageRequest {limit:number;after?:string;from?:string;to?:string}
export interface SessionPort {
  detail(kind:ManagedKind,id:string,roles:readonly string[]):Promise<Record<string,any>|null>;
  mutate(kind:ManagedKind,id:string,patch:Record<string,any>,key:string,version:string,action:MutationAction):Promise<Record<string,any>>;
  create(kind:Kind,body:Record<string,any>,key:string):Promise<Record<string,any>>;
  roles():Promise<string[]|null>;
  tenant():Promise<unknown|null>;
  list(kind:Kind,page:PageRequest,roles:readonly string[]):Promise<Record<string,unknown>[]>;
}
export interface StorePort {
  scoped<T>(scope:Scope,work:(session:SessionPort)=>Promise<T>):Promise<T>;
  ready():Promise<boolean>;
}
export interface AuditPort { record(event:{traceId:string;action:string;status:number}):void }
export const IDENTITY=Symbol('IDENTITY'), STORE=Symbol('STORE'), AUDIT=Symbol('AUDIT');
