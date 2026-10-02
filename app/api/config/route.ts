import { publicMediaUrl } from '@/lib/gifts';
import { json } from '@/lib/http';
import { OCCASION_KEYS } from '@/lib/occasions';
import { PAID_LINK_DAYS, paymentsRequired, priceInr, simulatePayments } from '@/lib/payments';
import { razorpayConfigured, razorpayTestMode } from '@/lib/razorpay';
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
    payments: hosted && paymentsRequired()
      ? {
          required: true,
          priceInr: priceInr(),
          linkDays: PAID_LINK_DAYS,
          // Razorpay wins when configured; test-mode simulation only applies when there is no provider.
          ...(razorpayConfigured() ? { provider: 'razorpay', testMode: razorpayTestMode() } : simulatePayments() ? { simulated: true } : {}),
        }
      : { required: false },
  });
}
