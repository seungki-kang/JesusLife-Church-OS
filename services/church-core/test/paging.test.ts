import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import { CommandError } from '../src/commands.js';
import { decodeCursor, encodeCursor, parseStatuses, MANAGE_STATUSES } from '../src/paging.js';
import type { IdentityPort, ListRow, ManagePageRequest, PageRequest, StorePort } from '../src/ports.js';

const A = '10000000-0000-0000-0000-000000000001';
const B = '20000000-0000-0000-0000-000000000002';
const ID1 = '30000000-0000-0000-0000-000000000001';
const ID2 = '30000000-0000-0000-0000-000000000002';
const SORT = '2026-11-11T01:02:03.456789Z';
const invalidCursor = (e: unknown) => e instanceof CommandError && e.status === 400 && e.code === 'INVALID_CURSOR';

test('cursor round trip keeps microsecond sort key and id', () => {
  assert.deepEqual(decodeCursor(encodeCursor(A, 'notices', { sort: SORT, id: ID1 }), A, 'notices'), {
    sort: SORT,
    id: ID1,
  });
  assert.deepEqual(decodeCursor(encodeCursor(A, 'memberships', { id: ID1 }), A, 'memberships'), { id: ID1 });
});

test('cursor is bound to tenant, list and format', () => {
  const c = encodeCursor(A, 'events', { sort: SORT, id: ID1 });
  assert.throws(() => decodeCursor(c, B, 'events'), invalidCursor);
  assert.throws(() => decodeCursor(c, A, 'manage-events'), invalidCursor);
  const legacy = Buffer.from(JSON.stringify({ tenant: A, kind: 'events', after: ID1 })).toString('base64url');
  assert.throws(() => decodeCursor(legacy, A, 'events'), invalidCursor);
  const ms = Buffer.from(JSON.stringify({ v: 2, tenant: A, list: 'events', key: ['2026-11-11T01:02:03.456Z', ID1] }));
  assert.throws(() => decodeCursor(ms.toString('base64url'), A, 'events'), invalidCursor);
  assert.throws(() => decodeCursor('x'.repeat(513), A, 'events'), invalidCursor);
  assert.throws(() => decodeCursor('%%%not-base64', A, 'events'), invalidCursor);
});

test('status filter defaults to drafts and published, rejects unknown or repeated values', () => {
  assert.deepEqual(parseStatuses(undefined, MANAGE_STATUSES.notices), ['DRAFT', 'PUBLISHED']);
  assert.deepEqual(parseStatuses('CANCELLED,EXPIRED', MANAGE_STATUSES.notices), ['CANCELLED', 'EXPIRED']);
  for (const bad of ['', 'DRAFT,DRAFT', 'COMPLETED', 'draft'])
    assert.throws(
      () => parseStatuses(bad, MANAGE_STATUSES.notices),
      (e: unknown) => e instanceof CommandError && e.code === 'INVALID_STATUS_FILTER',
    );
});

const identity: IdentityPort = { verify: async (t) => ({ issuer: 'https://issuer.example.invalid', subject: t }) };
const calls: { list?: PageRequest; manage?: ManagePageRequest } = {};
const row = (id: string, extra: Record<string, unknown> = {}): ListRow => ({
  id,
  tenantId: A,
  _sortKey: SORT,
  ...extra,
});
const store: StorePort = {
  ready: async () => true,
  scoped: async (scope, work) =>
    work({
      roles: async () =>
        scope.tenant !== A ? null : scope.principal.subject === 'admin' ? ['MEMBER', 'TENANT_ADMIN'] : ['MEMBER'],
      list: async (_kind, page) => {
        calls.list = page;
        return [row(ID1, { title: 'first' }), row(ID2, { title: 'second' })];
      },
      manageList: async (_kind, page) => {
        calls.manage = page;
        return [row(ID1, { status: 'DRAFT' }), row(ID2, { status: 'PUBLISHED' })];
      },
      create: async () => ({}),
      detail: async () => null,
      mutate: async () => ({}),
      tenant: async () => null,
    }),
};
const app = await buildApp(identity, store, { record: () => {} }, () => {});
const server = app.getHttpAdapter().getInstance();
const get = (url: string, who = 'admin', tenant = A) =>
  server.inject({
    method: 'GET',
    url: '/api/v1/church/' + url,
    headers: { authorization: 'Bearer ' + who, 'x-church-tenant': tenant, 'x-purpose-code': 'CHURCH_OPERATION' },
  });

test('member list pages hide internal sort keys and pass the decoded cursor to the store', async () => {
  const first = await get('notices?limit=1', 'member');
  assert.equal(first.statusCode, 200);
  assert.deepEqual(first.json().items, [{ id: ID1, tenantId: A, title: 'first' }]);
  const cursor = first.json().nextCursor;
  assert.deepEqual(decodeCursor(cursor, A, 'notices'), { sort: SORT, id: ID1 });
  assert.equal((await get('notices?cursor=' + encodeURIComponent(cursor), 'member')).statusCode, 200);
  assert.deepEqual(calls.list?.after, { sort: SORT, id: ID1 });
});

test('manage lists', async (t) => {
  await t.test('admin gets summaries with default statuses', async () => {
    const r = await get('manage/notices?limit=1');
    assert.equal(r.statusCode, 200);
    assert.deepEqual(r.json().items, [{ id: ID1, tenantId: A, status: 'DRAFT' }]);
    assert.deepEqual(calls.manage?.statuses, ['DRAFT', 'PUBLISHED']);
    assert.deepEqual(decodeCursor(r.json().nextCursor, A, 'manage-notices'), { sort: SORT, id: ID1 });
  });
  await t.test('status filter is passed through', async () => {
    assert.equal((await get('manage/events?status=CANCELLED,COMPLETED')).statusCode, 200);
    assert.deepEqual(calls.manage?.statuses, ['CANCELLED', 'COMPLETED']);
  });
  await t.test('member is denied', async () => assert.equal((await get('manage/notices', 'member')).statusCode, 403));
  await t.test('other church is denied', async () =>
    assert.equal((await get('manage/notices', 'admin', B)).statusCode, 403),
  );
  await t.test('invalid filter, repeated parameter and unknown query are rejected', async () => {
    assert.equal((await get('manage/notices?status=COMPLETED')).statusCode, 400);
    assert.equal((await get('manage/notices?status=DRAFT&status=PUBLISHED')).statusCode, 400);
    assert.equal((await get('manage/notices?body=1')).statusCode, 400);
  });
  await t.test('a member-list cursor cannot be replayed on the manage list', async () => {
    const memberCursor = encodeCursor(A, 'notices', { sort: SORT, id: ID1 });
    assert.equal((await get('manage/notices?cursor=' + encodeURIComponent(memberCursor))).statusCode, 400);
  });
});

test('shutdown', async () => app.close());
