-- Free unlock codes: a code typed on the unlock page that unlocks a gift without payment (100% off).
-- For the team's own testing and for gifting. No money moves, nothing is sent to Meta, no creator is credited.
-- Codes are made by hand in the SQL editor (see docs/PAYMENTS.md); keep them long and private.
-- Both tables are server-only (row level security on, no policies): only the service-role key reads them.
-- Safe to run at any time; until it is applied, every code is simply "not valid".

create table if not exists public.free_codes (
  code       text primary key check (code ~ '^[A-Z0-9]{3,20}$'),
  created_at timestamptz not null default now(),
  note       text,                                  -- who or what it is for
  max_uses   integer check (max_uses is null or max_uses > 0), -- null: no limit
  uses       integer not null default 0,
  active     boolean not null default true
);
alter table public.free_codes enable row level security;

-- One row per gift unlocked with a code.
create table if not exists public.free_code_uses (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  code       text not null references public.free_codes (code),
  gift_id    text not null
);
create index if not exists idx_free_code_uses_code on public.free_code_uses (code, created_at desc);
alter table public.free_code_uses enable row level security;
