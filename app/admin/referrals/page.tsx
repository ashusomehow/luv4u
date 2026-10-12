import type { Metadata } from 'next';
import { ReferralTracker } from '@/components/ReferralTracker';
import '../../referrals.css';

export const metadata: Metadata = { title: 'Referral tracker · Kholona', robots: { index: false, follow: false } };

/** Private: every number on it comes from /api/admin/referrals, which needs ADMIN_TOKEN. */
export default function ReferralAdminPage() {
  return <ReferralTracker />;
}
