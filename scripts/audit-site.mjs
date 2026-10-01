// Crawls a running build the way a search engine would and reports problems.
//   NEXT_PUBLIC_SITE_URL=https://kholona.in npm run build && npx next start -p 3100
//   node scripts/audit-site.mjs http://localhost:3100 https://kholona.in
// Args: the address to fetch from, and the canonical origin the site is configured with.
const BASE = (process.argv[2] || 'http://localhost:3100').replace(/\/$/, '');
const SITE = (process.argv[3] || BASE).replace(/\/$/, '');
const problems = [];
const warn = (url, msg) => problems.push(`${url.replace(BASE, '') || '/'}  ${msg}`);
const get = (u, init) => fetch(u, { redirect: 'manual', ...init });
const decode = (t) => t.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const attr = (html, re) => { const v = re.exec(html)?.[1]?.trim(); return v == null ? null : decode(v); };

const robots = await (await get(BASE + '/robots.txt')).text();
if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) warn('/robots.txt', `sitemap line should point at ${SITE}/sitemap.xml`);
if (!/Disallow: \/api\//.test(robots)) warn('/robots.txt', 'should disallow /api/');

const sitemap = await (await get(BASE + '/sitemap.xml')).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urls.length) warn('/sitemap.xml', 'no URLs');
for (const u of urls) if (!u.startsWith(SITE)) warn('/sitemap.xml', `URL not on ${SITE}: ${u}`);
if (new Set(urls).size !== urls.length) warn('/sitemap.xml', 'duplicate URLs');

const titles = new Map(), descriptions = new Map(), links = new Set();
for (const u of urls) {
  const path = u.replace(SITE, '');
  const url = BASE + path;
  const res = await get(url);
  if (res.status !== 200) { warn(url, `status ${res.status}`); continue; }
  const html = await res.text();
  const title = attr(html, /<title>([^<]*)<\/title>/);
  const desc = attr(html, /<meta name="description" content="([^"]*)"/);
  const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/);
  if (!title) warn(url, 'missing <title>'); else { if (title.length > 65) warn(url, `title is ${title.length} chars: ${title}`); (titles.get(title) ?? titles.set(title, []).get(title)).push(path); }
  if (!desc) warn(url, 'missing meta description'); else { if (desc.length < 70 || desc.length > 170) warn(url, `description is ${desc.length} chars`); (descriptions.get(desc) ?? descriptions.set(desc, []).get(desc)).push(path); }
  if ((canonical ?? '').replace(/\/$/, '') !== u.replace(/\/$/, '')) warn(url, `canonical is ${canonical}, expected ${u}`);
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) warn(url, `${h1s} <h1> elements (want exactly 1)`);
  if (!/<html[^>]*lang="en(-IN)?"/.test(html)) warn(url, 'missing html lang');
  if (!/<meta name="viewport"/.test(html)) warn(url, 'missing viewport meta');
  for (const p of ['og:title', 'og:description', 'og:image', 'og:url']) if (!new RegExp(`<meta property="${p}"`).test(html)) warn(url, `missing ${p}`);
  if (!/<meta name="twitter:card"/.test(html)) warn(url, 'missing twitter:card');
  if (/<meta name="robots" content="[^"]*noindex/.test(html)) warn(url, 'is noindex but listed in the sitemap');
  if (/Luv4u|luv4u\.(in|com)/.test(html.replace(/luv4u\.(library|draft|visitor|muted|reply|resume|sid|src)/g, ''))) warn(url, 'old brand name still visible');
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch { warn(url, 'invalid JSON-LD'); } }
  for (const m of html.matchAll(/<img\b([^>]*)>/g)) if (!/\balt=/.test(m[1])) warn(url, `<img> without alt: ${m[1].slice(0, 60)}`);
  for (const m of html.matchAll(/<a\b[^>]*\bhref="([^"#?][^"]*)"/g)) if (m[1].startsWith('/') && !m[1].startsWith('//')) links.add(m[1].split('#')[0].split('?')[0]);
  if (res.headers.get('x-powered-by')) warn(url, 'x-powered-by header exposed');
}
for (const [t, paths] of titles) if (paths.length > 1) warn(paths[0], `duplicate title shared with ${paths.slice(1).join(', ')}`);
for (const [d, paths] of descriptions) if (paths.length > 1) warn(paths[0], `duplicate description shared with ${paths.slice(1).join(', ')}`);

for (const l of links) {
  const r = await get(BASE + l);
  if (![200, 301, 308].includes(r.status)) warn(BASE + l, `internal link returns ${r.status}`);
}

// What must not be indexed, and what must not exist.
const nf = await get(BASE + '/definitely-not-a-page');
if (nf.status !== 404) warn('/definitely-not-a-page', `unknown URL returns ${nf.status}, want 404`);
const gift = await get(BASE + '/g/' + 'a'.repeat(24));
const giftHtml = await gift.text();
if (!/noindex/.test(giftHtml) && !/noindex/.test(gift.headers.get('x-robots-tag') || '')) warn('/g/<id>', 'gift pages must be noindex');
const home = await get(BASE + '/');
for (const [h, want] of [['x-content-type-options', 'nosniff'], ['referrer-policy', null], ['permissions-policy', null], ['x-frame-options', null]]) {
  const v = home.headers.get(h);
  if (!v) warn('/', `missing security header ${h}`); else if (want && !v.includes(want)) warn('/', `${h} is ${v}`);
}

console.log(`Crawled ${urls.length} sitemap URLs and ${links.size} internal links.`);
if (problems.length) { console.log(`\n${problems.length} problem(s):`); for (const p of problems) console.log(' - ' + p); process.exitCode = 1; }
else console.log('No problems found.');
