import { publicMediaUrl } from '@/lib/gifts';
import { json } from '@/lib/http';
import { OCCASION_KEYS } from '@/lib/occasions';
import { paymentsRequired } from '@/lib/payments';
import { isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export function GET() {
  const hosted = isSupabaseConfigured();
  return json({
    product: 'luv4u',
    version: 3,
    hosted,
    occasions: OCCASION_KEYS,
    // Public Storage prefix: lets the browser recognise its own uploads and pack them into downloaded gifts.
    mediaBase: hosted ? publicMediaUrl('gifts/') : '',
    // When required, gifts start as private previews and the link opens only after payment.
    payments: { required: hosted && paymentsRequired() },
  });
}
