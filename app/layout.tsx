import type { Metadata, Viewport } from 'next';
import { siteUrl } from '@/lib/env';
import './globals.css';
import './legacy.css';
import './creator.css';
import './seo.css';

const DESCRIPTION =
  'Create a little interactive gift for birthdays, love, proposals, apologies, anniversaries and more. Made in minutes, shared with one link.';

const FALLBACK_ICON =
  'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 32 32\'%3E%3Crect width=\'32\' height=\'32\' rx=\'8\' fill=\'%23faf7f2\'/%3E%3Cpath d=\'M16 25.5 C15.5 25.5 6 19.5 4 14.5 C2 9.5 5.5 5.5 10 5.5 C12.8 5.5 14.8 7.2 16 9 C17.2 7.2 19.2 5.5 22 5.5 C26.5 5.5 30 9.5 28 14.5 C26 19.5 16.5 25.5 16 25.5 Z\' fill=\'%23aa5265\'/%3E%3Cpath d=\'M23 6 L24 4 L25 6 L27 7 L25 8 L24 10 L23 8 L21 7 Z\' fill=\'%23ebbe71\'/%3E%3C/svg%3E';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: 'Luv4u — little gifts, big feelings',
  description: DESCRIPTION,
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    // Inline fallback so a downloaded gift opened from disk has an icon without the site.
    other: [{ rel: 'alternate icon', url: FALLBACK_ICON }],
  },
  openGraph: { siteName: 'Luv4u', type: 'website', title: 'Luv4u — little gifts, big feelings', description: DESCRIPTION },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#faf7f2',
};

/** A dark first paint for recipient links, so a gift never flashes the bright landing page. */
const FIRST_PAINT = `(()=>{if(location.hash.startsWith('#gift=')||/^\\/g\\/[a-f0-9]{24}/.test(location.pathname)||document.documentElement.hasAttribute('data-embedded-gift'))document.documentElement.classList.add('gift-loading');})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The gift engine toggles classes on <html>/<body> after hydration.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script id="luv4u-firstpaint" dangerouslySetInnerHTML={{ __html: FIRST_PAINT }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
