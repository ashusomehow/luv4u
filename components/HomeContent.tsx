import { JsonLd } from '@/components/JsonLd';
import { siteUrl } from '@/lib/env';
import { OCCASION_KEYS, OCCASIONS } from '@/lib/occasions';

const STEPS = [
  { title: 'Choose a gift', body: 'Pick the occasion: a birthday, a proposal, an apology, a thank-you and more. Each has its own little interaction.' },
  { title: 'Add their name and your words', body: 'Their name is the only thing you must add. A note, photos, memories and a voice note are optional, and every written field has editable suggestions.' },
  { title: 'Preview, then share one link', body: 'See exactly what they will see, then send the link on WhatsApp or anywhere else. They open it a little at a time.' },
];

const FAQS = [
  { q: 'What is Luv4u?', a: 'Luv4u turns a name and a feeling into a small interactive gift website. The person you send it to opens it in their browser: lights come on, notes unfold, small surprises appear.' },
  { q: 'Do I need an account?', a: 'No. There is no account for you or for the person you send it to. You keep a private recovery link so you can edit, see replies or remove the gift later.' },
  { q: 'What can I add to a gift?', a: 'Beyond their name, you can add a personal message, up to four photos, up to three memories, a voice note or music, and an optional final note. Each occasion also has its own extra details.' },
  { q: 'Is a gift page private?', a: 'Anyone with the link can open it, so share it only with the person it is for. Gift pages are hidden from search engines and you can delete a gift whenever you like. It is not end-to-end encrypted.' },
  { q: 'Can I save a gift as a file?', a: 'Yes. You can download a gift as a single HTML file that opens in a browser without any internet connection to us.' },
];

/** Server-rendered content for the home page. Visible only on the landing view. */
export function HomeContent() {
  const origin = siteUrl();
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Luv4u',
      url: `${origin}/`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    },
  ];

  return (
    <section className="seo-content" aria-labelledby="seo-home">
      <JsonLd data={schema} />

      <section>
        <h2 id="seo-home">Interactive gift websites for the people you love</h2>
        <p>
          A message is read and forgotten. A Luv4u gift is a tiny world made for one person: a birthday cake to light, a
          question to answer, an apology that gives them room, a storybook of your years together. Add a name and your
          words, preview it, and share a single link.
        </p>
      </section>

      <section>
        <h2>How it works</h2>
        <ol className="seo-steps">
          {STEPS.map((step) => (
            <li key={step.title}>
              <strong>{step.title}.</strong> {step.body}
            </li>
          ))}
        </ol>
      </section>

      <nav aria-label="All occasions" className="seo-related">
        <h2>Eight little ways to say it</h2>
        <ul>
          {OCCASION_KEYS.map((key) => (
            <li key={key}>
              <a href={`/for/${OCCASIONS[key].slug}`}>
                <strong>{OCCASIONS[key].label}</strong>
                <span>{OCCASIONS[key].description}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section>
        <h2>Questions people ask</h2>
        <dl className="seo-faq">
          {FAQS.map((faq) => (
            <div key={faq.q}>
              <dt>{faq.q}</dt>
              <dd>{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </section>
  );
}
