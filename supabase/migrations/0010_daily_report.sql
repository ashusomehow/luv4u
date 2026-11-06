-- Daily money dashboard: ad spend (typed by hand, in the Google Sheet or here) next to what actually happened,
-- from our own tables. Revenue comes from payments, not from Meta, because the pixel and the Conversions API
-- miss buyers who come back later by typing the URL. Read by GET /api/admin/daily (docs/DASHBOARD.md).
-- Needs migrations 0002, 0006, 0007, 0008 and 0009. Safe to run at any time.

-- One row per day (India time): what Ads Manager shows as spent (before GST) and, optionally, the purchases
-- Meta reported for that day, so the dashboard can show how much of the real sales Meta saw.
create table if not exists public.ad_spend (
  day            date primary key,
  spend          numeric(12, 2) not null check (spend >= 0),
  meta_purchases integer check (meta_purchases is null or meta_purchases >= 0),
  note           text,
  updated_at     timestamptz not null default now()
);
alter table public.ad_spend enable row level security;

-- One row per day for the last `days` days (newest first), India time:
--   spend, meta_purchases  what was typed in for that day (null if nothing)
--   visitors, ad_visitors  sessions that viewed a page other than a gift (from a Meta ad: utm_source or referrer)
--   makers, gifts_made     sessions that opened the creator / created a gift
--   unlock_views, pay_clicks   sessions that saw the unlock (price) page / pressed pay
--   checkouts              payment orders started that day
--   sales, revenue         paid orders that day and what was paid (₹, after any creator-code discount)
--   ad_sales, ad_revenue   of those, the ones whose buyer arrived from a Meta ad click (fbclid or utm_source)
--   creator_sales          paid with a creator's code
--   birthday_sales, sorry_sales   by gift type (a deleted gift counts in neither)
--   free_unlocks           gifts unlocked with a free code (not revenue)
create or replace function public.daily_report(days integer default 120)
returns table (
  day date, spend numeric, meta_purchases integer,
  visitors bigint, ad_visitors bigint, makers bigint, gifts_made bigint, unlock_views bigint, pay_clicks bigint,
  checkouts bigint, sales bigint, revenue numeric, ad_sales bigint, ad_revenue numeric, creator_sales bigint,
  birthday_sales bigint, sorry_sales bigint, free_unlocks bigint
)
language sql stable security definer set search_path = public as $$
  with bounds as (
    select greatest(1, least(coalesce(days, 120), 400)) as n, (now() at time zone 'Asia/Kolkata')::date as today
  ),
  cal as (
    select generate_series(b.today - (b.n - 1), b.today, interval '1 day')::date as day from bounds b
  ),
  since as (
    select (min(cal.day)::timestamp at time zone 'Asia/Kolkata') as t from cal
  ),
  ev as (
    select (e.created_at at time zone 'Asia/Kolkata')::date as day,
      count(distinct e.session_id) filter (where e.name = 'page_view' and coalesce(e.path, '/') !~ '^/(g|preview-frame)(/|$)') as visitors,
      count(distinct e.session_id) filter (where e.name = 'page_view' and coalesce(e.path, '/') !~ '^/(g|preview-frame)(/|$)'
        and (lower(coalesce(e.utm_source, '')) in ('meta', 'facebook', 'fb', 'instagram', 'ig') or coalesce(e.referrer, '') ~* '(facebook|instagram)\.')) as ad_visitors,
      count(distinct e.session_id) filter (where e.name = 'creator_opened') as makers,
      count(distinct e.session_id) filter (where e.name = 'gift_published') as gifts_made,
      count(distinct e.session_id) filter (where e.name = 'unlock_viewed') as unlock_views,
      count(distinct e.session_id) filter (where e.name = 'pay_clicked') as pay_clicks
    from public.events e, since
    where e.created_at >= since.t
    group by 1
  ),
  co as (
    select (p.created_at at time zone 'Asia/Kolkata')::date as day, count(*) as checkouts
    from public.payments p, since
    where p.created_at >= since.t
    group by 1
  ),
  paid as (
    select (p.paid_at at time zone 'Asia/Kolkata')::date as day,
      count(*) as sales,
      round(sum(p.amount) / 100.0, 2) as revenue,
      count(*) filter (where p.from_ad) as ad_sales,
      round(coalesce(sum(p.amount) filter (where p.from_ad), 0) / 100.0, 2) as ad_revenue,
      count(*) filter (where p.ref_code is not null) as creator_sales,
      count(*) filter (where p.occasion = 'birthday') as birthday_sales,
      count(*) filter (where p.occasion = 'apology') as sorry_sales
    from (
      select p.paid_at, p.amount, p.ref_code,
        coalesce(p.attribution ? 'fbc' or lower(coalesce(p.attribution ->> 'utm_source', '')) in ('meta', 'facebook', 'fb', 'instagram', 'ig'), false) as from_ad,
        case when g.id is null then null else coalesce(g.gift ->> 'occasion', 'birthday') end as occasion
      from public.payments p
      left join public.gifts g on g.id = p.gift_id
      where p.status = 'paid'
    ) p, since
    where p.paid_at >= since.t
    group by 1
  ),
  fr as (
    select (f.created_at at time zone 'Asia/Kolkata')::date as day, count(*) as free_unlocks
    from public.free_code_uses f, since
    where f.created_at >= since.t
    group by 1
  )
  select c.day, s.spend, s.meta_purchases,
    coalesce(ev.visitors, 0), coalesce(ev.ad_visitors, 0), coalesce(ev.makers, 0), coalesce(ev.gifts_made, 0),
    coalesce(ev.unlock_views, 0), coalesce(ev.pay_clicks, 0), coalesce(co.checkouts, 0),
    coalesce(paid.sales, 0), coalesce(paid.revenue, 0), coalesce(paid.ad_sales, 0), coalesce(paid.ad_revenue, 0),
    coalesce(paid.creator_sales, 0), coalesce(paid.birthday_sales, 0), coalesce(paid.sorry_sales, 0), coalesce(fr.free_unlocks, 0)
  from cal c
  left join public.ad_spend s on s.day = c.day
  left join ev on ev.day = c.day
  left join co on co.day = c.day
  left join paid on paid.day = c.day
  left join fr on fr.day = c.day
  order by c.day desc;
$$;

-- Server only: the service-role key calls it; the public (anon) key must not.
revoke all on function public.daily_report(integer) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then revoke all on function public.daily_report(integer) from anon; end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then revoke all on function public.daily_report(integer) from authenticated; end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then grant execute on function public.daily_report(integer) to service_role; end if;
end $$;
