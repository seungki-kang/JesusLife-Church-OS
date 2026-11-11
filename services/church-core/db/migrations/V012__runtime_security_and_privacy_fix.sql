begin;

-- Trigger functions are invoked by church_os_app and therefore require EXECUTE
-- after V008 revoked all functions in church_security from PUBLIC.
grant execute on function church_security.jsonb_has_forbidden_key(jsonb) to church_os_app;
grant execute on function church_security.guard_outbox_payload() to church_os_app;

-- Reject common raw-content aliases recursively, including Life Diary question keys.
create or replace function church_security.jsonb_has_forbidden_key(document jsonb)
returns boolean
language plpgsql
immutable
strict
security invoker
set search_path = pg_catalog
as $$
declare
  key_name text;
  child jsonb;
begin
  if jsonb_typeof(document) = 'object' then
    for key_name, child in select key, value from jsonb_each(document)
    loop
      if lower(key_name) in (
        'narrative','life_diary_raw','diary_text','prayer_text','prayer_request',
        'prayer','declaration','confession','reflection','testimony','testimony_text',
        'counseling_note','operational_note','free_text','raw_content','body'
      ) or lower(key_name) ~ '^q[0-9]+(_.*)?$' then
        return true;
      end if;
      if church_security.jsonb_has_forbidden_key(child) then return true; end if;
    end loop;
  elsif jsonb_typeof(document) = 'array' then
    for child in select value from jsonb_array_elements(document)
    loop
      if church_security.jsonb_has_forbidden_key(child) then return true; end if;
    end loop;
  end if;
  return false;
end
$$;

-- Per-member Life Diary and CHGO state is not a Church OS record.
alter table church_integration.external_state_ref no force row level security;
delete from church_integration.external_state_ref
where provider in ('LIFE_DIARY','CHGO');
alter table church_integration.external_state_ref
  drop constraint external_state_ref_provider_check;
alter table church_integration.external_state_ref
  add constraint external_state_ref_provider_check
  check (provider in ('JLPRAYER','JLBIBLE','NEORANG_NARANG'));
alter table church_integration.external_state_ref force row level security;

-- Care stores bounded workflow codes, never free-form counseling or prayer text.
alter table church_core.care_task no force row level security;
alter table church_core.care_task
  add column operational_code text
  check (operational_code is null or operational_code in (
    'WELCOME_CALL','CONTACT_ATTEMPTED','VISIT_SCHEDULED','REFERRED','NO_RESPONSE','OTHER_NO_TEXT'
  ));
update church_core.care_task set operational_note=null where operational_note is not null;
alter table church_core.care_task
  add constraint care_task_no_free_text check (operational_note is null);
alter table church_core.care_task force row level security;

-- Connect the previously orphaned campus aggregate to operational events.
alter table church_core.church_event add column campus_id uuid;
alter table church_core.church_event
  add constraint church_event_campus_fk foreign key (tenant_id,campus_id)
  references church_core.campus(tenant_id,id);

-- Canonical white-label document; legacy columns remain temporarily as derived fields.
alter table church_core.brand_config add column config jsonb;
alter table church_core.brand_config add constraint brand_config_document_shape check (
  config is null or (
    config->>'schemaVersion'='1.0'
    and jsonb_typeof(config->'display')='object'
    and jsonb_typeof(config->'colors')='object'
    and jsonb_typeof(config->'navigation')='array'
    and jsonb_typeof(config->'modules')='object'
    and jsonb_typeof(config->'locale')='object'
    and jsonb_typeof(config->'distribution')='object'
  )
);

-- P0 notices, delivery state, and opaque file metadata.
create table church_core.notice (
  tenant_id uuid not null references church_core.tenant(id), id uuid not null default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 1 and 160),
  body text not null check (length(btrim(body)) between 1 and 4000),
  audience text not null check (audience in ('ALL_MEMBERS','LEADERS','STAFF')),
  status text not null check (status in ('DRAFT','PUBLISHED','EXPIRED','CANCELLED')),
  publish_at timestamptz not null, expires_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  row_version bigint not null default 1 check (row_version>0), primary key (tenant_id,id),
  check (expires_at is null or expires_at>publish_at)
);
create table church_core.file_asset (
  tenant_id uuid not null references church_core.tenant(id), id uuid not null default gen_random_uuid(),
  owner_type text not null check (owner_type in ('NOTICE','EVENT')), owner_id uuid not null,
  object_ref text not null check (object_ref ~ '^asset:[a-zA-Z0-9/_-]{1,180}$'),
  media_type text not null check (length(media_type) between 3 and 100),
  byte_size bigint not null check (byte_size between 1 and 26214400),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'), created_at timestamptz not null default now(),
  primary key (tenant_id,id)
);
create table church_core.notification_delivery (
  tenant_id uuid not null references church_core.tenant(id), id uuid not null default gen_random_uuid(),
  notice_id uuid not null, membership_id uuid not null,
  channel text not null check (channel in ('IN_APP','PUSH','EMAIL')),
  status text not null check (status in ('QUEUED','SENT','FAILED','READ')), delivered_at timestamptz,
  primary key (tenant_id,id),
  foreign key (tenant_id,notice_id) references church_core.notice(tenant_id,id),
  foreign key (tenant_id,membership_id) references church_core.membership(tenant_id,id),
  unique (tenant_id,notice_id,membership_id,channel)
);
alter table church_core.notice enable row level security;
alter table church_core.notice force row level security;
alter table church_core.file_asset enable row level security;
alter table church_core.file_asset force row level security;
alter table church_core.notification_delivery enable row level security;
alter table church_core.notification_delivery force row level security;
create policy tenant_isolation on church_core.notice using (tenant_id=church_security.current_tenant_id()) with check (tenant_id=church_security.current_tenant_id());
create policy tenant_isolation on church_core.file_asset using (tenant_id=church_security.current_tenant_id()) with check (tenant_id=church_security.current_tenant_id());
create policy tenant_isolation on church_core.notification_delivery using (tenant_id=church_security.current_tenant_id()) with check (tenant_id=church_security.current_tenant_id());
grant select,insert,update on church_core.notice,church_core.file_asset,church_core.notification_delivery to church_os_app;
create trigger trg_notice_touch before update on church_core.notice
  for each row execute function church_security.touch_row();

-- Return URIs are tenant/provider allowlisted. Secrets and raw tokens are excluded.
create table church_integration.registered_return_uri (
  tenant_id uuid not null references church_core.tenant(id),
  provider text not null check (provider in ('JLPRAYER','JLBIBLE','LIFE_DIARY','NEORANG_NARANG','CHGO')),
  return_uri text not null check (length(return_uri)<=500 and return_uri ~ '^https://'),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (tenant_id, provider, return_uri)
);
alter table church_integration.registered_return_uri enable row level security;
alter table church_integration.registered_return_uri force row level security;
create policy tenant_isolation on church_integration.registered_return_uri
  using (tenant_id=church_security.current_tenant_id())
  with check (tenant_id=church_security.current_tenant_id());

alter table church_integration.handoff_grant
  add constraint handoff_token_hash_format check (token_hash ~ '^[0-9a-f]{64}$'),
  add constraint handoff_expiry_limit check (expires_at <= created_at + interval '10 minutes'),
  add constraint handoff_registered_return_uri foreign key (tenant_id,provider,return_uri)
    references church_integration.registered_return_uri(tenant_id,provider,return_uri);

create or replace function church_security.guard_handoff_mutation()
returns trigger
language plpgsql
security invoker
set search_path=pg_catalog
as $$
begin
  if new.tenant_id<>old.tenant_id or new.actor_ref<>old.actor_ref
     or new.provider<>old.provider or new.capability<>old.capability
     or new.purpose_code<>old.purpose_code or new.return_uri<>old.return_uri
     or new.token_hash<>old.token_hash or new.idempotency_key<>old.idempotency_key
     or new.expires_at<>old.expires_at or new.created_at<>old.created_at then
    raise exception using errcode='55000',message='handoff immutable fields cannot change';
  end if;
  if old.consumed_at is not null and new.consumed_at is distinct from old.consumed_at then
    raise exception using errcode='55000',message='consumed handoff cannot be reopened';
  end if;
  if old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at then
    raise exception using errcode='55000',message='revoked handoff cannot be restored';
  end if;
  return new;
end
$$;
create trigger trg_handoff_immutable before update on church_integration.handoff_grant
  for each row execute function church_security.guard_handoff_mutation();

revoke update on church_integration.handoff_grant from church_os_app;
grant update(consumed_at,revoked_at) on church_integration.handoff_grant to church_os_app;
grant select,insert,update,delete on church_integration.registered_return_uri to church_os_app;
grant select on church_audit.audit_event to church_os_app;
grant execute on function church_security.guard_handoff_mutation() to church_os_app;

commit;
