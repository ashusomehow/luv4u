# Going live on kholona.in

Do the steps in this order. The order matters: the site must answer on the domain *before* you tell the app that the domain is canonical.

## 1. Attach the domain in Vercel

1. Vercel → your project → **Settings → Domains → Add** `kholona.in`, then add `www.kholona.in` as well.
2. Vercel shows the DNS records it needs for each. Add exactly those at your registrar's DNS page. They are normally an **A record** for the bare domain (`@`) and a **CNAME** for `www` pointing at Vercel. Use the values Vercel shows, not values from this page.
3. Wait until both rows say **Valid Configuration** (minutes to a few hours). HTTPS is issued for you.
4. In the Domains list, make `kholona.in` the primary, and set `www.kholona.in` to **redirect to `kholona.in`** (edit the www row → Redirect to Another Domain). **Never** set `kholona.in` to redirect to `www`: the app already sends `www` to the bare domain, so redirecting the other way makes a loop and the site will not load. If the site ever shows "too many redirects", this is why.

## 2. Tell the app its address

In Vercel → **Settings → Environment Variables** (Production), set:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://kholona.in` (no trailing slash) |

Redeploy. This is what makes the sitemap, canonical tags, share images and structured data all point at the new domain. Nothing else needs to change; the old address keeps working until you redirect it.

Check it:

```bash
curl -s https://kholona.in/robots.txt | grep Sitemap       # Sitemap: https://kholona.in/sitemap.xml
curl -sI https://www.kholona.in | grep -i ^location        # a 308 to https://kholona.in/
node scripts/audit-site.mjs https://kholona.in https://kholona.in
```

The audit crawls every sitemap URL and must print "No problems found".

## 3. Retire the old address

Once `kholona.in` loads correctly, set `LEGACY_HOST=luv4u-tau.vercel.app` (or whatever the old hostname was) and redeploy. Every page on the old address then redirects permanently to the same page on the new one, so nothing already shared or indexed is lost.

## 4. Google and Bing

1. [Google Search Console](https://search.google.com/search-console) → **Add property → Domain** → `kholona.in`. It gives you a **TXT record**; add it at your registrar's DNS, then click Verify. A Domain property covers www, http and https together.
2. **Sitemaps** → submit `https://kholona.in/sitemap.xml`. It lists about 30 pages; it takes days for Google to crawl them all.
3. **URL Inspection** → paste `https://kholona.in/` → **Request indexing**. Do the same for `/ideas` and `/examples`.
4. [Bing Webmaster Tools](https://www.bing.com/webmasters) → **Import from Google Search Console**. This also covers DuckDuckGo and other engines that use Bing.
5. Look at **Pages** in Search Console after a week: anything under "Not indexed" has a reason, and the sitemap pages should be "Indexed".

## 5. Brand basics (do these the same day)

- Claim the handle `kholona` on Instagram, YouTube and X, even if you do not post yet.
- Register `kholona.com` if it ever becomes available, and `kholona.co.in` if it is cheap. Point extras at `https://kholona.in`.
- Search the Indian trademark register for "KHOLONA" in the classes for software and online services before you spend money on branding.
- Add the domain to your email later: when you send mail from `@kholona.in` you will need SPF, DKIM and DMARC records at your registrar.

## What carries over, and what does not

- **Carries over:** every gift link (it lives in Supabase, and the old address redirects once step 3 is done), private edit links (the `#edit=…` part survives the redirect), replies, and everything stored in Supabase.
- **Does not carry over:** the *"My little gifts" list and unfinished drafts*. Browsers store those per website address, so a browser that saved them on the old address will not see them on kholona.in. Before moving, open any gift you still need from the old address and copy its private edit link; with that link you can edit it from the new address.

This matters little before launch, because only you have made gifts so far. It would matter a lot if you moved a busy site, so keep the domain you launch with.
