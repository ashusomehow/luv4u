import Link from 'next/link';
import { pickTestimonials, ratingSummary, type Testimonial } from '@/lib/testimonials';

const month = (d: string) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' });

function Card({ t }: { t: Testimonial }) {
  return (
    <figure className="tm-card">
      <div className="tm-stars" role="img" aria-label={`${t.rating} out of 5`}>{'★'.repeat(t.rating)}<span aria-hidden="true">{'★'.repeat(5 - t.rating)}</span></div>
      <blockquote><p>{t.quote}</p></blockquote>
      <figcaption>
        <span className="tm-who"><strong>{t.name}</strong> · {t.city}</span>
        <span className="tm-meta"><span className="tm-tag">{t.occasion}</span> {month(t.date)}</span>
      </figcaption>
    </figure>
  );
}

/**
 * A slow, pausable row of real feedback. Renders nothing until content/testimonials.json holds entries that pass
 * validateTestimonial (consent given, dated after the product existed), so it can never show an empty or invented section.
 * The second copy of the track is for the seamless loop only and is hidden from screen readers and the tab order.
 */
export function Testimonials() {
  const items = pickTestimonials();
  if (!items.length) return null;
  const summary = ratingSummary(items);
  return (
    <section className="tm" aria-labelledby="tmTitle">
      <div className="tm-head">
        <p className="tm-eyebrow">After they opened it</p>
        <h2 id="tmTitle">What people say once the link is sent</h2>
        {summary && <p className="tm-summary"><strong>{summary.average}</strong> out of 5 <span aria-hidden="true">·</span> from {summary.count} messages we received</p>}
      </div>
      <div className="tm-marquee" tabIndex={0} aria-label="Messages from people who sent a gift. Scroll sideways to read more.">
        <div className="tm-track" style={{ ['--tm-n' as string]: items.length }}>
          {items.map(t => <Card key={t.name + t.date} t={t} />)}
        </div>
        <div className="tm-track" aria-hidden="true" {...{ inert: true }} style={{ ['--tm-n' as string]: items.length }}>
          {items.map(t => <Card key={'b' + t.name + t.date} t={t} />)}
        </div>
      </div>
      <p className="tm-cta"><Link href="/#make=birthday" data-choose-occasion="birthday">Make one for someone</Link></p>
    </section>
  );
}
