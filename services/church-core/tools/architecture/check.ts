/**
 * Architecture rules for church-core (S01, DEVELOPMENT_BLUEPRINT §4 and §9).
 *
 * 1. Layer direction: domain -> domain; application -> domain, application;
 *    an adapter -> domain, application and its own adapter folder; main.ts may import anything.
 *    Type-only imports count: a type dependency is still a dependency.
 * 2. External packages are allowed per layer (domain and application: Node built-ins only).
 * 3. No import cycles.
 * 4. SQL in PostgreSQL adapters may only name `church_*` schemas: ChurchOS never reads
 *    another product's database (STRUCTURE_GUIDE rules).
 *
 * Paths also match a future `src/modules/<name>/{domain,application,adapters}` layout;
 * across modules only the other module's application layer may be imported.
 */
import ts from 'typescript';
import { readdirSync, readFileSync } from 'node:fs';
import { join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export type SourceFile = Readonly<{ path: string; text: string }>;
export type Violation = Readonly<{ rule: string; file: string; detail: string }>;
type Layer = Readonly<{
  kind: 'domain' | 'application' | 'adapter' | 'composition';
  module?: string;
  adapter?: string;
}>;

const NODE_BUILTINS_FOR_CORE = new Set(['node:crypto']);
/** Packages each adapter may use. A new adapter starts with none and must be declared here. */
export const ADAPTER_PACKAGES: Readonly<Record<string, readonly string[]>> = {
  http: ['@nestjs/common', '@nestjs/core', '@nestjs/platform-fastify', 'fastify', 'reflect-metadata', 'node:crypto'],
  postgres: ['pg'],
  oidc: ['jose'],
};
const ALLOWED_SCHEMA = /^(church_[a-z]+|pg_catalog)$/;

export function layerOf(path: string): Layer | null {
  if (path === 'src/main.ts') return { kind: 'composition' };
  const m = /^src\/(?:modules\/([^/]+)\/)?(domain|application|adapters)\/(?:([^/]+)\/)?/.exec(path);
  if (!m) return null;
  const [, module, kind, adapter] = m;
  if (kind === 'adapters')
    return adapter && path.split('/').length > (module ? 5 : 3) ? { kind: 'adapter', module, adapter } : null;
  return { kind: kind as 'domain' | 'application', module };
}

function packageName(spec: string): string {
  if (spec.startsWith('node:')) return spec;
  const parts = spec.split('/');
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

type Import = Readonly<{ spec: string; typeOnly: boolean }>;
function importsOf(file: ts.SourceFile): Import[] {
  const found: Import[] = [];
  const visit = (node: ts.Node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const typeOnly = ts.isImportDeclaration(node) ? !!node.importClause?.isTypeOnly : node.isTypeOnly;
      found.push({ spec: node.moduleSpecifier.text, typeOnly });
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const [arg] = node.arguments;
      if (arg && ts.isStringLiteralLike(arg)) found.push({ spec: arg.text, typeOnly: false });
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}

function stringsOf(file: ts.SourceFile): string[] {
  const texts: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) texts.push(node.text);
    else if (ts.isTemplateExpression(node))
      texts.push(node.head.text + node.templateSpans.map((s) => ' ' + s.literal.text).join(''));
    ts.forEachChild(node, visit);
  };
  visit(file);
  return texts;
}

function schemasIn(sql: string): string[] {
  const schemas: string[] = [];
  for (const m of sql.matchAll(/\b(?:from|join|into|update|table)\s+([a-z_][a-z0-9_]*)\.[a-z_]/gi)) schemas.push(m[1]);
  for (const m of sql.matchAll(/\b([a-z_][a-z0-9_]*)\.[a-z_][a-z0-9_]*\s*\(/gi)) schemas.push(m[1]);
  const bare = /^([a-z_][a-z0-9_]*)\.[a-z_][a-z0-9_]*$/i.exec(sql.trim());
  if (bare) schemas.push(bare[1]);
  return schemas;
}

function allowedTarget(from: Layer, to: Layer): boolean {
  if (from.kind === 'composition') return true;
  if (from.module && to.module && from.module !== to.module) return to.kind === 'application';
  if (to.kind === 'composition') return false;
  if (from.kind === 'domain') return to.kind === 'domain';
  if (from.kind === 'application') return to.kind === 'domain' || to.kind === 'application';
  return to.kind !== 'adapter' || to.adapter === from.adapter;
}

function allowedPackage(layer: Layer, pkg: string): boolean {
  if (layer.kind === 'composition') return true;
  if (layer.kind === 'adapter') return (ADAPTER_PACKAGES[layer.adapter!] ?? []).includes(pkg);
  return NODE_BUILTINS_FOR_CORE.has(pkg);
}

export function checkArchitecture(files: readonly SourceFile[]): Violation[] {
  const violations: Violation[] = [];
  const known = new Set(files.map((f) => f.path));
  const graph = new Map<string, string[]>();
  for (const f of files) {
    const layer = layerOf(f.path);
    if (!layer) {
      violations.push({
        rule: 'layer',
        file: f.path,
        detail: 'file is outside domain/, application/, adapters/<name>/ and main.ts',
      });
      continue;
    }
    const source = ts.createSourceFile(f.path, f.text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const edges: string[] = [];
    for (const { spec, typeOnly } of importsOf(source)) {
      if (!spec.startsWith('.')) {
        const pkg = packageName(spec);
        if (!allowedPackage(layer, pkg))
          violations.push({
            rule: 'package',
            file: f.path,
            detail: `${pkg} is not allowed in ${layer.kind}${layer.adapter ? ':' + layer.adapter : ''}`,
          });
        continue;
      }
      const target = posix.normalize(posix.join(posix.dirname(f.path), spec)).replace(/\.js$/, '.ts');
      if (!known.has(target)) {
        violations.push({ rule: 'resolve', file: f.path, detail: `cannot resolve ${spec}` });
        continue;
      }
      const targetLayer = layerOf(target);
      if (targetLayer && !allowedTarget(layer, targetLayer))
        violations.push({
          rule: 'direction',
          file: f.path,
          detail: `${typeOnly ? 'type import' : 'import'} of ${target}`,
        });
      edges.push(target);
    }
    graph.set(f.path, edges);
    if (layer.kind === 'adapter' && layer.adapter === 'postgres')
      for (const text of stringsOf(source))
        for (const schema of schemasIn(text))
          if (!ALLOWED_SCHEMA.test(schema))
            violations.push({ rule: 'sql-schema', file: f.path, detail: `schema ${schema} is not a church_* schema` });
  }
  violations.push(...cycles(graph));
  return violations;
}

function cycles(graph: Map<string, string[]>): Violation[] {
  const found: Violation[] = [];
  const state = new Map<string, 'visiting' | 'done'>();
  const stack: string[] = [];
  const visit = (node: string) => {
    state.set(node, 'visiting');
    stack.push(node);
    for (const next of graph.get(node) ?? []) {
      if (state.get(next) === 'visiting') {
        const loop = stack.slice(stack.indexOf(next)).concat(next);
        found.push({ rule: 'cycle', file: next, detail: loop.join(' -> ') });
      } else if (!state.has(next)) visit(next);
    }
    stack.pop();
    state.set(node, 'done');
  };
  for (const node of [...graph.keys()].sort()) if (!state.has(node)) visit(node);
  return found;
}

/** Reads every .ts file under <root>/src with service-relative POSIX paths. */
export function loadSources(root: string): SourceFile[] {
  const files: SourceFile[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.ts'))
        files.push({ path: relative(root, full).split(sep).join('/'), text: readFileSync(full, 'utf8') });
    }
  };
  walk(join(root, 'src'));
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

// CLI: node dist/tools/architecture/check.js  (service root is two levels above dist/tools/architecture)
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
  const files = loadSources(root);
  const violations = checkArchitecture(files);
  console.log(JSON.stringify({ checked: files.length, violations }, null, 2));
  process.exitCode = violations.length ? 1 : 0;
}
