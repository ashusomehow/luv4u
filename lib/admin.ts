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
