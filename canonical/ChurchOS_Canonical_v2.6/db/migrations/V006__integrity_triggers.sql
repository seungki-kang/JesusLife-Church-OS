begin;

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
        'narrative', 'life_diary_raw', 'diary_text', 'prayer_text',
        'prayer_request', 'testimony_text', 'counseling_note', 'raw_content'
      ) then
        return true;
      end if;
      if church_security.jsonb_has_forbidden_key(child) then
        return true;
      end if;
    end loop;
  elsif jsonb_typeof(document) = 'array' then
    for child in select value from jsonb_array_elements(document)
    loop
      if church_security.jsonb_has_forbidden_key(child) then
        return true;
      end if;
    end loop;
  end if;
  return false;
end
$$;

create or replace function church_security.guard_outbox_payload()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, church_security
as $$
begin
  if church_security.jsonb_has_forbidden_key(new.payload) then
    raise exception using
      errcode = '23514',
      message = 'protected raw content is forbidden in outbox payload';
  end if;
  return new;
end
$$;

create trigger trg_outbox_guard
before insert or update of payload on church_integration.outbox_event
for each row execute function church_security.guard_outbox_payload();

create or replace function church_security.deny_audit_mutation()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  raise exception using errcode = '55000', message = 'audit_event is append-only';
end
$$;

create trigger trg_audit_append_only
before update or delete on church_audit.audit_event
for each row execute function church_security.deny_audit_mutation();

do $block$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    'church_core.tenant',
    'church_core.campus',
    'church_core.membership',
    'church_core.community',
    'church_core.church_event',
    'church_core.care_task',
    'church_core.ministry_assignment',
    'church_core.brand_config',
    'church_integration.integration_connection',
    'church_integration.external_state_ref',
    'church_integration.outbox_event'
  ]
  loop
    execute format(
      'create trigger trg_touch_row before update on %s for each row execute function church_security.touch_row()',
      relation_name
    );
  end loop;
end
$block$;

commit;

