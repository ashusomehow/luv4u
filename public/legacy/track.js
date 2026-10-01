/* Kholona funnel tracker: anonymous, first-party, no cookies.
   - Sends a small event to /api/events for key steps (see lib/events.ts for the allowlist).
   - Uses a random per-tab session id (sessionStorage); it cannot follow anyone across visits.
   - Never sends names, messages, gift ids or any typed text.
   - Silent when: not http(s), inside a downloaded gift file, Do Not Track / Global Privacy Control is on.
   It observes clicks and view changes instead of hooking the gift engine, so the two stay decoupled. */
(() => {
  if (!/^https?:$/.test(location.protocol) || document.documentElement.hasAttribute('data-embedded-gift')) return;
  if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;

  const store = (k, v) => { try { if (v !== undefined) sessionStorage.setItem(k, v); return sessionStorage.getItem(k); } catch { return null; } };
  const hex = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => b.toString(16).padStart(2, '0')).join('');
  const session = store('luv4u.sid') || store('luv4u.sid', hex(12)) || hex(12);

  // First-touch attribution for this tab.
  const params = new URLSearchParams(location.search);
  if (!store('luv4u.src')) {
    let host = ''; try { host = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch {}
    if (host === location.hostname) host = '';
    store('luv4u.src', JSON.stringify({ referrer: host, utm_source: params.get('utm_source') || '', utm_medium: params.get('utm_medium') || '', utm_campaign: params.get('utm_campaign') || '' }));
  }
  let source = {}; try { source = JSON.parse(store('luv4u.src') || '{}'); } catch {}

  const slugToKey = { 'birthday-wish': 'birthday', 'romantic-proposal': 'proposal', 'show-your-love': 'love', 'apology-card': 'apology', anniversary: 'anniversary', 'thank-you': 'thanks', congratulations: 'congratulations', 'miss-you': 'missyou' };
  let occasion = '';
  const inferOccasion = () => {
    const exp = document.getElementById('experience');
    if (exp && !exp.hidden && exp.dataset.occasion) return exp.dataset.occasion;
    const make = /#make=(\w+)/.exec(location.hash); if (make) return make[1];
    const slug = /^\/for\/([\w-]+)/.exec(location.pathname); if (slug && slugToKey[slug[1]]) return slugToKey[slug[1]];
    return occasion;
  };

  const seen = new Set();
  const send = (name, props = {}, once = false) => {
    if (once) { if (seen.has(name)) return; seen.add(name); }
    occasion = inferOccasion() || occasion;
    const body = JSON.stringify({ name, session, occasion, path: location.pathname, props, ...source });
    try { if (!(navigator.sendBeacon && navigator.sendBeacon('/api/events', new Blob([body], { type: 'application/json' })))) throw 0; }
    catch { fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {}); }
  };

  send('page_view', {}, true);

  // Clicks (delegated, so they work for markup the engine re-renders).
  document.addEventListener('click', event => {
    const el = event.target instanceof Element ? event.target : null; if (!el) return;
    // Which lever brought them here is recorded as a single word; nothing typed is ever sent.
    if (el.closest('.resume-btn')) { const k = el.closest('.resume-btn').dataset.chooseOccasion; if (k) occasion = k; send('resume_clicked'); return; }
    if (el.closest('#stickyCta')) { send('sticky_cta_clicked'); return; }
    if (el.closest('.price-strip .btn')) { send('price_strip_cta_clicked'); return; }
    if (el.closest('[data-v3="home-demo"]')) { send('demo_opened'); return; }
    if (el.closest('[data-story="make-your-own"]')) { send('make_your_own_clicked'); return; }
    if (el.closest('[data-v3="unlock"]')) { send('unlock_clicked', { kind: 'panel' }); return; }
    if (el.closest('.unlock-tray-btn')) { send('unlock_clicked', { kind: 'preview_bar' }); return; }
    const pick = el.closest('[data-choose-occasion]');
    if (pick) { occasion = pick.dataset.chooseOccasion || occasion; send('occasion_selected', { kind: pick.classList.contains('hero-chip') ? 'chip' : pick.classList.contains('occasion-card') ? 'card' : 'other' }); return; }
    const campaign = el.closest('[data-campaign]');
    if (campaign) { occasion = campaign.dataset.campaign || occasion; send('occasion_selected', { kind: 'page_link' }); return; }
    if (el.closest('#wizardNext')) send('wizard_next', { label: el.closest('#wizardNext').textContent.trim().slice(0, 40) });
    else if (el.closest('#createGiftBtn')) send('publish_clicked');
    else if (el.closest('#copyGiftLink')) send('link_copied');
    else if (el.closest('#whatsappGift')) send('whatsapp_clicked');
    else if (el.closest('#downloadGift')) send('download_clicked');
    else if (el.closest('#previewPublished')) send('preview_opened', { kind: 'after_publish' });
  }, true);

  // View changes: the engine toggles `hidden` on whole views.
  const watch = (id, fn) => {
    const el = document.getElementById(id); if (!el) return;
    let wasHidden = el.hidden;
    new MutationObserver(() => { if (wasHidden && !el.hidden) fn(el); wasHidden = el.hidden; }).observe(el, { attributes: true, attributeFilter: ['hidden'] });
  };
  const start = () => {
    watch('creatorView', () => send('creator_opened'));
    watch('shareView', () => send('gift_published'));
    watch('experience', () => {
      const recipient = /^\/g\/[a-f0-9]{24}/.test(location.pathname) || location.hash.startsWith('#gift=');
      send(recipient ? 'gift_opened' : 'preview_opened', recipient ? {} : { kind: 'creator' });
    });
    // A reply is "sent" when the direct-reply request succeeds; observe the toast-free signal via fetch.
    const realFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const p = realFetch(input, init);
      try { const url = typeof input === 'string' ? input : input.url; if (/\/api\/gifts\/[a-f0-9]{24}\/reactions$/.test(url) && (init?.method || 'GET') === 'POST') p.then(r => { if (r.ok) send('reply_sent'); }).catch(() => {}); } catch {}
      return p;
    };
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
