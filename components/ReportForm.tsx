'use client';

import { useState } from 'react';

const REASONS: [string, string][] = [
  ['harassment', 'It is harassing or unwanted'],
  ['threat', 'It threatens or frightens someone'],
  ['sexual', 'It is sexual or involves a child'],
  ['hate', 'It is hateful or promotes violence'],
  ['impersonation', 'It pretends to be someone else'],
  ['privacy', 'It shares private information'],
  ['spam', 'It is spam or a scam'],
  ['other', 'Something else'],
];

/** Pulls the 24-character gift id out of a pasted link or a bare id. */
export function giftIdFrom(input: string): string | null {
  return /[a-f0-9]{24}/i.exec(input.trim())?.[0].toLowerCase() ?? null;
}

export function ReportForm({ initial }: { initial: string }) {
  const [gift, setGift] = useState(initial);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const id = giftIdFrom(gift);
    if (!id) return fail('Paste the gift’s link (the address that looks like …/g/ followed by letters and numbers).');
    if (!reason) return fail('Please choose what is wrong.');
    setState('sending');
    try {
      const res = await fetch(`/api/gifts/${id}/report`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reason, details }) });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error || 'Something went wrong.');
      setState('done');
    } catch (error) {
      fail(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  }
  function fail(text: string) {
    setMessage(text);
    setState('error');
  }

  if (state === 'done') {
    return (
      <p className="legal-done" role="status">
        Thank you. We have your report and a person will review it. You don’t need to do anything else, and you never have to open the gift.
      </p>
    );
  }
  return (
    <form className="legal-form" onSubmit={submit} noValidate>
      <label htmlFor="rg">The gift’s link</label>
      <input id="rg" value={gift} onChange={(e) => setGift(e.target.value)} placeholder="https://…/g/…" autoComplete="off" />
      <label htmlFor="rr">What is wrong?</label>
      <select id="rr" value={reason} onChange={(e) => setReason(e.target.value)}>
        <option value="">Choose one</option>
        {REASONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <label htmlFor="rd">Anything we should know? (optional)</label>
      <textarea id="rd" rows={4} maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} />
      {state === 'error' && (
        <p className="legal-error" role="alert">
          {message}
        </p>
      )}
      <button type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Send report'}
      </button>
      <p className="legal-fine">Reports are anonymous. We keep a scrambled code of your network address for up to six months to spot repeat abuse.</p>
    </form>
  );
}
