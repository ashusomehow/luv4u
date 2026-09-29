import Script from 'next/script';
import { LEGACY_BODY_HTML } from '@/lib/legacy-body';

/**
 * Hosts the v3 gift engine (creator wizard + eight recipient journeys) inside Next.js.
 *
 * The markup is server-rendered, so crawlers and first paint see the real page; the imperative
 * engine in /legacy/app.js then binds to it. Routing (/, /for/:slug, /g/:id) is decided by the
 * Next.js route that renders this component — the engine reads location.pathname itself.
 * Links inside it are plain anchors, so every navigation is a full page load and the engine
 * always boots against fresh markup.
 */
export function LegacyApp() {
  return (
    <>
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: LEGACY_BODY_HTML }} />
      <script id="giftPayload" type="application/json" dangerouslySetInnerHTML={{ __html: 'null' }} />
      <Script src="/legacy/app.js" strategy="afterInteractive" data-luv4u-legacy="" />
    </>
  );
}
