import { describe, expect, it } from 'vitest';
import raw from '@/content/testimonials.json';
import { MIN_FOR_SUMMARY, pickTestimonials, ratingSummary, validateTestimonial } from '@/lib/testimonials';

const good = { name: 'A B.', city: 'Pune', occasion: 'Birthday', rating: 5, quote: 'Lovely.', date: '2026-09-20', consent: true as const };

describe('testimonials', () => {
  it('every published entry is valid: consent given, dated after the product existed, not in the future', () => {
    for (const t of raw as unknown[]) expect(validateTestimonial(t), JSON.stringify(t)).toEqual([]);
  });
  it('rejects what cannot be real or has no permission', () => {
    expect(validateTestimonial(good, '2026-10-02')).toEqual([]);
    expect(validateTestimonial({ ...good, date: '2024-09-12' }, '2026-10-02').join()).toMatch(/before the product existed/);
    expect(validateTestimonial({ ...good, date: '2027-01-01' }, '2026-10-02').join()).toMatch(/future/);
    expect(validateTestimonial({ ...good, consent: false }).join()).toMatch(/consent/);
    expect(validateTestimonial({ ...good, rating: 6 }).join()).toMatch(/rating/);
    expect(validateTestimonial({ ...good, quote: ' ' }).join()).toMatch(/quote/);
  });
  it('invalid entries are never shown, and nothing shows when nothing is valid', () => {
    expect(pickTestimonials([])).toEqual([]);
    expect(pickTestimonials([{ ...good, date: '2024-09-12' }, { ...good, consent: false }])).toEqual([]);
  });
  it('spreads occasions and puts the newest first', () => {
    const mk = (o: string, d: string, n: string) => ({ ...good, occasion: o, date: d, name: n });
    const out = pickTestimonials([mk('Birthday', '2026-09-30', 'a'), mk('Birthday', '2026-09-29', 'b'), mk('Apology', '2026-09-28', 'c')]);
    expect(out.map(t => t.name)).toEqual(['a', 'c', 'b']);
  });
  it('shows an average only when there are enough reviews', () => {
    const many = Array.from({ length: MIN_FOR_SUMMARY }, (_, i) => ({ ...good, rating: (i % 2 ? 4 : 5) as 4 | 5 }));
    expect(ratingSummary(many.slice(1))).toBeNull();
    expect(ratingSummary(many)).toEqual({ average: '4.6', count: MIN_FOR_SUMMARY });
  });
});
