import { notFound } from 'next/navigation';
import { OG_SIZE, ogCard } from '@/lib/og-card';
import { OCCASION_SLUGS, OCCASIONS } from '@/lib/occasions';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'A Luv4u gift';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const key = OCCASION_SLUGS.get(slug);
  if (!key) notFound();
  const occasion = OCCASIONS[key];
  return ogCard({ eyebrow: 'A little gift', title: occasion.label, subtitle: occasion.description });
}
