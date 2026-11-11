begin;

insert into church_access.system_role_template(code, description)
values
  ('MEMBER', 'Church member'),
  ('GROUP_LEADER', 'Group or cell leader'),
  ('MINISTRY_LEADER', 'Ministry team leader'),
  ('PASTOR', 'Pastoral operational role'),
  ('TENANT_ADMIN', 'Tenant configuration administrator'),
  ('AUDITOR', 'Read-only audit role')
on conflict (code) do update set description = excluded.description;

create index ix_membership_status on church_core.membership(tenant_id, status);
create index ix_community_parent on church_core.community(tenant_id, parent_id);
create index ix_event_time on church_core.church_event(tenant_id, starts_at);
create index ix_care_status_due on church_core.care_task(tenant_id, status, due_at);
create index ix_assignment_member on church_core.ministry_assignment(tenant_id, membership_id, status);
create index ix_outbox_delivery on church_integration.outbox_event(tenant_id, status, available_at);
create index ix_audit_time on church_audit.audit_event(tenant_id, occurred_at desc);

commit;

