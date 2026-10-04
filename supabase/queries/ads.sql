-- Run in the Supabase SQL editor. Needs migration 0007 (payments.attribution).
-- Paid orders by ad campaign for the last 30 days. Spend is not stored here: divide by it in Meta Ads Manager
-- (or your sheet) to get cost per purchase.
select coalesce(attribution->>'utm_campaign', '(no campaign)') as campaign,
       coalesce(attribution->>'utm_content', '-')                as ad,
       count(*)                                                  as paid_orders,
       sum(amount) / 100.0                                       as revenue_inr
from public.payments
where status = 'paid'
  and paid_at > now() - interval '30 days'
  and attribution is not null
  and (attribution ? 'fbc' or attribution->>'utm_source' = 'meta')
group by 1, 2
order by paid_orders desc;

-- Checkout started vs paid, by campaign (how many people who start paying finish).
select coalesce(attribution->>'utm_campaign', '(no campaign)') as campaign,
       count(*)                                  as checkouts_started,
       count(*) filter (where status = 'paid')   as paid,
       round(100.0 * count(*) filter (where status = 'paid') / count(*), 1) as pct_paid
from public.payments
where created_at > now() - interval '30 days' and attribution is not null
group by 1
order by checkouts_started desc;
