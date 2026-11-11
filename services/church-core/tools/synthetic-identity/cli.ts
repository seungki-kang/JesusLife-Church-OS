/**
 * Synthetic identity for local development (S02). Not a real provider.
 *
 *   node dist/tools/synthetic-identity/cli.js init  --dir .synthetic          create a local key pair
 *   node dist/tools/synthetic-identity/cli.js token <subject> --dir .synthetic print a 15-minute token
 *   node dist/tools/synthetic-identity/cli.js subjects                         list seeded test people
 *
 * Tokens use the reserved issuer https://synthetic-identity.churchos.invalid, which the server
 * accepts only with IDENTITY_MODE=synthetic and refuses when CHURCHOS_ENV=production.
 */
import { SignJWT, exportJWK, generateKeyPair, importJWK } from 'jose';
import type { JWK } from 'jose';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { SYNTHETIC_ISSUER } from '../../src/adapters/oidc/config.js';
import { SUBJECTS } from '../dev/seed.js';

const SUBJECT = /^synthetic-[a-z0-9-]{1,48}$/;

export async function init(dir: string, force = false) {
  const priv = join(dir, 'private.jwk.json'),
    pub = join(dir, 'jwks.json');
  if (!force && existsSync(priv) && existsSync(pub)) return { created: false, jwks: pub };
  mkdirSync(dir, { recursive: true });
  const { publicKey, privateKey } = await generateKeyPair('RS256', { extractable: true });
  const kid = 'synthetic-' + randomUUID();
  writeFileSync(priv, JSON.stringify({ ...(await exportJWK(privateKey)), kid, alg: 'RS256' }) + '\n', { mode: 0o600 });
  writeFileSync(
    pub,
    JSON.stringify({ keys: [{ ...(await exportJWK(publicKey)), kid, alg: 'RS256', use: 'sig' }] }) + '\n',
  );
  return { created: true, jwks: pub };
}

export async function token(dir: string, subject: string, audience = 'churchos-api', minutes = 15) {
  if (!SUBJECT.test(subject)) throw new Error('Synthetic subjects must look like synthetic-<name>');
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 15) throw new Error('Token lifetime must be 1-15 minutes');
  const jwk = JSON.parse(readFileSync(join(dir, 'private.jwk.json'), 'utf8')) as JWK;
  const key = await importJWK(jwk, 'RS256');
  return new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', kid: jwk.kid!, typ: 'JWT' })
    .setIssuer(SYNTHETIC_ISSUER)
    .setSubject(subject)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(`${minutes}m`)
    .sign(key);
}

function arg(args: string[], name: string, fallback: string) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

if (process.argv[1]?.endsWith('synthetic-identity/cli.js')) {
  if ((process.env.CHURCHOS_ENV ?? '').toLowerCase() === 'production') {
    console.error('Synthetic identity is not allowed when CHURCHOS_ENV=production');
    process.exit(2);
  }
  const [command, ...rest] = process.argv.slice(2);
  const dir = arg(rest, '--dir', '.synthetic');
  if (command === 'init') {
    const r = await init(dir, rest.includes('--force'));
    console.error(r.created ? `Created synthetic keys in ${dir}` : `Synthetic keys already exist in ${dir}`);
  } else if (command === 'token' && rest[0] && !rest[0].startsWith('--')) {
    console.log(await token(dir, rest[0], arg(rest, '--audience', 'churchos-api')));
  } else if (command === 'subjects') {
    for (const s of SUBJECTS) console.log(`${s.subject.padEnd(20)} ${s.description}`);
  } else {
    console.error('Usage: cli.js init|token <synthetic-subject>|subjects [--dir <dir>] [--audience <aud>]');
    process.exit(2);
  }
}
