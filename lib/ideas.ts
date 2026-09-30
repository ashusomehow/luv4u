import type { OccasionKey } from './occasions';
import type { Faq } from './seo-content';

/**
 * Long-tail pages: one specific person or moment each ("birthday message for a best friend").
 * They exist to be useful on their own — real advice and real example lines — and then point to the
 * matching gift journey. Each must say something the others don't (tests/ideas.test.ts checks
 * uniqueness and depth). Don't claim what the product doesn't do: no "free", no prices, no "unlimited".
 */
export interface Idea {
  slug: string;
  occasion: OccasionKey;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string[];
  include: { title: string; body: string }[];
  lines: string[];
  avoid: string[];
  faqs: Faq[];
  related: string[];
}

export const IDEAS: Idea[] = [
  {
    slug: 'birthday-website-for-girlfriend',
    occasion: 'birthday',
    metaTitle: 'Birthday Website for Your Girlfriend — Ideas & Words',
    metaDescription: 'What to put in a birthday website for your girlfriend, lines to borrow, and what to skip, so it feels like you and not like a template.',
    h1: 'A birthday website for your girlfriend: what to put in it',
    intro: [
      'A birthday website works for a girlfriend because it is a small private place that is about her and nobody else. The mistake is filling it with praise that could be about anyone. The pages she remembers are the specific ones: the joke only the two of you get, the street where something small happened, the thing she does that she thinks you have never noticed.',
      'Decide the feeling first. If you want her to laugh, lean into inside jokes and a playful mood. If you want her to be moved, choose fewer words and one photo that matters. You can preview the whole thing the way she will see it before you send anything, so it is easy to try a version and change your mind.',
    ],
    include: [
      { title: 'One memory with a detail in it', body: 'Not “our first date was amazing” but “you were twenty minutes late and pretended the rain did it.” A detail proves you were paying attention.' },
      { title: 'A photo she did not expect', body: 'An old photo, a bad photo she hates, a photo of the two of you that she has never seen. It lands harder than the latest flattering one.' },
      { title: 'One thing you are proud of her for this year', body: 'Birthdays are a natural moment to say what you admire, not just what you love. It is often the line people screenshot.' },
      { title: 'Your voice, if you can stand it', body: 'A thirty-second voice note saying happy birthday in your own words is worth more than a paragraph of polished text.' },
    ],
    lines: [
      'Happy birthday. I made you a little place to open instead of a card to throw away.',
      'You turn every ordinary Tuesday into something I remember. This is me saying thank you for that.',
      'I am not good at saying this out loud, so I built it instead.',
      'Another year of you making everyone around you braver. I am lucky to be one of them.',
      'Make a wish. I already know what mine is.',
    ],
    avoid: [
      'Long lists of adjectives. Three true things beat fifteen nice ones.',
      'Jokes at her expense that are really complaints in disguise.',
      'Sending it late in the evening after other people have already filled her day. The first minutes of her morning are better.',
    ],
    faqs: [
      { q: 'What if I am not romantic or good with words?', a: 'Keep it small. Her name, one photo and two sentences is a complete gift. The suggestions in each field are only starting points you can rewrite.' },
      { q: 'Can I surprise her at midnight?', a: 'Yes. Share the link at the moment you choose. She opens it whenever she sees your message, and you can preview it first to make sure it reads the way you meant.' },
      { q: 'Will she be able to reply?', a: 'She can pick a reaction and write a few words back. It goes only to you, privately.' },
    ],
    related: ['birthday-website-for-boyfriend', 'romantic-message-for-no-reason', 'anniversary-message-for-wife'],
  },
  {
    slug: 'birthday-website-for-boyfriend',
    occasion: 'birthday',
    metaTitle: 'Birthday Website for Your Boyfriend — What to Include',
    metaDescription: 'A practical guide to making a birthday website for your boyfriend: what to write, which photos to use, and how to keep it sincere and not cheesy.',
    h1: 'A birthday website for your boyfriend: keep it real, not cheesy',
    intro: [
      'Plenty of boyfriends say they do not care about birthdays and then quietly keep the card for years. A birthday website is a good fit for that person, because it can be warm without being loud. It does not need a speech. It needs to sound like you.',
      'If he hides his feelings behind jokes, answer in kind and let the sincere part arrive at the end. If he is the quiet one, let the gift be quiet too: a few lines, one memory and a photo. You see exactly how it plays before you send it, so you can tone anything down that feels too much.',
    ],
    include: [
      { title: 'A joke that only you two understand', body: 'An inside joke tells him instantly that this was made for him. Put it near the start so the gift feels like his from the first screen.' },
      { title: 'The small things he does for you', body: 'He probably does them without thinking: the coffee, the walk home, the way he checks you got in safely. Name two of them.' },
      { title: 'A photo from before it was official', body: 'Early photos carry the whole story. The awkward ones are the best.' },
      { title: 'A line about what you are looking forward to', body: 'End with the future, even something small like a trip or a Sunday. It turns a birthday into a promise.' },
    ],
    lines: [
      'Happy birthday. I would say something smooth, but you know me, so I made a website.',
      'You make hard weeks lighter without ever making a thing of it. I notice. I am grateful.',
      'Here is to another year of you being annoyingly easy to love.',
      'I kept the good photos for this one. You are welcome.',
      'Whatever you wish for, I am already on the team.',
    ],
    avoid: [
      'Over-explaining. If a line needs a paragraph to justify it, cut it.',
      'Copying a famous quote. One real sentence from you is better than a borrowed one.',
      'Making him feel he has to perform a big reaction. The reply option lets him answer in his own time.',
    ],
    faqs: [
      { q: 'He says he hates surprises. Is this still a good idea?', a: 'It is a low-pressure one. It is a link he opens when he is ready, with nobody watching, and he can reply quietly afterwards.' },
      { q: 'Can I add music or a voice note?', a: 'Yes, both are optional. A short voice note tends to be the part people replay.' },
      { q: 'What if I want to change something after sending?', a: 'You keep a private edit link, so you can change the gift later and the same link shows the update.' },
    ],
    related: ['birthday-website-for-girlfriend', 'birthday-message-for-best-friend', 'romantic-message-for-no-reason'],
  },
  {
    slug: 'birthday-message-for-best-friend',
    occasion: 'birthday',
    metaTitle: 'Birthday Message for a Best Friend That Isn’t Generic',
    metaDescription: 'How to write a birthday message for your best friend that they will keep: what to mention, example lines, and a way to send it that feels like more than a text.',
    h1: 'A birthday message for your best friend that is not generic',
    intro: [
      'Best friends are the hardest to write for because you know each other too well to be formal, and too well to fake it. Most messages end up as “happy birthday, love you, never change,” which is true but forgettable. The fix is to write the thing you would say if you were sitting together and the conversation got honest.',
      'You do not need a big gesture. You need one moment from your shared history and one sentence that says what they have meant to you. A small personal page can carry both, with a photo or two, and feels like effort even though you can make it in a few minutes.',
    ],
    include: [
      { title: 'The story you always retell', body: 'Every pair has one. Put it in, even in two lines. It is the fastest way to make them smile.' },
      { title: 'A photo from years ago', body: 'Old school, old city, old haircuts. Nostalgia does the work for you.' },
      { title: 'One sincere sentence', body: 'Jokes are the default between friends, so a single serious line stands out: “I do not say it, but I would not be who I am without you.”' },
      { title: 'A plan', body: 'End with something to look forward to: a trip, a dinner, a promise to finally do the thing you keep postponing.' },
    ],
    lines: [
      'Happy birthday to the person who knows all my bad decisions and stayed anyway.',
      'You have been in every chapter that mattered. I hope this year is a good one for you.',
      'I am terrible at sentiment, so this is as close as you will get. Do not get used to it.',
      'Remember when we thought we would have it all figured out by now? Me neither, and it is still the best company.',
      'Here is to another year of the group chat at unreasonable hours.',
    ],
    avoid: [
      'Only jokes. Add one line you mean.',
      'Tagging them in a public post as the only message. Private first, public if you like.',
      'Writing it on the day itself at the last minute. Even a short message feels better if it arrives early.',
    ],
    faqs: [
      { q: 'Is this too much for a friend?', a: 'Not if you keep the tone yours. A light, funny version with one sincere line fits most friendships.' },
      { q: 'Can several friends contribute?', a: 'One person builds the gift, but you can put lines from others in the note. Collect a sentence from each friend and add them.' },
      { q: 'How do I send it?', a: 'You get one link to paste into a chat. It opens on any phone or computer.' },
    ],
    related: ['birthday-website-for-boyfriend', 'thank-you-message-for-a-teacher', 'birthday-surprise-for-mom-far-away'],
  },
  {
    slug: 'birthday-surprise-for-mom-far-away',
    occasion: 'birthday',
    metaTitle: 'Birthday Surprise for Mom When You Live Far Away',
    metaDescription: 'Ideas for a birthday surprise for your mother when you cannot be there: what to say, what to add, and how to make it easy for her to open on her phone.',
    h1: 'A birthday surprise for your mom when you cannot be there',
    intro: [
      'The hardest birthdays are the ones you miss. A phone call is good, but a call ends and a gift stays. The thing mothers tend to treasure is not spectacle, it is proof that you remember the small things about them and that you are doing well enough to think of them.',
      'Make it easy for her to open. A single link that works on her phone, large text, a photo she will recognise and your voice. If she is not comfortable with technology, send it with a message saying “just tap this,” and call her while she opens it so you share the moment.',
    ],
    include: [
      { title: 'Your voice saying happy birthday', body: 'Hearing you is the point when you are far away. Even a short recording will be played more than once.' },
      { title: 'A childhood photo or a family photo', body: 'Pick one from a time she misses, or a recent one that shows you are well. Either works.' },
      { title: 'Something she did that you only understand now', body: 'A line like “I finally realise how much you carried” tends to be the one that makes her cry happily.' },
      { title: 'A promise to see her', body: 'Even a rough plan for your next visit gives her something to hold on to.' },
    ],
    lines: [
      'Happy birthday, Mummy. I am far away today, but I wanted you to open something from me.',
      'I understand a lot more now about everything you did without being asked to.',
      'Whatever I am doing well, it started at your kitchen table.',
      'I will call you after you open this. Take your time.',
      'I am counting the days until I see you.',
    ],
    avoid: [
      'Small text or complicated steps. Make it one tap.',
      'Waiting until the evening. She has probably been waiting to hear from you all day.',
      'Saying you are busy. Say you are thinking of her.',
    ],
    faqs: [
      { q: 'What if my mother is not comfortable with smartphones?', a: 'Send the link to whichever family member she trusts, or open it with her on a video call. It works in any browser, with no app or account.' },
      { q: 'Can I write in my own language?', a: 'Yes. You can write in any language you like, including a mix, and record your voice in the language you speak with her.' },
      { q: 'Can she reply to me?', a: 'She can choose an emoji and write a short message, which comes straight back to you privately.' },
    ],
    related: ['birthday-gift-for-dad-who-wants-nothing', 'long-distance-gift-ideas-for-someone-you-miss', 'thank-you-message-for-a-teacher'],
  },
  {
    slug: 'birthday-gift-for-dad-who-wants-nothing',
    occasion: 'birthday',
    metaTitle: 'Birthday Gift for a Dad Who Says He Wants Nothing',
    metaDescription: 'A dad who says he needs nothing still likes to be remembered. Ideas for a personal digital birthday gift: what to say, what to add, and what to skip.',
    h1: 'A birthday gift for a dad who says he wants nothing',
    intro: [
      'When a father says he does not want anything, he usually means he does not want a thing. He may still want to know he is appreciated, and that is a gift you can give without shopping. The problem is that many dads are uncomfortable being praised directly, so the tone matters.',
      'Keep it warm and a little understated. Short sentences, one specific memory, maybe a joke he would make. A private page he can open alone and reread is often better than a public post, because he gets to react without an audience.',
    ],
    include: [
      { title: 'A memory of something he taught you', body: 'Not a big life lesson. A small, practical one: how to ride a bike, change a tyre, read a map. Specific is better than grand.' },
      { title: 'A photo of him at his best', body: 'Caught mid-laugh, or doing the thing he is good at. It shows you see him as he is.' },
      { title: 'Something you did not thank him for then', body: 'The lifts, the waiting outside, the quiet sacrifices. One line of late thanks lands gently and stays.' },
      { title: 'A plan for just the two of you', body: 'A drive, a match, a meal. Time together is what he will actually value.' },
    ],
    lines: [
      'Happy birthday, Papa. I know you will say you do not need anything, so here is something you cannot refuse.',
      'I learned most of what I know by watching you not make a fuss about it.',
      'Thank you for all the times you showed up and never mentioned it.',
      'You do not have to reply to this. Just know it.',
      'Let us do something this weekend, just us.',
    ],
    avoid: [
      'Overly emotional language if that is not how you two talk. Sincere and short is enough.',
      'Making him read a wall of text. A few short lines and a photo is plenty.',
      'Comparing him to other fathers. Talk about him only.',
    ],
    faqs: [
      { q: 'Will he actually open a link?', a: 'Tell him in the message what it is and that it takes a minute. Most people open a gift from their child.' },
      { q: 'Can I add a voice note?', a: 'Yes. A few seconds of your voice saying happy birthday often means the most to parents.' },
      { q: 'What if I want to keep it private?', a: 'Gift links are not listed anywhere or indexed by search engines, and you choose who you send yours to. Share the link only with him.' },
    ],
    related: ['birthday-surprise-for-mom-far-away', 'birthday-message-for-best-friend', 'thank-you-message-for-a-teacher'],
  },
  {
    slug: 'anniversary-message-for-husband',
    occasion: 'anniversary',
    metaTitle: 'Anniversary Message for Your Husband — Ideas & Lines',
    metaDescription: 'How to write an anniversary message for your husband that goes beyond “love you”: what to mention, lines to adapt, and a way to share it privately.',
    h1: 'An anniversary message for your husband that says something new',
    intro: [
      'After years together, the obvious things have been said. The anniversary messages that land are the ones that notice what has changed: the person he was when you met and the person he has become, the habits you used to tease and now rely on, the quiet ways he has held things together.',
      'Think of it as a short retelling of your story from your side. A page can hold a few photos across the years, a handful of dated memories and a closing note. Keep the focus on specifics, and let him see how you have noticed him over time.',
    ],
    include: [
      { title: 'A then-and-now pair', body: 'Two photos, or two lines: who he was on your first anniversary and who he is now. The contrast does the emotional work.' },
      { title: 'Something he does that he does not know you notice', body: 'The way he warms the car, remembers the names of your friends’ kids, always checks the locks. Small and true.' },
      { title: 'A thank-you for something hard', body: 'Name a difficult stretch you got through together and thank him for how he showed up.' },
      { title: 'One thing you want more of', body: 'Not a complaint: a wish. “More slow mornings.” “More trips we will not stop talking about.”' },
    ],
    lines: [
      'Another year, and I still look forward to coming home to you.',
      'Thank you for the ordinary days. They turned out to be the best ones.',
      'I would choose this life with you again, including the bits we did not plan.',
      'You are the calmest part of my world. I hope you know that.',
      'To many more years of arguing about the thermostat.',
    ],
    avoid: [
      'Generic poetry. Your own awkward sentence beats a polished borrowed one.',
      'Bringing up unresolved arguments. Save those for another day.',
      'Only looking backwards. End with something to look forward to.',
    ],
    faqs: [
      { q: 'We have been married a long time. Is this still a good idea?', a: 'Long marriages are where a thoughtful, specific message stands out most, because the obvious gestures have become routine.' },
      { q: 'Can I include old photos?', a: 'Yes, up to four photos, each with a short caption. Dated memories can carry the rest of the story.' },
      { q: 'Is it private?', a: 'Only someone with the link can open it, and search engines do not list gifts. Send it only to him.' },
    ],
    related: ['anniversary-message-for-wife', 'romantic-message-for-no-reason', 'birthday-website-for-girlfriend'],
  },
  {
    slug: 'anniversary-message-for-wife',
    occasion: 'anniversary',
    metaTitle: 'Anniversary Message for Your Wife — Words That Feel Real',
    metaDescription: 'What to write in an anniversary message for your wife: how to be specific, lines to borrow, and a private, personal way to send it.',
    h1: 'An anniversary message for your wife that she will keep',
    intro: [
      'The best anniversary words are not the grandest ones, they are the most exact. “You make me feel at home” is nice. “You are the reason I stopped dreading Sunday evenings” is hers. Write the version only you could write, about the two of you specifically.',
      'Start from a moment, not a feeling. Something small that happened, a place, a day. Then say what it made you realise. A short page with a few photos, a few remembered dates and a closing line can carry a whole story without feeling long.',
    ],
    include: [
      { title: 'The day you knew', body: 'Not the day you got engaged or married, but the smaller moment you first thought “this is the one.” Most people have one, and it is rarely the obvious day.' },
      { title: 'Something she has taught you', body: 'Patience, stubbornness, kindness to strangers. Saying what you learned from her is a deeper compliment than praising her.' },
      { title: 'A photo she would not choose', body: 'Mid-laugh, unposed, slightly messy. It is how you see her, and that is the point.' },
      { title: 'A promise that is small and real', body: 'Not “I will always make you happy.” Something you can actually keep: “I will stop checking my phone at dinner.”' },
    ],
    lines: [
      'Happy anniversary. You are still the best decision I ever made without overthinking it.',
      'Thank you for the version of me that only exists around you.',
      'I hope I say thank you enough for all the things you do that nobody sees.',
      'Every year I think I could not love you more, and every year I am wrong.',
      'Here is to the next chapter, with you holding the pen.',
    ],
    avoid: [
      'Grand claims you would not say out loud. Stay in your own voice.',
      'Skipping the hard years. Acknowledging them makes the thank-you real.',
      'Making it a list of gifts or plans. Make it about her.',
    ],
    faqs: [
      { q: 'Can I write this in my own language?', a: 'Yes. Write in whatever language you use with her, including a mix, and add a voice note if you like.' },
      { q: 'What if I do not have many photos?', a: 'One photo is enough, or none at all. The words and a few remembered moments are the heart of it.' },
      { q: 'Can I see it before I send it?', a: 'Yes. You can preview it exactly as she will see it and change anything before sharing the link.' },
    ],
    related: ['anniversary-message-for-husband', 'romantic-message-for-no-reason', 'birthday-website-for-girlfriend'],
  },
  {
    slug: 'how-to-apologise-to-a-friend',
    occasion: 'apology',
    metaTitle: 'How to Apologise to a Friend in Writing (With Examples)',
    metaDescription: 'A clear way to write an apology to a friend: what to say, what to leave out, example lines, and how to give them room to respond in their own time.',
    h1: 'How to apologise to a friend in writing',
    intro: [
      'A good apology is short, specific and does not ask for anything back. Most failed apologies share a pattern: they explain, they defend, or they hint that the other person is overreacting. Writing your apology down gives you time to avoid all three, and gives your friend time to read it without having to respond on the spot.',
      'Say what you did, say how you think it affected them, say that you are sorry, and say what you will do differently. Then stop. Resist the urge to add a paragraph of context. If they want to hear your side, they will ask.',
    ],
    include: [
      { title: 'Name the thing plainly', body: '“I cancelled on you three times and did not explain.” Not “I am sorry if I upset you.” The specific version shows you understand.' },
      { title: 'Say what it probably felt like', body: '“I think it made you feel like you were not a priority.” Getting this right matters more than any other sentence.' },
      { title: 'One clear change', body: 'Not a vague “I will do better,” but something they can check: “I will tell you early if I cannot make it.”' },
      { title: 'Room to answer or not', body: '“You do not have to reply. I just wanted you to know.” It takes the pressure off, which makes a reply more likely.' },
    ],
    lines: [
      'I owe you an apology, and I do not want to dress it up.',
      'I was wrong to say that, and I have been thinking about how it must have felt.',
      'I am not asking you to forgive me right now. I just did not want you to wonder whether I knew.',
      'You matter more to me than being right.',
      'Whenever you are ready to talk, I will listen first.',
    ],
    avoid: [
      '“I am sorry but…” Everything before “but” is cancelled by what follows.',
      'Turning it into a long explanation of your own stress or intentions.',
      'Asking for forgiveness or an answer. Let them have time.',
    ],
    faqs: [
      { q: 'Is a written apology better than calling?', a: 'It depends on the friend. Writing suits cases where emotions are high: it lets both of you think. You can always follow up with a call.' },
      { q: 'Can I keep it gentle and quiet?', a: 'Yes. The apology journey is deliberately calm: no confetti and no pressure to respond.' },
      { q: 'What if they do not reply?', a: 'Give it time. You said what you needed to. A reply is theirs to give when they are ready.' },
    ],
    related: ['how-to-say-sorry-to-your-partner', 'thank-you-message-for-a-teacher', 'birthday-message-for-best-friend'],
  },
  {
    slug: 'how-to-say-sorry-to-your-partner',
    occasion: 'apology',
    metaTitle: 'How to Say Sorry to Your Partner and Be Believed',
    metaDescription: 'Saying sorry to a girlfriend, boyfriend or partner so it lands: take responsibility, be specific, avoid excuses, and give them space to respond.',
    h1: 'How to say sorry to your partner so they believe it',
    intro: [
      'Apologising to someone you love is harder than apologising to anyone else, because the stakes are higher and so is the temptation to defend yourself. The things that make a partner believe you are simple: you understand exactly what you did, you are not minimising it, and your behaviour changes afterwards.',
      'Start by accepting responsibility without conditions. Then describe the impact in your own words, not theirs. Avoid the word “but,” avoid explaining your intentions, and avoid asking them to get over it. A gentle written apology, read in private, can reach someone who is too hurt to listen in the moment.',
    ],
    include: [
      { title: 'Responsibility without conditions', body: '“It was my fault” is complete. Adding “if” or “but” turns it back into a negotiation.' },
      { title: 'The impact, in your words', body: '“I think I made you feel unimportant and embarrassed in front of people.” Showing you understand their experience matters most.' },
      { title: 'What will be different', body: 'A concrete change, not a mood: “I will step away from my phone when we are talking.”' },
      { title: 'Space to feel what they feel', body: '“Take whatever time you need.” Pressure to forgive quickly usually delays it.' },
    ],
    lines: [
      'I am sorry. I hurt you, and I will not pretend otherwise.',
      'You trusted me with something and I was careless with it. That is on me.',
      'I do not want to explain it away. I want to make it right.',
      'Whatever you need from me right now, I will do.',
      'I love you, and I am sorry I made you doubt it.',
    ],
    avoid: [
      'Sending it with demands for an answer or a timeline.',
      'Bringing up what they did wrong in the same message.',
      'Grand gestures that replace the actual apology.',
    ],
    faqs: [
      { q: 'Is it okay to apologise in a message?', a: 'It can be a good first step, especially when talking feels overwhelming. Follow it with real conversation when they are ready.' },
      { q: 'How is the apology gift different from a normal message?', a: 'It is quieter. There is no fanfare, and it gives the reader space to take it in and respond if and when they want to.' },
      { q: 'What if it was a serious breach of trust?', a: 'A message alone will not repair it. Use it to acknowledge what happened honestly, then follow through with changed behaviour over time.' },
    ],
    related: ['how-to-apologise-to-a-friend', 'romantic-message-for-no-reason', 'anniversary-message-for-husband'],
  },
  {
    slug: 'thank-you-message-for-a-teacher',
    occasion: 'thanks',
    metaTitle: 'Thank You Message for a Teacher or Mentor — What to Say',
    metaDescription: 'How to write a thank-you message to a teacher or mentor that they will remember: be specific, say what changed, and keep it short and sincere.',
    h1: 'A thank-you message for a teacher or mentor',
    intro: [
      'Teachers and mentors rarely hear what happened next. They spend years on people and usually never learn how it turned out. A message that says what they did, and what it made possible, can stay with them for a long time.',
      'The key is specifics. “Thank you for everything” is polite. “You were the first person who told me I was good at writing, and I became a writer” is unforgettable. Name the moment, say what changed and say where you are now.',
    ],
    include: [
      { title: 'The exact moment', body: 'A class, a comment, a piece of feedback. Put a date or a place on it if you can.' },
      { title: 'What it changed', body: 'A decision, a career, a confidence. Connect their action to the outcome.' },
      { title: 'Where you are now', body: 'A line about your life today. It is the update they almost never get.' },
      { title: 'A photo or a keepsake', body: 'An old class photo, or a photo of something you made that started with them.' },
    ],
    lines: [
      'You probably do not remember this, but one sentence you said to me changed my direction.',
      'I am doing what I do today partly because you believed in it before I did.',
      'Thank you for being patient when I was not easy to teach.',
      'I wanted you to know how it turned out.',
      'I think of your class whenever I am stuck, and it still helps.',
    ],
    avoid: [
      'Vague praise. Specifics are what they will remember.',
      'Making it about how good you were. Keep the focus on what they did.',
      'Waiting for a perfect moment. Late thanks is still thanks.',
    ],
    faqs: [
      { q: 'Is a digital thank-you appropriate for a teacher?', a: 'Yes. Many teachers keep messages like this for years. A private link they can open in their own time is easy to receive.' },
      { q: 'Can a whole class send one together?', a: 'One person can build it and include a line from each student in the note, with a class photo.' },
      { q: 'Should I add a gift too?', a: 'Not necessary. Sincere words are often what people keep.' },
    ],
    related: ['birthday-message-for-best-friend', 'congratulations-message-for-a-friend-new-job', 'birthday-gift-for-dad-who-wants-nothing'],
  },
  {
    slug: 'long-distance-gift-ideas-for-someone-you-miss',
    occasion: 'missyou',
    metaTitle: 'Long-Distance Gift Ideas for Someone You Miss',
    metaDescription: 'Ideas for a long-distance gift that says “I miss you” without sounding sad: what to include, lines to use, and how to make it feel close.',
    h1: 'Long-distance gift ideas for someone you miss',
    intro: [
      'Missing someone is best expressed in small, daily, physical-feeling details. The message that works is not “I miss you so much,” which they already know, but something that puts them next to you for a minute: what you saw today, what you would have shown them, what you are planning for when you meet.',
      'A digital gift can do this well because it can carry your voice, your photos and a few words in one place. Keep it light enough that it does not make them sadder, and end with a date or a plan. Hope is what makes distance bearable.',
    ],
    include: [
      { title: 'Your voice', body: 'Distance makes the ordinary sound of your voice precious. A short recording saying what you did today beats a long message.' },
      { title: 'A photo of where you are', body: 'Your desk, your street, your coffee. It lets them see your day.' },
      { title: 'Something you saved for them', body: '“I saw this and thought of you.” A small, honest detail that proves they are in your mind.' },
      { title: 'A date', body: 'Even a rough one. “Forty-one days.” A countdown is a promise you can look forward to together.' },
    ],
    lines: [
      'I miss you in the small moments: the ones I want to tell you about and cannot yet.',
      'Here is a little piece of my day, so you are not missing all of it.',
      'Distance is temporary. This feeling of being yours is not.',
      'I am counting the days, and I will keep counting until I am there.',
      'Open this when you need a minute with me.',
    ],
    avoid: [
      'Only saying how much it hurts. Balance it with something warm or funny.',
      'Vague promises. Give a real date if you can.',
      'Sending at a time they will be busy or in company. Pick a quiet moment.',
    ],
    faqs: [
      { q: 'Does it work across time zones?', a: 'Yes. It is a link they open whenever they see it, so the time difference does not matter.' },
      { q: 'Can I add a voice note from far away?', a: 'Yes, and it is worth doing. You can record it on your phone and add it before sharing.' },
      { q: 'Can they answer?', a: 'They can send back a reaction and a few words, privately, which is a nice way to keep the conversation going.' },
    ],
    related: ['birthday-surprise-for-mom-far-away', 'romantic-message-for-no-reason', 'anniversary-message-for-husband'],
  },
  {
    slug: 'how-to-propose-with-words',
    occasion: 'proposal',
    metaTitle: 'How to Propose With Words, Not Just a Ring — Ideas',
    metaDescription: 'Ideas for a proposal message or digital proposal: how to say what you mean, what to include, and how to give them a real choice to answer.',
    h1: 'How to propose with words, not just a ring',
    intro: [
      'The most memorable proposals are built around a sentence the other person can hear you meaning. The setting helps, but the words are what they will repeat for years. If you can say exactly why you are asking, and what you see for the two of you, the rest matters less.',
      'A digital proposal can hold those words in a private moment before the real one, or serve as the question itself when you are apart. Give them an honest choice to answer, including the freedom to say they need time. A question that cannot be refused is not a question.',
    ],
    include: [
      { title: 'Why them', body: 'Not praise in general. Something specific you have seen them do that made you certain.' },
      { title: 'The life you picture', body: 'Two or three small, real scenes, not a fantasy. “Slow mornings and arguing about where to go for dinner.”' },
      { title: 'The history that got you here', body: 'A few photos and dates. It turns the question into the next line of a story they already know.' },
      { title: 'Room to answer honestly', body: 'Let them say yes, talk, or not yet. A real choice is what makes a yes mean something.' },
    ],
    lines: [
      'I have been trying to find the right way to ask you something, and I decided to just be honest.',
      'Everything good in my life got easier once you were in it.',
      'I want to spend my life finding out what comes next with you.',
      'There is no rush. I wanted you to know exactly how I feel.',
      'Will you marry me?',
    ],
    avoid: [
      'Making a public spectacle that leaves no room to say anything but yes.',
      'Borrowing big phrases that are not yours. Plain and sincere is better.',
      'Assuming the answer. Ask, and be ready for whatever they need.',
    ],
    faqs: [
      { q: 'Can the answer be “not yet”?', a: 'Yes. The proposal journey offers honest answers, including asking for more time, and nothing is sent to you until they choose to reply.' },
      { q: 'Should this replace the in-person moment?', a: 'Usually not. It works best as a private prelude, or as the question when you are apart and plan to celebrate together afterwards.' },
      { q: 'Can I add photos of us?', a: 'Yes, up to four, with captions, plus a few dated memories and your own words.' },
    ],
    related: ['anniversary-message-for-wife', 'romantic-message-for-no-reason', 'long-distance-gift-ideas-for-someone-you-miss'],
  },
  {
    slug: 'congratulations-message-for-a-friend-new-job',
    occasion: 'congratulations',
    metaTitle: 'Congratulations Message for a Friend’s New Job or Win',
    metaDescription: 'What to write when a friend gets a new job, promotion or big win: sincere lines, how to be specific, and a memorable way to send it.',
    h1: 'A congratulations message for a friend’s new job or big win',
    intro: [
      'Congratulations are easy to send and easy to make forgettable. “Congrats!! So happy for you” is fine. The messages people keep say what you saw behind the win: the effort, the nerves, the months nobody else noticed.',
      'Try to name the work, not just the result. If you watched them prepare, say so. If they nearly gave up, acknowledge that. It turns a polite message into a recognition, and recognition is what people remember from good news. If you can, add a photo from before, such as the two of you on a bad day at the old job, so the win has something to be measured against.',
    ],
    include: [
      { title: 'What you saw them go through', body: 'The late nights, the rejections, the second attempt. Naming it shows you paid attention.' },
      { title: 'Why they deserve it', body: 'A specific quality: persistence, kindness, craft. Say it plainly.' },
      { title: 'What you are looking forward to', body: 'Hearing how it goes, celebrating properly, seeing what they do with it.' },
      { title: 'A promise to celebrate', body: 'Propose a real plan: dinner, drinks, a call. It turns the message into an event.' },
    ],
    lines: [
      'I am so proud of you. I watched how hard you worked for this.',
      'They are lucky to have you, and I hope you know that.',
      'You did this. Not luck, not timing, you.',
      'Dinner is on me. Pick a date.',
      'This is only the start, and I cannot wait to see what you do next.',
    ],
    avoid: [
      'Comparing yourself or making it about your own situation.',
      'Generic phrases with no detail. One specific line is enough.',
      'Waiting too long. The first few days are when it means the most.',
    ],
    faqs: [
      { q: 'Is this too much for a work win?', a: 'A light, warm version works well. Keep it short and let the sincerity do the work.' },
      { q: 'Can I include a funny touch?', a: 'Yes. The congratulations journey has a playful feel, and you can choose the mood to match your friendship.' },
      { q: 'What if it is a colleague, not a close friend?', a: 'Keep the tone simpler: one line of specific praise and a good wish. It is still more thoughtful than a generic message.' },
    ],
    related: ['thank-you-message-for-a-teacher', 'birthday-message-for-best-friend', 'how-to-propose-with-words'],
  },
  {
    slug: 'romantic-message-for-no-reason',
    occasion: 'love',
    metaTitle: 'A Romantic Message for No Reason — Ideas & Lines',
    metaDescription: 'Why a romantic message for no reason often means more than one on a date, what to write, and example lines to adapt for a partner or someone you love.',
    h1: 'A romantic message for no reason at all',
    intro: [
      'Messages on birthdays and anniversaries are expected. The ones people remember are the ones that arrive on a normal Tuesday. A note with no occasion says something the calendar cannot: that you think of them on ordinary days, not only on the days you are supposed to.',
      'Keep it simple. You do not need a reason or a big statement. Pick one thing you noticed recently and say it. The gift is the fact that you noticed. A small private page with a few reasons you love them, a photo and a line is plenty.',
    ],
    include: [
      { title: 'Something you noticed this week', body: 'A small thing: how they laughed at something, how they handled a bad day. Recent is better than general.' },
      { title: 'A few reasons, not a long list', body: 'Three real ones beat twenty generic ones. Each should be something only they do.' },
      { title: 'A photo from an ordinary day', body: 'Not a special occasion: a photo from a normal afternoon. It says you value the ordinary.' },
      { title: 'No ask', body: 'Do not attach a favour or a request. The point is that it is just because.' },
    ],
    lines: [
      'No reason. I just wanted you to know I was thinking of you.',
      'Of all the people I could be doing life with, I am glad it is you.',
      'You made today better without even knowing it.',
      'I love you in the small moments the most.',
      'I built you something little. Open it when you have a quiet minute.',
    ],
    avoid: [
      'Saying “just because” and then adding a serious conversation. Keep it light.',
      'Overdoing it. A small, sincere note beats a grand one.',
      'Waiting for the right moment. The ordinary moment is the point.',
    ],
    faqs: [
      { q: 'Will it feel strange with no occasion?', a: 'Usually the opposite. Unexpected messages are the ones people treasure most.' },
      { q: 'Can I use this for a friend or family member?', a: 'Yes. It works for anyone you love. Adjust the wording to fit the relationship.' },
      { q: 'How long does it take to make?', a: 'Only their name is required, so you can make a simple one in a couple of minutes. You can add a note and photos if you have more time.' },
    ],
    related: ['anniversary-message-for-husband', 'birthday-website-for-girlfriend', 'long-distance-gift-ideas-for-someone-you-miss'],
  },
];

export const IDEA_SLUGS = new Map(IDEAS.map((idea) => [idea.slug, idea]));

export function ideasFor(occasion: OccasionKey): Idea[] {
  return IDEAS.filter((idea) => idea.occasion === occasion);
}
