import { createHash, timingSafeEqual } from 'node:crypto';
import { STORAGE_BUCKET, salt } from './env';
import { ApiError } from './http';
import { isOccasionKey, type OccasionKey } from './occasions';
import { supabase } from './supabase';

export const ID_PATTERN = /^[a-f0-9]{24}$/;
export const KEY_PATTERN = /^[a-f0-9]{64}$/;

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_GIFT_JSON_BYTES = 64 * 1024; // once media has moved to Storage
const MAX_OBJECTS_PER_GIFT = 12; // 4 photos + voice + music + cover, with headroom for edits
const MAX_IMAGE_BYTES = 1_000_000;
const MAX_COVER_BYTES = 1_500_000;
const MAX_AUDIO_BYTES = 3.2 * 1024 * 1024;

export type Gift = Record<string, unknown> & {
  name?: unknown;
  occasion?: unknown;
  vibe?: unknown;
  photos?: unknown;
  voice?: unknown;
  musicSrc?: unknown;
};

export interface GiftRow {
  id: string;
  owner_hash: string;
  gift: Gift;
  revision: number;
  expires_at: string | null;
}

export function hashSecret(secret: string): string {
  return createHash('sha256').update(`${secret}:${salt()}`).digest('hex');
}

function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function assertId(id: string): void {
  if (!ID_PATTERN.test(id)) throw new ApiError(404, 'Gift not found or has been removed.');
}

export function expiryFrom(days: unknown, fallback = 30): string {
  const n = Math.min(Math.max(Math.trunc(Number(days)) || fallback, 1), 365);
  return new Date(Date.now() + n * DAY_MS).toISOString();
}

export function isExpired(expiresAt: string | null): boolean {
  return Boolean(expiresAt) && new Date(expiresAt as string).getTime() < Date.now();
}

/* ---------------------------------------------------------------- database */

export async function findGift(id: string): Promise<GiftRow | null> {
  const { data, error } = await supabase()
    .from('gifts')
    .select('id, owner_hash, gift, revision, expires_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as GiftRow | null;
}

/** Loads a gift only if `key` is its edit key. Wrong key and missing gift look identical. */
export async function findOwnedGift(id: string, key: string): Promise<GiftRow> {
  assertId(id);
  const row = await findGift(id);
  if (!row || !sameHash(row.owner_hash, hashSecret(key))) {
    throw new ApiError(403, 'Incorrect edit key or gift not found.');
  }
  return row;
}

/* -------------------------------------------------------------- validation */

const TEXT_LIMITS: Record<string, number> = {
  name: 40,
  sender: 40,
  message: 1200,
  finalMessage: 500,
  funMessage: 140,
};

export function normalizeGift(input: unknown, id: string): Gift {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ApiError(400, 'Invalid gift data provided.');
  }
  const gift: Gift = { ...(input as Gift) };

  for (const [field, max] of Object.entries(TEXT_LIMITS)) {
    if (typeof gift[field] === 'string') gift[field] = (gift[field] as string).slice(0, max);
  }
  if (!String(gift.name ?? '').trim()) throw new ApiError(400, 'Recipient name is required.');

  const occasion = gift.occasion ?? 'birthday';
  if (!isOccasionKey(occasion)) throw new ApiError(400, `Unsupported occasion: ${String(occasion)}`);
  gift.occasion = occasion as OccasionKey;

  if (occasion === 'apology' && gift.vibe !== undefined && !['Emotional', 'Elegant'].includes(String(gift.vibe))) {
    throw new ApiError(400, 'Apology gifts support the Emotional and Elegant vibes.');
  }
  if (Array.isArray(gift.photos)) gift.photos = gift.photos.slice(0, 4);
  if (Array.isArray(gift.memories)) gift.memories = gift.memories.slice(0, 3);

  gift.id = id;
  gift.server = true;
  return gift;
}

export function assertGiftSize(gift: Gift): void {
  if (Buffer.byteLength(JSON.stringify(gift)) > MAX_GIFT_JSON_BYTES) {
    throw new ApiError(413, 'This gift is too large. Remove some text or use shorter media links.');
  }
}

/* ------------------------------------------------------------------ media */

const IMAGE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const AUDIO_TYPES: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/aac': 'aac',
};
const DATA_URI = /^data:([a-z]+\/[a-z0-9.+-]+)(?:;codecs=[A-Za-z0-9.,-]+)?;base64,([A-Za-z0-9+/=]+)$/i;

export function isDataUri(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('data:');
}

export function publicMediaUrl(path: string): string {
  return supabase().storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Only URLs that point into this gift's own folder may be stored as its cover. */
export function isOwnMediaUrl(id: string, url: unknown): url is string {
  return typeof url === 'string' && url.startsWith(publicMediaUrl(`gifts/${id}/`));
}

export type MediaKind = 'image' | 'audio' | 'cover';

async function listFolder(id: string): Promise<string[]> {
  const { data, error } = await supabase().storage.from(STORAGE_BUCKET).list(`gifts/${id}`, { limit: 100 });
  if (error) throw error;
  return (data ?? []).map((object) => object.name);
}

/** Decodes a base64 data URI, uploads it to Supabase Storage and returns its public URL. */
export async function storeDataUri(id: string, dataUri: string, kind: MediaKind): Promise<string> {
  const match = DATA_URI.exec(dataUri);
  if (!match) throw new ApiError(400, 'That media file is not in a supported format.');
  const type = match[1].toLowerCase();
  const table = kind === 'audio' ? AUDIO_TYPES : IMAGE_TYPES;
  const extension = table[type];
  if (!extension || (kind === 'cover' && type !== 'image/png')) {
    throw new ApiError(415, 'That media type is not supported.');
  }

  const bytes = Buffer.from(match[2], 'base64');
  const limit = kind === 'audio' ? MAX_AUDIO_BYTES : kind === 'cover' ? MAX_COVER_BYTES : MAX_IMAGE_BYTES;
  if (bytes.length === 0 || bytes.length > limit) {
    throw new ApiError(413, kind === 'audio' ? 'That audio file is too large.' : 'That image is too large.');
  }

  const name =
    kind === 'cover' ? 'cover.png' : `${createHash('sha256').update(bytes).digest('hex').slice(0, 24)}.${extension}`;
  const existing = await listFolder(id);
  if (!existing.includes(name) && existing.length >= MAX_OBJECTS_PER_GIFT) {
    throw new ApiError(409, 'This gift already has the maximum number of media files.');
  }

  const path = `gifts/${id}/${name}`;
  const { error } = await supabase()
    .storage.from(STORAGE_BUCKET)
    .upload(path, bytes, { contentType: type, upsert: true, cacheControl: kind === 'cover' ? '3600' : '31536000' });
  if (error) throw error;
  return publicMediaUrl(path);
}

/** Moves any embedded data-URI media out of the gift JSON and into Storage. */
export async function offloadEmbeddedMedia(id: string, gift: Gift): Promise<Gift> {
  const next: Gift = { ...gift };
  if (Array.isArray(next.photos)) {
    next.photos = await Promise.all(
      next.photos.map(async (photo: unknown) => {
        const item = photo as { src?: unknown };
        return isDataUri(item?.src) ? { ...item, src: await storeDataUri(id, item.src, 'image') } : photo;
      }),
    );
  }
  if (isDataUri(next.voice)) next.voice = await storeDataUri(id, next.voice, 'audio');
  if (isDataUri(next.musicSrc)) next.musicSrc = await storeDataUri(id, next.musicSrc, 'audio');
  return next;
}

/** Resolves the share-cover URL from either an already-uploaded URL or a PNG data URI. */
export async function resolveCover(
  id: string,
  body: { cover?: unknown; coverUrl?: unknown },
  sharePreview: boolean,
): Promise<string> {
  if (!sharePreview) return '';
  if (isDataUri(body.cover)) return storeDataUri(id, body.cover, 'cover');
  return isOwnMediaUrl(id, body.coverUrl) ? body.coverUrl : '';
}

/** Deletes stored files that the gift no longer references. */
export async function pruneMedia(id: string, gift: Gift, coverUrl: string): Promise<void> {
  const referenced = JSON.stringify(gift) + coverUrl;
  const stale = (await listFolder(id)).filter((name) => !referenced.includes(name));
  if (stale.length) {
    await supabase()
      .storage.from(STORAGE_BUCKET)
      .remove(stale.map((name) => `gifts/${id}/${name}`));
  }
}

export async function deleteAllMedia(id: string): Promise<void> {
  const names = await listFolder(id);
  if (names.length) {
    await supabase()
      .storage.from(STORAGE_BUCKET)
      .remove(names.map((name) => `gifts/${id}/${name}`));
  }
}
