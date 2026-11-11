import { Pool } from 'pg';
import { buildApp } from './adapters/http/app.js';
import { PgStore } from './adapters/postgres/postgres.js';
import { identityFromEnv } from './adapters/oidc/config.js';
if (!process.env.DATABASE_URL) throw new Error('Missing required configuration: DATABASE_URL');
const { mode, identity } = identityFromEnv(process.env);
if (mode === 'SYNTHETIC')
  console.warn(
    JSON.stringify({ level: 'WARN', event: 'SYNTHETIC_IDENTITY', note: 'development only; not real accounts' }),
  );
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 5000 });
const app = await buildApp(
  identity,
  new PgStore(pool),
  { record: (e) => console.info(JSON.stringify({ level: 'AUDIT', ...e })) },
  undefined,
  mode,
);
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
// Loopback by default; set HOST (for example 0.0.0.0) when running in a container behind a proxy.
const host = process.env.HOST ?? '127.0.0.1';
if (!/^[0-9A-Za-z.:-]{1,253}$/.test(host)) throw new Error('Invalid host');
const close = async () => {
  await app.close();
  await pool.end();
};
process.once('SIGTERM', () => void close());
process.once('SIGINT', () => void close());
await app.listen(port, host);
