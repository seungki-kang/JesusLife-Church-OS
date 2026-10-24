\set ON_ERROR_STOP on
begin;

select set_config('church.tenant_id','50000000-0000-0000-0000-000000000005',true);

do $$
begin
  if to_regclass('church_integration.handoff_grant') is null then
    raise exception 'handoff_grant missing';
  end if;
  if not exists (
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='church_integration' and c.relname='handoff_grant'
      and c.relrowsecurity and c.relforcerowsecurity
  ) then
    raise exception 'handoff_grant must ENABLE and FORCE RLS';
  end if;
  if not exists (
    select 1 from information_schema.role_table_grants
    where table_schema='church_integration' and table_name='handoff_grant'
      and grantee='church_os_app' and privilege_type='INSERT'
  ) then
    raise exception 'church_os_app handoff INSERT grant missing';
  end if;
  if has_table_privilege('church_os_app','church_integration.handoff_grant','UPDATE') then
    raise exception 'church_os_app must not have table-wide handoff UPDATE';
  end if;
  if not has_column_privilege('church_os_app','church_integration.handoff_grant','consumed_at','UPDATE') then
    raise exception 'church_os_app must update consumed_at';
  end if;
  if not exists (
    select 1 from pg_constraint where conname='handoff_registered_return_uri'
  ) then
    raise exception 'registered return URI constraint missing';
  end if;
end $$;

insert into church_core.tenant(id,slug,name,status,timezone)
values ('50000000-0000-0000-0000-000000000005','handoff-test','handoff test','ACTIVE','UTC');
insert into church_integration.registered_return_uri(tenant_id,provider,return_uri)
values ('50000000-0000-0000-0000-000000000005','JLPRAYER','https://app.example.invalid/return');

set local role church_os_app;
select set_config('church.tenant_id','50000000-0000-0000-0000-000000000005',true);
select set_config('church.actor_ref','test-actor',true);
insert into church_integration.handoff_grant(
 tenant_id,actor_ref,provider,capability,purpose_code,return_uri,token_hash,idempotency_key,expires_at
) values (
 '50000000-0000-0000-0000-000000000005','test-actor','JLPRAYER','OPEN_PRAYER_NOTE','USER_HANDOFF',
 'https://app.example.invalid/return',repeat('a',64),'handoff-test-valid',now()+interval '5 minutes'
);
update church_integration.handoff_grant set consumed_at=now() where idempotency_key='handoff-test-valid';

do $$
begin
  begin
    update church_integration.handoff_grant set consumed_at=null where idempotency_key='handoff-test-valid';
    raise exception 'consumed handoff reopened';
  exception when sqlstate '55000' then null; end;
  begin
    insert into church_integration.handoff_grant(tenant_id,actor_ref,provider,capability,purpose_code,return_uri,token_hash,idempotency_key,expires_at)
    values ('50000000-0000-0000-0000-000000000005','test-actor','JLPRAYER','OPEN_PRAYER_NOTE','USER_HANDOFF','https://app.example.invalid/return','plain-token','handoff-test-plain',now()+interval '5 minutes');
    raise exception 'plain token accepted';
  exception when check_violation then null; end;
  begin
    insert into church_integration.handoff_grant(tenant_id,actor_ref,provider,capability,purpose_code,return_uri,token_hash,idempotency_key,expires_at)
    values ('50000000-0000-0000-0000-000000000005','test-actor','JLPRAYER','OPEN_PRAYER_NOTE','USER_HANDOFF','https://evil.example/return',repeat('b',64),'handoff-test-uri',now()+interval '5 minutes');
    raise exception 'unregistered return URI accepted';
  exception when foreign_key_violation then null; end;
  begin
    insert into church_integration.handoff_grant(tenant_id,actor_ref,provider,capability,purpose_code,return_uri,token_hash,idempotency_key,expires_at)
    values ('50000000-0000-0000-0000-000000000005','test-actor','JLPRAYER','OPEN_PRAYER_NOTE','USER_HANDOFF','https://app.example.invalid/return',repeat('c',64),'handoff-test-expiry',now()+interval '30 days');
    raise exception 'excessive expiry accepted';
  exception when check_violation then null; end;
end $$;
reset role;

select 'PASS|HANDOFF|hash expiry allowlist RLS and one-way state controls present' as result;
rollback;
