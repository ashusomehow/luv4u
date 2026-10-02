// End-to-end smoke test: real browser against the production build, with a local
// Supabase-compatible mock. Usage:
//   NEXT_PUBLIC_SITE_URL=http://localhost:3100 npm run build && npm run test:e2e
// (static pages fix the site URL at build time, and the test checks canonical URLs)
import { spawn } from 'node:child_process';
import net from 'node:net';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { chromium } from 'playwright-core';

const APP = 'http://localhost:3100';
const LOCKED_APP = 'http://localhost:3101'; // same build and database, PAYMENTS_REQUIRED=true
const RZP_APP = 'http://localhost:3102'; // same build, PAYMENTS_REQUIRED=true and Razorpay (pointed at the mock) configured
const MOCK = 'http://localhost:54321';
const NORMAL_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const children = [];
// `next start` also reads .env.local, so a developer's real Razorpay test keys would leak into these servers.
// Blank values win over the file, which keeps the tests hermetic: only the :3102 server has Razorpay, and it points at the mock.
const NO_RAZORPAY = { RAZORPAY_KEY_ID: '', RAZORPAY_KEY_SECRET: '', RAZORPAY_WEBHOOK_SECRET: '', RAZORPAY_API_BASE: '', PAYMENT_SIMULATE: '', PAYMENT_PRICE_INR: '' };

function start(cmd, args, env) {
  const child = spawn(cmd, args, { env: { ...process.env, ...env }, stdio: ['ignore', 'inherit', 'inherit'] });
  children.push(child);
  return child;
}
async function waitFor(url, label) {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(url)).status < 500) return; } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`${label} did not start`);
}
const state = async () => (await fetch(`${MOCK}/__state`)).json();

function solidPng(file) {
  const w = 320, h = 240, raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = 200 - y / 2; raw[o + 1] = 110 + x / 4; raw[o + 2] = 140 + (x + y) / 8;
  }
  const table = [...Array(256)].map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = b => { let c = ~0; for (const x of b) c = table[(c ^ x) & 255] ^ (c >>> 8); return ~c >>> 0; };
  const chunk = (t, d) => { const b = Buffer.concat([Buffer.from(t), d]); const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const c = Buffer.alloc(4); c.writeUInt32BE(crc(b)); return Buffer.concat([l, b, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}

// A server left over from an earlier step would answer instead of the ones started below, and the test would
// quietly run against the wrong thing. Fail loudly instead.
const portFree = port => new Promise(resolve => { const s = net.createServer(); s.once('error', () => resolve(false)); s.once('listening', () => s.close(() => resolve(true))); s.listen(port); });

let browser;
try {
  for (const port of [3100, 3101, 3102, 54321]) assert.ok(await portFree(port), `port ${port} is already in use: stop whatever is running there and rerun`);
  start(process.execPath, ['tests/e2e/mock-supabase.mjs'], {});
  // Run Next directly (not via npx) so SIGTERM reaches the server process.
  start(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3100'], {
    SUPABASE_URL: MOCK, SUPABASE_SERVICE_ROLE_KEY: 'test-key', RATE_SALT: 'e2e-salt', CRON_SECRET: 'cs', NEXT_PUBLIC_SITE_URL: APP, ...NO_RAZORPAY,
  });
  start(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3101'], {
    SUPABASE_URL: MOCK, SUPABASE_SERVICE_ROLE_KEY: 'test-key', RATE_SALT: 'e2e-salt', CRON_SECRET: 'cs', NEXT_PUBLIC_SITE_URL: APP, PAYMENTS_REQUIRED: 'true', ...NO_RAZORPAY,
  });
  start(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3102'], {
    SUPABASE_URL: MOCK, SUPABASE_SERVICE_ROLE_KEY: 'test-key', RATE_SALT: 'e2e-salt', CRON_SECRET: 'cs', NEXT_PUBLIC_SITE_URL: APP, PAYMENTS_REQUIRED: 'true',
    RAZORPAY_KEY_ID: 'rzp_test_e2e', RAZORPAY_KEY_SECRET: 'e2e-razorpay-secret', RAZORPAY_WEBHOOK_SECRET: 'e2e-webhook-secret', RAZORPAY_API_BASE: MOCK,
  });
  await waitFor(`${MOCK}/__state`, 'mock supabase');
  await waitFor(`${APP}/api/config`, 'next server');
  await waitFor(`${LOCKED_APP}/api/config`, 'next server (payments required)');
  await waitFor(`${RZP_APP}/api/config`, 'next server (razorpay)');

  const photo = path.join(os.tmpdir(), 'luv4u-e2e.png'); solidPng(photo);
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE || undefined, args: ['--no-sandbox'] });
  const errors = [];
  const watch = (p, tag) => { p.on('pageerror', e => errors.push(`${tag}: ${e.message}`)); p.on('console', m => m.type() === 'error' && errors.push(`${tag}: ${m.text()}`)); };

  // 1. Landing and occasion pages
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: NORMAL_UA });
  const page = await ctx.newPage(); page.setDefaultTimeout(15000); watch(page, 'creator');
  await page.goto(APP + '/', { waitUntil: 'load' }); await page.waitForSelector('#homeView');
  assert.equal(await page.locator('.occasion-card').count(), 8, 'eight gift cards');
  await page.goto(APP + '/for/miss-you', { waitUntil: 'load' }); await page.waitForTimeout(800);
  assert.match(await page.title(), /Miss You Website/);

  // 1a. The landing page starts a gift from the first screen (no scrolling to a chooser)
  await page.goto(APP + '/', { waitUntil: 'load' }); await page.waitForSelector('.hero-chip');
  assert.equal(await page.locator('.hero-chip').count(), 8, 'eight occasion chips');
  const chipBox = await page.locator('.hero-chip').first().boundingBox();
  assert.ok(chipBox.y < 900, 'chips are in the first screen');
  assert.doesNotMatch(await page.locator('body').innerText(), /No payment|No sign-up/i, 'no free / no-payment promise');
  await page.locator('.hero-chip[data-choose-occasion="love"]').click(); await page.waitForSelector('#creatorView:not([hidden])');
  assert.match(page.url(), /#make=love$/);

  // 1c. Conversion pieces on the landing page
  assert.match(await page.locator('#primaryCreate').innerText(), /^Make a gift\s*$/, 'the main button is plain');
  await page.goto(APP + '/', { waitUntil: 'load' }); await page.waitForSelector('.trust-row');
  assert.equal(await page.locator('.trust-row li:visible').count(), 3, 'three promises are visible when payments are off');
  assert.equal(await page.locator('[data-pay-only]').first().isVisible(), false, 'no pay-only promise while everything is free');
  assert.equal(await page.locator('#priceStrip').count(), 0, 'no price strip while everything is free');
  assert.equal(await page.locator('.hero-cta .hero-demo').isVisible(), true, 'the try-it demo sits next to the main button');

  // sticky call to action (phones): only after the hero button is gone, and not while the chooser is on screen
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: NORMAL_UA, hasTouch: true, isMobile: true });
  const mobile = await mctx.newPage(); mobile.setDefaultTimeout(15000);
  const jump = async (sel) => { await mobile.evaluate((q) => { const el = document.querySelector(q); window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 60, behavior: 'instant' }); }, sel); await mobile.waitForTimeout(700); };
  await mobile.goto(APP + '/', { waitUntil: 'load' }); await mobile.waitForSelector('.hero-chip'); await mobile.waitForTimeout(600);
  assert.equal(await mobile.locator('#stickyCta.show').count(), 0, 'no sticky bar while the hero button is on screen');
  await jump('.occasion-footer');
  assert.equal(await mobile.locator('#stickyCta.show').count(), 1, 'sticky bar appears further down the page');
  await jump('#gifts');
  assert.equal(await mobile.locator('#stickyCta.show').count(), 0, 'and steps aside while the gift chooser is on screen');

  // resume card: a gift someone started is waiting for them, without moving the page
  const rctx0 = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: NORMAL_UA, hasTouch: true, isMobile: true });
  const back = await rctx0.newPage(); back.setDefaultTimeout(15000);
  await back.goto(APP + '/', { waitUntil: 'load' }); await back.waitForTimeout(800);
  assert.equal(await back.locator('#resumeBanner.show').count(), 0, 'nothing to resume on a first visit');
  await back.goto(APP + '/#make=love', { waitUntil: 'load' }); await back.waitForSelector('#recipientName');
  await back.fill('#recipientName', 'Sarah'); await back.waitForTimeout(700);
  await back.goto(APP + '/', { waitUntil: 'load' }); await back.waitForSelector('#resumeBanner.show');
  assert.match(await back.locator('#resumeBanner').innerText(), /Love note for Sarah/);
  await back.click('#resumeBanner .resume-btn'); await back.waitForSelector('#creatorView:not([hidden])');
  assert.equal(await back.inputValue('#recipientName'), 'Sarah', 'the saved name is back');
  await back.goto(APP + '/', { waitUntil: 'load' }); await back.waitForSelector('#resumeBanner.show');
  await back.click('#resumeBanner .resume-close'); await back.waitForTimeout(500);
  assert.equal(await back.locator('#resumeBanner.show').count(), 0, 'it can be dismissed');

  // layout stays put: cumulative layout shift on a phone, scrolling the whole page
  const shiftCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: NORMAL_UA, hasTouch: true, isMobile: true });
  await shiftCtx.addInitScript(() => { window.__cls = 0; new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
  const shifty = await shiftCtx.newPage(); shifty.setDefaultTimeout(15000);
  for (const [name, url] of [['payments off', APP], ['payments on', LOCKED_APP]]) {
    await shifty.goto(url + '/', { waitUntil: 'load' }); await shifty.waitForTimeout(1500);
    for (let y = 0; y <= 7000; y += 700) { await shifty.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y); await shifty.waitForTimeout(100); }
    const cls = await shifty.evaluate(() => window.__cls);
    assert.ok(cls < 0.1, `cumulative layout shift ${cls.toFixed(3)} on the landing page (${name}) should stay under 0.1`);
  }

  // reduced motion: nothing hides, nothing pulses, nothing slides in
  const calm = await (await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: NORMAL_UA, reducedMotion: 'reduce' })).newPage(); calm.setDefaultTimeout(15000);
  await calm.goto(APP + '/', { waitUntil: 'load' }); await calm.waitForSelector('.hero-chip'); await calm.waitForTimeout(500);
  assert.equal(await calm.evaluate(() => document.documentElement.classList.contains('js-motion')), false, 'no reveal-on-scroll for people who prefer reduced motion');
  assert.equal(await calm.evaluate(() => getComputedStyle(document.querySelector('.hero-chip')).animationName), 'none');
  assert.equal(await calm.evaluate(() => getComputedStyle(document.querySelector('#primaryCreate'), '::after').display), 'none', 'the button ring is off');

  // 1b. The raw HTML crawlers get: every /for page is different, with structured data and share image
  const raw = async (p) => (await fetch(APP + p, { headers: { 'user-agent': 'Googlebot/2.1' } })).text();
  const [bday, missyou, home] = await Promise.all([raw('/for/birthday-wish'), raw('/for/miss-you'), raw('/')]);
  const h1 = (html) => /<h1 id="landingTitle">([\s\S]*?)<\/h1>/.exec(html)?.[1];
  assert.match(h1(bday), /birthday wish/i); assert.match(h1(missyou), /paper hug/i); assert.notEqual(h1(bday), h1(missyou));
  assert.match(bday, /<title>Birthday Wish Website/); assert.match(missyou, /<title>Miss You Website/);
  assert.match(bday, /rel="canonical" href="http:\/\/localhost:3100\/for\/birthday-wish"/);
  assert.match(bday, /"@type":"FAQPage"/); assert.match(bday, /A birthday message they can actually play with/);
  assert.doesNotMatch(missyou, /A birthday message they can actually play with/);
  assert.match(missyou, /For the miles between hellos/); assert.match(home, /Interactive gift websites for the people you love/);
  assert.match(bday, /property="og:image" content="[^"]*\/for\/birthday-wish\/opengraph-image/);
  const og = await fetch(`${APP}/for/miss-you/opengraph-image`);
  assert.equal(og.headers.get('content-type'), 'image/png'); assert.ok((await og.arrayBuffer()).byteLength > 5000, 'og image has content');
  assert.equal((await fetch(`${APP}/for/not-a-page`)).status, 404);
  // The extra content is visible on the landing view and hidden once the creator opens
  await page.goto(APP + '/for/miss-you', { waitUntil: 'load' }); await page.waitForTimeout(800);
  assert.equal(await page.locator('.seo-content').isVisible(), true, 'seo content visible on landing');
  assert.equal(await page.title(), 'Miss You Website — Send a Paper Hug | Kholona', 'server title kept by the engine');

  // 2. Create a gift with a photo (uploads go to Storage, then a small JSON publish)
  await page.goto(APP + '/#make=love', { waitUntil: 'load' }); await page.waitForTimeout(1000);
  assert.equal(await page.locator('.seo-content').isVisible(), false, 'seo content hidden inside the creator');
  assert.equal(await page.locator('[data-wizard-step]').count(), 3, 'three steps');
  await page.fill('#recipientName', 'Sarah');
  assert.equal(await page.locator('#vibeGrid button:visible').count(), 6, 'mood is chosen on the same screen as the name');
  await page.click('#wizardNext'); await page.waitForTimeout(500);                 // step 2: words & photos (has photos, so nothing is asked)
  assert.equal(await page.locator('#noteDetail').evaluate(el => el.open), true, 'the note is open on arrival');
  assert.equal(await page.locator('#giftForm .message-templates:not(.compact) .template-options').first().isVisible(), false, 'suggestions start collapsed');
  await page.locator('#giftForm .message-templates:not(.compact) .template-heading').first().click();
  assert.equal(await page.locator('#giftForm .message-templates:not(.compact) .template-options').first().isVisible(), true, 'suggestions open on tap');
  assert.equal(await page.locator('#photosDetail').evaluate(el => el.open), true, 'photos are open on arrival, not folded away');
  await page.setInputFiles('#photoUpload', photo); await page.waitForSelector('#photoList > *');
  await page.click('#wizardNext'); await page.waitForTimeout(500);                 // step 3: preview & send
  assert.equal(await page.locator('#moreOptions').evaluate(el => el.open), false, 'technical options are tucked away');
  assert.equal(await page.locator('#replyPhone').isVisible(), false, 'reply phone number is not in the main flow');
  assert.equal(await page.locator('#dockPreview').isVisible(), true, 'one preview button in the dock');
  assert.doesNotMatch(await page.locator('[data-step="2"]').innerText(), /postbox|gift server/i, 'no internal jargon');
  await page.click('#createGiftBtn'); await page.waitForSelector('#shareView:not([hidden])', { timeout: 25000 });
  const link = await page.inputValue('#giftLink');
  const [qrFile] = await Promise.all([page.waitForEvent('download'), page.click('[data-v2="download-qr"]')]);
  assert.equal(qrFile.suggestedFilename(), 'gift-qr.png', 'a QR code can be saved for a printed card');
  const shareButtons = await page.locator('#shareView button:visible').allInnerTexts();
  assert.equal(shareButtons.filter(t => /copy link|whatsapp|share artwork|recovery file/i.test(t)).length, 2, `one way per job on the share screen: ${shareButtons}`);
  assert.match(link, /\/g\/[a-f0-9]{24}$/);
  let s = await state();
  assert.equal(s.gifts, 1);
  assert.ok(s.files.some(f => f[0].endsWith('cover.png')) && s.files.some(f => f[1] === 'image/jpeg'), 'photo + cover stored');

  // 3. Recipient opens it in a fresh browser
  const rctx = await browser.newContext({ viewport: { width: 390, height: 800 }, userAgent: NORMAL_UA });
  const rp = await rctx.newPage(); rp.setDefaultTimeout(15000); watch(rp, 'recipient');
  await rp.goto(link, { waitUntil: 'load' }); await rp.waitForSelector('#experience:not([hidden])');
  assert.equal(await rp.locator('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow');
  assert.equal(await rp.locator('meta[property="og:title"]').getAttribute('content'), 'A little gift for Sarah ♡');
  // a recipient can report the gift without opening it
  const reportHref = await rp.locator('#sealGate .report-link').getAttribute('href');
  assert.equal(reportHref, `/report?gift=${link.split('/g/')[1]}`);
  // the envelope: addressed to the recipient, opened by holding the seal
  assert.match(await rp.locator('#sealGate .seal-address').innerText(), /Sarah/);
  assert.equal(await rp.locator('#storyScroll').evaluate(el => el.inert), true, 'nothing behind the envelope can be reached');
  const seal = await rp.locator('#sealBtn').boundingBox();
  await rp.mouse.move(seal.x + seal.width / 2, seal.y + seal.height / 2); await rp.mouse.down(); await rp.waitForTimeout(250); await rp.mouse.up();
  assert.equal(await rp.locator('#sealGate').count(), 1, 'letting go early does not open it');
  await rp.mouse.move(seal.x + seal.width / 2, seal.y + seal.height / 2); await rp.mouse.down();
  await rp.waitForSelector('#sealGate', { state: 'detached', timeout: 6000 }); await rp.mouse.up();
  assert.equal(await rp.locator('#storyScroll').evaluate(el => el.inert), false);
  await rp.waitForTimeout(600);
  s = await state();
  assert.equal(s.views, 1, 'opening counted');

  // 4. Reply, then it shows up for the owner
  const id = link.split('/g/')[1];
  const reply = await fetch(`${APP}/api/gifts/${id}/reactions`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ visitor: 'v1', reaction: '🥹', message: 'Thank you!' }) });
  assert.equal(reply.status, 200);
  await page.goto(APP + '/', { waitUntil: 'load' }); await page.waitForTimeout(800);
  await page.getByText('My little gifts').first().click();
  await page.getByRole('button', { name: /Little replies/ }).first().click();
  await page.waitForFunction(() => document.querySelector('#savedGiftList')?.innerText.includes('Thank you!'));

  // 5. Funnel events were recorded (anonymously)
  const events = (await state()).events;
  for (const name of ['page_view', 'occasion_selected', 'resume_clicked', 'creator_opened', 'wizard_next', 'publish_clicked', 'gift_published', 'gift_opened']) {
    assert.ok(events.includes(name), `event ${name} recorded (got ${events.join(',')})`);
  }

  // 5b. Accessibility: no colour-contrast failures on the landing page or any creator step
  const axeSource = fs.readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
  const contrast = async (label) => {
    await page.waitForTimeout(1300); // let entrance animations finish so final colours are measured
    await page.evaluate(axeSource);
    const bad = await page.evaluate(async () => (await axe.run(document, { runOnly: ['color-contrast'] })).violations.flatMap(v => v.nodes.map(n => n.target.join(' ').slice(0, 60))));
    assert.deepEqual(bad, [], `colour contrast on ${label}: ${JSON.stringify(bad)}`);
  };
  await page.goto(APP + '/', { waitUntil: 'load' }); await page.waitForSelector('.hero-chip');
  // Lower sections fade in as they scroll into view; let them settle so we measure the final colours.
  for (let y = 0; y <= 7000; y += 700) { await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y); await page.waitForTimeout(120); }
  await page.waitForTimeout(1200); await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(300);
  await contrast('landing');
  await page.goto(APP + '/#make=love', { waitUntil: 'load' }); await page.waitForSelector('#recipientName'); await contrast('step 1');
  await page.fill('#recipientName', 'Sarah'); await page.click('#wizardNext'); await page.waitForTimeout(500); await contrast('step 2');
  // words only: leaving step 2 asks once, and skipping is an explicit choice
  assert.match(await page.locator('#vibeLabel').innerText(), /Pick a look/, 'for a love note the mood only changes colours and sounds, and says so');
  assert.match(await page.locator('#photosDetail .detail-status').innerText(), /1 photo/, 'the section says what is in it');
  await page.locator('[data-remove-photo="0"]').click(); await page.waitForTimeout(400);
  assert.match(await page.locator('#photosDetail .detail-status').innerText(), /Not added yet/, 'and says so when it is empty');
  await page.click('#wizardNext'); await page.waitForSelector('.media-ask');
  assert.match(await page.locator('.media-ask').innerText(), /words only/);
  await page.click('#askSkip'); await page.waitForTimeout(500); await contrast('step 3');
  await page.goto(APP + '/', { waitUntil: 'load' }); await page.waitForTimeout(800); await page.getByText('My little gifts').first().click();

  // 5b. Legal and report pages exist, say the right things, and the report form works end to end
  for (const [path, heading] of [['/terms', /Terms of use/], ['/privacy', /Privacy policy/], ['/refund', /Refunds and cancellations/], ['/contact', /Contact/], ['/report', /Report a gift/]]) {
    const r = await fetch(APP + path); assert.equal(r.status, 200, path); assert.match(await r.text(), heading);
  }
  assert.match(await (await fetch(APP + '/sitemap.xml')).text(), /\/terms/);
  assert.equal((await fetch(APP + '/definitely-not-a-page')).status, 404);
  { const idea = await (await fetch(APP + '/ideas/birthday-website-for-girlfriend')).text();
    assert.match(idea, /<h1>A birthday website for your girlfriend/); assert.match(idea, /application\/ld\+json/); assert.match(idea, /href="\/#make=birthday"/);
    assert.match(await (await fetch(APP + '/sitemap.xml')).text(), /\/ideas\/birthday-website-for-girlfriend/);
    assert.match(await (await fetch(APP + '/for/birthday-wish')).text(), /Ideas and advice/);
    assert.equal((await fetch(APP + '/ideas/not-a-real-idea')).status, 404); }
  assert.equal((await (await fetch(APP + '/api/health')).json()).ok, true);
  {
    const gid = link.split('/g/')[1];
    const rep = await (await browser.newContext({ userAgent: NORMAL_UA })).newPage(); rep.setDefaultTimeout(15000);
    await rep.goto(`${APP}/report?gift=${gid}`, { waitUntil: 'load' });
    assert.match(await rep.inputValue('#rg'), new RegExp(gid));
    await rep.click('button[type=submit]'); await rep.waitForSelector('.legal-error');
    await rep.selectOption('#rr', 'harassment'); await rep.fill('#rd', 'e2e check');
    await rep.click('button[type=submit]'); await rep.waitForSelector('.legal-done');
    assert.equal((await state()).reports, 1, 'the report reached the database');
  }

  // 5c. Scheduled delivery: the link says "not yet", with the time and nothing else, until the moment
  {
    const sid = 'ab'.repeat(12), skey = 'cd'.repeat(32);
    const opensAt = new Date(Date.now() + 3 * 3600e3).toISOString();
    const made = await fetch(`${APP}/api/gifts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: sid, editKey: skey, gift: { name: 'Zara', occasion: 'love', vibe: 'Romantic', photos: [] }, opensAt }) });
    assert.equal(made.status, 200);
    const pub = await (await fetch(`${APP}/api/gifts/${sid}`)).json();
    assert.deepEqual(Object.keys(pub).sort(), ['opensAt', 'scheduled']);
    const sp = await (await browser.newContext({ userAgent: NORMAL_UA })).newPage(); sp.setDefaultTimeout(15000);
    await sp.goto(`${APP}/g/${sid}`, { waitUntil: 'load' }); await sp.waitForSelector('#errorView:not([hidden])');
    assert.match(await sp.locator('#errorView h2').innerText(), /Not quite yet/);
    assert.match(await sp.locator('#errorMessage').innerText(), /opens on/);
    assert.doesNotMatch(await sp.content(), /Zara/, 'the name is not revealed before it opens');
    // and the creator has the field
    await sp.goto(APP + '/#make=love', { waitUntil: 'load' }); await sp.waitForSelector('#recipientName');
    assert.equal(await sp.locator('#opensAt').getAttribute('type'), 'datetime-local');
    await fetch(`${APP}/api/gifts/${sid}`, { method: 'DELETE', headers: { authorization: `Bearer ${skey}` } });
  }

  // 6. Delete removes the gift and its files
  page.on('dialog', d => d.accept());
  await page.getByRole('button', { name: 'Remove gift' }).first().click(); await page.waitForTimeout(1200);
  s = await state();
  assert.equal(s.gifts, 0); assert.equal(s.files.length, 0);


  // 7. Preview first, pay after: with payments required a new gift is a private preview
  assert.deepEqual((await (await fetch(`${LOCKED_APP}/api/config`)).json()).payments, { required: true, priceInr: 99, linkDays: 365 });
  const lp = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: NORMAL_UA })).newPage(); lp.setDefaultTimeout(15000);
  await lp.goto(LOCKED_APP + '/', { waitUntil: 'load' }); await lp.waitForSelector('#priceStrip');
  const strip = await lp.locator('#priceStrip').innerText();
  assert.match(strip, /Free to build\. ₹99 to send\./); assert.match(strip, /One-time, no subscription/); assert.match(strip, /not refundable/);
  assert.equal((await lp.locator('.cta-free').innerText()).trim(), 'Free preview', 'the free preview note sits under the button');
  assert.equal(await lp.locator('[data-pay-only]').first().isVisible(), true, 'the pay-only promise appears once payments are on');
  const octx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: NORMAL_UA });
  const owner = await octx.newPage(); owner.setDefaultTimeout(15000);
  await owner.goto(LOCKED_APP + '/#make=love', { waitUntil: 'load' }); await owner.waitForSelector('#recipientName');
  await owner.fill('#recipientName', 'Noor');
  await owner.click('#wizardNext'); await owner.waitForTimeout(500); await owner.click('#wizardNext'); await owner.click('#askSkip'); await owner.waitForTimeout(500);
  assert.match(await owner.locator('#createGiftBtn').innerText(), /Save & continue/, 'the button says what happens next');
  assert.match(await owner.locator('#priceLine').innerText(), /Previewing is free\. You pay ₹99 once/, 'the price is stated before the buyer commits');
  await owner.locator('#moreOptions summary').click();
  assert.equal(await owner.locator('#deliverySelect').isVisible(), false, 'no free offline copy is offered');
  assert.equal(await owner.locator('#expiryField').isVisible(), false, 'the paid link lifetime is fixed, so there is no expiry choice');
  await owner.click('#createGiftBtn'); await owner.waitForSelector('#shareView:not([hidden])', { timeout: 25000 });
  assert.equal(await owner.locator('#unlockPanel').isVisible(), true, 'unlock panel shown');
  assert.equal(await owner.locator('#copyGiftLink').isDisabled(), true, 'cannot copy a link that does not work yet');
  assert.equal(await owner.locator('#whatsappGift').isDisabled(), true);
  assert.equal(await owner.locator('#downloadGift').isDisabled(), true, 'export is locked too');
  assert.equal(await owner.locator('#previewPublished').isDisabled(), false, 'the owner can still preview');
  assert.match(await owner.inputValue('#giftLink'), /once it is unlocked/);
  const panelText = await owner.locator('#unlockPanel').innerText();
  assert.match(panelText, /Noor can’t open it yet/);
  assert.match(panelText, /₹99/); assert.match(panelText, /one-time · no subscription/);
  assert.match(panelText, /Stays live for a full year/);
  assert.match(panelText, /kept for 7 more days\. After that it is deleted/, 'the real deletion date is shown');
  assert.match(panelText, /payment is not refundable/, 'the no-refund rule is stated before payment');
  assert.match(await owner.locator('[data-v3="unlock"]').innerText(), /Unlock & get link · ₹99/);
  await owner.waitForTimeout(1300); await owner.evaluate(axeSource);
  const lockedBad = await owner.evaluate(async () => (await axe.run(document, { runOnly: ['color-contrast'] })).violations.flatMap(v => v.nodes.map(n => { const d = n.any[0].data; return `${n.target.join(' ').slice(0, 50)} ${d.fgColor} on ${d.bgColor} ${d.contrastRatio}`; })));
  assert.deepEqual(lockedBad, [], `colour contrast on the locked share screen: ${JSON.stringify(lockedBad)}`);
  // previewing the saved gift keeps the way forward in view
  await owner.click('#previewPublished'); await owner.waitForSelector('#experience:not([hidden]) .unlock-tray');
  await owner.click('#sealSkip'); await owner.waitForSelector('#sealGate', { state: 'detached' });
  assert.match(await owner.locator('.unlock-tray').innerText(), /Unlock · ₹99/);
  assert.match(await owner.locator('.unlock-tray').innerText(), /not sent yet/);
  await owner.click('[data-story="exit-preview"]'); await owner.waitForSelector('#shareView:not([hidden])');
  const saved = await owner.evaluate(() => JSON.parse(localStorage.getItem('luv4u.library.v2'))[0]);

  // nobody else can open it, and nothing about it leaks
  assert.equal((await fetch(`${LOCKED_APP}/api/gifts/${saved.id}`)).status, 402);
  const stranger = await (await browser.newContext({ userAgent: NORMAL_UA })).newPage(); stranger.setDefaultTimeout(15000);
  await stranger.goto(`${LOCKED_APP}/g/${saved.id}`, { waitUntil: 'load' });
  await stranger.waitForSelector('#errorView:not([hidden])');
  assert.match(await stranger.locator('#errorMessage').innerText(), /not unlocked yet/);
  assert.doesNotMatch(await stranger.title(), /Noor/);
  assert.doesNotMatch((await stranger.locator('meta[property="og:title"]').getAttribute('content')) ?? '', /Noor/, 'no recipient name in the share preview of a locked gift');
  assert.doesNotMatch((await stranger.locator('meta[property="og:image"]').getAttribute('content')) ?? '', /\/gifts\//, 'the gift\'s own cover image is not exposed while locked');

  // the payment modal opens, states the terms, and cannot unlock anything without a payment provider
  await owner.click('[data-v3="unlock"]');
  await owner.waitForSelector('.pay-modal');
  const modalText = await owner.locator('.pay-modal').innerText();
  assert.match(modalText, /Unlock Noor’s gift/); assert.match(modalText, /₹99/); assert.match(modalText, /not refundable/);
  assert.equal(await owner.locator('#payGo').innerText(), 'Pay ₹99');
  await owner.click('#payGo');
  await owner.waitForFunction(() => /Payments are not set up yet/.test(document.querySelector('#payError')?.textContent || ''));
  assert.equal((await fetch(`${LOCKED_APP}/api/gifts/${saved.id}`)).status, 402, 'still locked');
  assert.equal(await owner.locator('#unlockPanel').isVisible(), true, 'the gift stays locked after a failed payment');
  await owner.keyboard.press('Escape'); await owner.waitForSelector('.pay-modal', { state: 'detached' });

  // a verified payment (simulated as the webhook would: the row is marked paid) opens the link
  const paid = await fetch(`${MOCK}/rest/v1/gifts?id=eq.${saved.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ status: 'paid', paid_at: new Date().toISOString() }) });
  assert.equal((await paid.json()).length, 1);
  assert.equal((await fetch(`${LOCKED_APP}/api/gifts/${saved.id}`)).status, 200, 'the link opens once paid');
  await stranger.goto(`${LOCKED_APP}/g/${saved.id}`, { waitUntil: 'load' }); await stranger.waitForSelector('#experience:not([hidden])');
  await owner.click('[data-v3="unlock"]'); await owner.click('#payGo');          // owner's screen catches up
  await owner.waitForSelector('#payDone'); await owner.click('#payDone');
  await owner.waitForFunction(() => document.querySelector('#unlockPanel')?.hidden === true);
  assert.equal(await owner.locator('#copyGiftLink').isDisabled(), false, 'link tools are available after unlocking');
  assert.match(await owner.inputValue('#giftLink'), /\/g\/[a-f0-9]{24}$/);

  // 8. Razorpay: the whole payment, in a browser, against a fake Razorpay. The real checkout script is replaced
  //    by a stub that either "closes the window" or "pays" through the mock (which signs like Razorpay does).
  {
    assert.deepEqual((await (await fetch(`${RZP_APP}/api/config`)).json()).payments, { required: true, priceInr: 99, linkDays: 365, provider: 'razorpay', testMode: true });
    const zctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: NORMAL_UA });
    await zctx.route('https://checkout.razorpay.com/v1/checkout.js', route => route.fulfill({ contentType: 'application/javascript', body: `
      window.Razorpay = function (o) { this.open = async () => {
        window.__rzpOptions = { key: o.key, order_id: o.order_id, amount: o.amount, currency: o.currency, name: o.name, description: o.description };
        if (window.__rzpMode === 'dismiss') { o.modal.ondismiss(); return; }
        const r = await fetch('${MOCK}/__pay', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ order_id: o.order_id }) });
        const p = await r.json();
        o.handler({ razorpay_order_id: o.order_id, razorpay_payment_id: p.payment.id, razorpay_signature: p.signature });
      }; };` }));
    const zp = await zctx.newPage(); zp.setDefaultTimeout(15000); watch(zp, 'razorpay');
    await zp.goto(RZP_APP + '/#make=love', { waitUntil: 'load' }); await zp.waitForSelector('#recipientName');
    await zp.fill('#recipientName', 'Zoya');
    await zp.click('#wizardNext'); await zp.waitForTimeout(500); await zp.click('#wizardNext'); await zp.click('#askSkip'); await zp.waitForTimeout(500);
    await zp.click('#createGiftBtn'); await zp.waitForSelector('#shareView:not([hidden])', { timeout: 25000 });
    const zid = (await zp.inputValue('#giftLink')).includes('/g/') ? null : (await zp.evaluate(() => JSON.parse(localStorage.getItem('luv4u.library.v2'))[0].id));
    assert.ok(zid, 'saved gift id');

    await zp.click('[data-v3="unlock"]'); await zp.waitForSelector('.pay-modal');
    assert.match(await zp.locator('.pay-modal').innerText(), /Test mode[\s\S]*test card/, 'test mode is announced');
    assert.equal(await zp.locator('#payGo').innerText(), 'Pay ₹99');

    // a) closing the payment window changes nothing: no error, still locked, and the button works again
    await zp.evaluate(() => { window.__rzpMode = 'dismiss'; });
    await zp.click('#payGo'); await zp.waitForFunction(() => window.__rzpOptions);
    const opts = await zp.evaluate(() => window.__rzpOptions);
    assert.equal(opts.amount, 9900, 'the server fixed the price'); assert.equal(opts.currency, 'INR'); assert.equal(opts.key, 'rzp_test_e2e');
    assert.doesNotMatch(opts.description + opts.name, /Zoya/, 'no recipient name goes to Razorpay');
    await zp.waitForFunction(() => !document.querySelector('#payGo').disabled);
    assert.equal(await zp.locator('#payError').isVisible(), false);
    assert.equal((await fetch(`${RZP_APP}/api/gifts/${zid}`)).status, 402);

    // b) paying unlocks it, using the same order as before (no pile of orders)
    await zp.evaluate(() => { window.__rzpMode = 'pay'; delete window.__rzpOptions; });
    await zp.click('#payGo'); await zp.waitForSelector('#payDone');
    assert.match(await zp.locator('.pay-done').innerText(), /Unlocked/);
    await zp.click('#payDone'); await zp.waitForFunction(() => document.querySelector('#unlockPanel')?.hidden === true);
    assert.equal((await fetch(`${RZP_APP}/api/gifts/${zid}`)).status, 200, 'the recipient link opens after payment');
    let st = await state();
    assert.equal(st.rzpOrders, 1, 'one order for one gift, even after a closed window');
    assert.deepEqual(st.paymentRows.map(r => r.status), ['paid']);
    assert.doesNotMatch(await zp.content(), /e2e-razorpay-secret/, 'the key secret never reaches the browser');
    await zctx.close();

    // c) the browser never comes back: Razorpay's webhook unlocks the gift, a forged one does not
    const mk = async (id, key) => { await fetch(`${RZP_APP}/api/gifts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, editKey: key, gift: { name: 'Webhook', occasion: 'love', vibe: 'Romantic', photos: [] } }) });
      return (await (await fetch(`${RZP_APP}/api/gifts/${id}/checkout`, { method: 'POST', headers: { authorization: `Bearer ${key}` } })).json()); };
    const wid = 'c1'.repeat(12), wkey = 'd1'.repeat(32);
    const pending = await mk(wid, wkey);
    assert.equal(pending.status, 'pending'); assert.equal(pending.order.amount, 9900);
    const paidAt = await (await fetch(`${MOCK}/__pay`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ order_id: pending.order.id }) })).json();
    const raw = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: paidAt.payment } } });
    const post = sig => fetch(`${RZP_APP}/api/webhooks/razorpay`, { method: 'POST', headers: { 'x-razorpay-signature': sig }, body: raw });
    assert.equal((await post('0'.repeat(64))).status, 400, 'a forged webhook is refused');
    assert.equal((await fetch(`${RZP_APP}/api/gifts/${wid}`)).status, 402, 'and unlocks nothing');
    const { createHmac } = await import('node:crypto');
    assert.equal((await post(createHmac('sha256', 'e2e-webhook-secret').update(raw).digest('hex'))).status, 200);
    assert.equal((await fetch(`${RZP_APP}/api/gifts/${wid}`)).status, 200, 'the webhook unlocked it');

    // d) paid, but neither the browser nor the webhook reported: pressing Unlock again finds the payment
    const rid = 'c2'.repeat(12), rkey = 'd2'.repeat(32);
    const pend2 = await mk(rid, rkey);
    await fetch(`${MOCK}/__pay`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ order_id: pend2.order.id }) });
    assert.equal((await (await fetch(`${RZP_APP}/api/gifts/${rid}/checkout`, { method: 'POST', headers: { authorization: `Bearer ${rkey}` } })).json()).status, 'paid');
    assert.equal((await fetch(`${RZP_APP}/api/gifts/${rid}`)).status, 200);
    assert.deepEqual((await state()).paymentRows.map(r => r.status), ['paid', 'paid', 'paid']);
  }

  assert.deepEqual(errors.filter(e => !/favicon/.test(e)), [], 'no browser errors');
  console.log('e2e smoke passed');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  children.forEach(c => c.kill('SIGTERM'));
}
