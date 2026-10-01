import type { Metadata } from 'next';

/**
 * `image: null` leaves the share image to a file-based opengraph-image in the route (as /for/<slug> has).
 * Metadata for a static page: title, description, canonical, and the Open Graph and Twitter tags that
 * a page-level `openGraph` would otherwise drop (Next.js does not merge it with the layout's).
 */
export function pageMeta({ title, description, path, type = 'website', noindex = false, image = '/opengraph-image' }: { title: string; description: string; path: string; type?: 'website' | 'article'; noindex?: boolean; image?: string | null }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, url: path, type, siteName: 'Kholona', ...(image ? { images: [image] } : {}) },
    twitter: { card: 'summary_large_image', title, description, ...(image ? { images: [image] } : {}) },
  };
}
