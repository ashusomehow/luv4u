# Daily money dashboard (Google Sheets)

Ad spend next to what really happened, one row per day (India time). Revenue comes from our own `payments`
table, not from Meta: the pixel and the Conversions API miss buyers who come back later by typing the URL.

- **You type** each day's ad spend (and, if you like, Meta's purchase count) in the Sheet's **Ad spend** tab.
- **Supabase** keeps that spend (`ad_spend`) and adds up each day from our own tables (`daily_report()`, migration 0010):
  visitors, visitors from ads, gift makers, gifts made, unlock-page views, pay taps, checkouts, sales, revenue,
  sales from a Meta ad click (fbclid / utm_source kept at checkout), creator-code sales, sales by gift type, free-code unlocks.
- **The Sheet** (`tools/google-sheets/kholona-dashboard.gs`) refreshes every hour and works out the rest.
- **Where buyers stop** (migration 0012, `GET /api/admin/checkout`): the payment step split by browser (Instagram /
  Facebook in-app vs Chrome / Safari) and phone, Razorpay's failure reasons, and the maker step by step. Shown in the
  **Checkout** and **Maker steps** tabs.

## Set up once (about 10 minutes)

1. **Supabase:** SQL Editor → New query → paste `supabase/migrations/0010_daily_report.sql` → Run. Then the same for
   `supabase/migrations/0012_checkout_report.sql` (the Checkout and Maker steps tabs).
2. **Vercel:** Settings → Environment Variables → add `REPORT_TOKEN` = 32 or more random letters and numbers
   (a password manager's generator is fine). Redeploy. This key can only read the daily numbers and save ad spend;
   `ADMIN_TOKEN` also works but is better kept out of a spreadsheet.
3. **Google Sheets:** create a new Sheet → Extensions → Apps Script → delete what is there → paste all of
   `tools/google-sheets/kholona-dashboard.gs` → Save. Go back to the Sheet and reload it.
4. A **Kholona** menu appears. Kholona → **Set up the dashboard**. Google asks for permission (it needs to edit this
   Sheet, reach kholona.in and refresh on a timer). Paste `REPORT_TOKEN` when asked.

It loads the last 120 days at once. Change the website, GST, Razorpay fee or days in the **Settings** tab.

## Every morning (1 minute)

Ads Manager → yesterday → "Amount spent" (all campaigns) → type it in **Ad spend** next to yesterday's date.
Optionally type the "Purchases" Ads Manager shows for that day in column C. Kholona → Refresh now, or wait for the hourly refresh.
A blank spend cell means "no spend entered" and is cleared in Supabase too: the Sheet is the source of truth.

## What you see

**Dashboard:** Today so far · Yesterday · Last 7 days · Last 30 days · This month, for ad spend incl. GST, revenue after
fees, profit, real ROAS, sales, cost per sale, revenue per sale, sales from ad clicks, Meta's count and how much of the
real sales it saw, visitors, visitor → sale, gifts made, saw the price, tapped pay, free-code unlocks. Then, in plain words:

- whether the last 7 days made money, and what to do (raise budget, test new creatives, or pause the weakest ad);
- break-even: what one sale leaves after fees, and the highest cost per purchase Ads Manager can show before you lose money;
- how many real sales Meta counted;
- revenue this week vs last week; the best day of the month;
- the funnel for the week and its biggest leak (the step fewest people get through);
- the share of sales from ad clicks, and birthday vs sorry vs other.

Charts: ad spend vs revenue, real ROAS by day with the break-even line, sales from ad clicks vs everything else,
the funnel, sales by gift, profit by day.

**Daily:** every day with every number; the money columns are formulas, so typed spend shows at once.

**Checkout** (last 7 and last 28 days): for the Instagram / Facebook browser and for Chrome / Safari, by phone (Android,
iPhone) and on all phones: taps on pay, payment windows opened, closed, failed, paid as the page saw it, taps on "Pay in
Chrome" and arrivals in the real browser, then **orders opened, orders paid and order → paid**. The last three come from
our payments table and are the truth; compare order → paid between the two browsers. Below: Razorpay's failure reasons
(most frequent first) and every day. Phones are known for events from 21 Nov 2026 on; orders always know theirs.

**Maker steps** (last 28 days): people who opened the maker, typed a name, wrote or picked words, added a photo, voice or
music (and the wedding maker's cards), pressed Create, were stopped (what was missing) or hit an error, and created the
gift, per gift type, as counts and as a share of those who opened the maker. The biggest drop between two rows is where
to work.

To add these two tabs to a Sheet you already have: paste the new `kholona-dashboard.gs` over the old one in Apps Script,
save, reload the Sheet, then Kholona → Refresh now.

## How the numbers are worked out

| | |
|---|---|
| Ad spend incl. GST | typed spend × (1 + GST). Meta bills 18% GST on top; set GST to 0% in Settings if you claim it back. |
| Revenue after fees | what buyers paid × (1 − Razorpay fee). The fee defaults to 2.36% (2% + 18% GST). |
| Profit | revenue after fees − ad spend incl. GST. Creator payouts are not taken off (see /admin/referrals). |
| Real ROAS | revenue after fees ÷ ad spend incl. GST. Above 1.0x is profit. |
| Sales | paid orders by the India date they were paid. Free-code unlocks are counted separately, never as sales. |
| Sales from ad clicks | the buyer arrived from a Meta ad click and the click was kept. A buyer who saw an ad and typed the URL later shows under "other". |
| Visitors | sessions that viewed a page other than a gift link (no cookies, see migration 0002). |
| Order → paid | orders opened in that period that were paid (at any time since). An order is reused when the buyer taps pay again, so this is per gift, not per tap. |

API behind it: `GET /api/admin/daily?days=120` (JSON, or `&format=csv`) and `POST /api/admin/daily` with
`{ "spend": [{ "date": "2026-11-05", "spend": 812.4, "metaPurchases": 3 }] }`, both with `Authorization: Bearer <REPORT_TOKEN>`.
