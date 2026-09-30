// End-to-end smoke test: real browser against the production build, with a local
// Supabase-compatible mock. Usage:
//   NEXT_PUBLIC_SITE_URL=http://localhost:3100 npm run build && npm run test:e2e
// (static pages fix the site URL at build time, and the test checks canonical URLs)
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { chromium } from 'playwright-core';

const APP = 'http://localhost:3100';
const LOCKED_APP = 'http://localhost:3101'; // same build and database, PAYMENTS_REQUIRED=true
const MOCK = 'http://localhost:54321';
const NORMAL_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const children = [];

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

let browser;
try {
  start(process.execPath, ['tests/e2e/mock-supabase.mjs'], {});
  // Run Next directly (not via npx) so SIGTERM reaches the server process.
  start(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3100'], {
    SUPABASE_URL: MOCK, SUPABASE_SERVICE_ROLE_KEY: 'test-key', RATE_SALT: 'e2e-salt', CRON_SECRET: 'cs', NEXT_PUBLIC_SITE_URL: APP,
  });
  start(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3101'], {
    SUPABASE_URL: MOCK, SUPABASE_SERVICE_ROLE_KEY: 'test-key', RATE_SALT: 'e2e-salt', CRON_SECRET: 'cs', NEXT_PUBLIC_SITE_URL: APP, PAYMENTS_REQUIRED: 'true',
  });
  await waitFor(`${MOCK}/__state`, 'mock supabase');
  await waitFor(`${APP}/api/config`, 'next server');
  await waitFor(`${LOCKED_APP}/api/config`, 'next server (payments required)');

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
  assert.equal(await page.title(), 'Miss You Website — Send a Paper Hug | Luv4u', 'server title kept by the engine');

  // 2. Create a gift with a photo (uploads go to Storage, then a small JSON publish)
  await page.goto(APP + '/#make=love', { waitUntil: 'load' }); await page.waitForTimeout(1000);
  assert.equal(await page.locator('.seo-content').isVisible(), false, 'seo content hidden inside the creator');
  assert.equal(await page.locator('[data-wizard-step]').count(), 3, 'three steps');
  await page.fill('#recipientName', 'Sarah');
  assert.equal(await page.locator('#vibeGrid button:visible').count(), 6, 'mood is chosen on the same screen as the name');
  await page.click('#wizardNext'); await page.waitForTimeout(500);                 // step 2: words & photos (no add-or-skip screen)
  assert.equal(await page.locator('#noteDetail').evaluate(el => el.open), true, 'the note is open on arrival');
  assert.equal(await page.locator('#giftForm .message-templates:not(.compact) .template-options').first().isVisible(), false, 'suggestions start collapsed');
  await page.locator('#giftForm .message-templates:not(.compact) .template-heading').first().click();
  assert.equal(await page.locator('#giftForm .message-templates:not(.compact) .template-options').first().isVisible(), true, 'suggestions open on tap');
  await page.locator('#photosDetail summary').click();
  await page.setInputFiles('#photoUpload', photo); await page.waitForSelector('#photoList > *');
  await page.click('#wizardNext'); await page.waitForTimeout(500);                 // step 3: preview & send
  assert.equal(await page.locator('#moreOptions').evaluate(el => el.open), false, 'technical options are tucked away');
  assert.equal(await page.locator('#replyPhone').isVisible(), false, 'reply phone number is not in the main flow');
  assert.equal(await page.locator('#dockPreview').isVisible(), true, 'one preview button in the dock');
  assert.doesNotMatch(await page.locator('[data-step="2"]').innerText(), /postbox|gift server/i, 'no internal jargon');
  await page.click('#createGiftBtn'); await page.waitForSelector('#shareView:not([hidden])', { timeout: 25000 });
  const link = await page.inputValue('#giftLink');
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
  for (const name of ['page_view', 'creator_opened', 'wizard_next', 'publish_clicked', 'gift_published', 'gift_opened']) {
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
  await page.click('#wizardNext'); await page.waitForTimeout(500); await contrast('step 3');
  await page.goto(APP + '/', { waitUntil: 'load' }); await page.waitForTimeout(800); await page.getByText('My little gifts').first().click();

  // 6. Delete removes the gift and its files
  page.on('dialog', d => d.accept());
  await page.getByRole('button', { name: 'Remove gift' }).first().click(); await page.waitForTimeout(1200);
  s = await state();
  assert.equal(s.gifts, 0); assert.equal(s.files.length, 0);


  // 7. Preview first, pay after: with payments required a new gift is a private preview
  assert.deepEqual((await (await fetch(`${LOCKED_APP}/api/config`)).json()).payments, { required: true, priceInr: 149, linkDays: 365 });
  const octx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: NORMAL_UA });
  const owner = await octx.newPage(); owner.setDefaultTimeout(15000);
  await owner.goto(LOCKED_APP + '/#make=love', { waitUntil: 'load' }); await owner.waitForSelector('#recipientName');
  await owner.fill('#recipientName', 'Noor');
  await owner.click('#wizardNext'); await owner.waitForTimeout(500); await owner.click('#wizardNext'); await owner.waitForTimeout(500);
  assert.match(await owner.locator('#createGiftBtn').innerText(), /Save & continue/, 'the button says what happens next');
  assert.match(await owner.locator('#priceLine').innerText(), /Previewing is free\. You pay ₹149 once/, 'the price is stated before the buyer commits');
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
  assert.match(panelText, /₹149/); assert.match(panelText, /one-time · no subscription/);
  assert.match(panelText, /Stays live for a full year/);
  assert.match(panelText, /kept for 7 more days\. After that it is deleted/, 'the real deletion date is shown');
  assert.match(panelText, /payment is not refundable/, 'the no-refund rule is stated before payment');
  assert.match(await owner.locator('[data-v3="unlock"]').innerText(), /Unlock & get link · ₹149/);
  await owner.waitForTimeout(1300); await owner.evaluate(axeSource);
  const lockedBad = await owner.evaluate(async () => (await axe.run(document, { runOnly: ['color-contrast'] })).violations.flatMap(v => v.nodes.map(n => { const d = n.any[0].data; return `${n.target.join(' ').slice(0, 50)} ${d.fgColor} on ${d.bgColor} ${d.contrastRatio}`; })));
  assert.deepEqual(lockedBad, [], `colour contrast on the locked share screen: ${JSON.stringify(lockedBad)}`);
  // previewing the saved gift keeps the way forward in view
  await owner.click('#previewPublished'); await owner.waitForSelector('#experience:not([hidden]) .unlock-tray');
  assert.match(await owner.locator('.unlock-tray').innerText(), /Unlock · ₹149/);
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

  // unlocking is not possible by clicking: no payment provider is connected yet
  await owner.click('[data-v3="unlock"]');
  await owner.waitForFunction(() => /Payments are not set up yet/.test(document.querySelector('#toast')?.textContent || ''));
  assert.equal((await fetch(`${LOCKED_APP}/api/gifts/${saved.id}`)).status, 402, 'still locked');

  // a verified payment (simulated as the webhook would: the row is marked paid) opens the link
  const paid = await fetch(`${MOCK}/rest/v1/gifts?id=eq.${saved.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ status: 'paid', paid_at: new Date().toISOString() }) });
  assert.equal((await paid.json()).length, 1);
  assert.equal((await fetch(`${LOCKED_APP}/api/gifts/${saved.id}`)).status, 200, 'the link opens once paid');
  await stranger.goto(`${LOCKED_APP}/g/${saved.id}`, { waitUntil: 'load' }); await stranger.waitForSelector('#experience:not([hidden])');
  await owner.click('[data-v3="unlock"]');                                     // owner's screen catches up
  await owner.waitForFunction(() => document.querySelector('#unlockPanel')?.hidden === true);
  assert.equal(await owner.locator('#copyGiftLink').isDisabled(), false, 'link tools are available after unlocking');
  assert.match(await owner.inputValue('#giftLink'), /\/g\/[a-f0-9]{24}$/);

  assert.deepEqual(errors.filter(e => !/favicon/.test(e)), [], 'no browser errors');
  console.log('e2e smoke passed');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  children.forEach(c => c.kill('SIGTERM'));
}
