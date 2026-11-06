import { requireReportAccess } from '@/lib/admin';
import { ApiError, handle, json, readJson, requireBackend } from '@/lib/http';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** The columns daily_report() returns (migration 0010), in order. Money is in rupees. */
const COLUMNS = [
  'day', 'spend', 'meta_purchases', 'visitors', 'ad_visitors', 'makers', 'gifts_made', 'unlock_views', 'pay_clicks',
  'checkouts', 'sales', 'revenue', 'ad_sales', 'ad_revenue', 'creator_sales', 'birthday_sales', 'sorry_sales', 'free_unlocks',
] as const;
type Column = (typeof COLUMNS)[number];
type DayRow = Record<Column, string | number | null>;

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 400;

function missingMigration(error: { code?: string; message?: string }): boolean {
  return /PGRST202|42883|42P01|daily_report|ad_spend/.test(`${error.code ?? ''} ${error.message ?? ''}`);
}

function clean(row: Record<string, unknown>): DayRow {
  const out = {} as DayRow;
  for (const key of COLUMNS) {
    const value = row[key];
    if (key === 'day') out.day = String(value ?? '').slice(0, 10);
    else if (value === null || value === undefined) out[key] = null;
    else out[key] = Number(value);
  }
  return out;
}

const csvCell = (v: unknown) => (v === null || v === undefined ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

/**
 * GET: one row per day (India time, newest first) for the last `days` days (default 120, at most 400): ad spend as
 * typed in, the funnel from our own events, and real sales and revenue from payments (not Meta's numbers).
 * `?format=csv` returns the same as CSV. Needs REPORT_TOKEN (or ADMIN_TOKEN) as a Bearer token.
 */
export const GET = handle(async (request: Request) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  requireReportAccess(request);
  const url = new URL(request.url);
  const days = Math.min(MAX_DAYS, Math.max(1, Math.floor(Number(url.searchParams.get('days')) || 120)));
  const { data, error } = await supabase().rpc('daily_report', { days });
  if (error) {
    if (missingMigration(error)) throw new ApiError(503, 'Run supabase/migrations/0010_daily_report.sql first.');
    throw error;
  }
  const rows = ((data ?? []) as Record<string, unknown>[]).map(clean);
  if (url.searchParams.get('format') === 'csv') {
    const body = [COLUMNS.join(','), ...rows.map((r) => COLUMNS.map((c) => csvCell(r[c])).join(','))].join('\n') + '\n';
    return new Response(body, { headers: { 'content-type': 'text/csv; charset=utf-8', 'cache-control': 'no-store' } });
  }
  return json({ ok: true, days, timeZone: 'Asia/Kolkata', generatedAt: new Date().toISOString(), rows });
});

/**
 * POST { spend: [{ date: 'YYYY-MM-DD', spend: 812.4 | null, metaPurchases?: number | null, note?: string }] }
 * saves the ad spend typed into the Google Sheet. A null (blank) spend removes that day. At most 400 days at once.
 */
export const POST = handle(async (request: Request) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  requireReportAccess(request);
  const body = await readJson<{ spend?: unknown }>(request);
  if (!body || !Array.isArray(body.spend) || body.spend.length > MAX_DAYS) throw new ApiError(400, 'Send { spend: [...] } with at most 400 days.');
  const latest = new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);
  const save: { day: string; spend: number; meta_purchases: number | null; note: string | null; updated_at: string }[] = [];
  const remove: string[] = [];
  const now = new Date().toISOString();
  for (const item of body.spend as Record<string, unknown>[]) {
    const day = typeof item?.date === 'string' ? item.date : '';
    const valid = DAY.test(day) && !Number.isNaN(Date.parse(day + 'T00:00:00Z')) && new Date(day + 'T00:00:00Z').toISOString().slice(0, 10) === day && day >= '2024-01-01' && day <= latest;
    if (!valid) throw new ApiError(400, `Not a date: ${String(item?.date).slice(0, 20)}`);
    if (item.spend === null || item.spend === undefined || item.spend === '') { remove.push(day); continue; }
    const spend = Number(item.spend);
    if (!Number.isFinite(spend) || spend < 0 || spend > 10_000_000) throw new ApiError(400, `Not an amount for ${day}.`);
    const mp = item.metaPurchases === null || item.metaPurchases === undefined || item.metaPurchases === '' ? null : Number(item.metaPurchases);
    if (mp !== null && (!Number.isInteger(mp) || mp < 0 || mp > 100_000)) throw new ApiError(400, `Not a purchase count for ${day}.`);
    const note = typeof item.note === 'string' && item.note.trim() ? item.note.trim().slice(0, 200) : null;
    save.push({ day, spend: Math.round(spend * 100) / 100, meta_purchases: mp, note, updated_at: now });
  }
  const db = supabase();
  if (save.length) {
    const { error } = await db.from('ad_spend').upsert(save, { onConflict: 'day' });
    if (error) {
      if (missingMigration(error)) throw new ApiError(503, 'Run supabase/migrations/0010_daily_report.sql first.');
      throw error;
    }
  }
  if (remove.length) {
    const { error } = await db.from('ad_spend').delete().in('day', remove);
    if (error) throw error;
  }
  return json({ ok: true, saved: save.length, removed: remove.length });
});
