import { json } from '@/lib/http';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** For uptime monitors: 200 when the app and its database answer, 503 when the database does not. */
export async function GET() {
  if (!isSupabaseConfigured()) return json({ ok: true, database: 'not configured' });
  try {
    const { error } = await supabase().from('gifts').select('id').limit(1);
    if (error) throw error;
    return json({ ok: true, database: 'ok' });
  } catch (error) {
    console.error('Health check failed:', error);
    return json({ ok: false, database: 'down' }, 503);
  }
}
