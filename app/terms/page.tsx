import type { Metadata } from 'next';
import { pageMeta } from '@/lib/page-meta';
import { ContactLine, LegalPage } from '@/components/LegalPage';
import { BUSINESS_NAME } from '@/lib/site';

export const metadata: Metadata = pageMeta({ title: 'Terms of use', description: 'The rules for making and sharing gifts on Kholona: who can use it, what you must not make, how reports work, and how payment and expiry are handled.', path: '/terms' });

export default function Terms() {
  return (
    <LegalPage title="Terms of use">
      <p>
        These terms cover your use of {BUSINESS_NAME} (“we”, “us”), a service for making small interactive gift pages and sharing them by link. By using it you agree to them. If you
        don’t agree, please don’t use the service.
      </p>

      <h2>Who can use it</h2>
      <p>You must be 18 or older to make a gift. You may send a gift link to anyone, but only send it to people you know and who would welcome it.</p>

      <h2>What you make</h2>
      <p>
        You keep ownership of the words, photos and recordings you put into a gift, and you are responsible for them. You give us permission to store them and to show them to whoever
        you share the link with, only for the purpose of running your gift. Only upload things you have the right to use, and only include other people’s personal details if they agree.
      </p>

      <h2>What you must not make</h2>
      <ul>
        <li>Anything that harasses, threatens, stalks or frightens someone, or that is sent to someone who has asked not to hear from you.</li>
        <li>Sexual content, or any content showing or sexualising a child. This is reported to the authorities.</li>
        <li>Hate speech, or content that promotes violence or self-harm.</li>
        <li>Pretending to be someone else, or using someone’s name, photo or voice to mislead.</li>
        <li>Another person’s private information shared without their consent, scams, malware, or anything unlawful in India.</li>
        <li>Anything that overloads or attacks the service, including automated bulk creation of gifts.</li>
      </ul>

      <h2>Reports and removal</h2>
      <p>
        Anyone with a gift link can <a href="/report">report it</a>. We review reports and may remove a gift, without notice and without refund, if it breaks these terms or the law. Removal erases
        the gift’s content and stored files. We may also act on valid legal requests.
      </p>

      <h2>Gift links are private, not secret</h2>
      <p>
        Anyone who has a gift link can open it. Share it only with the person it is for. Keep your private edit link to yourself: it lets whoever holds it change or delete the gift, and we
        cannot recover it for you.
      </p>

      <h2>Price, payment and how long a gift lasts</h2>
      <p>
        Making, editing and previewing a gift is free. Sending it needs a one-time payment; the price is shown before you pay, in rupees, with no subscription. A saved gift that has not been
        unlocked is kept for a limited time (shown to you) and then deleted. An unlocked gift’s link stays live for the period shown when you pay, then the gift and its files are deleted. Keep a
        copy of anything you want to keep for longer. Refunds are covered on the <a href="/refund">Refunds</a> page.
      </p>

      <h2>No guarantees</h2>
      <p>
        We work to keep the service available, but we provide it “as is”. We don’t promise it will always be uninterrupted or error-free, or that a gift will look identical on every device or
        that it will be well received. To the extent the law allows, our total responsibility to you for any claim is limited to what you paid us for the gift concerned, and we are not liable for
        indirect or emotional losses.
      </p>

      <h2>Changes and law</h2>
      <p>
        We may update these terms; the date above shows the latest version, and continuing to use the service means you accept it. These terms are governed by the laws of India. Questions:{' '}
        <ContactLine />.
      </p>
    </LegalPage>
  );
}
