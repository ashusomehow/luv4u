/* Plain anchors on purpose: the home page boots an imperative engine that needs a full page load. */
/* eslint-disable @next/next/no-html-link-for-pages */
import type { ReactNode } from 'react';
import { BUSINESS_NAME, CONTACT_EMAIL, LEGAL_UPDATED } from '@/lib/site';

export function ContactLine() {
  return CONTACT_EMAIL ? (
    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
  ) : (
    <span>the contact details on our Contact page</span>
  );
}

/** Shared frame for Terms, Privacy, Refunds and Contact: plain, readable, no app engine. */
export function LegalPage({ title, children, updated = true }: { title: string; children: ReactNode; updated?: boolean }) {
  return (
    <div className="legal">
      <header className="legal-head">
        <a className="legal-brand" href="/" aria-label={`${BUSINESS_NAME} home`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo-mark" src="/icon.svg" alt="" width={26} height={26} />
          khol<span>o</span>na
        </a>
        <a className="legal-back" href="/">Back to the gifts</a>
      </header>
      <main className="legal-main">
        <h1>{title}</h1>
        {updated && <p className="legal-updated">Last updated {LEGAL_UPDATED}</p>}
        {children}
      </main>
      <footer className="legal-foot">
        <nav aria-label="Legal">
          <a href="/examples">Samples</a>
          <a href="/ideas">Ideas</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="/refund">Refunds</a>
          <a href="/contact">Contact</a>
          <a href="/report">Report a gift</a>
        </nav>
      </footer>
    </div>
  );
}
