/**
 * Keyset paging cursors and list query parsing (COS-CHURCH-042, COS-CHURCH-043).
 *
 * A cursor is opaque to clients. It carries the tenant and list it belongs to and the
 * last row's sort key plus id, so rows with equal sort keys are neither skipped nor
 * repeated. Sort keys are UTC timestamps with microsecond precision taken from the
 * database, because JavaScript Date would truncate them to milliseconds.
 */
import { CommandError } from './commands.js';
import type { CursorKey } from './ports.js';

export type ListName = 'memberships' | 'notices' | 'events' | 'manage-notices' | 'manage-events';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SORT_KEY = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;
const MAX_CURSOR_LENGTH = 512;
const CURSOR_VERSION = 2;

/** Lists ordered by id only; all others are ordered by a timestamp sort key, then id. */
const ID_ONLY: ReadonlySet<ListName> = new Set(['memberships']);

export function encodeCursor(tenant: string, list: ListName, key: CursorKey): string {
  const parts = ID_ONLY.has(list) ? [key.id] : [key.sort, key.id];
  return Buffer.from(JSON.stringify({ v: CURSOR_VERSION, tenant, list, key: parts })).toString('base64url');
}

export function decodeCursor(raw: string, tenant: string, list: ListName): CursorKey {
  const invalid = () => new CommandError(400, 'INVALID_CURSOR');
  if (raw.length > MAX_CURSOR_LENGTH) throw invalid();
  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
  } catch {
    throw invalid();
  }
  const c = decoded as { v?: unknown; tenant?: unknown; list?: unknown; key?: unknown } | null;
  if (!c || c.v !== CURSOR_VERSION || c.tenant !== tenant || c.list !== list || !Array.isArray(c.key)) throw invalid();
  if (ID_ONLY.has(list)) {
    const [id] = c.key;
    if (c.key.length !== 1 || typeof id !== 'string' || !UUID.test(id)) throw invalid();
    return { id };
  }
  const [sort, id] = c.key;
  if (
    c.key.length !== 2 ||
    typeof sort !== 'string' ||
    !SORT_KEY.test(sort) ||
    typeof id !== 'string' ||
    !UUID.test(id)
  )
    throw invalid();
  if (!Number.isFinite(Date.parse(sort))) throw invalid();
  return { sort, id };
}

export const MANAGE_STATUSES = {
  notices: ['DRAFT', 'PUBLISHED', 'EXPIRED', 'CANCELLED'],
  events: ['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'],
} as const;
export const DEFAULT_MANAGE_STATUSES = ['DRAFT', 'PUBLISHED'] as const;

/** Parses `status=DRAFT,PUBLISHED`. Unknown or duplicate values are rejected. */
export function parseStatuses(raw: string | undefined, allowed: readonly string[]): string[] {
  if (raw === undefined) return [...DEFAULT_MANAGE_STATUSES];
  const values = raw.split(',');
  if (!values.length || values.some((v) => !allowed.includes(v)) || new Set(values).size !== values.length)
    throw new CommandError(400, 'INVALID_STATUS_FILTER');
  return values;
}
