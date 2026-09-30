-- Gift lifecycle for "preview first, pay after".
--
--   preview  saved and editable by its owner; the recipient link does not open yet
--   paid     unlocked: the public link works
--   (expired is not stored: it is expires_at in the past, and the daily cron deletes it)
--
-- Every gift that exists today keeps working: the default is 'paid'.
-- New gifts are only written as 'preview' when the app runs with PAYMENTS_REQUIRED=true.

alter table public.gifts
  add column if not exists status    text not null default 'paid' check (status in ('preview', 'paid')),
  add column if not exists live_days integer,          -- how long the link stays live once unlocked
  add column if not exists paid_at   timestamptz;

create index if not exists idx_gifts_status on public.gifts (status);
