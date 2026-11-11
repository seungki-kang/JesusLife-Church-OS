/** Application boundary: what the HTTP layer needs from identity, storage and audit. */
import type { CursorKey, Kind, ManagedKind, MutationAction, Principal } from '../domain/types.js';
export type Scope = Readonly<{ tenant: string; principal: Principal; purpose: string; trace: string }>;
export interface IdentityPort {
  verify(token: string): Promise<Principal>;
}
export interface PageRequest {
  limit: number;
  after?: CursorKey;
  from?: string;
  to?: string;
}
export interface ManagePageRequest {
  limit: number;
  after?: CursorKey;
  statuses: readonly string[];
}
/**
 * A list row. `_sortKey` is the row's timestamp sort key for the next cursor; the HTTP
 * layer removes it before responding.
 */
export type ListRow = Record<string, unknown> & { id: string; _sortKey?: string };
export interface SessionPort {
  detail(kind: ManagedKind, id: string, roles: readonly string[]): Promise<Record<string, any> | null>;
  mutate(
    kind: ManagedKind,
    id: string,
    patch: Record<string, any>,
    key: string,
    version: string,
    action: MutationAction,
  ): Promise<Record<string, any>>;
  create(kind: Kind, body: Record<string, any>, key: string): Promise<Record<string, any>>;
  roles(): Promise<string[] | null>;
  tenant(): Promise<unknown | null>;
  list(kind: Kind, page: PageRequest, roles: readonly string[]): Promise<ListRow[]>;
  manageList(kind: ManagedKind, page: ManagePageRequest): Promise<ListRow[]>;
}
/** One church the caller belongs to (S02). Roles are empty unless the membership is ACTIVE. */
export type ChurchMembershipSummary = Readonly<{
  tenantId: string;
  name: string;
  timezone: string;
  membershipStatus: 'ACTIVE' | 'PENDING';
  roles: readonly string[];
}>;
export interface StorePort {
  scoped<T>(scope: Scope, work: (session: SessionPort) => Promise<T>): Promise<T>;
  myChurches(principal: Principal): Promise<ChurchMembershipSummary[]>;
  ready(): Promise<boolean>;
}
export interface AuditPort {
  record(event: { traceId: string; action: string; status: number }): void;
}
export const IDENTITY = Symbol('IDENTITY'),
  STORE = Symbol('STORE'),
  AUDIT = Symbol('AUDIT');
