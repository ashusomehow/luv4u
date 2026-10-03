// Plays every occasion the way a delighted recipient would (engages every affordance) and counts the taps.
import { chromium } from 'playwright-core';
const BASE = process.env.BASE || 'http://localhost:3200';
const KEYS = (process.env.KEYS || 'birthday,proposal,love,apology,anniversary,thanks,congratulations,missyou').split(',');
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] });
const out = {};
for (const key of KEYS) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`${BASE}/#demo=${key}`, { waitUntil: 'load' });
  await p.waitForSelector('#experience:not([hidden])'); await p.waitForTimeout(500);
  let taps = 0; const trail = []; const t0 = Date.now(); let idle = 0;
  const selectors = [
    '[data-v3="proposal-answer"][data-answer="yes"]',
    '[data-v3="heart-note"]:not(.revealed)', '[data-v3="flower"][aria-pressed="false"]',
    '[data-story="light"]:not([disabled])', '[data-story="blow"]:not(.extinguished):not([disabled])', '[data-story="open-gift"]:not(.opened):not([disabled])',
    '[data-v3="open-note"]:not(.opened):not([disabled])', '[data-v3="untie-ribbon"]:not(.opened):not([disabled])', '[data-v3="send-hug"]:not([disabled])',
    '[data-v3="reveal-question"]:not([disabled])', '[data-v3="turn-page"]', '#turnPage',
    '#storyScene [data-story="next"]', '#storyScene .story-btn[data-story="next"]', '[data-v3="open-note"]',
  ];
  for (let i = 0; i < 45; i++) {
    const cls = await p.locator('#storyScene').getAttribute('class');
    if (/celebration-scene|reply-scene/.test(cls || '')) break;
    let clicked = false; console.log('iter', i, Date.now() - t0, cls);
    for (const sel of selectors) {
      const l = p.locator(sel).first();
      if (await l.count() && await l.isVisible().catch(() => false) && await l.isEnabled().catch(() => false)) {
        const label = (await l.innerText().catch(() => '')).trim().replace(/\s+/g, ' ').slice(0, 34) || sel;
        await l.click({ timeout: 2000 }).catch(() => {}); taps++; trail.push(label); clicked = true; idle = 0; break;
      }
    }
    await p.waitForTimeout(clicked ? 450 : 350);
    if (!clicked && ++idle > 14) { trail.push('(stuck)'); break; }
  }
  const finalScene = await p.locator('#storyScene').getAttribute('class');
  out[key] = { taps, seconds: Math.round((Date.now() - t0) / 100) / 10, scene: (finalScene || '').split(' ')[1], errs: errs.length, trail };
  const v = out[key]; console.log(key.padEnd(16), String(v.taps).padStart(2), 'taps', String(v.seconds).padStart(5) + 's', v.scene, v.errs ? 'ERR' + v.errs : '', '\n    ', v.trail.join(' > '));
  await p.close();
}
await b.close();
console.log('TOTAL', Object.values(out).reduce((a, v) => a + v.taps, 0), 'taps');
