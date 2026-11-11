begin;

create extension if not exists pgcrypto;

create schema if not exists church_core;
create schema if not exists church_access;
create schema if not exists church_integration;
create schema if not exists church_audit;
create schema if not exists church_security;

do $block$
begin
  if not exists (select 1 from pg_roles where rolname = 'church_os_app') then
    create role church_os_app nologin nosuperuser nocreatedb nocreaterole noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'church_os_auditor') then
    create role church_os_auditor nologin nosuperuser nocreatedb nocreaterole noinherit;
  end if;
exception
  when insufficient_privilege then
    raise exception 'role bootstrap requires CREATEROLE; provision church_os_app and church_os_auditor before retrying';
end
$block$;

create or replace function church_security.current_tenant_id()
returns uuid
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select nullif(current_setting('church.tenant_id', true), '')::uuid
$$;

create or replace function church_security.current_actor_ref()
returns text
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select nullif(current_setting('church.actor_ref', true), '')
$$;

create or replace function church_security.touch_row()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  new.updated_at := clock_timestamp();
  new.row_version := old.row_version + 1;
  if tg_table_schema = 'church_core' and tg_table_name = 'brand_config' then
    new.version := old.version + 1;
  end if;
  return new;
end
$$;

comment on function church_security.current_tenant_id() is
  'Returns server-established transaction-local tenant context. Client headers alone must never set this value.';

commit;

