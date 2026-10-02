import raw from '@/content/testimonials.json';

/** When the first (older) version went live; the owner confirmed it was in use, with feedback collected, from mid-2025. */
export const PRODUCT_LAUNCH = '2025-06-01';
export const MAX_SHOWN = 12;
/** The rating summary is only shown once there are enough reviews for an average to mean something. */
export const MIN_FOR_SUMMARY = 5;

export type Testimonial = {
  name: string; // "Priya S." (first name and initial)
  city: string;
  occasion: string; // the occasion's label, e.g. "Birthday"
  rating: 1 | 2 | 3 | 4 | 5;
  quote: string; // the sender's own words, unedited apart from trimming
  date: string; // YYYY-MM-DD, when they wrote it
  consent: true; // they agreed to have this name, city and text shown here
};

export function validateTestimonial(t: unknown, today = new Date().toISOString().slice(0, 10)): string[] {
  const problems: string[] = [];
  const o = (t ?? {}) as Record<string, unknown>;
  for (const k of ['name', 'city', 'occasion', 'quote', 'date']) if (typeof o[k] !== 'string' || !(o[k] as string).trim()) problems.push(`${k} is required`);
  if (![1, 2, 3, 4, 5].includes(o.rating as number)) problems.push('rating must be 1 to 5');
  if (o.consent !== true) problems.push('consent must be true: the person agreed to have this shown');
  const date = String(o.date ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) problems.push('date must be YYYY-MM-DD');
  else if (date < PRODUCT_LAUNCH) problems.push(`date ${date} is before the product existed (${PRODUCT_LAUNCH})`);
  else if (date > today) problems.push(`date ${date} is in the future`);
  return problems;
}

/** Valid entries only, newest first, then spread so two cards of the same occasion are rarely side by side. */
export function pickTestimonials(list: unknown[] = raw as unknown[]): Testimonial[] {
  const ok = list.filter(t => validateTestimonial(t).length === 0) as Testimonial[];
  const pool = ok.sort((a, b) => b.date.localeCompare(a.date)).slice(0, MAX_SHOWN);
  const out: Testimonial[] = [];
  while (pool.length) {
    const i = pool.findIndex(t => t.occasion !== out.at(-1)?.occasion);
    out.push(pool.splice(i === -1 ? 0 : i, 1)[0]);
  }
  return out;
}

export function ratingSummary(list: Testimonial[]): { average: string; count: number } | null {
  if (list.length < MIN_FOR_SUMMARY) return null;
  return { average: (list.reduce((s, t) => s + t.rating, 0) / list.length).toFixed(1), count: list.length };
}
