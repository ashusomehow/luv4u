import type { Metadata } from 'next';
import { LegacyApp } from '@/components/LegacyApp';
import { findGift, ID_PATTERN, isScheduled, isUnlocked } from '@/lib/gifts';
import { isSupabaseConfigured } from '@/lib/supabase';

type Props = { params: Promise<{ id: string }> };

// Gift pages are private bearer links: never cached, never indexed.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const base: Metadata = { robots: { index: false, follow: false } };
  if (!ID_PATTERN.test(id) || !isSupabaseConfigured()) return base;

  try {
    const row = await findGift(id);
    // Unpaid previews reveal nothing: no name, no cover image.
    if (!row || !isUnlocked(row) || isScheduled(row)) return base;
    const gift = row.gift;
    // "Discreet preview" gifts leave the recipient's name and cover image out of link previews.
    const discreet = gift.sharePreview === false;
    const title = !discreet && gift.name ? `A little gift for ${String(gift.name)} ♡` : 'A little world, made just for you ♡';
    const description = 'Open this when you have a quiet moment.';
    const cover = !discreet && typeof gift.coverUrl === 'string' && gift.coverUrl ? gift.coverUrl : undefined;
    return {
      ...base,
      title,
      description,
      openGraph: { title, description, ...(cover ? { images: [cover] } : {}) },
      twitter: { card: cover ? 'summary_large_image' : 'summary', title, description },
    };
  } catch (error) {
    console.error('Gift metadata failed:', error);
    return base;
  }
}

export default function GiftPage() {
  return <LegacyApp />;
}
