import { NextResponse } from 'next/server';
import { siteUrl } from '@/lib/env';
import { OCCASIONS, isOccasionKey } from '@/lib/occasions';
import { REF_COOKIE, REF_COOKIE_DAYS, findReferrer, normalizeCode } from '@/lib/referrals';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Link previews (WhatsApp, Instagram, Facebook) and crawlers fetch the link too: they are not clicks.
const BOT = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|curl|wget|headless/i;

/**
 * A creator's link: kholona.in/r/CODE. Remembers the creator for 30 days (so the buyer gets the discount and the
 * creator gets the sale even if they come back later), counts the visit, and opens the gift maker. `?to=` picks
 * the occasion page (birthday, proposal, love, apology, anniversary, thanks, congrats, missyou); birthday by default.
 * An unknown or paused code just opens the home page, without a discount.
 */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const referrer = await findReferrer(normalizeCode(decodeURIComponent(raw)));
  // Stay on the host the link was opened on, so the cookie set here is the one the gift maker reads.
  const base = new URL(request.url).origin || siteUrl();
  if (!referrer) return NextResponse.redirect(`${base}/`, 302);

  const to = new URL(request.url).searchParams.get('to');
  const occasion = isOccasionKey(to) ? to : 'birthday';
  const target = new URL(`${base}/for/${OCCASIONS[occasion].slug}`);
  target.searchParams.set('ref', referrer.code);
  target.searchParams.set('utm_source', 'creator');
  target.searchParams.set('utm_medium', 'referral');
  target.searchParams.set('utm_campaign', referrer.code);

  if (!BOT.test(request.headers.get('user-agent') ?? '')) {
    const { error } = await supabase().from('referral_clicks').insert({ code: referrer.code });
    if (error) console.warn('Could not count a referral click:', error.message);
  }

  const res = NextResponse.redirect(target, 302);
  res.headers.set('Cache-Control', 'no-store');
  res.cookies.set(REF_COOKIE, referrer.code, {
    maxAge: REF_COOKIE_DAYS * 86400,
    path: '/',
    sameSite: 'lax',
    secure: base.startsWith('https://'),
  });
  return res;
}
