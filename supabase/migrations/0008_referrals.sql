-- Creator referral programme. A creator shares kholona.in/r/CODE or tells followers to type CODE at checkout.
-- The buyer gets a small discount, and the paid sale is credited to the creator. Commission is worked out
-- weekly (Monday to Sunday, India time) from these rows and paid out by hand; payouts are recorded here.
-- All three tables are server-only (row level security on, no policies): only the service-role key reads them.
-- Safe to run at any time; the app keeps working (without referrals) until it is applied.

create table if not exists public.referrers (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  code           text not null unique check (code ~ '^[A-Z0-9]{3,20}$'),
  name           text not null,
  handle         text,                 -- Instagram / YouTube handle
  phone          text,
  email          text,
  payout_name    text,                 -- account holder, for IMPS
  account_number text,
  ifsc           text,
  upi            text,
  pan            text,
  stats_key      text not null,        -- secret in the creator's private stats link
  active         boolean not null default true,
  notes          text
);
alter table public.referrers enable row level security;

-- One row per visit to /r/CODE. No address, no cookie id: only which code and when.
create table if not exists public.referral_clicks (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  code       text not null
);
create index if not exists idx_referral_clicks_code on public.referral_clicks (code, created_at desc);
alter table public.referral_clicks enable row level security;

-- What was paid to a creator for one week.
create table if not exists public.referral_payouts (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  code       text not null,
  week_start date not null,             -- the Monday (India time) the week began
  sales      integer not null,
  revenue    integer not null,          -- paise the buyers paid that week
  rate       integer not null,          -- percent
  amount     integer not null,          -- paise paid to the creator
  reference  text,                      -- IMPS / UTR number
  unique (code, week_start)
);
alter table public.referral_payouts enable row level security;

-- Which creator a payment belongs to, the discount the buyer got, and hashed buyer contact details
-- (SHA-256, never the raw values) so a creator buying through their own code can be spotted.
alter table public.payments add column if not exists ref_code text;
alter table public.payments add column if not exists discount integer not null default 0;
alter table public.payments add column if not exists buyer_phone_hash text;
alter table public.payments add column if not exists buyer_email_hash text;
alter table public.payments add column if not exists ref_excluded boolean not null default false;
create index if not exists idx_payments_ref on public.payments (ref_code, paid_at) where ref_code is not null;
