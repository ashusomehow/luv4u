import { createHash } from 'node:crypto';
import { salt } from './env';
import { ApiError } from './http';
import { supabase } from './supabase';

/** The caller's address as the platform reports it, or null (local development). */
export function clientAddress(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip')?.trim() || null;
}

export function addressHash(request: Request): string | null {
  const ip = clientAddress(request);
  return ip ? createHash('sha256').update(`${ip}:${salt()}`).digest('hex') : null;
}

/**
 * Allows at most `max` hits in `windowSeconds` per caller and bucket, else throws a 429.
 * Stored in the database (not memory) so it holds across serverless instances. It fails open:
 * if the check itself breaks, the request goes through, so a database blip cannot lock out real people.
 */
export async function rateLimit(request: Request, bucket: string, max: number, windowSeconds: number): Promise<void> {
  const hash = addressHash(request);
  if (!hash) return;
  try {
    const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
    const db = supabase();
    const { count, error } = await db
      .from('rate_hits')
      .select('id', { count: 'exact', head: true })
      .eq('bucket', bucket)
      .eq('ip_hash', hash)
      .gte('at', since);
    if (error) throw error;
    if ((count ?? 0) >= max) throw new ApiError(429, 'You are doing that a little fast. Please wait a bit and try again.');
    const { error: insertError } = await db.from('rate_hits').insert({ bucket, ip_hash: hash });
    if (insertError) throw insertError;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Rate limit check failed (allowing the request):', error);
  }
}

const memoryHits = new Map<string, number[]>();

/**
 * A cheap per-instance limiter for high-volume, low-stakes endpoints (analytics), where a database write per
 * check would cost more than the event itself. Best effort: each serverless instance counts on its own.
 * Returns true when the caller is over the limit.
 */
export function overMemoryLimit(request: Request, bucket: string, max: number, windowSeconds: number): boolean {
  const hash = addressHash(request);
  if (!hash) return false;
  const key = `${bucket}:${hash}`;
  const now = Date.now();
  const recent = (memoryHits.get(key) ?? []).filter((t) => now - t < windowSeconds * 1000);
  recent.push(now);
  memoryHits.set(key, recent);
  if (memoryHits.size > 5000) for (const [k, times] of memoryHits) if (!times.some((t) => now - t < windowSeconds * 1000)) memoryHits.delete(k);
  return recent.length > max;
}

/** Limits per action. Generous for real use, tight for scripts. */
export const LIMITS = {
  create: { max: 12, window: 3600 },
  media: { max: 80, window: 3600 },
  reply: { max: 20, window: 3600 },
  report: { max: 8, window: 3600 },
  checkout: { max: 40, window: 3600 },
} as const;
