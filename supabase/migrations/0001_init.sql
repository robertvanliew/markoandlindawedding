-- Schema from PROJECT_BRIEF.md §7. RLS on, no public policies: all access via the service role.
create extension if not exists pgcrypto;

create table invites (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  party_name text not null,
  aliases text[] not null default '{}',
  email text,
  max_guests int not null check (max_guests > 0),
  kids_allowed boolean not null default false,
  created_at timestamptz not null default now()
);

create table responses (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid unique not null references invites on delete cascade,
  attending boolean not null,
  guest_count int not null default 0,
  contact_email text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table response_guests (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references responses on delete cascade,
  full_name text not null,
  meal text check (meal in ('chicken','beef','veggie','kids')),
  dietary_notes text
);

alter table invites enable row level security;
alter table responses enable row level security;
alter table response_guests enable row level security;
