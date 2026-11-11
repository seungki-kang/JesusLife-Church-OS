begin;

alter table church_core.tenant enable row level security;
alter table church_core.tenant force row level security;
create policy tenant_isolation on church_core.tenant
  using (id = church_security.current_tenant_id())
  with check (id = church_security.current_tenant_id());

do $block$
declare
  relation_name text;
  policy_name text;
begin
  foreach relation_name in array array[
    'church_core.campus',
    'church_core.membership',
    'church_access.external_subject_binding',
    'church_access.tenant_role',
    'church_access.membership_role',
    'church_core.community',
    'church_core.community_member',
    'church_core.church_event',
    'church_core.attendance',
    'church_core.care_task',
    'church_core.ministry_assignment',
    'church_core.brand_config',
    'church_integration.integration_connection',
    'church_integration.external_state_ref',
    'church_integration.outbox_event',
    'church_integration.idempotency_record',
    'church_audit.audit_event'
  ]
  loop
    policy_name := replace(relation_name, '.', '_') || '_tenant_isolation';
    execute format('alter table %s enable row level security', relation_name);
    execute format('alter table %s force row level security', relation_name);
    execute format(
      'create policy %I on %s using (tenant_id = church_security.current_tenant_id()) with check (tenant_id = church_security.current_tenant_id())',
      policy_name,
      relation_name
    );
  end loop;
end
$block$;

commit;

