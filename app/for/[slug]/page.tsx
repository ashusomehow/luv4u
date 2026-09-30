import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LegacyApp } from '@/components/LegacyApp';
import { OccasionContent } from '@/components/OccasionContent';
import { OCCASION_KEYS, OCCASION_SLUGS, OCCASIONS } from '@/lib/occasions';
import { PAGES } from '@/lib/seo-content';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return OCCASION_KEYS.map((key) => ({ slug: OCCASIONS[key].slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const key = OCCASION_SLUGS.get(slug);
  if (!key) return {};
  const { metaTitle, metaDescription } = PAGES[key];
  const url = `/for/${OCCASIONS[key].slug}`;
  return {
    title: metaTitle,
    description: metaDescription,
    alternates: { canonical: url },
    openGraph: { title: metaTitle, description: metaDescription, url, type: 'website' },
    twitter: { card: 'summary_large_image', title: metaTitle, description: metaDescription },
  };
}

export default async function OccasionPage({ params }: Props) {
  const { slug } = await params;
  const key = OCCASION_SLUGS.get(slug);
  if (!key) notFound();
  return (
    <LegacyApp occasion={key}>
      <OccasionContent occasion={key} />
    </LegacyApp>
  );
}
