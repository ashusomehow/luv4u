import { JsonLd } from '@/components/JsonLd';
import { siteUrl } from '@/lib/env';
import { ideasFor } from '@/lib/ideas';
import { HERO } from '@/lib/occasion-copy';
import { OCCASIONS, type OccasionKey } from '@/lib/occasions';
import { PAGES } from '@/lib/seo-content';

/** Unique, server-rendered content for one /for/<slug> page. Visible only on the landing view. */
export function OccasionContent({ occasion }: { occasion: OccasionKey }) {
  const meta = OCCASIONS[occasion];
  const page = PAGES[occasion];
  const hero = HERO[occasion];
  const origin = siteUrl();

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Kholona', item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: meta.label, item: `${origin}/for/${meta.slug}` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    },
  ];

  return (
    <section className="seo-content" aria-labelledby="seo-intro">
      <JsonLd data={schema} />

      <section>
        <h2 id="seo-intro">{page.introHeading}</h2>
        {page.intro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p>
          <a className="seo-cta" href={`/#make=${occasion}`}>
            {hero.cta}
          </a>
        </p>
      </section>

      <section>
        <h2>What they will experience</h2>
        <ol className="seo-steps">
          {hero.journey.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section>
        <h2>Who it is for</h2>
        <ul>
          {page.goodFor.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Words to get you started</h2>
        <p>Every field in Kholona has editable suggestions. Here are a few lines to make your own:</p>
        <ul>
          {page.starters.map((line) => (
            <li key={line}>“{line}”</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Three tips before you write</h2>
        <div className="seo-tips">
          {page.tips.map((tip) => (
            <div key={tip.title}>
              <h3>{tip.title}</h3>
              <p>{tip.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Questions people ask</h2>
        <dl className="seo-faq">
          {page.faqs.map((faq) => (
            <div key={faq.q}>
              <dt>{faq.q}</dt>
              <dd>{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {ideasFor(occasion).length > 0 && (
        <nav aria-label="Ideas and advice">
          <h2>Ideas and advice</h2>
          <ul>
            {ideasFor(occasion).map((idea) => (
              <li key={idea.slug}>
                <a href={`/ideas/${idea.slug}`}>{idea.h1}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <nav aria-label="More little gifts" className="seo-related">
        <h2>More little gifts</h2>
        <ul>
          {page.related.map((key) => (
            <li key={key}>
              <a href={`/for/${OCCASIONS[key].slug}`}>
                <strong>{OCCASIONS[key].label}</strong>
                <span>{OCCASIONS[key].description}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
