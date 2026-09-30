import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: ['/', '/for/', '/ideas', '/terms', '/privacy', '/refund', '/contact'], disallow: ['/api/', '/g/'] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
