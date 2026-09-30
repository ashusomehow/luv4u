-- Luv4u v4 schema (Supabase Postgres + Storage).
-- All access goes through Next.js route handlers using the service-role key, so RLS is
-- enabled with no policies: the anon/authenticated roles can read or write nothing directly.

create table if not exists public.gifts (
  id           text primary key check (id ~ '^[a-f0-9]{24}$'),
  owner_hash   text not null,
  gift         jsonb not null,
  revision     integer not null default 1,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  expires_at   timestamptz
);

create table if not exists public.gift_views (
  id           bigint generated always as identity primary key,
  gift_id      text not null references public.gifts(id) on delete cascade,
  visitor_hash text not null,
  viewed_at    timestamptz not null default now(),
  unique (gift_id, visitor_hash)
);

create table if not exists public.gift_replies (
  id           bigint generated always as identity primary key,
  gift_id      text not null references public.gifts(id) on delete cascade,
  visitor_hash text not null,
  reaction     text,
  message      text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_gifts_expires on public.gifts (expires_at);
create index if not exists idx_replies_gift  on public.gift_replies (gift_id, id desc);

alter table public.gifts        enable row level security;
alter table public.gift_views   enable row level security;
alter table public.gift_replies enable row level security;

-- Public bucket: gift pages are bearer links, so media URLs are readable by URL only
-- (listing is not exposed). Writes happen server-side with the service-role key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gift-media', 'gift-media', true, 4194304,
  array['image/jpeg','image/png','image/webp','audio/webm','audio/ogg','audio/mpeg','audio/mp4','audio/wav','audio/x-wav','audio/aac']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
