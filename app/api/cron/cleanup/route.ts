import { STORAGE_BUCKET } from '@/lib/env';
import { deleteAllMedia, ID_PATTERN } from '@/lib/gifts';
import { ApiError, handle, json, requireBackend } from '@/lib/http';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const ORPHAN_GRACE_MS = 24 * 60 * 60 * 1000;

/**
 * Daily housekeeping, triggered by Vercel Cron (which sends CRON_SECRET as a Bearer token):
 *  1. delete expired gifts (rows cascade to views and replies) and their media;
 *  2. delete media folders that never got a gift, e.g. an upload followed by an abandoned publish.
 */
export const GET = handle(async (request: Request) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    throw new ApiError(401, 'Unauthorized.');
  }

  const db = supabase();
  const { data: expired, error } = await db
    .from('gifts')
    .select('id')
    .lt('expires_at', new Date().toISOString())
    .limit(500);
  if (error) throw error;
  for (const { id } of expired ?? []) {
    await deleteAllMedia(id);
    await db.from('gifts').delete().eq('id', id);
  }

  let orphans = 0;
  const storage = db.storage.from(STORAGE_BUCKET);
  const { data: folders, error: listError } = await storage.list('gifts', { limit: 1000 });
  if (listError) throw listError;
  const ids = (folders ?? []).map((folder) => folder.name).filter((name) => ID_PATTERN.test(name));
  if (ids.length) {
    const { data: live, error: liveError } = await db.from('gifts').select('id').in('id', ids);
    if (liveError) throw liveError;
    const liveIds = new Set((live ?? []).map((row) => row.id as string));
    for (const id of ids.filter((candidate) => !liveIds.has(candidate))) {
      const { data: files } = await storage.list(`gifts/${id}`, { limit: 100 });
      const newest = Math.max(0, ...(files ?? []).map((file) => Date.parse(file.created_at ?? '') || 0));
      if (Date.now() - newest > ORPHAN_GRACE_MS) {
        await deleteAllMedia(id);
        orphans += 1;
      }
    }
  }

  return json({ ok: true, expired: expired?.length ?? 0, orphans });
});
