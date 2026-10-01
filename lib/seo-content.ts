import type { OccasionKey } from './occasions';

/**
 * Long-form, occasion-specific copy for the public /for/<slug> pages.
 * Every page must say something the others don't; tests/seo.test.ts checks that titles,
 * descriptions and FAQ questions are unique. Don't claim things the product doesn't do:
 * no "free", no prices, no "unlimited".
 */
export interface Faq {
  q: string;
  a: string;
}

export interface OccasionPage {
  /** <title>, kept under ~60 characters. */
  metaTitle: string;
  /** Meta description, kept under ~160 characters. */
  metaDescription: string;
  introHeading: string;
  intro: string[];
  goodFor: string[];
  /** Example lines a creator can adapt; genuinely useful and part of the page's unique content. */
  starters: string[];
  tips: { title: string; body: string }[];
  faqs: Faq[];
  related: [OccasionKey, OccasionKey, OccasionKey];
}

export const PAGES: Record<OccasionKey, OccasionPage> = {
  birthday: {
    metaTitle: 'Birthday Wish Website — A Gift They Can Open | Kholona',
    metaDescription:
      'Make a personal birthday website: a cake to light, a wish to make and a gift to open. Add photos and a note, preview it, then share one link.',
    introHeading: 'A birthday message they can actually play with',
    intro: [
      'A text is read in two seconds and buried by the evening. A Kholona birthday wish is a tiny world with their name on it: fairy lights come on, they light the candles, make a wish, blow them out and open a gift, one small moment at a time.',
      'All you need is their name. Add a note, up to four photos, a few memories or a voice note if you want to, and choose the mood — cute, funny, romantic, emotional, crazy or elegant. You see exactly what they will see before you send it.',
    ],
    goodFor: [
      'A partner or best friend who is far away on their birthday',
      'A last-minute gift that still feels thought through',
      'A group of friends who want one shared surprise to open together',
      'Birthdays where you want to say what you never say out loud',
      'Someone who has everything and would rather have a memory',
    ],
    starters: [
      'Happy birthday. This year I wanted to give you something you could open, not just read.',
      'I still remember the first birthday we spent together. I hope this one feels just as warm.',
      'Make a wish. I already made mine, and you are in it.',
    ],
    tips: [
      { title: 'Start with one true memory', body: 'A single specific line ("the night we missed the last train") lands harder than five general compliments.' },
      { title: 'Add a photo they have not seen in a while', body: 'An old, slightly imperfect photo gets a bigger reaction than a polished recent one.' },
      { title: 'Send it at the right moment', body: 'Midnight, or the first minutes of their morning, before the wave of other messages arrives.' },
    ],
    faqs: [
      { q: 'Can I make a birthday website without knowing what to write?', a: 'Yes. Only their name is required. Every written field has editable suggestions, and the birthday journey works even if you add nothing else.' },
      { q: 'Can I add a quiz or a small game?', a: 'Birthday gifts can include balloons to pop, a scratch-to-reveal, a short quiz or a mystery gift. All are optional, and you can preview them first.' },
      { q: 'Will it work when I share it on WhatsApp?', a: 'Yes. You get a short link that opens on any phone or computer, with a preview image if you allow one. You can also choose a discreet preview that leaves their name out.' },
      { q: 'Can they reply?', a: 'They can choose a reaction and write a few words back. It goes only to you, in a private inbox on your recovery link.' },
    ],
    related: ['thanks', 'love', 'congratulations'],
  },
  proposal: {
    metaTitle: 'Romantic Proposal Website — Ask Your Question | Kholona',
    metaDescription:
      'Create a candlelit proposal page with your own words and one honest question, and answer options with no pressure. Preview it, then share the link.',
    introHeading: 'One honest question, asked gently',
    intro: [
      'Some questions deserve more than a message. Your recipient opens an envelope, reads your note, and only then meets the question you chose: whether that is a relationship question, an invitation on a date or a marriage proposal.',
      'The ways to answer are the same size and stay still — Yes, Let’s talk, and Not for me — so nobody is cornered. Continuing without answering is just as easy. A decline or a request to talk ends quietly instead of with a celebration.',
    ],
    goodFor: [
      'Asking someone out when you want to be sincere, not casual',
      'A long-distance proposal when you cannot be in the same room',
      'A shy person who finds the right words easier to write than to say',
      'Taking the next step in a relationship, at their pace',
      'A marriage proposal companion to a ring or a plan (a ring appears only for marriage)',
    ],
    starters: [
      'I have thought about how to ask this for a while, and I wanted to do it in words you can keep.',
      'Being with you is the easiest thing I do. I would like to keep doing it, if you want to.',
      'Whatever you answer, thank you for reading this. You never have to rush it.',
    ],
    tips: [
      { title: 'Choose the question kind first', body: 'Relationship, date or marriage: the wording changes with the choice, and you can edit every line.' },
      { title: 'Say what you feel before you ask', body: 'The note before the question is where your voice matters most. Keep it specific and short.' },
      { title: 'Make space for a real answer', body: 'A good proposal leaves room for "not yet". The design does this for you; your words should too.' },
    ],
    faqs: [
      { q: 'Is a proposal page only for marriage?', a: 'No. You can ask a relationship question, invite someone on a date, or propose marriage. The ring illustration appears only for marriage.' },
      { q: 'What happens if they say no?', a: 'Nothing loud. There is no confetti or awkward animation. It ends quietly, and they can add a note of their own if they choose.' },
      { q: 'Can I write the question in my own words?', a: 'Yes. The question is fully editable and the suggestions are only a starting point.' },
      { q: 'Does it tell me when they open it?', a: 'You can see an approximate opening count and any reply they choose to send. An opening count is not an answer, so wait for their words.' },
    ],
    related: ['love', 'anniversary', 'missyou'],
  },
  love: {
    metaTitle: 'Love Letter Website — Tell Them Why | Kholona',
    metaDescription:
      'Send a personal love letter site: three paper hearts to unfold, each with a reason you love them, plus your letter. Preview it and share one link.',
    introHeading: 'Say the small reasons, not the big speech',
    intro: [
      'You do not need an anniversary to tell someone they matter. A Kholona love note gives them three paper hearts to unfold, each holding one reason you love them, followed by a letter from you.',
      'Write your own reasons, or leave a heart blank and it fills with a thoughtful line you can edit. Add photos or a voice note so it sounds like you. They can send back a little love, which arrives only in your private inbox.',
    ],
    goodFor: [
      'A "just because" surprise in the middle of an ordinary week',
      'Making up after a rough patch without turning it into a big talk',
      'A partner who loves words but rarely hears them',
      'Long-distance couples who need something to come back to',
      'Saying "I love you" for the first time in a way you can rehearse',
    ],
    starters: [
      'You do not need a reason to get a letter like this. That is exactly why I am sending it.',
      'The first heart is about how you make ordinary days feel like something.',
      'I love how you laugh at your own jokes first. I hope you read this smiling.',
    ],
    tips: [
      { title: 'One reason per heart', body: 'Keep each reason to a sentence: something only you would notice about them.' },
      { title: 'Use their words', body: 'Quote something funny or kind they said. It proves you were listening.' },
      { title: 'End with what you will do, not what you feel', body: 'A small promise or plan lands better than another adjective.' },
    ],
    faqs: [
      { q: 'What are the three hearts?', a: 'Three little paper hearts the recipient unfolds one by one. Each holds a reason you love them: yours if you write it, or a gentle suggestion if you leave it blank.' },
      { q: 'Can I add photos and a voice note?', a: 'Yes, both are optional. A short voice note is often the part people replay.' },
      { q: 'Is it private?', a: 'Anyone with the link can open it, so send it only to them. Gift pages are hidden from search engines, and you can delete the gift whenever you like.' },
      { q: 'Can I change it after I send the link?', a: 'Yes. Use your private recovery link to edit the same gift; the link you shared stays the same.' },
    ],
    related: ['proposal', 'anniversary', 'missyou'],
  },
  apology: {
    metaTitle: 'Apology Card Website — Say Sorry Sincerely | Kholona',
    metaDescription:
      'Write a thoughtful apology card with an honest note, an optional concrete next step, and space for them to respond when ready. No games, no pressure.',
    introHeading: 'An apology that asks for nothing back',
    intro: [
      'A good apology is honest, specific and patient. This one opens quietly: no games, no confetti, no countdown, no button that runs away. They can stop reading at any point, and there is an early "I need some space" route.',
      'You can add one realistic thing you will do differently. It is shown only if you write it, and it is offered as a commitment, not as a request for forgiveness. Only the Emotional and Elegant moods are available, on purpose.',
    ],
    goodFor: [
      'A partner you hurt and want to reach without an argument',
      'A friend you let down who needs room before they reply',
      'Situations where a text would feel too small',
      'Apologies you find easier to write than to say out loud',
      'When you want to show effort without pressuring for forgiveness',
    ],
    starters: [
      'I am sorry for what I said on Friday. It was unfair, and you did not deserve it.',
      'I am not asking you to forgive me today. I only want you to know I understand what I did.',
      'Here is one thing I will do differently: I will pause before I answer, and ask what you meant.',
    ],
    tips: [
      { title: 'Name what you did', body: 'Vague apologies ("sorry if you were hurt") feel like dodging. Say the actual thing, in plain words.' },
      { title: 'Skip the "but"', body: 'Anything after "but" undoes the apology. Keep reasons out unless they help them understand.' },
      { title: 'Offer one real step', body: 'A single achievable commitment is worth more than a list of promises.' },
    ],
    faqs: [
      { q: 'Is it a good idea to send an apology as a website?', a: 'It works when it lets someone read at their own pace, and when you accept their answer, including silence. If they asked you for space, respect that first.' },
      { q: 'Why are there no games or fun effects?', a: 'They would undercut the message. Apology cards are deliberately calm: no confetti, no deadline and no forced forgiveness.' },
      { q: 'Can they just close it?', a: 'Yes. There is an early "I need some space" route, and they can finish without sending any reply.' },
      { q: 'What is the concrete next step?', a: 'An optional line where you say one realistic thing you will do. If you leave it empty it does not appear.' },
    ],
    related: ['love', 'thanks', 'missyou'],
  },
  anniversary: {
    metaTitle: 'Anniversary Website — Your Story, Page by Page | Kholona',
    metaDescription:
      'Create an anniversary website with a miniature storybook, your start date, memories and photos, and a note for this chapter. Preview it, then share the link.',
    introHeading: 'Turn the pages of your story together',
    intro: [
      'Anniversaries are a good excuse to look back. Your recipient turns the pages of a miniature storybook, reads a note written for this chapter, and finishes on what comes next.',
      'Add the date you started and it appears at the top of the storybook ("Since 14 February 2021"). Photos and short memories give each page something real. Everything except their name is optional, and you can preview the whole story first.',
    ],
    goodFor: [
      'First anniversaries and every one after',
      'A milestone you want to mark without a big party',
      'Couples who are apart on the day itself',
      'Friendships and families with a story worth retelling',
      'Pairing with flowers or dinner as the part they can keep and reopen later',
    ],
    starters: [
      'Another year, and I would still choose the same slow Sunday with you.',
      'Some of my favourite pages of this story are the boring ones, because you are in them.',
      'Here is to the next chapter. I have a few ideas, and I hope you have some too.',
    ],
    tips: [
      { title: 'Choose the date carefully', body: 'The start date is shown on the storybook. Use the day that means most to both of you.' },
      { title: 'Pick three memories', body: 'The best storybooks have a few specific moments, not a full timeline.' },
      { title: 'Write to the next chapter', body: 'End with one thing you are looking forward to doing together, whether that is a trip, a habit you want to keep or something you have both been putting off.' },
    ],
    faqs: [
      { q: 'Do I need to add our start date?', a: 'No. It is optional. If you add it, the storybook shows "Since" and that date; if not, it simply leaves it out.' },
      { q: 'How many photos and memories can I add?', a: 'Up to four photos and three short memories, each with an optional caption.' },
      { q: 'Is it only for romantic couples?', a: 'No. It suits friendships, families and work partnerships as well. Change the wording to match.' },
      { q: 'Can I edit the note later?', a: 'Yes, from your private recovery link. The shared link keeps working and shows the updated version.' },
      { q: 'What if we are celebrating years and I have too many memories?', a: 'Choose the three that say the most. The storybook is meant to be read in a couple of minutes, and a few specific moments feel more personal than a full timeline. You can always make a second gift for next year.' },
    ],
    related: ['love', 'proposal', 'birthday'],
  },
  thanks: {
    metaTitle: 'Thank You Website — A Bouquet of Gratitude | Kholona',
    metaDescription:
      'Send a personal thank-you: an interactive bouquet of flowers, each with something you appreciate, plus a heartfelt note. Preview it and share one link.',
    introHeading: 'A thank-you that says exactly what they did',
    intro: [
      '"Thanks so much!" rarely tells someone what they changed for you. A Kholona thank-you lets the recipient gather a small bouquet, with three flowers that each carry something you appreciate about them.',
      'Write the three things yourself, or let the suggestions get you started. Add a photo, a voice note or a short message. It is a good way to thank a teacher, a mentor, a friend or a colleague in a way they can keep.',
    ],
    goodFor: [
      'A teacher or mentor at the end of a course or year',
      'A friend who showed up when it mattered',
      'A colleague or manager who went beyond their job',
      'Parents, grandparents and relatives you rarely thank properly',
      'Someone who helped you quietly and never asked for credit',
    ],
    starters: [
      'You may not remember the day you helped me, but I do, and it changed what I did next.',
      'Thank you for the time you gave when you had none to spare.',
      'I am who I am at work today partly because of how you showed me it could be done.',
    ],
    tips: [
      { title: 'Be specific about what changed', body: '"You stayed late to help me finish" beats "you are so helpful".' },
      { title: 'Give three different reasons', body: 'One about what they did, one about how they made you feel, one about who you are because of it.' },
      { title: 'Keep it short', body: 'A thank-you is best when it can be read and felt in under a minute.' },
    ],
    faqs: [
      { q: 'What are the three flowers?', a: 'The recipient picks up three flowers one by one. Each holds something you appreciate about them, written by you or suggested if you leave it blank.' },
      { q: 'Is it appropriate for a colleague or teacher?', a: 'Yes. Choose the Elegant mood for a more formal tone and keep the note brief and specific.' },
      { q: 'Can I send it to several people?', a: 'Each gift is for one recipient name. Make a separate one for each person so every note stays personal.' },
      { q: 'Can the person I am thanking write back?', a: 'They can send a reaction or a few words. It reaches only you, in your private inbox, so they can answer as warmly or as briefly as they like.' },
    ],
    related: ['congratulations', 'birthday', 'apology'],
  },
  congratulations: {
    metaTitle: 'Congratulations Website — Celebrate Their Win | Kholona',
    metaDescription:
      'Celebrate a new job, graduation, promotion or personal win with a warm spotlight, a ribbon to untie and your note of pride. Preview it, then share the link.',
    introHeading: 'A little spotlight for a big moment',
    intro: [
      'A new job, a graduation, a first race finished or a brave step nobody else saw: some wins deserve more than a thumbs-up. The recipient steps into a warm spotlight, unties a celebration ribbon and reads a note of pure pride.',
      'Add the achievement in your own words, plus photos or a voice note. It works for milestones that are public and for private victories only you know about.',
    ],
    goodFor: [
      'A friend who got the job, the offer or the promotion',
      'Graduations, exam results and finished degrees',
      'Recoveries and brave choices that are not on anyone’s feed',
      'A team member whose work should be seen',
      'Someone whose win you cannot celebrate in person',
    ],
    starters: [
      'You worked so hard for this, and I watched it happen. I could not be more proud.',
      'Everyone will see the result. I wanted to say I saw the effort.',
      'Take a moment to enjoy this one before you start on the next. You have earned it.',
    ],
    tips: [
      { title: 'Name the achievement', body: 'Say exactly what they did, whether that is a title, a number or a decision that took courage.' },
      { title: 'Mention the effort', body: 'Praise the work behind the result. It is what they want recognised.' },
      { title: 'Look ahead', body: 'End on what you are excited to see them do next.' },
    ],
    faqs: [
      { q: 'What kinds of wins is it for?', a: 'Anything you want to celebrate: jobs, degrees, promotions, launches, races, recoveries or a quiet personal breakthrough.' },
      { q: 'Do I have to describe the achievement?', a: 'It is an optional line, up to 80 characters. If you leave it blank, the gift still celebrates them warmly.' },
      { q: 'Can I add photos of the moment?', a: 'Yes. Up to four photos, each with an optional caption.' },
      { q: 'Is it too much for a small win?', a: 'It works at any size. Choose a calmer mood for something modest and it stays warm without feeling grand.' },
    ],
    related: ['thanks', 'birthday', 'love'],
  },
  missyou: {
    metaTitle: 'Miss You Website — Send a Paper Hug | Kholona',
    metaDescription:
      'Send a long-distance "miss you" gift: a paper hug that travels across a little map, plus a note from afar. Preview it and share the link in seconds.',
    introHeading: 'For the miles between hellos',
    intro: [
      'Missing someone is quiet and constant. This gift lets you send a paper hug across a small illustrated route, with a note from where you are and a light for them to come back to.',
      'Add an "until the next hello" line, a photo or a voice note. It suits long-distance couples, friends who moved, parents and children living apart, or anyone you cannot be near right now.',
    ],
    goodFor: [
      'Long-distance relationships and time zones that never line up',
      'A friend who moved cities or countries',
      'Grandparents or parents far away',
      'A hard week when you cannot visit',
      'Anyone you think of at random and want to tell',
    ],
    starters: [
      'I passed our old café today and thought of you, so I built you a small thing to hold.',
      'The distance is real, but so is this: you are the first person I want to tell things to.',
      'Until the next hello, keep this light on for me.',
    ],
    tips: [
      { title: 'Tell them what you noticed today', body: 'A small detail from your day ("I passed our old café") makes distance feel smaller.' },
      { title: 'Use your voice', body: 'A short voice note carries warmth that text cannot.' },
      { title: 'Say when you will next see them', body: 'The "until the next hello" line is best when it is a real plan.' },
    ],
    faqs: [
      { q: 'What is the paper hug?', a: 'A small paper figure that travels across an illustrated route. The recipient catches it and then reads your note.' },
      { q: 'Can I use it for family as well as partners?', a: 'Yes. Change the wording and the mood to suit, whether for a parent, grandparent, friend or partner.' },
      { q: 'Can I add a voice note?', a: 'Yes. You can record one in the browser, up to about 60 seconds, or upload an audio file.' },
      { q: 'Will it work across countries?', a: 'It is a link that opens in any modern browser, so it works wherever they are.' },
    ],
    related: ['love', 'apology', 'anniversary'],
  },
};
