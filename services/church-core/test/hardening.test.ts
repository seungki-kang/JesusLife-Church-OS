import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/adapters/http/app.js';
import { CommandError } from '../src/domain/commands.js';
import { DependencyUnavailable } from '../src/application/errors.js';
import { isDependencyFailure } from '../src/adapters/http/problems.js';
import type { ErrorLogEntry } from '../src/adapters/http/problems.js';
import { PgStore, READY_CACHE_MS } from '../src/adapters/postgres/postgres.js';
import type { IdentityPort, StorePort } from '../src/application/ports.js';

const TENANT = '10000000-0000-0000-0000-000000000001';
const ID = '30000000-0000-0000-0000-000000000003';
const identity: IdentityPort = { verify: async () => ({ issuer: 'https://issuer.example.invalid', subject: 'admin' }) };
const headers = {
  authorization: 'Bearer synthetic',
  'x-church-tenant': TENANT,
  'x-purpose-code': 'CHURCH_OPERATION',
  'idempotency-key': 'hardening-key-000001',
  'if-match': '"rv-1"',
  'content-type': 'application/json',
};

async function appThatThrows(failure: unknown, log: (e: ErrorLogEntry) => void) {
  const session = {
    roles: async () => ['MEMBER', 'TENANT_ADMIN'],
    mutate: async () => {
      throw failure;
    },
    create: async () => ({}),
    list: async () => [],
    detail: async () => null,
    tenant: async () => null,
  };
  const store: StorePort = {
    ready: async () => true,
    myChurches: async () => [],
    scoped: async (_scope, work) => work(session as any),
  };
  const app = await buildApp(identity, store, { record: () => {} }, log);
  const response = await app
    .getHttpAdapter()
    .getInstance()
    .inject({
      method: 'PATCH',
      url: `/api/v1/church/notices/${ID}`,
      headers,
      payload: JSON.stringify({ title: 'Synthetic' }),
    });
  await app.close();
  return response;
}

test('error responses and server-side logs', async (t) => {
  await t.test('programming error is 500 and logged without its message', async () => {
    const logs: ErrorLogEntry[] = [];
    const r = await appThatThrows(new TypeError('contains secret-value'), (e) => logs.push(e));
    assert.equal(r.statusCode, 500);
    assert.equal(r.json().code, 'INTERNAL_ERROR');
    assert.equal(logs.length, 1);
    assert.equal(logs[0].traceId, r.json().traceId);
    assert.equal(logs[0].errorName, 'TypeError');
    assert.equal(logs[0].route, '/api/v1/church/notices/:noticeId');
    assert.ok(!JSON.stringify(logs).includes('secret-value'));
    assert.ok(logs[0].stack?.every((line) => line.startsWith('at ')));
  });

  await t.test('PostgreSQL error stays 503 and records SQLSTATE only', async () => {
    const logs: ErrorLogEntry[] = [];
    const dbError = Object.assign(new Error('permission denied for function x'), { code: '42501', severity: 'ERROR' });
    const r = await appThatThrows(dbError, (e) => logs.push(e));
    assert.equal(r.statusCode, 503);
    assert.equal(r.json().code, 'SERVICE_UNAVAILABLE');
    assert.equal(logs[0].sqlState, '42501');
    assert.ok(!JSON.stringify(logs).includes('permission denied'));
  });

  await t.test('unsafe database role is 503', async () => {
    const r = await appThatThrows(new DependencyUnavailable(), () => {});
    assert.equal(r.statusCode, 503);
  });

  await t.test('expected client errors are not logged as server errors', async () => {
    const logs: ErrorLogEntry[] = [];
    const r = await appThatThrows(new CommandError(412, 'VERSION_MISMATCH'), (e) => logs.push(e));
    assert.equal(r.statusCode, 412);
    assert.equal(logs.length, 0);
  });

  await t.test('a failing logger does not change the response', async () => {
    const r = await appThatThrows(new TypeError('x'), () => {
      throw new Error('log sink down');
    });
    assert.equal(r.statusCode, 500);
  });
});

test('dependency failure classification', () => {
  assert.equal(isDependencyFailure(new Error('Connection terminated unexpectedly')), true);
  assert.equal(isDependencyFailure(Object.assign(new Error('x'), { code: 'ECONNREFUSED' })), true);
  assert.equal(isDependencyFailure(Object.assign(new Error('x'), { code: '57014', severity: 'ERROR' })), true);
  assert.equal(isDependencyFailure(Object.assign(new Error('x'), { code: 'EPERM' })), false);
  assert.equal(isDependencyFailure(new RangeError('bug')), false);
});

const scope = {
  tenant: TENANT,
  principal: { issuer: 'issuer', subject: 'subject' },
  purpose: 'CHURCH_OPERATION',
  trace: 'trace',
};
function storeFixture({ safe = true, rollbackFails = false } = {}) {
  let clock = 1_000_000,
    readyQueries = 0;
  const releases: unknown[] = [];
  const client = {
    query: async (sql: string) => {
      if (sql === 'ROLLBACK' && rollbackFails) throw new Error('Connection terminated unexpectedly');
      return { rows: [] };
    },
    release: (err?: unknown) => {
      releases.push(err);
    },
  };
  const pool = {
    query: async () => {
      readyQueries++;
      return { rows: [{ safe }] };
    },
    connect: async () => client,
  };
  const store = new PgStore(pool as any, () => clock);
  return {
    store,
    releases,
    readyQueries: () => readyQueries,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

test('database role check is reused briefly and never cached when unsafe', async () => {
  const f = storeFixture();
  await f.store.scoped(scope, async () => 1);
  await f.store.scoped(scope, async () => 2);
  assert.equal(f.readyQueries(), 1);
  f.advance(READY_CACHE_MS);
  await f.store.scoped(scope, async () => 3);
  assert.equal(f.readyQueries(), 2);

  const unsafe = storeFixture({ safe: false });
  for (let i = 0; i < 2; i++)
    await assert.rejects(
      unsafe.store.scoped(scope, async () => 1),
      DependencyUnavailable,
    );
  assert.equal(unsafe.readyQueries(), 2);
});

test('connection is destroyed when ROLLBACK fails and the original error is kept', async () => {
  const ok = storeFixture();
  await ok.store.scoped(scope, async () => 1);
  assert.deepEqual(ok.releases, [undefined]);

  const f = storeFixture({ rollbackFails: true });
  await assert.rejects(
    f.store.scoped(scope, async () => {
      throw new CommandError(403, 'ROLE_DENIED');
    }),
    (e) => e instanceof CommandError && e.code === 'ROLE_DENIED',
  );
  assert.equal(f.releases.length, 1);
  assert.ok(f.releases[0] instanceof Error);
});
