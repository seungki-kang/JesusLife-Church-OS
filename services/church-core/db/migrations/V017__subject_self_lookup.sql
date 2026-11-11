begin;
-- S02 / COS-JOIN-021: a signed-in person may list the churches they belong to.
-- Tenant isolation stays as is. These SELECT-only policies add rows tied to the caller's own
-- verified identity, which the server sets (transaction-local) only for that single read.
-- No tenant context is set in that transaction, and no write policy is added.

create or replace function church_security.current_subject_issuer()
returns text language sql stable security invoker set search_path = pg_catalog
as $$ select nullif(current_setting('church.subject_issuer', true), '') $$;

create or replace function church_security.current_subject_ref()
returns text language sql stable security invoker set search_path = pg_catalog
as $$ select nullif(current_setting('church.subject_ref', true), '') $$;

revoke all on function church_security.current_subject_issuer() from public;
revoke all on function church_security.current_subject_ref() from public;
grant execute on function church_security.current_subject_issuer() to church_os_app;
grant execute on function church_security.current_subject_ref() to church_os_app;

create policy subject_self_lookup on church_access.external_subject_binding
  for select to church_os_app
  using (
    status = 'ACTIVE'
    and issuer = church_security.current_subject_issuer()
    and subject_ref = church_security.current_subject_ref()
  );

create policy subject_self_lookup on church_core.membership
  for select to church_os_app
  using (exists (
    select 1 from church_access.external_subject_binding b
    where b.tenant_id = membership.tenant_id and b.membership_id = membership.id
      and b.status = 'ACTIVE'
      and b.issuer = church_security.current_subject_issuer()
      and b.subject_ref = church_security.current_subject_ref()
  ));

create policy subject_self_lookup on church_core.tenant
  for select to church_os_app
  using (exists (
    select 1 from church_access.external_subject_binding b
    where b.tenant_id = tenant.id
      and b.status = 'ACTIVE'
      and b.issuer = church_security.current_subject_issuer()
      and b.subject_ref = church_security.current_subject_ref()
  ));

create policy subject_self_lookup on church_access.membership_role
  for select to church_os_app
  using (exists (
    select 1 from church_access.external_subject_binding b
    where b.tenant_id = membership_role.tenant_id and b.membership_id = membership_role.membership_id
      and b.status = 'ACTIVE'
      and b.issuer = church_security.current_subject_issuer()
      and b.subject_ref = church_security.current_subject_ref()
  ));

create policy subject_self_lookup on church_access.tenant_role
  for select to church_os_app
  using (exists (
    select 1 from church_access.membership_role mr
    join church_access.external_subject_binding b
      on b.tenant_id = mr.tenant_id and b.membership_id = mr.membership_id
    where mr.tenant_id = tenant_role.tenant_id and mr.role_id = tenant_role.id
      and b.status = 'ACTIVE'
      and b.issuer = church_security.current_subject_issuer()
      and b.subject_ref = church_security.current_subject_ref()
  ));
commit;
