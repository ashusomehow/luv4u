-- Run in the Supabase SQL editor. Change the interval as needed.

-- 1. Funnel: distinct sessions that reached each step in the last 30 days.
with s as (
  select name, count(distinct session_id) as sessions
  from public.events
  where created_at > now() - interval '30 days'
  group by name
)
select step, coalesce(sessions, 0) as sessions,
       round(100.0 * coalesce(sessions, 0) / nullif(max(coalesce(sessions, 0)) over (), 0), 1) as pct_of_top
from (values
  (1, 'page_view'), (2, 'occasion_selected'), (3, 'creator_opened'), (4, 'wizard_next'),
  (5, 'publish_clicked'), (6, 'gift_published'), (7, 'link_copied'), (8, 'whatsapp_clicked'),
  (9, 'gift_opened'), (10, 'reply_sent')
) as f(n, step)
left join s on s.name = f.step
order by n;

-- 2. Traffic sources (first-touch UTM or referrer host).
select coalesce(utm_source, referrer, '(direct)') as source, count(distinct session_id) as sessions
from public.events
where name = 'page_view' and created_at > now() - interval '30 days'
group by 1 order by 2 desc limit 20;

-- 3. Which occasions get chosen and published.
select occasion,
       count(distinct session_id) filter (where name = 'occasion_selected') as chosen,
       count(distinct session_id) filter (where name = 'gift_published')    as published
from public.events
where occasion is not null and created_at > now() - interval '30 days'
group by 1 order by 2 desc;

-- 4. Which conversion levers get used (sessions that triggered each in the last 30 days).
select name, coalesce(props->>'kind', '') as kind, count(distinct session_id) as sessions
from public.events
where name in ('occasion_selected', 'demo_opened', 'resume_clicked', 'sticky_cta_clicked', 'price_strip_cta_clicked', 'unlock_clicked')
  and created_at > now() - interval '30 days'
group by 1, 2 order by 1, 3 desc;

-- 5. Daily sessions.
select date_trunc('day', created_at) as day, count(distinct session_id) as sessions
from public.events
where name = 'page_view' and created_at > now() - interval '30 days'
group by 1 order by 1;
