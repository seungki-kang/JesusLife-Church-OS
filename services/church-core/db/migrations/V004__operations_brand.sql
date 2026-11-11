begin;

create table church_core.church_event (
  tenant_id uuid not null references church_core.tenant(id),
  id uuid not null default gen_random_uuid(),
  community_id uuid,
  kind text not null check (kind in ('WORSHIP','GATHERING','CLASS','SERVICE','OTHER')),
  title text not null check (length(btrim(title)) between 1 and 200),
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text not null check (length(timezone) between 1 and 64),
  status text not null check (status in ('DRAFT','PUBLISHED','CANCELLED','COMPLETED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version bigint not null default 1 check (row_version > 0),
  primary key (tenant_id, id),
  foreign key (tenant_id, community_id) references church_core.community(tenant_id, id),
  check (ends_at is null or ends_at >= starts_at)
);

create table church_core.attendance (
  tenant_id uuid not null,
  id uuid not null default gen_random_uuid(),
  event_id uuid not null,
  membership_id uuid not null,
  occurred_at timestamptz not null,
  method text not null check (method in ('SELF','LEADER','QR','IMPORT')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, id),
  unique (tenant_id, event_id, membership_id),
  foreign key (tenant_id, event_id) references church_core.church_event(tenant_id, id),
  foreign key (tenant_id, membership_id) references church_core.membership(tenant_id, id)
);

create table church_core.care_task (
  tenant_id uuid not null,
  id uuid not null default gen_random_uuid(),
  subject_membership_id uuid not null,
  assignee_membership_id uuid,
  category text not null check (category in ('WELCOME','CONTACT','VISIT','PRACTICAL_SUPPORT','SAFETY_HANDOFF','OTHER')),
  priority text not null check (priority in ('LOW','NORMAL','HIGH','URGENT')),
  status text not null check (status in ('OPEN','ASSIGNED','IN_PROGRESS','DONE','CANCELLED')),
  purpose_code text not null check (purpose_code ~ '^[A-Z][A-Z0-9_]{2,63}$'),
  operational_note varchar(500),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version bigint not null default 1 check (row_version > 0),
  primary key (tenant_id, id),
  foreign key (tenant_id, subject_membership_id) references church_core.membership(tenant_id, id),
  foreign key (tenant_id, assignee_membership_id) references church_core.membership(tenant_id, id)
);

create table church_core.ministry_assignment (
  tenant_id uuid not null,
  id uuid not null default gen_random_uuid(),
  membership_id uuid not null,
  community_id uuid not null,
  role_code text not null check (role_code ~ '^[A-Z][A-Z0-9_]{1,63}$'),
  assignment_basis text[] not null,
  status text not null check (status in ('PROPOSED','ACCEPTED','ACTIVE','ENDED','DECLINED')),
  starts_on date not null,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version bigint not null default 1 check (row_version > 0),
  primary key (tenant_id, id),
  foreign key (tenant_id, membership_id) references church_core.membership(tenant_id, id),
  foreign key (tenant_id, community_id) references church_core.community(tenant_id, id),
  check (cardinality(assignment_basis) > 0),
  check (assignment_basis <@ array['VOLUNTEERED','GIFT','SKILL','EXPERIENCE','AVAILABILITY','COMMUNITY_NEED','LEADER_DISCERNMENT']::text[]),
  check (ends_on is null or ends_on >= starts_on)
);

create table church_core.brand_config (
  tenant_id uuid not null references church_core.tenant(id),
  id uuid not null default gen_random_uuid(),
  display_name text not null check (length(btrim(display_name)) between 1 and 80),
  logo_asset_ref text,
  primary_color text not null check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  secondary_color text not null check (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  enabled_modules text[] not null,
  is_active boolean not null default true,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version bigint not null default 1 check (row_version > 0),
  primary key (tenant_id, id),
  check (enabled_modules <@ array['TODAY','CHURCH','COMMUNITY','MINISTRY','INTEGRATIONS']::text[])
);

create unique index uq_brand_config_one_active
  on church_core.brand_config(tenant_id) where is_active;

commit;

