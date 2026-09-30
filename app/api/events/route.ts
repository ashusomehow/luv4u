import { NextResponse } from 'next/server';
import { cleanEvent, isBot, optedOut } from '@/lib/events';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Anonymous funnel events. Analytics must never affect the product, so every outcome,
 * including bad input, opt-outs, bots and database errors, is an empty 204.
 */
export async function POST(request: Request) {
  const done = new NextResponse(null, { status: 204 });
  if (!isSupabaseConfigured() || optedOut(request.headers) || isBot(request.headers.get('user-agent'))) return done;

  try {
    const event = cleanEvent(await request.json());
    if (event) await supabase().from('events').insert(event);
  } catch (error) {
    console.error('Event dropped:', error);
  }
  return done;
}
