import { publicMediaUrl } from '@/lib/gifts';
import { json } from '@/lib/http';
import { OCCASION_KEYS } from '@/lib/occasions';
import { PAID_LINK_DAYS, priceInr, simulatePayments } from '@/lib/payments';
import { razorpayConfigured, razorpayTestMode } from '@/lib/razorpay';
import { isSupabaseConfigured } from '@/lib/supabase';
import { pickTestimonials, ratingSummary } from '@/lib/testimonials';

export const dynamic = 'force-dynamic';

/** A few of the real, consented reviews for the unlock page, so the buyer sees proof beside the price. */
function reviewsForPaywall() {
  const all = pickTestimonials();
  const summary = ratingSummary(all);
  const quotes: { name: string; occasion: string; rating: number; quote: string }[] = [];
  // Best rated first, one per occasion, so the page can show the ones closest to the gift being sent.
  for (const t of [...all].sort((a, b) => b.rating - a.rating)) {
    if (quotes.length >= 6) break;
    if (t.quote.length > 320 || quotes.some((q) => q.occasion === t.occasion)) continue;
    quotes.push({ name: t.name, occasion: t.occasion, rating: t.rating, quote: t.quote });
  }
  return summary ? { average: summary.average, count: summary.count, quotes } : null;
}

export function GET() {
  const hosted = isSupabaseConfigured();
  return json({
    product: 'luv4u',
    version: 3,
    hosted,
    reviews: reviewsForPaywall(),
    occasions: OCCASION_KEYS,
    // Public Storage prefix: lets the browser recognise its own uploads and pack them into downloaded gifts.
    mediaBase: hosted ? publicMediaUrl('gifts/') : '',
    // Gifts start as private previews and the link opens only after payment. Without a server there is nothing to gate.
    payments: hosted
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
