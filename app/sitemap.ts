import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/env';
import { IDEAS } from '@/lib/ideas';
import { OCCASION_KEYS, OCCASIONS } from '@/lib/occasions';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl();
  return [
    { url: `${origin}/`, changeFrequency: 'monthly' },
    ...['terms', 'privacy', 'refund', 'contact'].map((page) => ({ url: `${origin}/${page}`, changeFrequency: 'yearly' as const })),
    { url: `${origin}/examples`, changeFrequency: 'monthly' as const },
    { url: `${origin}/ideas`, changeFrequency: 'monthly' as const },
    ...IDEAS.map((idea) => ({ url: `${origin}/ideas/${idea.slug}`, changeFrequency: 'monthly' as const })),
    ...OCCASION_KEYS.map((key) => ({ url: `${origin}/for/${OCCASIONS[key].slug}`, changeFrequency: 'monthly' as const })),
  ];
}
