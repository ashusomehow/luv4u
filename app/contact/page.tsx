import type { Metadata } from 'next';
import { pageMeta } from '@/lib/page-meta';
import { LegalPage } from '@/components/LegalPage';
import { BUSINESS_NAME, CONTACT_EMAIL, GRIEVANCE_OFFICER } from '@/lib/site';

export const metadata: Metadata = pageMeta({ title: 'Contact', description: 'How to reach the small team behind Kholona about a gift, a refund, deleting something, or a gift you were sent and do not want.', path: '/contact' });

export default function Contact() {
  return (
    <LegalPage title="Contact" updated={false}>
      <p>
        {BUSINESS_NAME} is run by a small team. We read everything, and reply within two working days.
      </p>
      <h2>Questions, refunds, deleting something</h2>
      {CONTACT_EMAIL ? (
        <p>
          Write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. If it is about a gift, include the gift’s id from its share screen (please don’t send the private edit link).
        </p>
      ) : (
        <p>Our contact address is being set up. Until then, please use the report form for anything urgent about a gift.</p>
      )}
      <h2>Received a gift you don’t want?</h2>
      <p>
        You don’t have to open it. <a href="/report">Report it here</a> with the link, and we will review it.
      </p>
      {GRIEVANCE_OFFICER && (
        <>
          <h2>Grievance officer</h2>
          <p>
            {GRIEVANCE_OFFICER}
            {CONTACT_EMAIL ? (
              <>
                , <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </>
            ) : null}
          </p>
        </>
      )}
    </LegalPage>
  );
}
