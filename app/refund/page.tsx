import type { Metadata } from 'next';
import { ContactLine, LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Refunds and cancellations', description: 'When a Luv4u payment is refunded, and when it is not.', alternates: { canonical: '/refund' } };

export default function Refund() {
  return (
    <LegalPage title="Refunds and cancellations">
      <p>
        Making, editing and previewing a gift is free, so you see exactly what you are paying for before you pay. Because a gift is a digital item that is available the moment it is unlocked, we
        <strong> do not refund a payment because you changed your mind</strong> once a gift has been unlocked.
      </p>

      <h2>When we do refund</h2>
      <ul>
        <li>You were charged more than once for the same gift: we refund the extra charge(s).</li>
        <li>You were charged but the gift did not unlock, and we cannot unlock it within a reasonable time.</li>
        <li>The gift could not be delivered or opened because of a fault on our side that we cannot fix.</li>
      </ul>

      <h2>When we don’t</h2>
      <ul>
        <li>You changed your mind, or the recipient did not open or like the gift.</li>
        <li>You typed the wrong name or details. You can edit the gift for free at any time on the same link.</li>
        <li>The gift was removed because it broke our <a href="/terms">terms</a>.</li>
        <li>The link has expired at the end of the period shown when you paid.</li>
      </ul>

      <h2>How to ask, and how long it takes</h2>
      <p>
        Write to <ContactLine /> with your gift’s id (shown on its share screen) and what went wrong. Approved refunds go back to the original payment method, and usually reach you within 5 to 7 working
        days depending on your bank.
      </p>

      <h2>Cancellations</h2>
      <p>There is nothing to cancel: there is no subscription and nothing renews. A saved gift you never unlock is simply deleted after a few days, and you are never charged for it.</p>
    </LegalPage>
  );
}
