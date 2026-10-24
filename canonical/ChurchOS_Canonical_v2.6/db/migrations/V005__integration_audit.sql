begin;

create table church_integration.integration_connection (
  tenant_id uuid not null references church_core.tenant(id),
  id uuid not null default gen_random_uuid(),
  provider text not null check (provider in ('JLPRAYER','JLBIBLE','LIFE_DIARY','NEORANG_NARANG','CHGO')),
  status text not null check (status in ('CONNECTED','DEGRADED','DISCONNECTED','NOT_CONFIGURED')),
  secret_ref text,
  last_successful_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version bigint not null default 1 check (row_version > 0),
  primary key (tenant_id, id),
  unique (tenant_id, provider)
);

create table church_integration.external_state_ref (
  tenant_id uuid not null,
  id uuid not null default gen_random_uuid(),
  membership_id uuid not null,
  provider text not null check (provider in ('JLPRAYER','JLBIBLE','LIFE_DIARY','NEORANG_NARANG','CHGO')),
  capability text not null check (length(capability) between 1 and 80),
  opaque_ref text not null check (length(opaque_ref) between 1 and 500),
  state_code text not null check (length(state_code) between 1 and 80),
  state_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version bigint not null default 1 check (row_version > 0),
  primary key (tenant_id, id),
  unique (tenant_id, membership_id, provider, capability),
  foreign key (tenant_id, membership_id) references church_core.membership(tenant_id, id)
);

create table church_integration.outbox_event (
  tenant_id uuid not null references church_core.tenant(id),
  id uuid not null default gen_random_uuid(),
  message_id uuid not null default gen_random_uuid(),
  event_type text not null,
  schema_version text not null,
  purpose_code text not null check (purpose_code ~ '^[A-Z][A-Z0-9_]{2,63}$'),
  payload jsonb not null,
  status text not null default 'PENDING' check (status in ('PENDING','DELIVERED','FAILED','QUARANTINED')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  available_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version bigint not null default 1 check (row_version > 0),
  primary key (tenant_id, id),
  unique (tenant_id, message_id)
);

create table church_integration.idempotency_record (
  tenant_id uuid not null references church_core.tenant(id),
  id uuid not null default gen_random_uuid(),
  actor_ref text not null,
  route_key text not null,
  idempotency_key text not null check (length(idempotency_key) between 16 and 128),
  request_hash text not null,
  response_code integer check (response_code between 100 and 599),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (tenant_id, id),
  unique (tenant_id, actor_ref, route_key, idempotency_key),
  check (expires_at > created_at)
);

create table church_audit.audit_event (
  tenant_id uuid not null references church_core.tenant(id),
  id uuid not null default gen_random_uuid(),
  actor_ref text not null,
  action_code text not null,
  resource_type text not null,
  resource_ref text,
  purpose_code text not null check (purpose_code ~ '^[A-Z][A-Z0-9_]{2,63}$'),
  decision text not null check (decision in ('ALLOW','DENY','REDACT','SUPPRESS','HANDOFF')),
  trace_id text not null,
  occurred_at timestamptz not null default now(),
  primary key (tenant_id, id)
);

commit;

