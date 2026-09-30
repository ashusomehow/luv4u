-- Scheduled delivery: a gift can be set to open at a chosen moment ("midnight on their birthday").
-- Until then the public link answers "not yet" and reveals nothing about the gift.
-- Safe to run at any time; gifts without a value open immediately, as before.
alter table public.gifts add column if not exists opens_at timestamptz;
