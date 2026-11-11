begin;

create table church_access.system_role_template (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z][A-Z0-9_]{1,63}$'),
  description text not null,
  created_at timestamptz not null default now()
);

create table church_access.tenant_role (
  tenant_id uuid not null references church_core.tenant(id),
  id uuid not null default gen_random_uuid(),
  code text not null check (code ~ '^[A-Z][A-Z0-9_]{1,63}$'),
  system_template_id uuid references church_access.system_role_template(id),
  created_at timestamptz not null default now(),
  primary key (tenant_id, id),
  unique (tenant_id, code)
);

create table church_access.membership_role (
  tenant_id uuid not null,
  id uuid not null default gen_random_uuid(),
  membership_id uuid not null,
  role_id uuid not null,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  primary key (tenant_id, id),
  unique (tenant_id, membership_id, role_id),
  foreign key (tenant_id, membership_id) references church_core.membership(tenant_id, id),
  foreign key (tenant_id, role_id) references church_access.tenant_role(tenant_id, id),
  check (valid_until is null or valid_until > valid_from)
);

create table church_core.community (
  tenant_id uuid not null references church_core.tenant(id),
  id uuid not null default gen_random_uuid(),
  parent_id uuid,
  kind text not null check (kind in ('GROUP','CELL','DEPARTMENT','TEAM','MINISTRY')),
  name text not null check (length(btrim(name)) between 1 and 160),
  status text not null check (status in ('ACTIVE','ARCHIVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version bigint not null default 1 check (row_version > 0),
  primary key (tenant_id, id),
  foreign key (tenant_id, parent_id) references church_core.community(tenant_id, id),
  check (parent_id is null or parent_id <> id)
);

create table church_core.community_member (
  tenant_id uuid not null,
  id uuid not null default gen_random_uuid(),
  community_id uuid not null,
  membership_id uuid not null,
  member_role text not null check (member_role in ('MEMBER','LEADER','ASSISTANT')),
  status text not null check (status in ('ACTIVE','INACTIVE')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, id),
  unique (tenant_id, community_id, membership_id),
  foreign key (tenant_id, community_id) references church_core.community(tenant_id, id),
  foreign key (tenant_id, membership_id) references church_core.membership(tenant_id, id)
);

commit;

