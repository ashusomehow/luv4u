import type { Metadata } from 'next';
/* eslint-disable @next/next/no-html-link-for-pages -- the home page is the gift engine; a full page load is what it needs */
import { pageMeta } from '@/lib/page-meta';
import { LegalPage } from '@/components/LegalPage';
import { FindGiftForm } from '@/components/FindGiftForm';

export const metadata: Metadata = pageMeta({ title: 'Find my gift', description: 'Paid for a Kholona gift but the page closed? Get your gift’s link back with your UPI reference number.', path: '/find', noindex: true });

export default function Find() {
  return (
    <LegalPage title="Find my gift" updated={false}>
      <p>
        Paid, but Instagram closed or the page went away before you got your link? Your gift is safe. Type the UPI reference number from your payment app and the phone number you paid with, and here is your link.
      </p>
      <FindGiftForm />
      <p className="legal-fine">
        On the phone you made it on, <a href="/">kholona.in</a> also opens it by itself, and <strong>My little gifts</strong> keeps every gift you made there.
      </p>
    </LegalPage>
  );
}
