// Kholona occasion registry: public routes, SEO copy and API validation.

export type OccasionKey =
  | 'birthday'
  | 'proposal'
  | 'love'
  | 'apology'
  | 'anniversary'
  | 'thanks'
  | 'congratulations'
  | 'missyou';

export interface Occasion {
  slug: string;
  label: string;
  short: string;
  symbol: string;
  vibe: string;
  title: string;
  description: string;
  seo: string;
}

export const OCCASIONS: Record<OccasionKey, Occasion> = {
  birthday: {
    slug: 'birthday-wish',
    label: 'Birthday wish',
    short: 'Birthday',
    symbol: '✧',
    vibe: 'Cute',
    title: 'Who’s your birthday person?',
    description: 'A wish, a little cake, and their very own pocket-sized party.',
    seo: 'Create a personalized birthday wish website with fairy lights, an interactive cake, photos and editable messages.',
  },
  proposal: {
    slug: 'romantic-proposal',
    label: 'Romantic proposal',
    short: 'Proposal',
    symbol: '♡',
    vibe: 'Romantic',
    title: 'Who gives you the butterflies?',
    description: 'A few butterflies. Your words. One lovely, honest question.',
    seo: 'Create a personal romantic proposal website with a candlelit reveal, editable question and thoughtful, pressure-free ways to respond.',
  },
  love: {
    slug: 'show-your-love',
    label: 'Show your love',
    short: 'Love note',
    symbol: '♡',
    vibe: 'Romantic',
    title: 'Who makes your world warmer?',
    description: 'Little reasons you love them, tucked into a world of their own.',
    seo: 'Make a personalized love letter website. Unfold sweet messages, add photos and a voice note, and share a little love with one link.',
  },
  apology: {
    slug: 'apology-card',
    label: 'Apology card',
    short: 'Apology',
    symbol: '❦',
    vibe: 'Emotional',
    title: 'Who do you want to reach out to?',
    description: 'An honest note, a quieter moment, and space to be heard.',
    seo: 'Create a thoughtful apology card with editable words, an optional concrete next step, and space for the recipient to respond in their own time.',
  },
  anniversary: {
    slug: 'anniversary',
    label: 'Happy anniversary',
    short: 'Anniversary',
    symbol: '∞',
    vibe: 'Elegant',
    title: 'Who’s your favorite chapter?',
    description: 'Your little story, page by page. Here’s to the next chapter.',
    seo: 'Create a personalized anniversary website with a little storybook, your start date, memories, photos and an editable anniversary message.',
  },
  thanks: {
    slug: 'thank-you',
    label: 'Thank you',
    short: 'Thank you',
    symbol: '✿',
    vibe: 'Cute',
    title: 'Who deserves a little thank-you?',
    description: 'A tiny bouquet for someone who made a big difference.',
    seo: 'Send a personalized thank-you website with an interactive gratitude bouquet, thoughtful message templates and optional photos or voice notes.',
  },
  congratulations: {
    slug: 'congratulations',
    label: 'Congratulations',
    short: 'Congratulations',
    symbol: '✦',
    vibe: 'Elegant',
    title: 'Who’s having their big moment?',
    description: 'A little spotlight for their not-so-little achievement.',
    seo: 'Make a congratulations website for a new job, graduation, promotion or personal win. Add a message and share a small interactive celebration.',
  },
  missyou: {
    slug: 'miss-you',
    label: 'Miss you',
    short: 'Miss you',
    symbol: '☾',
    vibe: 'Emotional',
    title: 'Who feels a little far away?',
    description: 'A paper hug for the person you wish was a little closer.',
    seo: 'For the miles, and the moments between hellos. Send a travelling paper hug and a thoughtful note.',
  },
};

export const OCCASION_KEYS = Object.keys(OCCASIONS) as OccasionKey[];

export const OCCASION_SLUGS = new Map<string, OccasionKey>(
  OCCASION_KEYS.map((key) => [OCCASIONS[key].slug, key]),
);

export function isOccasionKey(value: unknown): value is OccasionKey {
  return typeof value === 'string' && Object.hasOwn(OCCASIONS, value);
}
