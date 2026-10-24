\set ON_ERROR_STOP on

do $test$
declare
  protected_count integer;
  forced_count integer;
  migration_role_unsafe boolean;
begin
  select rolsuper or rolbypassrls
    into migration_role_unsafe
  from pg_roles where rolname = current_user;

  if coalesce(migration_role_unsafe, true) then
    raise exception 'security tests require a non-superuser non-BYPASSRLS owner/test role';
  end if;

  select count(*) into protected_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where c.relkind = 'r'
    and n.nspname in ('church_core','church_access','church_integration','church_audit')
    and c.relname <> 'system_role_template';

  select count(*) into forced_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where c.relkind = 'r'
    and n.nspname in ('church_core','church_access','church_integration','church_audit')
    and c.relname <> 'system_role_template'
    and c.relrowsecurity and c.relforcerowsecurity;

  if protected_count <> 23 or forced_count <> protected_count then
    raise exception 'RLS posture mismatch protected=% forced=%', protected_count, forced_count;
  end if;

  if not pg_has_role(current_user, 'church_os_app', 'MEMBER') then
    raise exception 'test runner must be granted church_os_app for SET ROLE tests';
  end if;
end
$test$;

select 'PASS|POSTURE|23 protected tables use ENABLE and FORCE RLS' as result;

