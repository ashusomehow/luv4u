import { randomBytes, timingSafeEqual } from 'node:crypto';
import { hashEmail, hashPhone } from './meta';
import { priceInr } from './payments';
import { supabase } from './supabase';

/**
 * Creator referrals. A creator shares kholona.in/r/CODE (or followers type CODE on the unlock page). The buyer
 * gets REFERRAL_DISCOUNT_INR off, and once Razorpay confirms the money the sale is credited to the creator on
 * its payment row. Commission is worked out per week (Monday to Sunday, India time) with the tiers below and
 * paid by hand; the admin tracker (/admin/referrals) records each payout.
 *
 * Everything here fails closed to "no referral": if the 0008 migration is not applied, or the lookup breaks,
 * the buyer simply pays the normal price and nothing is credited.
 */

export const REF_COOKIE = 'kholona_ref';
export const REF_COOKIE_DAYS = 30;

/** Commission tiers, by eligible sales in one week. The rate applies to all of that week's sales. */
export const TIERS = [
  { min: 20, rate: 50 },
  { min: 10, rate: 30 },
  { min: 1, rate: 20 },
] as const;

/** Weekly amounts below this roll over to the next week. Paise. */
export const MIN_PAYOUT_PAISE = 100_00;

export const rateFor = (sales: number): number => TIERS.find((t) => sales >= t.min)?.rate ?? 0;

/** The next tier above `sales`, if any: how many more sales reach it and its rate. */
export function nextTier(sales: number): { needed: number; rate: number } | null {
  const above = [...TIERS].reverse().find((t) => t.min > sales);
  return above ? { needed: above.min - sales, rate: above.rate } : null;
}

/** Codes are 3 to 20 letters or digits, stored upper case. Anything else is not a code. */
export function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toUpperCase();
  return /^[A-Z0-9]{3,20}$/.test(code) ? code : null;
}

/** Rupees off for a buyer who uses a creator code (default ₹30). Never more than the price minus ₹1. */
export function referralDiscountInr(): number {
  const raw = process.env.REFERRAL_DISCOUNT_INR;
  const n = raw === undefined || raw === '' ? 30 : Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.round(n), priceInr() - 1);
}

export interface Referrer {
  id: number;
  created_at: string;
  code: string;
  name: string;
  handle: string | null;
  phone: string | null;
  email: string | null;
  payout_name: string | null;
  account_number: string | null;
  ifsc: string | null;
  upi: string | null;
  pan: string | null;
  stats_key: string;
  active: boolean;
  notes: string | null;
}

/** An active creator with this code, or null (unknown, paused, or referrals not set up). Never throws. */
export async function findReferrer(code: string | null): Promise<Referrer | null> {
  if (!code) return null;
  try {
    const { data, error } = await supabase().from('referrers').select('*').eq('code', code).eq('active', true).maybeSingle();
    if (error) throw error;
    return (data as Referrer | null) ?? null;
  } catch (error) {
    console.warn('Referral lookup failed (treating as no code):', error instanceof Error ? error.message : error);
    return null;
  }
}

export function readRefCookie(request: Request): string | null {
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === REF_COOKIE) return normalizeCode(decodeURIComponent(rest.join('=')));
  }
  return null;
}

export interface Referral {
  code: string;
  /** Paise off the price. */
  discount: number;
}

/**
 * The referral a checkout should use. A code the page sends explicitly wins (an empty one means the buyer
 * removed it); with no field at all, the creator link's cookie is used. Only an active creator counts.
 */
export async function referralFor(request: Request, bodyCode: unknown): Promise<Referral | null> {
  const code = typeof bodyCode === 'string' ? normalizeCode(bodyCode) : readRefCookie(request);
  const referrer = await findReferrer(code);
  return referrer ? { code: referrer.code, discount: referralDiscountInr() * 100 } : null;
}

export const newStatsKey = (): string => randomBytes(18).toString('base64url');

export function sameKey(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Hashed buyer contact details, so a creator buying through their own code can be spotted without storing them. */
export function buyerHashes(buyer?: { email?: unknown; contact?: unknown }): { buyer_phone_hash: string | null; buyer_email_hash: string | null } {
  return { buyer_phone_hash: hashPhone(buyer?.contact) ?? null, buyer_email_hash: hashEmail(buyer?.email) ?? null };
}

/* ------------------------------------------------------------------ weeks */

const IST_OFFSET_MS = 330 * 60_000;
const DAY_MS = 86_400_000;

/** The Monday (India time) of the week `date` falls in, as YYYY-MM-DD. */
export function weekStart(date: Date | string): string {
  const t = new Date(new Date(date).getTime() + IST_OFFSET_MS);
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7));
  return t.toISOString().slice(0, 10);
}

/** The instant a week starts and ends (exclusive), for database filters. */
export function weekBounds(start: string): { from: string; to: string } {
  const from = Date.parse(`${start}T00:00:00+05:30`);
  return { from: new Date(from).toISOString(), to: new Date(from + 7 * DAY_MS).toISOString() };
}

export const shiftWeek = (start: string, weeks: number): string => new Date(Date.parse(`${start}T00:00:00Z`) + weeks * 7 * DAY_MS).toISOString().slice(0, 10);

/** Whether the whole week is over, so it can be paid. */
export const weekIsOver = (start: string, now = new Date()): boolean => Date.parse(weekBounds(start).to) <= now.getTime();

/* ----------------------------------------------------------------- report */

export interface SaleRow {
  order_id: string;
  ref_code: string;
  amount: number;
  discount: number;
  paid_at: string;
  buyer_phone_hash: string | null;
  buyer_email_hash: string | null;
  ref_excluded: boolean;
}

export interface Sale extends SaleRow {
  week: string;
  /** Why the sale does not count, or might not: the creator bought it, or the same buyer bought again that week. */
  flag: 'self' | 'repeat' | null;
  counts: boolean;
}

export interface Payout {
  code: string;
  week_start: string;
  sales: number;
  revenue: number;
  rate: number;
  amount: number;
  reference: string | null;
  created_at: string;
}

export interface WeekStats {
  week: string;
  clicks: number;
  checkouts: number;
  sales: number;
  revenue: number;
  flagged: number;
  rate: number;
  amount: number;
  over: boolean;
  paid: Payout | null;
}

/** Which sales count, and why not. Self-purchases never count; repeat buyers are flagged but count unless excluded. */
export function classifySales(rows: SaleRow[], referrer: Pick<Referrer, 'phone' | 'email'> | undefined): Sale[] {
  const own = new Set([hashPhone(referrer?.phone ?? undefined), hashEmail(referrer?.email ?? undefined)].filter(Boolean));
  const seen = new Set<string>();
  return [...rows]
    .sort((a, b) => a.paid_at.localeCompare(b.paid_at))
    .map((row) => {
      const week = weekStart(row.paid_at);
      const ids = [row.buyer_phone_hash, row.buyer_email_hash].filter((x): x is string => Boolean(x));
      let flag: Sale['flag'] = null;
      if (ids.some((id) => own.has(id))) flag = 'self';
      else if (ids.some((id) => seen.has(`${week}:${id}`))) flag = 'repeat';
      ids.forEach((id) => seen.add(`${week}:${id}`));
      return { ...row, week, flag, counts: !row.ref_excluded && flag !== 'self' };
    });
}

/** One creator's numbers for one week. */
export function weekStats(week: string, sales: Sale[], clicks: number, checkouts: number, paid: Payout | null, now = new Date()): WeekStats {
  const counted = sales.filter((s) => s.week === week && s.counts);
  const revenue = counted.reduce((sum, s) => sum + s.amount, 0);
  const rate = rateFor(counted.length);
  return {
    week,
    clicks,
    checkouts,
    sales: counted.length,
    revenue,
    flagged: sales.filter((s) => s.week === week && s.flag).length,
    rate,
    amount: Math.round((revenue * rate) / 100 / 100) * 100, // to the nearest rupee
    over: weekIsOver(week, now),
    paid,
  };
}

/** What is owed now: every finished, unpaid week. Paid only once it reaches the minimum; until then it rolls over. */
export function dueNow(weeks: WeekStats[]): { amount: number; weeks: string[]; payable: boolean } {
  const open = weeks.filter((w) => w.over && !w.paid && w.amount > 0);
  const amount = open.reduce((sum, w) => sum + w.amount, 0);
  return { amount, weeks: open.map((w) => w.week), payable: amount >= MIN_PAYOUT_PAISE };
}

/** Reads every row of a query, a page at a time (Supabase returns at most 1,000 rows per request). */
async function all<T>(page: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999);
    if (error) throw error;
    const rows = (data as T[] | null) ?? [];
    out.push(...rows);
    if (rows.length < 1000) return out;
  }
}

export interface CreatorReport {
  referrer: Referrer;
  weeks: WeekStats[];
  sales: Sale[];
  due: ReturnType<typeof dueNow>;
}

/**
 * Numbers for every creator (or one) over the last `count` weeks, newest first. Unpaid weeks older than that
 * window are still included in what is due.
 */
export async function referralReport(options: { code?: string; count?: number; now?: Date } = {}): Promise<CreatorReport[]> {
  const now = options.now ?? new Date();
  const count = Math.min(Math.max(options.count ?? 8, 1), 52);
  const current = weekStart(now);
  const shown = Array.from({ length: count }, (_, i) => shiftWeek(current, -i));
  const db = supabase();

  let referrersQuery = db.from('referrers').select('*');
  if (options.code) referrersQuery = referrersQuery.eq('code', options.code);
  const { data: referrerRows, error } = await referrersQuery.order('id', { ascending: true });
  if (error) throw error;
  const referrers = (referrerRows as Referrer[] | null) ?? [];
  if (!referrers.length) return [];
  const codes = referrers.map((r) => r.code);

  // Paid sales since the oldest unpaid week could be anything, so read all referred sales (a small table).
  const saleRows = await all<SaleRow>((from, to) =>
    db.from('payments').select('order_id,ref_code,amount,discount,paid_at,buyer_phone_hash,buyer_email_hash,ref_excluded').in('ref_code', codes).eq('status', 'paid').order('id', { ascending: true }).range(from, to),
  );
  const since = weekBounds(shown[shown.length - 1]).from;
  const clickRows = await all<{ code: string; created_at: string }>((from, to) =>
    db.from('referral_clicks').select('code,created_at').in('code', codes).gte('created_at', since).order('id', { ascending: true }).range(from, to),
  );
  const orderRows = await all<{ ref_code: string; created_at: string }>((from, to) =>
    db.from('payments').select('ref_code,created_at').in('ref_code', codes).gte('created_at', since).order('id', { ascending: true }).range(from, to),
  );
  const payoutRows = await all<Payout>((from, to) => db.from('referral_payouts').select('*').in('code', codes).order('id', { ascending: true }).range(from, to));

  const countBy = (rows: { created_at: string }[]) => {
    const m = new Map<string, number>();
    for (const r of rows) {
      if (!r.created_at) continue;
      const w = weekStart(r.created_at);
      m.set(w, (m.get(w) ?? 0) + 1);
    }
    return m;
  };

  return referrers.map((referrer) => {
    const sales = classifySales(
      saleRows.filter((s) => s.ref_code === referrer.code && s.paid_at),
      referrer,
    );
    const clicks = countBy(clickRows.filter((r) => r.code === referrer.code));
    const checkouts = countBy(orderRows.filter((r) => r.ref_code === referrer.code));
    const payouts = new Map(payoutRows.filter((p) => p.code === referrer.code).map((p) => [String(p.week_start).slice(0, 10), p]));
    // Every week that had a sale, plus the shown window, so nothing unpaid is forgotten.
    const weekSet = new Set([...shown, ...sales.map((s) => s.week)]);
    const weeks = [...weekSet]
      .sort((a, b) => b.localeCompare(a))
      .map((w) => weekStats(w, sales, clicks.get(w) ?? 0, checkouts.get(w) ?? 0, payouts.get(w) ?? null, now));
    return { referrer, weeks, sales, due: dueNow(weeks) };
  });
}
