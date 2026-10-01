# Operations: running Kholona after launch

Everything here can be done with `curl` and the Supabase and Vercel dashboards. Nothing needs code changes.

## Reports and takedowns

People report a gift from `/report` (or the link on the gift's opening screen). Reports land in the `gift_reports` table. A person reviews them; the app never removes a gift on its own.

**Set `ADMIN_TOKEN`** in Vercel (Production): at least 24 random characters, for example `openssl rand -hex 24`. Without it the admin endpoints answer 401, which is the safe default.

```bash
ORIGIN=https://your-domain
TOKEN=...   # your ADMIN_TOKEN

# 1. See open reports, newest first
curl -s -H "Authorization: Bearer $TOKEN" $ORIGIN/api/admin/reports

# 2. Remove a gift (erases its content and every stored photo and recording; keeps a record)
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"id":"<24-character gift id>","reason":"harassment, reviewed <date>"}' \
  $ORIGIN/api/admin/takedown
```

After removal the link answers "This gift was removed" and the open reports for it are marked handled. The id is in the report (and in the `/g/<id>` link).

Suggested routine: check reports once a day at first. Act the same day on anything involving threats, sexual content or children. For a child-safety report, also preserve the report and notify the authorities as the law requires; do not forward the content yourself.

**Repeat abuse.** Reports and rate-limit rows carry only a salted hash of the network address. If one hash appears in many reports, you can block that address range at the Vercel firewall (Project → Firewall), using the address from your own logs.

## Rate limits

Per address, per hour: create gift 12, media upload 80, reply 20, report 8 (see `lib/rate-limit.ts`). They live in the `rate_hits` table, so they hold across serverless instances, and they fail open: if the database check errors, the request goes through. The daily cleanup deletes rows older than a day. A real person hitting a limit sees "You are doing that a little fast", and can try again shortly. To change a limit, edit `LIMITS` and deploy.

## Monitoring

1. **Uptime.** Add a free monitor (UptimeRobot, Better Stack) on `GET /api/health`. It returns 200 when the app and database answer, and 503 when the database does not. Alert by email or phone.
2. **Errors.** Vercel → Project → Logs shows server errors (every failure is logged with `console.error`). Turn on Vercel's alerts for failed function invocations. If you want stack traces grouped and emailed, add Sentry (`npx @sentry/wizard -i nextjs`) later; the app has error boundaries in `app/error.tsx` and `app/global-error.tsx` ready for it.
3. **Usage.** Set usage and billing alerts on both Vercel and Supabase (Storage and egress grow with photos).
4. **Funnel.** `supabase/queries/funnel.sql` has the queries. Look at them weekly.

## Backups and a restore drill

Gifts are personal, so treat the database like it matters.

- **Supabase plan.** Daily backups are included on paid plans. On the free plan there are no automatic restorable backups, so take your own (below) at least weekly before you have real users.
- **Manual backup.** Project Settings → Database → Connection string, then:
  `pg_dump "$DATABASE_URL" --no-owner --format=custom -f luv4u-$(date +%F).dump`
  Keep it somewhere private and encrypted. Photos and recordings live in Storage, not the database; back up the `gift-media` bucket too if you want a full copy (Supabase dashboard → Storage, or the `supabase` CLI).
- **Restore drill (do it once before launch, then every quarter).**
  1. Create a scratch Supabase project.
  2. Apply `supabase/migrations/*.sql` in order.
  3. `pg_restore --no-owner -d "$SCRATCH_DATABASE_URL" luv4u-<date>.dump`
  4. Point a Vercel Preview deployment at the scratch project and open a known gift link.
  5. Note how long it took. Delete the scratch project.

A backup you have never restored is a hope, not a backup.

## Load test

`scripts/loadtest.js` is a [k6](https://k6.io) script for the read paths a viral spike hits (home page, an occasion page, a gift link, the config endpoint). Point it at a **Preview** deployment, never production:

```bash
k6 run -e ORIGIN=https://your-preview-url -e GIFT_ID=<a real 24-character id> scripts/loadtest.js
```

It ramps to 200 concurrent visitors. Pass if the 95th-percentile response stays under 800 ms and fewer than 1% of requests fail. The home and occasion pages are static, so they should barely notice; the gift link reads one row from Supabase, so that is the number to watch (and Supabase's connection limit is the thing you would hit first).

## Legal and contact details to fill in before launch

Set in Vercel: `NEXT_PUBLIC_BUSINESS_NAME`, `NEXT_PUBLIC_CONTACT_EMAIL`, and, for India, `NEXT_PUBLIC_GRIEVANCE_OFFICER` (a named person). The Terms, Privacy, Refund and Contact pages read them. These pages are a sensible starting point, not legal advice: have a lawyer read them before you take money, and check the refund page matches what you actually do.
