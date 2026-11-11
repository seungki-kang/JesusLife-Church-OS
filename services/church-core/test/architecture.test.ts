import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { checkArchitecture, layerOf, loadSources } from '../tools/architecture/check.js';
import type { SourceFile } from '../tools/architecture/check.js';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..');
const rules = (files: SourceFile[]) => checkArchitecture(files).map((v) => v.rule);
const base: SourceFile[] = [
  { path: 'src/domain/types.ts', text: 'export type Id = string;' },
  { path: 'src/application/ports.ts', text: "import type { Id } from '../domain/types.js'; export type P = Id;" },
  { path: 'src/adapters/http/app.ts', text: "import '@nestjs/common'; import '../../application/ports.js';" },
  { path: 'src/adapters/postgres/store.ts', text: "import 'pg'; const q = `select id from church_core.notice`;" },
  { path: 'src/main.ts', text: "import './adapters/http/app.js'; import './adapters/postgres/store.js';" },
];
const withFile = (path: string, text: string) => [...base.filter((f) => f.path !== path), { path, text }];

test('the church-core source tree follows the architecture rules', () => {
  const files = loadSources(root);
  assert.ok(files.length >= 11);
  assert.deepEqual(checkArchitecture(files), []);
});

test('a well-formed minimal tree passes', () => assert.deepEqual(checkArchitecture(base), []));

test('layers are recognised, including the future modules/<name> layout', () => {
  assert.equal(layerOf('src/domain/x.ts')?.kind, 'domain');
  assert.deepEqual(layerOf('src/adapters/postgres/x.ts'), { kind: 'adapter', module: undefined, adapter: 'postgres' });
  assert.deepEqual(layerOf('src/modules/notice/domain/x.ts'), { kind: 'domain', module: 'notice' });
  assert.equal(layerOf('src/adapters/loose.ts'), null);
  assert.equal(layerOf('src/util.ts'), null);
});

test('domain may not import frameworks, storage or outer layers, even for types', () => {
  assert.deepEqual(rules(withFile('src/domain/types.ts', "import 'pg';")), ['package']);
  assert.deepEqual(rules(withFile('src/domain/types.ts', "import type { P } from '../application/ports.js';")), [
    'direction',
    'cycle',
  ]);
  assert.deepEqual(rules(withFile('src/domain/types.ts', "import '../adapters/http/app.js';")), ['direction', 'cycle']);
});

test('an adapter may not reach into another adapter or use undeclared packages', () => {
  assert.deepEqual(rules(withFile('src/adapters/http/app.ts', "import '../postgres/store.js';")), ['direction']);
  assert.deepEqual(rules(withFile('src/adapters/http/app.ts', "import 'pg';")), ['package']);
  assert.deepEqual(rules(withFile('src/adapters/queue/x.ts', "import 'amqplib';")), ['package']);
});

test('PostgreSQL adapters may only name church_* schemas', () => {
  for (const sql of [
    'select * from jlprayer.prayer',
    'select life_diary.entries_for($1)',
    'insert into bible.reading values(1)',
  ])
    assert.deepEqual(rules(withFile('src/adapters/postgres/store.ts', `const q = \`${sql}\`;`)), ['sql-schema'], sql);
  assert.deepEqual(rules(withFile('src/adapters/postgres/store.ts', "const t = 'other_product.table';")), [
    'sql-schema',
  ]);
  assert.deepEqual(
    rules(withFile('src/adapters/postgres/store.ts', "const q = 'select church_audit.append_event($1)';")),
    [],
  );
});

test('cycles, unresolved imports and files outside a layer are reported', () => {
  const cyc = [
    ...base,
    { path: 'src/domain/a.ts', text: "import './b.js';" },
    { path: 'src/domain/b.ts', text: "import './a.js';" },
  ];
  assert.deepEqual(rules(cyc), ['cycle']);
  assert.deepEqual(rules(withFile('src/domain/types.ts', "import './missing.js';")), ['resolve']);
  assert.deepEqual(rules([...base, { path: 'src/helpers.ts', text: '' }]), ['layer']);
});
