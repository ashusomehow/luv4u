import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { salt } from './env';

/**
 * Moving a payment from Instagram's or Facebook's in-app browser to Chrome or Safari, where UPI apps open reliably.
 *
 * The owner's edit key never goes into a URL. Instead the server seals it: AES-256-GCM with a key derived from the
 * server's secret, bound to the gift id, valid for a short while. The real browser trades the sealed token back for
 * the key (handoff route), so only this server can read it, and a token copied from a log is useless once it expires.
 */
export const HANDOFF_TTL_SECONDS = 30 * 60;

const secretKey = () => createHash('sha256').update(`kholona-handoff:${salt()}`).digest();

export function sealHandoff(giftId: string, editKey: string, now = Date.now()): { token: string; expiresAt: string } {
  const exp = Math.floor(now / 1000) + HANDOFF_TTL_SECONDS;
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', secretKey(), iv);
  cipher.setAAD(Buffer.from(giftId));
  const body = Buffer.concat([cipher.update(JSON.stringify({ k: editKey, e: exp }), 'utf8'), cipher.final()]);
  const token = Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64url');
  return { token, expiresAt: new Date(exp * 1000).toISOString() };
}

/** The edit key inside a handoff token for this gift, or null if it is forged, for another gift, or expired. */
export function openHandoff(giftId: string, token: unknown, now = Date.now()): string | null {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{40,400}$/.test(token)) return null;
  try {
    const raw = Buffer.from(token, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', secretKey(), raw.subarray(0, 12));
    decipher.setAAD(Buffer.from(giftId));
    decipher.setAuthTag(raw.subarray(12, 28));
    const data = JSON.parse(Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8')) as { k?: unknown; e?: unknown };
    if (typeof data.k !== 'string' || typeof data.e !== 'number' || data.e * 1000 < now) return null;
    return data.k;
  } catch {
    return null;
  }
}
