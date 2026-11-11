begin;

create table church_core.tenant (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,62}$'),
  name text not null check (length(btrim(name)) between 1 and 160),
  status text not null check (status in ('PROVISIONING','ACTIVE','SUSPENDED','CLOSED')),
  timezone text not null check (length(timezone) between 1 and 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version bigint not null default 1 check (row_version > 0)
);

create table church_core.campus (
  tenant_id uuid not null references church_core.tenant(id),
  id uuid not null default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 160),
  status text not null check (status in ('ACTIVE','ARCHIVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version bigint not null default 1 check (row_version > 0),
  primary key (tenant_id, id)
);

create table church_core.membership (
  tenant_id uuid not null references church_core.tenant(id),
  id uuid not null default gen_random_uuid(),
  person_ref uuid not null,
  status text not null check (status in ('PENDING','ACTIVE','INACTIVE')),
  joined_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version bigint not null default 1 check (row_version > 0),
  primary key (tenant_id, id),
  unique (tenant_id, person_ref)
);

create table church_access.external_subject_binding (
  tenant_id uuid not null,
  id uuid not null default gen_random_uuid(),
  membership_id uuid not null,
  issuer text not null check (length(issuer) between 1 and 255),
  subject_ref text not null check (length(subject_ref) between 1 and 255),
  status text not null check (status in ('ACTIVE','REVOKED')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (tenant_id, id),
  unique (tenant_id, issuer, subject_ref),
  foreign key (tenant_id, membership_id) references church_core.membership(tenant_id, id),
  check ((status = 'ACTIVE' and revoked_at is null) or (status = 'REVOKED' and revoked_at is not null))
);

commit;

