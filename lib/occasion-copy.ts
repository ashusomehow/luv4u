import type { OccasionKey } from './occasions';

/**
 * Landing-page text the gift engine (public/legacy/app.js) also sets on the client.
 * It is rendered on the server too, so crawlers and first paint see the occasion-specific
 * page. tests/seo.test.ts fails if these drift from the engine.
 */
export interface HeroCopy {
  /** Inner HTML of the <h1>; the engine uses the same string. */
  headingHtml: string;
  lead: string;
  cta: string;
  /** The four scenes of the recipient journey, in order. */
  journey: [string, string, string, string];
}

export const HERO: Record<OccasionKey, HeroCopy> = {
  birthday: {
    headingHtml: 'A birthday wish.<br>A whole little<br><em>world.</em>',
    lead: 'A wish, a little cake, and their very own pocket-sized party.',
    cta: 'Make a birthday wish',
    journey: ['Light up the room', 'Make a wish', 'Open a gift', 'All the birthday love'],
  },
  proposal: {
    headingHtml: 'A brave question.<br>A little room for<br><em>butterflies.</em>',
    lead: 'A few butterflies. Your words. One lovely, honest question.',
    cta: 'Make a romantic proposal',
    journey: ['Let the lights in', 'A note from the heart', 'The little question', 'Room for an honest answer'],
  },
  love: {
    headingHtml: 'No big occasion.<br>Just a whole lot of<br><em>love.</em>',
    lead: 'Little reasons you love them, tucked into a world of their own.',
    cta: 'Send a little love',
    journey: ['A little light', 'Unfold three hearts', 'Your love letter', 'A little love back'],
  },
  apology: {
    headingHtml: 'Honest words.<br>A little room to<br><em>be heard.</em>',
    lead: 'An honest note, a quieter moment, and space to be heard.',
    cta: 'Write a thoughtful apology',
    journey: ['A quiet little light', 'Unfold an honest note', 'A step forward, if added', 'Space, not expectations'],
  },
  anniversary: {
    headingHtml: 'Your little story.<br>Another lovely<br><em>chapter.</em>',
    lead: 'Your little story, page by page. Here’s to the next chapter.',
    cta: 'Celebrate your story',
    journey: ['Light up our little world', 'Turn the storybook pages', 'A note for this chapter', 'Here’s to what comes next'],
  },
  thanks: {
    headingHtml: 'A little bouquet.<br>A whole lot of<br><em>thank you.</em>',
    lead: 'A tiny bouquet for someone who made a big difference.',
    cta: 'Make a little thank-you',
    journey: ['A little light for you', 'Gather a gratitude bouquet', 'The words behind the flowers', 'All the appreciation'],
  },
  congratulations: {
    headingHtml: 'Their little win.<br>A very well-earned<br><em>spotlight.</em>',
    lead: 'A little spotlight for their not-so-little achievement.',
    cta: 'Celebrate their moment',
    journey: ['Step into the spotlight', 'Untie your celebration ribbon', 'A note of pure pride', 'A well-earned confetti moment'],
  },
  missyou: {
    headingHtml: 'A paper hug.<br>For the one you<br><em>miss.</em>',
    lead: 'A paper hug for the person you wish was a little closer.',
    cta: 'Send a paper hug',
    journey: ['A light across the distance', 'Catch a paper hug', 'A note from over here', 'Until the next hello'],
  },
};
