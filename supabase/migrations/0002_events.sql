-- First-party, privacy-friendly funnel analytics.
-- No cookies, no IP addresses, no gift ids, no personal content. `session_id` is a random
-- per-tab value (sessionStorage) that cannot be linked across visits.

create table if not exists public.events (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  name         text not null,
  session_id   text not null,
  occasion     text,
  path         text,
  referrer     text,
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  props        jsonb not null default '{}'::jsonb
);

create index if not exists idx_events_name_time on public.events (name, created_at desc);
create index if not exists idx_events_session   on public.events (session_id);

-- Written by the server with the service-role key only.
alter table public.events enable row level security;
