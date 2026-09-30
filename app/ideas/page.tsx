import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { IDEAS } from '@/lib/ideas';
import { OCCASION_KEYS, OCCASIONS } from '@/lib/occasions';

export const metadata: Metadata = {
  title: 'Message and gift ideas for the people you love',
  description: 'What to write for a birthday, anniversary, apology, thank-you or a message for someone you miss, with real example lines you can adapt.',
  alternates: { canonical: '/ideas' },
};

export default function IdeasIndex() {
  return (
    <LegalPage title="Ideas for what to say" updated={false}>
      <p>Practical advice and example lines for the moments people struggle to put into words. Pick the one closest to yours, borrow what helps, and make it your own.</p>
      {OCCASION_KEYS.map((key) => {
        const items = IDEAS.filter((idea) => idea.occasion === key);
        if (!items.length) return null;
        return (
          <section key={key}>
            <h2>{OCCASIONS[key].label}</h2>
            <ul>
              {items.map((idea) => (
                <li key={idea.slug}>
                  <a href={`/ideas/${idea.slug}`}>{idea.h1}</a>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </LegalPage>
  );
}
