\set ON_ERROR_STOP on
begin;

select set_config('church.actor_ref', 'security-test-owner', true);
select set_config('church.tenant_id', '10000000-0000-0000-0000-000000000001', true);
insert into church_core.tenant(id, slug, name, status, timezone)
values ('10000000-0000-0000-0000-000000000001', 'security-test-a', 'Security Test A', 'ACTIVE', 'Asia/Seoul');
insert into church_core.membership(tenant_id, id, person_ref, status)
values (
  '10000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000001',
  '11100000-0000-0000-0000-000000000001',
  'ACTIVE'
);

select set_config('church.tenant_id', '20000000-0000-0000-0000-000000000002', true);
insert into church_core.tenant(id, slug, name, status, timezone)
values ('20000000-0000-0000-0000-000000000002', 'security-test-b', 'Security Test B', 'ACTIVE', 'Asia/Seoul');
insert into church_core.community(tenant_id, id, kind, name, status)
values (
  '20000000-0000-0000-0000-000000000002',
  '22000000-0000-0000-0000-000000000002',
  'TEAM', 'Tenant B Team', 'ACTIVE'
);

set local role church_os_app;
select set_config('church.actor_ref', 'security-test-app', true);
select set_config('church.tenant_id', '10000000-0000-0000-0000-000000000001', true);

do $test$
declare
  visible_b integer;
begin
  select count(*) into visible_b
  from church_core.tenant
  where id = '20000000-0000-0000-0000-000000000002';
  if visible_b <> 0 then
    raise exception 'RLS leak: tenant A can see tenant B';
  end if;

  begin
    insert into church_core.ministry_assignment(
      tenant_id, membership_id, community_id, role_code,
      assignment_basis, status, starts_on
    ) values (
      '10000000-0000-0000-0000-000000000001',
      '11000000-0000-0000-0000-000000000001',
      '22000000-0000-0000-0000-000000000002',
      'HELPER', array['VOLUNTEERED'], 'PROPOSED', current_date
    );
    raise exception 'cross-tenant FK unexpectedly accepted';
  exception
    when foreign_key_violation then null;
  end;
end
$test$;

reset role;
select 'PASS|TENANT|RLS and composite FK block cross-tenant access' as result;
rollback;

