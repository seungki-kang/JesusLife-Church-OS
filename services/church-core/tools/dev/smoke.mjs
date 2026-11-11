// Smoke test for the dev stack. Usage: node tools/dev/smoke.mjs <base-url> <member-token> <stranger-token>
const [base, member, stranger] = process.argv.slice(2);
if (!base || !member || !stranger) throw new Error('usage: smoke.mjs <base-url> <member-token> <stranger-token>');
const get = async (path, token, tenant) => {
  const headers = { authorization: 'Bearer ' + token, 'x-purpose-code': 'CHURCH_OPERATION' };
  if (tenant) headers['x-church-tenant'] = tenant;
  const r = await fetch(base + path, { headers });
  return { status: r.status, mode: r.headers.get('x-identity-mode'), body: await r.json() };
};
const fail = (msg) => {
  console.error('SMOKE_FAIL ' + msg);
  process.exit(1);
};
const mine = await get('/api/v1/church/me/churches', member);
if (mine.status !== 200 || mine.mode !== 'SYNTHETIC') fail('me/churches ' + mine.status + ' ' + mine.mode);
if (mine.body.items.length !== 2) fail('expected 2 churches, got ' + mine.body.items.length);
for (const church of mine.body.items) {
  const n = await get('/api/v1/church/notices', member, church.tenantId);
  if (n.status !== 200 || !n.body.items.length) fail('notices in ' + church.name + ': ' + n.status);
}
if ((await get('/api/v1/church/me/churches', stranger)).body.items.length !== 0) fail('stranger sees churches');
const denied = await get('/api/v1/church/notices', stranger, mine.body.items[0].tenantId);
if (denied.status !== 403) fail('stranger notices status ' + denied.status);
console.log('DEV_STACK_SMOKE_PASS');
