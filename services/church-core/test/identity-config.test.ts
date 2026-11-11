import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT, exportJWK, generateKeyPair } from 'jose';
import { identityFromEnv, SYNTHETIC_ISSUER } from '../src/adapters/oidc/config.js';
import { buildApp } from '../src/adapters/http/app.js';
import type { StorePort } from '../src/application/ports.js';

const real = {
  OIDC_ISSUER: 'https://login.example.org',
  OIDC_AUDIENCE: 'churchos-api',
  OIDC_JWKS_URL: 'https://login.example.org/jwks',
};
const { publicKey, privateKey } = await generateKeyPair('RS256', { extractable: true });
const publicJwks = JSON.stringify({ keys: [{ ...(await exportJWK(publicKey)), kid: 'synthetic-1', alg: 'RS256' }] });
const privateJwks = JSON.stringify({ keys: [await exportJWK(privateKey)] });
const synthetic = { IDENTITY_MODE: 'synthetic', OIDC_AUDIENCE: 'churchos-api', SYNTHETIC_JWKS_FILE: '/keys/jwks.json' };
const files = (content: string) => () => content;
const sign = (iss: string, sub = 'synthetic-member') =>
  new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', kid: 'synthetic-1' })
    .setIssuer(iss)
    .setSubject(sub)
    .setAudience('churchos-api')
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(privateKey);

test('real OIDC mode is the default and refuses synthetic or non-HTTPS providers', () => {
  assert.equal(identityFromEnv(real).mode, 'OIDC');
  assert.throws(() => identityFromEnv({ ...real, OIDC_JWKS_URL: undefined }), /OIDC_JWKS_URL/);
  assert.throws(() => identityFromEnv({ ...real, OIDC_ISSUER: SYNTHETIC_ISSUER }), /not allowed in OIDC mode/);
  assert.throws(() => identityFromEnv({ ...real, OIDC_JWKS_URL: 'http://login.example.org/jwks' }), /HTTPS/);
  assert.throws(() => identityFromEnv({ ...real, IDENTITY_MODE: 'demo' }), /oidc or synthetic/);
});

test('synthetic mode is refused in production and only accepts its own issuer and public keys', () => {
  assert.throws(() => identityFromEnv({ ...synthetic, CHURCHOS_ENV: 'production' }, files(publicJwks)), /production/);
  assert.throws(
    () => identityFromEnv({ ...synthetic, OIDC_ISSUER: 'https://login.example.org' }, files(publicJwks)),
    /only accepts the issuer/,
  );
  assert.throws(
    () => identityFromEnv({ ...synthetic, OIDC_JWKS_URL: real.OIDC_JWKS_URL }, files(publicJwks)),
    /JWKS_FILE/,
  );
  assert.throws(() => identityFromEnv({ ...synthetic, SYNTHETIC_JWKS_FILE: undefined }), /SYNTHETIC_JWKS_FILE/);
  assert.throws(() => identityFromEnv(synthetic, files('not json')), /readable JWKS/);
  assert.throws(() => identityFromEnv(synthetic, files(privateJwks)), /public keys only/);
  assert.equal(identityFromEnv(synthetic, files(publicJwks)).mode, 'SYNTHETIC');
});

test('synthetic identity verifies only synthetic-issuer tokens signed by the local key', async () => {
  const { identity } = identityFromEnv(synthetic, files(publicJwks));
  assert.deepEqual(await identity.verify(await sign(SYNTHETIC_ISSUER)), {
    issuer: SYNTHETIC_ISSUER,
    subject: 'synthetic-member',
  });
  await assert.rejects(identity.verify(await sign('https://login.example.org')));
});

const store: StorePort = { ready: async () => true, myChurches: async () => [], scoped: async () => null as never };
async function health(mode?: 'OIDC' | 'SYNTHETIC') {
  const app = await buildApp(
    { verify: async () => ({ issuer: 'i', subject: 's' }) },
    store,
    { record: () => {} },
    () => {},
    mode,
  );
  const r = await app.getHttpAdapter().getInstance().inject({ method: 'GET', url: '/health/ready' });
  await app.close();
  return r;
}

test('synthetic sessions are labelled on every response; real ones are not', async () => {
  const s = await health('SYNTHETIC');
  assert.equal(s.headers['x-identity-mode'], 'SYNTHETIC');
  assert.equal(s.json().identity, 'SYNTHETIC');
  const r = await health();
  assert.equal(r.headers['x-identity-mode'], undefined);
  assert.equal(r.json().identity, 'OIDC');
});
