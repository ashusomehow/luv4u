import { HomeContent } from '@/components/HomeContent';
import { Testimonials } from '@/components/Testimonials';
import type { Metadata } from 'next';
import { LegacyApp } from '@/components/LegacyApp';
import { pageMeta } from '@/lib/page-meta';

export const metadata: Metadata = pageMeta({
  title: 'Kholona — Interactive Gift Websites for Birthdays & Love',
  description: 'Make a little interactive gift for a birthday, a proposal, an apology, an anniversary and more. Add a name and your words, preview it, and send one link.',
  path: '/',
});

export default function HomePage() {
  return (
    <LegacyApp>
      <Testimonials />
      <HomeContent />
    </LegacyApp>
  );
}
