begin;

create view church_security.v_rls_posture as
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'r'
  and n.nspname in ('church_core','church_access','church_integration','church_audit')
  and c.relname <> 'system_role_template';

create view church_security.v_fk_posture as
select
  ns.nspname as schema_name,
  rel.relname as table_name,
  con.conname as constraint_name,
  pg_get_constraintdef(con.oid) as definition
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
join pg_namespace ns on ns.oid = rel.relnamespace
where con.contype = 'f'
  and ns.nspname in ('church_core','church_access','church_integration','church_audit');

revoke all on church_security.v_rls_posture, church_security.v_fk_posture from public;

commit;

