import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { HERO } from '@/lib/occasion-copy';
import { OCCASION_KEYS, OCCASIONS } from '@/lib/occasions';

export const metadata: Metadata = {
  title: 'Try a sample gift before you make one',
  description: 'Step inside a sample of every Luv4u gift: a birthday cake, a proposal, an apology, an anniversary storybook and more. See what they will feel first.',
  alternates: { canonical: '/examples' },
};

export default function Examples() {
  return (
    <LegalPage title="Step inside a sample gift" updated={false}>
      <p>The best way to know if a gift is right is to open one. Each sample below is the real thing, with a placeholder name. Open it the way your person would, then make your own.</p>
      <div className="idea-grid">
        {OCCASION_KEYS.map((key) => (
          <div key={key}>
            <h3>{OCCASIONS[key].label}</h3>
            <p>{OCCASIONS[key].description}</p>
            <p>
              <strong>What happens:</strong> {HERO[key].journey.join(' → ')}
            </p>
            <p>
              <a className="idea-cta" href={`/#demo=${key}`}>
                Open the sample
              </a>{' '}
              <a href={`/for/${OCCASIONS[key].slug}`}>Read about it</a>
            </p>
          </div>
        ))}
      </div>
    </LegalPage>
  );
}
