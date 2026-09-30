import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Don't generate AGENTS.md/CLAUDE.md files during `next dev`.
  agentRules: false,
  async headers() {
    return [
      {
        // The gift engine is a plain script; revalidate so deploys take effect immediately.
        source: '/legacy/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
    ];
  },
};

export default config;
