import { timingSafeEqual } from 'node:crypto';
import { ApiError } from './http';

/** Admin endpoints need ADMIN_TOKEN as a Bearer token. Unset means the admin endpoints are off. */
export function requireAdmin(request: Request): void {
  const token = process.env.ADMIN_TOKEN;
  const given = /^Bearer\s+(\S+)$/.exec(request.headers.get('authorization') ?? '')?.[1];
  if (!token || token.length < 24 || !given) throw new ApiError(401, 'Unauthorized.');
  const a = Buffer.from(given);
  const b = Buffer.from(token);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new ApiError(401, 'Unauthorized.');
}

/**
 * The daily report (GET/POST /api/admin/daily) also accepts REPORT_TOKEN, a separate key that can only read
 * the daily numbers and write ad spend, so the Google Sheet never holds the full admin key.
 */
export function requireReportAccess(request: Request): void {
  const given = /^Bearer\s+(\S+)$/.exec(request.headers.get('authorization') ?? '')?.[1];
  const ok = (token: string | undefined) => {
    if (!token || token.length < 24 || !given) return false;
    const a = Buffer.from(given);
    const b = Buffer.from(token);
    return a.length === b.length && timingSafeEqual(a, b);
  };
  if (!ok(process.env.REPORT_TOKEN) && !ok(process.env.ADMIN_TOKEN)) throw new ApiError(401, 'Unauthorized.');
}
