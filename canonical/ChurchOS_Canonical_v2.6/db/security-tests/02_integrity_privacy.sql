\set ON_ERROR_STOP on
begin;

select set_config('church.tenant_id', '30000000-0000-0000-0000-000000000003', true);
select set_config('church.actor_ref', 'privacy-test-owner', true);
insert into church_core.tenant(id, slug, name, status, timezone)
values ('30000000-0000-0000-0000-000000000003', 'privacy-test', 'Privacy Test', 'ACTIVE', 'Asia/Seoul');

set local role church_os_app;
select set_config('church.actor_ref', 'privacy-test-app', true);

do $test$
declare
  audit_id uuid;
begin
  begin
    insert into church_integration.outbox_event(
      tenant_id, event_type, schema_version, purpose_code, payload
    ) values (
      '30000000-0000-0000-0000-000000000003',
      'integration.test', '1.0', 'SECURITY_TEST',
      '{"safe":{"nested":{"narrative":"protected text"}}}'::jsonb
    );
    raise exception 'protected narrative unexpectedly accepted';
  exception
    when check_violation then null;
  end;

  insert into church_integration.outbox_event(
    tenant_id, event_type, schema_version, purpose_code, payload
  ) values (
    '30000000-0000-0000-0000-000000000003',
    'integration.test', '1.0', 'SECURITY_TEST',
    '{"provider":"JLPRAYER","state":"CONNECTED","count":1}'::jsonb
  );

  audit_id := church_audit.append_event(
    'SECURITY_TEST', 'integration', null, 'SECURITY_TEST', 'ALLOW', 'trace-security-test'
  );
  if audit_id is null then
    raise exception 'audit append did not return id';
  end if;

  begin
    update church_audit.audit_event set decision = 'DENY' where id = audit_id;
    raise exception 'append-only audit unexpectedly updated';
  exception
    when insufficient_privilege then null;
    when object_not_in_prerequisite_state then null;
  end;
end
$test$;

reset role;

do $test$
begin
  begin
    update church_audit.audit_event
    set decision = 'DENY'
    where trace_id = 'trace-security-test';
    raise exception 'append-only trigger unexpectedly allowed owner update';
  exception
    when object_not_in_prerequisite_state then null;
  end;
end
$test$;

select 'PASS|PRIVACY|outbox guard and append-only audit enforced' as result;
rollback;

