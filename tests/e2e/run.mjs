// End-to-end smoke test: real browser against the production build, with a local
// Supabase-compatible mock. Usage: npm run build && npm run test:e2e
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { chromium } from 'playwright-core';

const APP = 'http://localhost:3100';
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
  await waitFor(`${MOCK}/__state`, 'mock supabase');
  await waitFor(`${APP}/api/config`, 'next server');

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
  assert.match(await page.title(), /Miss you/);

  // 2. Create a gift with a photo (uploads go to Storage, then a small JSON publish)
  await page.goto(APP + '/#make=love', { waitUntil: 'load' }); await page.waitForTimeout(1000);
  await page.fill('#recipientName', 'Sarah');
  for (let i = 0; i < 3; i++) { await page.click('#wizardNext'); await page.waitForTimeout(400); }
  await page.locator('#photosDetail summary').click();
  await page.setInputFiles('#photoUpload', photo); await page.waitForSelector('#photoList > *');
  await page.click('#wizardNext'); await page.waitForTimeout(400);
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

  // 6. Delete removes the gift and its files
  page.on('dialog', d => d.accept());
  await page.getByRole('button', { name: 'Remove gift' }).first().click(); await page.waitForTimeout(1200);
  s = await state();
  assert.equal(s.gifts, 0); assert.equal(s.files.length, 0);

  assert.deepEqual(errors.filter(e => !/favicon/.test(e)), [], 'no browser errors');
  console.log('e2e smoke passed');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  children.forEach(c => c.kill('SIGTERM'));
}
