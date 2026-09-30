import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/env';
import { OCCASION_KEYS, OCCASIONS } from '@/lib/occasions';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl();
  return [
    { url: `${origin}/`, changeFrequency: 'monthly' },
    ...['terms', 'privacy', 'refund', 'contact'].map((page) => ({ url: `${origin}/${page}`, changeFrequency: 'yearly' as const })),
    ...OCCASION_KEYS.map((key) => ({ url: `${origin}/for/${OCCASIONS[key].slug}`, changeFrequency: 'monthly' as const })),
  ];
}
