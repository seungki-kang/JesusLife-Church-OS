begin;

-- Short-lived, one-time handoff to a specialist JesusLife One product.
-- Raw tokens are never persisted; only their cryptographic hash is stored.
create table church_integration.handoff_grant (
  tenant_id uuid not null references church_core.tenant(id),
  id uuid not null default gen_random_uuid(),
  actor_ref text not null check (length(btrim(actor_ref)) > 0),
  provider text not null check (provider in ('JLPRAYER','JLBIBLE','LIFE_DIARY','NEORANG_NARANG','CHGO')),
  capability text not null check (length(capability) between 1 and 80),
  purpose_code text not null check (purpose_code ~ '^[A-Z][A-Z0-9_]{2,63}$'),
  return_uri text not null check (length(return_uri) <= 500 and return_uri ~ '^https://'),
  token_hash text not null,
  idempotency_key text not null check (length(idempotency_key) between 16 and 128),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (tenant_id, id),
  unique (token_hash),
  unique (tenant_id, actor_ref, idempotency_key),
  check (expires_at > created_at),
  check (consumed_at is null or consumed_at >= created_at)
);

create index ix_handoff_grant_expiry
  on church_integration.handoff_grant(tenant_id, expires_at)
  where consumed_at is null and revoked_at is null;

alter table church_integration.handoff_grant enable row level security;
alter table church_integration.handoff_grant force row level security;
create policy tenant_isolation on church_integration.handoff_grant
  using (tenant_id = church_security.current_tenant_id())
  with check (tenant_id = church_security.current_tenant_id());

grant select, insert, update on church_integration.handoff_grant to church_os_app;

comment on table church_integration.handoff_grant is
  'Short-lived one-time product handoff. Token material is stored only as a hash.';

commit;
