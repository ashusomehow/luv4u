import { OCCASIONS, OCCASION_KEYS, OCCASION_SLUGS } from './occasions.mjs';

/**
 * SHA-256 helper using Web Crypto API
 */
async function hashSecret(secret, salt = 'luv4u-default-salt') {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret + ':' + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Standard JSON response helper
 */
function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...headers
    }
  });
}

/**
 * Extract Bearer token from Authorization header
 */
function getAuthToken(request) {
  const auth = request.headers.get('Authorization') || '';
  const match = auth.match(/^Bearer\s+([A-Za-z0-9_-]+)$/);
  return match ? match[1] : null;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;
    const salt = env?.RATE_SALT || 'luv4u-secret-salt-2026';

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

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

    // 2. Sitemap.xml (Public pages only)
    if (pathname === '/sitemap.xml') {
      const pages = [
        `${url.origin}/`,
        ...OCCASION_KEYS.map(k => `${url.origin}/for/${OCCASIONS[k].slug}`)
      ];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(loc => `  <url>\n    <loc>${loc}</loc>\n    <changefreq>monthly</changefreq>\n  </url>`).join('\n')}
</urlset>`;
      return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
    }

    // 3. API: /api/config
    if (pathname === '/api/config') {
      return json({
        product: 'luv4u',
        version: 3,
        hosted: Boolean(env?.DB),
        occasions: OCCASION_KEYS
      });
    }

    // Check DB availability for gift operations
    if (pathname.startsWith('/api/')) {
      if (!env?.DB) {
        return json({ error: 'Gift database is not configured. Deploy Cloudflare D1 to enable hosted gifts.' }, 503);
      }
    }

    // 4. API: POST /api/gifts (Create gift)
    if (pathname === '/api/gifts' && method === 'POST') {
      try {
        const body = await request.json();
        const { id, editKey, gift, cover, expiresDays = 30 } = body;

        if (!id || !editKey || !gift || typeof gift !== 'object') {
          return json({ error: 'Invalid gift data provided.' }, 400);
        }

        const recipientName = String(gift.name || '').trim();
        if (!recipientName) {
          return json({ error: 'Recipient name is required.' }, 400);
        }

        const occasion = gift.occasion || 'birthday';
        if (!OCCASION_KEYS.includes(occasion)) {
          return json({ error: `Unsupported occasion: ${occasion}` }, 400);
        }

        // Validate expiry days
        const days = Math.min(Math.max(Number(expiresDays) || 30, 1), 365);
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        const ownerHash = await hashSecret(editKey, salt);

        // Upload cover preview image to R2 if provided and R2 is bound
        let coverUrl = '';
        if (cover && typeof cover === 'string' && env?.MEDIA) {
          try {
            const matches = cover.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
            if (matches) {
              const mime = `image/${matches[1]}`;
              const binary = Uint8Array.from(atob(matches[2]), c => c.charCodeAt(0));
              const coverKey = `covers/${id}.png`;
              await env.MEDIA.put(coverKey, binary, {
                httpMetadata: { contentType: mime }
              });
              coverUrl = `${url.origin}/media/${coverKey}`;
            }
          } catch (err) {
            console.error('Cover upload error:', err);
          }
        }

        const giftPayload = {
          ...gift,
          id,
          server: true,
          coverUrl: coverUrl || gift.coverUrl || ''
        };

        await env.DB.prepare(
          'INSERT INTO gifts (id, owner_hash, gift_json, revision, expires_at) VALUES (?, ?, ?, 1, ?)'
        ).bind(id, ownerHash, JSON.stringify(giftPayload), expiresAt).run();

        return json({
          ok: true,
          gift: giftPayload,
          url: `${url.origin}/g/${id}`,
          revision: 1,
          expiresAt
        });
      } catch (err) {
        return json({ error: err.message || 'Could not save gift.' }, 500);
      }
    }

    // 5. API: PATCH /api/gifts/:id (Update gift)
    const patchGiftMatch = pathname.match(/^\/api\/gifts\/([a-zA-Z0-9_-]+)$/);
    if (patchGiftMatch && method === 'PATCH') {
      const id = patchGiftMatch[1];
      const key = getAuthToken(request);
      if (!key) return json({ error: 'Missing owner edit key.' }, 401);

      try {
        const body = await request.json();
        const { gift, expiresDays } = body;
        const ownerHash = await hashSecret(key, salt);

        const row = await env.DB.prepare(
          'SELECT id, owner_hash, revision, expires_at FROM gifts WHERE id = ?'
        ).bind(id).first();

        if (!row || row.owner_hash !== ownerHash) {
          return json({ error: 'Incorrect edit key or gift not found.' }, 403);
        }

        const newRevision = (row.revision || 1) + 1;
        let newExpiresAt = row.expires_at;
        if (expiresDays) {
          const days = Math.min(Math.max(Number(expiresDays) || 30, 1), 365);
          newExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        }

        const giftPayload = {
          ...gift,
          id,
          server: true
        };

        await env.DB.prepare(
          'UPDATE gifts SET gift_json = ?, revision = ?, expires_at = ?, updated_at = datetime("now") WHERE id = ?'
        ).bind(JSON.stringify(giftPayload), newRevision, newExpiresAt, id).run();

        return json({
          ok: true,
          gift: giftPayload,
          url: `${url.origin}/g/${id}`,
          revision: newRevision,
          expiresAt: newExpiresAt
        });
      } catch (err) {
        return json({ error: err.message || 'Could not update gift.' }, 500);
      }
    }

    // 6. API: GET /api/gifts/:id (Public view)
    const getGiftMatch = pathname.match(/^\/api\/gifts\/([a-zA-Z0-9_-]+)$/);
    if (getGiftMatch && method === 'GET') {
      const id = getGiftMatch[1];
      try {
        const row = await env.DB.prepare(
          'SELECT gift_json, expires_at FROM gifts WHERE id = ?'
        ).bind(id).first();

        if (!row) return json({ error: 'Gift not found or has been removed.' }, 404);

        if (row.expires_at && new Date(row.expires_at) < new Date()) {
          return json({ error: 'This gift has expired.' }, 410);
        }

        return json({ gift: JSON.parse(row.gift_json) });
      } catch (err) {
        return json({ error: 'Could not fetch gift.' }, 500);
      }
    }

    // 7. API: GET /api/gifts/:id/owner (Owner recovery)
    const ownerGiftMatch = pathname.match(/^\/api\/gifts\/([a-zA-Z0-9_-]+)\/owner$/);
    if (ownerGiftMatch && method === 'GET') {
      const id = ownerGiftMatch[1];
      const key = getAuthToken(request);
      if (!key) return json({ error: 'Missing edit key.' }, 401);

      try {
        const ownerHash = await hashSecret(key, salt);
        const row = await env.DB.prepare(
          'SELECT gift_json, owner_hash, revision, expires_at FROM gifts WHERE id = ?'
        ).bind(id).first();

        if (!row || row.owner_hash !== ownerHash) {
          return json({ error: 'Invalid owner key.' }, 403);
        }

        return json({
          gift: JSON.parse(row.gift_json),
          revision: row.revision,
          url: `${url.origin}/g/${id}`,
          expiresAt: row.expires_at
        });
      } catch (err) {
        return json({ error: 'Could not restore gift.' }, 500);
      }
    }

    // 8. API: DELETE /api/gifts/:id (Delete gift)
    const deleteGiftMatch = pathname.match(/^\/api\/gifts\/([a-zA-Z0-9_-]+)$/);
    if (deleteGiftMatch && method === 'DELETE') {
      const id = deleteGiftMatch[1];
      const key = getAuthToken(request);
      if (!key) return json({ error: 'Missing edit key.' }, 401);

      try {
        const ownerHash = await hashSecret(key, salt);
        const row = await env.DB.prepare('SELECT owner_hash FROM gifts WHERE id = ?').bind(id).first();
        if (!row || row.owner_hash !== ownerHash) {
          return json({ error: 'Invalid owner key.' }, 403);
        }

        await env.DB.prepare('DELETE FROM gifts WHERE id = ?').bind(id).run();
        return json({ ok: true });
      } catch (err) {
        return json({ error: 'Could not delete gift.' }, 500);
      }
    }

    // 9. API: GET /api/gifts/:id/stats (Stats & Inbox)
    const statsMatch = pathname.match(/^\/api\/gifts\/([a-zA-Z0-9_-]+)\/stats$/);
    if (statsMatch && method === 'GET') {
      const id = statsMatch[1];
      const key = getAuthToken(request);
      if (!key) return json({ error: 'Missing edit key.' }, 401);

      try {
        const ownerHash = await hashSecret(key, salt);
        const giftRow = await env.DB.prepare('SELECT owner_hash, expires_at FROM gifts WHERE id = ?').bind(id).first();
        if (!giftRow || giftRow.owner_hash !== ownerHash) {
          return json({ error: 'Invalid owner key.' }, 403);
        }

        const viewsRow = await env.DB.prepare('SELECT COUNT(*) as count FROM gift_views WHERE gift_id = ?').bind(id).first();
        const repliesRows = await env.DB.prepare(
          'SELECT reaction, message, created_at FROM gift_replies WHERE gift_id = ? ORDER BY id DESC LIMIT 50'
        ).bind(id).all();

        // Calculate reaction aggregates
        const reactionCounts = {};
        for (const r of (repliesRows.results || [])) {
          if (r.reaction) {
            reactionCounts[r.reaction] = (reactionCounts[r.reaction] || 0) + 1;
          }
        }
        const reactions = Object.entries(reactionCounts).map(([reaction, count]) => ({ reaction, count }));

        return json({
          opens: viewsRow?.count || 0,
          reactions,
          replies: repliesRows.results || [],
          expiresAt: giftRow.expires_at
        });
      } catch (err) {
        return json({ error: 'Could not fetch stats.' }, 500);
      }
    }

    // 10. API: POST /api/gifts/:id/views (Opening counter)
    const viewsMatch = pathname.match(/^\/api\/gifts\/([a-zA-Z0-9_-]+)\/views$/);
    if (viewsMatch && method === 'POST') {
      const id = viewsMatch[1];
      try {
        const { visitor } = await request.json();
        if (visitor) {
          const visitorHash = await hashSecret(visitor, salt);
          await env.DB.prepare(
            'INSERT OR IGNORE INTO gift_views (gift_id, visitor_hash) VALUES (?, ?)'
          ).bind(id, visitorHash).run();
        }
        return json({ ok: true });
      } catch {
        return json({ ok: true }); // Opening a gift shouldn't block on metrics
      }
    }

    // 11. API: POST /api/gifts/:id/reactions (Recipient reply)
    const replyMatch = pathname.match(/^\/api\/gifts\/([a-zA-Z0-9_-]+)\/reactions$/);
    if (replyMatch && method === 'POST') {
      const id = replyMatch[1];
      try {
        const { visitor, reaction, message } = await request.json();
        const visitorHash = visitor ? await hashSecret(visitor, salt) : 'anonymous';
        const cleanReaction = String(reaction || '').slice(0, 16);
        const cleanMessage = String(message || '').slice(0, 500);

        await env.DB.prepare(
          'INSERT INTO gift_replies (gift_id, visitor_hash, reaction, message) VALUES (?, ?, ?, ?)'
        ).bind(id, visitorHash, cleanReaction, cleanMessage).run();

        return json({ ok: true });
      } catch (err) {
        return json({ error: 'Could not deliver reply.' }, 500);
      }
    }

    // 12. Media Streaming: /media/*
    if (pathname.startsWith('/media/')) {
      const mediaKey = pathname.slice(7); // remove '/media/'
      if (!env?.MEDIA) return new Response('Media storage not configured.', { status: 404 });

      const object = await env.MEDIA.get(mediaKey);
      if (!object) return new Response('Media file not found.', { status: 404 });

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      return new Response(object.body, { headers });
    }

    // 13. Dynamic HTML Delivery for /g/:id (Recipient gifts)
    if (pathname.startsWith('/g/')) {
      const id = pathname.slice(3).replace(/\/$/, '');
      let response = await env.ASSETS.fetch(new Request(`${url.origin}/`, request));

      // Inject noindex to protect recipient privacy
      let html = await response.text();
      html = html.replace(
        '<head>',
        `<head>\n  <meta name="robots" content="noindex, nofollow">`
      );

      // Attempt to load preview cover metadata if available
      if (env?.DB) {
        try {
          const row = await env.DB.prepare('SELECT gift_json FROM gifts WHERE id = ?').bind(id).first();
          if (row) {
            const gift = JSON.parse(row.gift_json);
            const title = gift.sharePreview !== false && gift.name
              ? `A little gift for ${gift.name} ♡`
              : 'A little world, made just for you ♡';
            const desc = 'Open this when you have a quiet moment.';
            const coverImg = gift.coverUrl || '';

            html = html
              .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
              .replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${desc}">`);

            if (coverImg) {
              html = html.replace(
                '</head>',
                `  <meta property="og:title" content="${title}">\n  <meta property="og:description" content="${desc}">\n  <meta property="og:image" content="${coverImg}">\n  <meta name="twitter:card" content="summary_large_image">\n</head>`
              );
            }
          }
        } catch (err) {
          console.error('Metadata injection error:', err);
        }
      }

      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // 14. Occasion Landing Pages: /for/:slug
    if (pathname.startsWith('/for/')) {
      const slug = pathname.slice(5).replace(/\/$/, '');
      const occasionKey = OCCASION_SLUGS.get(slug);

      if (occasionKey && OCCASIONS[occasionKey]) {
        const occ = OCCASIONS[occasionKey];
        const res = await env.ASSETS.fetch(new Request(`${url.origin}/`, request));
        let html = await res.text();

        const title = `${occ.label} — Luv4u ♡`;
        const desc = occ.seo || occ.description;
        const canonical = `${url.origin}/for/${occ.slug}`;

        html = html
          .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
          .replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${desc}">`)
          .replace(
            '</head>',
            `  <link rel="canonical" href="${canonical}">\n  <meta property="og:title" content="${title}">\n  <meta property="og:description" content="${desc}">\n  <meta property="og:url" content="${canonical}">\n</head>`
          );

        return new Response(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
    }

    // 15. Default: Serve Static Assets from ./public
    return env.ASSETS.fetch(request);
  }
};
