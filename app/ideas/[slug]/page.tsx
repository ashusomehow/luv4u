/* Plain anchors on purpose: the home page boots an imperative engine that needs a full page load. */
/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/JsonLd';
import { LegalPage } from '@/components/LegalPage';
import { siteUrl } from '@/lib/env';
import { IDEA_SLUGS, IDEAS } from '@/lib/ideas';
import { HERO } from '@/lib/occasion-copy';
import { OCCASIONS } from '@/lib/occasions';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return IDEAS.map((idea) => ({ slug: idea.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const idea = IDEA_SLUGS.get(slug);
  if (!idea) return {};
  const url = `/ideas/${idea.slug}`;
  return {
    title: idea.metaTitle,
    description: idea.metaDescription,
    alternates: { canonical: url },
    openGraph: { title: idea.metaTitle, description: idea.metaDescription, url, type: 'article' },
    twitter: { card: 'summary_large_image', title: idea.metaTitle, description: idea.metaDescription },
  };
}

export default async function IdeaPage({ params }: Props) {
  const { slug } = await params;
  const idea = IDEA_SLUGS.get(slug);
  if (!idea) notFound();
  const origin = siteUrl();
  const occasion = OCCASIONS[idea.occasion];
  const related = idea.related.flatMap((s) => IDEA_SLUGS.get(s) ?? []);

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Luv4u', item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: 'Ideas', item: `${origin}/ideas` },
        { '@type': 'ListItem', position: 3, name: idea.h1, item: `${origin}/ideas/${idea.slug}` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: idea.faqs.map((faq) => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })),
    },
  ];

  return (
    <LegalPage title={idea.h1} updated={false}>
      <JsonLd data={schema} />
      <nav className="idea-crumbs" aria-label="Breadcrumb">
        <a href="/">Luv4u</a> <span aria-hidden="true">/</span> <a href="/ideas">Ideas</a>
      </nav>
      {idea.intro.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <p>
        <a className="idea-cta" href={`/#make=${idea.occasion}`}>
          {HERO[idea.occasion].cta}
        </a>
      </p>

      <h2>What to put in it</h2>
      <div className="idea-grid">
        {idea.include.map((item) => (
          <div key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </div>
        ))}
      </div>

      <h2>Lines to make your own</h2>
      <ul>
        {idea.lines.map((line) => (
          <li key={line}>“{line}”</li>
        ))}
      </ul>

      <h2>What to avoid</h2>
      <ul>
        {idea.avoid.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <h2>Questions people ask</h2>
      <dl className="idea-faq">
        {idea.faqs.map((faq) => (
          <div key={faq.q}>
            <dt>{faq.q}</dt>
            <dd>{faq.a}</dd>
          </div>
        ))}
      </dl>

      <p>
        Ready to make it? <a href={`/for/${occasion.slug}`}>See how a {occasion.label.toLowerCase()} gift works</a>, or{' '}
        <a href={`/#make=${idea.occasion}`}>start one now</a>.
      </p>

      {related.length > 0 && (
        <nav aria-label="Related ideas">
          <h2>More ideas</h2>
          <ul>
            {related.map((r) => (
              <li key={r.slug}>
                <a href={`/ideas/${r.slug}`}>{r.h1}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </LegalPage>
  );
}
