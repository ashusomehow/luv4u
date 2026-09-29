import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LegacyApp } from '@/components/LegacyApp';
import { OCCASION_KEYS, OCCASION_SLUGS, OCCASIONS } from '@/lib/occasions';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return OCCASION_KEYS.map((key) => ({ slug: OCCASIONS[key].slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const key = OCCASION_SLUGS.get(slug);
  if (!key) return {};
  const occasion = OCCASIONS[key];
  const title = `${occasion.label} — Luv4u ♡`;
  const description = occasion.seo || occasion.description;
  return {
    title,
    description,
    alternates: { canonical: `/for/${occasion.slug}` },
    openGraph: { title, description, url: `/for/${occasion.slug}` },
  };
}

export default async function OccasionPage({ params }: Props) {
  const { slug } = await params;
  if (!OCCASION_SLUGS.has(slug)) notFound();
  return <LegacyApp />;
}
