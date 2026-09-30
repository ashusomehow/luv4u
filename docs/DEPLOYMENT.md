# Deployment: Supabase + Vercel

Luv4u needs one Supabase project (database + storage) and one Vercel project. Everything runs on a single origin: Next.js serves the pages and the `/api/*` routes.

## 1. Supabase

1. Create a project.
2. Apply the schema in [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql). Either paste it into the SQL editor, or use the Supabase CLI (`supabase link` then `supabase db push`). It creates:
   - `gifts`, `gift_views`, `gift_replies` with Row Level Security **enabled and no policies**: the browser can never read or write them directly; only the server can, using the service-role key.
   - a public Storage bucket `gift-media` (4 MiB per file; image and audio MIME types only).
3. From the project's API settings, copy the **Project URL** and the **service_role** key.

The service-role key bypasses Row Level Security. Keep it server-side only: never give it a `NEXT_PUBLIC_` prefix and never commit it.

## 2. Vercel

1. Import the GitHub repository. The framework is detected as Next.js (`vercel.json` also sets it).
2. Add these environment variables (see [`.env.example`](../.env.example)):

   | Variable | Purpose |
   | --- | --- |
   | `SUPABASE_URL` | Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Server-side key for the API routes |
   | `SUPABASE_STORAGE_BUCKET` | Optional; defaults to `gift-media` |
   | `RATE_SALT` | Random secret used to hash edit keys and visitor tokens. `openssl rand -hex 32`. **Set once and never change it**: changing it invalidates every owner's edit key. Required in production; the app refuses to hash without it. |
   | `NEXT_PUBLIC_SITE_URL` | Canonical origin, e.g. `https://luv4u.example`. Used for sitemap, canonical URLs and share images. |
   | `CRON_SECRET` | Random string. Vercel sends it as `Authorization: Bearer …` to the cleanup cron. |

3. Deploy. Visit `/api/config`: it should report `"hosted": true`.

### Daily cleanup

`vercel.json` schedules `GET /api/cron/cleanup` once a day. It deletes expired gifts (their views and replies cascade) together with their Storage files, and removes upload folders that never became a gift (an upload followed by an abandoned publish) after 24 hours. Without `CRON_SECRET` the endpoint refuses every request. Check your Vercel plan's current cron limits.

## 3. Local development

```sh
cp .env.example .env.local
npm run dev
```

Point `.env.local` at a Supabase project (a separate development project is a good idea), or leave the Supabase variables empty to work in standalone mode. `RATE_SALT` falls back to a development-only value outside production.

## Request-size limit

Vercel functions reject request bodies over about 4.5 MB. To stay under it, the browser uploads each photo, voice note, music file and share cover on its own (`POST /api/gifts/:id/media`) and then publishes a small JSON body that references the uploaded URLs. Per file: images up to 1,000,000 bytes, audio up to 3.2 MiB, share cover up to 1.5 MB, at most 12 files per gift.

## Security notes

- **Gift links are bearer links.** Anyone holding `/g/<id>` can read the gift. Pages and API responses are `noindex`; that is not access control. Content is not end-to-end encrypted.
- **Media URLs are public but unguessable.** The bucket is public so photos and audio load directly from Supabase; object paths contain the random 96-bit gift id and a content hash. Deleting a gift (or the daily cleanup) removes its files.
- **Edit keys** are 256-bit random values generated in the browser. Only a salted SHA-256 hash is stored, compared in constant time. There is no recovery path: losing both the browser's local storage and the private recovery link means losing edit access.
- **Uploads before a gift exists** are authorized by the edit key that will own the gift. That means anyone can upload a few small files to a fresh random id; the per-gift file cap, MIME allow-list, per-file size limits and the 24-hour orphan cleanup bound the abuse. For a public launch, consider adding rate limiting or bot protection in front of `/api/gifts` and `/api/gifts/:id/media`.
- **Replies** are capped per visitor token (10 per gift), 500 characters each. The token is client-generated, so this limits accidents, not a determined attacker.
- Deleting an online gift does not recall screenshots or downloaded HTML copies.

## Rolling back

A Vercel rollback restores earlier code but not database rows or Storage files. The migration is additive and the gift JSON is forward-compatible, so rolling code back is safe; keep database changes backward compatible.
