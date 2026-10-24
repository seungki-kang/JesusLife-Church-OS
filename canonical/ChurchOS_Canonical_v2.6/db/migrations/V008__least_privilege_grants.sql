begin;

revoke all on schema church_core, church_access, church_integration, church_audit, church_security from public;
revoke all on all tables in schema church_core, church_access, church_integration, church_audit from public;
revoke all on all functions in schema church_security from public;

grant usage on schema church_core, church_access, church_integration, church_security to church_os_app;
grant select on church_core.tenant to church_os_app;
grant select, insert, update on
  church_core.campus,
  church_core.membership,
  church_core.community,
  church_core.community_member,
  church_core.church_event,
  church_core.attendance,
  church_core.care_task,
  church_core.ministry_assignment,
  church_core.brand_config
to church_os_app;
grant select, insert, update on church_access.external_subject_binding, church_access.tenant_role, church_access.membership_role to church_os_app;
grant select on church_access.system_role_template to church_os_app;
grant select, insert, update on
  church_integration.integration_connection,
  church_integration.external_state_ref,
  church_integration.outbox_event,
  church_integration.idempotency_record
to church_os_app;
grant execute on function church_security.current_tenant_id() to church_os_app;
grant execute on function church_security.current_actor_ref() to church_os_app;

create or replace function church_audit.append_event(
  p_action_code text,
  p_resource_type text,
  p_resource_ref text,
  p_purpose_code text,
  p_decision text,
  p_trace_id text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, church_audit, church_security
as $$
declare
  new_id uuid := gen_random_uuid();
  tenant_context uuid := church_security.current_tenant_id();
  actor_context text := church_security.current_actor_ref();
begin
  if tenant_context is null or actor_context is null then
    raise exception using errcode = '42501', message = 'verified tenant and actor context required';
  end if;
  if p_decision not in ('ALLOW','DENY','REDACT','SUPPRESS','HANDOFF') then
    raise exception using errcode = '22023', message = 'invalid audit decision';
  end if;
  insert into church_audit.audit_event(
    tenant_id, id, actor_ref, action_code, resource_type, resource_ref,
    purpose_code, decision, trace_id
  ) values (
    tenant_context, new_id, actor_context, p_action_code, p_resource_type,
    p_resource_ref, p_purpose_code, p_decision, p_trace_id
  );
  return new_id;
end
$$;

revoke all on function church_audit.append_event(text,text,text,text,text,text) from public;
grant usage on schema church_audit to church_os_app;
grant execute on function church_audit.append_event(text,text,text,text,text,text) to church_os_app;

grant usage on schema church_audit, church_security to church_os_auditor;
grant select on church_audit.audit_event to church_os_auditor;
grant execute on function church_security.current_tenant_id() to church_os_auditor;

-- Audit writes use the narrowly scoped SECURITY DEFINER command above.
-- Direct UPDATE/DELETE is deliberately not granted to either runtime role.

commit;

