import { NextResponse } from 'next/server';
import { cleanEvent, isBot, optedOut } from '@/lib/events';
import { overMemoryLimit } from '@/lib/rate-limit';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Anonymous funnel events. Analytics must never affect the product, so every outcome,
 * including bad input, opt-outs, bots and database errors, is an empty 204.
 */
export async function POST(request: Request) {
  const done = new NextResponse(null, { status: 204 });
  if (!isSupabaseConfigured() || optedOut(request.headers) || isBot(request.headers.get('user-agent'))) return done;
  // A real visit sends a few dozen events at most; far more than that is a script filling the table.
  if (overMemoryLimit(request, 'events', 300, 3600)) return done;

  try {
    const event = cleanEvent(await request.json());
    if (event) await supabase().from('events').insert(event);
  } catch (error) {
    console.error('Event dropped:', error);
  }
  return done;
}
