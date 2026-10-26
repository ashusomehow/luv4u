import Script from 'next/script';
import type { ReactNode } from 'react';
import { LEGACY_BODY_HTML } from '@/lib/legacy-body';
import { bodyForOccasion } from '@/lib/legacy-hero';
import { metaPixelId } from '@/lib/meta';
import type { OccasionKey } from '@/lib/occasions';

/**
 * Hosts the v3 gift engine (creator wizard + eight recipient journeys) inside Next.js.
 *
 * The markup is server-rendered, so crawlers and first paint see the real page; the imperative
 * engine in /legacy/app.js then binds to it. Routing (/, /for/:slug, /g/:id) is decided by the
 * Next.js route that renders this component — the engine reads location.pathname itself.
 * Links inside it are plain anchors, so every navigation is a full page load and the engine
 * always boots against fresh markup.
 *
 * For /for/<slug>, pass `occasion` so the headline, lead and button are that occasion's own in
 * the server HTML, and pass the page's SEO content as `children` (rendered below the app).
 */
const EARLY_TAP = `document.addEventListener('click',function(e){var f=document.getElementById('giftForm');if(f&&f.dataset.v3Installed==='true')return;var b=e.target&&e.target.closest&&e.target.closest('button[data-choose-occasion]');if(!b)return;var k=b.getAttribute('data-choose-occasion');if(!/^[a-z]+$/.test(k))return;e.preventDefault();b.classList.add('is-busy');location.hash='make='+k;},true);`;

export function LegacyApp({ occasion, children }: { occasion?: OccasionKey; children?: ReactNode }) {
  const pixelId = metaPixelId();
  const html = occasion ? bodyForOccasion(occasion) : LEGACY_BODY_HTML;
  return (
    <>
      {/* On a slow phone the buttons show a second or more before the gift engine is ready. A tap in that gap is not lost:
          it sets #make=<occasion>, which the engine opens as soon as it starts. */}
      <script dangerouslySetInnerHTML={{ __html: EARLY_TAP }} />
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: html }} />
      {children}
      <script id="giftPayload" type="application/json" dangerouslySetInnerHTML={{ __html: 'null' }} />
      <Script src="/legacy/track.js" strategy="afterInteractive" />
      {pixelId && <Script src="/legacy/meta.js" strategy="afterInteractive" data-meta-pixel={pixelId} />}
      <Script src="/legacy/motion.js" strategy="afterInteractive" />
      <Script src="/legacy/app.js" strategy="afterInteractive" data-luv4u-legacy="" />
    </>
  );
}
