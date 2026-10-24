\set ON_ERROR_STOP on
begin;

select set_config('church.tenant_id', '40000000-0000-0000-0000-000000000004', true);
select set_config('church.actor_ref', 'integrity-test-owner', true);
insert into church_core.tenant(id, slug, name, status, timezone)
values ('40000000-0000-0000-0000-000000000004', 'integrity-test', 'Integrity Test', 'ACTIVE', 'Asia/Seoul');

do $test$
declare
  before_version bigint;
  after_version bigint;
  role_count integer;
begin
  select row_version into before_version from church_core.tenant
  where id = '40000000-0000-0000-0000-000000000004';
  update church_core.tenant set name = 'Integrity Test Updated'
  where id = '40000000-0000-0000-0000-000000000004';
  select row_version into after_version from church_core.tenant
  where id = '40000000-0000-0000-0000-000000000004';
  if after_version <> before_version + 1 then
    raise exception 'row_version trigger failed before=% after=%', before_version, after_version;
  end if;

  insert into church_access.system_role_template(code, description)
  values ('MEMBER', 'Church member')
  on conflict (code) do update set description = excluded.description;
  select count(*) into role_count from church_access.system_role_template where code = 'MEMBER';
  if role_count <> 1 then
    raise exception 'role seed is not idempotent count=%', role_count;
  end if;
end
$test$;

select 'PASS|INTEGRITY|touch trigger and role seed idempotency enforced' as result;
rollback;

