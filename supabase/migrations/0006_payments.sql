-- Razorpay payments: one row per checkout order, so a payment can always be traced back to a gift,
-- confirmed exactly once, and refunded or invoiced later. No card, UPI or bank details are ever stored:
-- Razorpay holds those. Rows are kept after a gift is deleted, because they are accounting records.
-- Safe to run at any time.
create table if not exists public.payments (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  gift_id    text not null,                       -- no foreign key on purpose: outlives the gift
  provider   text not null default 'razorpay',
  order_id   text not null unique,
  payment_id text,
  amount     integer not null,                    -- paise (INR x 100)
  currency   text not null default 'INR',
  status     text not null default 'created' check (status in ('created', 'paid')),
  paid_at    timestamptz
);
create index if not exists idx_payments_gift on public.payments (gift_id, id desc);
create unique index if not exists idx_payments_payment_id on public.payments (payment_id) where payment_id is not null;

alter table public.payments enable row level security;
