import { describe, expect, it } from 'vitest';
import { IDEA_SLUGS, IDEAS, ideasFor } from '@/lib/ideas';
import { OCCASION_KEYS } from '@/lib/occasions';

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;
const body = (i: (typeof IDEAS)[number]) =>
  [i.h1, ...i.intro, ...i.include.flatMap((x) => [x.title, x.body]), ...i.lines, ...i.avoid, ...i.faqs.flatMap((f) => [f.q, f.a])].join(' ');

describe('long-tail idea pages', () => {
  it('has unique slugs, titles, descriptions, headings and questions', () => {
    for (const field of ['slug', 'metaTitle', 'metaDescription', 'h1'] as const) {
      expect(new Set(IDEAS.map((i) => i[field])).size, field).toBe(IDEAS.length);
    }
    const questions = IDEAS.flatMap((i) => i.faqs.map((f) => f.q));
    expect(new Set(questions).size).toBe(questions.length);
    const lines = IDEAS.flatMap((i) => i.lines);
    expect(new Set(lines).size, 'no example line is reused between pages').toBe(lines.length);
  });

  it('fits search-result limits', () => {
    for (const i of IDEAS) {
      expect(i.metaTitle.length, i.slug).toBeLessThanOrEqual(62);
      expect(i.metaDescription.length, i.slug).toBeGreaterThanOrEqual(100);
      expect(i.metaDescription.length, i.slug).toBeLessThanOrEqual(175);
      expect(i.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('has real depth on every page', () => {
    for (const i of IDEAS) {
      expect(words(body(i)), i.slug).toBeGreaterThan(330);
      expect(i.intro.length, i.slug).toBeGreaterThanOrEqual(2);
      expect(i.include.length, i.slug).toBeGreaterThanOrEqual(4);
      expect(i.lines.length, i.slug).toBeGreaterThanOrEqual(5);
      expect(i.avoid.length, i.slug).toBeGreaterThanOrEqual(3);
      expect(i.faqs.length, i.slug).toBeGreaterThanOrEqual(3);
    }
  });

  it('links only to pages and occasions that exist, never to itself', () => {
    for (const i of IDEAS) {
      expect(OCCASION_KEYS).toContain(i.occasion);
      expect(i.related.length, i.slug).toBeGreaterThanOrEqual(2);
      for (const r of i.related) {
        expect(IDEA_SLUGS.has(r), `${i.slug} → ${r}`).toBe(true);
        expect(r).not.toBe(i.slug);
      }
    }
  });

  it('covers most occasions, so every /for page can link to advice', () => {
    const covered = OCCASION_KEYS.filter((k) => ideasFor(k).length > 0);
    expect(covered.length).toBeGreaterThanOrEqual(7);
  });

  it('makes no claims the product will not keep (price, "free", "unlimited", "no payment")', () => {
    const text = JSON.stringify(IDEAS);
    expect(text).not.toMatch(/\bfree\b|unlimited|no payment|₹|\$\d|\bINR\b/i);
  });
});
