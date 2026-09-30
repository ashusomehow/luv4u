import fs from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HomeContent } from '@/components/HomeContent';
import { OccasionContent } from '@/components/OccasionContent';
import { bodyForOccasion } from '@/lib/legacy-hero';
import { HERO } from '@/lib/occasion-copy';
import { OCCASION_KEYS, OCCASIONS } from '@/lib/occasions';
import { PAGES } from '@/lib/seo-content';

const engine = fs.readFileSync(path.join(import.meta.dirname, '../public/legacy/app.js'), 'utf8');

/** Evaluates the engine's own OCCASIONS and CAMPAIGN_HEADINGS literals. */
function engineData() {
  const occasions = eval('(' + /const OCCASIONS = (\{[\s\S]*?\n\});/.exec(engine)![1] + ')') as Record<
    string,
    { description: string; cta: string; path: string[]; slug: string; label: string }
  >;
  const headings = eval('(' + /const CAMPAIGN_HEADINGS=(\{[^}]*\});/.exec(engine)![1] + ')') as Record<string, string>;
  return { occasions, headings };
}

describe('occasion pages are unique', () => {
  const pages = OCCASION_KEYS.map((key) => ({ key, ...PAGES[key] }));

  it('has distinct titles, descriptions and FAQ questions', () => {
    for (const field of ['metaTitle', 'metaDescription', 'introHeading'] as const) {
      expect(new Set(pages.map((p) => p[field])).size, field).toBe(pages.length);
    }
    const questions = pages.flatMap((p) => p.faqs.map((f) => f.q));
    expect(new Set(questions).size).toBe(questions.length);
  });

  it('keeps titles and descriptions within search-result limits', () => {
    for (const p of pages) {
      expect(p.metaTitle.length, p.key).toBeLessThanOrEqual(62);
      expect(p.metaDescription.length, p.key).toBeGreaterThanOrEqual(100);
      expect(p.metaDescription.length, p.key).toBeLessThanOrEqual(165);
    }
  });

  it('has real depth on every page', () => {
    for (const p of pages) {
      const words = [p.introHeading, ...p.intro, ...p.goodFor, ...p.starters, ...p.tips.flatMap((t) => [t.title, t.body]), ...p.faqs.flatMap((f) => [f.q, f.a])]
        .join(' ')
        .split(/\s+/).length;
      expect(words, p.key).toBeGreaterThan(280);
      expect(p.faqs.length, p.key).toBeGreaterThanOrEqual(4);
      expect(p.related).not.toContain(p.key);
    }
  });

  it('makes no claims the product will not keep (price, "free", "unlimited")', () => {
    const text = JSON.stringify(PAGES) + JSON.stringify(HERO);
    expect(text).not.toMatch(/\bfree\b|unlimited|no payment|₹|\$\d|\bINR\b/i);
  });
});

describe('server copy matches the gift engine', () => {
  const { occasions, headings } = engineData();

  it('uses the same hero text, button and journey as the client', () => {
    for (const key of OCCASION_KEYS) {
      expect(HERO[key].headingHtml, `${key} heading`).toBe(headings[key]);
      expect(HERO[key].lead, `${key} lead`).toBe(occasions[key].description);
      expect(HERO[key].cta, `${key} cta`).toBe(occasions[key].cta);
      expect([...HERO[key].journey], `${key} journey`).toEqual(occasions[key].path);
    }
  });

  it('agrees with the server registry on slugs and labels', () => {
    for (const key of OCCASION_KEYS) {
      expect(occasions[key].slug).toBe(OCCASIONS[key].slug);
      expect(occasions[key].label).toBe(OCCASIONS[key].label);
      expect(occasions[key].description).toBe(OCCASIONS[key].description);
    }
  });
});

describe('server-rendered HTML', () => {
  it('gives every /for page its own headline, lead and button', () => {
    const bodies = OCCASION_KEYS.map((key) => bodyForOccasion(key));
    expect(new Set(bodies).size).toBe(OCCASION_KEYS.length);
    for (const key of OCCASION_KEYS) {
      const html = bodyForOccasion(key);
      expect(html).toContain(`<h1 id="landingTitle">${HERO[key].headingHtml}</h1>`);
      expect(html).toContain(`data-choose-occasion="${key}"`);
      expect(html).toContain(HERO[key].cta);
    }
  });

  it('renders each page’s content with FAQ structured data and internal links', () => {
    for (const key of OCCASION_KEYS) {
      const html = renderToStaticMarkup(createElement(OccasionContent, { occasion: key }));
      expect(html).toContain(PAGES[key].introHeading);
      for (const faq of PAGES[key].faqs) expect(html).toContain(faq.q.replace(/&/g, '&amp;'));
      for (const related of PAGES[key].related) expect(html).toContain(`href="/for/${OCCASIONS[related].slug}"`);
      const json = /<script type="application\/ld\+json">(.*?)<\/script>/.exec(html)![1];
      const schema = JSON.parse(json.replace(/\\u003c/g, '<'));
      expect(schema.map((s: { '@type': string }) => s['@type'])).toEqual(['BreadcrumbList', 'FAQPage']);
    }
  });

  it('links the home page to all eight occasion pages', () => {
    const html = renderToStaticMarkup(createElement(HomeContent));
    for (const key of OCCASION_KEYS) expect(html).toContain(`href="/for/${OCCASIONS[key].slug}"`);
    expect(html).toContain('FAQPage');
  });
});
