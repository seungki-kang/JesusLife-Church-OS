/**
 * Identity provider selection (S02, gate "real vs synthetic provider").
 *
 * - OIDC (default): a real provider over HTTPS. Synthetic issuers are refused.
 * - SYNTHETIC: local development only. Tokens are signed by the developer's own key
 *   (tools/synthetic-identity) under a fixed issuer in the reserved `.invalid` domain,
 *   so they can never be mistaken for, or accepted as, real accounts. Refused when
 *   CHURCHOS_ENV=production. Every response then carries `X-Identity-Mode: SYNTHETIC`.
 *
 * Token tenant/role claims are ignored in both modes; ChurchOS DB owns membership and roles.
 */
import { createLocalJWKSet } from 'jose';
import type { JSONWebKeySet } from 'jose';
import { readFileSync } from 'node:fs';
import type { IdentityMode, IdentityPort } from '../../application/ports.js';
import { JwtIdentity, remoteIdentity } from './identity.js';

export const SYNTHETIC_ISSUER = 'https://synthetic-identity.churchos.invalid';
export type Env = Readonly<Record<string, string | undefined>>;

const isSyntheticHost = (url: string) => new URL(url).hostname.endsWith('.invalid');
function need(env: Env, key: string): string {
  const value = env[key];
  if (!value) throw new Error(`Missing required configuration: ${key}`);
  return value;
}

export function identityFromEnv(
  env: Env,
  readFile: (path: string) => string = (p) => readFileSync(p, 'utf8'),
): { mode: IdentityMode; identity: IdentityPort } {
  const requested = (env.IDENTITY_MODE ?? 'oidc').toLowerCase();
  if (requested === 'oidc') {
    const issuer = need(env, 'OIDC_ISSUER');
    const jwks = need(env, 'OIDC_JWKS_URL');
    if (isSyntheticHost(issuer) || isSyntheticHost(jwks))
      throw new Error('A synthetic (.invalid) identity provider is not allowed in OIDC mode');
    return { mode: 'OIDC', identity: remoteIdentity(issuer, need(env, 'OIDC_AUDIENCE'), jwks) };
  }
  if (requested === 'synthetic') {
    if ((env.CHURCHOS_ENV ?? '').toLowerCase() === 'production')
      throw new Error('Synthetic identity is not allowed when CHURCHOS_ENV=production');
    if (env.OIDC_ISSUER && env.OIDC_ISSUER !== SYNTHETIC_ISSUER)
      throw new Error(`Synthetic identity only accepts the issuer ${SYNTHETIC_ISSUER}`);
    if (env.OIDC_JWKS_URL) throw new Error('Synthetic identity reads SYNTHETIC_JWKS_FILE, not OIDC_JWKS_URL');
    let jwks: JSONWebKeySet;
    try {
      jwks = JSON.parse(readFile(need(env, 'SYNTHETIC_JWKS_FILE'))) as JSONWebKeySet;
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('Missing required')) throw e;
      throw new Error('SYNTHETIC_JWKS_FILE is not a readable JWKS JSON file', { cause: e });
    }
    if (!Array.isArray(jwks.keys) || !jwks.keys.length || jwks.keys.some((k) => 'd' in k))
      throw new Error('SYNTHETIC_JWKS_FILE must hold public keys only');
    return {
      mode: 'SYNTHETIC',
      identity: new JwtIdentity(createLocalJWKSet(jwks), SYNTHETIC_ISSUER, need(env, 'OIDC_AUDIENCE')),
    };
  }
  throw new Error('IDENTITY_MODE must be oidc or synthetic');
}
