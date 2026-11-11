import {test} from 'node:test';import assert from 'node:assert/strict';import {EXPECTED,assess} from '../integration/evidence.js';
const hashes=Object.fromEntries(Array.from({length:15},(_,i)=>['V'+i,'digest'+i]));
function fixture(){return {postgres_version_num:160015,checks:EXPECTED.map(id=>({id,status:'PASS'})),migration_hashes:{...hashes}};}
test('integration evidence requires every planned stage',()=>assert.equal(assess(fixture(),hashes),true));
test('missing HTTP check never passes',()=>{const r=fixture();r.checks.splice(6,1);assert.equal(assess(r,hashes),false);});
test('failed assertion never passes',()=>{const r=fixture();r.checks[5].status='FAIL';assert.equal(assess(r,hashes),false);});
test('wrong PostgreSQL major rejected',()=>{const r=fixture();r.postgres_version_num=170000;assert.equal(assess(r,hashes),false);});
test('migration checksum mismatch rejected',()=>{const r=fixture();r.migration_hashes.V0='different';assert.equal(assess(r,hashes),false);});
test('duplicate check rejected',()=>{const r=fixture();r.checks.push(r.checks[0]);assert.equal(assess(r,hashes),false);});
