import type { Metadata } from 'next';
import { pageMeta } from '@/lib/page-meta';
import { ContactLine, LegalPage } from '@/components/LegalPage';
import { BUSINESS_NAME, GRIEVANCE_OFFICER } from '@/lib/site';

export const metadata: Metadata = pageMeta({ title: 'Privacy policy', description: 'What Kholona stores when you make a gift, why, who else handles it, how long it is kept, and how to have it corrected or erased.', path: '/privacy' });

export default function Privacy() {
  return (
    <LegalPage title="Privacy policy">
      <p>
        This explains what {BUSINESS_NAME} collects and what we do with it. We try to collect as little as possible: there are no accounts, no advertising and no tracking cookies.
      </p>

      <h2>What we store</h2>
      <ul>
        <li>
          <strong>Your gift.</strong> The names, messages, photos, voice notes and choices you put in it, so the person you send it to can open it. Photos and recordings are stored in our file storage.
        </li>
        <li>
          <strong>A private edit key.</strong> You get a secret link that lets you edit or delete the gift. We store only a scrambled (hashed) version of the key, never the key itself.
        </li>
        <li>
          <strong>Replies.</strong> If the recipient sends a reaction or message back, we store it for you to read, together with a scrambled visitor code so one person can’t flood you. We don’t know who they are.
        </li>
        <li>
          <strong>Payments.</strong> Payments are taken by Razorpay. We never see or store your card, UPI or bank details. Razorpay may ask for details such as your phone number and email to take the payment and send a receipt, and handles them under its own privacy policy. We keep a record of each payment (the gift’s id, the amount, Razorpay’s order and payment ids, and the time) for accounting and tax purposes for as long as the law requires, even after the gift itself has been deleted. It holds no names or messages.
        </li>
        <li>
          <strong>Simple usage counts.</strong> To learn which steps confuse people we record events such as “opened the creator”. These carry a random per-tab code that cannot be linked across visits, the page
          type and where the visitor came from. They are deleted after thirteen months. They never include gift ids, names or messages, and they are skipped if your browser sends Do Not Track or Global Privacy Control.
        </li>
        <li>
          <strong>Abuse protection.</strong> To stop bulk abuse we keep a scrambled (hashed) version of your network address for up to a day alongside a count of recent requests. If someone reports a gift, the report
          carries the same kind of scrambled value and is kept for up to six months. We cannot turn these back into an address.
        </li>
        <li>
          <strong>On your device.</strong> Your drafts and list of gifts are kept in your own browser’s storage so you don’t lose work. Clearing your browser data removes them.
        </li>
      </ul>

      <h2>Who else handles it</h2>
      <p>
        We use hosting and database providers (Vercel and Supabase) to run the service, and Razorpay (the payment provider) when paid sending is on. They process data for us under their own security commitments. Their servers
        may be outside India. We don’t sell your data and we don’t share it for advertising.
      </p>

      <h2>How long we keep it</h2>
      <ul>
        <li>A saved gift that has not been unlocked: for the period shown to you (7 days by default), then deleted with its files.</li>
        <li>An unlocked gift: until its link expires (shown when you pay), then deleted with its files. You can delete it sooner from “My little gifts”.</li>
        <li>Removed gifts: the content and files are erased straight away; a small record of the removal stays.</li>
      </ul>

      <h2>Your choices</h2>
      <p>
        You can see, change and delete your gift at any time with your private edit link. To ask us to correct or erase something, or to ask what we hold about you, write to <ContactLine />. If you received a gift
        you did not want, you can <a href="/report">report it</a>. If you think we have mishandled your data you can contact our grievance officer{GRIEVANCE_OFFICER ? `, ${GRIEVANCE_OFFICER},` : ''} at the same address,
        and you may also approach the Data Protection Board of India where the law provides.
      </p>

      <h2>Children</h2>
      <p>The service is for adults. Please don’t make gifts containing a child’s photo or details unless you are their parent or guardian.</p>

      <h2>Changes</h2>
      <p>If we change this page in a way that matters, we will update the date above.</p>
    </LegalPage>
  );
}
