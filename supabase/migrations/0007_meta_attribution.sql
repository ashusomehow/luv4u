-- Ad attribution for Meta (Facebook / Instagram) conversion tracking. When a buyer arrives from an ad, the
-- checkout remembers the click identifiers and UTM tags on the payment row, so the sale can be reported to
-- Meta's Conversions API and so ad spend can be matched to payments in our own data (supabase/queries/ads.sql).
-- Never holds names, messages or contact details. Safe to run at any time; the app works without it.
alter table public.payments add column if not exists attribution jsonb;
