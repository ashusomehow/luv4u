'use client';

import { Fragment, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

/* Types mirror lib/referrals.ts (kept loose: this page only reads them). */
interface Payout { week_start: string; amount: number; reference: string | null; created_at: string }
interface Week { week: string; clicks: number; checkouts: number; sales: number; revenue: number; flagged: number; rate: number; amount: number; over: boolean; paid: Payout | null }
interface Sale { order_id: string; amount: number; discount: number; paid_at: string; week: string; flag: 'self' | 'repeat' | null; counts: boolean; ref_excluded: boolean }
interface Referrer {
  code: string; name: string; handle: string | null; phone: string | null; email: string | null;
  payout_name: string | null; account_number: string | null; ifsc: string | null; upi: string | null; pan: string | null;
  stats_key: string; active: boolean; notes: string | null; created_at: string;
}
interface Creator { referrer: Referrer; weeks: Week[]; sales: Sale[]; due: { amount: number; weeks: string[]; payable: boolean } }
interface Report { site: string; rules: { tiers: { min: number; rate: number }[]; minPayoutInr: number; discountInr: number; priceInr: number }; creators: Creator[] }

const TOKEN_KEY = 'kholona.admin';
const inr = (paise: number) => '₹' + (paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const weekLabel = (start: string) => {
  const d = new Date(`${start}T00:00:00Z`);
  const end = new Date(d.getTime() + 6 * 86400000);
  const f = (x: Date) => x.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return `${f(d)} – ${f(end)}`;
};
const EDITABLE = [
  ['name', 'Name'], ['handle', 'Instagram / YouTube'], ['phone', 'Phone'], ['email', 'Email'],
  ['payout_name', 'Account holder'], ['account_number', 'Account number'], ['ifsc', 'IFSC'], ['upi', 'UPI (optional)'], ['pan', 'PAN'], ['notes', 'Notes'],
] as const;

function csv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
}
function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ReferralTracker() {
  // Client-only page: render nothing on the server, so the saved token never causes a hydration mismatch.
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [token, setToken] = useState(() => {
    try { return typeof window === 'undefined' ? '' : localStorage.getItem(TOKEN_KEY) ?? ''; } catch { return ''; }
  });
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [flash, setFlash] = useState('');

  const call = useCallback(async (method: 'GET' | 'POST', body?: unknown) => {
    const res = await fetch('/api/admin/referrals' + (method === 'GET' ? '?weeks=8' : ''), {
      method,
      headers: { authorization: `Bearer ${token}`, ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }, [token]);

  const load = useCallback(async () => {
    if (!token) return;
    setBusy(true); setError('');
    try { setReport(await call('GET')); } catch (e) { setError((e as Error).message); setReport(null); } finally { setBusy(false); }
  }, [call, token]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const act = async (body: Record<string, unknown>, done: string) => {
    setBusy(true); setError('');
    try { await call('POST', body); setFlash(done); setTimeout(() => setFlash(''), 3000); await load(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  const copy = async (text: string, what: string) => {
    try { await navigator.clipboard.writeText(text); setFlash(`${what} copied`); setTimeout(() => setFlash(''), 2500); } catch { window.prompt('Copy this:', text); }
  };

  const totals = useMemo(() => {
    const t = { sales: 0, revenue: 0, commission: 0, clicks: 0, due: 0, lastSales: 0, lastCommission: 0 };
    for (const c of report?.creators ?? []) {
      const [now, last] = c.weeks;
      t.sales += now?.sales ?? 0; t.revenue += now?.revenue ?? 0; t.commission += now?.amount ?? 0; t.clicks += now?.clicks ?? 0;
      t.lastSales += last?.sales ?? 0; t.lastCommission += last?.amount ?? 0;
      if (c.due.payable) t.due += c.due.amount;
    }
    return t;
  }, [report]);

  if (!mounted) return null;
  if (!report) {
    return (
      <main className="rt">
        <h1>Referral tracker</h1>
        <form className="rt-login" onSubmit={(e) => { e.preventDefault(); const v = String(new FormData(e.currentTarget).get('t') ?? '').trim(); try { localStorage.setItem(TOKEN_KEY, v); } catch {} setToken(v); }}>
          <label htmlFor="rt-token">Admin token (ADMIN_TOKEN from Vercel)</label>
          <input id="rt-token" name="t" type="password" autoComplete="current-password" defaultValue={token} />
          <button type="submit" disabled={busy}>{busy ? 'Loading…' : 'Open tracker'}</button>
          {error && <p className="rt-error" role="alert">{error}</p>}
        </form>
      </main>
    );
  }

  const site = report.site;
  const payable = report.creators.filter((c) => c.due.payable);

  return (
    <main className="rt">
      <header className="rt-top">
        <h1>Referral tracker</h1>
        <div className="rt-actions">
          <button type="button" onClick={() => void load()} disabled={busy}>{busy ? 'Refreshing…' : 'Refresh'}</button>
          <button type="button" onClick={() => setAdding((v) => !v)}>{adding ? 'Close' : '+ Add creator'}</button>
          <button type="button" disabled={!payable.length} onClick={() => download(`kholona-payouts-${new Date().toISOString().slice(0, 10)}.csv`, csv([
            ['Code', 'Name', 'Account holder', 'Account number', 'IFSC', 'UPI', 'PAN', 'Amount (INR)', 'Weeks'],
            ...payable.map((c) => [c.referrer.code, c.referrer.name, c.referrer.payout_name ?? '', c.referrer.account_number ?? '', c.referrer.ifsc ?? '', c.referrer.upi ?? '', c.referrer.pan ?? '', c.due.amount / 100, c.due.weeks.join(' ')]),
          ]))}>Payout CSV</button>
          <button type="button" className="rt-quiet" onClick={() => { try { localStorage.removeItem(TOKEN_KEY); } catch {} setToken(''); setReport(null); }}>Sign out</button>
        </div>
      </header>

      {error && <p className="rt-error" role="alert">{error}</p>}
      {flash && <p className="rt-flash" role="status">{flash}</p>}

      <section className="rt-cards" aria-label="This week">
        <div><span>Sales this week</span><strong>{totals.sales}</strong><em>last week {totals.lastSales}</em></div>
        <div><span>Revenue this week</span><strong>{inr(totals.revenue)}</strong><em>{totals.clicks} link clicks</em></div>
        <div><span>Commission this week</span><strong>{inr(totals.commission)}</strong><em>last week {inr(totals.lastCommission)}</em></div>
        <div className={totals.due ? 'is-due' : ''}><span>Pay this Friday</span><strong>{inr(totals.due)}</strong><em>{payable.length} creator{payable.length === 1 ? '' : 's'}</em></div>
      </section>

      <p className="rt-rules">
        Buyers get ₹{report.rules.discountInr} off (₹{report.rules.priceInr - report.rules.discountInr}). Weekly tiers, applied to all of a week’s sales:{' '}
        {[...report.rules.tiers].reverse().map((t, i, arr) => `${t.min}${arr[i + 1] ? `–${arr[i + 1].min - 1}` : '+'} sales ${t.rate}%`).join(' · ')}. Weeks run Monday to Sunday (India time). Under ₹{report.rules.minPayoutInr} rolls over.
      </p>

      {adding && (
        <form className="rt-form" onSubmit={(e) => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(e.currentTarget));
          void act({ action: 'create', ...data }, `Added ${String(data.code).toUpperCase()}`).then(() => setAdding(false));
        }}>
          <h2>New creator</h2>
          <label>Code (what followers type, e.g. PRIYA)<input name="code" required pattern="[A-Za-z0-9]{3,20}" style={{ textTransform: 'uppercase' }} /></label>
          {EDITABLE.map(([key, label]) => <label key={key}>{label}<input name={key} required={key === 'name'} /></label>)}
          <button type="submit" disabled={busy}>Add creator</button>
        </form>
      )}

      <div className="rt-table-wrap">
        <table className="rt-table">
          <thead>
            <tr><th>Creator</th><th>This week</th><th>Tier</th><th>Earned</th><th>Last week</th><th>Due now</th><th /></tr>
          </thead>
          <tbody>
            {report.creators.length === 0 && <tr><td colSpan={7}>No creators yet. Add the first one above.</td></tr>}
            {report.creators.map((c) => {
              const [now, last] = c.weeks;
              const r = c.referrer;
              const isOpen = open === r.code;
              return (
                <Fragment key={r.code}>
                <tr className={r.active ? '' : 'is-off'}>
                  <td>
                    <strong>{r.code}</strong> {r.name}{!r.active && <em> (paused)</em>}
                    {r.handle && <div className="rt-sub">{r.handle}</div>}
                  </td>
                  <td>{now?.sales ?? 0} sales<div className="rt-sub">{now?.clicks ?? 0} clicks · {now?.checkouts ?? 0} checkouts{now?.flagged ? ` · ⚠ ${now.flagged} flagged` : ''}</div></td>
                  <td>{now?.rate ?? 0}%</td>
                  <td>{inr(now?.amount ?? 0)}</td>
                  <td>{last?.sales ?? 0} · {inr(last?.amount ?? 0)}{last?.paid && <div className="rt-sub">paid</div>}</td>
                  <td>
                    {c.due.amount ? <strong className={c.due.payable ? 'rt-due' : ''}>{inr(c.due.amount)}</strong> : '—'}
                    {c.due.amount > 0 && !c.due.payable && <div className="rt-sub">rolls over</div>}
                    {c.due.amount > 0 && (
                      <div><button type="button" className="rt-small" disabled={busy} onClick={() => {
                        const ref = window.prompt(`Paid ${inr(c.due.amount)} to ${r.payout_name || r.name} by IMPS?\nEnter the UTR / reference number:`);
                        if (ref?.trim()) void act({ action: 'paid', code: r.code, reference: ref.trim() }, `Marked ${r.code} paid`);
                      }}>Mark paid</button></div>
                    )}
                  </td>
                  <td>
                    <button type="button" className="rt-small" onClick={() => setOpen(isOpen ? null : r.code)} aria-expanded={isOpen}>{isOpen ? 'Hide' : 'Details'}</button>
                  </td>
                </tr>
                {isOpen && <tr className="rt-open"><td colSpan={7}><Details creator={c} site={site} busy={busy} act={act} copy={copy} /></td></tr>}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Details({ creator, site, busy, act, copy }: {
  creator: Creator; site: string; busy: boolean;
  act: (body: Record<string, unknown>, done: string) => Promise<void>;
  copy: (text: string, what: string) => Promise<void>;
}) {
  const r = creator.referrer;
  const link = `${site}/r/${r.code}`;
  const stats = `${site}/r/${r.code}/stats?key=${r.stats_key}`;
  return (
    <div className="rt-details">
      <div className="rt-links">
        <button type="button" className="rt-small" onClick={() => void copy(link, 'Creator link')}>Copy link</button>
        <button type="button" className="rt-small" onClick={() => void copy(stats, 'Private stats link')}>Copy stats link</button>
        <button type="button" className="rt-small" disabled={busy} onClick={() => void act({ action: 'update', code: r.code, active: !r.active }, r.active ? `${r.code} paused` : `${r.code} active`)}>{r.active ? 'Pause' : 'Reactivate'}</button>
        <button type="button" className="rt-small rt-quiet" disabled={busy} onClick={() => { if (window.confirm('Make a new private stats link? The old one stops working.')) void act({ action: 'rotate_key', code: r.code }, 'New stats link made'); }}>New stats link</button>
      </div>
      <p className="rt-sub">{link}</p>

      <h3>Weeks</h3>
      <table className="rt-mini">
        <thead><tr><th>Week</th><th>Clicks</th><th>Checkouts</th><th>Sales</th><th>Revenue</th><th>Rate</th><th>Earned</th><th>Paid</th></tr></thead>
        <tbody>
          {creator.weeks.map((w) => (
            <tr key={w.week}>
              <td>{weekLabel(w.week)}{!w.over && <em> (running)</em>}</td><td>{w.clicks}</td><td>{w.checkouts}</td><td>{w.sales}{w.flagged ? ` ⚠${w.flagged}` : ''}</td>
              <td>{inr(w.revenue)}</td><td>{w.rate}%</td><td>{inr(w.amount)}</td><td>{w.paid ? `${inr(w.paid.amount)} · ${w.paid.reference ?? ''}` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Sales</h3>
      {creator.sales.length === 0 ? <p className="rt-sub">No sales yet.</p> : (
        <table className="rt-mini">
          <thead><tr><th>When</th><th>Order</th><th>Paid</th><th>Check</th><th>Counts</th></tr></thead>
          <tbody>
            {[...creator.sales].reverse().slice(0, 60).map((s) => (
              <tr key={s.order_id} className={s.counts ? '' : 'is-off'}>
                <td>{new Date(s.paid_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}</td>
                <td><code>{s.order_id}</code></td>
                <td>{inr(s.amount)}</td>
                <td>{s.flag === 'self' ? '⚠ creator’s own purchase' : s.flag === 'repeat' ? '⚠ same buyer again this week' : 'ok'}</td>
                <td>
                  {s.flag === 'self' ? 'no' : (
                    <button type="button" className="rt-small" disabled={busy} onClick={() => void act({ action: 'exclude', order_id: s.order_id, excluded: !s.ref_excluded }, s.ref_excluded ? 'Sale counted again' : 'Sale left out')}>
                      {s.ref_excluded ? 'Left out · count it' : 'Yes · leave out'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Details and bank account</h3>
      <form className="rt-form rt-form-inline" onSubmit={(e) => { e.preventDefault(); void act({ action: 'update', code: r.code, ...Object.fromEntries(new FormData(e.currentTarget)) }, `${r.code} saved`); }}>
        {EDITABLE.map(([key, label]) => <label key={key}>{label}<input name={key} defaultValue={r[key] ?? ''} required={key === 'name'} /></label>)}
        <button type="submit" disabled={busy}>Save</button>
      </form>
    </div>
  );
}
