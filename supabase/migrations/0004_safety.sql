-- Launch safety: abuse reports, takedowns and rate limiting.
-- Safe to run at any time; nothing here changes how existing gifts behave.

-- A removed gift keeps its row (so the link answers "removed" and the decision is auditable)
-- but its content and media are wiped by the takedown endpoint.
alter table public.gifts
  add column if not exists taken_down_at  timestamptz,
  add column if not exists takedown_reason text;

-- Reports from people who received a gift (or a link to one).
create table if not exists public.gift_reports (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  gift_id       text not null,
  reason        text not null,
  details       text not null default '',
  reporter_hash text not null,          -- salted hash of the network address, never the address itself
  handled_at    timestamptz
);
create index if not exists idx_gift_reports_gift on public.gift_reports (gift_id);
create index if not exists idx_gift_reports_open on public.gift_reports (created_at desc) where handled_at is null;

-- One row per limited request: bucket + salted address hash + time. Rows older than a day are
-- deleted by the daily cleanup. The hash cannot be reversed to an address.
create table if not exists public.rate_hits (
  id      bigint generated always as identity primary key,
  bucket  text not null,
  ip_hash text not null,
  at      timestamptz not null default now()
);
create index if not exists idx_rate_hits_lookup on public.rate_hits (bucket, ip_hash, at desc);

alter table public.gift_reports enable row level security;
alter table public.rate_hits    enable row level security;
