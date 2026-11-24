'use client';

import { useState } from 'react';

type Found = { url: string; name: string; occasion: string | null };

/**
 * "Paid, but the page closed?" A buyer types the UPI reference number (or Razorpay's pay_… id) and the phone number
 * they gave the payment window, and gets the gift's link back to send. See app/api/find/route.ts.
 */
export function FindGiftForm() {
  const [ref, setRef] = useState('');
  const [contact, setContact] = useState('');
  const [state, setState] = useState<'idle' | 'finding' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [found, setFound] = useState<Found | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const cleanRef = ref.replace(/\s+/g, '');
    if (!/^(pay_[A-Za-z0-9]{6,30}|\d{12})$/.test(cleanRef)) return fail('Type the 12-digit UPI reference number from your payment app, or the payment id that starts with pay_.');
    if (!contact.trim()) return fail('Type the phone number you gave in the payment window.');
    setState('finding');
    try {
      const res = await fetch('/api/find', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ref: cleanRef, contact }) });
      const data = (await res.json().catch(() => ({}))) as Found & { error?: string };
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      setFound({ url: data.url, name: data.name, occasion: data.occasion });
      setState('idle');
    } catch (error) {
      fail(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  }
  function fail(text: string) {
    setMessage(text);
    setState('error');
  }
  async function copy() {
    if (!found) return;
    try {
      await navigator.clipboard.writeText(found.url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (found) {
    const who = found.occasion === 'wedding' ? 'Your wedding invite' : found.name ? `${found.name}’s gift` : 'Your gift';
    const share = `https://wa.me/?text=${encodeURIComponent(found.url)}`;
    return (
      <div className="legal-done find-done" role="status">
        <p>
          <strong>Found it. {who} is unlocked.</strong> Send this link:
        </p>
        <input className="find-link" readOnly value={found.url} onFocus={(e) => e.currentTarget.select()} aria-label="The gift’s link" />
        <div className="find-actions">
          <button type="button" onClick={copy}>{copied ? 'Copied ✓' : 'Copy link'}</button>
          <a href={share} target="_blank" rel="noopener noreferrer">Send on WhatsApp</a>
          <a href={found.url}>Open it</a>
        </div>
        <p className="legal-fine">To change it or read replies you need the private edit link, which lives on the phone you made it on (My little gifts).</p>
      </div>
    );
  }
  return (
    <form className="legal-form" onSubmit={submit} noValidate>
      <label htmlFor="fr">UPI reference number</label>
      <input id="fr" value={ref} onChange={(e) => setRef(e.target.value)} inputMode="text" autoComplete="off" placeholder="12 digits, e.g. 432112345678" />
      <p className="legal-fine">Open Paytm, Google Pay or PhonePe → your payment to Razorpay → “UPI Ref No” (also called UTR). Or use the payment id from Razorpay’s message, which starts with pay_.</p>
      <label htmlFor="fc">Phone number you paid with</label>
      <input id="fc" value={contact} onChange={(e) => setContact(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="98765 43210" />
      <p className="legal-fine">The number you typed into the payment window. An email works too, if you gave one.</p>
      {state === 'error' && (
        <p className="legal-error" role="alert">
          {message}
        </p>
      )}
      <button type="submit" disabled={state === 'finding'}>
        {state === 'finding' ? 'Finding…' : 'Find my gift'}
      </button>
    </form>
  );
}
