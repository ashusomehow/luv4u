import { requireAdmin } from '@/lib/admin';
import { handle, json, requireBackend } from '@/lib/http';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** Open reports, newest first, for the person reviewing them. Needs ADMIN_TOKEN. */
export const GET = handle(async (request: Request) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  requireAdmin(request);
  const { data, error } = await supabase()
    .from('gift_reports')
    .select('id, created_at, gift_id, reason, details')
    .is('handled_at', null)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return json({ reports: data ?? [] });
});
