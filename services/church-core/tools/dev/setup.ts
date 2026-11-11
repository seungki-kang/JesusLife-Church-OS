/**
 * Local development database (S02/S03): roles, migrations and synthetic seed data.
 *
 * Needs a PostgreSQL 16 administrator connection (PGHOST, PGPORT, PGUSER, PGPASSWORD),
 * CHURCHOS_DEV_SETUP=1 and DEV_DB_PASSWORD. Creates the database DEV_DB_NAME (default
 * churchos_dev) if it does not exist; with --reset it drops and recreates it. Refuses database
 * names that do not start with churchos_dev and refuses CHURCHOS_ENV=production.
 * Prints the DATABASE_URL for the least-privilege login role.
 */
import pg from 'pg';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seed } from './seed.js';

const { Client } = pg;
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const env = process.env;
const fail = (message: string): never => {
  console.error(message);
  process.exit(2);
};
if (env.CHURCHOS_DEV_SETUP !== '1') fail('Set CHURCHOS_DEV_SETUP=1 to confirm this is a development database.');
if ((env.CHURCHOS_ENV ?? '').toLowerCase() === 'production') fail('Refusing to run with CHURCHOS_ENV=production.');
const db = env.DEV_DB_NAME ?? 'churchos_dev';
if (!/^churchos_dev[a-z0-9_]*$/.test(db)) fail('DEV_DB_NAME must start with churchos_dev.');
const password = env.DEV_DB_PASSWORD ?? fail('DEV_DB_PASSWORD is required.');
if (!/^[A-Za-z0-9_-]{12,128}$/.test(password)) fail('DEV_DB_PASSWORD must be 12-128 letters, digits, _ or -.');
const owner = 'churchos_dev_owner',
  login = 'churchos_dev_app';
const connection = {
  host: env.PGHOST ?? 'localhost',
  port: Number(env.PGPORT ?? 5432),
  user: env.PGUSER ?? 'postgres',
  password: env.PGPASSWORD,
  connectionTimeoutMillis: 5000,
};

const admin = new Client({ ...connection, database: env.PGDATABASE ?? 'postgres' });
await admin.connect();
try {
  const exists = (await admin.query('select 1 from pg_database where datname=$1', [db])).rowCount === 1;
  if (exists && !process.argv.includes('--reset')) {
    console.error(`${db} already exists; keeping it. Use --reset to recreate it with fresh synthetic data.`);
  } else {
    if (exists) await admin.query(`drop database ${db} with (force)`);
    await admin.query(`do $$ begin
      if not exists(select from pg_roles where rolname='church_os_app') then create role church_os_app nologin nosuperuser nobypassrls; end if;
      if not exists(select from pg_roles where rolname='church_os_auditor') then create role church_os_auditor nologin nosuperuser nobypassrls; end if;
      if not exists(select from pg_roles where rolname='${owner}') then create role ${owner} login nosuperuser nobypassrls createrole; end if;
      if not exists(select from pg_roles where rolname='${login}') then create role ${login} login nosuperuser nobypassrls nocreaterole nocreatedb inherit; end if;
    end $$`);
    await admin.query(`alter role ${owner} password '${password}'`);
    await admin.query(`alter role ${login} password '${password}'`);
    await admin.query(`grant church_os_app to ${owner} with set true`);
    await admin.query(`grant church_os_app to ${login}`);
    await admin.query(`create database ${db} owner ${owner}`);
    const migrator = new Client({ ...connection, database: db, user: owner, password });
    await migrator.connect();
    try {
      const files = (await readdir(resolve(root, 'db/migrations'))).filter((n) => /^V\d+.*\.sql$/.test(n)).sort();
      for (const name of files) await migrator.query(await readFile(resolve(root, 'db/migrations', name), 'utf8'));
      console.error(`Applied ${files.length} migrations to ${db}.`);
    } finally {
      await migrator.end();
    }
    const seeder = new Client({ ...connection, database: db });
    await seeder.connect();
    try {
      await seeder.query('begin');
      await seed(seeder);
      await seeder.query('commit');
      console.error('Seeded synthetic churches and people (see: cli.js subjects).');
    } finally {
      await seeder.end();
    }
  }
  const host = env.DEV_DB_PUBLIC_HOST ?? connection.host;
  console.log(`DATABASE_URL=postgres://${login}:${password}@${host}:${connection.port}/${db}`);
} finally {
  await admin.end();
}
