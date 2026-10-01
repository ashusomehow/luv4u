import type { Metadata } from 'next';
import { pageMeta } from '@/lib/page-meta';
import { LegalPage } from '@/components/LegalPage';
import { ReportForm } from '@/components/ReportForm';

export const metadata: Metadata = pageMeta({ title: 'Report a gift', description: 'Tell us about a gift that is harassing, unwanted or breaks the rules. You do not need to open it: paste the link and a person reviews it.', path: '/report', noindex: true });

export default async function Report({ searchParams }: { searchParams: Promise<{ gift?: string }> }) {
  const { gift } = await searchParams;
  return (
    <LegalPage title="Report a gift" updated={false}>
      <p>
        If a gift sent to you is harassing, frightening or otherwise wrong, tell us. You don’t need to open it: just paste the link you were sent. A person reviews every report and removes gifts that break our{' '}
        <a href="/terms">terms</a>.
      </p>
      <ReportForm initial={typeof gift === 'string' ? gift.slice(0, 200) : ''} />
    </LegalPage>
  );
}
