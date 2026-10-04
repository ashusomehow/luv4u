/* Kholona ad measurement for Meta (Facebook / Instagram ads): the browser half.
   - Loads the Meta Pixel and reports the early funnel: PageView, ViewContent (an occasion was picked), Lead
     (a gift was created), InitiateCheckout and Purchase. The last two carry the same event id the server sends to
     the Conversions API (lib/meta.ts), so Meta counts each once even when only one of the two gets through.
   - Remembers which ad brought the visitor in, in first-party cookies the server reads when an order is created:
     _fbc / _fbp (Meta's own format) and kholona_attr (UTM tags). This is what lets the server report a sale even if
     the Pixel itself is blocked.
   - Does nothing, and sets nothing, when: no Pixel id is configured, the page is not http(s), it is a recipient
     link (/g/...), a downloaded gift or the unlock-page phone preview, or Do Not Track / Global Privacy Control is on.
   - Never sends names, messages, gift ids or typed text. */
(() => {
  const tag = document.querySelector('script[data-meta-pixel]');
  const pixel = tag && tag.getAttribute('data-meta-pixel');
  if (!pixel || !/^\d{8,20}$/.test(pixel)) return;
  if (!/^https?:$/.test(location.protocol) || document.documentElement.hasAttribute('data-embedded-gift')) return;
  if (location.pathname === '/preview-frame' || /^\/(g|edit)\//.test(location.pathname) || location.hash.startsWith('#gift=')) return;
  if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;

  const secure = location.protocol === 'https:' ? '; Secure' : '';
  const readCookie = name => { const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)')); return m ? m[1] : ''; };
  const writeCookie = (name, value, days) => { try { document.cookie = name + '=' + value + '; Max-Age=' + days * 86400 + '; Path=/; SameSite=Lax' + secure; } catch {} };

  // Which ad brought them: Meta's click id becomes _fbc, UTM tags become kholona_attr. Last ad click wins.
  const params = new URLSearchParams(location.search);
  const fbclid = (params.get('fbclid') || '').replace(/[^\w-]/g, '').slice(0, 300);
  if (fbclid.length >= 6) {
    const current = readCookie('_fbc');
    if (!current || current.split('.').slice(3).join('.') !== fbclid) writeCookie('_fbc', 'fb.1.' + Date.now() + '.' + fbclid, 90);
  }
  const tags = { s: params.get('utm_source'), m: params.get('utm_medium'), c: params.get('utm_campaign'), n: params.get('utm_content') };
  if (!tags.s && fbclid) tags.s = 'meta';
  if (tags.s) {
    const clean = {};
    for (const [k, v] of Object.entries(tags)) if (v && /^[\w .:+~%-]{1,100}$/.test(v)) clean[k] = v;
    try { writeCookie('kholona_attr', btoa(JSON.stringify(clean)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), 30); } catch {}
  }
  if (!readCookie('_fbp')) writeCookie('_fbp', 'fb.1.' + Date.now() + '.' + Math.floor(Math.random() * 9e9 + 1e9), 90);

  // The standard Pixel loader.
  !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = true; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', pixel);
  window.fbq('track', 'PageView');

  const sentOnce = new Set();
  const track = (name, data, eventID) => { try { window.fbq('track', name, data || {}, eventID ? { eventID } : undefined); } catch {} };

  window.kholonaMeta = {
    track,
    /* The server's answer to checkout / verify: { event, id, value, currency }. */
    fire(e) {
      if (!e || !/^(InitiateCheckout|Purchase)$/.test(e.event) || !/^[\w-]{6,80}$/.test(e.id || '')) return;
      track(e.event, { value: Number(e.value) || 0, currency: 'INR', content_type: 'product', content_ids: ['kholona_gift'], num_items: 1 }, e.id);
    },
    /* Called by track.js for each funnel step. Only the steps Meta needs are forwarded, once per tab. */
    onEvent(name, props, occasion) {
      if (name === 'occasion_selected') {
        const key = 'view:' + (occasion || '');
        if (!sentOnce.has(key)) { sentOnce.add(key); track('ViewContent', { content_type: 'product', content_ids: [occasion || 'gift'], content_category: occasion || undefined, content_name: 'Kholona gift' }); }
      } else if (name === 'publish_clicked' && !sentOnce.has('lead')) {
        sentOnce.add('lead'); track('Lead', { content_category: occasion || undefined, content_name: 'Kholona gift' });
      }
    },
  };
})();
