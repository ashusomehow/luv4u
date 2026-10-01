import type { NextConfig } from 'next';

/** The production hostname from NEXT_PUBLIC_SITE_URL, or '' for local and *.vercel.app builds. */
const siteHost = (() => {
  try {
    const host = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? '').hostname;
    return /^localhost$|\.vercel\.app$/.test(host) ? '' : host;
  } catch {
    return '';
  }
})();

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Don't generate AGENTS.md/CLAUDE.md files during `next dev`.
  agentRules: false,
  async redirects() {
    if (!siteHost) return [];
    const to = `https://${siteHost}/:path*`;
    return [
      // One address per page: www goes to the bare domain.
      { source: '/:path*', has: [{ type: 'host' as const, value: `www.${siteHost}` }], destination: to, permanent: true },
      // After the domain is live, send the old Vercel address there too (opt in with LEGACY_HOST=<that host>).
      ...(process.env.LEGACY_HOST ? [{ source: '/:path*', has: [{ type: 'host' as const, value: process.env.LEGACY_HOST }], destination: to, permanent: true }] : []),
    ];
  },
  async headers() {
    return [
      {
        // Baseline hardening for every page. The microphone is used to blow out candles and record a voice
        // note; motion sensors drive the gentle tilt. Camera and location are never used.
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'microphone=(self), accelerometer=(self), gyroscope=(self), camera=(), geolocation=(), payment=(self)' },
        ],
      },
      {
        // Gift links are private: belt and braces next to the page's own noindex.
        source: '/g/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        // The gift engine is a plain script; revalidate so deploys take effect immediately.
        source: '/legacy/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
    ];
  },
};

export default config;
