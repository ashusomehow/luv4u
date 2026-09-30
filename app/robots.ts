import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: ['/', '/for/'], disallow: ['/api/', '/g/'] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
