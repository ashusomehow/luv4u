/** Canonical public origin, used for metadata, sitemap and share images. */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return 'http://localhost:3000';
}

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'gift-media';

/** Salt for hashing edit keys and visitor tokens. Required in production. */
export function salt(): string {
  const value = process.env.RATE_SALT;
  if (value) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('RATE_SALT is not configured.');
  }
  return 'luv4u-dev-only-salt';
}
