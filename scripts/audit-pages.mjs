// Opens every sitemap page in a real browser at phone and desktop width and reports horizontal overflow,
// console errors, failed requests and WCAG A/AA violations (axe).
//   node scripts/audit-pages.mjs http://localhost:3100 [canonical origin]   (CHROMIUM_EXECUTABLE optional)
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';
const BASE = (process.argv[2] || 'http://localhost:3100').replace(/\/$/, '');
const SITE = (process.argv[3] || BASE).replace(/\/$/, '');
const axeSource = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE || undefined, args: ['--no-sandbox'] });
const sm = await (await fetch(BASE + '/sitemap.xml')).text();
const paths = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(SITE, '') || '/').concat(['/report']);
let bad = 0;
try {
  for (const [w, h] of [[360, 740], [1280, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    for (const path of paths) {
      const p = await ctx.newPage(); const errs = [];
      p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push(m.text()); });
      p.on('requestfailed', r => { if (!/\/api\/events/.test(r.url())) errs.push('failed ' + r.url()); });
      await p.goto(BASE + path, { waitUntil: 'load' }); await p.waitForTimeout(900);
      const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      await p.evaluate(axeSource);
      const v = await p.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] })).violations.map(x => x.id + ':' + x.nodes.length));
      const status = [overflow > 1 ? `overflow ${overflow}px` : '', ...errs, ...v].filter(Boolean);
      if (status.length) { bad++; console.log(`${w}px ${path}\n   ${status.join('\n   ')}`); }
      await p.close();
    }
    await ctx.close();
  }
  console.log(`checked ${paths.length} pages x 2 widths, ${bad} with problems`);
if (bad) process.exitCode = 1;
} finally { await b.close(); }
