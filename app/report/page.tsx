import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { ReportForm } from '@/components/ReportForm';

export const metadata: Metadata = { title: 'Report a gift', description: 'Tell us about a gift that is harassing, unwanted or breaks the rules.', alternates: { canonical: '/report' } };

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
