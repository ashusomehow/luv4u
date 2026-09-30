import { LEGACY_BODY_HTML } from './legacy-body';
import { HERO } from './occasion-copy';
import type { OccasionKey } from './occasions';

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function replaceOnce(html: string, pattern: RegExp, replacement: (match: RegExpExecArray) => string): string {
  const match = pattern.exec(html);
  // Loud failure: if the engine markup changes, a silent no-op would ship duplicate pages again.
  if (!match) throw new Error(`Landing markup no longer matches ${pattern}`);
  return html.slice(0, match.index) + replacement(match) + html.slice(match.index + match[0].length);
}

/**
 * The landing markup with the occasion's own headline, lead and button already in place, so the
 * server-rendered HTML for /for/<slug> is different from the home page. The engine then applies
 * the same text on the client, so nothing visibly changes on load.
 */
export function bodyForOccasion(key: OccasionKey): string {
  const hero = HERO[key];
  let html = replaceOnce(LEGACY_BODY_HTML, /<h1 id="landingTitle">[\s\S]*?<\/h1>/, () => `<h1 id="landingTitle">${hero.headingHtml}</h1>`);
  html = replaceOnce(html, /<p class="hero-desc" id="landingLead">[\s\S]*?<\/p>/, () => `<p class="hero-desc" id="landingLead">${escapeHtml(hero.lead)}</p>`);
  html = replaceOnce(
    html,
    /<button class="btn btn-primary pulse-cta" id="primaryCreate" data-action="create">Make a gift, free preview (<svg[\s\S]*?<\/svg>)<\/button>/,
    (m) => `<button class="btn btn-primary pulse-cta" id="primaryCreate" data-choose-occasion="${key}">${escapeHtml(hero.cta)} ${m[1]}</button>`,
  );
  return html;
}
