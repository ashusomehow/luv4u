-- Where buyers stop: the payment step split by browser (Instagram/Facebook in-app vs a real browser) and phone,
-- why payments fail, and where people leave the gift maker. Read by GET /api/admin/checkout and the Google Sheet
-- ("Checkout" and "Maker steps" tabs, docs/DASHBOARD.md). Needs migrations 0002 and 0006. Safe to run at any time.
--
-- Events carry props.env ('inapp' | 'browser') and, from November 2026, props.os ('android' | 'ios' | 'other') and
-- props.app ('instagram' | 'facebook' | 'other'). Orders are classified from the user agent saved with them
-- (payments.attribution ->> 'ua'); an order without one (ad measurement off, or the buyer opted out) is 'unknown'.

-- The same browser test as the website (public/legacy/track.js).
create or replace function public.ua_env(ua text) returns text language sql immutable as $$
  select case when ua is null or ua = '' then 'unknown'
              when ua ~* '(FBAN|FBAV|FB_IAB|Instagram|;\s*wv\))' then 'inapp' else 'browser' end;
$$;
create or replace function public.ua_os(ua text) returns text language sql immutable as $$
  select case when ua is null or ua = '' then 'unknown'
              when ua ~* 'android' then 'android' when ua ~* '(iphone|ipad|ipod)' then 'ios' else 'other' end;
$$;

-- One row per day x browser x phone (India time, newest first):
--   pay_clicks .. paid_events   sessions that tapped pay / saw the payment window open / closed it / had a payment
--                               fail / came back paid / tapped "Pay in Chrome" / arrived in the real browser
--   checkouts, paid             orders opened that day, and how many of those orders were paid (at any time since):
--                               the true checkout-to-paid rate, from our own payments table
create or replace function public.checkout_report(days integer default 28)
returns table (
  day date, env text, os text,
  pay_clicks bigint, windows_opened bigint, dismissed bigint, failed bigint, paid_events bigint,
  browser_taps bigint, browser_arrivals bigint, checkouts bigint, paid bigint
)
language sql stable security definer set search_path = public as $$
  with since as (
    select (((now() at time zone 'Asia/Kolkata')::date - (greatest(1, least(coalesce(days, 28), 400)) - 1))::timestamp at time zone 'Asia/Kolkata') as t
  ),
  ev as (
    select (e.created_at at time zone 'Asia/Kolkata')::date as day,
      coalesce(e.props ->> 'env', 'unknown') as env, coalesce(e.props ->> 'os', 'unknown') as os,
      count(distinct e.session_id) filter (where e.name = 'pay_clicked') as pay_clicks,
      count(distinct e.session_id) filter (where e.name = 'razorpay_opened') as windows_opened,
      count(distinct e.session_id) filter (where e.name = 'payment_dismissed') as dismissed,
      count(distinct e.session_id) filter (where e.name = 'payment_failed') as failed,
      count(distinct e.session_id) filter (where e.name = 'payment_succeeded') as paid_events,
      count(distinct e.session_id) filter (where e.name = 'pay_in_browser' and coalesce(e.props ->> 'kind', '') = 'tapped') as browser_taps,
      count(distinct e.session_id) filter (where e.name = 'pay_in_browser' and coalesce(e.props ->> 'kind', '') = 'arrived') as browser_arrivals
    from public.events e, since
    where e.created_at >= since.t
      and e.name in ('pay_clicked', 'razorpay_opened', 'payment_dismissed', 'payment_failed', 'payment_succeeded', 'pay_in_browser')
    group by 1, 2, 3
  ),
  co as (
    select (p.created_at at time zone 'Asia/Kolkata')::date as day,
      public.ua_env(p.attribution ->> 'ua') as env, public.ua_os(p.attribution ->> 'ua') as os,
      count(*) as checkouts, count(*) filter (where p.status = 'paid') as paid
    from public.payments p, since
    where p.created_at >= since.t
    group by 1, 2, 3
  )
  select coalesce(ev.day, co.day), coalesce(ev.env, co.env), coalesce(ev.os, co.os),
    coalesce(ev.pay_clicks, 0), coalesce(ev.windows_opened, 0), coalesce(ev.dismissed, 0), coalesce(ev.failed, 0),
    coalesce(ev.paid_events, 0), coalesce(ev.browser_taps, 0), coalesce(ev.browser_arrivals, 0),
    coalesce(co.checkouts, 0), coalesce(co.paid, 0)
  from ev full outer join co on co.day = ev.day and co.env = ev.env and co.os = ev.os
  order by 1 desc, 2, 3;
$$;

-- Why payments fail: Razorpay's error code (props.label) by browser and phone, most frequent first.
create or replace function public.payment_failures(days integer default 28)
returns table (code text, env text, os text, failures bigint)
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(e.props ->> 'label', ''), 'no code'), coalesce(e.props ->> 'env', 'unknown'), coalesce(e.props ->> 'os', 'unknown'), count(*)
  from public.events e
  where e.name = 'payment_failed'
    and e.created_at >= now() - make_interval(days => greatest(1, least(coalesce(days, 28), 400)))
  group by 1, 2, 3
  order by 4 desc;
$$;

-- Where people leave the maker: sessions per gift type that reached each milestone (props.step), plus opening the
-- maker, pressing Create and reaching the unlock page, so each step can be read against the one before.
create or replace function public.creator_steps(days integer default 28)
returns table (occasion text, step text, sessions bigint)
language sql stable security definer set search_path = public as $$
  select coalesce(e.occasion, 'unknown'),
    case e.name when 'creator_opened' then 'opened' when 'publish_clicked' then 'pressed_create' when 'gift_published' then 'created'
                else coalesce(e.props ->> 'step', 'unknown') || coalesce(':' || nullif(e.props ->> 'label', ''), '') end,
    count(distinct e.session_id)
  from public.events e
  where e.name in ('creator_opened', 'creator_step', 'publish_clicked', 'gift_published')
    and e.created_at >= now() - make_interval(days => greatest(1, least(coalesce(days, 28), 400)))
  group by 1, 2
  order by 1, 3 desc;
$$;

-- Server only: the service-role key calls these; the public (anon) key must not.
do $$
declare f text;
begin
  foreach f in array array['checkout_report(integer)', 'payment_failures(integer)', 'creator_steps(integer)'] loop
    execute format('revoke all on function public.%s from public', f);
    if exists (select 1 from pg_roles where rolname = 'anon') then execute format('revoke all on function public.%s from anon', f); end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then execute format('revoke all on function public.%s from authenticated', f); end if;
    if exists (select 1 from pg_roles where rolname = 'service_role') then execute format('grant execute on function public.%s to service_role', f); end if;
  end loop;
end $$;
