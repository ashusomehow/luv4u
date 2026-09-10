export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    // 1. Robots.txt
    if (pathname === '/robots.txt') {
      const robots = [
        'User-agent: *',
        'Allow: /',
        'Allow: /for/',
        'Disallow: /api/',
        'Disallow: /media/',
        'Disallow: /g/',
        `Sitemap: ${url.origin}/sitemap.xml`
      ].join('\n');
      return new Response(robots, { headers: { 'Content-Type': 'text/plain' } });
    }

    // 2. Sitemap.xml
    if (pathname === '/sitemap.xml') {
      const occasions = [
        'birthday-wish',
        'romantic-proposal',
        'show-your-love',
        'apology-card',
        'anniversary',
        'thank-you',
        'congratulations',
        'miss-you'
      ];
      const pages = [
        `${url.origin}/`,
        ...occasions.map(slug => `${url.origin}/for/${slug}`)
      ];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(loc => `  <url>\n    <loc>${loc}</loc>\n    <changefreq>monthly</changefreq>\n  </url>`).join('\n')}\n</urlset>`;
      return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
    }

    // 3. API, media, and dynamic short gift routes routed to the production backend
    if (
      pathname.startsWith('/api/') ||
      pathname.startsWith('/media/') ||
      pathname.startsWith('/g/') ||
      pathname.startsWith('/for/')
    ) {
      const backendUrl = new URL(`https://luv4u.luv4u-gift.workers.dev${pathname}${url.search}`);
      const headers = new Headers(request.headers);
      headers.set('Host', 'luv4u.luv4u-gift.workers.dev');

      const proxyReq = new Request(backendUrl, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        redirect: 'follow'
      });

      const res = await fetch(proxyReq);
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const text = await res.text();
        const rewritten = text.replaceAll('https://luv4u.luv4u-gift.workers.dev', url.origin)
                              .replaceAll('http://luv4u.luv4u-gift.workers.dev', url.origin);
        return new Response(rewritten, {
          status: res.status,
          headers: res.headers
        });
      }
      return res;
    }

    // 4. Default: Serve static assets
    return env.ASSETS.fetch(request);
  }
};
