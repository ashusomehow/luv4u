import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { siteUrl } from '@/lib/env';
import { priceInr } from '@/lib/payments';
import { MIN_PAYOUT_PAISE, TIERS, nextTier, normalizeCode, referralDiscountInr, referralReport, sameKey } from '@/lib/referrals';
import { isSupabaseConfigured } from '@/lib/supabase';
import '../../../referrals.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Your Kholona earnings', robots: { index: false, follow: false } };

const inr = (paise: number) => '₹' + (paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const weekLabel = (start: string) => {
  const d = new Date(`${start}T00:00:00Z`);
  const f = (x: Date) => x.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return `${f(d)} – ${f(new Date(d.getTime() + 6 * 86400000))}`;
};

/**
 * A creator's private earnings page: kholona.in/r/CODE/stats?key=… (the admin tracker copies the link).
 * Shows only their own numbers, never buyers' details. A wrong key is a plain 404.
 */
export default async function CreatorStats({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ key?: string }> }) {
  const code = normalizeCode((await params).code);
  const key = (await searchParams).key ?? '';
  if (!code || !key || !isSupabaseConfigured()) notFound();
  const [creator] = await referralReport({ code, count: 8 }).catch(() => []);
  if (!creator || !sameKey(key, creator.referrer.stats_key)) notFound();

  const { referrer, weeks, due } = creator;
  const now = weeks[0];
  const next = nextTier(now.sales);
  const target = next ? now.sales + next.needed : now.sales;
  const progress = next ? Math.round((now.sales / target) * 100) : 100;
  const paidTotal = weeks.reduce((sum, w) => sum + (w.paid?.amount ?? 0), 0);
  const link = `${siteUrl().replace(/^https?:\/\//, '')}/r/${referrer.code}`;
  const discount = referralDiscountInr();

  return (
    <main className="rs">
      <div className="rs-wrap">
        <Link className="rs-brand" href="/">Khol<span>ona</span></Link>
        <h1>Hi {referrer.name.split(' ')[0]} 👋</h1>

        <section className="rs-card" aria-label="This week">
          <p className="rs-muted">This week ({weekLabel(now.week)})</p>
          <div className="rs-big">{inr(now.amount)}</div>
          <p className="rs-muted">{now.sales} sale{now.sales === 1 ? '' : 's'} at {now.rate}%{now.flagged ? ` · ${now.flagged} under review` : ''}</p>
          <div className="rs-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div>
          <p className="rs-muted">
            {next ? <><strong>{next.needed} more sale{next.needed === 1 ? '' : 's'}</strong> this week and every sale this week earns <strong>{next.rate}%</strong>.</> : <>You are on the top tier: <strong>{now.rate}%</strong> on every sale this week. 🎉</>}
          </p>
        </section>

        <section className="rs-grid rs-card" aria-label="Summary">
          <div><strong>{now.clicks}</strong><span>link clicks</span></div>
          <div><strong>{inr(due.amount)}</strong><span>{due.payable ? 'paid this Friday' : due.amount ? 'rolls over' : 'due'}</span></div>
          <div><strong>{inr(paidTotal)}</strong><span>paid so far</span></div>
        </section>

        <section className="rs-card" aria-label="Your link">
          <p className="rs-muted">Your link and code</p>
          <p className="rs-link">{link} · code <code>{referrer.code}</code></p>
          <p className="rs-muted">Your followers pay ₹{priceInr() - discount} instead of ₹{priceInr()} with your link or code.</p>
        </section>

        <section className="rs-card" aria-label="Past weeks">
          <table>
            <thead><tr><th>Week</th><th>Sales</th><th>Rate</th><th>Earned</th><th>Status</th></tr></thead>
            <tbody>
              {weeks.filter((w, i) => i === 0 || w.sales || w.paid).map((w) => (
                <tr key={w.week}>
                  <td>{weekLabel(w.week)}</td><td>{w.sales}</td><td>{w.rate}%</td><td>{inr(w.amount)}</td>
                  <td>{w.paid ? `Paid · ${w.paid.reference ?? ''}` : !w.over ? 'Running' : w.amount ? 'Due' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rs-card" aria-label="How you earn">
          <p className="rs-muted"><strong>How you earn</strong> (sales from Monday to Sunday, India time):</p>
          <ul className="rs-tiers">
            {[...TIERS].reverse().map((t, i, arr) => <li key={t.min}>{t.min}{arr[i + 1] ? `–${arr[i + 1].min - 1}` : '+'} sales: {t.rate}% of every sale that week</li>)}
          </ul>
          <p className="rs-muted">Paid by IMPS every Friday for the week before. Amounts under {inr(MIN_PAYOUT_PAISE)} roll over. Your own purchases and refunded sales do not count.</p>
        </section>
      </div>
    </main>
  );
}
