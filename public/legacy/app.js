
'use strict';
(() => {
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const icon = (name, cls='') => `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e = escapeHTML;
const sleep = ms => new Promise(resolve => setTimeout(resolve, reducedMotion ? Math.min(ms,80) : ms));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DRAFT_KEY = 'luv4u.draft.v1'; // Legacy draft migration; v2 uses IndexedDB.
const MAX_PAYLOAD = 12_000_000;
const VIBES = [{name:'Romantic',symbol:'♡'},{name:'Cute',symbol:'✿'},{name:'Funny',symbol:'☺'},{name:'Emotional',symbol:'☁'},{name:'Crazy',symbol:'✷'},{name:'Elegant',symbol:'✧'}];
const defaults = {
 Romantic: "Of all the days in the year, this one's my favorite. Because the world got you.\n\nI hope today feels like a long hug. Like your favorite song coming on. Like all the love you give finding its way back to you.\n\nHere's to you, and to a thousand more little moments worth keeping. Happy birthday, lovely you. ♡",
 Cute: "Today, the universe gets a little gold star. Because on this day, it gave us you.\n\nI hope your day is full of the good stuff: your favorite people, something delicious, and the kind of laughter that makes your cheeks hurt.\n\nYou make the ordinary days a little brighter. Today, let the world do the same for you. Happy birthday, lovely human. ♡",
 Funny: "Congratulations on another successful trip around the sun. Excellent work sitting on a spinning planet. Honestly, iconic.\n\nI hope your cake is enormous, your responsibilities are tiny, and nobody asks you to share the last slice.\n\nThe world is a much more fun place with you in it. Never change. Well, maybe your passwords. Happy birthday! ♡",
 Emotional: "Some people make life feel a little less heavy. A little more beautiful. You're one of those people.\n\nOn your birthday, I hope you remember how deeply you matter. Not because of what you do, or what you've achieved. Just because you're you.\n\nMay this next chapter be gentle, bright, and full of the love you deserve. I'm so glad you exist. ♡",
 Crazy: "Attention, everyone: a certified legend was born today. Cake is mandatory. Dancing is encouraged. Acting your age is absolutely not required.\n\nHere's to questionable dance moves, excellent snacks, and a year with more plot twists than your favorite show. The good kind, obviously.\n\nGo be wildly, brilliantly, unapologetically you. The world needs more of that. Happy birthday! ♡",
 Elegant: "A little moment to celebrate a truly wonderful person.\n\nMay the year ahead bring you quiet joys, beautiful possibilities, and time for the things that make your heart feel full.\n\nHere's to meaningful moments, new beginnings, and a life that keeps unfolding in lovely ways. Wishing you the happiest of birthdays. ♡"
};
/* v3 · A shared story engine, eight genuinely different little gifts.
   Occasion is an allowlisted content choice, never a piece of executable markup.
   Old links without an occasion remain birthday gifts. */
const OCCASIONS = {
 birthday: {
  slug:'birthday-wish',label:'Birthday wish',short:'Birthday',symbol:'✧',art:'cake',vibe:'Cute',group:'celebrate',
  description:'A midnight countdown, a cake to wish on, and their very own Birthday Wrapped.',
  whisper:'For their one-in-a-year kind of day.',
  title:'Who’s your<br><em>birthday person?</em>',intro:'A name is all you need. The rest is icing.',
  greeting:'Happy Birthday,',eyebrow:'Today is all about you',portrait:'TODAY IS ALL ABOUT',
  path:['A midnight countdown','Make a wish','Their Birthday Wrapped','A card for their story'],
  fallback:'',finish:'',noteLabel:'A birthday note',extras:'A countdown, cake, Birthday Wrapped, a lovely note and a story card are already included.',
  detailTitle:'Birthday Wrapped & age candles',share:'a little birthday world',cta:'Make a birthday wish',
  seo:'Create a personalized birthday wish website with fairy lights, an interactive cake, photos and editable messages.'
 },
 proposal: {
  slug:'romantic-proposal',label:'Romantic proposal',short:'Proposal',symbol:'♡',art:'envelope',vibe:'Romantic',group:'love',
  description:'A few butterflies. Your words. One lovely, honest question.',
  whisper:'For a brave little question from the heart.',
  title:'Who gives you<br><em>the butterflies?</em>',intro:'Start with their name. The question can come from the heart—or a little help from us.',
  greeting:'A little question,',eyebrow:'Some feelings deserve a moment',portrait:'A QUESTION FROM THE HEART',
  opening:'A few butterflies.<br><em>One little light.</em>',welcome:'There’s something I’ve been wanting to ask you. But first, a little something from the heart.',
  path:['Let the lights in','A note from the heart','The little question','Room for an honest answer'],
  fallback:'{name}, I like the way life feels when you’re in it. The little conversations. The ordinary moments. The possibility of more.\n\nI made this because I wanted to ask you something, gently and honestly. Whatever your answer, it matters to me.',
  finish:'A brave little question. A little room to feel. Whatever comes next, thank you for being here.',
  finalTitle:'A little courage.<br><em>A lot of heart.</em>',noteLabel:'The words before the question',extras:'A candlelit opening, a heartfelt note and a ready-made question are already included.',
  detailTitle:'Your little question',share:'a little question from the heart',cta:'Make a romantic proposal',
  seo:'Create a personal romantic proposal website with a candlelit reveal, editable question and thoughtful, pressure-free ways to respond.'
 },
 love: {
  slug:'show-your-love',label:'Show your love',short:'Love note',symbol:'♡',art:'hearts',vibe:'Romantic',group:'love',
  description:'Little reasons you love them, tucked into a world of their own.',
  whisper:'No special date. Just a very special person.',
  title:'Who makes your<br><em>world warmer?</em>',intro:'No occasion needed. Just a name, and a little love.',
  greeting:'A little love for',eyebrow:'Just because you’re you',portrait:'NO REASON NEEDED. JUST YOU.',
  opening:'No special occasion.<br><em>Just a special you.</em>',welcome:'No grand reason. No date on the calendar. I just thought you should know how much you mean to me.',
  path:['A little light','Unfold three hearts','Your love letter','A little love back'],
  fallback:'{name}, this is your little reminder that you are loved. Not just on the big days, or the easy days, or the days when everything goes right.\n\nOn the ordinary Tuesdays, too. Especially then. You make my world a warmer place, simply by being in it. ♡',
  finish:'Keep this little corner of love. Come back whenever your day needs a softer place to land.',
  finalTitle:'No special reason.<br><em>Just you. Always you.</em>',noteLabel:'A little love letter',extras:'Three little heart notes, a love letter and a warm ending are already included.',
  detailTitle:'The little things you love',share:'a little world full of love',cta:'Send a little love',
  reasons:['You make the ordinary feel a little more lovely.','There’s only one you. And I’m so glad there is.','A small reminder: you are loved, exactly as you are.'],
  seo:'Make a personalized love letter website. Unfold sweet messages, add photos and a voice note, and share a little love with one link.'
 },
 apology: {
  slug:'sorry-gift',label:'Sorry gift',short:'Sorry',symbol:'🥺',art:'teddy',vibe:'Cute',group:'love',
  description:'A pleading teddy, your sorry, and one very important question.',
  whisper:'For the fight you want over by tonight.',
  title:'Who are you<br><em>in trouble with? 🥺</em>',intro:'Just their name. We’ll help you say sorry in the cutest way possible.',
  greeting:'I’m so sorry,',eyebrow:'Someone’s been a little bit of an idiot',portrait:'A VERY SORRY LITTLE SURPRISE',
  opening:'Someone’s been<br><em>a little bit of an idiot…</em>',welcome:'I messed up. I know. And I can’t stop thinking about you. So I made you this, with my whole silly heart.',
  path:['A pouty little hello','How sorry am I? (Very.)','Sorry coupons and my note','Forgive me? 🥺'],
  fallback:'{name}, I’m sorry. I was wrong, you were right, and I would like that framed.\n\nI hate it when we fight. I miss your face, your voice and your terrible jokes. Can we go back to being us? 🥺',
  finish:'Fights are temporary. You and me? Not even a little bit temporary. 💗',
  finalTitle:'Forgiven.<br><em>Best. Person. Ever.</em>',noteLabel:'Your sorry note',extras:'A pleading teddy, a sorry meter, sorry coupons and the big question are already included.',
  detailTitle:'Coupons and the big question',share:'a very sorry little surprise',cta:'Make my sorry 🥺',
  coupons:['One free hug. No expiry date.','I listen first and talk second. Promise.','Your choice of food. Zero complaints.'],
  seo:'Make a cute sorry website for your partner: a pleading teddy, a sorry meter, sorry coupons and a Forgive me? question with a No button that runs away.'
 },
 anniversary: {
  slug:'anniversary',label:'Happy anniversary',short:'Anniversary',symbol:'∞',art:'book',vibe:'Elegant',group:'love',
  description:'Your little story, page by page. Here’s to the next chapter.',
  whisper:'For the love you keep choosing.',
  title:'Who’s your<br><em>favorite chapter?</em>',intro:'A name is enough to begin your little story. Dates and memories can come later.',
  greeting:'Happy Anniversary,',eyebrow:'Here’s to the story we’re still writing',portrait:'OUR LITTLE STORY, STILL UNFOLDING',
  opening:'Some stories deserve<br><em>their own little light.</em>',welcome:'To the beginning, the everyday, and everything we haven’t discovered yet. Here’s to us.',
  path:['Light up our little world','Turn the storybook pages','A note for this chapter','Here’s to what comes next'],
  fallback:'Happy anniversary, {name}. I love that our story is made of so many little things: conversations, familiar smiles, and days that belong only to us.\n\nHere’s to what we’ve shared, what we’re still learning, and all the pages we have yet to write. ♡',
  finish:'Not a perfect story. Our story. And I’m so glad we get to keep writing it.',
  finalTitle:'Another chapter.<br><em>Still my favorite story.</em>',noteLabel:'A note for this chapter',extras:'A miniature storybook, an anniversary note and a lovely next chapter are already included.',
  detailTitle:'Where your story began',share:'a little anniversary story',cta:'Celebrate your story',
  seo:'Create a personalized anniversary website with a little storybook, your start date, memories, photos and an editable anniversary message.'
 },
 thanks: {
  slug:'thank-you',label:'Thank you',short:'Thank you',symbol:'✿',art:'bouquet',vibe:'Cute',group:'care',
  description:'A tiny bouquet for someone who made a big difference.',
  whisper:'For the kindness you haven’t forgotten.',
  title:'Who deserves<br><em>a little thank-you?</em>',intro:'The big kindnesses. The quiet ones. Start with the person behind them.',
  greeting:'Thank you,',eyebrow:'Your kindness didn’t go unnoticed',portrait:'A LITTLE THANKS. A LOT OF HEART.',
  opening:'A little kindness.<br><em>A lasting little light.</em>',welcome:'Some people make a difference without making a fuss. This is a little thank-you for being one of them.',
  path:['A little light for you','Gather a gratitude bouquet','The words behind the flowers','All the appreciation'],
  fallback:'{name}, thank you. For your kindness, your thoughtfulness, and the little ways you make things better.\n\nYou may not always see the difference you make. I wanted you to know that I do. This is a small thing, with a very grateful heart behind it. ♡',
  finish:'A small bouquet could never quite say it all. But every little flower means thank you.',
  finalTitle:'A little bouquet.<br><em>A very grateful heart.</em>',noteLabel:'A thank-you from the heart',extras:'A gratitude bouquet, a warm thank-you note and a gentle celebration are already included.',
  detailTitle:'What you’re grateful for',share:'a little bouquet of thanks',cta:'Make a little thank-you',
  reasons:['For the kindness that made a difference.','For the thought you put into the little things.','For being wonderfully, thoughtfully you.'],
  seo:'Send a personalized thank-you website with an interactive gratitude bouquet, thoughtful message templates and optional photos or voice notes.'
 },
 congratulations: {
  slug:'congratulations',label:'Congratulations',short:'Congratulations',symbol:'✦',art:'medal',vibe:'Elegant',group:'celebrate',
  description:'A little spotlight for their not-so-little achievement.',
  whisper:'New job. Big win. A brave new beginning.',
  title:'Who’s having<br><em>their big moment?</em>',intro:'Big milestones and quiet victories both count. Who are we cheering for?',
  greeting:'Look at you,',eyebrow:'This little spotlight is yours',portrait:'A LITTLE SPOTLIGHT, JUST FOR YOU',
  opening:'The light is waiting.<br><em>This moment is yours.</em>',welcome:'Pause for a moment. Let it sink in. This is something worth celebrating, and so are you.',
  path:['Step into the spotlight','Untie your celebration ribbon','A note of pure pride','A well-earned confetti moment'],
  fallback:'Congratulations, {name}! This is your little reminder to pause and let yourself enjoy this moment.\n\nThe effort matters. The courage matters. The small steps that got you here matter. I’m cheering for you, for this chapter and whatever comes next. ✧',
  finish:'Here’s to this moment, and to all the possibilities waiting on the other side of it.',
  finalTitle:'You did a thing.<br><em>A wonderful, wonderful thing.</em>',noteLabel:'A little note of pride',extras:'A little spotlight, a ribbon to untie and a congratulatory note are already included.',
  detailTitle:'Their well-earned moment',share:'a little celebration just for you',cta:'Celebrate their moment',
  seo:'Make a congratulations website for a new job, graduation, promotion or personal win. Add a message and share a small interactive celebration.'
 },
 missyou: {
  slug:'miss-you',label:'Miss you',short:'Miss you',symbol:'☾',art:'plane',vibe:'Emotional',group:'care',
  description:'A paper hug for the person you wish was a little closer.',
  whisper:'For the miles, and the moments between hellos.',
  title:'Who feels<br><em>a little far away?</em>',intro:'A name. A little thought. A way to make the distance feel smaller.',
  greeting:'A little closer to',eyebrow:'Different places. A little closer.',portrait:'A LITTLE HUG, ACROSS THE DISTANCE',
  opening:'Different places.<br><em>The same little sky.</em>',welcome:'Some days I wish I could fold the distance into something small. So I made you this little corner of my day.',
  path:['A light across the distance','Catch a paper hug','A note from over here','Until the next hello'],
  fallback:'{name}, I miss you. The little conversations. Having you nearby. The way ordinary moments feel different when we share them.\n\nUntil the next hello, here’s a little bit of me in your day. I hope it makes the distance feel just a little smaller. ♡',
  finish:'Until the next hello, there’s a little light for you over here.',
  finalTitle:'A little far apart.<br><em>Still held close.</em>',noteLabel:'A note across the distance',extras:'A travelling paper hug, a thoughtful note and a light to come back to are already included.',
  detailTitle:'Until the next hello',share:'a little hug across the distance',cta:'Send a paper hug',
  seo:'Send a personalized miss-you website with a paper-hug interaction, photos, memories and a voice note for someone far away.'
 },
 wedding: {
  slug:'wedding-invite',label:'Wedding invite',short:'Wedding',symbol:'❀',art:'marigold',vibe:'Elegant',group:'bigday',
  description:'A wedding invite your guests open like a wax-sealed envelope: story pages for every function, maps, calendar, your song, and a personal link for each guest.',
  whisper:'For the guest list, not just one person.',
  title:'Your wedding<br><em>invite. 💛</em>',intro:'About a minute. Dates, times and words are filled in for you, and each guest gets their own link.',
  greeting:'The wedding of',eyebrow:'You’re invited',portrait:'THE WEDDING OF',
  opening:'You’re<br><em>invited.</em>',welcome:'With the blessings of our families, we invite you to celebrate with us.',
  path:['A sealed envelope with their name','Marigolds part, your names in gold','Every function, with maps','A countdown to your big day'],
  fallback:'With the blessings of our families, we joyfully invite you to celebrate our wedding with us.\n\nYour presence will make our day complete. Come for the functions, stay for the food, and dance with us. 💛',
  finish:'Your presence is the only gift we need.',
  finalTitle:'We can’t wait to<br><em>celebrate with you.</em>',noteLabel:'A note from the families',extras:'The envelope, marigold curtains, your names in gold, a countdown, every function with maps and a story card are already included.',
  detailTitle:'Functions & families',share:'our wedding invite',cta:'Make our wedding invite',
  seo:'Create a digital wedding invitation: a wax-sealed envelope from your families, story pages for Haldi, Mehendi, Sangeet and the wedding with Google Maps and calendar, Hindi wedding music, and a personal link for every guest.'
 }
};
const occasionOf = value => OCCASIONS[occasionKey(value)];
const occasionKey = value => Object.hasOwn(OCCASIONS, value?.occasion) ? value.occasion : 'birthday';
const personalize = (text,g) => String(text||'').replaceAll('{name}',g.name||'your person');
const defaultNote = g => g.occasion==='birthday'||!g.occasion ? defaults[g.vibe] : personalize(occasionOf(g).fallback,g);
const validStoryDate = value => {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return '';
 const date=new Date(value+'T12:00:00Z');
 return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value&&value<=new Date().toISOString().slice(0,10) ? value : '';
};
const PROPOSAL_QUESTIONS={relationship:'Will you be my person?',date:'Would you like to go on a date with me?',marriage:'Will you marry me?'};
const proposalQuestion = g => g.proposalQuestion?.trim() || PROPOSAL_QUESTIONS[g.proposalKind] || PROPOSAL_QUESTIONS.relationship;
const GENERIC_REACTIONS=[['🥹','Moved'],['😂','Made me smile'],['❤️','Sending love'],['🎉','Celebrating']];
const SORRY_REACTIONS=[['💗','Forgiven'],['🤗','Come here'],['🙄','Lucky you’re cute'],['🥺','Still a tiny bit mad']];
const WEDDING_REACTIONS=[['🙏','Blessings to you both'],['🎉','We’ll be there'],['💛','So happy for you'],['🥹','So emotional']];
/* The sorry gift: who says sorry for you, and the one question it asks. */
const SORRY_CHARACTERS={teddy:'🧸 Teddy',cat:'🐱 Kitty',stickers:'🥺 Just stickers'};
const sorryCharacter=g=>Object.hasOwn(SORRY_CHARACTERS,g?.character)?g.character:'teddy';
const forgiveQuestion=g=>g.forgiveQuestion?.trim()||'Will you forgive me? 🥺';
const sorryCoupons=g=>[0,1,2].map(i=>g.coupons?.[i]?.trim()||OCCASIONS.apology.coupons[i]);
/* Birthday extras, all optional: their birth date (Birthday Wrapped numbers, and number candles if the sender wants their age shown) and two Wrapped answers. */
const BIRTHDAY_WRAPPED={Romantic:['Pure magic ✨','Your laugh 🎶'],Cute:['Main character energy','Your laugh 🎶'],Funny:['Certified chaos 🤪','Your terrible jokes 🎶'],Emotional:['A heart of gold','Your voice 🎶'],Crazy:['Unhinged (affectionately)','Your dance moves 🎶'],Elegant:['Effortless grace','Your laugh 🎶']};
const wrappedPicks=g=>{const d=BIRTHDAY_WRAPPED[g.vibe]||BIRTHDAY_WRAPPED.Cute;return [g.topTrait?.trim()||d[0],g.mostPlayed?.trim()||d[1]];};
const validBirthDate=v=>{const d=validStoryDate(v);return d&&d>='1900-01-01'?d:'';};
const localDay=(y,m,d)=>new Date(y,m-1,d);
const today=()=>{const n=new Date();return localDay(n.getFullYear(),n.getMonth()+1,n.getDate());};
const daysAlive=g=>{const b=validBirthDate(g.birthDate);if(!b)return 0;const [y,m,d]=b.split('-').map(Number);return Math.max(0,Math.round((today()-localDay(y,m,d))/864e5));};
/* The age they are turning: on the day, or within a month before it; otherwise the age they turned most recently. */
const birthdayAge=g=>{const b=validBirthDate(g.birthDate);if(!b)return 0;const [y,m,d]=b.split('-').map(Number),t=today();let next=localDay(t.getFullYear(),m,d);if(next<t)next=localDay(t.getFullYear()+1,m,d);const age=next.getFullYear()-y-((next-t)/864e5<=31?0:1);return age>0&&age<121?age:0;};
const shownAge=g=>g.ageCandles?birthdayAge(g):0;
let homeOccasion='love',journeyReply='',proposalAnswer='',forgiven=false,noDodges=0,openedNotes=new Set(),chapterIndex=0,occasionSwitchBusy=false;
let backendOccasions=['birthday'];
const occasionDrafts=new Map();

const emptyDraft = () => ({occasion:'birthday',proposalKind:'relationship',proposalQuestion:'',reasons:[],character:'teddy',coupons:[],forgiveQuestion:'',partner:'',family1:'',family2:'',families:'',city:'',weddingDate:'',events:[],hashtag:'',blessing:'shubh',groomFirst:false,birthDate:'',ageCandles:false,topTrait:'',mostPlayed:'',togetherSince:'',milestone:'',reunionMessage:'',name:'',vibe:'Cute',message:'',sender:'',photos:[],memories:[],voice:'',voiceName:'',music:'none',musicSrc:'',musicName:'',volume:.24,branch:false,motion:true,sharePreview:true,replyPhone:'',quizQuestion:'',quizAnswer:'',quizOptions:[],fun:'none',funMessage:'',finalMessage:'',finalUrl:''});
let draft=emptyDraft(), currentView='home', publishedGift=null, publishedURL='', previewReturn='creator', gift=null, scenes=[], sceneIndex=0, transitionBusy=false, experienceToken=0, saveTimer, toastTimer, localStorageOkay=true, photoBusy=false;
let micStream=null, micFrame=null, micTimeout=null, mediaRecorder=null, recordedChunks=[], recordInterval=null, recordingSeconds=0, recordingGeneration=0;
let musicAudio=null, audioContext=null, masterGain=null, melodyTimer=null, melodyVoices=[], soundMuted=false, musicDucked=false, scratchCleanup=null, confettiFrame=null, voiceWasMusicPlaying=false, activeAudioNodes=new Set();
const RAGAS=['shehnai','baraat','sitar'];
let reaction='', replySharedText='', scratchDone=false, popCount=0;

function safeWebURL(value) {
 const s=String(value||'').trim(); if(!s || s.length>4096) return '';
 try { const u=new URL(s); return (u.protocol==='https:'||u.protocol==='http:') && !u.username && !u.password ? u.href : ''; } catch { return ''; }
}
const cleanText = (s,max=1000) => typeof s==='string' ? s.slice(0,max).replace(/\u0000/g,'') : '';
function sanitizeGiftV1(d, needName=true) {
 if(!d || typeof d!=='object' || Array.isArray(d)) throw new Error('This gift is missing its little details.');
 const x=emptyDraft(); x.name=cleanText(d.name,40).trim();
 if(needName && !x.name) throw new Error('This little gift is missing its name.');
 x.vibe=VIBES.some(v=>v.name===d.vibe)?d.vibe:'Cute';
 for(const [k,max] of [['message',1200],['sender',40],['funMessage',140],['finalMessage',500]]) x[k]=cleanText(d[k],max);
 x.photos=(Array.isArray(d.photos)?d.photos:[]).slice(0,4).map(p=>({src:safeMedia(p?.src,'image'),caption:cleanText(p?.caption,70)})).filter(p=>p.src);
 x.memories=(Array.isArray(d.memories)?d.memories:[]).slice(0,3).map(m=>({when:cleanText(m?.when,40),text:cleanText(m?.text,200)}));
 x.voice=safeMedia(d.voice,'audio');x.voiceName=cleanText(d.voiceName,100);
 x.music=['none','musicbox','dreamy','custom',...RAGAS].includes(d.music)?d.music:'none';x.musicStart=Math.min(900,Math.max(0,Math.round(Number(d.musicStart))||0));x.musicSrc=safeMedia(d.musicSrc,'audio');x.musicName=cleanText(d.musicName,100);
 if(x.music==='custom'&&!x.musicSrc)x.music='none';
 x.fun=['none','balloons','scratch','quiz'].includes(d.fun)?d.fun:'none';x.finalUrl=safeWebURL(d.finalUrl);
 x.id=cleanText(d.id,40).replace(/[^a-zA-Z0-9_-]/g,'');x.version=1;
 return x;
}
function toast(text) { clearTimeout(toastTimer);$('#toast').textContent=text;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4200); }
function uuid() { if(crypto.randomUUID) return crypto.randomUUID().replace(/-/g,'').slice(0,12);const a=new Uint8Array(9);crypto.getRandomValues(a);return [...a].map(x=>x.toString(16).padStart(2,'0')).join(''); }
/* The server sets each page's own <title> (home or /for/<occasion>); the landing view keeps it. */
const SERVER_TITLE=document.title;
function showViewV1(view) {
 if(currentView==='experience')cleanupExperience();
 if(view!=='creator' && mediaRecorder)stopRecording(false);
 currentView=view; const ids={home:'homeView',creator:'creatorView',share:'shareView',error:'errorView'};
 for(const [key,id] of Object.entries(ids))$('#'+id).hidden=key!==view;
 $('#experience').hidden=true;$('#siteHeader').hidden=false;document.body.classList.remove('experiencing');
 $('#headerRight').innerHTML=view==='home'?'<a href="#how-it-works" class="nav-link nav-how">How it works</a><button class="nav-link pill-link" data-action="create">Make a gift '+icon('up')+'</button>':'<span class="header-note">A little love goes a long way.</span><span style="color:#dc8494;font-size:19px" aria-hidden="true">♡</span>';
 document.title=SERVER_TITLE;
 $('meta[name="theme-color"]').content='#faf7f2';
 window.scrollTo(0,0);
}
function goHome(){clearGiftHash();resetLanding();showView('home');}
function updatePreviewV1() {
 const name=draft.name.trim();$('#previewName').textContent=name?name+'.':'your person.';
 $('#previewLiveTag').textContent=name?`${name}'s birthday world is ready`:'Their birthday world is almost ready';
 $('#dockNote').textContent=name?`A whole little birthday for ${name}.`:'A name. That\'s all the magic needs.';
 const accents={Romantic:'#ce275e',Cute:'#d23c6c',Funny:'#da7a20',Emotional:'#928085',Crazy:'#e55d2b',Elegant:'#b29042'};
 $('#previewName').style.color=accents[draft.vibe];
 $('#editorRoom').classList.toggle('long-name',name.length>18);
 $$('#vibeGrid button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vibe===draft.vibe)));
 $$('#musicChoices button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.music===draft.music)));
 $$('#funChoices button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fun===draft.fun)));
 $('#funMessageField').hidden=draft.fun==='none';
 $('#photosSubtitle').textContent=draft.photos.length?`${draft.photos.length} little ${draft.photos.length===1?'moment':'moments'} tucked inside`:'The blurry ones count, too';
 $('#memoriesSubtitle').textContent=draft.memories.some(m=>m.text.trim())?'Some moments are worth keeping':'Remember that one time…';
 $('#addMemory').disabled=draft.memories.length>=3;
}
function populateFormV1() {
 const map={recipientName:'name',personalMessage:'message',senderName:'sender',funMessage:'funMessage',finalMessage:'finalMessage',finalUrl:'finalUrl'};
 Object.entries(map).forEach(([id,k])=>$('#'+id).value=draft[k]||'');
 $('#voiceUrl').value=draft.voice&&!draft.voice.startsWith('data:')?draft.voice:'';
 $('#musicUrl').value=draft.musicSrc&&!draft.musicSrc.startsWith('data:')?draft.musicSrc:'';
 renderPhotoList();renderMemoryList();renderAudioChip('voice');renderAudioChip('music');updatePreview();
}
function collectGift(){const g=sanitizeGift(draft);g.memories=g.memories.filter(m=>m.text.trim());g.message=g.message.trim();g.sender=g.sender.trim();g.finalMessage=g.finalMessage.trim();g.funMessage=g.funMessage.trim();if(g.music!=='custom'){g.musicSrc='';g.musicName='';}return g;}
function validateFormV1() {
 const invalid=!draft.name.trim();$('#nameError').hidden=!invalid;$('#recipientName').setAttribute('aria-invalid',String(invalid));
 if(invalid){$('#recipientName').focus();$('#recipientName').scrollIntoView({behavior:'smooth',block:'center'});return false;}
 for(const [id,label] of [['voiceUrl','voice note'],['musicUrl','soundtrack'],['finalUrl','final surprise']]){const input=$('#'+id);if(input.value.trim()&&!safeWebURL(input.value)){toast(`The ${label} needs a complete http or https link.`);input.closest('details').open=true;input.focus();return false;}}
 if(photoBusy){toast('Your photos are still being resized. The gift will be ready when they appear below.');return false;}
 if(mediaRecorder){toast('Finish your voice recording before wrapping the gift.');return false;}
 return true;
}

/* Small hand-drawn SVG objects. Every illustration lives in this file. */
/* Number candles for their age (only when the sender chose to show it): one striped digit per number, each with its own flame. */
function numberCandles(id,age){
 const digits=String(age).split(''),w=50,x0=150-(digits.length-1)*w/2;
 return `<defs><linearGradient id="${id}-num" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ff8fb1"/><stop offset=".55" stop-color="#ff5c8a"/><stop offset="1" stop-color="#ffb65a"/></linearGradient></defs>`+digits.map((n,i)=>{const x=x0+i*w,top=86;return `<g><text x="${x}" y="139" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="68" fill="url(#${id}-num)" stroke="#fff5df" stroke-width="2.5" paint-order="stroke">${n}</text><path d="M${x} ${top-1}v-5" stroke="#8a5733" stroke-width="1.2"/><g class="flame" style="transform-origin:${x}px ${top-6}px;animation-delay:${i*.4}s"><circle cx="${x}" cy="${top-14}" r="26" fill="url(#${id}-glow)"/><path d="M${x} ${top-28}c-1 7-9 11-6 18 2 6 11 5 12 0 2-6-5-11-6-18Z" fill="#ffb65a"/><path d="M${x} ${top-20}c-4 5-5 12 0 13 5-1 4-8 0-13Z" fill="#fff6cf"/></g><path class="cake-smoke" d="M${x} ${top-7}q-9-9 0-17t-2-18" stroke-width="1.2"/></g>`;}).join('');
}
function cakeSVG(id='cake',age=0){
 return `<svg viewBox="0 0 300 270" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="${id}-body" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#f38a9c"/><stop offset=".45" stop-color="#ffb9b9"/><stop offset="1" stop-color="#ef7e99"/></linearGradient><linearGradient id="${id}-icing" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff9e9"/><stop offset="1" stop-color="#ffe0bf"/></linearGradient><linearGradient id="${id}-stand" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#e4a75b"/><stop offset=".5" stop-color="#ffd396"/><stop offset="1" stop-color="#e3a054"/></linearGradient><radialGradient id="${id}-glow"><stop stop-color="#ffdf94" stop-opacity=".7"/><stop offset="1" stop-color="#ffe7a0" stop-opacity="0"/></radialGradient></defs><ellipse cx="150" cy="255" rx="99" ry="10" fill="#be5924" opacity=".055"/><path d="M140 218v20q-4 9-32 11v5h85v-5q-30-2-34-11v-20" fill="url(#${id}-stand)"/><ellipse cx="150" cy="218" rx="112" ry="15" fill="#f9c88c"/><ellipse cx="150" cy="213" rx="112" ry="15" fill="#fdedd5"/><ellipse cx="150" cy="211" rx="98" ry="13" fill="#efa4642e"/><path d="M62 143v54c0 24 176 24 176 0v-54Z" fill="url(#${id}-body)"/><ellipse cx="150" cy="196" rx="88" ry="20" fill="#ed7794" opacity=".32"/><path d="M62 144v20c4 10 12 10 17 0v-3c0-9 10-9 10 0v11c0 11 13 11 13 0v-2c0-10 11-10 11 0v9c0 11 13 11 13 0v-7c0-10 12-10 12 0v12c0 12 15 12 15 0v-9c0-11 11-11 11 0v7c0 10 13 10 13 0v-15c0-9 11-9 11 0v7c0 9 12 9 12 0v-13c0-8 10-8 10 0v6c0 8 13 8 13-2v-9c0-8 8-8 9 0l6 1v-16Z" fill="url(#${id}-icing)"/><ellipse cx="150" cy="143" rx="88" ry="25" fill="#fff5df"/><ellipse cx="150" cy="142" rx="78" ry="19" fill="#ffe6c7"/><ellipse cx="150" cy="141" rx="71" ry="15" fill="#fff4e5"/>${[[82,148],[100,158],[121,164],[145,166],[170,164],[193,158],[214,151]].map(([x,y])=>`<path d="M${x-5} ${y}q-1-5 3-6 3-6 6 0 5 3 0 6Z" fill="#fff9e9" stroke="#fcd19c" stroke-width=".4"/>`).join('')}<path d="M84 194q64 21 131 1" fill="none" stroke="#ffdccd" stroke-width="1.5" opacity=".5"/><g fill="#dd5b83" opacity=".8">${[[83,181],[113,197],[143,193],[177,199],[205,185]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.7"/>`).join('')}</g>${age?numberCandles(id,age):[[116,91,137],[151,79,138],[185,91,137]].map(([x,top,bottom],i)=>`<g><rect x="${x-4}" y="${top}" width="8" height="${bottom-top}" rx="2" fill="${i===1?'#d7c083':'#fe8a9f'}"/><path d="M${x-4} ${top+9}l8-5m-8 17 8-5m-8 17 8-5m-8 17 8-5" stroke="#fff5df" stroke-width="2.6"/><ellipse cx="${x}" cy="${top}" rx="4" ry="1.6" fill="#fff4da"/><path d="M${x} ${top-1}v-5" stroke="#8a5733" stroke-width="1.2"/><g class="flame" style="transform-origin:${x}px ${top-6}px;animation-delay:${i*.4}s"><circle cx="${x}" cy="${top-14}" r="26" fill="url(#${id}-glow)"/><path d="M${x} ${top-28}c-1 7-9 11-6 18 2 6 11 5 12 0 2-6-5-11-6-18Z" fill="#ffb65a"/><path d="M${x} ${top-20}c-4 5-5 12 0 13 5-1 4-8 0-13Z" fill="#fff6cf"/></g><path class="cake-smoke" d="M${x} ${top-7}q-9-9 0-17t-2-18" stroke-width="1.2"/></g>`).join('')}</svg>`;
}
function giftSVG(id='gift'){
 return `<svg viewBox="0 0 260 255" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="${id}-box" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f39e96"/><stop offset="1" stop-color="#e37b8c"/></linearGradient><linearGradient id="${id}-ribbon" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#f7e3ba"/><stop offset=".5" stop-color="#fff0d1"/><stop offset="1" stop-color="#fcca98"/></linearGradient></defs><ellipse cx="130" cy="237" rx="96" ry="11" fill="#b95526" opacity=".06"/><g class="gift-rays" stroke="#e89237" stroke-width="1.3" stroke-linecap="round"><path d="m47 77-12-9m78-33-3-17m78 45 13-9m-2 55 18-2M71 44l-6-9m89 0 5-16"/><path d="m46 42 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#f5a342" stroke="none"/></g><g class="gift-heart"><path d="M131 91c-8-17-36-16-38 4-3 23 38 43 38 43s42-23 39-45c-3-18-29-19-39-2Z" fill="#d95284"/><path d="M106 88q-6 0-8 7" stroke="#faaac2" stroke-width="3" fill="none" stroke-linecap="round"/></g><path d="M49 124h164v94q0 13-13 13H61q-12 0-12-12Z" fill="url(#${id}-box)"/><path d="M49 126h164v9H49Z" fill="#d65e7f" opacity=".22"/><path d="M115 129h30v102h-30Z" fill="url(#${id}-ribbon)"/><g fill="#fff0e6" opacity=".37">${[[68,151],[91,176],[67,204],[175,151],[192,184],[173,215]].map(([x,y])=>`<path d="m${x} ${y-3} 1 2 3 1-3 1-1 3-1-3-3-1 3-1Z"/>`).join('')}</g><g class="gift-lid"><rect x="40" y="106" width="181" height="29" rx="5" fill="#f2a09c"/><path d="M42 110h177" stroke="#ffcaba" stroke-width="2" opacity=".6"/><path d="M113 106h34v29h-34Z" fill="url(#${id}-ribbon)"/><path d="M131 107C67 103 67 59 87 58c22-1 43 49 44 49Z" fill="#fdd8ac" stroke="#f4af83" stroke-width="1.2"/><path d="M124 102C96 95 80 70 87 65c9-5 26 19 37 37Z" fill="#e39966" opacity=".32"/><path d="M131 107c66-5 65-49 45-50-22-1-44 50-45 50Z" fill="#ffe5c1" stroke="#f4af83" stroke-width="1.2"/><path d="M138 101c27-6 44-32 37-36-9-5-25 18-37 36Z" fill="#e39966" opacity=".25"/><path d="M128 106c-10 12-20 16-29 39l17-5 11 8 8-41" fill="#ffe5c0"/><path d="M136 105c12 13 18 24 25 33l5-15 13 3c-16-13-27-16-35-23" fill="#ffdbab"/><ellipse cx="132" cy="103" rx="11" ry="8" fill="#ffe3be" stroke="#f4af83" stroke-width=".6"/></g></svg>`;
}
function fairySVG(id='fairy',live=false){
 const pos=Array.from({length:17},(_,i)=>{const x=16+i*61;return {x,y:20+62*Math.sin(Math.PI*x/1020),len:13+(i%3)*7};});
 return `<svg viewBox="0 0 1060 155" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true"><defs><radialGradient id="${id}-g"><stop stop-color="#ffdf9d" stop-opacity=".6"/><stop offset=".45" stop-color="#ffe3a8" stop-opacity=".19"/><stop offset="1" stop-color="#ffe1a0" stop-opacity="0"/></radialGradient></defs><path d="M-15 17Q520 164 1080 13" fill="none" stroke="#c68b48" stroke-width="1.15" opacity=".62"/>${pos.map((p,i)=>`<g class="${live?'live-bulb':'bulb-glow'}" style="--delay:${.15+i*.105}s"><path d="M${p.x} ${p.y}v${p.len}" stroke="#c08549" stroke-width="1"/><circle cx="${p.x}" cy="${p.y+p.len+5}" r="22" fill="url(#${id}-g)"/><rect x="${p.x-2.5}" y="${p.y+p.len-2}" width="5" height="5" rx="1" fill="#ce924f"/><ellipse cx="${p.x}" cy="${p.y+p.len+5}" rx="4" ry="6" fill="#fff0bd"/><ellipse cx="${p.x-1}" cy="${p.y+p.len+4}" rx="1.3" ry="3" fill="#fffbea"/></g>`).join('')}</svg>`;
}
function balloonSVG(id='balloon'){
 return `<svg viewBox="0 0 150 380" width="100%" height="100%" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="${id}-b" cx="32%" cy="25%" r="75%"><stop stop-color="#fff0e2" stop-opacity=".5"/><stop offset="1" stop-color="#a34159" stop-opacity=".04"/></radialGradient></defs><path d="M72 169c39 71-33 101 5 199" fill="none" stroke="#c19163" stroke-width=".85"/><path d="m72 163-5 9h11Z" class="balloon-fill" fill="#ef94b4"/><ellipse cx="73" cy="92" rx="57" ry="73" class="balloon-fill" fill="#ef94b4"/><ellipse cx="73" cy="92" rx="57" ry="73" fill="url(#${id}-b)"/><path d="M43 48q-13 14-13 31" fill="none" stroke="#fff9ef" stroke-width="6" opacity=".42" stroke-linecap="round"/><path d="m84 182-21-8 6 15 7-11 4 15Z" fill="#facb9d" opacity=".8"/></svg>`;
}
function portraitSVG(id){
 return `<svg viewBox="0 0 440 530" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="${id}-wall" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fad8c5"/><stop offset=".55" stop-color="#fdd5cd"/><stop offset="1" stop-color="#f9c7af"/></linearGradient><radialGradient id="${id}-glow"><stop stop-color="#fff4d2" stop-opacity=".85"/><stop offset="1" stop-color="#ffe1b7" stop-opacity="0"/></radialGradient><linearGradient id="${id}-pink" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f8c6cc"/><stop offset="1" stop-color="#e982a7"/></linearGradient><linearGradient id="${id}-gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffebbd"/><stop offset="1" stop-color="#f6bd76"/></linearGradient><linearGradient id="${id}-sage" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eee8cd"/><stop offset="1" stop-color="#c5cea1"/></linearGradient></defs><rect width="440" height="530" fill="url(#${id}-wall)"/><ellipse cx="218" cy="132" rx="250" ry="244" fill="url(#${id}-glow)"/><path d="M26 530V221C26-13 414-13 414 221v309" fill="none" stroke="#edac89" stroke-width="1" opacity=".4"/><path d="M36 530V224C36 0 404 0 404 224v306" fill="none" stroke="#fff0de" stroke-width="1" opacity=".48"/><path d="M0 421h440v109H0Z" fill="#f6b283" opacity=".18"/><path d="M0 422h440M0 426h440" stroke="#d9a274" stroke-width=".7" opacity=".3"/>${[45,95,145,195,245,295,345,395].map(x=>`<path d="M${x} 428v102" stroke="#d9a274" stroke-width=".6" opacity=".16"/>`).join('')}<path d="M-8 79Q220 201 450 76" fill="none" stroke="#c88b47" stroke-width=".85"/>${Array.from({length:13},(_,i)=>{let x=-3+i*37;let y=80+62*Math.sin(Math.PI*(x+3)/450);return `<g class="bulb-glow"><path d="M${x} ${y}v${11+(i%3)*4}" stroke="#c68748" stroke-width=".7"/><circle cx="${x}" cy="${y+19}" r="18" fill="url(#${id}-glow)"/><ellipse cx="${x}" cy="${y+19}" rx="3.2" ry="4.5" fill="#fff7da"/><rect x="${x-2}" y="${y+12}" width="4" height="4" rx="1" fill="#ce964f"/></g>`}).join('')}<path d="M-9 168Q78 198 126 177M314 177q58 23 137-11" stroke="#dfa171" stroke-width=".9" fill="none"/><g fill="#e78a8a" opacity=".65"><path d="m5 172 23 6-17 25Zm36 9 23 3-13 22Zm36 3 21-1-7 23Z"/><path d="m335 183 22 0-10 24Zm37-2 23-4-7 25Zm36-7 24-6-3 27Z"/></g><g class="svg-balloon"><path d="M58 321q-26 58 9 109" fill="none" stroke="#c29161" stroke-width=".8"/><ellipse cx="56" cy="271" rx="31" ry="45" fill="url(#${id}-pink)"/><path d="m56 315-4 7h8Z" fill="#e17fa5"/><path d="M40 244q-8 9-8 19" stroke="#fff7ee" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/></g><g class="svg-balloon"><path d="M88 341q12 25-8 70" fill="none" stroke="#ca9d60" stroke-width=".7"/><ellipse cx="87" cy="305" rx="25" ry="37" fill="url(#${id}-gold)"/><path d="m87 340-4 6h8Z" fill="#f0b771"/><path d="M73 282q-5 6-6 16" stroke="#fffdf0" stroke-width="2.8" fill="none" opacity=".55" stroke-linecap="round"/></g><g class="svg-balloon"><path d="M382 307q22 60-11 124" fill="none" stroke="#c29161" stroke-width=".8"/><ellipse cx="380" cy="261" rx="32" ry="47" fill="url(#${id}-gold)"/><path d="m380 306-4 7h8Z" fill="#f3b568"/><path d="M361 232q-9 10-8 23" stroke="#fffdf0" stroke-width="3.5" fill="none" opacity=".7" stroke-linecap="round"/></g><g class="svg-balloon"><path d="M345 349q-20 30-2 72" fill="none" stroke="#bf9362" stroke-width=".7"/><ellipse cx="345" cy="314" rx="25" ry="36" fill="url(#${id}-sage)"/><path d="m345 348-4 7h8Z" fill="#bec998"/><path d="M331 291q-6 6-6 15" stroke="#fffdf0" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/></g><ellipse cx="220" cy="492" rx="165" ry="19" fill="#d97c4a" opacity=".075"/><g transform="translate(54 433) rotate(-5)"><rect x="0" y="15" width="55" height="45" rx="3" fill="#cdcfa5"/><rect x="-3" y="11" width="61" height="13" rx="2" fill="#e0dcb1"/><path d="M22 12h9v48h-9Z" fill="#ffe8c9"/><path d="M27 13C7 12 10-8 16-7c8 0 11 20 11 20Zm0 0c23-1 20-20 13-20-8 0-13 20-13 20Z" fill="none" stroke="#fce1b4" stroke-width="4"/></g><g transform="translate(316 419) rotate(6)"><rect x="0" y="18" width="61" height="61" rx="3" fill="#e8889d"/><rect x="-4" y="13" width="69" height="16" rx="3" fill="#f2a2b0"/><path d="M26 14h10v65H26Z" fill="#ffe5b9"/><path d="M31 14C5 13 12-8 19-7c9 1 12 21 12 21Zm0 0C55 13 53-9 46-8c-8 1-15 22-15 22Z" fill="none" stroke="#f9daaf" stroke-width="4"/></g><g stroke="#e38c3e" stroke-width="1" fill="none" opacity=".7"><path d="m126 251 2-7 2 7 7 2-7 2-2 7-2-7-7-2Zm180 65 2-6 2 6 6 2-6 2-2 6-2-6-6-2ZM280 203v9m-4-5h8"/></g><g fill="#ce6941" opacity=".3"><circle cx="117" cy="334" r="1.1"/><circle cx="290" cy="236" r="1.1"/><circle cx="158" cy="207" r="1"/><circle cx="286" cy="342" r="1"/><circle cx="110" cy="396" r="1.1"/></g><path d="M121 462q14-5 11-16t10-10m125 45q13-4 9-13t9-11" fill="none" stroke="#f2966c" stroke-width="1.4" opacity=".6"/><path d="m289 497 9 3m-157-2 7-3m237-25 5-5m-254-29-5-4" stroke="#db8c55" stroke-width="1.3" opacity=".5"/></svg>`;
}

function renderMemoryListV1(){
 $('#memoryList').innerHTML=draft.memories.map((m,i)=>`<div class="memory-edit"><label class="field-label" for="memoryWhen${i}">Little memory ${i+1}</label><button type="button" class="remove-btn" data-remove-memory="${i}" aria-label="Remove memory ${i+1}">${icon('x')}</button><input class="text-input" id="memoryWhen${i}" data-memory-when="${i}" maxlength="40" placeholder="When was it? (optional)" value="${e(m.when)}" aria-label="When memory ${i+1} happened"><textarea class="text-area" id="memoryText${i}" data-memory-text="${i}" maxlength="200" aria-label="Memory ${i+1}" placeholder="That time we got completely lost and somehow found the best little café…">${e(m.text)}</textarea></div>`).join('');updatePreview();
}
function readDataURL(file){return new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=()=>reject(new Error('This file could not be read.'));fr.readAsDataURL(file);});}
/* Shrinks a photo to 960 px on its long side. The browser decodes it straight at that size (createImageBitmap) and encodes it once,
   asynchronously, so a 12 MP phone photo takes a moment instead of freezing the page. */
const blobToDataURL=blob=>new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=()=>reject(new Error('This file could not be read.'));fr.readAsDataURL(blob);});
const canvasJpeg=(canvas,quality)=>new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));
async function fastPhoto(file){
 if(typeof createImageBitmap!=='function'||!HTMLCanvasElement.prototype.toBlob)return null;
 let bitmap;try{bitmap=await createImageBitmap(file,{resizeWidth:960,resizeQuality:'high'});}catch{return null;}
 try{
  const scale=Math.min(1,960/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff8ef';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  // the same budget as before (a data URL under ~145 KB), reached in one to three encodes
  for(const q of [.72,.55,.4,.28]){const blob=await canvasJpeg(canvas,q);if(blob&&blob.size<=105000)return blobToDataURL(blob);}
  const last=await canvasJpeg(canvas,.24);if(last&&last.size<=290000)return blobToDataURL(last);
  throw new Error('That photo is too detailed for a compact link. Try an image URL instead.');
 }finally{bitmap.close?.();}
}
async function compressPhoto(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose a JPG, PNG or WebP photo.');
 if(file.size>15*1024*1024)throw new Error('That photo is a little big. Please choose one under 15 MB.');
 const fast=await fastPhoto(file);if(fast)return fast;
 const url=URL.createObjectURL(file);
 try{
 const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('That photo could not be opened. Try a JPG or PNG.'));img.src=url;});
 const scale=Math.min(1,960/Math.max(image.naturalWidth,image.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff8ef';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
 let quality=.66,data=canvas.toDataURL('image/jpeg',quality);while(data.length>145000&&quality>.24){quality-=.1;data=canvas.toDataURL('image/jpeg',quality);}if(data.length>400000)throw new Error('That photo is too detailed for a compact link. Try an image URL instead.');return data;
 }finally{URL.revokeObjectURL(url);}
}
async function uploadPhotos(files){
 if(photoBusy)return;if(draft.photos.length>=4){toast('Four little photos is the perfect little album. Remove one to add another.');return;}
 photoBusy=true;const list=[...files].slice(0,4-draft.photos.length);let added=0;
 try{for(const file of list){try{const src=await compressPhoto(file);draft.photos.push({src,caption:''});added++;renderPhotoList();preupload(src,'image');}catch(err){toast(err.message);}}}finally{photoBusy=false;$('#photoUpload').value='';saveDraft();if(added)toast(`${added===1?'A lovely photo':'Your lovely photos'}, tucked inside. You can frame and reorder them below.`);}
}
async function uploadAudio(file,kind){
 if(!file)return;if(!file.type.startsWith('audio/')){toast('Choose an audio file, like MP3, M4A or OGG.');return;}if(file.size>3*1024*1024){toast('That audio is a little big. Use a file under 3 MB, or add a public audio link.');return;}
 try{const src=await readDataURL(file);if(!safeMedia(src,'audio'))throw new Error('This audio format cannot be embedded. Try an MP3 or OGG file.');if(kind==='voice'){draft.voice=src;draft.voiceName=file.name;$('#voiceUrl').value='';}else{draft.music='custom';draft.musicSrc=src;draft.musicName=file.name;$('#musicUrl').value='';}renderAudioChip(kind);updatePreview();saveDraft();toast('A little soundtrack for their heart. Added.');}catch(err){toast(err.message);}finally{$('#'+kind+'Upload').value='';}
}
async function toggleRecording(){
 if(mediaRecorder){stopRecording(true);return;}
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){toast('This browser cannot record here. Upload a voice note instead, or open the hosted page over HTTPS.');return;}
 const generation=++recordingGeneration;$('#recordVoice').disabled=true;$('#recordStatus').textContent='Allow your microphone to record';
 let stream;
 try{
 stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
 if(generation!==recordingGeneration||currentView!=='creator'){stream.getTracks().forEach(t=>t.stop());return;}
 const mime=['audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/mp4'].find(t=>MediaRecorder.isTypeSupported(t));
 mediaRecorder=new MediaRecorder(stream,{...(mime?{mimeType:mime}:{}),audioBitsPerSecond:32000});recordedChunks=[];recordingSeconds=0;
 mediaRecorder.ondataavailable=event=>{if(event.data.size)recordedChunks.push(event.data);};
 mediaRecorder.onstop=async()=>{
 stream.getTracks().forEach(t=>t.stop());const chunks=recordedChunks.slice(),type=mediaRecorder?.mimeType||chunks[0]?.type||'audio/webm';const keep=$('#recordVoice').dataset.keep==='yes';mediaRecorder=null;
 clearInterval(recordInterval);$('#recordVoice').classList.remove('is-recording');$('#recordVoice').innerHTML=icon('mic')+' Record a note';$('#recordStatus').textContent='Up to 60 seconds';
 if(keep && chunks.length){try{const blob=new Blob(chunks,{type});if(blob.size>3*1024*1024)throw new Error('That recording grew too large. Try a shorter little note.');const src=await readDataURL(blob);if(!safeMedia(src,'audio'))throw new Error('This recording format could not be saved. Try uploading an MP3.');draft.voice=src;draft.voiceName='Your personal voice note';$('#voiceUrl').value='';renderAudioChip('voice');saveDraft();toast('Your voice note is tucked safely into the draft.');}catch(err){toast(err.message);}}
 };
 mediaRecorder.start(250);$('#recordVoice').innerHTML=icon('check')+' Finish recording';$('#recordVoice').classList.add('is-recording');$('#recordStatus').textContent='Recording · 0 / 60 sec';
 recordInterval=setInterval(()=>{recordingSeconds++;$('#recordStatus').textContent=`Recording · ${recordingSeconds} / 60 sec`;if(recordingSeconds>=60)stopRecording(true);},1000);
 }catch(err){stream?.getTracks().forEach(t=>t.stop());$('#recordStatus').textContent='Recording unavailable';toast('No microphone? No worries. Upload a voice note or leave this little part out.');}finally{$('#recordVoice').disabled=false;}
}
function stopRecording(keep){recordingGeneration++;clearInterval(recordInterval);if(mediaRecorder?.state==='recording'){$('#recordVoice').dataset.keep=keep?'yes':'no';mediaRecorder.stop();}}

/* Shareable URLs carry the actual gift, not a browser-only lookup key.
   The #fragment is not sent to a web server. Media is inline or a public URL.
   Deflate when supported; plain UTF-8 base64url is the compatibility fallback. */
function toBase64URL(bytes){let str='';for(let i=0;i<bytes.length;i+=16384)str+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(str).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function fromBase64URL(s){if(!/^[A-Za-z0-9_-]+$/.test(s))throw new Error('The gift link contains an unexpected character.');const str=atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4));return Uint8Array.from(str,c=>c.charCodeAt(0));}
async function encodeGift(g){
 const bytes=new TextEncoder().encode(JSON.stringify(g));let code='j',out=bytes;
 if(window.CompressionStream&&window.DecompressionStream){try{const stream=new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'));const compressed=new Uint8Array(await new Response(stream).arrayBuffer());if(compressed.length<bytes.length){code='z';out=compressed;}}catch{}}
 const encoded=code+'.'+toBase64URL(out);if(encoded.length>MAX_PAYLOAD)throw new Error('This gift is too big for a link. Remove an audio upload or use public media links.');return encoded;
}
async function decodeGift(str){
 if(!str||str.length>MAX_PAYLOAD)throw new Error('This gift link is incomplete or too large. Ask for the gift HTML file instead.');
 const [mode,body,...extra]=str.split('.');if(extra.length||!['j','z'].includes(mode)||!body)throw new Error('This little gift link is incomplete. Please ask for the whole link.');
 let bytes=fromBase64URL(body);
 if(mode==='z'){
 if(!window.DecompressionStream)throw new Error('This browser cannot unwrap this compressed gift. Open it in a recent browser, or ask for the downloadable gift HTML.');
 const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();const chunks=[];let len=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;len+=value.length;if(len>10_000_000){await reader.cancel();throw new Error('This gift contains too much data to open safely.');}chunks.push(value);}}finally{reader.releaseLock();}
 bytes=new Uint8Array(len);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 }
 if(bytes.length>10_000_000)throw new Error('This gift is too large to open.');return sanitizeGift(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));
}
function publicHosting(){return ['http:','https:'].includes(location.protocol)&&!['localhost','127.0.0.1','0.0.0.0','[::1]'].includes(location.hostname)&&!location.hostname.endsWith('.local');}
function showShareV1(){
 showView('share');$('#shareLead').textContent=`A little birthday world for ${publishedGift.name}, wrapped up and ready for its favorite person.`;
 $('#giftLink').value=publishedURL;$('#giftId').textContent='♡ '+publishedGift.id.slice(0,8);$('#linkSize').textContent=publishedURL.length<1000?`${publishedURL.length} characters of little magic`:`${Math.round(publishedURL.length/1000)}k characters · media included`;
 const local=!publicHosting(),long=publishedURL.length>8000;
 $('#hostingWarning').hidden=!local;
 $('#hostingWarning').innerHTML='<strong>A little home for your gift.</strong> This page is open locally, so its URL will not work on someone else’s device. Put this HTML file on a public HTTPS static host, open that page, and create your link there. Or use <strong>Download gift HTML</strong> and send the file itself.';
 $('#sizeWarning').hidden=!long;
 $('#sizeWarning').innerHTML='<strong>This gift is lovely, but the link is long.</strong> Embedded photos or audio can be too large for messaging apps. For reliable delivery, download the gift HTML and send the file, or edit the gift to use public media links instead. WhatsApp link sharing is disabled for oversized links.';
 $('#whatsappGift').disabled=local||long;$('#whatsappGift').title=local?'Host this page publicly before sharing a web link':long?'Use the downloadable gift file or shorter public media links':'';
 $('#shareArt').innerHTML=giftSVG('share-present');
}
async function copyText(text,success='Copied, with a little love. ♡'){
 try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);}else{throw new Error('Use fallback');}toast(success);return true;}catch{
 const area=document.createElement('textarea');area.value=text;area.style.cssText='position:fixed;left:-9999px;top:0;';document.body.append(area);area.select();let ok=false;try{ok=document.execCommand('copy');}catch{}area.remove();if(ok)toast(success);else toast('Copy is unavailable here. Select the link above and copy it manually.');return ok;
 }
}
async function openWhatsApp(text,phone=''){const cleanPhone=phone?phone.replace(/[^0-9]/g,''):'';const encoded=encodeURIComponent(text);const isMobile=/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);await copyText(text,'Message copied! Opening WhatsApp to send…');if(cleanPhone){const url=isMobile?'whatsapp://send?phone='+cleanPhone+'&text='+encoded:'https://api.whatsapp.com/send?phone='+cleanPhone+'&text='+encoded;window.open(url,'_blank','noopener,noreferrer');}else if(isMobile){window.location.href='whatsapp://send?text='+encoded;setTimeout(()=>{window.open('https://api.whatsapp.com/send?text='+encoded,'_blank','noopener,noreferrer');},1200);}else{window.open('https://api.whatsapp.com/send?text='+encoded,'_blank','noopener,noreferrer');}}
function downloadBlob(blob,filename){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);}

/* A gentle, original little melody, made with the browser's audio engine. */
function ensureAudio(){
 try{if(!audioContext){const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;audioContext=new C();masterGain=audioContext.createGain();masterGain.gain.value=soundMuted?0:.28;masterGain.connect(audioContext.destination);}if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});return true;}catch{return false;}
}
function tone(frequency,when=0,duration=.8,volume=.15,type='sine',isMelody=false){
 if(soundMuted||!ensureAudio())return;try{const osc=audioContext.createOscillator(),gain=audioContext.createGain(),start=audioContext.currentTime+when;osc.type=type;osc.frequency.value=frequency;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.015);gain.gain.exponentialRampToValueAtTime(.001,start+duration);osc.connect(gain);gain.connect(masterGain);osc.start(start);osc.stop(start+duration+.03);const voice={osc,gain};activeAudioNodes.add(voice);if(isMelody)melodyVoices.push(voice);osc.onended=()=>{osc.disconnect();gain.disconnect();activeAudioNodes.delete(voice);melodyVoices=melodyVoices.filter(v=>v!==voice);};}catch{}
}
function chime(kind='soft'){
 if(soundMuted)return;if(kind==='wish'){[523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,i*.12,1.6,.13));}else if(kind==='pop'){tone(350,0,.11,.15);tone(720,.04,.17,.07);}else{tone(659.25,0,.85,.12);tone(987.77,.13,1.2,.08);}
}
/* ---- A richer sound and touch kit. Everything is synthesised, short and soft, and silent when muted. ---- */
function noise(duration=.4,freq=1800,volume=.05,type='bandpass'){
 if(soundMuted||!ensureAudio())return;
 try{const n=Math.floor(audioContext.sampleRate*duration),buf=audioContext.createBuffer(1,n,audioContext.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);const src=audioContext.createBufferSource(),f=audioContext.createBiquadFilter(),g=audioContext.createGain();src.buffer=buf;f.type=type;f.frequency.value=freq;g.gain.value=volume;src.connect(f);f.connect(g);g.connect(masterGain);src.start();}catch{}
}
function sfx(kind,i=0){
 if(soundMuted)return;
 const up=[523.25,587.33,659.25,783.99,880,1046.5,1174.66];
 switch(kind){
  case'spark':[1318.5,1760,2349.3].forEach((f,k)=>tone(f,k*.07,.45,.07));break;
  case'glow':noise(.9,900,.035,'lowpass');[261.63,329.63,392,523.25].forEach((f,k)=>tone(f,k*.05,2.2,.06));break;
  case'whoosh':noise(.55,1400,.06);break;
  case'pop':tone(350,0,.11,.15);tone(720,.04,.17,.07);break;
  case'note':tone(up[i%up.length],0,1.1,.11);tone(up[i%up.length]*2,.02,.7,.04);break;
  case'bloom':up.slice(0,5).forEach((f,k)=>tone(f,k*.08,1,.08));break;
  case'page':noise(.22,3200,.05,'highpass');break;
  case'heartbeat':tone(70,0,.16,.22);tone(60,.2,.2,.18);tone(70,.9,.16,.2);tone(60,1.1,.2,.16);break;
  case'fanfare':[523.25,659.25,783.99,1046.5].forEach((f,k)=>tone(f,k*.06,1.7,.1));tone(130.81,0,1.6,.12);noise(.5,2600,.04);break;
  case'wish':chime('wish');break;
  default:chime('soft');
 }
}
const buzz=pattern=>{if(reducedMotion)return;try{navigator.vibrate?.(pattern);}catch{}};
const originOf=el=>{const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};};
/* A ring of light that spreads from the thing that was just touched. */
function ring(el){const exp=$('#experience');if(!exp||!el||reducedMotion||gift?.motion===false)return;const o=originOf(el),h=document.createElement('i');h.className='burst-ring';h.style.left=o.x+'px';h.style.top=o.y+'px';exp.append(h);setTimeout(()=>h.remove(),1300);}
function balloons(n=7){
 const exp=$('#experience');if(!exp||reducedMotion||gift?.motion===false)return;const colors=['#e66889','#fbc383','#b9c695','#ffd1a4','#d5547c','#f5a1b5'];
 for(let i=0;i<n;i++){const b=document.createElement('i');b.className='rise-balloon';b.style.cssText=`--x:${6+Math.random()*88}%;--c:${colors[i%colors.length]};--d:${(Math.random()*.9).toFixed(2)}s;--s:${(.8+Math.random()*.6).toFixed(2)}`;exp.append(b);setTimeout(()=>b.remove(),6800);}
}
/* After a payoff moment the gift carries on by itself. Never under reduced motion;
   a small "continue" stays for anyone who wants to go sooner. */
let autoTimer=0;
const clearAuto=()=>{clearTimeout(autoTimer);autoTimer=0;};
function autoAdvance(ms,scene){
 clearAuto();if(reducedMotion)return;const token=experienceToken;
 autoTimer=setTimeout(()=>{if(token!==experienceToken||scenes[sceneIndex]!==scene||transitionBusy)return;chime('soft');goToScene(sceneIndex+1);},ms);
}
const softNext=text=>`<button class="story-soft-skip is-ready" data-story="next">${e(text)} ${icon('arrow')}</button>`;
/* ---- Wedding music made in the browser, original and royalty-free: a shehnai over a tanpura drone, a baraat brass
   band with dhol, and an evening sitar. Notes are scheduled a moment ahead on the audio clock so they stay in time. ---- */
let ragaBus=null;
const RAGA={
 shehnai:{sa:293.66,beat:.42,drone:true,drum:'soft',voice:'reed',tune:[[-1,1],[2,1],[4,2],[2,.5],[4,.5],[6,1],[7,2],[6,.5],[4,.5],[2,1],[0,2],[null,1],[4,1],[6,1],[7,1],[9,1],[11,1],[12,2],[11,.5],[9,.5],[7,1],[6,.5],[4,.5],[2,1],[4,2],[null,1],[7,1],[9,.5],[7,.5],[6,1],[4,1],[2,1],[-1,1],[0,3],[null,1]]},
 baraat:{sa:349.23,beat:.27,drone:false,drum:'dhol',voice:'brass',tune:[[0,1],[2,1],[4,1],[7,1],[9,2],[7,1],[4,1],[7,2],[4,1],[2,1],[0,2],[null,2],[4,1],[7,1],[9,1],[12,1],[14,2],[12,1],[9,1],[12,2],[9,1],[7,1],[4,2],[null,2],[9,1],[9,1],[7,1],[4,1],[7,1],[7,1],[4,1],[2,1],[4,1],[2,1],[0,1],[-3,1],[0,4]]},
 sitar:{sa:220,beat:.5,drone:true,drum:'tabla',voice:'pluck',tune:[[0,1],[2,.5],[3,.5],[5,1],[7,2],[9,.5],[7,.5],[5,1],[3,1],[2,1],[0,2],[null,1],[7,1],[10,1],[12,2],[10,.5],[9,.5],[7,1],[5,.5],[3,.5],[2,2],[null,1],[3,1],[5,1],[7,1],[5,.5],[3,.5],[2,1],[0,3],[null,1]]},
};
function ragaNote(kind,f,t,len,vol){
 const ac=audioContext,g=ac.createGain(),o=ac.createOscillator(),end=t+len;
 if(kind==='pluck'){
  const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(4200,t);lp.frequency.exponentialRampToValueAtTime(700,t+.6);
  o.type='sawtooth';o.frequency.setValueAtTime(f*.985,t);o.frequency.exponentialRampToValueAtTime(f,t+.07);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol*1.4,t+.006);g.gain.exponentialRampToValueAtTime(.0008,t+Math.max(1.2,len*1.6));
  o.connect(lp);lp.connect(g);o.start(t);o.stop(t+Math.max(1.3,len*1.7));
 }else{
  const bp=ac.createBiquadFilter(),lfo=ac.createOscillator(),depth=ac.createGain(),o2=ac.createOscillator();
  bp.type='bandpass';bp.frequency.value=kind==='brass'?1500:1250;bp.Q.value=kind==='brass'?.7:1.1;
  o.type='sawtooth';o2.type='square';o2.detune.value=7;
  [o,o2].forEach(x=>{x.frequency.setValueAtTime(f*(kind==='reed'?.944:.99),t);x.frequency.exponentialRampToValueAtTime(f,t+(kind==='reed'?.09:.03));});
  lfo.frequency.value=kind==='reed'?5.4:6;depth.gain.setValueAtTime(0,t);depth.gain.linearRampToValueAtTime(f*(kind==='reed'?.012:.005),t+Math.min(.4,len*.6));
  lfo.connect(depth);depth.connect(o.frequency);depth.connect(o2.frequency);
  const mix=ac.createGain();mix.gain.value=.5;o2.connect(mix);mix.connect(bp);o.connect(bp);bp.connect(g);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+(kind==='brass'?.02:.06));g.gain.setValueAtTime(vol,Math.max(t+.07,end-.1));g.gain.linearRampToValueAtTime(0,end+.06);
  [o,o2,lfo].forEach(x=>{x.start(t);x.stop(end+.1);});
 }
 g.connect(ragaBus);
}
function ragaDrum(type,t,vol){
 const ac=audioContext,g=ac.createGain();g.connect(ragaBus);
 if(type==='thump'){const o=ac.createOscillator();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(52,t+.18);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+.32);o.connect(g);o.start(t);o.stop(t+.35);return;}
 const n=Math.floor(ac.sampleRate*.12),buf=ac.createBuffer(1,n,ac.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);
 const src=ac.createBufferSource(),f=ac.createBiquadFilter();src.buffer=buf;f.type='bandpass';f.frequency.value=type==='slap'?900:2600;f.Q.value=1.4;g.gain.value=vol;src.connect(f);f.connect(g);src.start(t);
}
function startRaga(kind){
 const r=RAGA[kind];if(!r||soundMuted||!ensureAudio())return;
 ragaBus=audioContext.createGain();ragaBus.gain.value=musicDucked?.25:1;ragaBus.connect(masterGain);
 const hz=st=>r.sa*Math.pow(2,st/12);let at=audioContext.currentTime+.08,step=0,beat=0;
 const drums={soft:[[0,'thump',.35],[3,'tap',.10],[4,'thump',.22],[6,'tap',.10]],dhol:[[0,'thump',.6],[1,'slap',.18],[2,'thump',.38],[3,'thump',.5],[4,'slap',.2],[5,'thump',.38],[6,'thump',.55],[7,'tap',.14]],tabla:[[0,'thump',.25],[2,'tap',.08],[3,'tap',.06],[4,'thump',.16],[6,'tap',.08]]}[r.drum];
 const vol=r.voice==='brass'?.075:r.voice==='pluck'?.09:.085;
 const tick=()=>{
  if(!ragaBus)return;const ahead=audioContext.currentTime+.35;
  while(at<ahead){
   const [st,len]=r.tune[step++%r.tune.length],dur=len*r.beat;
   if(st!==null)ragaNote(r.voice,hz(st),at,dur*.94,vol);
   for(let b=0;b<len*2;b++){const k=beat%8,at2=at+b*r.beat/2;
    if(r.drone&&beat%16===0)[[-12,.05],[-5,.035],[0,.03],[-12,.04]].forEach(([s2,v],i)=>ragaNote('pluck',hz(s2),at2+i*r.beat*2,r.beat*3,v));
    const hit=drums.find(h=>h[0]===k);if(hit)ragaDrum(hit[1],at2,hit[2]);beat++;}
   at+=dur;
  }
 };
 tick();melodyTimer=setInterval(tick,90);
}
const musicBase=()=>gift?.volume??(gift?.occasion==='wedding'?.6:.24);
function startMusicV1(){
 stopMusic();if(!gift||soundMuted||gift.music==='none')return;
 if(RAGAS.includes(gift.music)){startRaga(gift.music);return;}
 if(gift.music==='custom'&&gift.musicSrc){musicAudio=new Audio(gift.musicSrc);const from=Number(gift.musicStart)||0,a=musicAudio;
  if(from){a.preload='auto';a.addEventListener('loadedmetadata',()=>{if(a.duration>from+5)a.currentTime=from;},{once:true});a.addEventListener('ended',()=>{if(musicAudio!==a)return;a.currentTime=a.duration>from+5?from:0;a.play().catch(()=>{});});}else a.loop=true;musicAudio.volume=musicDucked?.07:.24;musicAudio.preload='none';musicAudio.addEventListener('error',()=>{if(currentView==='experience')toast("The soundtrack couldn't load. The little magic is still here.");},{once:true});musicAudio.play().catch(()=>{if(currentView==='experience')toast('Tap the sound button to try the soundtrack.');});return;}
 if(!ensureAudio())return;
 const melody=gift.music==='dreamy'?[523.25,0,783.99,659.25,0,587.33,440,0,523.25,659.25,0,783.99,698.46,0,587.33,0]:[659.25,783.99,1046.5,0,987.77,783.99,659.25,0,587.33,659.25,783.99,0,659.25,523.25,587.33,0];
 let note=0;const play=()=>{if(soundMuted||document.hidden)return;const frequency=melody[note++%melody.length];if(frequency){const vol=(gift.volume??.24)/.24*(musicDucked?.016:.065);tone(frequency*THEMES[gift.vibe].transpose,0,2.1,vol,'sine',true);tone(frequency*2*THEMES[gift.vibe].transpose,.012,1.05,vol*.13,'sine',true);if(note%4===1)tone(frequency/2*THEMES[gift.vibe].transpose,0,2.6,vol*.65,'sine',true);}};
 play();melodyTimer=setInterval(play,(gift.music==='dreamy'?1000:720)*THEMES[gift.vibe].speed);
}
function stopMusic(){clearInterval(melodyTimer);melodyTimer=null;if(ragaBus){const b=ragaBus;ragaBus=null;try{b.gain.setTargetAtTime(0,audioContext.currentTime,.05);setTimeout(()=>{try{b.disconnect();}catch{}},400);}catch{}}if(musicAudio){musicAudio.pause();musicAudio.removeAttribute('src');musicAudio.load();musicAudio=null;}for(const {osc} of melodyVoices){try{osc.stop();}catch{}}melodyVoices=[];}
function updateSoundControl(){const b=$('#soundToggle');if(!b)return;b.innerHTML=icon(soundMuted?'muted':'volume');b.setAttribute('aria-label',soundMuted?'Turn sound on':'Turn sound off');b.setAttribute('aria-pressed',String(!soundMuted));b.title=soundMuted?'A little sound?':'Keep it quiet';}
function toggleSound(){
 soundMuted=!soundMuted;ensureAudio();if(masterGain)masterGain.gain.setValueAtTime(soundMuted?0:.28,audioContext.currentTime);if(soundMuted)stopMusic();else{if($('#experience').classList.contains('lit'))startMusic();chime();}updateSoundControl();try{localStorage.setItem('luv4u.muted',String(soundMuted));}catch{}
}

/* Confetti: little paper pieces, no flashing or recurring animation. */
function confetti(count=100,origin=null){
 if(reducedMotion||(currentView==='experience'&&gift&&gift.motion===false))return;
 const canvas=$('#confettiCanvas'),ctx=canvas.getContext('2d');if(!ctx)return;cancelAnimationFrame(confettiFrame);canvas.hidden=false;
 const w=window.innerWidth,h=window.innerHeight,dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
 const colors=['#e66889','#fbc383','#b9c695','#ffd1a4','#d5547c','#f5a1b5'];
 const particles=Array.from({length:Math.min(count,130)},()=>({x:origin?origin.x:w/2+(Math.random()-.5)*w*.55,y:origin?origin.y:-20-Math.random()*h*.45,vx:origin?(Math.random()-.5)*8:(Math.random()-.5)*3,vy:origin?-3-Math.random()*5:1.6+Math.random()*2.6,size:3+Math.random()*5,rotation:Math.random()*Math.PI,spin:(Math.random()-.5)*.12,color:colors[Math.floor(Math.random()*colors.length)],heart:Math.random()>.88,life:1}));
 const started=performance.now();let last=started;
 function frame(now){const dt=Math.min((now-last)/16.67,2);last=now;ctx.clearRect(0,0,w,h);let alive=0;for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.035*dt;p.rotation+=p.spin*dt;p.vx*=.998;p.life=Math.max(0,1-(now-started-2200)/1900);if(p.y<h+20&&p.life>0){alive++;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rotation);ctx.fillStyle=p.color;ctx.globalAlpha=p.life*.9;if(p.heart){ctx.beginPath();ctx.moveTo(0,p.size*.55);ctx.bezierCurveTo(-p.size*1.5,-p.size*.4,-p.size*.5,-p.size*1.2,0,-p.size*.45);ctx.bezierCurveTo(p.size*.5,-p.size*1.2,p.size*1.5,-p.size*.4,0,p.size*.55);ctx.fill();}else{ctx.fillRect(-p.size/2,-p.size/3,p.size,p.size*.58);}ctx.restore();}}if(alive&&now-started<4600)confettiFrame=requestAnimationFrame(frame);else{canvas.hidden=true;ctx.clearRect(0,0,w,h);confettiFrame=null;}}
 confettiFrame=requestAnimationFrame(frame);
}

let isPreview=false, previewScrollY=0, micGeneration=0, blowSource=null;
function storyButton(text='A little more magic',action='next'){return `<button class="btn story-btn" data-story="${action}">${e(text)} ${icon('arrow')}</button>`;}
function sceneTitle(title,eyebrow=''){return `${eyebrow?`<div class="story-eyebrow">${eyebrow}</div>`:''}<h1 class="story-title" tabindex="-1">${title}</h1>`;}
function startExperienceV1(data,options={}){
 cleanupExperience();gift=sanitizeGift(data);if(!gift.id)gift.id='preview';isPreview=!!options.preview;previewReturn=options.returnView||'creator';experienceToken++;transitionBusy=false;sceneIndex=0;reaction='';replySharedText='';journeyReply='';proposalAnswer='';forgiven=false;noDodges=0;openedNotes=new Set();chapterIndex=0;musicDucked=false;
 try{soundMuted=localStorage.getItem('luv4u.muted')==='true';}catch{soundMuted=false;}
 if(masterGain)masterGain.gain.setValueAtTime(soundMuted?0:.28,audioContext.currentTime);
 scenes=buildScenes(gift);
 for(const id of ['homeView','creatorView','shareView','errorView'])$('#'+id).hidden=true;
 $('#siteHeader').hidden=true;const exp=$('#experience');exp.hidden=false;exp.className='experience'+(isPreview?' preview-mode':'');exp.dataset.vibe=gift.vibe;exp.dataset.occasion=gift.occasion;exp.setAttribute('aria-label','Your '+occasionOf(gift).label.toLowerCase()+' surprise');
 exp.innerHTML=`<div class="room-warmth"></div><div class="room-decor" aria-hidden="true"><div class="room-wall"></div><div class="room-arch"></div><div class="room-side-balloon left">${balloonSVG('story-left')}</div><div class="room-side-balloon right">${balloonSVG('story-right')}</div><div class="room-floor-stars">${[[14,23,17],[83,19,13],[10,71,15],[90,73,20],[22,87,12],[78,88,12]].map(([x,y,s],i)=>`<span class="room-star" style="left:${x}%;top:${y}%;font-size:${s}px;animation-delay:${i*.6}s">✧</span>`).join('')}${Array.from({length:12},(_,i)=>`<span class="floating-dust" style="left:${9+i*7.2}%;top:${30+(i%5)*13}%;animation-delay:${-i*.8}s"></span>`).join('')}</div></div><div class="room-lights">${fairySVG('story-fairy',true)}</div><div class="room-vignette"></div><span class="experience-brand" aria-label="Kholona"><img class="logo-mark" src="/icon.svg" alt="" width="20" height="20">kholona<span style="font-size:10px;vertical-align:top;position:relative;top:4px;left:3px">♡</span></span>${isPreview?'<div class="preview-banner"><span>A PEEK AT THEIR SURPRISE</span><button data-story="exit-preview">Back to editing</button></div>':''}<div class="experience-topright"><button class="round-control" id="soundToggle" data-story="sound" aria-label="Turn sound off"></button></div><div class="story-scroll" id="storyScroll"><div class="story-scene" id="storyScene"></div></div><div class="story-bottom" id="storyProgress" aria-hidden="true"></div><p class="sr-only" id="storyAnnouncement" aria-live="polite"></p>`;
 document.body.classList.add('experiencing');currentView='experience';document.title=`${occasionOf(gift).label} for ${gift.name} ♡`; $('meta[name="theme-color"]').content='#150f13';updateSoundControl();renderScene();
}
function cleanupExperienceV1(){
 experienceToken++;transitionBusy=false;stopBlowing();if(scratchCleanup){scratchCleanup();scratchCleanup=null;}stopMusic();musicDucked=false;
 const voice=$('#recipientVoice');if(voice)voice.pause();
 for(const node of activeAudioNodes){try{node.osc.stop();}catch{}}activeAudioNodes.clear();
 cancelAnimationFrame(confettiFrame);$('#confettiCanvas').hidden=true;document.body.classList.remove('experiencing');
}
function previewGiftV1(){if(!validateForm())return;previewScrollY=window.scrollY;startExperience(collectGift(),{preview:true,returnView:'creator'});}
function exitPreview(){const ret=previewReturn,scroll=previewScrollY;if(ret==='share')showShare();else if(ret==='home'){showView('home');requestAnimationFrame(()=>{window.scrollTo(0,scroll);$('[data-v3=home-demo]')?.focus({preventScroll:true});});}else{showView('creator');requestAnimationFrame(()=>window.scrollTo(0,scroll));}}
async function goToScene(index){
 if(transitionBusy||index<0||index>=scenes.length)return;transitionBusy=true;clearAuto();clearInterval(storyAuto);const token=experienceToken;stopBlowing();if(scratchCleanup){scratchCleanup();scratchCleanup=null;}const voice=$('#recipientVoice');if(voice)voice.pause();duckMusic(false);const scene=$('#storyScene');scene.classList.add('leaving');await sleep(360);if(token!==experienceToken)return;sceneIndex=index;renderScene();transitionBusy=false;
}
function renderSceneV1(){
 const type=scenes[sceneIndex],s=$('#storyScene'),name=e(gift.name);s.className='story-scene '+type+'-scene';popCount=0;scratchDone=false;
 const markup={
 opening:()=>`<span class="opening-star a" aria-hidden="true">✧</span><span class="opening-star b" aria-hidden="true">✦</span><span class="opening-star c" aria-hidden="true">✧</span>${sceneTitle('Some things are better<br>with the <em>lights on.</em>','A little surprise is waiting')}<p class="story-description">Someone put a little love into this moment.<br>And it's all for you.</p><button class="light-trigger" data-story="light" id="lightTrigger"><span class="switch-orb">${icon('bulb')}</span><span>Click to light up ✨</span></button><div class="opening-bottom">Go on. This little world is yours.</div>`,
 birthday:()=>`<svg class="birthday-garland" viewBox="0 0 180 50" fill="none" aria-hidden="true"><path d="M6 14q85 50 169 0" stroke="#d88c51" stroke-width=".9"/><path d="m20 20 18 8-15 15 0-12Zm34 13 18 4-9 16-4-13Zm35 5 18-1-8 17-5-12Zm35-5 17-5 0 21-7-11Zm32-10 14-7 4 19-11-8Z" fill="#db7d9c" opacity=".66"/></svg>${sceneTitle(`Happy Birthday,<span class="name-line${gift.name.length>18?' long-name':''}"><em>${name}.</em></span>`,'Today is all about you')}<div class="birthday-heart" aria-hidden="true">♡</div><p class="story-description">Of all the days, this one's a little more special.<br>Because it gave the world you.</p>${storyButton('First, make a wish')}`,
 cake:()=>`${sceneTitle('First, make a <em>wish.</em>','A little birthday tradition')}<p class="story-description" id="cakeDescription">The big kind. The quiet kind. The impossible kind.<br>Close your eyes for a second. Then…</p><button class="cake-interactive" id="birthdayCake" data-story="blow" aria-label="Blow out the birthday candles">${cakeSVG('birthday-cake')}</button><div class="cake-instruction" id="cakeInstruction">${icon('hand')} Tap the candles to blow them out</div><button class="mic-btn" id="blowMic" data-story="microphone">${icon('mic')} Or blow into your microphone</button><div id="cakeAfter"></div>`,
 gift:()=>`${sceneTitle('A little something,<br><em>from the heart.</em>','Oh, and this is for you')}<button class="gift-interactive" id="birthdayGift" data-story="open-gift" aria-label="Open your birthday present">${giftSVG('birthday-present')}</button><p class="story-footnote" id="giftInstruction">Go on. It has your name on it.</p><div id="giftAfter"></div>`,
 message:()=>`<div class="story-eyebrow">Some words, just for you</div><article class="letter-paper"><h1 class="letter-to" tabindex="-1">Dear ${name},</h1><div class="letter-text">${e(gift.message||defaultNote(gift))}</div><p class="letter-sign">${gift.sender?'With love,<br>'+e(gift.sender):'A little love, just for you.'}</p><div class="letter-stamp" aria-hidden="true">♡</div></article>${storyButton(scenes[sceneIndex+1]==='celebration'?'One last birthday wish':'There’s a little more')}`,
 photos:()=>`${sceneTitle('The good<br><em>little moments.</em>','Some things are worth keeping')}<div class="photo-reel ${gift.photos.length===1?'single':''}" aria-label="Your photo memories" tabindex="0">${gift.photos.map((p,i)=>`<figure class="polaroid"><img src="${e(p.src)}" alt="${e(p.caption||'A favorite memory, photo '+(i+1))}" loading="lazy" referrerpolicy="no-referrer"><div class="photo-fallback" hidden>${icon('photo')}<span>This photo is taking the scenic route.<br>The memory is still a lovely one.</span></div><figcaption>${e(p.caption||['A little moment, a lot of happiness.','This one still makes me smile.','Worth keeping, forever.','The good stuff. ♡'][i])}</figcaption></figure>`).join('')}</div>${gift.photos.length>1?'<p class="scratch-help">Swipe through the little things. ↔</p>':''}${storyButton('Keep the good things coming')}`,
 memories:()=>`${sceneTitle('Remember<br><em>these little things?</em>','A few pieces of our story')}<div class="memory-timeline">${gift.memories.filter(m=>m.text.trim()).map((m,i)=>`<article class="memory-moment"><div class="memory-when">${e(m.when||'Little memory '+(i+1))}</div><p class="memory-words">${e(m.text)}</p></article>`).join('')}</div>${storyButton('Here’s to making more')}`,
 voice:()=>`${sceneTitle('A familiar voice.<br><em>A little closer.</em>','Press play. Feel the love.')}<p class="story-description">Some things are better heard than read.</p><div class="voice-wrap" id="voiceWrap"><div class="voice-illustration">${icon('mic')}</div><div class="voice-wave" aria-hidden="true">${Array.from({length:29},(_,i)=>`<span style="--h:${7+Math.sin(i*.65)**2*26}px;--d:${-i*.07}s"></span>`).join('')}</div><audio controls preload="metadata" id="recipientVoice" src="${e(gift.voice)}" aria-label="A personal voice message">Your browser cannot play this audio.</audio><p class="audio-error" id="voiceError" hidden>This little recording can't play in this browser. Try opening the gift in another browser. The love still counts. ♡</p></div>${storyButton('A little more birthday magic')}`,
 fun:()=>renderFun(),
 final:()=>`<div class="final-surprise-icon" aria-hidden="true">✧</div>${sceneTitle('One more thing.<br><em>Just between us.</em>','The surprise isn’t quite over')}${gift.finalMessage?`<p class="final-surprise-note">${e(gift.finalMessage)}</p>`:'<p class="story-description">Some surprises are too good to keep on this screen.<br>This little link is just for you.</p>'}${gift.finalUrl?`<a class="btn btn-secondary surprise-external" href="${e(gift.finalUrl)}" target="_blank" rel="noopener noreferrer">Open your surprise ${icon('up')}<span class="sr-only"> (opens in a new tab)</span></a>`:''}${storyButton('And one last birthday wish')}`,
 celebration:()=>`<div class="celebration-halo" aria-hidden="true">${icon('heart')}</div>${sceneTitle('Here’s to<br><em>wonderful you.</em>','The world is better with you in it')}<p class="story-description">More belly laughs. More happy little accidents.<br>More days that feel as lovely as this one.<br>Happy Birthday, ${name}. ♡</p><p class="final-dedication">Made especially for you. ❤️${gift.sender?'<br><span style="font-size:14px">With love, '+e(gift.sender)+'.</span>':''}</p>${storyButton('Send a little love back')}`,
 reply:()=>`${sceneTitle('How’s your<br><em>little heart?</em>','A little love, going both ways')}<p class="story-description">Sometimes an emoji says the whole thing.</p><div class="reactions" role="group" aria-label="Choose your birthday reaction">${[['🥹','Happy tears'],['😂','You made me laugh'],['❤️','So much love'],['🎉','Birthday celebration']].map(([emoji,label])=>`<button class="reaction-btn" data-reaction="${emoji}" aria-label="${label}" aria-pressed="false">${emoji}</button>`).join('')}</div><div class="reply-form"><label class="sr-only" for="recipientReply">Your reply to the person who made this gift</label><textarea class="text-area" id="recipientReply" maxlength="500" placeholder="A little thank-you, in your own words… (optional)"></textarea><button class="btn story-btn" data-story="prepare-reply">Wrap up my reply ${icon('heart')}</button><p class="reply-hint">Your reaction stays on this device. Share your reply<br>to send it to the person who made your gift.</p></div><div id="replyResult" aria-live="polite"></div><div class="recipient-bottom-links"><button data-story="replay">Experience the magic again</button><button data-story="make-your-own">Make someone else's day</button></div>`
 };
 s.innerHTML=markup[type]();$('#storyScroll').scrollTop=0;$('#storyProgress').innerHTML=scenes.slice(1).map((_,i)=>`<span class="story-dot ${i+1===sceneIndex?'active':i+1<sceneIndex?'past':''}"></span>`).join('');
 $('#storyAnnouncement').textContent=type==='opening'?'Your little birthday surprise is waiting.':`Birthday moment ${sceneIndex} of ${scenes.length-1}.`;
 if(type!=='opening')requestAnimationFrame(()=>{const title=$('h1',s);title?.focus({preventScroll:true});});
 if(type==='photos')$$('img',s).forEach(img=>img.addEventListener('error',()=>{img.hidden=true;$('.photo-fallback',img.parentElement).hidden=false;},{once:true}));
 if(type==='voice'){
 const audio=$('#recipientVoice');audio.addEventListener('play',()=>{$('#voiceWrap')?.classList.add('playing');duckMusic(true);});audio.addEventListener('pause',()=>{$('#voiceWrap')?.classList.remove('playing');duckMusic(false);});audio.addEventListener('ended',()=>{$('#voiceWrap')?.classList.remove('playing');duckMusic(false);});audio.addEventListener('error',()=>{$('#voiceError').hidden=false;});
 }
 if(type==='fun'&&gift.fun==='scratch')requestAnimationFrame(initScratch);
 if(type==='celebration'){const token=experienceToken;setTimeout(()=>{if(token===experienceToken&&scenes[sceneIndex]==='celebration'){confetti(120);chime('wish');}},reducedMotion?0:500);}
 if(type==='reply'){try{const old=JSON.parse(localStorage.getItem('luv4u.reply.'+gift.id)||'null');if(old){$('#recipientReply').value=cleanText(old.text,500);if(['🥹','😂','❤️','🎉'].includes(old.reaction))selectReaction(old.reaction,false);}}catch{}}
}
function stopBlowing(){micGeneration++;clearTimeout(micTimeout);cancelAnimationFrame(micFrame);micFrame=null;if(blowSource){try{blowSource.disconnect();}catch{}blowSource=null;}if(micStream){micStream.getTracks().forEach(t=>t.stop());micStream=null;}const b=$('#blowMic');if(b){b.disabled=false;b.innerHTML=icon('mic')+' Or blow into your microphone';}}
async function openPresentV1(){
 const box=$('#birthdayGift');if(!box||box.classList.contains('opened'))return;box.classList.add('opened');box.disabled=true;chime('wish');$('#giftInstruction').textContent='The best things don’t fit in a box. ♡';const token=experienceToken;await sleep(850);if(token!==experienceToken||scenes[sceneIndex]!=='gift')return;$('#giftAfter').innerHTML=storyButton('Read your little note');
}
function renderFunV1(){
 if(gift.fun==='balloons')return `${sceneTitle('Three little balloons.<br><em>A little love inside.</em>','An important birthday task')}<p class="story-description">Give each one a tap. These are the good kind of pop.</p><div class="fun-balloon-row">${['You’re loved.','So, so much.','More than you know.'].map((t,i)=>`<button class="fun-balloon" data-balloon="${i}" aria-label="Pop balloon ${i+1}"><span class="fun-balloon-shape">${['♡','✧','♡'][i]}</span><span class="balloon-reveal">${t}</span></button>`).join('')}</div><p class="fun-count" id="balloonCount">0 / 3 little bits of love</p><div id="funAfter"></div>`;
 if(gift.fun==='scratch')return `${sceneTitle('A little secret,<br><em>under the surface.</em>','This one’s worth uncovering')}<div class="scratch-wrap"><div class="scratch-message"><span class="heart">♡</span>${e(gift.funMessage||'The world is a little better with you in it.')}</div><canvas class="scratch-canvas" id="scratchCanvas" aria-label="Scratch with your finger or pointer to reveal a secret. A reveal button is also available."></canvas></div><p class="scratch-help" id="scratchHelp">Rub a little of the gold away. There’s love underneath.</p><button class="mic-btn" data-story="reveal-scratch" id="scratchRevealButton">Or tap to reveal your little secret</button><div id="funAfter"></div>`;
 return `${sceneTitle('A very serious<br><em>birthday question.</em>','There are no wrong answers')}<p class="story-description">Who deserves all the cake today?</p><div class="quiz-options">${[gift.name,gift.name+', obviously','Definitely '+gift.name].map((t,i)=>`<button class="quiz-option" data-quiz="${i}">${e(t)}</button>`).join('')}</div><div id="funAfter"></div>`;
}
function popBalloon(button){
 if(button.classList.contains('popped'))return;button.classList.add('popped');button.setAttribute('aria-label',button.querySelector('.balloon-reveal').textContent);button.setAttribute('aria-pressed','true');popCount++;chime('pop');const r=button.getBoundingClientRect();confetti(22,{x:r.x+r.width/2,y:r.y+r.height/2});$('#balloonCount').textContent=`${popCount} / 3 little bits of love`;
 if(popCount===3)$('#funAfter').innerHTML=`<p class="quiz-answer">${e(gift.funMessage||'All that love? It’s yours. Every last bit. ♡')}</p>${storyButton('Taking all that love with me')}`;
}
function initScratch(){
 const canvas=$('#scratchCanvas');if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx){revealScratch();return;}const rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height,dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.scale(dpr,dpr);
 const gradient=ctx.createLinearGradient(0,0,w,h);gradient.addColorStop(0,'#face98');gradient.addColorStop(.5,'#f4b677');gradient.addColorStop(1,'#f9dbb1');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);ctx.fillStyle='#fff5e72e';
 for(let i=0;i<90;i++){const x=(i*67.33)%w,y=(i*43.13)%h;ctx.beginPath();ctx.arc(x,y,.5+(i%3)*.35,0,Math.PI*2);ctx.fill();}
 ctx.strokeStyle='#cf8c4133';ctx.lineWidth=1;ctx.strokeRect(12,12,w-24,h-24);ctx.fillStyle='#ba742b';ctx.textAlign='center';ctx.font='26px Georgia';ctx.fillText('A little secret…',w/2,h/2-4);ctx.font='10px "Segoe UI", sans-serif';ctx.fillStyle='#c8843d';ctx.fillText('WAITING JUST FOR YOU',w/2,h/2+24);
 let drawing=false,last=null,checks=0;const coords=evt=>{const r=canvas.getBoundingClientRect();return {x:(evt.clientX-r.left)*w/r.width,y:(evt.clientY-r.top)*h/r.height};};
 const paint=(p,q)=>{ctx.globalCompositeOperation='destination-out';ctx.lineWidth=42;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(q?.x??p.x,q?.y??p.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.beginPath();ctx.arc(p.x,p.y,21,0,Math.PI*2);ctx.fill();};
 const coverage=()=>{if(scratchDone)return;const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let empty=0,total=0;for(let i=3;i<pixels.length;i+=64){total++;if(pixels[i]<80)empty++;}if(empty/total>.36)revealScratch();};
 const down=evt=>{if(scratchDone)return;drawing=true;last=coords(evt);canvas.setPointerCapture?.(evt.pointerId);paint(last);evt.preventDefault();};
 const move=evt=>{if(!drawing||scratchDone)return;const p=coords(evt);paint(p,last);last=p;if(++checks%16===0)coverage();};
 const up=()=>{drawing=false;last=null;coverage();};canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
 scratchCleanup=()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);};
}
function revealScratch(){if(scratchDone)return;scratchDone=true;$('#scratchCanvas')?.classList.add('revealed');$('#scratchRevealButton').hidden=true;$('#scratchHelp').textContent='Not so secret anymore. But always, always true. ♡';$('#funAfter').innerHTML=storyButton('Keeping that one close');chime();}
function answerQuiz(button){if($('.quiz-option.chosen'))return;button.classList.add('chosen');button.setAttribute('aria-pressed','true');$$('.quiz-option').forEach(b=>b.disabled=true);$('#funAfter').innerHTML=`<p class="quiz-answer">Correct. It was always you. ♡</p>${gift.funMessage?`<p class="story-description">${e(gift.funMessage)}</p>`:''}${storyButton('Excellent. Where’s my cake?')}`;chime('wish');}
function selectReaction(value,play=true){if(![...GENERIC_REACTIONS,...SORRY_REACTIONS,...WEDDING_REACTIONS].some(r=>r[0]===value))return;reaction=value;replySharedText='';if($('#replyResult'))$('#replyResult').innerHTML='';$$('.reaction-btn').forEach(b=>{const selected=b.dataset.reaction===value;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});if(play)chime('pop');}
function prepareReplyV1(){
 const text=$('#recipientReply').value.trim();if(!reaction&&!text){toast('Pick a little feeling, or write a few words. Either one is lovely.');return;}
 let saved=false;try{localStorage.setItem('luv4u.reply.'+gift.id,JSON.stringify({reaction,text,at:new Date().toISOString()}));saved=true;}catch{}
 replySharedText=`A little reply from ${gift.name} ${reaction||'♡'}\n\n${text||(gift.occasion==='apology'?'Okay fine. You’re forgiven. 💗':gift.occasion==='proposal'?'I’ve seen your little question.':'Thank you for making this little moment for me.')}`;
 const phone=gift.replyPhone,who=e(gift.sender||'the gift creator'),canShare=!!navigator.share;
 const main=phone?`<button class="btn btn-whatsapp" data-story="whatsapp-reply">${icon('whatsapp')} Send to ${who} on WhatsApp</button>`:canShare?`<button class="btn btn-primary" data-story="share-reply">${icon('up')} Send my reply</button>`:`<button class="btn btn-primary" data-story="copy-reply">${icon('copy')} Copy my reply</button>`;
 const alt=phone||canShare?`<button type="button" class="reply-alt" data-story="copy-reply">or copy it instead</button>`:'';
 $('#replyResult').innerHTML=`<p class="reply-saved">Your little reply is ready. ♡</p><div class="reply-share-panel">${main}${alt}</div><p class="reply-hint">${saved?'Saved on this device. ':''}Nothing is sent until you tap the button above.</p>`;
 $('#replyResult').scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'nearest'});chime();
}
async function shareReply(){if(!replySharedText)return;try{if(navigator.share)await navigator.share({title:'A little reply, from the heart',text:replySharedText});else await copyText(replySharedText,'Your little thank-you is copied. Send it back with love.');}catch(err){if(err.name!=='AbortError')await copyText(replySharedText,'Your little thank-you is copied. Send it back with love.');}}
function confirmReset(){
 const previous=document.activeElement,root=$('#modalRoot');root.innerHTML=`<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="resetTitle" aria-describedby="resetDescription"><h2 id="resetTitle">A fresh little start?</h2><p id="resetDescription">This clears your current draft, including its photos and recordings. Gift links you've already made will still work.</p><div class="modal-buttons"><button class="btn btn-secondary btn-small" id="cancelReset">Keep this one</button><button class="btn btn-primary btn-small" id="confirmReset">Start fresh</button></div></section></div>`;
 const close=()=>{root.innerHTML='';document.removeEventListener('keydown',trap);previous?.focus();};const trap=event=>{if(event.key==='Escape')close();if(event.key==='Tab'){const buttons=$$('button',root),first=buttons[0],last=buttons[buttons.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}};
 $('#cancelReset').onclick=close;$('#confirmReset').onclick=()=>{stopRecording(false);const selected=occasionKey(draft);draft={...emptyDraft(),occasion:selected,vibe:OCCASIONS[selected].vibe};occasionDrafts.delete(selected);removeStored('draft:'+selected).catch(()=>{});try{localStorage.removeItem('luv4u.draft.'+selected);}catch{}try{localStorage.removeItem(DRAFT_KEY);}catch{}populateForm();$$('.detail').forEach(d=>d.open=false);$('#nameError').hidden=true;$('#recipientName').setAttribute('aria-invalid','false');close();window.scrollTo({top:0,behavior:reducedMotion?'auto':'smooth'});toast('A clean page. A new little gift.');};document.addEventListener('keydown',trap);$('#cancelReset').focus();
}

/* ───────── Kholona v2: the story builder, tiny rooms and real gift delivery ───────── */
const THEMES = {
 Romantic:{symbol:'♡',caption:'Candlelight & a little butterflies',line:'Some people feel like coming home.',motifs:['♡','❦','✧','❀'],speed:1.15,transpose:.89,opening:'Someone saved a little<br><em>light for you.</em>',birthday:'My favorite reason to celebrate.',cake:'A wish for you.<br><em>And a thousand more with you.</em>',cakeNote:'Close your eyes. I’ll keep this little light for you.',gift:'Some things are small.<br><em>The love isn’t.</em>',ending:'Of all the days in the year, I’m really glad this one gave us you.',finalTitle:'Always, a little<br><em>more you.</em>'},
 Cute:{symbol:'✿',caption:'Soft balloons & happy little things',line:'A pocket-sized party. An enormous hug.',motifs:['✿','♡','✧','◌'],speed:.9,transpose:1.06,opening:'A tiny party is hiding<br><em>in the dark.</em>',birthday:'Your very own pocket-sized party.',cake:'One little cake.<br><em>One enormous wish.</em>',cakeNote:'Eyes closed. Cheeks puffed. Big birthday energy.',gift:'Special delivery.<br><em>Handle with hugs.</em>',ending:'Here’s a pocketful of sunshine, a ridiculous amount of cake, and all the hugs you can carry.',finalTitle:'The happiest birthday,<br><em>lovely you.</em>'},
 Funny:{symbol:'☺',caption:'A wonky cake & excellent nonsense',line:'Another year older. Still not a grown-up.',motifs:['☺','✶','~','✧'],speed:.85,transpose:.79,opening:'We forgot one thing.<br><em>The electricity.</em>',birthday:'Congratulations on surviving another orbit.',cake:'Your age? Classified.<br><em>Your cake? Enormous.</em>',cakeNote:'Make a wish. “More cake” is a completely valid answer.',gift:'Definitely not socks.<br><em>Probably.</em>',ending:'May your cake be bigger than your responsibilities. And may nobody sing the awkward second verse.',finalTitle:'Older. Wiser?<br><em>Still iconic.</em>'},
 Emotional:{symbol:'☁',caption:'Quiet words & memories held close',line:'You matter more than you’ll ever know.',motifs:['☾','✧','♡','⋆'],speed:1.25,transpose:.75,opening:'Take a little breath.<br><em>This moment is yours.</em>',birthday:'I’m so glad you exist.',cake:'For every quiet dream.<br><em>Make a wish.</em>',cakeNote:'The little wishes count, too. Especially those.',gift:'A few pieces of us.<br><em>Held close.</em>',ending:'May this next chapter be gentle with your heart. You deserve so much of the love you give away.',finalTitle:'The world is softer<br><em>with you in it.</em>'},
 Crazy:{symbol:'✷',caption:'Confetti, plot twists & zero chill',line:'Birthday rules? Absolutely not.',motifs:['✷','↝','✦','!'],speed:.7,transpose:1.19,opening:'The party is loading.<br><em>You’re the main event.</em>',birthday:'A certified legend was born today.',cake:'Make a wish.<br><em>Make it ridiculous.</em>',cakeNote:'World domination? A pet dragon? We’re not judging.',gift:'Warning: contains<br><em>birthday chaos.</em>',ending:'More wild stories. More terrible dancing. More “we actually did that” moments. Go be gloriously you.',finalTitle:'Maximum cake.<br><em>Minimum chill.</em>'},
 Elegant:{symbol:'✧',caption:'Champagne details & quiet joy',line:'A beautiful day, made more beautiful by you.',motifs:['✧','❦','·','✦'],speed:1.15,transpose:.84,opening:'A moment, set aside<br><em>just for you.</em>',birthday:'A beautiful reason to pause and celebrate.',cake:'A candle.<br><em>A beautiful possibility.</em>',cakeNote:'For the things you hope for. And the joys you haven’t met yet.',gift:'Thoughtfully chosen.<br><em>Entirely yours.</em>',ending:'To a year of meaningful moments, quiet joys, and wonderful things unfolding in their own time.',finalTitle:'To your next<br><em>beautiful chapter.</em>'}
};
let reelTimer=0,mediaBase='',paymentsRequired=false,publishedStatus='paid',payPrice=0,payLinkDays=365,payReviews=null,publishedExpiresAt='',publishedOpensAt='',wizardStep=0,backendReady=false,backendChecked=false,delivery='portable',editing=null,publishing=false,previewAudio=null,previewMelody=null,previewGain=null,lightStage=0,tiltEnabled=true,tiltHandler=null,finaleTimer=null,libraryCache=[],coverData='',draftDB=null,saveGeneration=0,cropContext=null,publishAttempt=null;
const LIBRARY_KEY='luv4u.library.v2';
const hexToken=n=>{const bytes=new Uint8Array(n);crypto.getRandomValues(bytes);return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');};
const clamp=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):fallback;
function sanitizeGift(d,needName=true){const x=sanitizeGiftV1(d,needName);x.version=3;x.server=d.server===true;x.volume=clamp(d.volume,0,.65,.24);x.branch=d.branch===true;x.motion=d.motion!==false;x.sharePreview=d.sharePreview!==false;x.replyPhone=cleanText(d.replyPhone,18).replace(/\D/g,'');x.fun=['none','balloons','scratch','quiz','gifts'].includes(d.fun)?d.fun:'none';x.quizQuestion=cleanText(d.quizQuestion,140);x.quizAnswer=cleanText(d.quizAnswer,80);x.quizOptions=(Array.isArray(d.quizOptions)?d.quizOptions:[]).slice(0,3).map(v=>cleanText(v,80));x.photos=x.photos.map((p,i)=>({...p,x:clamp(d.photos[i]?.x,0,100,50),y:clamp(d.photos[i]?.y,0,100,50),zoom:clamp(d.photos[i]?.zoom,1,2,1)}));x.occasion=Object.hasOwn(OCCASIONS,d.occasion)?d.occasion:'birthday';
 if(x.occasion==='proposal'){x.proposalKind=Object.hasOwn(PROPOSAL_QUESTIONS,d.proposalKind)?d.proposalKind:'relationship';x.proposalQuestion=cleanText(d.proposalQuestion,140);}
 if(['love','thanks'].includes(x.occasion))x.reasons=(Array.isArray(d.reasons)?d.reasons:[]).slice(0,3).map(v=>cleanText(v,160));
 if(x.occasion==='apology'){
  x.character=Object.hasOwn(SORRY_CHARACTERS,d.character)?d.character:'teddy';x.forgiveQuestion=cleanText(d.forgiveQuestion,80);
  x.coupons=(Array.isArray(d.coupons)?d.coupons:[]).slice(0,3).map(v=>cleanText(v,90));
  // Gifts made before the redesign kept one promise: it becomes their first coupon.
  if(!x.coupons.some(v=>v.trim())&&typeof d.commitment==='string'&&d.commitment.trim())x.coupons=[cleanText(d.commitment,90)];
 }
 if(x.occasion==='anniversary')x.togetherSince=validStoryDate(d.togetherSince);
 if(x.occasion==='congratulations')x.milestone=cleanText(d.milestone,80);
 if(x.occasion==='missyou')x.reunionMessage=cleanText(d.reunionMessage,200);
 if(x.occasion==='birthday'){x.birthDate=validBirthDate(d.birthDate);x.ageCandles=d.ageCandles===true&&!!x.birthDate;x.topTrait=cleanText(d.topTrait,40);x.mostPlayed=cleanText(d.mostPlayed,40);}
 if(x.occasion==='wedding'){
  x.partner=cleanText(d.partner,40);x.family1=cleanText(d.family1,40);x.family2=cleanText(d.family2,40);x.families=cleanText(d.families,160);x.city=cleanText(d.city,60);x.weddingDate=validStoryDateAny(d.weddingDate);
  x.events=(Array.isArray(d.events)?d.events:[]).slice(0,8).map(ev=>({title:cleanText(ev?.title,40),date:validStoryDateAny(ev?.date),time:/^\d{2}:\d{2}$/.test(ev?.time||'')?ev.time:'',venue:cleanText(ev?.venue,140),map:/^https:\/\//.test(String(ev?.map||'').trim())?cleanText(ev.map,400).trim():'',dress:cleanText(ev?.dress,60)}));
  x.hashtag=cleanText(d.hashtag,40).replace(/\s+/g,'');if(x.hashtag&&!x.hashtag.startsWith('#'))x.hashtag='#'+x.hashtag;
  x.blessing=Object.hasOwn(W_BLESSINGS,d.blessing)?d.blessing:'shubh';x.groomFirst=d.groomFirst===true;
  x.fun='none';x.vibe='Elegant';
 }
 if(x.occasion!=='birthday')x.branch=false;
 return x;}
function safeMedia(value,kind){const s=String(value||'');if(kind==='image'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s)&&s.length<1_350_000)return s;if(kind==='audio'&&/^data:audio\/[A-Za-z0-9.+-]+(?:;codecs=[A-Za-z0-9.,-]+)?;base64,[A-Za-z0-9+/=]+$/.test(s)&&s.length<4_200_000)return s;return safeWebURL(s);}
function openDB(){if(draftDB)return draftDB;draftDB=new Promise((resolve,reject)=>{if(!window.indexedDB){reject(new Error('Browser storage is unavailable.'));return;}const req=indexedDB.open('luv4u-v2',1);req.onupgradeneeded=()=>req.result.createObjectStore('gifts');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);req.onblocked=()=>reject(new Error('Browser storage is blocked.'));});return draftDB;}
async function store(key,value){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction('gifts',value===undefined?'readonly':'readwrite');const req=value===undefined?tx.objectStore('gifts').get(key):tx.objectStore('gifts').put(value,key);let result;req.onsuccess=()=>result=req.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
async function removeStored(key){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction('gifts','readwrite');tx.objectStore('gifts').delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
function saveDraft(){
 clearTimeout(saveTimer);const gen=++saveGeneration,snapshot=JSON.parse(JSON.stringify(draft)),key=occasionKey(snapshot);occasionDrafts.set(key,snapshot);
 saveTimer=setTimeout(async()=>{try{await store('draft:'+key,snapshot);await store('draft',snapshot);if(gen===saveGeneration)$('#savingNote').textContent='Tucked safely into this browser. ♡';}catch{try{localStorage.setItem(DRAFT_KEY,JSON.stringify(snapshot));localStorage.setItem('luv4u.draft.'+key,JSON.stringify(snapshot));$('#savingNote').textContent='Your draft is saved in this browser.';}catch{$('#savingNote').textContent='Storage is unavailable. Keep this tab open until you export your gift.';}}},350);
}
async function restoreDraft(){let saved;try{saved=await store('draft');}catch{}if(!saved){try{saved=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');}catch{}}if(saved)try{draft=sanitizeGift(saved,false);occasionDrafts.set(occasionKey(draft),structuredClone(draft));}catch{}try{const list=JSON.parse(localStorage.getItem(LIBRARY_KEY)||'[]');libraryCache=Array.isArray(list)?list.filter(v=>v&&typeof v.id==='string').slice(0,100):[];}catch{libraryCache=[];}}
function saveLibrary(){try{localStorage.setItem(LIBRARY_KEY,JSON.stringify(libraryCache));return true;}catch{toast('Save your private recovery link now. This browser cannot remember your gifts.');return false;}}
function rememberGift(entry){libraryCache=libraryCache.filter(v=>v.id!==entry.id);libraryCache.unshift({...entry,at:new Date().toISOString()});libraryCache=libraryCache.slice(0,100);saveLibrary();}
async function api(path,options={}){const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),options.timeout||45000);try{const r=await fetch(path,{method:options.method||'GET',headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(options.key?{Authorization:'Bearer '+options.key}:{})},body:options.body?JSON.stringify(options.body):undefined,signal:controller.signal,cache:'no-store',credentials:options.credentials?'same-origin':'omit'});let data;try{data=await r.json();}catch{throw new Error('The gift server returned an unexpected response. Your draft is still safe.');}if(!r.ok){const err=new Error(data.error||'The gift could not be saved.');err.status=r.status;throw err;}return data;}catch(err){if(err.name==='AbortError')throw new Error('The gift server is taking too long. Try again; your draft is still here.');throw err;}finally{clearTimeout(timeout);}}
async function checkBackend(){if(!['http:','https:'].includes(location.protocol)){backendChecked=true;return;}try{const c=await api('/api/config',{timeout:2500});backendReady=c.product==='luv4u'&&[2,3].includes(c.version)&&c.hosted;backendOccasions=Array.isArray(c.occasions)?c.occasions:['birthday'];mediaBase=typeof c.mediaBase==='string'?c.mediaBase:'';paymentsRequired=backendReady&&c.payments?.required===true;payPrice=paymentsRequired?Number(c.payments.priceInr)||0:0;payPrices=paymentsRequired&&c.payments.prices&&typeof c.payments.prices==='object'?c.payments.prices:{};paySimulated=paymentsRequired&&c.payments.simulated===true;payProvider=paymentsRequired?String(c.payments.provider||''):'';payTestMode=paymentsRequired&&c.payments.testMode===true;payLinkDays=Number(c.payments?.linkDays)||365;payReviews=c.reviews&&Array.isArray(c.reviews.quotes)&&c.reviews.quotes.length?c.reviews:null;updatePaymentsUI();}catch{}backendChecked=true;delivery=backendReady?'hosted':'portable';updateDelivery();}
function clearGiftHash(){try{const p=/^\/(g|for)\//.test(location.pathname)?'/':location.pathname;history.replaceState(null,'',p+location.search);}catch{}}
function showView(view){if($('.skip-link'))$('.skip-link').hidden=view!=='home';stopPreviewAudio();showViewV1(view);updateResumeBanner();$('#myGiftsView').hidden=view!=='library';if(view==='library')$('#myGiftsView').hidden=false;const right=$('#headerRight');if(!right.querySelector('.my-gifts-link'))right.insertAdjacentHTML('afterbegin','<button class="nav-link my-gifts-link" data-v2="library">My little gifts</button>');if(view==='creator')setStep(wizardStep,false);if(view==='library'){document.title='Your little gifts · Kholona';right.innerHTML='<button class="nav-link pill-link" data-action="create">Make another little gift ♡</button>';}}
async function openCreator(key='birthday'){
 if(occasionSwitchBusy||publishing)return;occasionSwitchBusy=true;
 try{
  key=Object.hasOwn(OCCASIONS,key)?key:'birthday';stopPreviewAudio();
  const old=JSON.parse(JSON.stringify(draft));clearTimeout(saveTimer);saveGeneration++;occasionDrafts.set(occasionKey(old),old);
  // Saved in the background: the editor does not wait for the browser's storage.
  store('draft:'+occasionKey(old),old).catch(()=>{try{localStorage.setItem('luv4u.draft.'+occasionKey(old),JSON.stringify(old));}catch{}});
  if(key!==occasionKey(draft)){
   let saved=occasionDrafts.get(key);if(!saved)try{saved=await store('draft:'+key);}catch{}
   if(!saved)try{saved=JSON.parse(localStorage.getItem('luv4u.draft.'+key)||'null');}catch{}
   draft=saved?sanitizeGift(saved,false):{...emptyDraft(),occasion:key,vibe:OCCASIONS[key].vibe};
  }
  clearGiftHash();try{history.replaceState(null,'',location.pathname+location.search+'#make='+key);}catch{}
  editing=null;publishAttempt=null;setOpensAt('');removeStored('pending-create').catch(()=>{});
  wizardStep=0;populateForm();showView('creator');setStep(0,true);saveDraft();
 }finally{occasionSwitchBusy=false;}
}
/* One page, not three steps. The name, a ready-made note you can see and change, photos and a voice note, and the way forward all
   stay on screen; the unlock page that follows is the preview. "Steps" are now just places to scroll to. */
const STEP_COUNT=1;
let noteOpenedOnce=false;
/* Saving is free and the next screen is the preview, so the button says that. */
const createLabel=()=>editing?.mode==='hosted'?(wedOn()?'Save invite changes ':'Save gift changes ')+icon('heart'):wedOn()?'Create our invite '+icon('arrow'):paymentsRequired?'Create & preview '+icon('arrow'):'Create My Gift '+icon('spark');
const moodLines={Romantic:'Rose & candlelight',Cute:'Soft pink',Funny:'Warm amber',Emotional:'Quiet dusk',Crazy:'Bold terracotta',Elegant:'Muted gold'};
const moodLine=()=>occasionKey(draft)==='birthday'?THEMES[draft.vibe].line:moodLines[draft.vibe]||'';
function setStep(step,focus=true){
 wizardStep=0;
 $$('.wizard-panel').forEach(el=>el.hidden=false);
 const o=occasionOf(draft),birth=occasionKey(draft)==='birthday',named=!!draft.name.trim();
 updateOccasionUI();
 $('.creator-head h2').innerHTML=birth?'Who’s your<br><em>birthday person?</em>':o.title;
 $('.creator-head>p').textContent=birth?'A name is all you need. We’ll write the rest, and you can change every word.':o.intro;
 $('#createGiftBtn').hidden=false;$('#createGiftBtn').innerHTML=createLabel();
 $('#dockPreview').hidden=!named;
 updatePriceLine();updateMiniPreview();autoNote();renderMediaStatus();
 /* The note is the heart of the gift: open it, and the photos, the first time. */
 if(!noteOpenedOnce){noteOpenedOnce=true;for(const id of ['noteDetail','photosDetail']){const d=$('#'+id);if(d)d.open=true;}}
 if(!focus||currentView!=='creator')return;
 if(step<=0){window.scrollTo({top:0,behavior:reducedMotion?'auto':'smooth'});const target=$('#recipientName');target.focus({preventScroll:true});}
 else{const target=step===1?$('#touchesEditor'):$('#moreOptions');target?.scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'});}
}
/* "Next" no longer exists: the only way forward is to create the gift. */
function advanceWizard(){if(wedOn()){if(weddingReady()){stopPreviewAudio();publishGift();}return;}if(!draft.name.trim()){setStep(0,true);validateForm();return;}stopPreviewAudio();publishGift();}
let statusTimer=0;
/* ---- Smart default: a ready-made note, written for this person, that you can see, shuffle and edit. ----
   It follows the name and the mood until the sender writes their own words. */
let autoNoteTimer=0;
function scheduleAutoNote(){clearTimeout(autoNoteTimer);autoNoteTimer=setTimeout(()=>autoNote(),220);}
function autoNote(step=0){
 const ta=$('#personalMessage');if(!ta||!draft.name.trim())return;
 const st=getTemplateState(ta),cur=ta.value;
 if(cur.trim()&&cur!==st.owned)return;                 /* they wrote their own words */
 if(!cur.trim()&&st.manual&&!step)return;              /* they cleared it on purpose */
 const opts=messageOptions(ta,'note');if(!opts.length)return;
 st.autoIndex=(((st.autoIndex||0)+step)%opts.length+opts.length)%opts.length;
 const text=opts[st.autoIndex].text;if(cur===text)return;
 st.manual=false;applyingMessageTemplate=true;
 try{ta.value=text;st.owned=text;ta.dispatchEvent(new Event('input',{bubbles:true}));}finally{applyingMessageTemplate=false;}
 ta.classList.remove('note-fresh');void ta.offsetWidth;ta.classList.add('note-fresh');
 refreshMessageTemplates();
}
/* A restored draft whose note is still one of our own suggestions keeps following the name. */
function adoptOwnedNote(){
 const ta=$('#personalMessage');if(!ta||!ta.value.trim())return;
 const st=getTemplateState(ta),i=messageOptions(ta,'note').findIndex(o=>o.text===ta.value);
 if(i>=0){st.owned=ta.value;st.autoIndex=i;}
}
function prefillSender(){
 if(editing||draft.sender.trim()||!$('#senderName'))return;
 try{const saved=localStorage.getItem('kholona.sender');if(saved){draft.sender=saved.slice(0,40);$('#senderName').value=draft.sender;}}catch{}
}
/* Photos and a voice note change how a gift feels more than anything else. They sit open on the page, and when neither is added a short,
   skippable card says so right above the button: leaving them out is a visible choice, not a missed step. */
function renderMediaNudge(){const n=$('#dockNudge');if(!n)return;n.hidden=wedOn()||!(draft.name.trim()&&!draft.photos.length&&!draft.voice);}
/* A plain status on each of the three "make it yours" sections, so nothing is hidden behind a fold without saying so. */
function renderMediaStatus(){
 const ta=$('#personalMessage'),own=ta&&ta.value.trim()&&ta.value!==getTemplateState(ta).owned;
 const rows=[['noteDetail',draft.message.trim()?(own?'Your words':'Ready-made · edit freely'):'We’ll add a note',!!draft.message.trim()],['photosDetail',draft.photos.length?draft.photos.length+(draft.photos.length===1?' photo':' photos'):'Not added yet',!!draft.photos.length],['voiceDetail',draft.voice?'Added':'Not added yet',!!draft.voice]];
 for(const [id,text,done] of rows){const summary=$('#'+id+' summary');if(!summary)continue;let tag=$('.detail-status',summary);if(!tag){tag=document.createElement('span');tag.className='detail-status';summary.insertBefore(tag,$('.detail-chevron',summary));}tag.textContent=(done?'✓ ':'')+text;tag.classList.toggle('done',done);}
 const shuffle=$('#noteShuffle'),hint=$('#noteHint');
 if(shuffle){shuffle.hidden=!!own;}
 if(hint){hint.textContent=!draft.name.trim()?'Type a name and we’ll write a first version for you.':own?'Your words. Nothing to change unless you want to.':'Written for '+draft.name.trim()+'. Change any word, or try another.';}
 renderMediaNudge();
}
for(const type of ['input','change','click'])document.addEventListener(type,()=>{clearTimeout(statusTimer);statusTimer=setTimeout(()=>{if($('#photosDetail'))renderMediaStatus();},120);});
function touchCount(){return [!!draft.message.trim(),!!draft.photos.length,draft.memories.some(m=>m.text.trim()),!!draft.voice,draft.music!=='none',draft.fun!=='none',!!(draft.finalMessage.trim()||draft.finalUrl),occasionHasExtras()].filter(Boolean).length;}
/* Opens (and scrolls to) one of the optional sections, also opening the "More" group when it lives there. */
function chooseTouches(detailId){
 setStep(1,false);refreshMessageTemplates();
 const target=document.getElementById(detailId||'noteDetail');
 if(target){const group=target.closest('#moreTouches');if(group)group.open=true;target.open=true;target.querySelector('summary').focus({preventScroll:true});target.scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'});}
}
function skipTouches(){stopPreviewAudio();}
/* Compact live card on the words & photos step; phones only (desktop has the side preview). Kept off step 1 so the name field never jumps while typing. */
function updateMiniPreview(){const box=$('#miniPreview');if(box)box.hidden=true;/* the note and the dock already show it, and a card here would shift the name field */}

function validateForm(){if(wedOn())return weddingReady();if(!draft.name.trim())setStep(0,false);for(const id of ['voiceUrl','musicUrl','finalUrl']){const input=$('#'+id);if(input.value.trim()&&!safeWebURL(input.value)){setStep(1,false);}}return validateFormV1();}
function updatePreview(){updatePreviewV1();if(!$('#createGiftBtn'))return;$('#createGiftBtn').classList.toggle('is-ready',!!draft.name.trim());$('#vibePreviewLine').textContent=moodLine();$('#editorRoom').dataset.vibe=draft.vibe;$('#editorRoom').style.filter=draft.vibe==='Elegant'?'saturate(.55)':draft.vibe==='Crazy'?'saturate(1.15)':'';$('#quizFields').hidden=draft.fun!=='quiz';updateMiniPreview();updateOccasionUI();renderMediaNudge();if($('#dockPreview'))$('#dockPreview').hidden=!draft.name.trim();}
function populateForm(){populateFormV1();if(!$('#musicVolume'))return;$('#musicVolume').value=Math.round((draft.volume??.24)*100);$('#volumeReadout').textContent=Math.round((draft.volume??.24)*100)+'%';$('#replyPhone').value=draft.replyPhone||'';$('#branchToggle').checked=draft.branch===true;$('#motionToggle').checked=draft.motion!==false;$('#sharePreviewToggle').checked=draft.sharePreview!==false;$('#quizQuestion').value=draft.quizQuestion||'';$('#quizAnswer').value=draft.quizAnswer||'';for(let i=0;i<2;i++)$('#quizDecoy'+i).value=draft.quizOptions?.[i]||'';updateOccasionUI();renderOccasionDetails(true);installMessageTemplates();adoptOwnedNote();prefillSender();refreshMessageTemplates();updateDelivery();}
function updateDelivery(){if(!$('#deliverySelect'))return;$('#deliverySelect').closest('.quiet-field').hidden=paymentsRequired;$('#hostedOption').disabled=!backendReady;$('#deliverySelect').value=editing?.mode==='hosted'?'hosted':delivery;$('#deliverySelect').disabled=editing?.mode==='hosted';$('#expiryField').hidden=(editing?.mode==='hosted'?'hosted':delivery)!=='hosted'||paymentsRequired;$('#scheduleField').hidden=(editing?.mode==='hosted'?'hosted':delivery)!=='hosted';$('#deliveryStatus').hidden=backendReady;$('#deliveryStatus').classList.toggle('offline',!backendReady);$('#deliveryStatus').textContent=backendReady?'':'Short links are not available right now, so your gift will be a file or a long link you can send.';$('#backendPublishNote').textContent=delivery==='hosted'?'Photos and audio are uploaded when you create your gift. Anyone with the link can open it.':'Large media gifts are shared as a downloadable HTML file. Short, text-only gifts can travel in a link.';}
/* Scheduled delivery: the creator picks a moment in their own time zone; the server stores it as an exact instant. */
const localInput=iso=>{const d=new Date(iso),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;};
const opensAtISO=()=>{const v=$('#opensAt')?.value;return v?new Date(v).toISOString():'';};
const whenText=d=>new Intl.DateTimeFormat(undefined,{weekday:'short',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}).format(d);
function setOpensAt(iso){publishedOpensAt=iso&&Date.parse(iso)>Date.now()?iso:'';const f=$('#opensAt');if(!f)return;f.value=publishedOpensAt?localInput(publishedOpensAt):'';f.dataset.changed='false';$('#clearOpensAt').hidden=!f.value;}
function opensAtBody(creating){const f=$('#opensAt');if(!f)return {};if(creating)return opensAtISO()?{opensAt:opensAtISO()}:{};return f.dataset.changed==='true'?{opensAt:opensAtISO()||null}:{};}
/* A printable QR code for the short link, made on the device (the QR library is fetched only when asked for). */
async function downloadQr(){
 if(!publishedURL||!publishedGift?.server){toast('A QR code needs the short link, which is not available for this gift.');return;}
 try{
  if(!window.qrcode)await new Promise((ok,no)=>{const s=document.createElement('script');s.src='/legacy/qr.js';s.onload=ok;s.onerror=no;document.head.append(s);});
  const qr=window.qrcode(0,'M');qr.addData(publishedURL);qr.make();
  const n=qr.getModuleCount(),cell=10,pad=40,size=n*cell+pad*2,c=document.createElement('canvas');c.width=size;c.height=size+84;
  const x=c.getContext('2d');x.fillStyle='#fffdfa';x.fillRect(0,0,c.width,c.height);x.fillStyle='#432d32';
  for(let r=0;r<n;r++)for(let q=0;q<n;q++)if(qr.isDark(r,q))x.fillRect(pad+q*cell,pad+r*cell,cell,cell);
  x.textAlign='center';x.fillStyle='#b4184b';x.font='italic 28px Georgia';x.fillText('For '+(publishedGift.sharePreview!==false?publishedGift.name:'you'),size/2,size+6);
  x.fillStyle='#5b4549';x.font='18px Georgia';x.fillText('Point your camera here to open your little gift ♡',size/2,size+44);
  c.toBlob(blob=>{if(blob)downloadBlob(blob,'gift-qr.png');});
 }catch{toast('We could not make the QR code. Please try again.');}
}
function renderScheduledNote(){
 $('#shareScheduled')?.remove();if(!publishedOpensAt||Date.parse(publishedOpensAt)<=Date.now())return;
 $('.link-wrap').insertAdjacentHTML('afterend',`<p class="share-scheduled" id="shareScheduled">It opens for ${e(publishedGift.name)} on <strong>${e(whenText(new Date(publishedOpensAt)))}</strong>. Until then, anyone with the link sees a “not yet” page.</p>`);
}
function showScheduled(iso){
 showView('error');const when=new Date(iso),wait=when-Date.now();
 $('#errorView h2').innerHTML='Not quite yet.<br><em>Good things wait.</em>';
 $('#errorMessage').textContent='This little surprise opens on '+whenText(when)+'. Come back then.';
 const cta=$('#errorView .btn');if(cta)cta.hidden=true;document.title='A little surprise is waiting ♡';
 if(wait>0&&wait<2**31-1&&wait<48*3600e3)setTimeout(()=>location.reload(),wait+1500);
}
document.addEventListener('input',ev=>{if(ev.target.id!=='opensAt')return;ev.target.dataset.changed='true';$('#clearOpensAt').hidden=!ev.target.value;});
document.addEventListener('focusin',ev=>{if(ev.target.id==='opensAt')ev.target.min=localInput(new Date().toISOString());});
document.addEventListener('click',ev=>{if(ev.target.id==='clearOpensAt'){const f=$('#opensAt');f.value='';f.dataset.changed='true';ev.target.hidden=true;f.focus();}});
function renderReview(){renderOccasionReview();}
function installWizard(){
 if($('#giftForm').dataset.v2Installed==='true'){ $('#vibeGrid').innerHTML=VIBES.map(v=>`<button type="button" class="vibe-btn" data-vibe="${v.name}" aria-pressed="false"><span class="vibe-icon" aria-hidden="true">${v.symbol}</span><strong>${v.name}</strong><span class="vibe-caption">${THEMES[v.name].caption}</span></button>`).join(''); return; }
 const form=$('#giftForm'),sections=$$('.form-section',form);$('.creator-head').after(Object.assign(document.createElement('div'),{id:'miniPreview',className:'mini-preview',hidden:true}));
 const panels=[0,1,2].map(i=>{const el=document.createElement('section');el.className='wizard-panel';el.dataset.step=i;el.hidden=i!==0;return el;});
 panels[0].append(sections[0]);panels[0].insertAdjacentHTML('beforeend','<p class="step-help">Your partner. Your best friend. Your mum.<br>Whoever makes your ordinary days a little brighter.</p>');
 panels[0].append(sections[1]);panels[0].insertAdjacentHTML('beforeend','<p class="vibe-preview-line" id="vibePreviewLine"></p><p class="step-count-note">Just their name. A beautiful birthday, even without the extras.</p>');
 const touchesEditor=document.createElement('div');touchesEditor.id='touchesEditor';
 for(const el of [...form.children])touchesEditor.append(el);panels[1].append(touchesEditor);
 $('.optional-heading',touchesEditor)?.remove();$('.optional-intro',touchesEditor)?.remove();
 /* Photos and voice first (the touches people value most); the rest tucked under "More". */
 const pers=$('.personalization',touchesEditor),more=document.createElement('details');more.className='detail more-touches';more.id='moreTouches';
 more.innerHTML=`<summary><span class="detail-icon">${icon('plus')}</span><span><span class="detail-title">More little touches</span><span class="detail-subtitle" style="display:block">Memories, a soundtrack, a playful surprise, a last surprise</span></span><span class="detail-chevron">${icon('chevron')}</span></summary><div class="detail-body"></div>`;
 pers.insertBefore($('#voiceDetail',pers),$('#memoriesDetail',pers));$('#memoriesDetail',pers).before(more);
 for(const id of ['memoriesDetail','musicDetail','funDetail','finalDetail'])$('.detail-body',more).append($('#'+id,pers));
 panels[2].innerHTML=`<div id="reviewSummary" hidden></div><p class="price-line" id="priceLine" hidden></p><details class="more-options" id="moreOptions"><summary><span>More options</span><span class="detail-chevron">${icon('chevron')}</span></summary><div class="more-options-body"><div class="quiet-field"><label class="field-label" for="deliverySelect">Link type</label><select id="deliverySelect"><option value="hosted" id="hostedOption" disabled>Short link (recommended)</option><option value="portable">Standalone: long link or downloadable file</option></select></div><div class="quiet-field" id="expiryField" hidden><label class="field-label" for="expiryDays">Keep the link live for</label><select id="expiryDays"><option value="0">No expiry</option><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="365">1 year</option></select><p class="privacy-small">After that the link stops working. Downloaded copies cannot be recalled.</p></div><div class="quiet-field" id="scheduleField" hidden><label class="field-label" for="opensAt">Let it open at a set time</label><div class="schedule-row"><input type="datetime-local" id="opensAt" class="text-input" aria-describedby="opensAtHelp"><button type="button" class="schedule-clear" id="clearOpensAt" hidden>Clear</button></div><p class="privacy-small" id="opensAtHelp">Until then the link shows a “not yet” page. Leave it empty to open right away. Up to 120 days ahead.</p></div><label class="settings-line"><input type="checkbox" id="sharePreviewToggle" checked><span>Show their name in link previews<small>Previews and the downloadable artwork show the name, never private photos or messages.</small></span></label></div></details><div class="service-label offline" id="deliveryStatus" hidden></div><p class="backend-publish-note" id="backendPublishNote"></p>`;
 panels.forEach(p=>form.append(p));
 $('#vibeGrid').innerHTML=VIBES.map(v=>`<button type="button" class="vibe-btn" data-vibe="${v.name}" aria-pressed="${v.name===draft.vibe}"><span class="vibe-icon" aria-hidden="true">${v.symbol}</span><strong>${v.name}</strong><span class="vibe-caption">${THEMES[v.name].caption}</span></button>`).join('');
 $('.editor-dock').insertAdjacentHTML('afterbegin','<button type="button" class="dock-nudge" id="dockNudge" data-v2="nudge-photo" hidden><span aria-hidden="true">📷</span> Words only so far. <u>Add a photo or voice note</u></button>');
 $('.dock-buttons').innerHTML=`<button type="button" class="btn btn-secondary" id="dockPreview" data-action="preview" hidden>${icon('eye')} Peek</button><button type="button" class="btn btn-primary" id="createGiftBtn" data-action="publish">${createLabel()}</button>`;
 $('#musicDetail .detail-body').insertAdjacentHTML('beforeend',`<div class="audio-preview"><button type="button" class="btn btn-secondary btn-small" id="previewMusic" data-v2="preview-music">${icon('music')} Listen a little</button><label for="musicVolume">Volume <span id="volumeReadout">24%</span></label><input type="range" id="musicVolume" min="0" max="65" value="24" aria-label="Background music volume"></div>`);
 $('#moreOptions .more-options-body').insertAdjacentHTML('beforeend','<div class="field-gap"><label class="field-label" for="replyPhone">Get replies on WhatsApp <small>Optional</small></label><input class="text-input" type="tel" id="replyPhone" inputmode="tel" maxlength="18" placeholder="Country code + number, e.g. 919876543210"><p class="input-help">Their thank-you can then come straight to your WhatsApp. Your number becomes part of the gift link, so only add one you are happy to share.</p></div>');
 $('#funChoices').insertAdjacentHTML('beforeend','<button type="button" class="surprise-choice" data-fun="gifts" aria-pressed="false"><span>🎁</span>Pick a mystery gift</button>');
 $('#funDetail .detail-body').insertAdjacentHTML('beforeend','<div class="field-gap" id="quizFields" hidden><label class="field-label" for="quizQuestion">Your tiny question <small>Optional</small></label><input class="text-input" id="quizQuestion" maxlength="140" placeholder="Where did we first meet?"><div class="field-gap"><label class="field-label" for="quizAnswer">The right answer</label><input class="text-input" id="quizAnswer" maxlength="80" placeholder="That tiny coffee shop"></div><div class="field-gap"><label class="field-label" for="quizDecoy0">Two playful alternatives <small>Optional</small></label><input class="text-input" id="quizDecoy0" maxlength="80" placeholder="On the moon"><input class="text-input" id="quizDecoy1" maxlength="80" placeholder="In another lifetime" aria-label="Second playful quiz alternative" style="margin-top:8px"></div><p class="input-help">Leave this blank for a ready-made birthday question. Wrong guesses get a friendly hint, never a dead end.</p></div><label class="settings-line"><input type="checkbox" id="branchToggle" checked><span>Let them choose what to open first<small>A tiny choice between their Birthday Wrapped and a note.</small></span></label><label class="settings-line"><input type="checkbox" id="motionToggle" checked><span>A little movement in their room<small>Gentle floating details. Device tilt is always opt-in.</small></span></label>');
 $('#shareView').insertAdjacentHTML('beforeend','<img class="share-cover" id="shareCover" alt="Shareable birthday artwork" hidden><div class="share-extra-actions"><button class="btn btn-secondary btn-small" id="nativeShareGift" data-v2="native-share">More apps ↗</button><button class="btn btn-secondary btn-small" data-v2="download-cover">Save this picture</button><button class="btn btn-secondary btn-small" id="qrGift" data-v2="download-qr">QR code for a card</button></div><p class="share-cover-note">This is the picture people see when you send the link.</p><div class="owner-note" id="ownerNote"></div>');
 $('#creatorView').insertAdjacentHTML('afterend','<main id="myGiftsView" class="view my-gifts-view" hidden><button class="back-link" data-action="home">← Back to the little magic</button><div class="eyebrow" style="margin-top:20px">Your little corner of the internet</div><h1>Gifts you’ve<br><em>put your heart into.</em></h1><p class="my-gifts-intro">No account needed. This browser remembers your gifts. Save each private recovery link to edit from another device. Keep those links just for you.</p><div id="savedGiftList"></div><button class="btn btn-primary" data-action="create">Make another little gift ♡</button></main>');
 document.body.insertAdjacentHTML('beforeend','<dialog class="crop-dialog" id="cropDialog" aria-labelledby="cropTitle"><h2 id="cropTitle">A little closer.</h2><p>Drag to frame your photo, or use the sliders. The original stays safely in your draft.</p><div class="crop-window" id="cropWindow"><img id="cropImage" alt="Photo crop preview" draggable="false"><span class="crop-guides" aria-hidden="true"></span></div><div class="crop-controls"><label>Left / right <input type="range" id="cropX" min="0" max="100" value="50"></label><label>Up / down <input type="range" id="cropY" min="0" max="100" value="50"></label><label>A little zoom <input type="range" id="cropZoom" min="1" max="2" step=".01" value="1"></label></div><div class="crop-actions"><button class="btn btn-secondary btn-small" data-v2="cancel-crop">Keep it as it was</button><button class="btn btn-primary btn-small" data-v2="save-crop">That’s the moment ♡</button></div></dialog>');
 // Copy is descriptive in both connected and standalone mode.
 {const pz=$('#photosDetail .detail-body'),alt=document.createElement('details');alt.className='alt-source';alt.innerHTML='<summary>Use an image link instead</summary>';alt.append($('.or-line',pz),$('.inline-field',pz));$('.upload-zone',pz).after(alt);}
 {const vb=$('#voiceDetail .detail-body'),alt=document.createElement('details');alt.className='alt-source';alt.innerHTML='<summary>Use an audio link instead</summary>';alt.append($('label[for=voiceUrl]',vb),$('#voiceUrl'));$('.or-line',vb).remove();vb.prepend($('.recorder-row',vb),$('.upload-zone',vb));vb.append(alt);}
 {const ta=$('#personalMessage');ta.insertAdjacentHTML('afterend','<div class="note-tools"><button type="button" class="note-shuffle" id="noteShuffle" data-v2="note-shuffle">↻ Try another</button><span class="note-hint" id="noteHint" role="status"></span></div>');}
 $('#panelOneIntro')||panels[1].insertAdjacentHTML('afterbegin','<div class="make-theirs" id="panelOneIntro"><h3>Make it <em>theirs</em></h3><span>All optional</span></div>');
 $('#recipientName').setAttribute('enterkeyhint','go');$('#recipientName').setAttribute('autocapitalize','words');
 $('#photosDetail .input-help').textContent='Photos are compressed on your device. Crop and reorder them below. They upload only when you choose a server-backed gift.';
 $('#voiceDetail .input-help').textContent='Recording asks for your microphone. Your note stays in the draft until you create a gift. You can listen before sending.';
 $('#giftForm').dataset.v2Installed='true';
}
/* A small album, a familiar voice, and a soundtrack at just the right volume. */
const cropStyle=p=>`object-position:${clamp(p.x,0,100,50)}% ${clamp(p.y,0,100,50)}%;transform:scale(${clamp(p.zoom,1,2,1)});transform-origin:${clamp(p.x,0,100,50)}% ${clamp(p.y,0,100,50)}%`;
function reorderTools(kind,i,length){return `<div class="media-tools"><span class="drag-handle" aria-hidden="true" title="Drag to reorder">⠿</span>${kind==='photo'?`<button type="button" data-crop="${i}" aria-label="Crop photo ${i+1}">Frame</button>`:''}<button type="button" data-move="${kind}:${i}:-1" ${i===0?'disabled':''} aria-label="Move ${kind} ${i+1} earlier">←</button><button type="button" data-move="${kind}:${i}:1" ${i===length-1?'disabled':''} aria-label="Move ${kind} ${i+1} later">→</button></div>`;}
function renderPhotoList(){
 $('#photoList').innerHTML=draft.photos.map((p,i)=>`<div class="photo-edit" draggable="true" data-sort="photo:${i}"><div class="photo-edit-frame"><img src="${e(p.src)}" alt="Photo ${i+1}" loading="lazy" draggable="false" referrerpolicy="no-referrer" style="${cropStyle(p)}"></div><button type="button" class="remove-btn" data-remove-photo="${i}" aria-label="Remove photo ${i+1}">${icon('x')}</button><label class="sr-only" for="caption${i}">Caption for photo ${i+1}</label><input class="text-input" id="caption${i}" data-caption="${i}" maxlength="70" placeholder="A little caption (optional)" value="${e(p.caption)}">${reorderTools('photo',i,draft.photos.length)}</div>`).join('');
 $$('#photoList img').forEach(img=>img.addEventListener('error',()=>{img.alt='This photo link could not load. Try another link.';},{once:true}));$$('[data-caption]').forEach(input=>mountMessageTemplates(input,'caption'));updatePreview();
}
function renderMemoryList(){renderMemoryListV1();$$('.memory-edit').forEach((el,i)=>{el.draggable=true;el.dataset.sort='memory:'+i;el.insertAdjacentHTML('beforeend',reorderTools('memory',i,draft.memories.length));mountMessageTemplates($('#memoryWhen'+i),'memoryWhen');mountMessageTemplates($('#memoryText'+i),'memory');});}
function moveItem(kind,from,to){const list=kind==='photo'?draft.photos:draft.memories;if(from<0||to<0||from>=list.length||to>=list.length)return;list.splice(to,0,list.splice(from,1)[0]);(kind==='photo'?renderPhotoList:renderMemoryList)();saveDraft();toast('Same lovely moments. A new little order.');}
function openCrop(index){const p=draft.photos[index];if(!p)return;cropContext={index,x:clamp(p.x,0,100,50),y:clamp(p.y,0,100,50),zoom:clamp(p.zoom,1,2,1)};$('#cropImage').src=p.src;$('#cropX').value=cropContext.x;$('#cropY').value=cropContext.y;$('#cropZoom').value=cropContext.zoom;updateCrop();const d=$('#cropDialog');if(d.showModal)d.showModal();else{toast('Use a current browser to frame photos. Your uncropped photo still works.');return;}}
function updateCrop(){if(!cropContext)return;cropContext.x=+$('#cropX').value;cropContext.y=+$('#cropY').value;cropContext.zoom=+$('#cropZoom').value;$('#cropImage').style.cssText=cropStyle(cropContext);}
function closeCrop(save){if(save&&cropContext&&draft.photos[cropContext.index]){Object.assign(draft.photos[cropContext.index],{x:cropContext.x,y:cropContext.y,zoom:cropContext.zoom});renderPhotoList();saveDraft();}$('#cropDialog').close();cropContext=null;}
function renderAudioChip(kind){const src=kind==='voice'?draft.voice:draft.musicSrc,name=kind==='voice'?draft.voiceName:draft.musicName;$('#'+kind+'FileChip').innerHTML=src?`<div class="audio-chip">${icon(kind==='voice'?'mic':'music')}<span>${e(name||'Your linked '+(kind==='voice'?'voice note':'soundtrack'))}</span><button type="button" data-remove-audio="${kind}" aria-label="Remove ${kind}">${icon('x')}</button></div>${kind==='voice'?`<div class="audio-preview"><audio controls preload="none" src="${e(src)}" aria-label="Listen to your voice note"></audio></div>`:''}`:'';const audio=$('#voiceFileChip audio');if(audio){audio.addEventListener('play',stopPreviewAudio);audio.addEventListener('error',()=>toast('This audio could not play here. Try another recording format.'),{once:true});}}
function stopPreviewAudio(){if(wbListen)wbStopListen();if(previewAudio){previewAudio.pause();previewAudio.src='';previewAudio=null;}if(previewMelody){clearInterval(previewMelody);previewMelody=null;}if(previewGain){try{previewGain.disconnect();}catch{}previewGain=null;}if($('#previewMusic'))$('#previewMusic').innerHTML=icon('music')+' Listen a little';}
function previewMusic(){if(previewAudio||previewMelody){stopPreviewAudio();return;}if(draft.music==='none'){toast('Choose a little soundtrack first.');return;}$('#voiceFileChip audio')?.pause();ensureAudio();if(audioContext?.state==='suspended')audioContext.resume().catch(()=>{});if(draft.music==='custom'){previewAudio=new Audio(draft.musicSrc);previewAudio.volume=draft.volume??.24;previewAudio.addEventListener('ended',stopPreviewAudio,{once:true});previewAudio.addEventListener('error',()=>{stopPreviewAudio();toast('That soundtrack could not load. Check the direct audio link.');},{once:true});previewAudio.play().catch(()=>{stopPreviewAudio();toast('Tap Listen again, or check the audio file.');});}else if(audioContext){previewGain=audioContext.createGain();previewGain.gain.value=(draft.volume??.24)*.2;previewGain.connect(audioContext.destination);let n=0;const notes=draft.music==='dreamy'?[523.25,783.99,659.25,587.33,440,523.25]:[659.25,783.99,1046.5,987.77,783.99,659.25];const play=()=>{if(!previewGain||document.hidden)return;const osc=audioContext.createOscillator(),gain=audioContext.createGain(),t=audioContext.currentTime;osc.frequency.value=notes[n++%notes.length]*THEMES[draft.vibe].transpose;gain.gain.setValueAtTime(.8,t);gain.gain.exponentialRampToValueAtTime(.001,t+1.7);osc.connect(gain);gain.connect(previewGain);osc.start();osc.stop(t+1.8);osc.onended=()=>{osc.disconnect();gain.disconnect();};};play();previewMelody=setInterval(play,draft.music==='dreamy'?1000:720);}
 $('#previewMusic').innerHTML=icon('music')+' That’s lovely. Stop';}
/* Single source of truth for the optional story beats. */
function buildScenes(g){
 const kind=occasionKey(g),content=g.vibe==='Emotional'?['memories','photos','message']:['message','photos','memories'];
 const core=content.filter(t=>t==='message'||t==='photos'&&g.photos.length||t==='memories'&&g.memories.some(m=>m.text.trim()));
 let list;
 if(kind==='birthday')list=['opening','hbd','cake',...(g.branch?['choice']:[]),...core.filter(t=>t==='photos'),'wrapped','message',...core.filter(t=>t==='memories')];
 else if(kind==='apology')list=['opening','welcome','meter','message','coupons',...core.filter(t=>t!=='message')];
 else if(kind==='wedding')list=['opening','invite'];
 else {const interaction={love:'hearts',anniversary:'storybook',thanks:'bouquet',congratulations:'ribbon',missyou:'distance'}[kind];list=['opening',...(interaction?[interaction]:[]),...core];}
 if(g.voice)list.push('voice');if(g.fun!=='none')list.push('fun');
 if(kind==='missyou'&&g.reunionMessage?.trim())list.push('reunion');
 if(kind==='proposal')list.push('proposal');
 if(g.finalMessage.trim()||g.finalUrl)list.push('final');
 if(kind==='apology')list.push('forgive');
 return [...list,'celebration','reply'];
}
function seeded(seed){let h=2166136261;for(const c of seed)h=Math.imul(h^c.charCodeAt(0),16777619);return()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function roomDetails(){const t={...THEMES[gift.vibe],motifs:gift.occasion==='birthday'?THEMES[gift.vibe].motifs:gift.occasion==='apology'?['♡','💗','✿','🥺']:gift.occasion==='missyou'?['☾','✧','·']:gift.occasion==='thanks'?['✿','❦','·']:gift.occasion==='congratulations'?['✧','✦','·']:['♡','✧','❦']},rand=seeded(gift.id+gift.name+gift.vibe+gift.occasion),count=gift.vibe==='Elegant'?9:gift.vibe==='Crazy'?23:15;return `<div class="vibe-room-doodles" aria-hidden="true">${Array.from({length:count},(_,i)=>{const x=i%2?78+rand()*18:4+rand()*18;return `<span class="room-motif" style="--x:${x.toFixed(2)}%;--y:${(20+rand()*69).toFixed(2)}%;--size:${(11+rand()*18).toFixed(1)}px;--rotation:${(-25+rand()*50).toFixed(1)}deg;--delay:${(-rand()*9).toFixed(2)}s">${t.motifs[i%t.motifs.length]}</span>`;}).join('')}<i class="room-ribbon"></i><i class="room-ribbon right"></i></div>`;}
function startExperience(data,options={}){if($('.skip-link'))$('.skip-link').hidden=true;stopPreviewAudio();lightStage=0;tiltEnabled=true;startExperienceV1(data,options);/* the preview frame has no gifts list */const mine=$('#myGiftsView');if(mine)mine.hidden=true;$('#experience').dataset.palette=OCCASIONS[gift.occasion]?.vibe===gift.vibe?'occasion':'look';$('#experience').classList.toggle('motion-off',!gift.motion);$('#experience').insertAdjacentHTML('afterbegin',roomDetails());if(isPreview&&previewReturn==='home')$('[data-story=exit-preview]').textContent='Back to the little gifts';if(!reducedMotion&&gift.motion)enableTilt(true);/* the tilt toggle was an unlabelled control nobody needed: the room still tilts, there is just nothing to explain */if(!options.skipSeal&&gift.occasion!=='wedding')mountSeal();if(!options.preview&&gift.server&&/^\/g\/[a-f0-9]{24}/.test(location.pathname))countOpening();}
/* The ritual before the first scene: a sealed envelope, opened by pressing and holding the wax seal. */
/* Anyone holding a gift link can report it without opening it (the report page takes the link). Only for real, hosted gifts. */
function reportLink(){return gift?.server&&!isPreview&&/^[a-f0-9]{24}$/.test(gift.id||'')?`<a class="report-link" href="/report?gift=${gift.id}">Didn’t expect this? Report it</a>`:'';}
function mountSeal(){
 const exp=$('#experience'),scroll=$('#storyScroll');if(!exp||!scroll)return;
 const name=e(gift.name),from=gift.sender?'<span class="seal-from">from '+e(gift.sender)+'</span>':'';
 exp.insertAdjacentHTML('beforeend',`<div class="seal-gate" id="sealGate" role="dialog" aria-modal="true" aria-label="A sealed gift for ${name}"><div class="seal-card"><p class="seal-kicker">${gift.occasion==='apology'?'Someone is very sorry 🥺':'Something is waiting'}</p><div class="seal-address"><span class="seal-to">For</span><span class="seal-name">${name}</span>${from}</div><div class="seal-stage"><div class="seal-envelope" aria-hidden="true"><div class="seal-letter"><span>♡</span></div><div class="seal-front"></div><div class="seal-flap"></div></div><button type="button" class="seal-btn" id="sealBtn" aria-label="Press and hold to break the seal and open the gift"><svg class="seal-ring" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" pathLength="100"/></svg><span class="seal-heart" aria-hidden="true">♡</span></button></div><p class="seal-hint" id="sealHint" aria-live="polite">Press and hold the seal</p><button type="button" class="seal-skip" id="sealSkip">Just open it</button>${reportLink()}</div></div>`);
 const gate=$('#sealGate'),btn=$('#sealBtn'),hint=$('#sealHint');scroll.inert=true;
 const hold=reducedMotion?1:1000;let raf=0,start=0,done=false;
 const open=()=>{
  if(done)return;done=true;cancelAnimationFrame(raf);gate.style.setProperty('--p',1);gate.classList.add('opening');hint.textContent='Opening…';
  ensureAudio();chime('wish');buzz(35);
  const finish=()=>{gate.remove();scroll.inert=false;};
  setTimeout(()=>lightUp(),reducedMotion?0:650);
  if(reducedMotion){finish();return;}
  setTimeout(()=>gate.classList.add('gone'),1100);setTimeout(finish,1650);
 };
 const tick=t=>{const p=Math.min(1,(t-start)/hold);gate.style.setProperty('--p',p.toFixed(3));if(p>=1)open();else raf=requestAnimationFrame(tick);};
 const begin=()=>{if(done||gate.classList.contains('holding'))return;ensureAudio();start=performance.now();gate.classList.add('holding');hint.textContent='Keep holding…';raf=requestAnimationFrame(tick);};
 const cancel=()=>{if(done)return;cancelAnimationFrame(raf);if(gate.classList.contains('holding')){hint.textContent='A little longer. Hold until it opens.';}gate.classList.remove('holding');gate.style.setProperty('--p',0);};
 btn.addEventListener('pointerdown',ev=>{ev.preventDefault();begin();});
 for(const n of ['pointerup','pointerleave','pointercancel'])btn.addEventListener(n,cancel);
 btn.addEventListener('contextmenu',ev=>ev.preventDefault());
 btn.addEventListener('keydown',ev=>{if((ev.key===' '||ev.key==='Enter')&&!ev.repeat){ev.preventDefault();begin();}});
 btn.addEventListener('keyup',ev=>{if(ev.key===' '||ev.key==='Enter')cancel();});
 $('#sealSkip').onclick=open;
 btn.focus({preventScroll:true});
}
function cleanupExperience(){clearAuto();clearInterval(storyAuto);cascading=false;clearInterval(reelTimer);clearTimeout(finaleTimer);stopTilt();tiltEnabled=true;cleanupExperienceV1();}
function previewGift(){stopPreviewAudio();previewGiftV1();}
function renderScene(){renderSceneCore();updateUnlockTray();embedNudge();}
function renderSceneCore(){
 const type=scenes[sceneIndex],t=THEMES[gift.vibe];
 if(occasionKey(gift)==='birthday')partyNight(type==='hbd');
 if(gift.occasion==='wedding'&&type!=='invite'&&type!=='celebration')removeWeddingPlayer();
 if(renderOccasionScene(type))return;
 if(type==='choice'){const s=$('#storyScene');s.className='story-scene choice-scene';const memoryFirst=gift.vibe==='Emotional'&&gift.memories.length; s.innerHTML=`${sceneTitle('Follow your<br><em>little curiosity.</em>','This bit is up to you')}<p class="story-description">Two little things, both yours.<br>Which one are we opening first?</p><div class="branch-choices"><button class="branch-choice" data-v2="choose-path" data-path="wrapped"><span>✦</span>Your Birthday Wrapped<small>For the happily curious</small></button><button class="branch-choice" data-v2="choose-path" data-path="${memoryFirst?'memories':'message'}"><span>${memoryFirst?'☁':'♡'}</span>${memoryFirst?'A memory of us':'The words inside'}<small>For the sentimental heart</small></button></div><p class="story-footnote">No wrong turns. You won’t miss a thing.</p>`;$('#storyScroll').scrollTop=0;$('#storyProgress').innerHTML='';$('#storyAnnouncement').textContent='Choose what to open first. Both are waiting for you.';$('h1',s)?.focus({preventScroll:true});return;}
 renderSceneV1();const s=$('#storyScene');
 if(type==='opening'){$('.story-title',s).innerHTML=t.opening;$('.story-eyebrow',s).textContent='A little world. Just for '+gift.name+(gift.sender?', from '+gift.sender:'')+'.';s.insertAdjacentHTML('beforeend','<p class="lighting-caption" id="lightingCaption">First, a spark. Then, the whole little room.</p>');if(occasionKey(gift)==='birthday')birthdayOpening(s);}
 if(type==='birthday'){$('.story-description',s).textContent=t.birthday;$('.birthday-heart',s).textContent=t.symbol;}
 if(type==='cake'){$('.story-title',s).innerHTML=`Happy Birthday,<span class="name-line${gift.name.length>18?' long-name':''}"><em>${e(gift.name)}.</em></span>`;$('.story-eyebrow',s).textContent='Now, make a wish';s.insertAdjacentHTML('afterbegin','<svg class="birthday-garland" viewBox="0 0 180 50" fill="none" aria-hidden="true"><path d="M6 14q85 50 169 0" stroke="#d88c51" stroke-width=".9"/><path d="m20 20 18 8-15 15 0-12Zm34 13 18 4-9 16-4-13Zm35 5 18-1-8 17-5-12Zm35-5 17-5 0 21-7-11Zm32-10 14-7 4 19-11-8Z" fill="#db7d9c" opacity=".66"/></svg>');$('#cakeDescription').textContent=t.cakeNote;birthdayCakeScene(s);$('#birthdayCake').style.filter=gift.vibe==='Elegant'?'saturate(.35)':gift.vibe==='Funny'?'hue-rotate(24deg)':gift.vibe==='Crazy'?'saturate(1.2)':'none';}
 if(type==='gift'){$('.story-title',s).innerHTML=t.gift;}
 if(type==='message'){writeLetter(s);const button=$('[data-story=next]',s);if(button)button.innerHTML=(scenes[sceneIndex+1]==='gift'?'Your little gift is still waiting':scenes[sceneIndex+1]==='wrapped'?'Your Birthday Wrapped is waiting':'There’s a little more')+' '+icon('arrow');}
 if(type==='photos'){$$('.polaroid img',s).forEach((img,i)=>{const wrap=document.createElement('div');wrap.className='polaroid-media';img.before(wrap);wrap.append(img);img.style.cssText=cropStyle(gift.photos[i]);});if(occasionKey(gift)==='birthday')photoDrop(s);}
 if(type==='celebration'){
 $('.story-title',s).innerHTML=t.finalTitle;$('.story-description',s).textContent='Happy Birthday, '+gift.name+'. '+t.symbol;
 const description=$('.story-description',s);description.insertAdjacentHTML('afterend',`<p class="finale-words" aria-label="${e(t.ending)}">${t.ending.split(' ').map((w,i)=>`<span class="fw" aria-hidden="true" style="--w:${i}">${e(w)}</span>`).join(' ')}</p>${gift.photos.length&&!reducedMotion?finaleReel():gift.photos.length?`<div class="finale-montage" aria-label="A few of your favorite moments">${gift.photos.map((p,i)=>`<figure class="finale-photo" style="--delay:${i*.18}s"><div><img src="${e(p.src)}" alt="${e(p.caption||'A favorite memory')}" style="${cropStyle(p)}" referrerpolicy="no-referrer"></div></figure>`).join('')}</div>`:''}`);
 const token=experienceToken;startReel(token);finaleTimer=setTimeout(()=>{if(token!==experienceToken||scenes[sceneIndex]!=='celebration')return;sfx('fanfare');buzz([30,40,80]);confetti(gift.vibe==='Crazy'?130:gift.vibe==='Elegant'?48:95);swellMusic();},reducedMotion?0:650);decorateFinale(s);
 }
 if(type==='reply'){
 mountMessageTemplates($('#recipientReply'),'reply');
 if(gift.server&&!isPreview){
  const b=$('[data-story=prepare-reply]',s);b.dataset.v2='send-reply';delete b.dataset.story;b.innerHTML='Send my reply '+icon('heart');
  $('.reply-hint',s).id='deliveryFeedback';$('.reply-hint',s).setAttribute('role','status');$('.reply-hint',s).innerHTML='It goes straight to '+e(gift.occasion==='wedding'?(coupleOf(gift)||gift.name):gift.sender||'the person who made this')+', privately.<br>Nothing is sent until you choose to.';
 }
 }
 if(type==='reply'&&reportLink())s.insertAdjacentHTML('beforeend','<p class="report-line">'+reportLink()+'</p>');
 adaptOccasionScene(type,s);
}
/* The letter writes itself, word by word, in about three seconds however long it is, and can be read as it appears. */
function writeLetter(s){
 const el=$('.letter-text',s);if(!el||reducedMotion||gift.motion===false)return;
 const words=el.textContent.split(/(\s+)/),total=words.filter(w=>w.trim()).length,step=Math.min(55,3200/Math.max(total,1));let n=0;
 el.innerHTML=words.map(w=>w.trim()?`<span class="lw" style="--d:${Math.round(n++*step)}ms">${e(w)}</span>`:e(w)).join('');sfx('page');
}
function choosePath(path){if(transitionBusy||scenes[sceneIndex]!=='choice')return;const pos=scenes.indexOf(path,sceneIndex+1);if(pos<0)return;scenes.splice(pos,1);scenes.splice(sceneIndex+1,0,path);chime();goToScene(sceneIndex+1);}
async function lightUp(quick=false){
 if(transitionBusy||scenes[sceneIndex]!=='opening')return;
 if(gift.occasion==='wedding')return openWeddingEnvelope(quick===true);
 const token=experienceToken,exp=$('#experience');transitionBusy=true;ensureAudio();enableTilt(true);
 const trigger=$('#lightTrigger');if(trigger)trigger.disabled=true;
 const birthday=occasionKey(gift)==='birthday';
 if(birthday&&quick!==true){await birthdayCountdown(token);if(token!==experienceToken)return;}
 exp.classList.add('sparked');sfx('spark');buzz(18);
 const caption=$('#lightingCaption');if(caption)caption.textContent=gift.vibe==='Funny'?'Oh good. We paid the electricity bill.':'There it is. Your first little light.';
 await sleep(650);if(token!==experienceToken)return;
 exp.classList.add('lit','lighting');sfx('glow');buzz([10,40,24]);startMusic();$('meta[name="theme-color"]').content='#f9e3db';
 await sleep((birthday?700:1750)*THEMES[gift.vibe].speed);if(token!==experienceToken)return;
 exp.classList.remove('lighting');sceneIndex=1;renderScene();transitionBusy=false;
}
async function blowCandles(){
 const cake=$('#birthdayCake');if(!cake||cake.classList.contains('extinguished'))return;
 cake.classList.add('extinguished');cake.disabled=true;stopBlowing();sfx('whoosh');buzz(30);
 const token=experienceToken;$('#blowMic').hidden=true;$('#cakeInstruction').textContent='A little wish, tucked into the dark. ♡';
 $('.story-title',$('#storyScene')).innerHTML=gift.vibe==='Funny'?'Excellent blowing.<br><em>Very professional.</em>':'Keep it <em>close.</em>';
 $('#cakeDescription').textContent=gift.vibe==='Crazy'?'Your outrageous wish has been submitted to the universe.':'Some wishes don’t need to be said out loud.';
 const exp=$('#experience');exp.classList.add('candle-pause');duckMusic(true);await sleep(1000);if(token!==experienceToken)return;
 exp.classList.remove('candle-pause');duckMusic(false);sfx('fanfare');buzz([25,40,70]);ring(cake);confetti(gift.vibe==='Crazy'?120:80,originOf(cake));balloons();
 await sleep(500);if(token!==experienceToken||scenes[sceneIndex]!=='cake')return;
 const after={choice:'A little curiosity next',photos:'Look what I kept 📸',wrapped:'Your Birthday Wrapped ✨',gift:'Now, your little gift'}[scenes[sceneIndex+1]]||'There’s a little more';
 $('#cakeAfter').className='wish-success';$('#cakeAfter').innerHTML=(occasionKey(gift)==='birthday'?'<p class="wish-sealed">Wish sealed 🤫</p>':'')+softNext(after);autoAdvance(2600,'cake');
}
async function openPresent(){
 const box=$('#birthdayGift');if(!box||box.classList.contains('opened'))return;
 box.classList.add('opened');box.disabled=true;const token=experienceToken;sfx('pop');buzz(20);ring(box);
 $('#giftInstruction').textContent='The best things don’t fit in a box. ♡';
 await sleep(280);if(token!==experienceToken)return;sfx('fanfare');buzz([20,30,50]);confetti(85,originOf(box));
 await sleep(1000);if(token!==experienceToken||scenes[sceneIndex]!=='gift')return;
 const next=scenes[sceneIndex+1];
 $('#giftAfter').innerHTML=softNext(next==='message'?'Read your little note':next==='memories'?'A few pieces of our story':next==='photos'?'Look what I kept':'There’s a little more');autoAdvance(1100,'gift');
}
function renderFun(){
 if(gift.occasion!=='birthday'&&gift.fun==='quiz'&&!(gift.quizQuestion.trim()&&gift.quizAnswer.trim()))return `${sceneTitle('A very little question.<br><em>An easy little answer.</em>','This little world has a favorite person')}<p class="story-description">Who is this little world made for?</p><div class="quiz-options">${[gift.name,gift.name+', of course','Wonderfully '+gift.name].map((t,i)=>`<button class="quiz-option" data-quiz="${i}">${e(t)}</button>`).join('')}</div><div id="funAfter"></div>`;
 if(gift.fun==='gifts')return `${sceneTitle('Three little ribbons.<br><em>Follow your instinct.</em>','A tiny birthday mystery')}<p class="story-description">Pick the one that calls your name.<br>They all have a little love inside.</p><div class="choose-gifts">${['The shy one','The sparkly one','The wild card'].map((label,i)=>`<button class="mini-present" data-v2="pick-gift" data-pick="${i}" aria-label="Open mystery gift ${i+1}">${giftSVG('mystery-'+i)}<span>${label}</span></button>`).join('')}</div><div id="funAfter" aria-live="polite"></div>`;
 if(gift.fun==='quiz'&&gift.quizQuestion.trim()&&gift.quizAnswer.trim()){const answers=[gift.quizAnswer,...[0,1].map(i=>gift.quizOptions[i]?.trim()||['On the moon','In another lifetime'][i])];const r=seeded(gift.id+gift.quizQuestion);const shuffled=answers.map((label,i)=>({label,right:i===0,sort:r()})).sort((a,b)=>a.sort-b.sort);return `${sceneTitle('A tiny question.<br><em>A little piece of us.</em>','You might know this one')}<p class="story-description">${e(gift.quizQuestion)}</p><div class="quiz-options">${shuffled.map(a=>`<button class="quiz-option" data-v2="custom-quiz" data-right="${a.right}">${e(a.label)}</button>`).join('')}</div><p id="quizHint" class="vibe-aside" role="status"></p><button class="mic-btn" data-v2="reveal-quiz">Give me a little hint</button><div id="funAfter"></div>`;}
 return renderFunV1();
}
function customQuiz(button){if(button.dataset.right!=='true'){button.disabled=true;$('#quizHint').textContent='A lovely guess. Try one more — I’m rooting for you.';chime('pop');return;}$$('.quiz-option').forEach(b=>b.disabled=true);button.classList.add('chosen');$('#quizHint').textContent='That’s our little story. You remembered. ♡';$('#funAfter').innerHTML=(gift.funMessage?'<p class="vibe-aside">'+e(gift.funMessage)+'</p>':'')+storyButton('Keeping this one close');chime('wish');}
function pickMystery(button){if($('.mini-present.picked'))return;button.classList.add('picked','opened');$$('.mini-present').forEach(b=>b.disabled=true);const notes=['A thousand invisible hugs. Redeem whenever you need one.','One whole year of little reasons to smile. Starting right here.','Permission to be completely, wonderfully, unapologetically you.'];$('#funAfter').innerHTML=`<p class="final-surprise-note">${e(gift.funMessage||notes[+button.dataset.pick])}</p>${storyButton('Best kind of little surprise')}`;chime('wish');confetti(40);}
/* The ending: their photos, one after another, slowly drifting, while the last words appear. */
function finaleReel(){
 return `<div class="finale-reel" role="img" aria-label="A few of your favorite moments, one after another">${gift.photos.map((p,i)=>`<figure class="reel-item${i===0?' on':''}"><div class="reel-frame"><div class="reel-pan"><img src="${e(p.src)}" alt="" style="${cropStyle(p)}" referrerpolicy="no-referrer"></div></div>${p.caption?`<figcaption>${e(p.caption)}</figcaption>`:''}</figure>`).join('')}</div>`;
}
function startReel(token){
 clearInterval(reelTimer);$$('.reel-item img').forEach(img=>img.addEventListener('error',()=>img.closest('.reel-item')?.remove(),{once:true}));const items=$$('.reel-item');if(items.length<2)return;let at=0;
 reelTimer=setInterval(()=>{if(token!==experienceToken||document.hidden)return;items[at].classList.remove('on');at=(at+1)%items.length;items[at].classList.add('on');},3400);
}
function swellMusic(){if(soundMuted||gift.music==='none')return;const token=experienceToken,base=gift.volume??.24;if(musicAudio){musicAudio.volume=Math.min(.65,base*1.25);setTimeout(()=>{if(token===experienceToken&&musicAudio)musicAudio.volume=base;},2000);}if(gift.music!=='custom'){[261.63,329.63,392,523.25].forEach((f,i)=>tone(f*THEMES[gift.vibe].transpose,i*.12,2.5,base*.24,'sine',true));}}
function startMusic(){startMusicV1();if(musicAudio)musicAudio.volume=musicDucked?musicBase()*.23:musicBase();}
function duckMusic(duck){musicDucked=duck;if(musicAudio)musicAudio.volume=musicBase()*(duck?.23:1);if(ragaBus&&audioContext)ragaBus.gain.setTargetAtTime(duck?.25:1,audioContext.currentTime,.2);}
function stopTilt(){if(tiltHandler)window.removeEventListener('deviceorientation',tiltHandler);tiltHandler=null;tiltEnabled=false;$('[data-v2=tilt]')?.setAttribute('aria-pressed','false');$('#experience')?.style.removeProperty('--mx');$('#experience')?.style.removeProperty('--my');}
async function enableTilt(silent=false){if(reducedMotion||!gift?.motion)return;tiltEnabled=true;$('[data-v2=tilt]')?.setAttribute('aria-pressed','true');if(!silent)toast('Tilt active. A tiny room, following you.');if(tiltHandler)return;try{if(typeof DeviceOrientationEvent==='undefined')return;if(typeof DeviceOrientationEvent.requestPermission==='function'&&await DeviceOrientationEvent.requestPermission()!=='granted')return;tiltHandler=ev=>{if(currentView!=='experience'||document.hidden||!tiltEnabled)return;$('#experience')?.style.setProperty('--mx',clamp((ev.gamma||0)/5,-8,8,0)+'px');$('#experience')?.style.setProperty('--my',clamp(((ev.beta||35)-35)/7,-7,7,0)+'px');};window.addEventListener('deviceorientation',tiltHandler,{passive:true});}catch{}}
function toggleTilt(){if(tiltEnabled){stopTilt();toast('Tilt paused.');}else{enableTilt(false);}}
/* A real postbox when connected; a genuinely portable gift when not. */
function buildGiftURL(encoded){const base=new URL(location.href);if(/^\/(g|for)\//.test(base.pathname))base.pathname='/';base.hash='gift='+encoded;return base.href;}
function recoveryURL(entry){const base=new URL(location.href);base.pathname='/';base.search='';base.hash='edit='+entry.id+'.'+entry.key;return base.href;}
function makeCover(g){
 if(g.occasion==='wedding')return weddingCover(g);
 const c=document.createElement('canvas');c.width=1200;c.height=630;const x=c.getContext('2d');if(!x)return '';
 const bg=x.createLinearGradient(0,0,1200,630);bg.addColorStop(0,'#fef5e8');bg.addColorStop(1,g.vibe==='Elegant'?'#f6e8c8':'#fbd8d0');x.fillStyle=bg;x.fillRect(0,0,1200,630);
 x.strokeStyle='#f0ac8b';x.lineWidth=1.2;x.strokeRect(24,24,1152,582);
 x.fillStyle='#fff7ed';x.beginPath();x.roundRect(315,68,570,640,[285,285,0,0]);x.fill();
 const glow=x.createRadialGradient(600,120,10,600,170,450);glow.addColorStop(0,'#ffecb544');glow.addColorStop(1,'#ffecb500');x.fillStyle=glow;x.fillRect(0,0,1200,630);
 x.beginPath();x.moveTo(-20,15);x.bezierCurveTo(220,90,410,155,620,72);x.bezierCurveTo(870,-20,1020,80,1220,30);x.strokeStyle='#c1985e';x.stroke();
 for(let i=0;i<18;i++){const px=25+i*68,py=50+Math.sin(i*.4)*30;x.strokeStyle='#c1985e';x.beginPath();x.moveTo(px,py-10);x.lineTo(px,py+7);x.stroke();x.fillStyle='#ffd06f';x.shadowColor='#ffca5e';x.shadowBlur=19;x.beginPath();x.ellipse(px,py+12,5,9,0,0,Math.PI*2);x.fill();}x.shadowBlur=0;
 x.fillStyle='#b84167';x.textAlign='center';x.font='14px Arial';x.fillText('A LITTLE WORLD, JUST FOR YOU',600,189);
 x.fillStyle='#67464c';x.font='italic 58px Georgia';if(x.measureText(occasionOf(g).greeting).width>790)x.font='italic 44px Georgia';x.fillText(occasionOf(g).greeting,600,267);
 const name=g.sharePreview!==false?g.name:'lovely you';let size=88;x.font=`${size}px Georgia`;while(x.measureText(name).width>790&&size>34){size-=2;x.font=`${size}px Georgia`;}x.fillStyle=g.vibe==='Elegant'?'#af883a':'#ca366f';x.fillText(name,600,365);
 x.font='24px Georgia';x.fillText(occasionOf(g).symbol,600,407);x.font='italic 21px Georgia';x.fillStyle='#b36453';x.fillText('Open this when you have a quiet moment.',600,453);
 // A slightly wonky balloon, a small ribbon, and a tiny birthday cake.
 if(g.occasion==='birthday'){for(const [px,py,color,angle]of [[141,322,'#eab4bd',-.15],[1060,264,'#eacf94',.14]]){x.save();x.translate(px,py);x.rotate(angle);x.fillStyle=color;x.beginPath();x.ellipse(0,0,44,58,0,0,Math.PI*2);x.fill();x.strokeStyle='#d6975d';x.beginPath();x.moveTo(0,58);x.bezierCurveTo(-15,115,22,113,9,160);x.stroke();x.restore();}
 x.fillStyle='#f1aaaa';x.beginPath();x.roundRect(553,518,94,47,[8,8,10,10]);x.fill();x.fillStyle='#fff8e7';x.beginPath();x.ellipse(600,519,47,10,0,0,Math.PI*2);x.fill();x.fillStyle='#f0ac50';x.fillRect(597,492,6,25);x.fillStyle='#ffbb5d';x.beginPath();x.ellipse(600,484,5,9,0,0,Math.PI*2);x.fill();x.strokeStyle='#d88791';x.beginPath();x.moveTo(544,569);x.lineTo(656,569);x.stroke();}else{
  // A small wax-sealed envelope: the share image never reveals the question or note.
  x.save();x.translate(600,534);x.rotate(-.04);x.fillStyle='#fde2cd';x.strokeStyle='#e09e7e';x.lineWidth=1.3;x.beginPath();x.roundRect(-65,-27,130,64,4);x.fill();x.stroke();x.beginPath();x.moveTo(-64,-25);x.lineTo(0,16);x.lineTo(64,-25);x.stroke();x.fillStyle=g.occasion==='apology'?'#ff6f91':'#de6e94';x.beginPath();x.arc(0,15,11,0,Math.PI*2);x.fill();x.restore();
  x.font='38px Georgia';x.fillStyle='#dfa577';x.fillText(occasionOf(g).symbol,165,340);x.fillText(occasionOf(g).symbol,1035,290);
 }
 x.font='italic 28px Georgia';x.fillStyle='#be466f';x.textAlign='left';x.fillText('kholona ♡',53,581);x.textAlign='right';x.font='12px Arial';x.fillStyle='#bb7c66';x.fillText('A SMALL LINK. BIG FEELINGS.',1142,578);
 return c.toDataURL('image/jpeg',.84);
}
/* One cover per gift version: drawing it takes a noticeable moment on a phone, so it is not redrawn for the same gift. */
let coverMemo={k:'',v:''};
function coverFor(g){const k=JSON.stringify([g.id,g.name,g.vibe,g.occasion,g.proposalKind,g.character,g.partner,g.weddingDate,g.city,g.sharePreview]);if(coverMemo.k!==k)coverMemo={k,v:makeCover(g)};return coverMemo.v;}
/* Hosted mode: upload embedded photos/audio/cover to Storage first, so the publish request stays tiny
   (serverless platforms cap request bodies at a few MB). Already-hosted URLs pass through untouched. */
/* Media goes up as soon as it is added (photos) and all at once at Create, so pressing Create waits for almost nothing.
   Uploads are keyed by the gift id they were made for and the file itself, so a retry or a second Create reuses them. */
const mediaUploads=new Map();
function uploadMedia(id,key,dataUri,kind){
 const k=id+'|'+kind+'|'+dataUri.length+'|'+dataUri.slice(-64);
 if(!mediaUploads.has(k))mediaUploads.set(k,api('/api/gifts/'+id+'/media',{method:'POST',key,body:{dataUri,kind}}).then(r=>r.url).catch(err=>{mediaUploads.delete(k);throw err;}));
 return mediaUploads.get(k);
}
/* The id and key a new gift will be created with, made early so its photos can start uploading before Create is pressed. */
function pendingOwner(){
 if(editing?.mode==='hosted')return editing;
 if(!backendReady||!paymentsRequired&&delivery!=='hosted')return null;
 if(!publishAttempt)publishAttempt={id:hexToken(12),key:hexToken(32)};
 return publishAttempt;
}
function preupload(dataUri,kind){const owner=pendingOwner();if(owner&&dataUri.startsWith('data:'))uploadMedia(owner.id,owner.key,dataUri,kind).catch(()=>{});}
async function offloadMedia(id,key,g){
 const out=JSON.parse(JSON.stringify(g)),jobs=[];
 out.photos.forEach(p=>{if(p.src.startsWith('data:'))jobs.push(uploadMedia(id,key,p.src,'image').then(url=>{p.src=url;}));});
 if(out.voice.startsWith('data:'))jobs.push(uploadMedia(id,key,out.voice,'audio').then(url=>{out.voice=url;}));
 if(out.musicSrc.startsWith('data:'))jobs.push(uploadMedia(id,key,out.musicSrc,'audio').then(url=>{out.musicSrc=url;}));
 await Promise.all(jobs);return {gift:out};
}
/* The link-preview image is only needed once the link is shared, so it is drawn and uploaded after the gift exists, in the
   background. The server attaches it to the gift (app/api/gifts/[id]/media). */
function uploadCoverLater(id,key,g){
 if(g.sharePreview===false)return;
 setTimeout(()=>{try{const cover=coverFor(g);if(cover)uploadMedia(id,key,cover,'cover').catch(()=>{});}catch{}},400);
}
async function publishGift(){
 if(publishing||!validateForm())return;publishing=true;stopPreviewAudio();const btn=$('#createGiftBtn');btn.disabled=true;btn.textContent='Tying the little ribbon…';
 try{
 const g=collectGift();g.version=3;const mode=editing?.mode==='hosted'?'hosted':paymentsRequired?'hosted':delivery;btn.textContent='Making '+g.name+'’s gift…';
 if(mode==='hosted'){
 if(!backendReady)throw new Error(paymentsRequired?'Gifts are created online. Check your connection and try again.':'The gift server is not connected. Choose standalone mode to make a gift file.');if(!backendOccasions.includes(g.occasion))throw new Error('This gift server needs the v3 update for '+occasionOf(g).label.toLowerCase()+'. Choose standalone to export this gift, or update the server.');
 if(editing?.mode==='hosted'){
 const media=await offloadMedia(editing.id,editing.key,g);
 const data=await api('/api/gifts/'+editing.id,{method:'PATCH',key:editing.key,body:{gift:media.gift,revision:editing.revision,...($('#expiryDays').dataset.changed==='true'?{expiresDays:+$('#expiryDays').value}:{}),...opensAtBody(false)}});
 publishedGift=sanitizeGift(data.gift);publishedURL=data.url;publishedStatus=data.status||'paid';publishedExpiresAt=data.expiresAt||'';setOpensAt(data.opensAt);editing.revision=data.revision;
 rememberGift({...editing,name:g.name,partner:g.partner||'',vibe:g.vibe,occasion:g.occasion,url:data.url,expiresAt:data.expiresAt,waiting:publishedStatus==='preview'});uploadCoverLater(editing.id,editing.key,publishedGift);
 }else{
 // Keep these values after a network failure, so retrying does not duplicate gifts.
 if(!publishAttempt)publishAttempt={id:hexToken(12),key:hexToken(32)};
 await store('pending-create',{...publishAttempt,gift:g}).catch(()=>{});
 const media=await offloadMedia(publishAttempt.id,publishAttempt.key,g);
 const data=await api('/api/gifts',{method:'POST',body:{id:publishAttempt.id,editKey:publishAttempt.key,gift:media.gift,expiresDays:+$('#expiryDays').value,...opensAtBody(true)}});
 publishedGift=sanitizeGift(data.gift);publishedURL=data.url;publishedStatus=data.status||'paid';publishedExpiresAt=data.expiresAt||'';setOpensAt(data.opensAt);editing={id:publishedGift.id,key:publishAttempt.key,revision:data.revision,mode:'hosted'};
 rememberGift({...editing,name:g.name,partner:g.partner||'',vibe:g.vibe,occasion:g.occasion,url:data.url,expiresAt:data.expiresAt,waiting:publishedStatus==='preview'});uploadCoverLater(editing.id,editing.key,publishedGift);publishAttempt=null;await removeStored('pending-create').catch(()=>{});
 }
 }else{
 publishedStatus='paid';publishedGift={...g,id:hexToken(12),server:false};const encoded=await encodeGift(publishedGift);const candidate=buildGiftURL(encoded);publishedURL=candidate.length<=8000?candidate:'';
 await store('gift:'+publishedGift.id,publishedGift).catch(()=>{toast('This browser cannot keep this gift. Download its HTML before closing.');});editing={mode:'portable',id:publishedGift.id};rememberGift({id:publishedGift.id,name:g.name,partner:g.partner||'',vibe:g.vibe,occasion:g.occasion,mode:'portable',url:publishedURL});
 }
 await store('lastGift',publishedGift).catch(()=>{});try{if(g.sender)localStorage.setItem('kholona.sender',g.sender);}catch{}showShare();saveDraft();
 }catch(err){toast(err.message||'The ribbon got tangled. Your draft is still here.');}finally{publishing=false;btn.disabled=false;btn.innerHTML=createLabel();}
}
function showShare(){
 if(!publishedGift)return;showShareV1();const isHosted=publishedGift.server,tooLarge=!publishedURL;
 const wedShare=publishedGift.occasion==='wedding';$('.share-view h2').innerHTML=wedShare?`Your invite is<br><em>ready.</em>`:`It’s ready for<br><em>${e(publishedGift.name)}.</em>`;
 $('.share-view>.eyebrow').textContent=wedShare?'Ready for your guests':'Sealed with a little love';$('.link-label>span').textContent=wedShare?'One link for every guest':'One link. A whole little world.';
 $('#shareLead').textContent=occasionOf(publishedGift).whisper;$('#shareArt').innerHTML=occasionArt(occasionArtFor(publishedGift),'share-occasion');$('#shareCover').alt=occasionOf(publishedGift).label+' share artwork';
 $('#giftLink').value=publishedURL||'Your media-rich gift is ready as an HTML file.';$('#giftLink').disabled=tooLarge;$('#copyGiftLink').disabled=tooLarge;$('#whatsappGift').disabled=tooLarge||!publicHosting();
 $('#linkSize').textContent=isHosted?'A small link. Every lovely detail included.':tooLarge?'Wrapped as a gift file · all uploaded media included':'Standalone gift · carried inside the link';
 $('#sizeWarning').hidden=!tooLarge;$('#sizeWarning').innerHTML='<strong>More love than fits in a link.</strong> This gift contains photos or audio. Use <strong>Download gift HTML</strong> and send it as a document, or use the server-backed version for a short web link. Nothing has been uploaded in standalone mode.';
 if(isHosted)$('#sizeWarning').hidden=true;
 $('.share-privacy').innerHTML=isHosted?'Your gift is stored on this gift server. Anyone with its link can open it.<br>Keep the private recovery link to edit, see replies, or remove it.':tooLarge?'Your gift is wrapped in the HTML file. Share it with someone you trust.<br>No server inbox, opening counts, or link expiry.':'Your gift travels inside its link. Anyone with the link can open it.<br>No server inbox, opening counts, or link expiry.';
 if(isHosted&&!publicHosting())$('#hostingWarning').innerHTML='<strong>Your gift is still at home.</strong> This gift is on your local server, so its URL will not open on another device. Deploy the complete project on a public HTTPS domain and create your gift there. Or use <strong>Download gift HTML</strong> and send the file itself.';
 $('#nativeShareGift').hidden=!publishedURL;$('#nativeShareGift').disabled=!publicHosting();
 coverData=coverFor(publishedGift);$('#shareCover').src=coverData;$('#shareCover').hidden=!coverData;
 const entry=libraryCache.find(v=>v.id===publishedGift.id);
 $('#ownerNote').innerHTML=isHosted&&entry?`<strong>Save your private edit link.</strong><br>Your recipient link opens the surprise. Your private edit link lets you change it, see replies, or remove it. Keep it to yourself.<br><button data-v2="copy-recovery" data-id="${entry.id}">Copy my private edit link</button>`:'<strong>Beautifully portable.</strong><br>Your gift file opens without this website. Uploaded photos and audio go with it. External media links still need the internet.<br><button data-v2="library">Back to my little gifts</button>';
 applyShareLock();renderScheduledNote();renderGuestLinks();
}
/* Landing pieces that depend on the payments setting: the "pay only when you send it" promise and an honest price strip. */
function updatePaymentsUI(){
 for(const el of $$('[data-pay-only]'))el.hidden=!paymentsRequired;
 let strip=$('#priceStrip');
 if(!paymentsRequired||!priceText()){strip?.remove();return;}
 if(!strip){$('#how-it-works').insertAdjacentHTML('beforebegin','<section class="price-strip" id="priceStrip" aria-labelledby="priceStripTitle"></section>');strip=$('#priceStrip');}
 strip.innerHTML=`<div class="price-strip-copy"><h2 id="priceStripTitle">Free to build. ${e(priceText())} to send.</h2><p>Make it, preview it and change it as often as you like. You pay once, only when you are ready to send it.</p><ul><li>One-time, no subscription</li><li>The link stays live for ${lifeText(payLinkDays)}</li><li>Their reply comes back to you, privately</li></ul></div><div class="price-strip-cta"><button type="button" class="btn btn-primary pulse-cta" data-action="create">Make a gift</button><small>Once a gift is unlocked the payment is not refundable, which is why previewing is free.</small></div>`;
}
/* Someone who started a gift and left finds it waiting: a fixed card (so it never shifts the page). */
function updateResumeBanner(){
 const b=$('#resumeBanner');if(!b)return;
 let dismissed=false;try{dismissed=sessionStorage.getItem('luv4u.resume.dismissed')==='1';}catch{}
 /* A saved gift that is waiting to be unlocked outranks an unfinished draft: it is the closer one to done. */
 const waiting=libraryCache.find(v=>v.mode==='hosted'&&v.waiting===true&&v.key&&(!v.expiresAt||new Date(v.expiresAt).getTime()>Date.now()));
 if(waiting&&currentView==='home'&&!dismissed){
  const left=Math.max(0,Math.ceil((new Date(waiting.expiresAt||0).getTime()-Date.now())/86400000)),nm=e(waiting.name||'Their');
  b.dataset.on='1';b.classList.add('show');b.inert=false;
  b.innerHTML=`<span class="resume-copy"><strong>${nm}’s gift is waiting</strong><span>Saved, but not unlocked yet.${waiting.expiresAt?(left<=1?' Kept for about a day more.':' Kept for '+left+' more days.'):''}</span></span><button type="button" class="resume-btn" data-v3="unlock-saved" data-id="${e(waiting.id)}">Finish</button><button type="button" class="resume-close" data-v3="resume-dismiss" aria-label="Dismiss">×</button>`;
  return;
 }
 const name=draft.name.trim(),show=!!name&&currentView==='home'&&!dismissed;
 b.dataset.on=show?'1':'';b.classList.toggle('show',show);b.inert=!show;
 if(!show)return;
 const o=occasionOf(draft),key=occasionKey(draft);
 b.innerHTML=`<span class="resume-copy"><strong>${e(o.short)} for ${e(name)}</strong><span>Saved on this device. Pick up where you left off.</span></span><a class="resume-btn" href="#make=${e(key)}" data-choose-occasion="${e(key)}">Continue</a><button type="button" class="resume-close" data-v3="resume-dismiss" aria-label="Dismiss">×</button>`;
}
/* ---- Paywall: everything shown here is true (real deletion date, real price and terms). ---- */
/* Creator referrals: a code from a creator's link (?ref= or the kholona_ref cookie) or typed in. The server checks it and sets the price. */
let payRef=null,payRefRemoved=false;const REF_KEY='kholona.ref',REF_CODE=/^[A-Z0-9]{3,20}$/;
function savedRefCode(){try{const v=JSON.parse(localStorage.getItem(REF_KEY)||'null');if(v&&Date.now()-v.t<30*86400000&&REF_CODE.test(v.code))return v.code;}catch{}const m=document.cookie.match(/(?:^|; )kholona_ref=([A-Za-z0-9]{3,20})/);return m?m[1].toUpperCase():'';}
function rememberRef(code){try{localStorage.setItem(REF_KEY,JSON.stringify({code,t:Date.now()}));}catch{}try{document.cookie='kholona_ref='+code+'; Max-Age='+30*86400+'; Path=/; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');}catch{}}
function forgetRef(){try{localStorage.removeItem(REF_KEY);}catch{}try{document.cookie='kholona_ref=; Max-Age=0; Path=/';}catch{}}
try{const c=(new URLSearchParams(location.search).get('ref')||'').trim().toUpperCase();if(REF_CODE.test(c))rememberRef(c);}catch{}
/* What the checkout is told: the applied code, nothing if the buyer removed it, else whatever the creator link left behind. */
const refBody=()=>({ref:payRef?payRef.code:payRefRemoved?'':savedRefCode()});
const fullPriceText=()=>basePrice()?'₹'+basePrice().toLocaleString('en-IN'):'';
/* The wedding invite has its own price (config payments.prices); the gifts share payPrice. */
let payPrices={},campaignOccasion='';
const basePrice=()=>{const o=currentView==='home'?campaignOccasion:(currentView==='share'?publishedGift:currentView==='experience'?gift:draft)?.occasion;return Number(payPrices[o])||payPrice;};
const priceText=()=>payRef?.free?'Free':basePrice()?'₹'+Math.max(1,basePrice()-(payRef?.discount||0)).toLocaleString('en-IN'):'';
function refBoxHtml(){
 if(payRef)return `<p class="ref-applied"><span aria-hidden="true">${payRef.free?'🎁':'🎟️'}</span><span>Code <strong>${e(payRef.code)}</strong> applied · ${payRef.free?'nothing to pay':'₹'+e(String(payRef.discount))+' off'}</span><button type="button" id="refRemove">Remove</button></p>`;
 return `<details class="ref-entry" id="refEntry"><summary>Have a code?</summary><div class="ref-form"><input id="refInput" maxlength="20" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. PRIYA" aria-label="Creator or gift code"><button type="button" id="refApply">Apply</button></div><p class="ref-msg" id="refMsg" role="status" hidden></p></details>`;
}
/* Puts the current price (and code) everywhere on the unlock card without rebuilding the preview. */
function refreshPayPrice(){
 const box=$('#refBox'),val=$('#unlockPriceVal'),go=$('#payGo');
 if(val)val.innerHTML=payRef?`<s>${e(fullPriceText())}</s> ${e(priceText())}`:e(priceText()||'Free');
 if(go&&!payBusy){const label='Unlock & get link'+(priceText()?' · '+priceText():'');go.dataset.label=label;if(!go.disabled)go.textContent=label;}
 if(!box)return;
 box.innerHTML=refBoxHtml();
 $('#refRemove')?.addEventListener('click',()=>{payRef=null;payRefRemoved=true;forgetRef();refreshPayPrice();});
 const apply=async()=>{
  const input=$('#refInput'),msg=$('#refMsg'),btn=$('#refApply'),code=(input.value||'').trim().toUpperCase();
  const say=t=>{msg.textContent=t;msg.hidden=!t;};
  if(!REF_CODE.test(code)){say('Codes are 3 to 20 letters or numbers.');return;}
  btn.disabled=true;say('Checking…');
  try{payRef=await checkRef(code);payRefRemoved=false;if(!payRef.free){rememberRef(payRef.code);track('referral_applied');}refreshPayPrice();}
  catch(ex){say(ex&&ex.status===404?'That code is not valid. Check the spelling with the creator.':'We could not check the code just now. Try again.');btn.disabled=false;}
 };
 $('#refApply')?.addEventListener('click',apply);
 $('#refInput')?.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();apply();}});
}
async function checkRef(code){const r=await api('/api/referral?code='+encodeURIComponent(code),{timeout:8000});return {code:String(r.code),discount:Number(r.discountInr)||0,free:r.free===true};}
/* A code from a creator's link is applied by itself; a code the server no longer knows is forgotten. */
function autoApplyRef(){
 if(payRef||payRefRemoved)return;const code=savedRefCode();if(!code)return;
 checkRef(code).then(r=>{payRef=r;refreshPayPrice();}).catch(ex=>{if(ex&&ex.status===404)forgetRef();});
}
function savedDaysLeft(){if(!publishedExpiresAt)return null;return Math.max(0,Math.ceil((new Date(publishedExpiresAt).getTime()-Date.now())/86400000));}
function savedLossLine(){const n=savedDaysLeft();if(n===null)return '';return n<=1?'Your saved gift is deleted within a day unless you unlock it.':`Your saved gift is kept for ${n} more days. After that it is deleted.`;}
const lifeText=days=>days>=365?'a full year':days+' days';
/* Funnel events for the payment steps (anonymous; see lib/events.ts). */
const track=(name,props)=>{try{if(window.kholonaTrack)window.kholonaTrack(name,props);}catch{}};
const inAppBrowser=/FBAN|FBAV|FB_IAB|Instagram|;\s*wv\)/i.test(navigator.userAgent||'');
/* Real, consented reviews beside the price (they come from /api/config; nothing is invented here). */
function proofHtml(){
 const r=payReviews;if(!r)return '';
 /* Show the reviews closest to this gift first (a birthday buyer sees a birthday story), then the best of the rest. */
 const norm=x=>String(x||'').toLowerCase().replace(/[^a-z]/g,''),key=norm(publishedGift?.occasion).replace('thanks','thankyou');
 const same=r.quotes.filter(q=>key&&norm(q.occasion).startsWith(key)),rest=r.quotes.filter(q=>!same.includes(q));
 const shown=[...same,...rest].slice(0,2);
 return `<section class="unlock-proof" aria-label="What senders say"><p class="proof-head"><span class="proof-stars" aria-hidden="true">★★★★★</span><strong>${e(String(r.average))}</strong> from ${e(String(r.count))} early reviews</p>${shown.map(q=>`<blockquote><p>“${e(q.quote)}”</p><footer>${e(q.name)} · ${e(q.occasion)}</footer></blockquote>`).join('')}</section>`;
}
function updatePriceLine(){const el=$('#priceLine');if(!el)return;const show=paymentsRequired&&!!priceText();el.hidden=!show;if(show)el.innerHTML=`Previewing is free. You pay <strong>${e(priceText())}</strong> once, only when you are ready to send it.`;}
function madeSummary(g,fallback=true){const parts=[];if(g.message?.trim())parts.push('your own words');if(g.photos.length)parts.push(g.photos.length+(g.photos.length===1?' photo':' photos'));if(g.voice)parts.push('a voice note');if(g.memories.some(m=>m.text.trim()))parts.push('little memories');if(g.music!=='none')parts.push('a soundtrack');return parts.length?parts.join(' · '):fallback?'A thoughtful ready-made note is tucked inside':'';}
/* A preview gift is saved and editable but its link does not open yet: show what is at stake and how to unlock it. */
function applyShareLock(){
 const locked=!!publishedGift?.server&&publishedStatus==='preview';
 let panel=$('#unlockPanel');
 if(!panel){$('.link-wrap').insertAdjacentHTML('beforebegin','<section class="unlock-panel" id="unlockPanel" aria-labelledby="unlockTitle" hidden></section>');panel=$('#unlockPanel');}
 panel.hidden=!locked;$('#shareView').classList.toggle('is-locked',locked);
 /* Unlocked: give back the tools the lock took away (the link tools are restored by showShare itself). */
 if(!locked){for(const id of ['downloadGift','qrGift'])if($('#'+id))$('#'+id).disabled=false;return;}
 const name=e(publishedGift.name),price=priceText();
 const frameKey=publishedGift.id+':'+(editing?.revision??'');
 if(panel.dataset.frame===frameKey&&panel.querySelector('#phoneFrame')&&!panel.querySelector('.pay-done')){/* nothing changed: keep the preview playing */}
 else{
 panel.dataset.frame=frameKey;payBusy=false;payPendingRef='';
 panel.innerHTML=`<ol class="unlock-steps" aria-label="Your progress"><li class="done"><span>✓</span>Made</li><li class="done"><span>✓</span>Previewed</li><li class="now" aria-current="step"><span>3</span>Unlock & send</li></ol>
<header class="unlock-head"><h2 id="unlockTitle">${publishedGift.occasion==='wedding'?'Your wedding invite is ready.':name+'’s gift is ready.'}</h2><p id="unlockText">Tap play to see exactly what ${publishedGift.occasion==='wedding'?'your guests':name} will open.</p></header>
<figure class="phone" id="phoneWrap" aria-label="Live preview of the gift">
<div class="phone-body"><span class="phone-key phone-key-a"></span><span class="phone-key phone-key-b"></span><span class="phone-key phone-key-c"></span>
<div class="phone-screen"><iframe class="phone-frame" id="phoneFrame" title="Live preview of ${name}’s gift" src="/preview-frame" loading="lazy" tabindex="0"></iframe><span class="phone-island" aria-hidden="true"></span><div class="phone-loading" id="phoneLoading" aria-hidden="true"><span>Unwrapping…</span></div>
<button type="button" class="phone-play" id="phonePlay" aria-label="${publishedGift.occasion==='wedding'?'Play your invite':`Play ${name}’s gift`}"><span class="phone-play-icon" aria-hidden="true">▶</span><span class="phone-play-text">${publishedGift.occasion==='wedding'?'Tap to play your invite':`Tap to open ${name}’s gift`}</span><span class="phone-play-sub">Turn your sound on</span></button></div></div>
<figcaption>The real thing, not a screenshot.</figcaption>
<div class="phone-tools"><button type="button" id="phoneRestart">↺ Start over</button><button type="button" id="phoneFull">⤢ Full screen</button><button type="button" data-action="edit">✎ Edit</button></div>
</figure>
<div class="unlock-rest">${madeSummary(publishedGift,false)?`<p class="unlock-made">Inside: ${e(madeSummary(publishedGift,false))}</p>`:''}
<div class="unlock-card">
<div class="unlock-price"><strong id="unlockPriceVal">${e(price||'Free')}</strong><span>one-time · no subscription</span></div>
<div class="ref-box" id="refBox"></div>
<ul class="unlock-list">${publishedGift.occasion==='wedding'?`<li>One link for every guest, plus a personal link with each guest’s name</li><li>Stays live for ${lifeText(payLinkDays)}</li><li>Guests’ blessings come back to you, privately</li><li>Change timings or venues any time, on the same link</li>`:`<li>A private link only ${name} gets, ready the moment you pay</li><li>Stays live for ${lifeText(payLinkDays)}</li><li>Their reply comes back to you, privately</li><li>Edit it any time, on the same link</li>`}</ul>
${savedLossLine()?`<p class="unlock-loss"><span aria-hidden="true">⏳</span> ${e(savedLossLine())}</p>`:''}
${paySimulated?'<p class="unlock-trust"><strong>Test mode.</strong> Nothing is charged. This only shows how paying will work.</p>':payTestMode?'<p class="unlock-trust"><strong>Test mode.</strong> Pay with Razorpay’s test card or test UPI. No real money moves.</p>':''}
</div>
<div class="unlock-cta">
<p class="pay-error" id="payError" role="alert" hidden></p>
<p class="pay-status" id="payStatus" role="status" hidden></p>
<button type="button" class="btn btn-primary pulse-cta pay-btn" id="payGo" data-v3="unlock" data-label="Unlock & get link${price?' · '+e(price):''}">Unlock & get link${price?' · '+e(price):''}</button>
${paySimulated||payTestMode?'':'<p class="pay-methods"><span aria-hidden="true">🔒</span> Secure payment · UPI, cards, netbanking</p>'}
</div>
${proofHtml()}
<details class="unlock-faq"><summary>What happens after I pay?</summary><p>Your private link appears right away. Send it on WhatsApp or anywhere. ${name} opens it with no account and no app.</p></details>
<details class="unlock-faq"><summary>What if the payment fails?</summary><p>Nothing unlocks and your gift stays saved, so you can try again or use another method. If your bank shows a debit anyway, it is returned automatically, usually in 5–7 working days. If a payment goes through but the page doesn’t update, the gift unlocks on its own within minutes. <a href="/contact">Still stuck? Write to us.</a></p></details>
<details class="unlock-faq"><summary>Can I change it after paying?</summary><p>Yes. Edit the words, photos or music any time and the same link shows the new version.</p></details>
<p class="unlock-note">Previewing is free, so look as often as you like. Once a gift is unlocked, the payment is not refundable. <a href="/refund">Refund details</a></p></div>`;
setTimeout(welcomeBack,0);
 refreshPayPrice();autoApplyRef();
 fitPhone();
 $('#phonePlay').onclick=()=>{$('#phoneWrap').classList.add('is-playing');track('preview_played');try{$('#phoneFrame').contentWindow.postMessage({type:'kholona-embed-go'},location.origin);}catch{}};
 $('#phoneRestart').onclick=()=>{try{$('#phoneFrame').contentWindow.location.reload();$('#phoneLoading')?.classList.remove('is-done');}catch{}};
 track('unlock_viewed');
 /* Fetch the payment window now, so the button opens it at once instead of after a wait. */
 if(payProvider==='razorpay'&&!paySimulated)loadRazorpay().catch(()=>{});
 $('#phoneFull').onclick=()=>$('#previewPublished').click();
 }
 $('#giftLink').value='Your link appears here once it is unlocked';
 for(const id of ['giftLink','copyGiftLink','whatsappGift','downloadGift','nativeShareGift','qrGift'])if($('#'+id))$('#'+id).disabled=true;
 for(const b of $$('[data-v2="native-share"],[data-v2="share-cover"]'))b.disabled=true;
 $('#linkSize').textContent='Locked until unlocked';
 $('.share-privacy').innerHTML='Your gift is saved privately. Keep your private recovery link to edit it or come back to unlock it.';
}
/* While previewing, keep the way forward in view, and make it the main thing at the last scene (the emotional peak). */
function updateUnlockTray(){
 const exp=$('#experience');if(!exp)return;
 const preview=exp.classList.contains('preview-mode')&&paymentsRequired;
 const saved=previewReturn==='share'&&!!publishedGift?.server&&publishedStatus==='preview'&&gift?.id===publishedGift.id;
 const draftPreview=previewReturn==='creator';
 let tray=$('.unlock-tray',exp);
 if(!preview||!(saved||draftPreview)){tray?.remove();return;}
 if(!tray){exp.insertAdjacentHTML('beforeend','<aside class="unlock-tray" aria-label="Send this gift"><span class="unlock-tray-copy"></span><button type="button" class="unlock-tray-btn pulse-cta"></button></aside>');tray=$('.unlock-tray',exp);}
 /* The ending scene is the emotional peak; the optional reply screen after it comes too late. */
 const type=scenes[sceneIndex],last=type==='celebration'||type==='reply'||sceneIndex>=scenes.length-1,price=priceText(),name=e(gift.name);
 tray.classList.toggle('is-final',last);
 $('.unlock-tray-copy',tray).innerHTML=last?`<strong>${gift.occasion==='wedding'?'This is what your guests will see.':`This is what ${name} will feel.`}</strong><span>${saved?'Unlock it and send it':'Save it, then unlock it to send it'}${price?' · '+e(price)+' one-time':''}.</span>`:'<span>Preview · not sent yet</span>';
 const btn=$('.unlock-tray-btn',tray);btn.dataset.story=saved?'preview-unlock':'preview-save';
 btn.textContent=saved?(last?'Unlock & send':'Unlock')+(price?' · '+price:''):(last?'Save & continue':'Save');
}
let paySimulated=false,payProvider='',payTestMode=false;
/* Razorpay Checkout is loaded only when someone actually pays, so no other page ever talks to it. */
function loadRazorpay(){
 if(window.Razorpay)return Promise.resolve();
 return new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://checkout.razorpay.com/v1/checkout.js';s.onload=ok;s.onerror=()=>no(new Error('We could not open the payment window. Check your connection (and any ad blocker) and try again. Nothing was charged.'));document.head.append(s);});
}
/* Opens Razorpay for the order the server made. Resolves with Razorpay's proof of payment; rejects {cancelled:true} if the window is closed. */
function runRazorpay(r){
 return loadRazorpay().then(()=>new Promise((ok,no)=>{
  let settled=false,failure=null;const done=(fn,v)=>{if(settled)return;settled=true;fn(v);};
  const rz=new window.Razorpay({key:r.keyId,order_id:r.order.id,amount:r.order.amount,currency:r.order.currency,name:'Kholona',description:'A Kholona gift',theme:{color:'#d6265d'},retry:{enabled:true},modal:{confirm_close:true,ondismiss:()=>done(no,{cancelled:true,failure})},handler:resp=>done(ok,resp)});
  rz.on('payment.failed',resp=>{failure=resp&&resp.error||{};});
  rz.open();
 }));
}
/* Paying happens right on the unlock page. Every way it can go wrong ends in a message that says what happened to the money. */
let payBusy=false,payPendingRef='';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const refText=ref=>ref?' Reference: '+ref+'.':'';
function failureText(f){
 const why=f&&(f.description||f.reason)?String(f.description||f.reason).replace(/[.\s]+$/,''):'';
 return 'That payment did not go through'+(why?' ('+why+')':'')+'. Your gift is safe and nothing was unlocked. Try again, or pick another way to pay'+(inAppBrowser?' (if your UPI app did not open, enter your UPI ID, or use a card or netbanking)':'')+'. If your bank shows a debit, it is returned automatically, usually in 5–7 working days.';
}
/* Asks the server to confirm a payment. A network blip right after paying must never look like a failed payment. */
async function confirmPayment(proof,status){
 const ref=proof&&proof.razorpay_payment_id||'';let last;
 for(let attempt=0;attempt<3;attempt++){
  try{return await api('/api/gifts/'+editing.id+'/verify',{method:'POST',key:editing.key,body:proof,timeout:30000});}
  catch(ex){
   last=ex;
   if(ex.status&&ex.status<500&&ex.status!==429)throw new Error((ex.message||'We could not confirm the payment.')+' Nothing was unlocked.'+refText(ref)+' If money was taken, write to us with this reference.');
   status('Payment received. Confirming it…');await delay(1500*(attempt+1));
  }
 }
 /* Still no answer: the money may have moved. Look for it for a minute, never ask them to pay again. */
 payPendingRef=ref||'pending';
 status('Payment received. Waiting for the bank to confirm it. Please do not pay again.');
 for(let i=0;i<12;i++){await delay(5000);try{const r=await api('/api/gifts/'+editing.id+'/checkout',{method:'POST',key:editing.key,body:refBody(),credentials:true,timeout:20000});if(r.status==='paid'){payPendingRef='';return r;}}catch{}}
 throw new Error('Your payment is still being confirmed. Please do not pay again: this gift unlocks on its own as soon as it is confirmed, usually within minutes. Come back to it in a little while.'+refText(ref)+' If it is not unlocked within a day, write to us with this reference.');
}
/* Copy without any toast or alarm: some browsers only allow it from a tap, and the button covers that. */
async function copyQuiet(text){
 try{await navigator.clipboard.writeText(text);return true;}catch{}
 try{const a=document.createElement('textarea');a.value=text;a.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(a);a.select();const ok=document.execCommand('copy');a.remove();return ok;}catch{return false;}
}
function unlockDone(name){
 const panel=$('#unlockPanel');if(!panel)return;
 panel.dataset.frame='';clearPayStarted(editing.id);{const en=libraryCache.find(v=>v.id===editing.id);if(en&&en.waiting)rememberGift({...en,waiting:false});}
 panel.innerHTML=`<div class="pay-done"><span class="pay-check" aria-hidden="true">✓</span><h2 id="unlockTitle">${publishedGift.occasion==='wedding'?'Unlocked. Send it to your guests 💛':`Unlocked. ${name} can open it now.`}</h2><p id="paidNote" role="status">Getting your private link…</p><input class="link-input paid-link" id="paidLink" readonly spellcheck="false" aria-label="Your private gift link" hidden><p class="pay-error" id="payError" role="alert" hidden></p><button type="button" class="btn btn-primary pay-btn" id="payDone" disabled>One moment…</button></div>`;
 confetti(140);
 const btn=$('#payDone'),note=$('#paidNote'),box=$('#paidLink');let copied=false;
 const load=async()=>{
  btn.disabled=true;$('#payError').hidden=true;
  try{
   const owner=await api('/api/gifts/'+editing.id+'/owner',{key:editing.key});publishedStatus='paid';publishedURL=owner.url;
   box.value=owner.url;box.hidden=false;copied=await copyQuiet(owner.url);
   if(copied){toast('Link copied. Paste it into WhatsApp. ♡');sfx('pop');}
   note.textContent=copied?'Your private link is copied. Paste it into WhatsApp, or anywhere.':'Your private link is ready. Tap the button to copy it.';
   btn.textContent=copied?'Open my gift page':'Copy my link';btn.disabled=false;btn.focus();
  }catch{
   note.textContent='Your gift is unlocked.';const er=$('#payError');er.textContent='We could not load your link just now. Check your connection and press the button to try again.';er.hidden=false;btn.textContent='Try again';btn.disabled=false;
  }
 };
 btn.onclick=async()=>{
  if(!publishedURL||publishedStatus!=='paid'){await load();return;}
  if(!copied)copied=await copyQuiet(publishedURL);
  showShare();toast(copied?'Link copied. Send it with love. ♡':'Unlocked. Send it with love. ♡');
 };
 load();
}
async function startPayment(){
 if(payBusy||!editing?.key||!publishedGift?.server)return;
 const go=$('#payGo'),err=$('#payError'),note=$('#payStatus');if(!go)return;
 const name=e(publishedGift.name),label=go.dataset.label||go.textContent;
 const busy=t=>{go.disabled=true;go.classList.add('is-busy');go.textContent=t;};
 const status=t=>{note.textContent=t;note.hidden=!t;};
 const idle=()=>{go.disabled=false;go.classList.remove('is-busy');go.textContent=payPendingRef?'Check payment status':label;payBusy=false;};
 const checkout=()=>api('/api/gifts/'+editing.id+'/checkout',{method:'POST',key:editing.key,body:refBody(),credentials:true});
 payBusy=true;err.hidden=true;status('');busy('Processing…');track('pay_clicked');
 try{
  let r=await checkout();
  if(r.status!=='paid'&&payPendingRef){status('');throw new Error('Your payment is still being confirmed. Please do not pay again. This gift unlocks on its own as soon as it is confirmed.'+refText(payPendingRef!=='pending'?payPendingRef:''));}
  if(r.status!=='paid'){
   if(!r.order||!r.keyId)throw new Error('We could not start the payment. Nothing was charged.');
   if(r.meta&&window.kholonaMeta)window.kholonaMeta.fire(r.meta);
   /* The server has the final say on the code (it may have been paused since it was applied). */
   if('referral' in r)payRef=r.referral?{code:String(r.referral.code),discount:Number(r.referral.discountInr)||0}:null;
   busy('Opening payment…');markPayStarted(editing.id);track('razorpay_opened');
   let proof;
   try{proof=await runRazorpay(r);}
   catch(ex){
    if(!(ex&&ex.cancelled))throw ex;
    track(ex.failure?'payment_failed':'payment_dismissed',ex.failure&&ex.failure.code?{label:String(ex.failure.code).slice(0,40)}:{});
    /* They closed the window. If money did move (or a payment failed), say so; otherwise stay quiet. */
    const again=await checkout().catch(()=>null);
    if(again&&again.status==='paid'){unlockDone(name);return;}
    if(ex.failure){err.textContent=failureText(ex.failure);err.hidden=false;}
    else{status('No problem. Nothing was charged and '+publishedGift.name+'’s gift is still saved.'+keptLine()+' Press the button whenever you are ready.');}
    idle();return;
   }
   busy('Confirming…');
   r=await confirmPayment(proof,status);
  }
  if(r.status!=='paid')throw new Error('We could not confirm the payment. Nothing was unlocked.');
  if(r.meta&&window.kholonaMeta)window.kholonaMeta.fire(r.meta);
  /* A free code is not a sale: it is counted on its own and never reaches Meta as a purchase. */
  payPendingRef='';track(r.free?'free_code_used':'payment_succeeded');unlockDone(name);
 }catch(ex){
  status('');idle();
  err.textContent=(ex&&ex.message)||'We could not take the payment. Your gift is still saved.';err.hidden=false;
 }
}
/* Someone who opened the payment window and left (closed it, switched to their UPI app, lost the tab) gets a calm nudge when they come back. */
const payFlagKey=id=>'kholona.paystart.'+id;
function markPayStarted(id){try{localStorage.setItem(payFlagKey(id),String(Date.now()));}catch{}}
function clearPayStarted(id){try{localStorage.removeItem(payFlagKey(id));}catch{}}
function payStartedRecently(id){try{const t=Number(localStorage.getItem(payFlagKey(id)));return t>0&&Date.now()-t<48*3600*1000;}catch{return false;}}
const keptLine=()=>{const n=savedDaysLeft();return n===null?'':n<=1?' It is kept for about a day more.':' It is kept for '+n+' more days.';};
/* Asks the server (which also looks for money that moved while we were away). Unlocks the page if it did. */
async function recheckPayment(){
 if(payBusy||!editing?.key||!publishedGift?.server||publishedStatus!=='preview'||$('#unlockPanel')?.hidden)return false;
 try{const r=await api('/api/gifts/'+editing.id+'/checkout',{method:'POST',key:editing.key,body:refBody(),credentials:true,timeout:20000});if(r.status==='paid'){unlockDone(e(publishedGift.name));return true;}}catch{}
 return false;
}
async function welcomeBack(){
 if(!publishedGift?.server||!payStartedRecently(publishedGift.id))return;
 if(await recheckPayment())return;
 const note=$('#payStatus');if(note&&!payBusy&&note.hidden){note.textContent='Welcome back. We checked: nothing has been paid yet, so nothing was charged. '+publishedGift.name+'’s gift is still saved.'+keptLine();note.hidden=false;}
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&publishedGift?.server&&payStartedRecently(publishedGift.id))welcomeBack();});
function unlockGift(){startPayment();$('#unlockPanel')?.scrollIntoView({behavior:'smooth',block:'center'});}
/* The preview is laid out as a real 360 x 660 phone and scaled to the mockup, so text stays close to full size and nothing is cut off. */
function fitPhone(){const screen=$('.phone-screen');if(screen&&screen.clientWidth)screen.style.setProperty('--ps',String(screen.clientWidth/360));}
window.addEventListener('resize',fitPhone);
/* The unlock page plays the gift inside a phone. The frame (same origin) asks for the gift once it has loaded. */
window.addEventListener('message',ev=>{
 if(ev.origin!==location.origin)return;
 const f=$('#phoneFrame');if(!f||ev.source!==f.contentWindow||!ev.data||!publishedGift)return;
 if(ev.data.type==='kholona-embed-ready'){f.contentWindow.postMessage({type:'kholona-embed-play',gift:publishedGift,price:priceText()},location.origin);$('#phoneLoading')?.classList.add('is-done');}
 /* The preview ends with a nudge to unlock: its button pays from here. */
 if(ev.data.type==='kholona-embed-unlock'){startPayment();$('#payGo')?.scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'center'});}
});
/* Open a saved gift's share screen (used for gifts still waiting to be unlocked). */
async function openSavedShare(id){
 const entry=libraryCache.find(v=>v.id===id);if(!entry)return;
 try{const r=await api('/api/gifts/'+id+'/owner',{key:entry.key});publishedGift=sanitizeGift(r.gift);publishedURL=r.url;publishedStatus=r.status||'paid';publishedExpiresAt=r.expiresAt||'';setOpensAt(r.opensAt);editing={id,key:entry.key,mode:'hosted',revision:r.revision};if((entry.waiting===true)!==(publishedStatus==='preview'))rememberGift({...entry,waiting:publishedStatus==='preview',expiresAt:r.expiresAt||entry.expiresAt});showShare();}
 catch(err){toast(err.message);}
}
async function portableGift(){const g=sanitizeGift(publishedGift);g.server=false;const clone=JSON.parse(JSON.stringify(g));const fields=clone.photos.map(p=>({object:p,key:'src'}));if(clone.voice)fields.push({object:clone,key:'voice'});if(clone.musicSrc)fields.push({object:clone,key:'musicSrc'});for(const f of fields){const src=f.object[f.key];if(!src.startsWith('http'))continue;let u;try{u=new URL(src);}catch{continue;}if(!mediaBase||!src.startsWith(mediaBase))continue;const r=await fetch(src,{cache:'no-store'});if(!r.ok)throw new Error('One uploaded file could not be packed. Please try again.');const blob=await r.blob();if(blob.size>3*1024*1024)throw new Error('One uploaded file is too large to pack safely.');f.object[f.key]=await readDataURL(blob);}return clone;}
/* Next.js hosts this app: a downloaded gift must not depend on /_next chunks, so we
   inline the legacy engine and stylesheets and drop framework scripts from the export. */
async function inlineStandaloneAssets(doc){
 for(const el of doc.querySelectorAll('script')){if(el.id==='giftPayload'||el.id==='luv4u-firstpaint'||el.hasAttribute('data-luv4u-legacy'))continue;el.remove();}
 for(const el of doc.querySelectorAll('link[rel=preload],link[rel=modulepreload],link[rel=prefetch]'))el.remove();
 for(const link of [...doc.querySelectorAll('link[rel=stylesheet]')]){
  const res=await fetch(link.getAttribute('href'));if(!res.ok)throw new Error('The gift styles could not be packed.');
  const style=document.createElement('style');style.textContent=await res.text();link.replaceWith(style);
 }
 const engine=doc.querySelector('script[data-luv4u-legacy]');
 if(engine){const res=await fetch(engine.getAttribute('src'));if(!res.ok)throw new Error('The gift engine could not be packed.');
  engine.removeAttribute('src');engine.removeAttribute('async');engine.textContent=await res.text();}
}
async function downloadGiftHTML(){
 if(!publishedGift)return;const b=$('#downloadGift');if(b){b.disabled=true;b.textContent='Wrapping your gift file…';}
 try{const payload=await portableGift();const doc=document.documentElement.cloneNode(true);doc.setAttribute('data-embedded-gift','true');doc.classList.remove('gift-loading');await inlineStandaloneAssets(doc);doc.querySelector('#giftPayload').textContent=JSON.stringify(payload).replace(/</g,'\\u003c');doc.querySelector('title').textContent=occasionOf(payload).label+' for '+payload.name+' ♡';
 for(const el of doc.querySelectorAll('meta[property^="og:"],meta[name^="twitter:"],meta[name="robots"],link[rel="canonical"]'))el.remove();doc.querySelector('head').insertAdjacentHTML('beforeend','<meta name="robots" content="noindex,nofollow">');
 doc.querySelector('body').classList.remove('experiencing');for(const id of ['creatorView','shareView','errorView','experience','myGiftsView'])doc.querySelector('#'+id).hidden=true;doc.querySelector('#homeView').hidden=false;doc.querySelector('#siteHeader').hidden=false;doc.querySelector('#experience').innerHTML='';
 for(const el of doc.querySelectorAll('input:not([type=file])')){el.value='';el.removeAttribute('value');if(el.type==='checkbox')el.removeAttribute('checked');}for(const el of doc.querySelectorAll('textarea'))el.textContent='';
 for(const picker of doc.querySelectorAll('.message-templates'))picker.remove();
 for(const id of ['photoList','memoryList','voiceFileChip','musicFileChip','toast','modalRoot','savedGiftList','ownerNote','reviewSummary'])doc.querySelector('#'+id).innerHTML='';
 doc.querySelector('#shareCover').removeAttribute('src');doc.querySelector('#cropDialog').removeAttribute('open');doc.querySelector('#cropImage').removeAttribute('src');doc.querySelector('#toast').classList.remove('visible');doc.querySelector('#confettiCanvas').hidden=true;
 // Keep the initialized builder markup; init() rebinds it without duplicating nodes.
 // Export uses the same single-file source, with its already-upgraded markup retained.
 doc.querySelector('#giftForm').dataset.v2Installed='true';
 const blob=new Blob(['<!DOCTYPE html>\n',doc.outerHTML],{type:'text/html;charset=utf-8'});const slug=payload.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,35)||'you';downloadBlob(blob,'a-'+occasionOf(payload).slug+'-for-'+slug+'.html');toast('All wrapped. Send the HTML as a document; they can open it in a browser.');
 }catch(err){toast(err.message||'The gift file could not be wrapped.');}finally{if(b){b.disabled=false;b.innerHTML=icon('download')+' Download gift HTML';}}
}
async function nativeShare(){if(!publishedURL||!publicHosting())return;const data={title:occasionOf(publishedGift).label+(publishedGift.sharePreview===false?' for you':' for '+publishedGift.name),text:'Psst… I made you a little Kholona. Kholo na, when you have a quiet moment. ♡',url:publishedURL};try{if(navigator.share)await navigator.share(data);else await copyText(publishedURL);}catch(err){if(err.name!=='AbortError')toast('Sharing is unavailable here. Copy the little link instead.');}}
async function shareCover(){if(!coverData)return;const blob=await (await fetch(coverData)).blob();const file=new File([blob],'a-little-gift.jpg',{type:blob.type||'image/jpeg'});try{if(navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:occasionOf(publishedGift).label,text:publishedURL||'A little world, made just for you.'});else{downloadBlob(blob,'a-little-gift.jpg');toast('Artwork saved. Attach it with the gift link in your message.');}}catch(err){if(err.name!=='AbortError')toast('This browser cannot share artwork directly. Use Save the little artwork.');}}
async function showLibrary(){clearGiftHash();showView('library');$('#savedGiftList').innerHTML=libraryCache.length?libraryCache.map(entry=>`<article class="saved-gift"><span aria-hidden="true">${THEMES[entry.vibe]?.symbol||'♡'}</span><div><h2>${entry.occasion==='wedding'?e([entry.name,entry.partner].filter(Boolean).join(' & ')||'Our wedding')+'.':`For ${e(entry.name||'your person')}.`}</h2><p>${entry.occasion==='wedding'?'Wedding invite · '+(entry.mode==='hosted'?'Live link':'Keepsake'):`${e(occasionOf(entry).short)} · ${e(entry.vibe||'A little')} · ${entry.mode==='hosted'?'A live little world':'A standalone keepsake'}`}${entry.at?' · '+e(new Date(entry.at).toLocaleDateString(undefined,{month:'short',day:'numeric'})):''}</p><div class="saved-actions"><button data-v2="edit-saved" data-id="${e(entry.id)}">Open & edit</button><button data-v2="copy-saved" data-id="${e(entry.id)}">${entry.url?'Copy gift link':'Open gift file options'}</button>${entry.mode==='hosted'?`<button data-v2="stats" data-id="${e(entry.id)}">Little replies</button><button data-v2="copy-recovery" data-id="${e(entry.id)}">Private recovery link</button>`:''}<button class="danger" data-v2="delete-saved" data-id="${e(entry.id)}">${entry.mode==='hosted'?'Remove gift':'Forget here'}</button></div><div class="saved-stats" id="stats-${e(entry.id)}" hidden></div></div></article>`).join(''):'<p class="empty-shelf">No ribbons tied just yet.<br>Your first little gift belongs right here.</p>';}
async function editSaved(id,key=null){let entry=libraryCache.find(v=>v.id===id);if(key)entry={id,key,mode:'hosted'};if(!entry){toast('That gift is not saved in this browser. Use its private recovery link.');return;}try{let g;if(entry.mode==='hosted'){const result=await api('/api/gifts/'+id+'/owner',{key:entry.key});g=sanitizeGift(result.gift);publishedStatus=result.status||'paid';publishedExpiresAt=result.expiresAt||'';setOpensAt(result.opensAt);editing={id,key:entry.key,mode:'hosted',revision:result.revision};rememberGift({...editing,name:g.name,partner:g.partner||'',vibe:g.vibe,occasion:g.occasion,url:result.url,expiresAt:result.expiresAt,waiting:publishedStatus==='preview'});delivery='hosted';}else{g=await store('gift:'+id);if(!g)throw new Error('The saved gift data is no longer in this browser. Open the exported HTML to enjoy it.');editing=null;delivery=backendReady?'hosted':'portable';}draft=sanitizeGift(g);publishAttempt=null;clearGiftHash();wizardStep=1;populateForm();$('#expiryDays').dataset.changed='false';showView('creator');toast(entry.mode==='hosted'?'Your little gift is open. Changes will keep the same link.':'A new copy of your standalone gift is ready to edit.');}catch(err){toast(err.message);}}
async function showStats(id){const entry=libraryCache.find(v=>v.id===id);if(!entry)return;const root=$('#stats-'+id);root.hidden=false;root.textContent='Opening the little postbox…';try{const stats=await api('/api/gifts/'+id+'/stats',{key:entry.key});const counts=stats.reactions.map(r=>`${e(r.reaction)} ${r.count}`).join(' · ')||'No emoji replies yet';root.innerHTML=`${stats.status==='preview'?`<p><strong>Waiting to be unlocked.</strong> Only you can see this gift until then. <button type="button" data-v3="unlock-saved" data-id="${e(id)}">Unlock & get link</button></p>`:''}<p>${stats.opens} ${stats.opens===1?'opening':'openings'} · ${counts}</p><p class="privacy-small">Approximate openings, deduplicated per browser session. Replies are anonymous; we don’t verify who sends them.</p>${stats.replies.length?stats.replies.map(r=>`<blockquote>${e(r.reaction)} ${e(r.message||'A little feeling, sent back with love.')}</blockquote>`).join(''):'<p>Nothing here yet. Give them a little room to smile.</p>'}${stats.expiresAt?'<p>Expires '+e(new Date(stats.expiresAt).toLocaleString())+'</p>':''}`;}catch(err){root.textContent=err.message;}}
async function deleteSaved(id){const entry=libraryCache.find(v=>v.id===id);if(!entry)return;const message=entry.mode==='hosted'?'Remove this gift? Its live link, uploaded media and replies will stop being available. Downloaded copies cannot be recalled.':'Forget this gift in this browser? Links and already-downloaded copies will still work.';if(!window.confirm(message))return;try{if(entry.mode==='hosted')await api('/api/gifts/'+id,{method:'DELETE',key:entry.key});await removeStored('gift:'+id).catch(()=>{});libraryCache=libraryCache.filter(v=>v.id!==id);saveLibrary();if(editing?.id===id)editing=null;showLibrary();toast('A little space on the shelf.');}catch(err){toast(err.message);}}
function visitorToken(){const k='luv4u.visitor.'+gift.id;try{let value=sessionStorage.getItem(k);if(!/^[a-f0-9]{32}$/.test(value||'')){value=hexToken(16);sessionStorage.setItem(k,value);}return value;}catch{if(!window.__luvVisitor)window.__luvVisitor=hexToken(16);return window.__luvVisitor;}}
async function countOpening(){try{await api('/api/gifts/'+gift.id+'/views',{method:'POST',body:{visitor:visitorToken()}});}catch{/* Opening the birthday must not depend on counting it. */}}
function prepareReply(){prepareReplyV1();}
async function sendDirectReply(button){if(!gift.server||isPreview)return;const text=$('#recipientReply').value.trim();if(!reaction&&!text){toast('Pick a little feeling, or write a few words.');return;}button.disabled=true;$('#deliveryFeedback').textContent='Tucking your reply into their postbox…';try{await api('/api/gifts/'+gift.id+'/reactions',{method:'POST',body:{visitor:visitorToken(),reaction,message:text}});$('#deliveryFeedback').textContent='Sent. A little love, back where it belongs. ♡ You can still change it and send again.';button.innerHTML='Send it again '+icon('heart');chime('wish');}catch(err){$('#deliveryFeedback').textContent='Not sent. '+err.message+' Please try again in a moment.';}finally{button.disabled=false;}}
function whatsappReply(){if(!replySharedText)return;const number=gift?.replyPhone?gift.replyPhone.replace(/[^0-9]/g,''):'';openWhatsApp(replySharedText,number);}
/* Permissions are optional. A warm room never depends on a microphone. */
async function startBlowing(){
 if(micStream){stopBlowing();return;}if(!navigator.mediaDevices?.getUserMedia||!ensureAudio()){toast('Microphone unavailable here. Tap the candles to make your wish.');return;}
 const button=$('#blowMic');button.disabled=true;button.textContent='Allow the microphone. Then a gentle blow.';const token=experienceToken,generation=++micGeneration;let stream;
 try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});if(token!==experienceToken||generation!==micGeneration||scenes[sceneIndex]!=='cake'||$('#birthdayCake')?.classList.contains('extinguished')){stream.getTracks().forEach(t=>t.stop());return;}
 micStream=stream;const analyser=audioContext.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.25;blowSource=audioContext.createMediaStreamSource(stream);blowSource.connect(analyser);const values=new Uint8Array(analyser.frequencyBinCount),start=performance.now();let floor=0,samples=0,held=0;
 button.disabled=false;button.textContent='One quiet second… finding the room’s sound.';
 const frame=()=>{if(!micStream||token!==experienceToken)return;analyser.getByteTimeDomainData(values);let sum=0;for(const v of values)sum+=(v-128)**2;const level=Math.sqrt(sum/values.length)/128;
 if(performance.now()-start<850){floor+=level;samples++;}else{button.textContent='Now blow gently. Tap here to cancel.';const threshold=Math.max(.075,(floor/Math.max(samples,1))*2.8);held=level>threshold?held+1:Math.max(0,held-2);if(held>=9){blowCandles();return;}}micFrame=requestAnimationFrame(frame);};frame();
 micTimeout=setTimeout(()=>{stopBlowing();toast('A little noisy in here? Tapping the candles works just as well.');},12000);
 }catch{stream?.getTracks().forEach(t=>t.stop());stopBlowing();toast('No microphone? No worries. Just tap the candles.');}finally{if($('#blowMic'))$('#blowMic').disabled=false;}
}
function bindV2(){
 document.addEventListener('click',async event=>{
 
 const crop=event.target.closest('[data-crop]');if(crop){openCrop(+crop.dataset.crop);return;}
 const move=event.target.closest('[data-move]');if(move){const [kind,i,delta]=move.dataset.move.split(':');moveItem(kind,+i,+i+(+delta));return;}
 const b=event.target.closest('[data-v2]');if(!b)return;event.preventDefault();const id=b.dataset.id;
 switch(b.dataset.v2){
 case'wizard-next':advanceWizard();break;case'quick-react':quickReact(b);break;case'pass-on':passOn();break;case'wizard-back':setStep(0);break;case'note-shuffle':autoNote(1);break;case'nudge-photo':chooseTouches('photosDetail');setTimeout(()=>$('#photoUpload')?.click(),0);break;case'nudge-voice':chooseTouches('voiceDetail');break;case'skip-extras':skipTouches();break;case'choose-touches':chooseTouches();break;case'choose-touch':chooseTouches(b.dataset.detail);break;case'edit-touches':chooseTouches();break;
 case'library':showLibrary();break;case'preview-music':previewMusic();break;case'cancel-crop':closeCrop(false);break;case'save-crop':closeCrop(true);break;
 case'choose-path':choosePath(b.dataset.path);break;case'pick-gift':pickMystery(b);break;case'custom-quiz':customQuiz(b);break;
 case'reveal-quiz':{const right=$('[data-right=true]');if(right){$('#quizHint').textContent='A tiny hint: '+gift.quizAnswer+'. Give it a tap. ♡';}break;}
 case'tilt':toggleTilt();break;case'native-share':nativeShare();break;case'share-cover':shareCover();break;
 case'download-qr':downloadQr();break;
 case'download-cover':if(coverData){const blob=await (await fetch(coverData)).blob();downloadBlob(blob,'a-little-gift.jpg');}break;
 case'edit-saved':editSaved(id);break;case'stats':showStats(id);break;case'delete-saved':deleteSaved(id);break;case'send-reply':sendDirectReply(b);break;
 case'copy-recovery':{const entry=libraryCache.find(v=>v.id===id);if(entry?.key)copyText(recoveryURL(entry),'Your private edit link is copied. Keep this one just for you.');break;}
 case'save-recovery':{const entry=libraryCache.find(v=>v.id===id);if(entry?.key)downloadBlob(new Blob(['Kholona — PRIVATE gift recovery\n\nFor: '+entry.name+'\n\nPRIVATE edit/recovery link (do not share):\n'+recoveryURL(entry)+'\n\nRecipient link (safe to share):\n'+entry.url+'\n\nAnyone with the private link can edit or delete this gift and read replies.\n'],{type:'text/plain;charset=utf-8'}),'kholona-private-recovery.txt');break;}
 case'copy-saved':{const entry=libraryCache.find(v=>v.id===id);if(!entry)break;if(entry.url)copyText(entry.url);else{try{publishedGift=await store('gift:'+id);if(!publishedGift)throw new Error('This gift is no longer saved in the browser.');publishedURL='';showShare();}catch(err){toast(err.message);}}break;}
 }
 });
 $('#giftForm').addEventListener('submit',event=>{event.preventDefault();event.stopImmediatePropagation();/* Enter creates the gift only from the name field; in any other field it must never send someone off mid-sentence. */if(document.activeElement===$('#recipientName'))advanceWizard();},true);
 $('#recipientName').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();advanceWizard();}});
 $('#giftForm').addEventListener('input',event=>{
  const id=event.target.id;
  if(id==='personalMessage'&&!applyingMessageTemplate){const st=getTemplateState(event.target);st.manual=!event.target.value.trim();renderMediaStatus();}
  if(id==='recipientName'||id==='senderName')scheduleAutoNote();
 });
 document.addEventListener('click',event=>{if(event.target.closest('[data-vibe]'))setTimeout(()=>autoNote(),0);});
 $('#giftForm').addEventListener('input',event=>{const el=event.target;const simple={replyPhone:'replyPhone',quizQuestion:'quizQuestion',quizAnswer:'quizAnswer'};if(simple[el.id])draft[simple[el.id]]=el.value;if(el.id.startsWith('quizDecoy')){draft.quizOptions=draft.quizOptions||[];draft.quizOptions[+el.id.slice(-1)]=el.value;}if(el.id==='musicVolume'){draft.volume=+el.value/100;$('#volumeReadout').textContent=el.value+'%';if(previewAudio)previewAudio.volume=draft.volume;if(previewGain)previewGain.gain.value=draft.volume*.2;}if(el.id==='branchToggle')draft.branch=el.checked;if(el.id==='motionToggle')draft.motion=el.checked;if(el.id==='sharePreviewToggle')draft.sharePreview=el.checked;saveDraft();});
 $('#giftForm').addEventListener('change',event=>{if(event.target.id==='deliverySelect'){delivery=event.target.value;updateDelivery();}if(event.target.id==='expiryDays')event.target.dataset.changed='true';});
 $('#giftForm').addEventListener('click',event=>{if(event.target.closest('[data-music]'))stopPreviewAudio();if(event.target.closest('[data-vibe]')&&(previewAudio||previewMelody))stopPreviewAudio();const b=event.target.closest('[data-remove-audio]');if(b){if(b.dataset.removeAudio==='voice')$('#voiceUrl').value='';else{$('#musicUrl').value='';stopPreviewAudio();}}});
 let dragging=null;document.addEventListener('dragstart',ev=>{const el=ev.target.closest('[data-sort]');if(!el)return;if(ev.target.matches('input,textarea')){ev.preventDefault();return;}dragging=el.dataset.sort;ev.dataTransfer.effectAllowed='move';ev.dataTransfer.setData('text/plain',dragging);el.classList.add('dragging');});
 document.addEventListener('dragover',ev=>{const el=ev.target.closest('[data-sort]');if(el&&dragging&&el.dataset.sort.split(':')[0]===dragging.split(':')[0]){ev.preventDefault();el.classList.add('drop-target');}});
 document.addEventListener('dragleave',ev=>ev.target.closest('[data-sort]')?.classList.remove('drop-target'));
 document.addEventListener('drop',ev=>{const el=ev.target.closest('[data-sort]');if(!el||!dragging)return;ev.preventDefault();const [kind,from]=dragging.split(':'),[target,to]=el.dataset.sort.split(':');if(kind===target)moveItem(kind,+from,+to);dragging=null;$$('.drop-target,.dragging').forEach(n=>n.classList.remove('drop-target','dragging'));});
 document.addEventListener('dragend',()=>{dragging=null;$$('.drop-target,.dragging').forEach(n=>n.classList.remove('drop-target','dragging'));});
 for(const id of ['cropX','cropY','cropZoom'])$('#'+id).addEventListener('input',updateCrop);
 let pointer=null;$('#cropWindow').addEventListener('pointerdown',ev=>{if(!cropContext)return;pointer={id:ev.pointerId,x:ev.clientX,y:ev.clientY,cx:cropContext.x,cy:cropContext.y};ev.currentTarget.setPointerCapture(ev.pointerId);});$('#cropWindow').addEventListener('pointermove',ev=>{if(!pointer||!cropContext)return;$('#cropX').value=clamp(pointer.cx-(ev.clientX-pointer.x)/2,0,100,50);$('#cropY').value=clamp(pointer.cy-(ev.clientY-pointer.y)/2,0,100,50);updateCrop();});for(const evt of ['pointerup','pointercancel'])$('#cropWindow').addEventListener(evt,()=>pointer=null);
 $('#cropDialog').addEventListener('cancel',()=>cropContext=null);
 $('#experience').addEventListener('pointermove',ev=>{if(ev.pointerType!=='mouse'||reducedMotion||!gift?.motion||!tiltEnabled)return;$('#experience').style.setProperty('--mx',((ev.clientX/innerWidth-.5)*14).toFixed(2)+'px');$('#experience').style.setProperty('--my',((ev.clientY/innerHeight-.5)*10).toFixed(2)+'px');},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPreviewAudio();});
 $('#clearDraft').addEventListener('click',()=>{setTimeout(()=>{const b=$('#confirmReset');if(b)b.addEventListener('click',()=>{editing=null;publishAttempt=null;clearTimeout(saveTimer);saveGeneration++;removeStored('draft').catch(()=>{});removeStored('pending-create').catch(()=>{});setStep(0);saveDraft();});},0);});
}
async function routeV2(){const occasionRoute=/^#occasion=(birthday|proposal|love|apology|anniversary|thanks|congratulations|missyou|wedding)$/.exec(location.hash);if(occasionRoute){applyCampaign(occasionRoute[1]);return true;}
 const demo=/^#demo=([a-z]+)$/.exec(location.hash);if(demo&&Object.hasOwn(OCCASIONS,demo[1])){previewOccasion(demo[1]);return true;}
 const make=/^#make=([a-z]+)$/.exec(location.hash);if(make&&Object.hasOwn(OCCASIONS,make[1])){await openCreator(make[1]);return true;}
 if(location.hash.startsWith('#make=')){browseGifts();toast('Choose one of the little gifts below.');return true;}

 const edit=/^#edit=([a-f0-9]{24})\.([a-f0-9]{64})$/.exec(location.hash);if(edit){const [,id,key]=edit;clearGiftHash();await editSaved(id,key);return true;}
 if(location.hash.startsWith('#edit=')){clearGiftHash();showView('error');$('#errorMessage').textContent='That private edit link is incomplete. Use the complete recovery link you saved.';return true;}
 if(location.hash.startsWith('#gift=')){await loadGiftFromLocation();return true;}
 let embedded;try{embedded=JSON.parse($('#giftPayload').textContent);}catch{}
 if(embedded){try{embedded.server=false;startExperience(sanitizeGift(embedded));}catch(err){showView('error');$('#errorMessage').textContent=err.message;}return true;}
 const match=/^\/g\/([a-f0-9]{24})\/?$/.exec(location.pathname);
 if(match){try{const result=await api('/api/gifts/'+match[1]);if(result.scheduled){showScheduled(result.opensAt);return true;}startExperience(result.gift);}catch(err){showView('error');$('#errorMessage').textContent=err.message;}return true;}const campaign=Object.entries(OCCASIONS).find(([,o])=>location.pathname==='/for/'+o.slug||location.pathname==='/for/'+o.slug+'/');if(campaign){/* The server already set this page's own title. */applyCampaign(campaign[0],true);return true;}return false;
}
/* The phone on the unlock page plays the gift in here. It only ever shows what its parent window hands it. */
const EMBED=location.pathname==='/preview-frame'&&window.parent!==window;
let embedPrice='';
/* When the preview reaches its ending, say so and point at the way to send it. */
function embedNudge(){
 if(!EMBED||!gift)return;const exp=$('#experience'),type=scenes[sceneIndex],last=type==='celebration'||type==='reply';
 let n=$('.embed-nudge',exp);if(!last){n?.remove();exp.classList.remove('has-nudge');return;}if(n)return;
 exp.classList.add('has-nudge');
 exp.insertAdjacentHTML('beforeend',`<aside class="embed-nudge" aria-label="Unlock this gift"><p><strong>${gift.occasion==='wedding'?'This is what your guests will see.':`This is what ${e(gift.name)} will feel.`}</strong><br>Unlock it to get the link and send it.</p><button type="button" data-story="embed-unlock">Unlock & get link${embedPrice?' · '+e(embedPrice):''}</button></aside>`);
}
function initEmbed(){
 document.documentElement.classList.add('is-embed');
 /* The preview frame never boots the creator, so the gift's own touches are wired here: every one-touch moment of every gift, and nothing else. */
 document.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-v3],[data-v2]');if(!b)return;
  const v3={'open-note':()=>openOccasionNote(b),'heart-note':()=>openHeartNote(b),'flower':()=>pickFlower(b),'turn-page':()=>turnStoryPage(),'untie-ribbon':()=>untieRibbon(b),'send-hug':()=>sendPaperHug(b),'reveal-question':()=>revealProposal(b),'proposal-answer':()=>chooseProposalAnswer(b),'no-answer':()=>{journeyReply='';proposalAnswer='';goToScene(sceneIndex+1);},'finish-reading':()=>showQuietFinish(),'sorry-meter':()=>measureSorry(b),'coupon':()=>claimCoupons(),'forgive-yes':()=>forgiveYes(b),'forgive-no':()=>dodgeNo(b,ev),'forgiven-card':()=>saveForgivenCard(b),'wrapped-next':()=>wrappedNext(true),'birthday-card':()=>saveBirthdayCard(b),'wedding-card':()=>saveWeddingCard(b)};
  const v2={'choose-path':()=>choosePath(b.dataset.path),'pick-gift':()=>pickMystery(b),'custom-quiz':()=>customQuiz(b),'reveal-quiz':()=>{if($('[data-right=true]'))$('#quizHint').textContent='A tiny hint: '+gift.quizAnswer+'. Give it a tap. ♡';},'tilt':()=>toggleTilt(),'quick-react':()=>quickReact(b)};
  const act=b.dataset.v3!==undefined?v3[b.dataset.v3]:v2[b.dataset.v2];if(act){ev.preventDefault();act();}
 });
 for(const id of ['homeView','creatorView','shareView','errorView','myGiftsView'])if($('#'+id))$('#'+id).hidden=true;
 if($('#siteHeader'))$('#siteHeader').hidden=true;
 window.addEventListener('message',ev=>{
  if(ev.origin!==location.origin||ev.source!==window.parent||!ev.data||ev.data.type!=='kholona-embed-play')return;
  embedPrice=typeof ev.data.price==='string'?ev.data.price.slice(0,12):'';
  /* no envelope here: the unlock page's play button starts the gift at once */
  try{startExperience(sanitizeGift(ev.data.gift),{preview:true,returnView:'share',skipSeal:true});}catch{}
 });
 /* The viewer tapped play on the unlock page: do the first touch for them (lighting the room), so the gift starts moving at once. */
 window.addEventListener('message',ev=>{
  if(ev.origin!==location.origin||ev.source!==window.parent||!ev.data||ev.data.type!=='kholona-embed-go')return;
  setTimeout(()=>{try{$('#storyScene [data-story="light"]:not([disabled])')?.click();}catch{}},350);
 });
 document.documentElement.classList.remove('gift-loading');
 window.parent.postMessage({type:'kholona-embed-ready'},location.origin);
}
async function init(){
 if(location.pathname==='/preview-frame'&&window.parent!==window){initEmbed();return;}
 installWizard();installOccasions();bindV2();bindMessageTemplates();await restoreDraft();populateForm();showView('home');
 await checkBackend();
 try{const pending=await store('pending-create');if(pending&&/^[a-f0-9]{24}$/.test(pending.id)&&/^[a-f0-9]{64}$/.test(pending.key)){publishAttempt={id:pending.id,key:pending.key};}}catch{}
 try{await routeV2();}finally{document.documentElement.classList.remove('gift-loading');}
}

/* v2.1 · A little help with the words. All suggestions are local, editable copy.
   Nothing is inserted until a button is chosen. Identity/contact/URL fields are
   intentionally not templated. UI decisions and undo history are never gifts. */
const MESSAGE_STARTERS={
 Romantic:{
  note:[['My favorite person','Happy birthday, {name}. Life with you is full of little moments I wish I could keep forever. Here’s to more of them, and more of us. ♡'],['The everyday kind of love','{name}, you make ordinary days feel like something worth celebrating. Today is my favorite excuse to remind you how loved you are. Happy birthday, my love.'],['Always you','Happy birthday to my favorite hello, my safest place, and the person I’d choose all over again. It’s you, {name}. Always you. ♡']],
  secret:['Plot twist: you’re still my favorite person, {name}. ♡','One birthday. A thousand reasons I adore you.','Your gift includes unlimited hugs. No expiry date.'],
  finale:[['One more little wish','One last thing, {name}: I hope this year gives you even half the happiness you bring me. I’m so glad I get to love you. ♡'],['A promise, not a plan','Here’s my birthday promise: more time for us, more little adventures, and more reasons to hold your hand. The details? We’ll dream them up together.'],['Keep this little reminder','Whenever you need a reminder, come back to this little room. You are loved, {name}. Not just on your birthday. Every day.']],
  memory:['This moment with you, {name}, is one I keep coming back to. I wish I could fold it up and carry it everywhere.','It wasn’t a grand occasion. Just us, being us. Somehow, those are the moments I love most.','Some memories look like a photograph. This one feels like home. ♡'],
  captions:['My favorite place: beside you.','A little moment. A lot of us.','You, me, and a very good memory.']
 },
 Cute:{
  note:[['A pocket-sized hug','Happy birthday, {name}! Here’s a little pocket of happy, made just for you. I hope your day has extra cake, warm hugs, and all your favorite people. ♡'],['Sprinkles of happiness','{name}, the world got a little sweeter the day you arrived. Wishing you a birthday full of small surprises and the biggest smiles. You deserve every sprinkle.'],['Your birthday cheerleader','Today’s agenda: celebrate you, eat something delicious, and remind you how lovely you are. Happy birthday, {name}. I’m always cheering for you. ♡']],
  secret:['A tiny reminder: you are so, so loved, {name}. ♡','You’re the extra sprinkle that makes everything better.','Redeem this message for one very big birthday hug.'],
  finale:[['A little birthday hug','Before you go, {name}, here’s one last birthday hug. I hope something lovely finds you today, and you remember how much you mean to me. ♡'],['Save some cake','One more birthday instruction: save yourself the best slice of cake. This day is yours, and you deserve every sweet little bit of it.'],['For all the days after','When the balloons come down and the cake is gone, this part stays: you’re loved, you matter, and I’m really glad you’re here.']],
  memory:['This little moment with you still makes me smile, {name}. Definitely one for the keep-forever collection.','Nothing fancy. Just a happy little day I’m very glad we shared. ♡','A tiny memory, but it takes up a lovely amount of space in my heart.'],
  captions:['A little piece of happy.','This one belongs in a tiny frame.','Proof that the little things matter.']
 },
 Funny:{
  note:[['Older? Allegedly.','Happy birthday, {name}! You’re not getting older. You’re collecting bonus levels, excellent stories, and increasingly strong opinions about bedtime. Proud of you.'],['Official birthday notice','Dear {name}, this is your annual reminder that you’re a delight. Occasionally a menace, but mostly a delight. Please accept this tiny website in place of my ability to wrap presents.'],['Cake-based appreciation','Happy birthday, {name}. I was going to write something deeply moving, but then I thought about cake. You’re wonderful. I’m glad you exist. Now, about that cake…']],
  secret:['Your age is classified. Your awesomeness is public information.','Congratulations, {name}. Still an absolute delight. Mostly.','This gift contains 100% love and absolutely no assembly instructions.'],
  finale:[['One sensible instruction','One final birthday tip, {name}: never let anyone tell you how much cake is too much cake. Especially me. I am not qualified.'],['An extremely official award','You have reached the end of this surprise and earned the title of Excellent Birthday Human. Your prize is my affection. It is non-refundable.'],['Jokes aside','Jokes aside, {name}, I’m really glad you’re in my life. Things are funnier, brighter, and much less boring with you around. Happy birthday. ♡']],
  memory:['This photo does not explain the chaos. I’m not sure anything could. Very glad you were there, {name}.','One of those moments that was probably funnier in person. Luckily, we were both there.','Our ability to turn a normal day into a story remains undefeated.'],
  captions:['No context. Just excellent company.','A very serious historical document.','We looked responsible for a second.']
 },
 Emotional:{
  note:[['I’m glad you exist','Happy birthday, {name}. I hope you know how much your presence matters. Not for what you do for anyone, but simply because you’re you. I’m so glad the world has you.'],['The love you give','{name}, you give so much of yourself to the people around you. Today, I hope some of that love finds its way back. You deserve gentleness, joy, and a year that feels good to live.'],['A quiet thank-you','Happy birthday, {name}. For the little ways you’ve been there, for the moments you made lighter, and for being yourself: thank you. I carry more of those memories than you know. ♡']],
  secret:['You matter more than you know, {name}. Really.','Some people make life feel lighter. You’re one of them.','This is your reminder that you don’t have to earn being loved.'],
  finale:[['Take this with you','One last wish for you, {name}: may the next chapter be kind to your heart. May you find rest, feel loved, and have so many reasons to keep looking forward.'],['More than today','Birthdays come and go. What you mean to me doesn’t. Thank you for being part of my life, {name}. I’m holding a little extra gratitude for you today. ♡'],['A place to return to','On a day when you forget how much you matter, come back here. This little world is a reminder: you are seen, you are loved, and I’m glad you exist.']],
  memory:['I wonder if you remember this moment, {name}. I do. It meant more to me than I knew how to say at the time.','A small memory, but one that reminds me how lucky I am to have you in my life.','Some moments stay with us quietly. This is one of mine. ♡'],
  captions:['A moment I hold close.','More than a photograph.','Some memories feel like a hug.']
 },
 Crazy:{
  note:[['Main-character birthday','{name}! A certified legend was born today. Cake is mandatory, terrible dancing is encouraged, and acting your age is strictly optional. Go have an outrageously good birthday.'],['Zero chill, all love','Happy birthday, {name}! Here’s to more wild ideas, more “did we really do that?” moments, and a year with absolutely excellent plot twists. The good kind. We’re specifying that.'],['Birthday mission','Your mission, {name}: eat something amazing, laugh until it hurts, and make at least one ridiculous memory. You’re my favorite kind of chaos. Happy birthday! ♡']],
  secret:['Birthday chaos unlocked. Proceed with maximum cake.','{name}, your legendary status has been renewed for another year.','You bring the chaos. I’ll bring the confetti.'],
  finale:[['Go make a story','One last thing, {name}: go make this year a story worth telling. Big dreams, little adventures, wildly good memories. I’m rooting for every ridiculous bit of it.'],['Official party permission','Permission granted to be gloriously, unapologetically you. Today, tomorrow, and every day of this next trip around the sun. Maximum birthday energy!'],['Chaos, with heart','Under all the confetti, here’s the real thing: I adore your particular brand of wonderful. Life is a better adventure with you in it, {name}. ♡']],
  memory:['I still can’t believe this became one of our stories, {name}. Ten out of ten. Would choose the chaos again.','A completely normal day, until we got involved. One for the birthday highlight reel.','The plan was vague. The memories were excellent. No further questions.'],
  captions:['Evidence of a very good idea. Probably.','Zero chill. Excellent memories.','A plot twist worth keeping.']
 },
 Elegant:{
  note:[['A beautiful new chapter','Happy birthday, {name}. Wishing you a year of meaningful moments, beautiful possibilities, and time for the things that fill your heart. Here’s to all that is still to unfold.'],['Quietly wonderful','A little moment to celebrate you, {name}. May this birthday bring quiet joy, good company, and the lovely feeling of being truly appreciated. You are, more than you know.'],['Warmest wishes','Happy birthday, {name}. To new beginnings, familiar comforts, and the people who make life richer. Wishing you a day that feels entirely, beautifully yours.']],
  secret:['To the wonderful things still ahead of you, {name}.','A little reminder of how warmly you are appreciated.','May the simplest moments bring the deepest joy.'],
  finale:[['To what comes next','One final birthday wish, {name}: may the year ahead unfold with grace, bring you closer to what matters, and leave room for wonderful surprises.'],['A lasting little note','This little celebration ends here, but the appreciation behind it carries on. Wishing you happiness in the everyday, {name}, and a truly beautiful birthday.'],['Entirely your own','Take a moment for yourself today. A good cup of something, a favorite view, a little quiet joy. A beautiful day, entirely your own. Happy birthday.']],
  memory:['A lovely moment shared with you, {name}. One of those small occasions that makes life feel richer.','Some days become memories without announcing themselves. This was one of them.','A moment worth pausing for, and a memory worth keeping.'],
  captions:['A moment, beautifully kept.','The quiet joy of good company.','One for the collection of lovely days.']
 }
};
const TEMPLATE_LABELS={trait:'Pick a top trait',played:'Pick a most played',note:'Borrow a few heartfelt words',secret:'A few little secrets',finale:'A lovely last line',memory:'A memory starter',memoryWhen:'A little label',caption:'Caption ideas',question:'Pick a ready-made quiz',answer:'Answer ideas',decoy:'Playful alternatives',reply:'A few words you could borrow',proposalQuestion:'A little help asking',reason:'A few little reasons',coupon:'Coupon ideas',forgiveQuestion:'Ways to ask',milestone:'A little dedication',reunion:'Until the next hello'};
const templateState=new WeakMap();let applyingMessageTemplate=false;
function messageContext(input){const g=input.id==='recipientReply'&&gift?gift:draft;return {name:(g.name||'your person').trim(),vibe:MESSAGE_STARTERS[g.vibe]?g.vibe:'Cute',sender:g.sender||''};}
function quizStarterPacks(ctx){const n=ctx.name;return [
 {label:'Birthday VIP',question:'Who is the main character today?',answer:n,decoys:['The cake','The person holding the confetti'],answers:[n,'The birthday star','You, obviously!']},
 {label:'Cake maths',question:'How much cake is the right amount on your birthday?',answer:'As much as makes me happy',decoys:['Exactly one crumb','Cake? Never heard of it.'],answers:['As much as makes me happy','One very happy slice','There is always room for cake']},
 {label:'One birthday rule',question:'What is the one rule for today?',answer:ctx.vibe==='Crazy'?'Maximum cake. Minimum chill.':ctx.vibe==='Elegant'?'Make time for a little joy':'Let yourself be celebrated',decoys:['Answer every email immediately','Pretend it is an ordinary day'],answers:ctx.vibe==='Crazy'?['Maximum cake. Minimum chill.','Be gloriously, ridiculously me','Create excellent birthday chaos']:['Let yourself be celebrated','Make time for a little joy','Enjoy being wonderfully me']}
 ];}
function messageOptions(input,kind){
 const extra=occasionMessageOptions(input,kind);if(extra)return extra;
 const ctx=messageContext(input),bank=MESSAGE_STARTERS[ctx.vibe],personalize=text=>text.replaceAll('{name}',ctx.name);
 const rows=(items,labels=[])=>items.map((item,i)=>({label:Array.isArray(item)?item[0]:labels[i]||'A little idea '+(i+1),text:personalize(Array.isArray(item)?item[1]:item)}));
 if(kind==='note')return rows(bank.note);
 if(kind==='secret')return rows(bank.secret,['A little reminder','A sweet secret','One more smile']);
 if(kind==='finale')return rows(bank.finale);
 if(kind==='memory')return rows(bank.memory,['A moment to keep','The little things','Still makes me smile']);
 if(kind==='caption')return rows(bank.captions);
 if(kind==='memoryWhen')return rows(['One of my favorite days','That little adventure','A moment worth keeping']);
 if(kind==='reply')return rows([
  ['Happy tears','This made me smile so much. Thank you for making my birthday feel so special. I’m keeping this little surprise forever. 🥹'],
  ['Made my day','The cake! The lights! The whole little world! You absolutely made my day. Thank you for this birthday magic. 🎉'],
  ['Sending love',(ctx.sender?ctx.sender+', thank you':'Thank you')+' for putting so much love into this. I felt every bit of it. Sending the biggest hug right back. ❤️']
 ]);
 const packs=quizStarterPacks(ctx),active=packs.find(p=>p.question===draft.quizQuestion)||packs[0];
 if(kind==='question')return packs.map(p=>({label:p.label,text:p.question,fields:{quizQuestion:p.question,quizAnswer:p.answer,quizDecoy0:p.decoys[0],quizDecoy1:p.decoys[1]}}));
 if(kind==='answer')return rows([...new Set([active.answer,...active.answers])].slice(0,3));
 if(kind==='decoy'){const first=input.id==='quizDecoy0';return rows(first?[active.decoys[0],'A very confused balloon','The neighbor’s houseplant']:[active.decoys[1],'A squirrel in a party hat','An extremely serious potato']);}
 return [];
}
function getTemplateState(input){let state=templateState.get(input);if(!state){state={kind:'',owned:null,undo:null,pending:null,options:[]};templateState.set(input,state);}return state;}
function templateValues(input,option){const values=option.fields||{[input.id]:option.text};return Object.entries(values).map(([id,text])=>{const field=document.getElementById(id);return field?{field,text:String(text).slice(0,field.maxLength>0?field.maxLength:1200)}:null;}).filter(Boolean);}
function selectedTemplate(input,option){return templateValues(input,option).every(v=>v.field.value===v.text);}
function canUndoTemplate(state){return state.undo?.length&&state.undo.every(v=>v.field.isConnected&&v.field.value===v.after);}
function mountMessageTemplates(input,kind){
 if(!input)return;const state=getTemplateState(input);state.kind=kind;
 let box=document.getElementById('templates-'+input.id);
 if(!box){box=document.createElement('div');box.id='templates-'+input.id;box.className='message-templates';box.dataset.templateFor=input.id;input.before(box);}
 box.classList.toggle('compact',['caption','memoryWhen','answer','decoy'].includes(kind));
 const helpId='template-help-'+input.id;const described=new Set((input.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean));described.add(helpId);input.setAttribute('aria-describedby',[...described].join(' '));
 renderMessageTemplates(input);
}
function renderMessageTemplates(input){
 const state=getTemplateState(input),box=document.getElementById('templates-'+input.id);if(!box)return;
 const kind=state.kind,ctx=messageContext(input);state.options=messageOptions(input,kind);
 box.innerHTML=`<div class="template-heading"><strong>${TEMPLATE_LABELS[kind]}</strong><span class="template-vibe">${kind==='reply'?'Made to send back':kind==='question'?'Question + answers':ctx.vibe+' little ideas'}</span></div><div class="template-options" role="group" aria-label="Templates for ${e(input.getAttribute('aria-label')||({personalMessage:'your birthday note',funMessage:'the hidden message',finalMessage:'the final surprise',recipientReply:'your thank-you'}[input.id])||TEMPLATE_LABELS[kind])}">${state.options.map((o,i)=>`<button type="button" class="template-option" data-template-pick="${i}" aria-controls="${input.id}" aria-pressed="${selectedTemplate(input,o)}" aria-label="Use ${e(o.label)}: ${e(o.text)}${o.fields?'. Also fills the correct answer and two alternatives.':''}"><span class="template-option-top"><strong>${e(o.label)}</strong><span class="template-use">${selectedTemplate(input,o)?'✓ Selected':'Use this ↙'}</span></span><span class="template-text">${e(o.text)}</span></button>`).join('')}</div><p class="template-hint" id="template-help-${input.id}">${kind==='question'?'Choose a complete question and answers. Edit any part below.':kind==='memory'?'Choose a starting point, then add the details only you remember.':kind==='reply'?'Choose one, make it yours. Nothing sends until you say so.':'Tap to fill. Keep it as it is, or make it sound like you.'}</p><div class="template-feedback" role="status" aria-live="polite"></div><div class="template-confirm" hidden></div>`;
 /* Suggestions are collapsed by default (tap the heading to open) so the note field stays the focus. */
 if(box.closest('#giftForm')&&!box.classList.contains('compact')){const h=$('.template-heading',box);h.setAttribute('role','button');h.tabIndex=0;h.setAttribute('aria-expanded',String(box.classList.contains('open')));}
 syncMessageTemplates(input);
}
function syncMessageTemplates(input){
 const state=getTemplateState(input),box=document.getElementById('templates-'+input.id);if(!box)return;
 $$('[data-template-pick]',box).forEach((b,i)=>{const selected=selectedTemplate(input,state.options[i]);b.setAttribute('aria-pressed',String(selected));$('.template-use',b).textContent=selected?'✓ Selected':'Use this ↙';});
 const feedback=$('.template-feedback',box);feedback.replaceChildren();
 if(canUndoTemplate(state)){feedback.append(document.createTextNode('Tucked in. You can still edit every word. '));const undo=document.createElement('button');undo.type='button';undo.dataset.templateUndo='';undo.textContent='Undo';feedback.append(undo);}
 const confirm=$('.template-confirm',box);confirm.hidden=!state.pending;
 if(state.pending){confirm.innerHTML=`<p>${state.pending.option.fields?'Replace the question and answers you already wrote?':'Keep your words, or try this message instead?'} Your previous version can be restored with Undo.</p><div class="template-confirm-actions"><button type="button" data-template-confirm>Replace ${state.pending.option.fields?'quiz text':'my words'}</button><button type="button" data-template-cancel>Keep mine</button></div>`;}
 else confirm.replaceChildren();
}
function hasCustomMessage(input,option){return templateValues(input,option).some(({field,text})=>{
 if(!field.value.trim()||field.value===text)return false;const state=getTemplateState(field);
 if(field.value===state.owned)return false;
 return !state.kind||!messageOptions(field,state.kind).some(o=>o.text===field.value);
 });}
function pickMessageTemplate(input,index){
 const state=getTemplateState(input),option=state.options[index];if(!option)return;
 if(selectedTemplate(input,option))return;
 if(hasCustomMessage(input,option)){state.pending={option,index};syncMessageTemplates(input);const box=document.getElementById('templates-'+input.id);$('[data-template-confirm]',box).focus({preventScroll:true});$('.template-confirm',box).scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'nearest'});return;}
 applyMessageTemplate(input,option,index);
}
function applyMessageTemplate(input,option,index){
 const state=getTemplateState(input);state.pending=null;
 const snapshots=templateValues(input,option).map(({field,text})=>({field,before:field.value,after:text,owned:getTemplateState(field).owned}));
 applyingMessageTemplate=true;
 try{for(const v of snapshots){v.field.value=v.after;getTemplateState(v.field).owned=v.after;}
 for(const v of snapshots)v.field.dispatchEvent(new Event('input',{bubbles:true}));}
 finally{applyingMessageTemplate=false;}
 state.undo=snapshots;refreshMessageTemplates();
 const box=document.getElementById('templates-'+input.id);$('[data-template-pick="'+index+'"]',box)?.focus({preventScroll:true});
}
function undoMessageTemplate(input){
 const state=getTemplateState(input);if(!canUndoTemplate(state))return;const snapshots=state.undo;state.undo=null;state.pending=null;applyingMessageTemplate=true;
 try{for(const v of snapshots){v.field.value=v.before;getTemplateState(v.field).owned=v.owned;}
 for(const v of snapshots)v.field.dispatchEvent(new Event('input',{bubbles:true}));}
 finally{applyingMessageTemplate=false;}
 refreshMessageTemplates();const box=document.getElementById('templates-'+input.id);$('.template-feedback',box).textContent='Your previous words are back. ♡';$('[data-template-pick]',box)?.focus({preventScroll:true});
}
function installMessageTemplates(){
 for(const [id,kind]of Object.entries({personalMessage:'note',funMessage:'secret',finalMessage:'finale',quizQuestion:'question',quizAnswer:'answer',quizDecoy0:'decoy',quizDecoy1:'decoy'}))mountMessageTemplates(document.getElementById(id),kind);
}
function refreshMessageTemplates(){for(const box of $$('.message-templates')){const input=document.getElementById(box.dataset.templateFor);if(input)renderMessageTemplates(input);}}
function toggleTemplates(box){box.classList.toggle('open');const h=$('.template-heading',box);if(h)h.setAttribute('aria-expanded',String(box.classList.contains('open')));}
function bindMessageTemplates(){
 document.addEventListener('click',event=>{const h=event.target.closest?.('#giftForm .message-templates:not(.compact) .template-heading');if(h)toggleTemplates(h.closest('.message-templates'));});
 document.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;const h=event.target.closest?.('#giftForm .message-templates:not(.compact) .template-heading');if(h){event.preventDefault();toggleTemplates(h.closest('.message-templates'));}});
 document.addEventListener('click',event=>{
  const box=event.target.closest('.message-templates');if(!box)return;
  const input=document.getElementById(box.dataset.templateFor);if(!input)return;const state=getTemplateState(input),button=event.target.closest('button');if(!button)return;
  if(button.dataset.templatePick!==undefined){event.preventDefault();pickMessageTemplate(input,+button.dataset.templatePick);}
  else if(button.hasAttribute('data-template-confirm')){event.preventDefault();if(state.pending)applyMessageTemplate(input,state.pending.option,state.pending.index);}
  else if(button.hasAttribute('data-template-cancel')){event.preventDefault();const index=state.pending?.index||0;state.pending=null;syncMessageTemplates(input);$('[data-template-pick="'+index+'"]',box)?.focus({preventScroll:true});}
  else if(button.hasAttribute('data-template-undo')){event.preventDefault();undoMessageTemplate(input);}
 });
 document.addEventListener('input',event=>{
  const input=event.target;
  // A prepared reply must never send stale text after a recipient edits it.
  if(input.id==='recipientReply'){replySharedText='';$('#replyResult')?.replaceChildren();}
  if(applyingMessageTemplate)return;
  const state=templateState.get(input);if(state){state.pending=null;syncMessageTemplates(input);}
  if(input.id==='recipientName'||input.id==='senderName')refreshMessageTemplates();
  if(input.id==='quizQuestion')for(const id of ['quizAnswer','quizDecoy0','quizDecoy1'])renderMessageTemplates($('#'+id));
 });
 // Registered after the builder's vibe handler, so suggestions use the new vibe.
 document.addEventListener('click',event=>{if(event.target.closest('[data-vibe]'))refreshMessageTemplates();});
}

/* Bind the little moments together. */
$('#vibeGrid').innerHTML=VIBES.map(v=>`<button type="button" class="vibe-btn" data-vibe="${v.name}" aria-pressed="${v.name===draft.vibe}"><span class="vibe-icon" aria-hidden="true">${v.symbol}</span>${v.name}</button>`).join('');
$('#homeRoomBg').innerHTML=portraitSVG('home-room');$('#editorRoomBg').innerHTML=portraitSVG('editor-room');$('#homeCandle').innerHTML=cakeSVG('home-cake');$('#editorCake').innerHTML=cakeSVG('editor-cake');
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-action]');if(!button)return;event.preventDefault();switch(button.dataset.action){case'home':goHome();break;case'create':browseGifts();break;case'preview':previewGift();break;case'publish':publishGift();break;case'edit':wizardStep=0;populateForm();showView('creator');setStep(0,false);break;}
});
$('#giftForm').addEventListener('submit',event=>{event.preventDefault();publishGift();});
$('#giftForm').addEventListener('input',event=>{
 const el=event.target,map={recipientName:'name',personalMessage:'message',senderName:'sender',funMessage:'funMessage',finalMessage:'finalMessage',finalUrl:'finalUrl'};
 if(map[el.id])draft[map[el.id]]=el.value;
 if(el.id==='recipientName'&&draft.name.trim()){$('#nameError').hidden=true;el.setAttribute('aria-invalid','false');}
 if(el.id==='voiceUrl'){draft.voice=safeWebURL(el.value);draft.voiceName='';renderAudioChip('voice');}
 if(el.id==='musicUrl'){draft.musicSrc=safeWebURL(el.value);draft.music=draft.musicSrc?'custom':'none';draft.musicName='';renderAudioChip('music');}
 if(el.dataset.caption!==undefined&&draft.photos[Number(el.dataset.caption)])draft.photos[Number(el.dataset.caption)].caption=el.value;
 if(el.dataset.memoryWhen!==undefined&&draft.memories[Number(el.dataset.memoryWhen)])draft.memories[Number(el.dataset.memoryWhen)].when=el.value;
 if(el.dataset.memoryText!==undefined&&draft.memories[Number(el.dataset.memoryText)])draft.memories[Number(el.dataset.memoryText)].text=el.value;
 updatePreview();saveDraft();
});
$('#giftForm').addEventListener('click',event=>{
 const vibe=event.target.closest('[data-vibe]');if(vibe){draft.vibe=vibe.dataset.vibe;updatePreview();saveDraft();}
 const music=event.target.closest('[data-music]');if(music){draft.music=music.dataset.music;draft.musicSrc='';draft.musicName='';$('#musicUrl').value='';renderAudioChip('music');updatePreview();saveDraft();}
 const fun=event.target.closest('[data-fun]');if(fun){draft.fun=fun.dataset.fun;updatePreview();saveDraft();}
 const removePhoto=event.target.closest('[data-remove-photo]');if(removePhoto){draft.photos.splice(Number(removePhoto.dataset.removePhoto),1);renderPhotoList();saveDraft();}
 const removeMemory=event.target.closest('[data-remove-memory]');if(removeMemory){draft.memories.splice(Number(removeMemory.dataset.removeMemory),1);renderMemoryList();saveDraft();}
 const removeAudio=event.target.closest('[data-remove-audio]');if(removeAudio){const kind=removeAudio.dataset.removeAudio;if(kind==='voice'){draft.voice='';draft.voiceName='';}else{draft.musicSrc='';draft.musicName='';draft.music='none';}renderAudioChip(kind);updatePreview();saveDraft();}
});
$('#photoUpload').addEventListener('change',event=>uploadPhotos(event.target.files));
$('#addPhotoUrl').addEventListener('click',()=>{if(draft.photos.length>=4){toast('Four photos is the limit for this little album.');return;}const src=safeWebURL($('#photoUrl').value);if(!src){toast('Add a complete, public http or https image link.');$('#photoUrl').focus();return;}draft.photos.push({src,caption:''});$('#photoUrl').value='';renderPhotoList();saveDraft();});
$('#photoUrl').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();$('#addPhotoUrl').click();}});
$('#addMemory').addEventListener('click',()=>{if(draft.memories.length>=3)return;draft.memories.push({when:'',text:''});renderMemoryList();saveDraft();$$('[data-memory-text]').at(-1)?.focus();});
$('#voiceUpload').addEventListener('change',event=>uploadAudio(event.target.files[0],'voice'));$('#musicUpload').addEventListener('change',event=>uploadAudio(event.target.files[0],'music'));$('#recordVoice').addEventListener('click',toggleRecording);$('#clearDraft').addEventListener('click',confirmReset);
$('#copyGiftLink').addEventListener('click',()=>{copyText(publishedURL,publicHosting()?'Your little gift link is copied. Send it with love. ♡':'Local preview link copied. Host this HTML publicly for a link that works on other devices.');});
$('#giftLink').addEventListener('click',event=>event.target.select());
$('#whatsappGift').addEventListener('click',()=>{if(!publicHosting()||publishedURL.length>8000)return;if(publishedGift.occasion==='wedding'){openWhatsApp(weddingInviteText(publishedGift,publishedURL));return;}openWhatsApp(`Psst, ${publishedGift.name}… I made you a little Kholona: ${occasionOf(publishedGift).share}. Kholo na, when you have a quiet moment. ♡\n\n${publishedURL}`);});
$('#previewPublished').addEventListener('click',()=>{if(!publishedGift)return;previewScrollY=window.scrollY;startExperience(publishedGift,{preview:true,returnView:'share'});});$('#downloadGift').addEventListener('click',downloadGiftHTML);
$('#homeCandle').addEventListener('click',()=>{if(homeOccasion!=='birthday'){previewOccasion(homeOccasion);return;}const cake=$('#homeCandle');if(cake.classList.contains('extinguished')){cake.classList.remove('extinguished');$('#homeCandleHint').textContent='another little wish? go on.';cake.setAttribute('aria-label','Make a little wish and blow out the candles');return;}cake.classList.add('extinguished');cake.setAttribute('aria-label','Relight the birthday candles');$('#homeCandleHint').textContent='your little wish is on its way ♡';chime('wish');const r=cake.getBoundingClientRect();confetti(30,{x:r.x+r.width/2,y:r.y+30});});
$('#experience').addEventListener('click',event=>{
 const balloon=event.target.closest('[data-balloon]');if(balloon){popBalloon(balloon);return;}const quiz=event.target.closest('[data-quiz]');if(quiz){answerQuiz(quiz);return;}const r=event.target.closest('[data-reaction]');if(r){selectReaction(r.dataset.reaction);return;}
 const button=event.target.closest('[data-story]');if(!button)return;switch(button.dataset.story){case'light':lightUp();break;case'embed-unlock':try{window.parent.postMessage({type:'kholona-embed-unlock'},location.origin);}catch{}break;case'next':chime();goToScene(sceneIndex+1);break;case'blow':blowCandles();break;case'microphone':startBlowing();break;case'open-gift':openPresent();break;case'sound':toggleSound();break;case'exit-preview':exitPreview();break;case'preview-unlock':exitPreview();unlockGift();break;case'preview-save':exitPreview();publishGift();break;case'reveal-scratch':revealScratch();break;case'prepare-reply':prepareReply();break;case'share-reply':shareReply();break;case'copy-reply':copyText(replySharedText,'Your little thank-you is copied. Send it back with love.');break;case'whatsapp-reply':whatsappReply();break;case'replay':{const data=gift,preview=isPreview,ret=previewReturn;startExperience(data,{preview,returnView:ret,skipSeal:true});setTimeout(()=>lightUp(true),250);break;}case'make-your-own':browseGifts();break;}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopBlowing();if(mediaRecorder)stopRecording(true);if(musicAudio)musicAudio.pause();if(audioContext?.state==='running')audioContext.suspend().catch(()=>{});cancelAnimationFrame(confettiFrame);$('#confettiCanvas').hidden=true;}else if(currentView==='experience'&&$('#experience').classList.contains('lit')&&!soundMuted){ensureAudio();if(musicAudio)musicAudio.play().catch(()=>{});}});
window.addEventListener('pagehide',()=>{stopBlowing();stopRecording(false);stopMusic();});
window.addEventListener('hashchange',async()=>{if(!await routeV2()&&currentView==='experience'&&!isPreview)goHome();});
async function loadGiftFromLocation(){
 const token=++experienceToken;try{const g=await decodeGift(location.hash.slice(6));if(token!==experienceToken)return;startExperience(g);}catch(err){if(token!==experienceToken)return;showView('error');$('#errorMessage').textContent=err.message||'The gift link looks incomplete. Ask the sender to copy the whole link, or send the downloadable gift file.';}
}
/* The sorry gift's little characters: a teddy, a kitty, or a pile of stickers. Sad until forgiven, then very happy. */
function sorryArt(kind,mood='sad'){
 const happy=mood==='happy',heart=(x,y,s=1,c='#ff7aa2')=>`<path d="M${x} ${y+6*s}c${-11*s} ${-7*s} ${-7*s} ${-15*s} 0 ${-9*s} ${7*s} ${-6*s} ${11*s} ${2*s} 0 ${9*s}Z" fill="${c}"/>`;
 const floaters=happy?`<g class="sorry-floaters">${heart(52,66,1.6)}${heart(246,58,1.3,'#ff5c8a')}${heart(258,150,1,'#ffb3c7')}${heart(40,150,1.1,'#ff5c8a')}</g>`:`<g class="sorry-floaters" opacity=".7">${heart(56,70,1.1,'#ffb3c7')}${heart(246,64,.9,'#ffb3c7')}</g>`;
 if(kind==='stickers'){
  const t=(x,y,size,glyph,r=0,cls='')=>`<text class="${cls}" x="${x}" y="${y}" font-size="${size}" transform="rotate(${r} ${x} ${y})">${glyph}</text>`;
  return `${floaters}<g class="sorry-stickers" text-anchor="middle" font-family="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif"><circle cx="150" cy="126" r="86" fill="#fff" opacity=".72"/>${happy?t(150,168,116,'🥰',0,'sorry-main')+t(68,84,42,'💞',-12)+t(234,92,40,'✨',10)+t(236,214,38,'💗',8)+t(66,210,36,'🎉',-8):t(150,168,116,'🥺',0,'sorry-main')+t(68,84,42,'🩹',-14)+t(234,94,38,'💗',12)+t(236,214,36,'🧸',6)+t(64,208,34,'👉👈',-6)}</g>`;
 }
 const cat=kind==='cat',fur=cat?'#fff6ef':'#d9a06f',edge=cat?'#e2b2a8':'#b47548',inner=cat?'#ffc6d3':'#f6d2b4',ink=cat?'#3d2a2e':'#4a2c22',w=1.6;
 const eye=cat?13:11,eyes=happy?`<path d="M${150-26-eye} 101q${eye} -13 ${eye*2} 0M${150+26-eye} 101q${eye} -13 ${eye*2} 0" stroke="${ink}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`:`<g class="sorry-eyes">${[124,176].map(x=>`<circle cx="${x}" cy="99" r="${eye}" fill="${ink}"/><circle cx="${x+4}" cy="${99-5}" r="${eye*.42}" fill="#fff"/><circle cx="${x-4}" cy="${99+5}" r="${eye*.18}" fill="#fff"/>`).join('')}</g><path d="M110 ${cat?78:80}l21-7M190 ${cat?78:80}l-21-7" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
 const mouth=happy?(cat?`<path d="M139 129q5.5 8 11 0 5.5 8 11 0" stroke="${ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`:`<path d="M137 129q13 15 26 0Z" fill="#ff8fab" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>`):`<path d="M142 ${cat?134:137}q8-6 16 0" stroke="${ink}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
 const face=`${cat?`<path d="M144 117h12l-6 7Z" fill="#ff8fab"/><path d="M92 116l-26-4M92 125l-26 4M208 116l26-4M208 125l26 4" stroke="${edge}" stroke-width="1.6" stroke-linecap="round"/>`:`<ellipse cx="150" cy="124" rx="25" ry="18" fill="${inner}"/><ellipse cx="150" cy="115" rx="8" ry="6" fill="${ink}"/>`}${eyes}${mouth}<ellipse cx="106" cy="121" rx="11" ry="7" fill="#ff8fab" opacity="${happy?.85:.5}"/><ellipse cx="194" cy="121" rx="11" ry="7" fill="#ff8fab" opacity="${happy?.85:.5}"/>${happy?'':`<path class="sorry-tear" d="M115 108q-7 11 0 15 7-4 0-15Z" fill="#8fd0ff"/>`}`;
 const ears=cat?`<path d="M94 86 101 28l40 34Z" fill="${fur}" stroke="${edge}" stroke-width="${w}" stroke-linejoin="round"/><path d="M103 74l4-31 22 19Z" fill="${inner}"/><path d="M206 86 199 28l-40 34Z" fill="${fur}" stroke="${edge}" stroke-width="${w}" stroke-linejoin="round"/><path d="M197 74l-4-31-22 19Z" fill="${inner}"/>`:`<circle cx="104" cy="58" r="21" fill="${fur}" stroke="${edge}" stroke-width="${w}"/><circle cx="104" cy="58" r="11" fill="${inner}"/><circle cx="196" cy="58" r="21" fill="${fur}" stroke="${edge}" stroke-width="${w}"/><circle cx="196" cy="58" r="11" fill="${inner}"/>`;
 const held=happy?`<path class="sorry-held" d="M150 218c-38-22-34-52-13-54 7-1 12 4 13 10 1-6 6-11 13-10 21 2 25 32-13 54Z" fill="#ff5c8a" stroke="#e0507f" stroke-width="1.6"/><circle cx="118" cy="190" r="13" fill="${fur}" stroke="${edge}" stroke-width="${w}"/><circle cx="182" cy="190" r="13" fill="${fur}" stroke="${edge}" stroke-width="${w}"/>`:`<g class="sorry-held" transform="rotate(-6 150 187)"><rect x="103" y="166" width="94" height="42" rx="10" fill="#fff" stroke="#f08aa8" stroke-width="2"/><text x="150" y="195" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="23" fill="#e0507f">sorry</text></g><circle cx="105" cy="187" r="13" fill="${fur}" stroke="${edge}" stroke-width="${w}"/><circle cx="195" cy="187" r="13" fill="${fur}" stroke="${edge}" stroke-width="${w}"/>`;
 const tail=cat?`<path d="M196 218q50-2 42-44-4-16-17-9" fill="none" stroke="${edge}" stroke-width="16" stroke-linecap="round"/><path d="M196 218q50-2 42-44-4-16-17-9" fill="none" stroke="${fur}" stroke-width="12" stroke-linecap="round"/>`:'';
 return `${floaters}<g class="sorry-figure ${cat?'is-cat':'is-teddy'}">${tail}<ellipse cx="150" cy="196" rx="${cat?54:58}" ry="44" fill="${fur}" stroke="${edge}" stroke-width="${w}"/><ellipse cx="150" cy="204" rx="33" ry="25" fill="${cat?'#fff':inner}" opacity="${cat?.8:1}"/><ellipse cx="114" cy="230" rx="21" ry="11" fill="${fur}" stroke="${edge}" stroke-width="${w}"/><ellipse cx="186" cy="230" rx="21" ry="11" fill="${fur}" stroke="${edge}" stroke-width="${w}"/>${ears}<ellipse cx="150" cy="103" rx="${cat?64:60}" ry="${cat?52:54}" fill="${fur}" stroke="${edge}" stroke-width="${w}"/>${face}${held}</g>`;
}
/* Original little paper objects. No external images, fonts or network assets. */
function occasionArt(kind,id='little-art'){
 if(kind==='cake')return cakeSVG(id);
 if(kind==='marigold')return weddingArtSVG(id);
 const svg=(body)=>`<svg viewBox="0 0 300 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="${id}-paper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fffaf0"/><stop offset="1" stop-color="#f7dac6"/></linearGradient><linearGradient id="${id}-rose" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f79ab0"/><stop offset="1" stop-color="#db5384"/></linearGradient><linearGradient id="${id}-gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fbe0a1"/><stop offset="1" stop-color="#de9c40"/></linearGradient></defs><ellipse cx="150" cy="233" rx="89" ry="7" fill="#9f4c25" opacity=".055"/>${body}</svg>`;
 const littleStars=`<g fill="none" stroke="#e69449" stroke-width="1.2" stroke-linecap="round"><path d="M55 65v14m-7-7h14M251 121v12m-6-6h12"/><path d="m231 43 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/></g>`;
 const shapes={
  envelope:`${littleStars}<g transform="rotate(-5 150 150)"><rect x="47" y="87" width="206" height="128" rx="7" fill="url(#${id}-paper)" stroke="#e2b08f" stroke-width="1.2"/><path d="m48 207 96-68q6-5 12 0l95 68" fill="#fdeada" stroke="#eec1a3" stroke-width="1"/><path class="envelope-flap" d="m48 89 94 70q8 6 16 0l94-70" fill="#fff8ed" stroke="#e2b08f" stroke-width="1.1"/><path d="m64 107 71 54m37 0 65-47" fill="none" stroke="#f1c6a1" stroke-width=".7" stroke-dasharray="3 4"/><circle cx="150" cy="161" r="20" fill="#e26d90"/><circle cx="150" cy="161" r="16" fill="none" stroke="#f98fa6" stroke-width="1"/><path d="M150 169c-22-13-10-25 0-13 10-12 22 0 0 13" fill="#ffd2cb"/></g>`,
  hearts:`${littleStars}<g class="art-heart-back" transform="translate(-6 -12) rotate(-15 113 113)"><path d="M128 159 66 112q-23-39 7-46 22-7 38 20 12-23 32-15 32 12 12 46Z" fill="#efbca9" stroke="#db9d79"/><path d="m74 88 53 69 27-69m-80 0 51 19 29-19m-27 19v49" stroke="#d78c62" fill="none" opacity=".5"/></g><g transform="rotate(8 167 152)"><path d="m171 213-78-65q-25-47 11-59 26-8 45 27 17-31 41-20 35 17 15 56Z" fill="url(#${id}-rose)" stroke="#d46389" stroke-width="1.2"/><path d="m102 114 69 96 32-83m-101-13 65 34 36-21m-36 21 4 62" fill="none" stroke="#c7507f" opacity=".6"/><path d="m105 113 59 31-15-28" fill="#ffb7c7" opacity=".8"/></g><path d="m212 184 12 9-12 11-12-11q-4-15 12-9Z" fill="#f8cec3"/>`,
  olive:`<g fill="none" stroke="#809e67" stroke-width="2.2" stroke-linecap="round"><path d="M112 225Q128 138 192 53M135 165l-47-46m67 13 44-15m-24-21-21-43"/></g><g fill="#a3b885" stroke="#89a367" stroke-width=".8"><path d="M116 190q-46-11-39-48 38 4 39 48Z"/><path d="M130 171q44 2 49-32-35-6-49 32Z"/><path d="M142 144q-33-18-21-49 30 7 21 49Z"/><path d="M160 119q45 1 53-32-38-8-53 32Z"/><path d="M174 93q-29-21-13-52 31 18 13 52Z"/><path d="M190 67q34-9 29-40-30 0-29 40Z"/></g><g fill="#687c66"><ellipse cx="131" cy="178" rx="6" ry="8" transform="rotate(20 131 178)"/><ellipse cx="157" cy="133" rx="5" ry="7"/></g><path d="M122 199c-44-25-36 21 0 5 30 24 44-15 0-5Z" fill="#eebbb8" stroke="#d88892"/><path d="m122 204-12 30m14-30 11 25" fill="none" stroke="#d88892" stroke-width="6"/><path d="M69 64q6-12 15 0-9 14-15 0Z" fill="none" stroke="#dba17d"/>`,
  book:`${littleStars}<g transform="rotate(-4 150 140)"><path d="M42 91q54-28 108-4 54-24 108 4v129q-61-23-108-3-48-20-108 3Z" fill="#d2758a" stroke="#c05877" stroke-width="1.3"/><path d="M47 79q51-19 103 8v119q-49-24-103-8Zm103 8q49-27 103-8v119q-53-26-103 8Z" fill="url(#${id}-paper)" stroke="#e5b596"/><path d="M150 87v119M57 190q37-11 82 5m22 0q41-17 81-5" stroke="#e6b38a" stroke-width=".9" fill="none"/><path d="M174 79v66l9-7 9 7V74" fill="#e16a94"/><path d="M83 124q-8-15 8-14 11 0 10 15 18-9 21 4 3 10-16 20Z" fill="#f496ad"/><g fill="none" stroke="#e1af8d" stroke-linecap="round"><path d="m69 160 56 4m-56 8 44 4m47-21 71-6m-71 18 58-6m-58 18 46-5"/></g></g>`,
  bouquet:`<g stroke="#91a96c" stroke-width="2.5" fill="none"><path d="m150 215-47-119m47 119 47-120m-47 119 2-145"/></g><g fill="#a8be84"><path d="M139 188q-44-1-39-35 36 2 39 35Z"/><path d="M161 174q41-6 33-37-33 7-33 37Z"/></g><g class="bouquet-flower">${[[100,93,'#f189ab',24],[153,65,'#fedf99',25],[202,104,'#d8b09f',22]].map(([x,y,color,r])=>`<g transform="translate(${x} ${y})">${[0,60,120,180,240,300].map(a=>`<ellipse cx="0" cy="-${r*.65}" rx="${r*.55}" ry="${r*.77}" transform="rotate(${a})" fill="${color}" stroke="#c66b68" stroke-opacity=".24"/>`).join('')}<circle r="9" fill="#df964b"/><circle r="5" fill="#fde19d"/></g>`).join('')}</g><path d="m150 171-66-33 35 92h58l41-92-66 33" fill="url(#${id}-paper)" stroke="#e1af8d" stroke-width="1" opacity=".94"/><path d="m98 155 34 63m66-65-32 66" stroke="#f0c5a0" fill="none"/><path d="M150 200c-41-22-43 21 0 6 31 25 46-20 0-6Z" fill="#e3739c" stroke="#cd5484"/><path d="m148 207-9 30m12-30 10 26" stroke="#e3739c" stroke-width="7"/><path d="M236 61v12m-6-6h12" stroke="#dc985f" fill="none"/>`,
  medal:`${littleStars}<path class="medal-ribbon" d="m112 147-30 86 41-17 19 22 14-80m12-11 37 86-40-13-21 17-8-78" fill="#e26e95" stroke="#c85c8a" stroke-width="1.1"/><g transform="translate(151 113)"><path d="${Array.from({length:32},(_,i)=>{const a=i*Math.PI/16,r=i%2?54:64;return(i?'L':'M')+(Math.cos(a)*r).toFixed(1)+' '+(Math.sin(a)*r).toFixed(1);}).join('')}Z" fill="url(#${id}-gold)" stroke="#df9c40"/><circle r="45" fill="#ffe7b0" stroke="#df9b4b"/><circle r="39" fill="none" stroke="#f0be63" stroke-dasharray="1 5" stroke-linecap="round"/><path d="m0-26 8 17 19 3-14 13 3 19L0 17l-17 9 4-19-14-13 19-3Z" fill="#fcaf45" stroke="#e39539" stroke-width="1"/></g>`,
  plane:`<path d="M66 191c-61-31-29-78 5-52 22 17-5 38-10 17-7-28 62-24 94-33" fill="none" stroke="#e59d71" stroke-width="1.5" stroke-dasharray="4 6" stroke-linecap="round"/><g class="paper-plane" transform="rotate(-9 170 120)"><path d="m77 112 169-49-62 132-32-49-49 6 7-25Z" fill="url(#${id}-paper)" stroke="#d3916f" stroke-width="1.4"/><path d="m103 151 143-88-94 83m-42-19 136-64m-94 83 32 49" fill="none" stroke="#e69272" stroke-width="1.2"/><path d="m152 146-16 24-8-32 118-75Z" fill="#f5a1b4" stroke="#d97f9f" stroke-width=".8"/></g><path d="M228 194c-20-12-9-23 0-12 9-11 20 0 0 12Z" fill="#e980a2"/><path d="M62 62q-15 31 19 28-35 24-40-4-3-16 21-24Z" fill="#f3bd7b"/>`,
  ring:`${littleStars}<ellipse cx="150" cy="219" rx="82" ry="11" fill="#d15974" opacity=".11"/><path d="M68 157q82-32 164 0v50q-82 38-164 0Z" fill="#d16087" stroke="#b14775"/><ellipse cx="150" cy="157" rx="82" ry="25" fill="#ed97ac" stroke="#c65d86"/><ellipse cx="150" cy="158" rx="68" ry="18" fill="#ae4471"/><path d="M71 152V66q79-35 158 0v86q-77-47-158 0Z" fill="#d96d93" stroke="#bd497d"/><path d="M83 132V74q68-26 134 0v58q-69-32-134 0Z" fill="#f9bfce"/><ellipse cx="150" cy="145" rx="26" ry="30" fill="none" stroke="#ffb34f" stroke-width="7"/><path d="m133 113 9-13h17l9 13-18 16Z" fill="#fff8e6" stroke="#efb870" stroke-width="1.4"/><path d="m133 113 35 0m-26-13 8 29 9-29" fill="none" stroke="#fcc988"/>`
 };
 const sorry=/^(teddy|cat|stickers)(-happy)?$/.exec(kind);if(sorry)return svg(sorryArt(sorry[1],sorry[2]?'happy':'sad'));
 return svg(shapes[kind]||shapes.envelope);
}
function occasionArtFor(g){const o=occasionOf(g);if(g.occasion==='apology')return sorryCharacter(g);return g.occasion==='proposal'&&g.proposalKind==='marriage'?'ring':o.art;}

/* Every suggestion is written locally, selectable, editable, and never sent for you. */
const W_NOTES=['Come for the functions, stay for the food, and dance with us. Your presence is the only gift we need.','We would love to have you with us as we begin this new chapter. It won’t feel complete without you.','Two families, one big celebration. Bring your dancing shoes and your blessings.'];
const OCCASION_MESSAGES={
 proposal:{
  note:[['A brave little hello','{name}, I like the way life feels when you’re in it. I’d love to find out what more of us could look like. So, with a few butterflies and a lot of honesty, I have a little question for you.'],['The ordinary moments','It’s the little things, {name}. The conversations I don’t want to end. The way I look forward to seeing you. I’d like to make a little more room for us, if that feels right to you too.'],['No perfect speech','I don’t have a perfect speech, {name}. Just a very real feeling, and a question I wanted to ask with care. Whatever your answer, I want it to be yours. ♡']],
  finale:[['Whatever comes next','Whatever comes next, thank you for sharing this little moment with me. Your honest answer matters more than the perfect one.'],['Take your time','There is no countdown here. A little question can wait for an honest answer. Take all the time you need.'],['Let’s talk','Maybe the next part of this story is a conversation. I’d really like that, whenever you’re ready.']],
  secret:['A small secret: you give me the butterflies.','I rehearsed this in my head. This version has much nicer lighting.','There’s a little hope tucked into this moment. No expectations. Just honesty.'],
  captions:[['A little us','A little moment I’m glad we shared.'],['The beginning','Some stories start with a small hello.'],['Kept close','One I wanted to keep close. ♡']],
  memory:['I remember wanting that conversation to last a little longer.','There was a little moment when I realized I wanted to know you better.','I like thinking about the ordinary moments we could share.'],
  replies:[['A little yes','Yes, I’d love to. Thank you for asking with so much care. ♡'],['Let’s talk','Thank you for being honest with me. I’d like to talk before I answer.'],['A kind no','Thank you for asking so thoughtfully. I don’t feel the same way, and I wanted to be honest with you.']]
 },
 love:{
  note:[['Ordinary Tuesdays','{name}, this is your reminder that you are loved. On the big days, the messy days, and the ordinary Tuesdays. You don’t have to do anything special to mean the world to me. ♡'],['My favorite hello','You’re one of my favorite parts of being here, {name}. Your smile. Your little ways. The fact that you are unmistakably you. Today felt like a good day to tell you.'],['Just because','No special occasion, {name}. No reason other than this: I love having you in my world. Here’s a little piece of that love, for whenever you need it.']],
  finale:[['Keep this little corner','Keep this little corner of love. Come back whenever your day needs a softer place to land. ♡'],['A pocketful of love','A pocketful of love, with your name on it. For today, and all the ordinary days after.'],['Always worth saying','I love you. It’s a small sentence, but I hope it never feels small.']],
  secret:['You make my ordinary days a little more lovely.','A tiny reminder: you never have to earn the love in this little corner.','I like you a ridiculous amount. Even when I forget how to say it.'],
  captions:[['Favorite human','One of my favorite views: you being you.'],['Ordinary magic','An ordinary moment. My favorite kind.'],['Kept forever','A little moment with a lot of love in it.']],
  memory:['I wish I could keep the feeling of that little moment in a pocket.','Some of my favorite memories are the days we didn’t plan anything at all.','This still makes me smile. Not because it was perfect. Because it was us.'],
  replies:[['Right back at you','This made me feel so loved. Sending every bit of it right back to you. ❤️'],['Keeping this','I’m keeping this little corner of love. Thank you for making it for me. 🥹'],['My favorite surprise','No occasion, just this? You made an ordinary day feel very special. ♡']]
 },
 apology:{
  note:[['Cute','{name}, I’m sorry. I was wrong, you were right, and I would like that framed. I hate it when we fight. I miss your face, your voice and your terrible jokes. Can we go back to being us? 🥺'],['Romantic','I’m sorry, {name}. The truth is, nothing feels right when things aren’t right with you. You’re my favourite person, even when I’m being an idiot. Especially then. Let me make it up to you. 💗'],['Funny','Dear {name}, I have reviewed my behaviour and found it extremely silly. The court of you has every right to be mad. I humbly request a hug, a snack and one more chance. 🥺👉👈']],
  finale:[['Not temporary','Fights are temporary. You and me? Not even a little bit temporary. 💗'],['Still my favourite','Even on our worst day, you are still my favourite person in the whole world.'],['Lesson learned','Lesson learned. Hug pending. Love: permanent. 🥺']],
  secret:['I practised this sorry in the mirror. Twice.','You look extra cute when you’re mad. Please don’t be mad for long.','I was going to bring flowers, but you are already the prettiest thing in the room.'],
  captions:[['Exhibit A','Exhibit A: we are cute together.'],['Before','Us, before I was an idiot.'],['Again soon','Can we go back to this, please? 🥺']],
  memory:['Remember when we laughed until we cried? I want a hundred more of those.','This was the day I knew I never wanted to lose you.','You were right that day too. You usually are.'],
  replies:[['Forgiven','Okay fine. You’re forgiven. 💗 Come here.'],['Lucky you’re cute','You’re lucky you’re cute. Forgiven, but you owe me a hug. 🙄💗'],['Still a bit mad','I’m still a tiny bit mad. But this helped. A lot. 🥺']]
 },
 anniversary:{
  note:[['Our little story','Happy anniversary, {name}. I love that our story is made of a thousand little things. Familiar smiles, ordinary days, and choosing to keep learning each other. Here’s to more pages. ♡'],['Still choosing us','{name}, here’s to the beginning, the everyday, and everything we haven’t discovered yet. I’m grateful for this chapter, and for you. Happy anniversary.'],['Not perfect. Ours.','Our story isn’t perfect, {name}. It’s real, still unfolding, and full of little moments I wouldn’t trade. Happy anniversary to us, and to whatever lovely thing comes next.']],
  finale:[['The next chapter','Here’s to the next chapter. More little adventures. More ordinary days. More us.'],['Keep choosing','A new chapter, and another chance to keep choosing each other with care.'],['My favorite story','Not a perfect story. Our story. Still my favorite one. ♡']],
  secret:['Another chapter. Still glad it’s with you.','I’d like a few more pages of this little story, please.','The everyday parts of us might be my favorite parts.'],
  captions:[['A page of us','A little page in our story.'],['Still smiling','One I’m still smiling about.'],['This chapter','A moment that belongs to this chapter.']],
  memory:['This is one of those days that became part of our little story.','I love the way the small moments have added up to something that feels like us.','Looking back, I’m grateful we got to share this part of the story.'],
  replies:[['More us','Happy anniversary to us. Here’s to more little moments, and more of this story. ❤️'],['My favorite chapter','This made me smile so much. I’m so glad I get to share these chapters with you.'],['Keeping the pages','I’m keeping this. Thank you for making our little story feel so special. 🥹']]
 },
 thanks:{
  note:[['Kindness noticed','{name}, your kindness didn’t go unnoticed. Neither did the thought you put into the little things. Thank you for making a difference in a way only you could. ♡'],['A grateful heart','Some thank-yous deserve more than a quick message, {name}. This is a small thing, but there is a very grateful heart behind it. Thank you for being there.'],['The quiet difference','{name}, you may not always see the difference you make. I wanted you to know that I do. Thank you for the kindness, the thoughtfulness, and for being you.']],
  finale:[['Every little flower','Every little flower in this bouquet means thank you. I hope you feel every bit of it.'],['It mattered','What you did mattered. You matter. Thank you, again and again.'],['A little reminder','Keep this as a little reminder of the difference your kindness makes. ♡']],
  secret:['Your kindness made a difference. It really did.','A little thank-you for a not-so-little kindness.','I noticed. I appreciated it. I haven’t forgotten.'],
  captions:[['A kind moment','A little moment of kindness.'],['Worth remembering','Something I’m glad to remember.'],['Thankful for you','One more reason I’m thankful for you.']],
  memory:['I remember this little kindness, even if it felt small to you at the time.','This is one of those moments that reminded me how thoughtful you are.','You made this day a little easier, and I haven’t forgotten.'],
  replies:[['Means a lot','This means a lot. Thank you for taking the time to say it so thoughtfully. ♡'],['So lovely','What a lovely surprise. I’m really glad I could make a little difference.'],['A smile back','Your little bouquet made me smile. Sending a very happy smile back. 🥹']]
 },
 congratulations:{
  note:[['Let it sink in','Congratulations, {name}! Pause for a moment and let yourself enjoy this. The effort, the courage, the little steps: they all matter. I’m cheering for you. ✧'],['A well-earned moment','{name}, this is your moment. Not a moment to hurry past on the way to the next thing. A moment to feel proud, smile a little, and celebrate. Congratulations!'],['Your next chapter','Look at you, {name}. A new chapter, a little more confidence, and so many possibilities ahead. Congratulations on this lovely step forward.']],
  finale:[['Take your bow','Take your little bow. Enjoy your moment. You deserve to celebrate it.'],['Here’s to more','Here’s to this win, the courage it took, and all the possibilities still to come.'],['Cheering for you','I’m cheering for you. For this chapter, and whatever wonderful thing you try next. ✧']],
  secret:['You are allowed to feel proud of yourself.','Big wins. Quiet victories. They all count.','A little spotlight, entirely yours.'],
  captions:[['The moment','A moment worth celebrating.'],['Little steps','The little steps that led here.'],['Look at you','Look at you. Look how far you’ve come.']],
  memory:['A little reminder of the effort that came before this moment.','This is one of those steps worth looking back on with pride.','It wasn’t just one big moment. The little things mattered too.'],
  replies:[['Thank you for cheering','Thank you for cheering me on. This made my moment feel even more special. 🎉'],['Feeling proud','This was such a lovely reminder to pause and enjoy it. Thank you. 🥹'],['Best little surprise','A whole little celebration! Thank you for thinking of me and making this. ♡']]
 },
 wedding:{
  note:W_NOTES.map((t,i)=>[['Come celebrate','A new chapter','Two families'][i],t]),
  finale:[['Your presence','Your presence is the only gift we need. 💛']],
  secret:['Come for the functions, stay for the food.'],
  captions:[['Us','Our story so far.']],
  memory:['The day it all began.'],
  replies:[['Blessings','Congratulations to you both! Wishing you a lifetime of love, laughter and adventures together. 🙏'],['We’ll be there','We wouldn’t miss it for the world! Can’t wait to dance at your sangeet. 🎉'],['So happy for you','So, so happy for you two. Sending all our love and blessings from the whole family. 💛']]
 },
 missyou:{
  note:[['Across the distance','{name}, I wish I could fold the distance into something small. Until then, here’s a little bit of me in your day. I miss you, and I’m glad you’re in my world. ♡'],['The ordinary things','It’s the ordinary things I miss, {name}. Little conversations. Having you nearby. The moments that don’t need a plan. Here’s a small hello from over here.'],['Same little sky','Different places, {name}. The same little sky. I hope this makes the distance feel smaller, even just for a moment. I’m thinking of you.']],
  finale:[['Until the next hello','Until the next hello, there’s a little light for you over here. ♡'],['A paper hug','A little paper hug. No distance limit. Come back and catch it whenever you need one.'],['Held close','A little far apart. Still held close. Thinking of you, today and all the in-between days.']],
  secret:['A little hug, sent from my corner of the world to yours.','Some people feel close, even from far away.','The distance is real. So is the love.'],
  captions:[['Wish you were here','Wish we could step back into this little moment.'],['Held close','A little memory, held close from far away.'],['Until next time','One for the days between hellos.']],
  memory:['I wish we could have another little moment like this one.','This is one I come back to on the days the distance feels a bit bigger.','An ordinary day then. A lovely memory to hold onto now.'],
  replies:[['Miss you too','I miss you too. Your little paper hug made the distance feel a bit smaller. ♡'],['Caught the hug','Paper hug received. Sending an enormous one right back across the distance. ❤️'],['A little closer','This made me feel a little closer to you. Thank you for thinking of me. 🥹']]
 }
};
function occasionMessageOptions(input,kind){
 const g=input.id==='recipientReply'&&gift?gift:draft,o=occasionOf(g),bank=OCCASION_MESSAGES[g.occasion];
 const rows=(items,labels=[])=>items.map((v,i)=>({label:Array.isArray(v)?v[0]:labels[i]||'A little idea '+(i+1),text:personalize(Array.isArray(v)?v[1]:v,g)}));
 if(kind==='proposalQuestion'){
  const k=g.proposalKind||'relationship';
  return rows(k==='marriage'?[['Simply said','Will you marry me?'],['The next chapter','Will you write the next chapter with me, as my partner for life?'],['The everyday','Will you share the ordinary days and the extraordinary ones with me?']]:k==='date'?[['A little date','Would you like to go on a date with me?'],['Coffee, maybe?','Would you like to share a coffee and a little conversation with me?'],['A little adventure','Would you like to go on a little adventure together?']]:[['My person','Will you be my person?'],['More of us','Would you like to see where this little story could go?'],['Something lovely','Would you like to begin something lovely with me?']]);
 }
 if(kind==='reason'){
  const index=Number(input.dataset.reason||0);
  const options=g.occasion==='thanks'?[
   ['For the kindness that made a difference.','For the way you made a little room for me.','For showing up with so much thoughtfulness.'],
   ['For noticing the little things.','For being generous with your time and attention.','For making something difficult feel a little easier.'],
   ['For being wonderfully, thoughtfully you.','For a kindness I haven’t forgotten.','For the quiet difference you make.']
  ]:[
   ['You make the ordinary feel a little more lovely.','You’re unmistakably you. That’s my favorite part.','I like the way my day feels when you’re in it.'],
   ['Your little ways make me smile more than you know.','You bring a warmth that feels entirely your own.','The smallest moments with you can mean the most.'],
   ['A small reminder: you are loved, exactly as you are.','I’m so glad I get to have you in my world.','Of all the lovely little things, you’re my favorite.']
  ];return rows(options[index%3],['A little reason','Another way to say it','Simply said']);
 }
 if(kind==='coupon'){
  const i=Number(input.dataset.coupon||0);
  return rows([[['Hug','One free hug. No expiry date.'],['Massage','One back massage. No questions asked.'],['Cuddles','Unlimited cuddles for a whole evening.']],[['Listening','I listen first and talk second. Promise.'],['You win','You win the next argument. Automatically.'],['No phone','One date night. My phone stays in my pocket.']],[['Food','Your choice of food. Zero complaints.'],['Movie','You pick the movie. I don’t fall asleep.'],['Dessert','One dessert of your choice, delivered by me.']]][i%3]);
 }
 if(kind==='trait')return rows([['Iconic','Main character energy'],['Sweet','A heart of gold'],['Chaotic','Certified chaos 🤪'],['Magic','Pure magic ✨']]);
 if(kind==='played')return rows([['Their laugh','Your laugh 🎶'],['Voice notes','Your 3-minute voice notes 🎶'],['Their jokes','Your terrible jokes 🎶'],['Their dancing','Your dance moves 🎶']]);
 if(kind==='forgiveQuestion')return rows([['Simply said','Will you forgive me? 🥺'],['Pleading','Pretty please forgive me? 🥺👉👈'],['Still us','Can we go back to being us? 💗']]);
 if(kind==='milestone')return rows([['A big new chapter','Your brave new chapter'],['A well-earned win','A well-earned moment'],['All those little steps','The little steps that became something big']]);
 if(kind==='reunion')return rows([['The next hello','Here’s to the next hello. Whenever it comes, I’ll be glad to share it with you.'],['No big plans needed','No big plans needed. A little time together would be lovely.'],['Until then','Until we can share the same little corner of the world, there’s a light for you in mine.']]);
 if(!bank)return null;
 if(kind==='note'){
  const result=rows(bank.note);
  // Preserve the meaning of sensitive copy. Vibe can soften/play up other gifts.
  if(g.occasion!=='proposal'){
   const touch={Romantic:'Made with a little extra love. ♡',Cute:'A pocket-sized hug, just for you. ♡',Funny:'Yes, I did make a whole little website for this. Very normal of me.',Emotional:'I hope these words find you gently.',Crazy:'A whole little moment for a one-of-a-kind human. ✷',Elegant:'Thoughtfully made, just for you.'}[g.vibe];
   result[2].text+='\n\n'+touch;
  }return result;
 }
 if(kind==='finale')return rows(bank.finale);
 if(kind==='secret')return rows(bank.secret,['A little reminder','A quiet thought','One more little thing']);
 if(kind==='caption')return rows(bank.captions);
 if(kind==='memory')return rows(bank.memory,['A moment to keep','The little things','Another way to say it']);
 if(kind==='memoryWhen')return rows(g.occasion==='anniversary'?['Our beginning','Somewhere along the way','This little chapter']:g.occasion==='apology'?['Us, being cute','The day I was right (jk)','Before I messed up']:['A little moment','One I’ve kept close','A day worth remembering']);
 if(kind==='reply')return rows(bank.replies);
 const packs=[
  {label:'A little star',q:'Who is this little world made for?',a:g.name||'You',wrong:['A very dramatic houseplant','The person hiding the ribbons']},
  {label:'Small things',q:'What makes an ordinary day a little better?',a:'A thoughtful little moment',wrong:['A missing sock','An extra-long queue']},
  {label:'The little secret',q:'What is tucked into every corner of this?',a:'A little care, just for you',wrong:['Exactly seven paperclips','A very confused potato']}
 ];
 const active=packs.find(p=>p.q===draft.quizQuestion)||packs[0];
 if(kind==='question')return packs.map(p=>({label:p.label,text:p.q,fields:{quizQuestion:p.q,quizAnswer:p.a,quizDecoy0:p.wrong[0],quizDecoy1:p.wrong[1]}}));
 if(kind==='answer')return rows([active.a,g.name||'You','Someone wonderfully you']);
 if(kind==='decoy')return rows([active.wrong[input.id==='quizDecoy0'?0:1],'A very confused ribbon','An extremely serious potato']);
 return null;
}

function occasionPortraitSVG(id,occasion){
 if(occasion==='birthday')return portraitSVG(id);
 const soft=occasion==='apology'?'#ffe0ea':occasion==='thanks'?'#faeccd':occasion==='missyou'?'#eddad7':'#fcdbcc';
 return `<svg viewBox="0 0 420 520" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><radialGradient id="${id}-ambient"><stop stop-color="#fff8e3"/><stop offset="1" stop-color="${soft}"/></radialGradient><radialGradient id="${id}-lamp"><stop stop-color="#ffe1a4" stop-opacity=".8"/><stop offset="1" stop-color="#ffe1a4" stop-opacity="0"/></radialGradient></defs><rect width="420" height="520" fill="url(#${id}-ambient)"/><path d="M60 520V215a150 150 0 0 1 300 0v305" fill="none" stroke="#db8c551e"/><path d="M18 58q180 114 385 6M-10 99q225 124 450-10" stroke="#d79b6b" stroke-width="1.1" fill="none"/>${Array.from({length:13},(_,i)=>{const x=17+i*32,y=63+Math.sin(i/12*Math.PI)*62;return `<path d="M${x} ${y}v12" stroke="#bf8955" stroke-width="1"/><circle cx="${x}" cy="${y+16}" r="20" fill="url(#${id}-lamp)"/><ellipse cx="${x}" cy="${y+16}" rx="3.3" ry="5.5" fill="#ffcb7d"/>`;}).join('')}<g fill="none" stroke="#eca881" stroke-width="1.1"><path d="m35 234 3 9 9 3-9 3-3 9-3-9-9-3 9-3ZM372 311v15m-7-7h14m-34-119 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/></g><g fill="#da7294" opacity=".32"><path d="M77 335c-23-14-11-27 0-13 11-14 23 0 0 13Z"/><path d="M344 254c-16-10-8-19 0-9 8-10 16 0 0 9Z"/></g><path d="M0 454q208-18 420 0v66H0Z" fill="#d19660" opacity=".05"/></svg>`;
}
function setHomeOccasion(key,animate=false){
 if(!Object.hasOwn(OCCASIONS,key))key='love';homeOccasion=key;const o=OCCASIONS[key];
 const room=$('#homeRoom');room.dataset.occasion=key;$('#homeRoomBg').innerHTML=occasionPortraitSVG('home-room',key);
 $('.portrait-title',room).innerHTML=`<div class="tiny">${e(o.portrait)}</div><h2>${e(o.greeting)}<br><em>you.</em></h2><div class="small-heart">${o.symbol}</div>`;
 $('#homeCandle').innerHTML=occasionArt(o.art,'home-object');$('#homeCandle').classList.remove('extinguished');$('#homeCandle').setAttribute('aria-label','Preview a '+o.label.toLowerCase()+' experience');
 $('#homeCandleHint').textContent=key==='birthday'?'psst… tap the candles':'psst… there’s a little world inside';
 $$('.home-occasion-tabs button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.homeOccasion===key)));
 $('#homeDemoLabel').textContent='Step inside this little surprise';
}
function browseGifts(){
 if(currentView==='creator')saveDraft();goHome();
 requestAnimationFrame(()=>{const h=$('#choose-gift-title');$('#gifts').scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'});h.setAttribute('tabindex','-1');h.focus({preventScroll:true});});
}
function previewOccasion(key=homeOccasion){
 const o=OCCASIONS[key]||OCCASIONS.love;previewScrollY=window.scrollY;
 const g={...emptyDraft(),occasion:key,name:'you',vibe:o.vibe,branch:false};
 if(key==='wedding'){const day=new Date(Date.now()+40*864e5).toISOString().slice(0,10),venue='Jai Mahal Palace, Jaipur';Object.assign(g,{name:'Aanya',partner:'Aditya',family1:'Sharma',family2:'Verma',music:'shehnai',weddingDate:day,city:'Jaipur',families:W_LINES[0],hashtag:'#AanyaWedsAditya',blessing:'shubh',events:['Haldi','Sangeet','Wedding'].map(t=>({...defaultEvent(t,{weddingDate:day,events:[]}),venue}))});}
 if(key==='birthday'){const t=new Date();g.birthDate=`${t.getFullYear()-21}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;}
 startExperience(g,{preview:true,returnView:'home'});
}
function renderOccasionDetails(force=false){
 const host=$('#occasionDetail');if(!host)return;const key=occasionKey(draft),o=occasionOf(draft);
 host.hidden=key==='wedding';if(key==='wedding')return;
 if(!force&&host.dataset.occasion===key)return;host.dataset.occasion=key;
 const field=(id,label,kind,placeholder='',max=160,area=false,extra='')=>`<div class="field-gap"><label class="field-label" for="${id}">${label}<small>Optional</small></label><${area?'textarea':'input'} class="${area?'text-area':'text-input'}" id="${id}" maxlength="${max}" placeholder="${e(placeholder)}" data-occasion-template="${kind}" ${extra}>${area?'</textarea>':''}</div>`;
 let body='';
 if(key==='proposal')body=`<p class="occasion-help">A first date, a relationship, or a lifetime. Choose the kind of question you’re actually asking. The recipient can say yes, ask to talk, decline, or leave it unanswered.</p><div class="field-label" id="proposalKindLabel">What are you asking?</div><div class="proposal-kind" role="group" aria-labelledby="proposalKindLabel">${[['relationship','Be my person'],['date','A little date'],['marriage','Marry me']].map(([value,label])=>`<button type="button" data-proposal-kind="${value}" aria-pressed="${(draft.proposalKind||'relationship')===value}">${label}</button>`).join('')}</div>${field('proposalQuestion','The question, in your words','proposalQuestion',proposalQuestion(draft),140)}<p class="input-help">Blank is lovely too. We’ll use the matching question above. Choosing a new kind never replaces words you’ve written.</p>`;
 if(key==='love'||key==='thanks')body=`<p class="occasion-help">${key==='love'?'Three little paper hearts, with a reason tucked inside each one.':'Three little flowers. Three things you’re grateful for.'} Leave any blank and we’ll add a thoughtful ready-made line.</p>${[0,1,2].map(i=>`<div class="reason-field">${field('reason'+i,key==='love'?'Little reason '+(i+1):'Thank-you flower '+(i+1),'reason',o.reasons[i],160,true,`data-reason="${i}"`)}</div>`).join('')}`;
 if(key==='apology')body=`<p class="occasion-help">Pick who says sorry for you, write three little sorry coupons, and choose the big question. Leave anything blank and we’ll use a cute ready-made one.</p><div class="field-label" id="sorryCharacterLabel">Who says sorry?</div><div class="proposal-kind sorry-character-pick" role="group" aria-labelledby="sorryCharacterLabel">${Object.entries(SORRY_CHARACTERS).map(([value,label])=>`<button type="button" data-sorry-character="${value}" aria-pressed="${sorryCharacter(draft)===value}">${label}</button>`).join('')}</div>${[0,1,2].map(i=>`<div class="reason-field">${field('coupon'+i,'Sorry coupon '+(i+1),'coupon',o.coupons[i],90,false,`data-coupon="${i}"`)}</div>`).join('')}${field('forgiveQuestion','The big question','forgiveQuestion',forgiveQuestion(draft),80)}<p class="occasion-quiet-warning">The No button runs away when they try to press it. 🥺 Only Yes can be pressed.</p>`;
 if(key==='birthday')body=`<p class="occasion-help">All optional. Add their birthday and their <strong>Birthday Wrapped</strong> gets real numbers: days alive, hours of being iconic.</p><label class="field-label" for="birthDate">Their birthday<small>Optional</small></label><input class="text-input" type="date" id="birthDate" min="1900-01-01" max="${new Date().toISOString().slice(0,10)}"><label class="settings-line"><input type="checkbox" id="ageCandles"><span>Show their age as number candles 🎂<small id="ageCandlesHelp">Off by default. Not everyone wants their age on the cake.</small></span></label>${field('topTrait','Their top trait','trait',wrappedPicks(draft)[0],40)}${field('mostPlayed','Most played','played',wrappedPicks(draft)[1],40)}<p class="input-help">Leave these blank and we’ll pick ones that match the mood.</p>`;
 if(key==='anniversary')body=`<p class="occasion-help">A date to put in the front of your little storybook. No countdowns, no calculations—just a day that means something to you.</p><label class="field-label" for="togetherSince">When did your story begin?<small>Optional</small></label><input class="text-input" type="date" id="togetherSince" max="${new Date().toISOString().slice(0,10)}"><p class="input-help">A wedding date, a first date, or a day you both hold close. Leave it out and the storybook is just as lovely.</p>`;
 if(key==='congratulations')body=`<p class="occasion-help">A new job. A finished project. A brave first step. It doesn’t have to be a huge milestone to matter.</p>${field('milestone','What are we celebrating?','milestone','Their well-earned moment',80)}<p class="input-help">This becomes a little dedication under their spotlight. Skip it for a celebration that fits any win.</p>`;
 if(key==='missyou')body=`<p class="occasion-help">A hopeful little thought about being together again. No dates or plans need to be promised.</p>${field('reunionMessage','Until the next hello','reunion','A little thought for when you’re together again…',200,true)}<p class="input-help">This adds one quiet extra chapter. Leave it blank to end with your note and a paper hug.</p>`;
 host.innerHTML=`<summary><span class="detail-icon">${icon(key==='anniversary'?'clock':'heart')}</span><span><span class="detail-title">${e(o.detailTitle)}</span><span class="detail-subtitle" style="display:block">${key==='birthday'?'All optional · made for their story':'A little detail just for this kind of gift'}</span></span><span class="detail-chevron">${icon('chevron')}</span></summary><div class="detail-body occasion-settings">${body}</div>`;
 const values={proposalQuestion:draft.proposalQuestion,forgiveQuestion:draft.forgiveQuestion,togetherSince:draft.togetherSince,milestone:draft.milestone,reunionMessage:draft.reunionMessage,birthDate:draft.birthDate,topTrait:draft.topTrait,mostPlayed:draft.mostPlayed,weddingFamilies:draft.families};
 for(const [id,value]of Object.entries(values)){const field=$('#'+id);if(field)field.value=value||'';}
 for(let i=0;i<3;i++){const input=$('#reason'+i);if(input)input.value=draft.reasons?.[i]||'';const coupon=$('#coupon'+i);if(coupon)coupon.value=draft.coupons?.[i]||'';}
 syncAgeCandles();
 $$('[data-occasion-template]',host).forEach(input=>mountMessageTemplates(input,input.dataset.occasionTemplate));
}
function occasionHasExtras(g=draft){
 return !!(g.proposalQuestion?.trim()||g.proposalKind&&g.proposalKind!=='relationship'||g.reasons?.some(v=>v.trim())||g.coupons?.some(v=>v.trim())||g.forgiveQuestion?.trim()||g.occasion==='apology'&&sorryCharacter(g)!=='teddy'||g.togetherSince||g.milestone?.trim()||g.reunionMessage?.trim()||g.birthDate||g.topTrait?.trim()||g.mostPlayed?.trim());
}
function updateOccasionUI(){
 if(!$('#occasionRibbon'))return;const key=occasionKey(draft),o=occasionOf(draft),birth=key==='birthday';
 $('#creatorView').dataset.occasion=key;
 $('#occasionRibbonLabel').innerHTML=`<span aria-hidden="true">${o.symbol}</span> <span>${e(o.label)} <span aria-hidden="true">·</span> made your way</span>`;
 const art=occasionArtFor(draft);if($('#editorRoom').dataset.occasion!==key||$('#editorCake').dataset.art!==art){
  $('#editorRoom').dataset.occasion=key;$('#editorRoomBg').innerHTML=occasionPortraitSVG('editor-room',key);$('#editorCake').innerHTML=occasionArt(art,'editor-object');$('#editorCake').dataset.art=art;
 }
 $('#previewGreeting').textContent=o.greeting;$('#previewName').textContent=draft.name.trim()?draft.name.trim()+'.':'your person.';
 $('#editorRoom .tiny').textContent=o.portrait;$('#editorRoom .small-heart').textContent=o.symbol;
 $('.preview-aside>.eyebrow').textContent='A peek inside their '+(birth?'birthday':'little gift');
 $('#previewLiveTag').textContent=draft.name.trim()?`${draft.name.trim()}’s little ${o.short.toLowerCase()} is ready`:'Their little world is almost ready';
 $('#dockNote').textContent=draft.name.trim()?o.label+' · for '+draft.name.trim()+'.':'A name. That’s all the magic needs.';
 $('#vibePreviewLine').textContent=moodLine();
 /* For a birthday the mood rewrites the words. For every other gift it sets the colours and soft sounds, so it is offered as a look, and says so. */
 const captions={Romantic:'Rose & candlelight',Cute:'Soft pink',Funny:'Warm amber',Emotional:'Quiet dusk',Crazy:'Bold terracotta',Elegant:'Muted gold'};
 $('#vibeGrid').classList.toggle('is-look',!birth);
 if($('#vibeLabel'))$('#vibeLabel').innerHTML=(birth?'Pick a mood':'Pick a look')+' <span class="field-hint">'+(birth?'Sets the words, colours and music':'Sets the colours and soft sounds')+'</span>';
 $$('#vibeGrid button').forEach(b=>{const caption=$('.vibe-caption',b);if(caption)caption.textContent=birth?THEMES[b.dataset.vibe].caption:captions[b.dataset.vibe];});
 const guide=$('#occasionGuide');guide.innerHTML=`<div class="guide-caption">What they will go through</div><ol>${o.path.map(line=>`<li>${e(line)}</li>`).join('')}</ol>`;
 $('[data-step="0"]>.step-count-note').textContent=birth?'Just their name. A beautiful birthday, even without the extras.':'Just their name. A complete '+o.short.toLowerCase()+', even without the extras.';
 $('#noteDetail .detail-title').textContent=o.noteLabel;$('label[for=personalMessage]').textContent=o.noteLabel;
 $('#noteDetail .input-help').textContent='Leave this blank and we’ll tuck in a thoughtful '+(birth?'birthday note':key==='apology'?'sorry note':'ready-made note')+'.';
 $('#personalMessage').placeholder=birth?'You know what I love about you? So many things. But let’s start here…':personalize(o.fallback,draft).split('\n')[0].slice(0,170);
 $('#musicDetail .detail-title').textContent=birth?'A birthday soundtrack':key==='apology'?'A sorry little soundtrack':'A little soundtrack';
 $('#funChoices [data-fun=quiz]').innerHTML='<span>?</span>'+(birth?'A tiny birthday quiz':'A tiny little quiz');
 $('#voiceUrl').placeholder='https://…/voice-note.mp3';
 $('#branchToggle').closest('label').hidden=!birth;$('#funDetail').hidden=false;$('#funMessage').placeholder=birth?'You’re my favorite person in the whole birthday universe.':key==='apology'?'I practised this sorry in the mirror. Twice.':'A small secret, just for you.';
 $('#quizFields .input-help').textContent='Leave this blank for a ready-made '+(birth?'birthday':'little')+' question. Wrong guesses get a friendly hint, never a dead end.';
 $('#finalDetail .detail-title').textContent='One last surprise';
 mountWeddingBuilder();
  renderOccasionDetails();
}
function installOccasions(){
 if(!$('#occasionRibbon'))$('.creator-head').insertAdjacentHTML('beforebegin','<div class="occasion-ribbon" id="occasionRibbon"><span class="occasion-ribbon-label" id="occasionRibbonLabel"></span><button type="button" data-v3="change-gift">Change gift</button></div>');
 if(!$('#occasionGuide'))$('[data-step="0"]').insertAdjacentHTML('beforeend','<aside class="occasion-guide" id="occasionGuide" aria-label="A preview of the recipient journey"></aside>');
 if(!$('#occasionDetail'))$('#noteDetail').insertAdjacentHTML('afterend','<details class="detail" id="occasionDetail" hidden></details>');
 $('#editorRoom .portrait-title h2').innerHTML='<span id="previewGreeting">Happy Birthday,</span><br><em id="previewName">your person.</em>';
 $('#giftForm').dataset.v3Installed='true';setHomeOccasion(homeOccasion);
 $('#giftForm').addEventListener('input',event=>{
  const input=event.target,map={proposalQuestion:'proposalQuestion',forgiveQuestion:'forgiveQuestion',togetherSince:'togetherSince',milestone:'milestone',reunionMessage:'reunionMessage',birthDate:'birthDate',topTrait:'topTrait',mostPlayed:'mostPlayed'};
  if(map[input.id]){draft[map[input.id]]=input.id==='togetherSince'?validStoryDate(input.value):input.id==='birthDate'?validBirthDate(input.value):input.value;if(input.id==='birthDate')syncAgeCandles();saveDraft();}
  if(input.id==='ageCandles'){draft.ageCandles=input.checked&&!!draft.birthDate;saveDraft();}
  if(input.dataset.reason!==undefined){draft.reasons=draft.reasons||['','',''];draft.reasons[Number(input.dataset.reason)]=input.value;saveDraft();}
  if(input.dataset.coupon!==undefined){draft.coupons=[0,1,2].map(i=>draft.coupons?.[i]||'');draft.coupons[Number(input.dataset.coupon)]=input.value;saveDraft();}
 });
 document.addEventListener('click',event=>{
  const campaign=event.target.closest('[data-campaign]');if(campaign){event.preventDefault();openCampaign(campaign.dataset.campaign);return;}
  const choice=event.target.closest('[data-choose-occasion]');if(choice){event.preventDefault();openCreator(choice.dataset.chooseOccasion);return;}
  const demo=event.target.closest('[data-home-occasion]');if(demo){setHomeOccasion(demo.dataset.homeOccasion,true);return;}
  const pal=event.target.closest('[data-sorry-character]');if(pal){draft.character=pal.dataset.sorryCharacter;$$('[data-sorry-character]').forEach(b=>b.setAttribute('aria-pressed',String(b===pal)));updateOccasionUI();saveDraft();return;}
  const kind=event.target.closest('[data-proposal-kind]');if(kind){draft.proposalKind=kind.dataset.proposalKind;$$('[data-proposal-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.proposalKind===draft.proposalKind)));$('#proposalQuestion').placeholder=PROPOSAL_QUESTIONS[draft.proposalKind];refreshMessageTemplates();updateOccasionUI();saveDraft();return;}
  const b=event.target.closest('[data-v3]');if(!b)return;event.preventDefault();
  switch(b.dataset.v3){
   case'change-gift':browseGifts();break;
   case'unlock':startPayment();break;
   case'resume-dismiss':try{sessionStorage.setItem('luv4u.resume.dismissed','1');}catch{}updateResumeBanner();break;
   case'unlock-saved':openSavedShare(b.dataset.id);break;
   case'home-demo':previewOccasion();break;
   case'open-note':openOccasionNote(b);break;
   case'heart-note':openHeartNote(b);break;
   case'flower':pickFlower(b);break;
   case'turn-page':turnStoryPage();break;
   case'untie-ribbon':untieRibbon(b);break;
   case'send-hug':sendPaperHug(b);break;
   case'reveal-question':revealProposal(b);break;
   case'proposal-answer':chooseProposalAnswer(b);break;
   case'no-answer':journeyReply='';proposalAnswer='';goToScene(sceneIndex+1);break;
   case'sorry-meter':measureSorry(b);break;
   case'coupon':claimCoupons();break;
   case'forgive-yes':forgiveYes(b);break;
   case'forgive-no':dodgeNo(b,event);break;
   case'forgiven-card':saveForgivenCard(b);break;
   case'wrapped-next':wrappedNext(true);break;
   case'birthday-card':saveBirthdayCard(b);break;
   case'wedding-card':saveWeddingCard(b);break;
   case'guest-links':makeGuestLinks();break;
   case'guest-wa':openWhatsApp(weddingInviteText(publishedGift,guestLink(b.dataset.guest),b.dataset.guest));track('whatsapp_clicked',{guest:true});break;
   case'guest-copy':copyText(weddingInviteText(publishedGift,guestLink(b.dataset.guest),b.dataset.guest),'Copied '+b.dataset.guest+'’s invite. Paste it in their chat.');break;
   case'guest-copy-all':copyText(guestNames().map(n=>n+': '+guestLink(n)).join('\n'),'All personal links copied.');break;
   case'finish-reading':showQuietFinish();break;
  }
 });
 // Do not let an old prepared reply be shared after the text or reaction changes.
 $('#experience').addEventListener('input',event=>{if(event.target.id==='recipientReply'){replySharedText='';if($('#replyResult'))$('#replyResult').innerHTML='';}});
}
function renderOccasionReview(){
 const g=sanitizeGift(draft,false),o=occasionOf(g);const labels={opening:'A little light',birthday:'Their birthday',cake:'Make a wish',choice:'A tiny choice',gift:'Open a gift',welcome:'A personal welcome',message:'Your note',hearts:'Three little hearts',bouquet:'A gratitude bouquet',storybook:'Our little storybook',ribbon:'A ribbon reveal',distance:'A paper hug',proposal:'Your little question',meter:'How sorry am I?',coupons:'Sorry coupons',forgive:'Forgive me? 🥺',reunion:'The next hello',photos:g.photos.length+' photos',memories:'Little memories',voice:'Your voice',fun:'A playful detour',final:'One more surprise',celebration:g.occasion==='apology'?'A big happy hug':'A lovely ending',reply:'An optional reply'};
 const parts=buildScenes(g).map(k=>labels[k]);
 $('#reviewSummary').innerHTML=`<p class="v3-occasion-review">${e(o.label)} · made your way</p><div class="ready-stamp"><span>${o.symbol}</span><span>For ${e(g.name||'your person')}.<br><em>A whole little ${g.vibe.toLowerCase()} world.</em></span></div><div class="story-itinerary">${parts.map(p=>'<span>'+e(p)+'</span>').join('')}</div><p class="step-help">${g.message?'Your own words are tucked inside.':'A thoughtful '+(g.occasion==='birthday'?'birthday':'ready-made')+' note is already tucked inside.'} ${g.music==='none'?'Soft interaction sounds, no background music.':'A little soundtrack, at '+Math.round(g.volume*100)+'% volume.'}</p>${g.occasion==='proposal'?'<p class="occasion-quiet-warning">They can say yes, ask to talk, decline, or leave the question unanswered. No reply is sent automatically.</p>':g.occasion==='apology'?'<p class="occasion-quiet-warning">The No button runs away. 🥺 When they press Yes, you get a little “Forgiven 💗” reply.</p>':''}<div class="review-touches"><span>${touchCount()?touchCount()+' little '+(touchCount()===1?'touch':'touches')+' tucked inside':'Little touches: kept simple. Just as lovely.'}</span><button type="button" data-v2="edit-touches">${touchCount()?'Edit little touches':'Add little touches'} ${icon('arrow')}</button></div>`;
 updateDelivery();
}

function finishOccasionRender(type){
 const scene=$('#storyScene');$('#storyScroll').scrollTop=0;
 $('#storyProgress').innerHTML=scenes.slice(1).map((_,i)=>`<span class="story-dot ${i+1===sceneIndex?'active':i+1<sceneIndex?'past':''}"></span>`).join('');
 $('#storyAnnouncement').textContent=occasionOf(gift).label+': moment '+sceneIndex+' of '+(scenes.length-1)+'.';
 requestAnimationFrame(()=>$('h1',scene)?.focus({preventScroll:true}));
}
function renderOccasionScene(type){
 if(gift.occasion==='wedding'&&['opening','invite','celebration'].includes(type)){renderWeddingScene(type,$('#storyScene'));finishOccasionRender(type);return true;}
 const o=occasionOf(gift),name=e(gift.name),s=$('#storyScene');
 const custom=['welcome','hearts','bouquet','storybook','ribbon','distance','proposal','meter','coupons','forgive','reunion','hbd','wrapped'];
 if(!custom.includes(type)&&!(gift.occasion!=='birthday'&&['gift','celebration'].includes(type)))return false;
 s.className='story-scene '+type+'-scene';
 if(type==='hbd'||type==='wrapped'){renderBirthdayScene(type,s);finishOccasionRender(type);return true;}
 if(type==='welcome')s.innerHTML=`<div class="occasion-welcome-art">${occasionArt(occasionArtFor(gift),'welcome-object')}</div>${sceneTitle(`${e(o.greeting)}<span class="name-line${gift.name.length>18?' long-name':''}"><em>${name}.</em></span>`,e(o.eyebrow))}<p class="story-description">${e(o.welcome)}</p>${gift.occasion==='congratulations'&&gift.milestone?`<p class="achievement-note">${e(gift.milestone)}</p>`:''}${storyButton(gift.occasion==='apology'?'Open it, please? 🥺':gift.occasion==='love'?'There are a few little reasons':gift.occasion==='thanks'?'A little bouquet for you':gift.occasion==='anniversary'?'Open our little story':gift.occasion==='missyou'?'Catch a little hug':'Step a little closer')}`;
 if(type==='gift')s.innerHTML=`${sceneTitle('Some words,<br><em>sealed with a little courage.</em>','A little note, from the heart')}<button class="story-object" data-v3="open-note" aria-label="Unfold the personal note">${occasionArt('envelope','story-envelope')}<span class="object-tap">${icon('hand')}</span></button><p class="story-footnote soft" id="noteInstruction">A little envelope. A lot inside.</p><div id="occasionAfter" aria-live="polite"></div>`;
 if(type==='hearts'){
  openedNotes=new Set();s.innerHTML=`${sceneTitle('A few little reasons.<br><em>All of them you.</em>','Three paper hearts, folded with love')}<p class="story-description">Touch one. They’ll all unfold.</p><div class="heart-notes">${[0,1,2].map(i=>`<button class="heart-note" data-v3="heart-note" data-note="${i}" aria-pressed="false" aria-label="Unfold heart ${i+1}"><span aria-hidden="true">♡</span><small>open me · 0${i+1}</small></button>`).join('')}</div><p class="note-progress" id="noteProgress" role="status">Touch a heart</p><div id="occasionAfter" aria-live="polite"></div>`;
 }
 if(type==='bouquet'){
  openedNotes=new Set();s.innerHTML=`${sceneTitle('A little bouquet.<br><em>For a lot of kindness.</em>','One flower. One little thank-you.')}<div class="gratitude-bouquet" id="gratitudeBouquet" data-bloomed="0">${occasionArt('bouquet','gratitude-bouquet')}</div><div class="gratitude-petals" role="group" aria-label="Open each gratitude flower">${[0,1,2].map(i=>`<button data-v3="flower" data-note="${i}" aria-pressed="false" aria-label="Open thank-you flower ${i+1}">${['✿','❀','✾'][i]}</button>`).join('')}</div><div class="gratitude-cards" id="gratitudeMessage" aria-live="polite"><p class="gratitude-hint">Touch a little flower.<br>All three thank-yous are inside.</p></div><p class="note-progress" id="noteProgress" role="status"></p><div id="occasionAfter" aria-live="polite"></div>`;
 }
 if(type==='storybook'){
  chapterIndex=0;s.innerHTML=`${sceneTitle('Our little story.<br><em>Still unfolding.</em>','A few pages worth keeping')}${gift.togetherSince?`<p class="story-date">Since ${e(new Intl.DateTimeFormat('en',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(gift.togetherSince+'T12:00:00Z')))}</p>`:''}<article class="storybook" id="storyBook" data-v3="turn-page" aria-live="polite"></article><p class="story-footnote soft">The pages turn on their own. Touch the book to turn one sooner.</p><button class="btn story-btn" data-v3="turn-page" id="turnPage">Turn the little page ${icon('arrow')}</button><button class="story-soft-skip" data-story="next">Read the note inside</button>`;paintStoryPage();startStoryAuto();
 }
 if(type==='ribbon')s.innerHTML=`${sceneTitle('A little ribbon.<br><em>A very big well done.</em>','Go on. This moment belongs to you.')}<button class="story-object" data-v3="untie-ribbon" aria-label="Untie your celebration ribbon">${occasionArt('medal','achievement-ribbon')}<span class="object-tap">${icon('hand')}</span></button><p class="story-footnote soft" id="ribbonInstruction">Tap to untie your little celebration.</p><div id="occasionAfter" aria-live="polite"></div>`;
 if(type==='distance')s.innerHTML=`${sceneTitle('A paper hug.<br><em>All the way to you.</em>','Some little things can cross the distance')}<div class="distance-route" id="distanceRoute">${occasionArt('plane','travelling-hug')}<div class="distance-label"><span>from over here</span><span>to lovely you</span></div></div><button class="btn story-btn" data-v3="send-hug" id="sendPaperHug">Catch your paper hug ${icon('heart')}</button><div id="occasionAfter" aria-live="polite"></div>`;
 if(type==='proposal')s.innerHTML=`${sceneTitle('One little question.<br><em>From the heart.</em>','A moment for the butterflies')}<button class="story-object" data-v3="reveal-question" aria-label="Open the little proposal question">${occasionArt(occasionArtFor(gift),'proposal-object')}<span class="object-tap">${icon('hand')}</span></button><p class="story-footnote soft" id="proposalInstruction">You don’t owe this question a particular answer.</p><div id="proposalReveal" class="occasion-reveal" hidden></div><button class="story-soft-skip" data-v3="no-answer">Continue without answering</button>`;
 if(type==='meter')s.innerHTML=`${sceneTitle('How sorry am I?<br><em>Let’s measure.</em>','Scientifically accurate. Probably.')}<div class="sorry-meter" id="sorryMeter" role="meter" aria-label="How sorry I am" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="sorry-meter-track"><div class="sorry-meter-fill" id="sorryFill"></div></div><ol class="sorry-meter-scale" aria-hidden="true"><li>a little</li><li>very</li><li>extremely</li><li>down bad</li></ol></div><p class="sorry-meter-reading" id="sorryReading" role="status">Tap the button to find out</p><button class="btn story-btn sorry-meter-btn" data-v3="sorry-meter">Measure my sorry 🥺</button><div id="occasionAfter" aria-live="polite"></div>`;
 if(type==='coupons'){
  openedNotes=new Set();s.innerHTML=`${sceneTitle('Sorry coupons.<br><em>No expiry date.</em>','Redeem anytime. I mean it.')}<div class="sorry-coupons">${sorryCoupons(gift).map((text,i)=>`<button class="sorry-coupon" data-v3="coupon" data-note="${i}" aria-pressed="false" aria-label="Claim sorry coupon ${i+1}: ${e(text)}"><span class="coupon-no">COUPON · 0${i+1}</span><span class="coupon-text">${e(text)}</span><span class="coupon-stamp" aria-hidden="true">claimed 💗</span></button>`).join('')}</div><p class="note-progress" id="noteProgress" role="status">Tap a coupon to claim them all</p><div id="occasionAfter" aria-live="polite"></div>`;
 }
 if(type==='forgive'){
  noDodges=0;s.innerHTML=`<div class="sorry-forgive-art" id="sorryForgiveArt">${occasionArt(sorryCharacter(gift),'forgive-art')}</div>${sceneTitle(e(forgiveQuestion(gift)),'One very important question')}<div class="forgive-arena" id="forgiveArena"><button class="forgive-yes" data-v3="forgive-yes" id="forgiveYes">Yes 💗</button><button class="forgive-no" data-v3="forgive-no" id="forgiveNo">No</button></div><p class="story-footnote soft" id="forgiveNote" role="status">Choose carefully. There is only one right answer.</p><div id="occasionAfter" aria-live="polite"></div>`;
  const no=$('#forgiveNo',s);if(no){const run=ev=>{if(ev.pointerType==='mouse'&&ev.type==='pointerdown')return;dodgeNo(no,ev);};no.addEventListener('pointerenter',ev=>{if(ev.pointerType==='mouse')dodgeNo(no,ev);});no.addEventListener('pointerdown',run);no.addEventListener('focus',()=>{if(noDodges)dodgeNo(no);});}
 }
 if(type==='reunion')s.innerHTML=`<div class="occasion-welcome-art">${occasionArt('plane','next-hello')}</div>${sceneTitle('Until the next<br><em>little hello.</em>','A hopeful thought, from over here')}<p class="final-surprise-note">${e(gift.reunionMessage)}</p>${storyButton('Keep a little light for me')}`;
 if(type==='celebration'){
  const quiet=gift.occasion==='missyou'||gift.occasion==='proposal'&&proposalAnswer!=='yes';
  let title=o.finalTitle,ending=o.finish;
  if(gift.occasion==='proposal'&&proposalAnswer==='yes'){title='A little yes.<br><em>A lovely beginning.</em>';ending='A moment to keep close. Your answer is still yours to share, when you’re ready.';}
  if(gift.occasion==='proposal'&&proposalAnswer==='no'){title='Thank you<br><em>for being honest.</em>';ending='Your answer deserves care and respect. Nothing has been sent. Share it only when you choose to.';}
  if(gift.occasion==='proposal'&&proposalAnswer==='talk'){title='A little room<br><em>for a conversation.</em>';ending='No rush to decide. Nothing has been sent. You can share your words when you’re ready.';}
  s.classList.toggle('quiet-ending',quiet);
  s.innerHTML=`${gift.occasion==='apology'?`<div class="sorry-hug-art" aria-hidden="true">${occasionArt(sorryCharacter(gift)+'-happy','hug-art')}</div>`:`<div class="${quiet?'quiet-stamp':'celebration-halo'}" aria-hidden="true">${o.symbol}</div>`}${sceneTitle(title,gift.occasion==='apology'?'Officially forgiven. No take-backs.':'Made with a little heart')}<p class="finale-words" aria-label="${e(ending)}">${ending.split(' ').map((w,i)=>`<span class="fw" aria-hidden="true" style="--w:${i}">${e(w)}</span>`).join(' ')}</p>${gift.photos.length&&!quiet&&!reducedMotion?finaleReel():gift.photos.length?`<div class="finale-montage" aria-label="A few little moments to keep">${gift.photos.map((p,i)=>`<figure class="finale-photo" style="--delay:${i*.18}s"><div><img src="${e(p.src)}" alt="${e(p.caption||'A favorite moment')}" style="${cropStyle(p)}" referrerpolicy="no-referrer"></div></figure>`).join('')}</div>`:''}<p class="final-dedication">Made especially for you. ${gift.occasion==='apology'?'With my whole silly heart. 💗':'♡'}${gift.sender?'<br><span style="font-size:14px">From '+e(gift.sender)+'.</span>':''}</p>${storyButton(gift.occasion==='proposal'?'Leave a reply, only if you’d like':'Send a little feeling back')}${quiet?'<button class="story-soft-skip" data-v3="finish-reading">Finish here. No reply needed.</button>':''}`;
  $$('.finale-photo img',s).forEach(img=>img.addEventListener('error',()=>img.closest('figure').hidden=true,{once:true}));
  startReel(experienceToken);
  if(!quiet){const token=experienceToken;finaleTimer=setTimeout(()=>{if(token!==experienceToken||scenes[sceneIndex]!==type)return;sfx('fanfare');buzz([30,40,80]);confetti(gift.occasion==='congratulations'?100:46);swellMusic();},reducedMotion?0:600);}
  if(!(gift.occasion==='proposal'&&proposalAnswer!=='yes'))decorateFinale(s,{quick:true,festive:!quiet});
 }
 finishOccasionRender(type);return true;
}
/* The ending asks one thing: how did it feel? One touch sends the feeling to whoever made it. */
function decorateFinale(s,{quick=true,festive=true}={}){
 const next=$('[data-story=next]',s);if(!next)return;
 next.className='story-soft-skip';next.innerHTML='Or write a few words '+icon('arrow');
 const sorry=gift.occasion==='apology';
 if(sorry)next.insertAdjacentHTML('beforebegin',`<button type="button" class="btn btn-secondary forgiven-card-btn" data-v3="forgiven-card">Save our “Forgiven” card 📸</button>`);
 if(occasionKey(gift)==='birthday')next.insertAdjacentHTML('beforebegin',`<button type="button" class="btn story-btn birthday-card-btn" data-v3="birthday-card">Add to your story 📸</button>`);
 if(quick)next.insertAdjacentHTML('beforebegin',`<div class="finale-react"><p class="finale-react-title">${sorry?'Tell them how forgiven they are':'How did that feel?'}</p><div class="reactions" role="group" aria-label="Tell ${e(gift.sender||'them')} how it felt. One touch sends it.">${(sorry?SORRY_REACTIONS:GENERIC_REACTIONS).map(([emoji,label])=>`<button type="button" class="reaction-btn" data-v2="quick-react" data-reaction="${emoji}" aria-label="${label}. Sends it now." aria-pressed="false">${emoji}</button>`).join('')}</div><p class="finale-sent" id="finaleSent" role="status"></p></div>`);
 next.insertAdjacentHTML('afterend',`<div class="finale-links"><button type="button" class="story-soft-skip" data-story="replay">↻ Watch it again</button>${navigator.share?'<button type="button" class="story-soft-skip" data-v2="pass-on">Share the feeling</button>':''}<button type="button" class="story-soft-skip" data-story="make-your-own">Make someone’s day</button></div>`);
 if(festive){
  balloons(6);let last=0;
  s.addEventListener('pointerdown',ev=>{if(ev.target.closest('button,a,input,textarea,audio'))return;const now=Date.now();if(now-last<220)return;last=now;confetti(28,{x:ev.clientX,y:ev.clientY});sfx('pop');buzz(8);});
 }
}
let quickSent=0;
async function quickReact(button){
 const value=button.dataset.reaction,note=$('#finaleSent');buzz(18);
 if(isPreview){note.textContent='In the real gift, this sends '+value+' straight to '+(gift.sender||'the person who made it')+'.';return;}
 if(!gift.server){note.textContent='Lovely. Add a few words below to share your reply.';return;}
 if(quickSent>=3){note.textContent='Sent. They’ll love it. ♡';return;}
 try{await api('/api/gifts/'+gift.id+'/reactions',{method:'POST',body:{visitor:visitorToken(),reaction:value,message:''}});quickSent++;note.textContent='Sent to '+(gift.sender||'them')+'. Their day just got better. ♡';ring(button);sfx('wish');buzz([20,40,40]);if(gift.occasion!=='missyou')confetti(34,originOf(button));}
 catch(err){note.textContent='Not sent. '+err.message;}
}
async function passOn(){try{await navigator.share({title:'I just opened a Kholona ♡',text:(gift.sender?gift.sender+' made me':'Someone made me')+' a little world on Kholona. Make one for someone you love:',url:location.origin+'/?utm_source=recipient&utm_medium=finale'});}catch{}}
function openOccasionNote(button){
 if(button.classList.contains('opened'))return;button.classList.add('opened');button.disabled=true;chime();
 $('#noteInstruction').textContent='A little courage, all unfolded.';
 $('#occasionAfter').innerHTML=storyButton('Read the words inside');
}
let cascading=false,storyAuto=0;
function revealHeart(button,i){
 const text=gift.reasons?.[i]?.trim()||OCCASIONS.love.reasons[i];
 openedNotes.add(i);button.classList.add('revealed');button.setAttribute('aria-pressed','true');button.setAttribute('aria-label','Heart '+(i+1)+': '+text);
 button.innerHTML='<span aria-hidden="true">♡</span><p>'+e(text)+'</p>';
}
/* One touch, three reasons: they unfold one after another, each with a rising note, and the way on appears at the end. */
async function openHeartNote(){
 if(cascading||openedNotes.size>=3)return;cascading=true;const token=experienceToken,buttons=$$('.heart-note');
 for(let i=0;i<buttons.length;i++){
  if(token!==experienceToken||scenes[sceneIndex]!=='hearts'){cascading=false;return;}
  revealHeart(buttons[i],i);$('#noteProgress').textContent=(i+1)+' of 3';sfx('note',i);buzz(12);ring(buttons[i]);
  await sleep(i<buttons.length-1?1300:800);
 }
 cascading=false;if(token!==experienceToken)return;
 $('#noteProgress').textContent='All three. All of them you.';sfx('bloom');buzz([20,30,50]);confetti(40);$('#occasionAfter').innerHTML=storyButton('Keep a little love with me');autoAdvance(7500,'hearts');
}
async function pickFlower(){
 if(cascading||openedNotes.size>=3)return;cascading=true;const token=experienceToken,buttons=$$('[data-v3=flower]'),box=$('#gratitudeMessage');box.innerHTML='';
 for(let i=0;i<buttons.length;i++){
  if(token!==experienceToken||scenes[sceneIndex]!=='bouquet'){cascading=false;return;}
  openedNotes.add(i);buttons[i].setAttribute('aria-pressed','true');$('#gratitudeBouquet').dataset.bloomed=String(i+1);
  box.insertAdjacentHTML('beforeend','<p class="thanks-card">'+e(gift.reasons?.[i]?.trim()||OCCASIONS.thanks.reasons[i])+'</p>');
  sfx('note',i);buzz(12);ring(buttons[i]);await sleep(i<buttons.length-1?1600:800);
 }
 cascading=false;if(token!==experienceToken)return;
 $('#noteProgress').textContent='Three thank-yous, gathered.';sfx('bloom');buzz([20,30,50]);confetti(40);$('#occasionAfter').innerHTML=storyButton('Keep the bouquet close');autoAdvance(7500,'bouquet');
}
function paintStoryPage(){
 const pages=[['Our beginning','Every story has a little beginning. I’m glad ours found its way here.'],['The everyday','The familiar smiles. The little conversations. The ordinary moments that slowly become a life.'],['What comes next','More days to discover. More little things to learn about each other. More pages to write, together.']];
 const [title,text]=pages[chapterIndex];$('#storyBook').innerHTML=`<span class="book-ribbon" aria-hidden="true"></span><span class="page-number">OUR LITTLE STORY · 0${chapterIndex+1} / 03</span><h2>${title}</h2><p>${text}</p>`;
 $('#turnPage').innerHTML=(chapterIndex===2?'And a note for this chapter':'Turn the little page')+' '+icon('arrow');
}
function startStoryAuto(){
 clearInterval(storyAuto);if(reducedMotion)return;const token=experienceToken;
 storyAuto=setInterval(()=>{if(token!==experienceToken||scenes[sceneIndex]!=='storybook'||chapterIndex>=2){clearInterval(storyAuto);return;}chapterIndex++;paintStoryPage();sfx('page');buzz(10);},5200);
}
function turnStoryPage(){if(chapterIndex>=2){goToScene(sceneIndex+1);return;}chapterIndex++;paintStoryPage();sfx('page');buzz(10);startStoryAuto();}
function untieRibbon(button){
 if(button.classList.contains('opened'))return;button.classList.add('opened');button.disabled=true;$('#ribbonInstruction').textContent='A well-earned moment. Let yourself enjoy it.';
 $('#occasionAfter').innerHTML=`<div class="occasion-reveal"><p>${e(gift.milestone||'Here’s to the effort, the courage, and the little steps that got you here.')}</p></div>${storyButton('There’s a little cheering inside')}`;
 sfx('fanfare');buzz([20,30,60]);ring(button);confetti(100,originOf(button));balloons(5);autoAdvance(5400,'ribbon');
}
async function sendPaperHug(button){
 if(button.disabled)return;button.disabled=true;$('#distanceRoute').classList.add('sent');const token=experienceToken;sfx('whoosh');buzz(25);
 await sleep(gift.motion?900:0);if(token!==experienceToken||scenes[sceneIndex]!=='distance')return;sfx('heartbeat');buzz([40,80,40,260,40,80,40]);
 button.hidden=true;$('#occasionAfter').innerHTML=`<div class="occasion-reveal"><p>A little hug, delivered to your corner of the world. Keep it as long as you need.</p></div>${storyButton('A note came with it')}`;autoAdvance(5000,'distance');
}
function revealProposal(button){
 if(button.disabled)return;button.disabled=true;$('#storyScene').classList.add('question-revealed');$('#proposalInstruction').hidden=true;const reveal=$('#proposalReveal');reveal.hidden=false;
 sfx('bloom');buzz(25);ring(button);reveal.innerHTML=`<h2 class="proposal-question" tabindex="-1">${e(proposalQuestion(gift))}</h2><div class="proposal-responses" role="group" aria-label="Your answer, entirely your choice">${[['yes','Yes, I’d love to'],['talk','Let’s talk about it'],['no','Not for me']].map(([key,label])=>`<button data-v3="proposal-answer" data-answer="${key}" aria-pressed="false">${label}</button>`).join('')}</div><p class="proposal-response-note" id="proposalResponseNote" role="status">Choose only what feels true. Nothing is sent until you choose to share your reply.</p><div id="proposalContinue"></div>`;
 $('.proposal-question',reveal).focus({preventScroll:true});chime('soft');
}
function chooseProposalAnswer(button){
 if(button.getAttribute('aria-pressed')==='true')return;
 proposalAnswer=button.dataset.answer;
 journeyReply=proposalAnswer==='yes'?'Yes, I’d love to. Thank you for asking with so much care. ♡':proposalAnswer==='talk'?'Thank you for asking. I’d like to talk about it before I answer.':'Thank you for asking so thoughtfully. I don’t feel the same way, and I wanted to be honest with you.';
 $$('[data-v3=proposal-answer]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 $('#proposalResponseNote').textContent='Your choice is here, just for you. You can edit it before sharing, or keep it private.';
 $('#proposalContinue').innerHTML=storyButton('Keep going, at my pace');
 if(proposalAnswer==='yes'){sfx('fanfare');buzz([25,40,70]);confetti(80);balloons(5);autoAdvance(3200,'proposal');}else{clearAuto();chime('soft');}
}
/* The sorry gift. One tap measures the sorry, one tap claims every coupon, and the big question has only one button that can be pressed. */
async function measureSorry(button){
 if(button.disabled)return;button.disabled=true;button.hidden=true;const token=experienceToken,fill=$('#sorryFill'),meter=$('#sorryMeter'),reading=$('#sorryReading');
 const steps=[[24,'A little sorry…'],[50,'Okay, very sorry.'],[76,'Extremely sorry. 😣'],[100,'Emotionally down bad. 😭']];
 for(let i=0;i<steps.length;i++){
  if(token!==experienceToken||scenes[sceneIndex]!=='meter')return;
  const [value,text]=steps[i];fill.style.width=value+'%';meter.setAttribute('aria-valuenow',String(value));meter.dataset.level=String(i+1);reading.textContent=text;sfx('note',i);buzz(12);
  await sleep(i<steps.length-1?750:900);
 }
 if(token!==experienceToken||scenes[sceneIndex]!=='meter')return;
 meter.classList.add('overflow');reading.innerHTML='<strong>Off the charts.</strong> Sorry levels: illegal. 🥺';sfx('bloom');buzz([20,30,60]);confetti(60,originOf(meter));
 $('#occasionAfter').innerHTML=storyButton('Okay okay. Read my note');autoAdvance(5200,'meter');
}
async function claimCoupons(){
 if(cascading||openedNotes.size>=3)return;cascading=true;const token=experienceToken,buttons=$$('.sorry-coupon');
 for(let i=0;i<buttons.length;i++){
  if(token!==experienceToken||scenes[sceneIndex]!=='coupons'){cascading=false;return;}
  openedNotes.add(i);buttons[i].classList.add('claimed');buttons[i].setAttribute('aria-pressed','true');$('#noteProgress').textContent=(i+1)+' of 3 claimed';sfx('note',i);buzz(12);ring(buttons[i]);
  await sleep(i<buttons.length-1?900:600);
 }
 cascading=false;if(token!==experienceToken)return;
 $('#noteProgress').textContent='All yours. Use them wisely (or not). 💗';sfx('bloom');buzz([20,30,50]);confetti(40);
 $('#occasionAfter').innerHTML=storyButton(scenes[sceneIndex+1]==='forgive'?'Now, one very important question':'Keep going 🥺');autoAdvance(6500,'coupons');
}
const NO_LINES=['No','Are you sure?','Really sure? 🥺','Think again…','Pleeease 🥺','I’ll cry 😭','You can’t catch me','Just press yes 💗'];
const NO_NOTES=['Choose carefully. There is only one right answer.','Hmm. That button seems broken. Try the pink one?','The No button has left the chat.','Yes is right there. It keeps getting bigger. 👀','Okay, this is just sad now. 😭'];
let lastDodge=0;
/* The No button never stays put: it jumps away from a finger, a mouse or a key press, says something sadder, and Yes grows. */
function dodgeNo(button,ev){
 ev?.preventDefault?.();const now=Date.now();if(forgiven||now-lastDodge<180)return;lastDodge=now;
 const arena=$('#forgiveArena'),yes=$('#forgiveYes');if(!arena||!yes||!button.isConnected)return;
 noDodges++;if(noDodges===1)track('forgive_no_tried');
 button.textContent=NO_LINES[Math.min(noDodges,NO_LINES.length-1)];button.style.setProperty('--shrink',String(Math.max(1-noDodges*.05,.72)));
 yes.style.setProperty('--grow',String(Math.min(1+noDodges*.1,1.75)));button.classList.add('is-running');
 const a=arena.getBoundingClientRect(),b=button.getBoundingClientRect(),y=yes.getBoundingClientRect();
 const px=ev?.clientX??b.left+b.width/2,py=ev?.clientY??b.top+b.height/2;let best=null;
 for(let i=0;i<16;i++){
  const left=Math.random()*Math.max(a.width-b.width,0),top=Math.random()*Math.max(a.height-b.height,0),cx=a.left+left+b.width/2,cy=a.top+top+b.height/2;
  const clear=cx<y.left-b.width/2-10||cx>y.right+b.width/2+10||cy<y.top-b.height/2-10||cy>y.bottom+b.height/2+10;
  const score=Math.hypot(cx-px,cy-py)+(clear?1e4:0);if(!best||score>best.score)best={left,top,score};
 }
 button.style.left=best.left.toFixed(0)+'px';button.style.top=best.top.toFixed(0)+'px';
 const art=$('#sorryForgiveArt');if(art){art.classList.remove('pleading');void art.offsetWidth;art.classList.add('pleading');}
 $('#forgiveNote').textContent=NO_NOTES[Math.min(noDodges,NO_NOTES.length-1)];sfx('pop');buzz(10);
}
async function forgiveYes(button){
 if(forgiven)return;forgiven=true;clearAuto();const token=experienceToken,s=$('#storyScene');
 journeyReply='Okay fine. You’re forgiven. 💗 Come here.';s.classList.add('is-forgiven');
 const art=$('#sorryForgiveArt');if(art)art.innerHTML=occasionArt(sorryCharacter(gift)+'-happy','forgive-art');
 $('.story-title',s).innerHTML='Yay! <em>Forgiven.</em> 💗';$('.story-eyebrow',s).textContent='Best. Answer. Ever.';
 $('#forgiveNo')?.remove();button.disabled=true;button.textContent='Forgiven 💗';
 track('forgive_yes');sfx('fanfare');buzz([25,40,70]);ring(button);confetti(110);balloons(6);
 let note='They’ll be so happy. Like, embarrassingly happy. 💗';
 if(isPreview)note='In the real gift, this tells you right away: “I forgive you 💗”.';
 else if(gift.server){try{await api('/api/gifts/'+gift.id+'/reactions',{method:'POST',body:{visitor:visitorToken(),reaction:'💗',message:'I forgive you 💗'}});note='We told '+(gift.sender||'them')+'. They’re probably crying happy tears now. 💗';}catch{}}
 if(token!==experienceToken||scenes[sceneIndex]!=='forgive')return;
 $('#forgiveNote').textContent=note;$('#occasionAfter').innerHTML=storyButton('Hug it out 🤗');autoAdvance(4200,'forgive');
}
/* A 9:16 picture for an Instagram story: the happy character and "Forgiven". Made on this device; nothing is uploaded. */
async function saveForgivenCard(button){
 if(button.disabled)return;button.disabled=true;const label=button.textContent;button.textContent='Making your card…';
 try{
  const W=1080,H=1920,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const bg=x.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#ffd6e0');bg.addColorStop(.55,'#ffeef3');bg.addColorStop(1,'#e7d9ff');x.fillStyle=bg;x.fillRect(0,0,W,H);
  const rand=seeded((gift.id||'')+gift.name);x.fillStyle='#ff8fab';
  for(let i=0;i<26;i++){const hx=rand()*W,hy=rand()*H,s=12+rand()*26;x.globalAlpha=.15+rand()*.3;x.beginPath();x.moveTo(hx,hy+s*.55);x.bezierCurveTo(hx-s*1.5,hy-s*.4,hx-s*.5,hy-s*1.2,hx,hy-s*.45);x.bezierCurveTo(hx+s*.5,hy-s*1.2,hx+s*1.5,hy-s*.4,hx,hy+s*.55);x.fill();}
  x.globalAlpha=1;
  const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(occasionArt(sorryCharacter(gift)+'-happy','card-art').replace('<svg ','<svg width="900" height="780" '));await img.decode();x.drawImage(img,90,330,900,780);
  const sans='"Avenir Next","Segoe UI",sans-serif';x.textAlign='center';
  x.fillStyle='#c0577f';x.font='600 40px '+sans;x.fillText('OFFICIAL NOTICE',W/2,250);
  x.fillStyle='#d6336c';x.font='italic 700 156px Georgia, serif';x.fillText('Forgiven',W/2,1290);
  x.font='96px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';x.fillText('💗',W/2,1430);
  x.fillStyle='#7a3b52';x.font='600 54px '+sans;x.fillText((gift.sender?gift.name+' forgave '+gift.sender:gift.name+' said yes').slice(0,42),W/2,1550);
  x.fillStyle='#9a5b74';x.font='46px '+sans;x.fillText('No take-backs. 🥺',W/2,1630);
  x.fillStyle='#c0577f';x.font='600 36px '+sans;x.fillText('made on kholona.in ♡',W/2,1830);
  const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!blob)throw new Error('No image');
  const file=new File([blob],'forgiven.png',{type:'image/png'});track('story_card_saved');
  if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'Forgiven 💗'});}catch(err){if(err.name!=='AbortError')downloadBlob(blob,'forgiven.png');}}
  else downloadBlob(blob,'forgiven.png');
  button.textContent='Saved. Post it to your story 💗';
 }catch{button.textContent=label;toast('That card could not be made in this browser. A screenshot works too. 💗');}
 finally{button.disabled=false;}
}
function showQuietFinish(){
 const s=$('#storyScene');s.className='story-scene quiet-finish-scene';
 s.innerHTML=`<span class="quiet-stamp" aria-hidden="true">${occasionOf(gift).symbol}</span>${sceneTitle('You can leave<br><em>it here.</em>','Nothing more is needed')}<p class="end-note">Thank you for sharing this little moment.</p><p class="story-footnote soft">You can close this tab whenever you’re ready. No reply has been sent by this screen.</p><button class="story-soft-skip" data-story="replay">Read it again another time</button>`;
 $('#storyProgress').innerHTML='';$('#storyAnnouncement').textContent='End of the note. No reply is required.';$('h1',s).focus({preventScroll:true});
}
function adaptOccasionScene(type,s){
 if(gift.occasion==='birthday')return;const o=occasionOf(gift);
 if(type==='opening'){
  $('.story-title',s).innerHTML=o.opening;$('.story-description',s).textContent=gift.occasion==='apology'?'…and they have something very important (and very sorry) to tell you.':'Someone made a little space in the world for you. It starts with one small light.';
  if(gift.occasion==='apology')$('.opening-bottom',s).textContent='Be gentle. They’re already pouting. 🥺';
 }
 if(type==='message'){
  $('.letter-sign',s).innerHTML=gift.occasion==='wedding'?'With love,<br>'+e(gift.sender||gift.families||coupleOf(gift)):gift.sender?(gift.occasion==='apology'?'Your very sorry,<br>':'From my little corner,<br>')+e(gift.sender):gift.occasion==='apology'?'Your very sorry person 🥺':'A little heart, tucked into a note.';
  if(gift.occasion==='wedding'){const to=$('.letter-to',s);if(to)to.textContent='Dear '+(guestName()||'family & friends')+',';$('.story-eyebrow',s).textContent='A note from the families';}
  const next=$('[data-story=next]',s);if(next)next.innerHTML=(gift.occasion==='apology'?'There’s more. Please keep going 🥺':'There’s a little more')+' '+icon('arrow');
 }
 if(type==='memories'&&gift.occasion==='apology'){
  $('.story-title',s).innerHTML='Remember<br><em>how cute we are?</em>';$('.story-eyebrow',s).textContent='Evidence for the defence';
  $('[data-story=next]',s).innerHTML='Let’s make more of these '+icon('arrow');
 }
 if(type==='photos'&&gift.occasion==='apology'){
  $('.story-title',s).innerHTML='Exhibit A:<br><em>we’re cute together.</em>';$('.story-eyebrow',s).textContent='Evidence for the defence';
  $('[data-story=next]',s).innerHTML='The defence rests 🥺 '+icon('arrow');
 }
 if(type==='voice'){
  $('[data-story=next]',s).innerHTML='There’s a little more '+icon('arrow');
  if(gift.occasion==='apology')$('.story-eyebrow',s).textContent='Press play. I sound very sorry.';
 }
 if(type==='final'){
  $('.story-eyebrow',s).textContent='A little something, just for you';
  $('[data-story=next]',s).innerHTML=(gift.occasion==='apology'?'Now, one very important question':'One last little moment')+' '+icon('arrow');
 }
 if(type==='fun'){
  const eyebrow=$('.story-eyebrow',s);if(eyebrow)eyebrow.textContent=eyebrow.textContent.replace(/birthday/gi,'little');
 }
 if(type==='reply'){
  $('.story-eyebrow',s).textContent=gift.occasion==='apology'?'Say something back':gift.occasion==='wedding'?'For '+(coupleOf(gift)||gift.name):'A little feeling, in your own words';
  $('.story-title',s).innerHTML=gift.occasion==='wedding'?'Send your<br><em>blessings.</em>':gift.occasion==='apology'?'Okay, fine.<br><em>You’re forgiven.</em>':gift.occasion==='proposal'?'Your answer.<br><em>In your own words.</em>':'A little feeling,<br><em>sent back with care.</em>';
  $('.story-description',s).textContent=gift.occasion==='wedding'?'Tap a feeling, add a few words if you like. Only the couple will see it.':gift.occasion==='apology'?'An emoji, a few words, or a demand for snacks. They’re waiting by their phone. 🥺':'An emoji, a few words, or simply keeping this moment. It’s up to you.';
  const sorry=gift.occasion==='apology',wed=gift.occasion==='wedding',reactions=sorry?SORRY_REACTIONS:wed?WEDDING_REACTIONS:GENERIC_REACTIONS;
  $('.reactions',s).setAttribute('aria-label','Choose a feeling, optionally');$('.reactions',s).innerHTML=reactions.map(([emoji,label])=>`<button class="reaction-btn" data-reaction="${emoji}" aria-label="${label}" aria-pressed="false">${emoji}</button>`).join('');
  reaction='';$('label[for=recipientReply]',s)&&($('label[for=recipientReply]',s).textContent=wed?'Your blessings for the couple':'Your reply to the person who made this gift');$('#recipientReply').placeholder=wed?'Your blessings for the couple… (optional)':sorry?'You’re forgiven, but… (optional)':gift.occasion==='proposal'?'Your answer, in your own words…':'A little feeling, in your own words… (optional)';
  if((gift.occasion==='proposal'||sorry)&&journeyReply){$('#recipientReply').value=journeyReply;}
  else{try{const old=JSON.parse(localStorage.getItem('luv4u.reply.'+gift.id)||'null');if(old){$('#recipientReply').value=cleanText(old.text,500);if(reactions.some(v=>v[0]===old.reaction))selectReaction(old.reaction,false);}}catch{}}
  const prep=$('.reply-form [data-story=prepare-reply]',s);if(prep)prep.innerHTML='Prepare my reply '+icon('heart');/* hosted gifts already turned it into "Send my reply" */
  if(gift.occasion==='proposal')$('.reply-form',s).insertAdjacentHTML('beforeend','<p class="reply-template-boundary">Choosing words doesn’t send them. Your reply stays here until you use a sharing or send button.</p><button class="story-soft-skip" data-v3="finish-reading">Finish without replying</button>');
  refreshMessageTemplates();
 }
 $('#storyAnnouncement').textContent=type==='opening'?'Your little '+o.short.toLowerCase()+' is waiting.':o.label+': moment '+sceneIndex+' of '+(scenes.length-1)+'.';
}

const CAMPAIGN_HEADINGS={wedding:'Your big day.<br>An invite they’ll<br><em>remember.</em>',birthday:'A birthday wish.<br>A whole little<br><em>world.</em>',proposal:'A brave question.<br>A little room for<br><em>butterflies.</em>',love:'No big occasion.<br>Just a whole lot of<br><em>love.</em>',apology:'A tiny sorry.<br>A very big<br><em>pleeease.</em>',anniversary:'Your little story.<br>Another lovely<br><em>chapter.</em>',thanks:'A little bouquet.<br>A whole lot of<br><em>thank you.</em>',congratulations:'Their little win.<br>A very well-earned<br><em>spotlight.</em>',missyou:'A paper hug.<br>For the one you<br><em>miss.</em>'};
function applyCampaign(key,keepTitle=false){
 if(!Object.hasOwn(OCCASIONS,key))return;const o=OCCASIONS[key];campaignOccasion=key;showView('home');
 $('#landingTitle').innerHTML=CAMPAIGN_HEADINGS[key];$('#landingLead').textContent=o.description;const b=$('#primaryCreate');b.removeAttribute('data-action');b.dataset.chooseOccasion=key;b.innerHTML=e(o.cta)+' '+icon('arrow');
 setHomeOccasion(key);if(!keepTitle)document.title=o.label+' website · Kholona';if(paymentsRequired)updatePaymentsUI();
}
function resetLanding(){
 campaignOccasion='';
 if(!$('#landingTitle'))return;$('#landingTitle').innerHTML='Some feelings<br>deserve a little<br><em>magic.</em>';$('#landingLead').innerHTML='More than a message. A little world they get to<br>open, feel, and keep. Made by you, just for them.';
 const b=$('#primaryCreate');delete b.dataset.chooseOccasion;b.dataset.action='create';b.innerHTML='Make a gift '+icon('spark');setHomeOccasion(homeOccasion);
}

function openCampaign(key){
 if(!Object.hasOwn(OCCASIONS,key))return;
 clearGiftHash();try{history.replaceState(null,'',backendReady?'/for/'+OCCASIONS[key].slug:location.pathname+'#occasion='+key);}catch{}
 applyCampaign(key);window.scrollTo({top:0,behavior:'instant'});$('#landingTitle').setAttribute('tabindex','-1');$('#landingTitle').focus({preventScroll:true});
}

/* ---- The birthday, made for Instagram: a midnight countdown, a big "Happy Birthday" with fireworks and their name in neon,
   number candles (only if the sender wants the age shown), photos that drop in, their Birthday Wrapped, and a 9:16 card for their story. ---- */
function birthdayOpening(s){
 $('.story-eyebrow',s).textContent='11:59 PM · Just for '+gift.name;
 $('.story-title',s).innerHTML='It’s almost<br><em>your day…</em>';
 $('.story-description',s).textContent=(gift.sender?gift.sender+' has':'Someone has')+' been waiting all year for this.';
 const label=$('#lightTrigger span:last-child',s);if(label)label.textContent='Start the countdown ✨';
 const caption=$('#lightingCaption');if(caption)caption.textContent='Ready? 3… 2… 1…';
}
/* Three big beats in the dark before the lights. Skipped on replay and for reduced motion. */
async function birthdayCountdown(token){
 if(reducedMotion||gift.motion===false)return;
 const exp=$('#experience'),box=document.createElement('div');box.className='bday-countdown';box.setAttribute('aria-hidden','true');exp.append(box);
 $('#storyAnnouncement').textContent='Three, two, one…';
 for(const n of [3,2,1]){
  if(token!==experienceToken){box.remove();return;}
  box.innerHTML=`<span>${n}</span><small>${n===1?'make a wish…':'it’s almost your day'}</small>`;sfx('note',3-n);buzz(22);await sleep(820);
 }
 if(token!==experienceToken){box.remove();return;}
 partyNight(true);box.classList.add('done');setTimeout(()=>box.remove(),650);
}
/* A night sky behind the big moment; the room's lights show through once it fades. */
function partyNight(on){
 const exp=$('#experience');if(!exp)return;let sky=$('.party-sky',exp);
 if(on&&!sky){exp.insertAdjacentHTML('beforeend','<div class="party-sky" aria-hidden="true"></div>');sky=$('.party-sky',exp);requestAnimationFrame(()=>sky.classList.add('on'));}
 else if(!on&&sky&&!sky.classList.contains('leaving')){sky.classList.add('leaving');sky.classList.remove('on');setTimeout(()=>sky.remove(),900);}
}
function fireworks(ms=3000){
 if(reducedMotion||gift?.motion===false)return;
 const exp=$('#experience');if(!exp)return;$('.fireworks-canvas',exp)?.remove();
 const c=document.createElement('canvas');c.className='fireworks-canvas';c.setAttribute('aria-hidden','true');exp.append(c);
 const w=exp.clientWidth,h=exp.clientHeight,dpr=Math.min(devicePixelRatio||1,2),x=c.getContext('2d');if(!x){c.remove();return;}
 c.width=w*dpr;c.height=h*dpr;x.setTransform(dpr,0,0,dpr,0,0);
 const colors=['#ff5c8a','#ffd166','#ff8fb1','#b8f2e6','#c9a7ff','#fff3b0'],rockets=[],sparks=[],token=experienceToken,t0=performance.now();let nextLaunch=t0,last=t0;
 const launch=()=>rockets.push({x:w*(.15+Math.random()*.7),y:h,vy:-(h*.013+Math.random()*h*.004),top:h*(.1+Math.random()*.3),c:colors[Math.floor(Math.random()*colors.length)]});
 const burst=r=>{const n=46+Math.floor(Math.random()*26);for(let i=0;i<n;i++){const a=Math.PI*2*i/n,sp=1.5+Math.random()*2.7;sparks.push({x:r.x,y:r.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,c:Math.random()<.2?'#fff':r.c});}};
 const frame=now=>{
  if(token!==experienceToken||!c.isConnected){c.remove();return;}
  const dt=Math.min((now-last)/16.67,2);last=now;
  if(now-t0<ms&&now>=nextLaunch){launch();nextLaunch=now+240+Math.random()*320;}
  x.globalCompositeOperation='destination-out';x.fillStyle='rgba(0,0,0,.24)';x.fillRect(0,0,w,h);x.globalCompositeOperation='lighter';
  for(let i=rockets.length-1;i>=0;i--){const r=rockets[i];r.y+=r.vy*dt;x.globalAlpha=1;x.fillStyle=r.c;x.beginPath();x.arc(r.x,r.y,2.4,0,7);x.fill();if(r.y<=r.top){burst(r);rockets.splice(i,1);}}
  for(let i=sparks.length-1;i>=0;i--){const p=sparks[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.045*dt;p.vx*=.985;p.vy*=.985;p.life-=.012*dt;if(p.life<=0){sparks.splice(i,1);continue;}x.globalAlpha=p.life;x.fillStyle=p.c;x.beginPath();x.arc(p.x,p.y,2,0,7);x.fill();}
  x.globalAlpha=1;
  if(now-t0<ms||rockets.length||sparks.length)requestAnimationFrame(frame);else c.remove();
 };
 requestAnimationFrame(frame);
}
function renderBirthdayScene(type,s){
 if(type==='hbd'){
  const name=e(gift.name),age=shownAge(gift),token=experienceToken,shown=Date.now(),letters=w=>[...w].map((ch,i)=>`<b style="--i:${i}">${ch}</b>`).join('');
  s.innerHTML=`<div class="hbd"><p class="hbd-kicker">${gift.sender?e(gift.sender)+' says':'It’s officially your day'}</p><h1 class="story-title hbd-title" tabindex="-1" aria-label="Happy birthday, ${name}"><span class="hbd-line" aria-hidden="true">${letters('HAPPY')}</span><span class="hbd-line l2" aria-hidden="true">${letters('BIRTHDAY')}</span></h1><p class="hbd-name${gift.name.length>11?' long':''}">${name}</p>${age?`<p class="hbd-age">turning ${age} ✨</p>`:''}</div>`;
  sfx('fanfare');buzz([30,40,80]);fireworks(3600);
  setTimeout(()=>{if(token===experienceToken&&scenes[sceneIndex]==='hbd'){confetti(90);sfx('bloom');}},1100);
  s.addEventListener('pointerup',()=>{if(Date.now()-shown>1500&&token===experienceToken&&scenes[sceneIndex]==='hbd')goToScene(sceneIndex+1);});
  autoAdvance(reducedMotion?0:5200,'hbd');
  if(reducedMotion)s.insertAdjacentHTML('beforeend',storyButton('Make a wish 🎂'));
 }
 if(type==='wrapped')renderWrapped(s);
}
/* Their Birthday Wrapped: bold full-screen cards with big numbers, one after another, like the year-in-review everyone screenshots. */
function wrappedSlides(g){
 const [trait,played]=wrappedPicks(g),days=daysAlive(g),age=shownAge(g),year=new Date().getFullYear();
 return [
  {k:year+' · Birthday Wrapped',big:`${g.name.trim().toLowerCase()==='you'?'Your':e(g.name)+'’s'}<br>birthday,<br><em>wrapped.</em>`,sub:'A few stats. Lovingly made up. Very accurate.'},
  ...(days?[{k:'You’ve been alive for',count:days,sub:'days. The world got better on day one.'},{k:'That’s',count:days*24,sub:'hours of being iconic.'}]:[]),
  ...(age?[{k:'New level unlocked',big:'Level '+age,sub:'New powers. Same cute face.'}]:[]),
  {k:'Your top trait',big:e(trait),sub:'Not up for debate.'},
  {k:'Most played',big:e(played),sub:'On repeat. Forever.'},
  {k:'Up next',big:'Your best<br>year <em>yet.</em>',sub:g.sender?'Wrapped with love, by '+e(g.sender)+'.':'Wrapped with love.'}
 ];
}
let wrapIndex=-1,wrapCount=0,wrapTimer=0;
function renderWrapped(s){
 const slides=wrappedSlides(gift);wrapCount=slides.length;wrapIndex=-1;clearTimeout(wrapTimer);
 s.innerHTML=`<h1 class="sr-only" tabindex="-1">${e(gift.name)}’s Birthday Wrapped</h1><div class="wrapped" id="wrapped"><div class="wrapped-bars" aria-hidden="true">${slides.map(()=>'<i><b></b></i>').join('')}</div><button type="button" class="wrapped-stage" data-v3="wrapped-next" aria-label="Next">${slides.map((sl,i)=>`<section class="wrapped-slide w${i%5}" aria-hidden="true"><p class="w-kicker">${sl.k}</p><p class="w-big${sl.count?' w-count':''}"${sl.count?` data-count="${sl.count}"`:''}>${sl.count?'0':sl.big}</p><p class="w-sub">${sl.sub}</p><span class="w-brand">kholona.in</span></section>`).join('')}</button><p class="w-hint" id="wrappedHint">Tap for the next one</p></div><div id="occasionAfter" aria-live="polite"></div>`;
 const token=experienceToken;setTimeout(()=>{if(token===experienceToken)wrappedNext(false);},80);/* after the scene change settles */
}
function wrappedNext(manual){
 const box=$('#wrapped');if(!box||scenes[sceneIndex]!=='wrapped'||manual&&transitionBusy)return;clearTimeout(wrapTimer);
 if(wrapIndex>=wrapCount-1){if(manual){chime('soft');goToScene(sceneIndex+1);}return;}
 wrapIndex++;const slides=$$('.wrapped-slide',box),bars=$$('.wrapped-bars i',box),last=wrapIndex===wrapCount-1,ms=slides[wrapIndex].querySelector('.w-count')?3000:2600,token=experienceToken;
 slides.forEach((el,i)=>{el.classList.toggle('is-on',i===wrapIndex);el.classList.toggle('is-past',i<wrapIndex);el.setAttribute('aria-hidden',String(i!==wrapIndex));});
 bars.forEach((b,i)=>{b.className=i<wrapIndex?'done':i===wrapIndex?'now':'';b.style.setProperty('--ms',(last?500:ms)+'ms');});
 const big=$('.w-count',slides[wrapIndex]);if(big)countUp(big);
 $('#storyAnnouncement').textContent=slides[wrapIndex].textContent.replace('kholona.in','').replace(/\s+/g,' ').trim();
 sfx('note',wrapIndex);buzz(10);
 if(last){
  $('#wrappedHint').textContent='Screenshot this one 📸';
  setTimeout(()=>{if(token!==experienceToken||scenes[sceneIndex]!=='wrapped')return;$('#occasionAfter').innerHTML=softNext(scenes[sceneIndex+1]==='message'?'Read your note ✉️':'There’s a little more');autoAdvance(6000,'wrapped');},900);
  return;
 }
 wrapTimer=setTimeout(()=>{if(token===experienceToken)wrappedNext(false);},ms);
}
function countUp(el){
 const to=+el.dataset.count,fmt=new Intl.NumberFormat('en-IN');
 if(reducedMotion||gift.motion===false){el.textContent=fmt.format(to);return;}
 const t0=performance.now(),d=1200,step=now=>{const k=Math.min(1,(now-t0)/d);el.textContent=fmt.format(Math.round(to*(1-(1-k)**3)));if(k<1&&el.isConnected)requestAnimationFrame(step);};requestAnimationFrame(step);
}
function birthdayCakeScene(s){
 if(occasionKey(gift)!=='birthday')return;
 $('.story-title',s).innerHTML=`Make a wish, <span class="name-line${gift.name.length>18?' long-name':''}"><em>${e(gift.name)}.</em></span>`;
 $('.story-eyebrow',s).textContent='Close your eyes first 🤫';
 const age=shownAge(gift);if(age)$('#birthdayCake').innerHTML=cakeSVG('birthday-cake',age);
}
/* Their photos drop in one by one, like polaroids landing on a table. */
function photoDrop(s){
 $('.story-title',s).innerHTML='Look what<br><em>I kept.</em>';$('.story-eyebrow',s).textContent='A few favourite moments';
 $('.photo-reel',s)?.classList.add('photo-drop');
 $$('.polaroid',s).forEach((f,i)=>{f.style.setProperty('--i',i);f.style.setProperty('--r',((i%2?1:-1)*(2+i*1.5)).toFixed(1)+'deg');});
 if(reducedMotion||gift.motion===false)return;const token=experienceToken;
 gift.photos.forEach((_,i)=>setTimeout(()=>{if(token===experienceToken&&scenes[sceneIndex]==='photos'){sfx('pop');buzz(8);}},420+i*420));
}
/* A 9:16 card for their story, made on this device; nothing is uploaded. */
async function saveBirthdayCard(button){
 if(button.disabled)return;button.disabled=true;const label=button.textContent;button.textContent='Making your card…';
 try{
  const W=1080,H=1920,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const bg=x.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#1d0b1f');bg.addColorStop(.4,'#5a1640');bg.addColorStop(.74,'#ff6f9a');bg.addColorStop(1,'#ffd3b0');x.fillStyle=bg;x.fillRect(0,0,W,H);
  const rand=seeded((gift.id||'')+gift.name+'card'),cols=['#ff8fb1','#ffd166','#c9a7ff','#b8f2e6','#ffffff'];
  for(let i=0;i<80;i++){x.globalAlpha=.2+rand()*.6;x.fillStyle='#fff';x.beginPath();x.arc(rand()*W,rand()*H*.5,1+rand()*2,0,7);x.fill();}
  for(let b=0;b<5;b++){const cx=90+rand()*(W-180),cy=80+rand()*520,r=45+rand()*70,n=22;x.fillStyle=cols[b%cols.length];for(let i=0;i<n;i++){const a=Math.PI*2*i/n,d=r*(.7+rand()*.3);x.globalAlpha=.5+rand()*.5;x.beginPath();x.arc(cx+Math.cos(a)*d,cy+Math.sin(a)*d,3+rand()*3,0,7);x.fill();}}
  x.globalAlpha=1;
  const svg=cakeSVG('card-cake',shownAge(gift)).replace(/<path class="cake-smoke"[^>]*\/>/g,'').replace('<svg ','<svg width="760" height="684" ');
  const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await img.decode();
  const sans='"Avenir Next","Segoe UI",Inter,sans-serif',emoji=',"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji"';x.textAlign='center';
  x.fillStyle='#ffc2d6';x.font='700 40px '+sans+emoji;x.fillText('IT’S MY BIRTHDAY 🎂',W/2,180);
  x.fillStyle='#fff';x.font='700 82px Georgia, serif'+emoji;
  ['Someone made me','a whole website','for my birthday 🥹'].forEach((t,i)=>x.fillText(t,W/2,330+i*100));
  let size=150;x.font=`italic 700 ${size}px Georgia, serif`;while(x.measureText(gift.name).width>W-140&&size>70){size-=8;x.font=`italic 700 ${size}px Georgia, serif`;}
  x.shadowColor='#ff5c8a';x.shadowBlur=42;x.fillStyle='#ffe3ef';x.fillText(gift.name,W/2,720);x.shadowBlur=0;
  x.drawImage(img,(W-760)/2,790,760,684);
  const days=daysAlive(gift);
  if(days){x.fillStyle='#fff';x.font='600 50px '+sans+emoji;x.fillText(new Intl.NumberFormat('en-IN').format(days)+' days of being iconic ✨',W/2,1600);}
  x.fillStyle='#7a2a4a';x.font='600 38px '+sans;x.fillText('made with kholona.in ♡',W/2,1830);
  const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!blob)throw new Error('No image');
  const file=new File([blob],'my-birthday.png',{type:'image/png'});track('story_card_saved');
  if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'My birthday 🎂'});}catch(err){if(err.name!=='AbortError')downloadBlob(blob,'my-birthday.png');}}
  else downloadBlob(blob,'my-birthday.png');
  button.textContent='Saved. Post it to your story 🎂';
 }catch{button.textContent=label;toast('That card could not be made in this browser. A screenshot works too. 🎂');}
 finally{button.disabled=false;}
}
/* The age candles need a birthday to count from. */
function syncAgeCandles(){
 const box=$('#ageCandles');if(!box)return;const has=!!validBirthDate(draft.birthDate),age=has?birthdayAge(draft):0;
 box.disabled=!has;if(!has)draft.ageCandles=false;box.checked=!!draft.ageCandles;
 const help=$('#ageCandlesHelp');if(help)help.textContent=has?(age?'They’re turning '+age+'. Off by default, since not everyone wants their age on the cake.':'Off by default.'):'Add their birthday first.';
}

/* ---- The wedding invite. A guest taps one wax seal; the envelope opens and the invitation plays as full-screen
   poster pages, one moment each, like stories (tap for the next, hold to pause): a blessing and their name, the couple,
   save the date, one poster per function with directions and calendar, photos, a note, and a finale to bless the couple
   and post "I'm invited". Every page is made to be screenshotted. ---- */
const W_FUNCS={
 Engagement:{off:-2,time:'18:00',dress:'Pastels',pal:'engagement'},
 Haldi:{off:-1,time:'10:00',dress:'Shades of yellow',pal:'haldi'},
 Mehendi:{off:-1,time:'15:00',dress:'Shades of green',pal:'mehendi'},
 Sangeet:{off:-1,time:'19:30',dress:'Glam & sparkle',pal:'sangeet'},
 Wedding:{off:0,time:'19:00',dress:'Traditional',pal:'wedding'},
 Reception:{off:1,time:'19:30',dress:'Formal',pal:'reception'},
};
const W_CHIPS=['Engagement','Haldi','Mehendi','Sangeet','Reception'];
const W_BLESSINGS={shubh:'॥ शुभ विवाह ॥',ganesh:'॥ श्री गणेशाय नमः ॥',none:''};
const W_LINES=['With the blessings of our families','Together with their families','Along with our parents','With joy in our hearts'];
const coupleOf=g=>[g.name,g.partner].map(v=>String(v||'').trim()).filter(Boolean).join(' & ');
/* The hosts: each side's family name ("Sharma", "Verma family", "The Verma Parivar" all work). */
const famWord=v=>String(v||'').trim().replace(/^the\s+/i,'').replace(/\s+(family|families|parivar|pariwar|parivaar)$/i,'').trim();
function hostsOf(g){
 const f=[famWord(g.family1),famWord(g.family2)].filter(Boolean),u=f.filter((v,i)=>f.findIndex(x=>x.toLowerCase()===v.toLowerCase())===i);
 if(!u.length)return '';
 return 'The '+u.join(' & ')+(u.length>1?' families':' family');
}
const initialsOf=g=>[g.name,g.partner].map(v=>String(v||'').trim().charAt(0).toUpperCase()).filter(Boolean);
/* The guest a personal link was made for (?to=Sharma%20family). Shown on the envelope; never stored. */
const guestName=()=>{try{return cleanText(new URLSearchParams(location.search).get('to')||'',60).trim();}catch{return '';}};
function validStoryDateAny(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return '';const d=new Date(v+'T12:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===v?v:'';}
const addDaysYmd=(ymd,n)=>new Date(Date.parse(ymd+'T12:00:00Z')+n*864e5).toISOString().slice(0,10);
const fmtDay=(ymd,opts={weekday:'long',day:'numeric',month:'long',year:'numeric'})=>ymd?new Intl.DateTimeFormat('en-IN',{...opts,timeZone:'UTC'}).format(new Date(ymd+'T12:00:00Z')):'';
const fmtTime=t=>{if(!/^\d{2}:\d{2}$/.test(t||''))return '';const [h,m]=t.split(':').map(Number);return `${h%12||12}${m?':'+String(m).padStart(2,'0'):''} ${h<12?'am':'pm'}`;};
const weddingEventOf=g=>(g.events||[]).find(ev=>/^wedding$/i.test(String(ev.title||'').trim()));
const weddingDay=g=>validStoryDateAny(g.weddingDate)||validStoryDateAny(weddingEventOf(g)?.date)||'';
const cityOf=v=>{const parts=String(v||'').split(',').map(p=>p.trim()).filter(Boolean);return parts.length>1?parts[parts.length-1]:'';};
const weddingVenue=g=>String(weddingEventOf(g)?.venue||'').trim();
const weddingPlace=g=>cityOf(weddingVenue(g))||String(g.city||'').trim()||weddingVenue(g);
const palOf=title=>W_FUNCS[Object.keys(W_FUNCS).find(k=>k.toLowerCase()===String(title||'').trim().toLowerCase())]?.pal||'other';
/* The functions guests see, in date order; the wedding is always there. */
function weddingEvents(g){
 const list=(g.events||[]).filter(ev=>String(ev.title||'').trim()||ev.date||String(ev.venue||'').trim());
 if(!list.some(ev=>/^wedding$/i.test(String(ev.title||'').trim())))list.push({title:'Wedding',date:weddingDay(g),time:'',venue:g.city||'',map:'',dress:''});
 return list.map((ev,i)=>[ev,i]).sort(([a,i],[b,j])=>((a.date||'9999')+(a.time||'99:99')).localeCompare((b.date||'9999')+(b.time||'99:99'))||i-j).map(([ev])=>ev);
}
function mapsLink(ev){
 if(/^https:\/\//.test(ev.map||''))return ev.map;
 const q=String(ev.venue||'').trim();
 return q?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q):'';
}
function calendarLink(ev,g){
 const day=validStoryDateAny(ev.date);if(!day)return '';
 const ios=/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)&&'ontouchend' in document;
 const i=(g.events||[]).indexOf(ev);
 // iPhones add a calendar file straight to Calendar; everyone else gets Google Calendar.
 if(ios&&g.server&&/^[a-f0-9]{24}$/.test(g.id||'')&&i>=0)return `/api/gifts/${g.id}/calendar?e=${i}`;
 const ymd=day.replace(/-/g,'');let dates;
 if(/^\d{2}:\d{2}$/.test(ev.time||'')){const start=new Date(`${day}T${ev.time}:00+05:30`),end=new Date(start.getTime()+4*36e5),z=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');dates=`${z(start)}/${z(end)}`;}
 else dates=`${ymd}/${addDaysYmd(day,1).replace(/-/g,'')}`;
 const couple=coupleOf(g),title=(String(ev.title||'').trim()||'Wedding')+(couple?' · '+couple:'');
 return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(title)+'&dates='+dates+'&location='+encodeURIComponent(ev.venue||'')+'&details='+encodeURIComponent('You’re invited 💛 '+location.href.split('#')[0]);
}

/* ---- art: marigolds, a kalash, a mandala, and one small motif per function ---- */
function marigold(cx,cy,r,shade=0){
 const c=[['#f7a21b','#ffc23a','#e67e22'],['#ff8c1a','#ffb02e','#d9661a'],['#ffbf2e','#ffd85c','#f0a020']][shade%3];
 return `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="${c[2]}"/><circle cx="${cx}" cy="${cy}" r="${r*.78}" fill="${c[0]}" stroke="${c[2]}" stroke-width="${r*.12}" stroke-dasharray="${r*.22} ${r*.12}"/><circle cx="${cx}" cy="${cy}" r="${r*.48}" fill="${c[1]}" stroke="${c[0]}" stroke-width="${r*.1}" stroke-dasharray="${r*.16} ${r*.1}"/><circle cx="${cx}" cy="${cy}" r="${r*.16}" fill="${c[2]}"/></g>`;
}
function toranSVG(id='toran',w=390){
 const n=Math.round(w/26),strings=[];
 for(let i=0;i<=n;i++){const x=i*w/n,len=34+(i%2?14:0)+(i%4===0?10:0);strings.push(`<path d="M${x} 6v${len}" stroke="#c99a3c" stroke-width="1"/>`+[...Array(Math.round(len/9))].map((_,k)=>marigold(x,12+k*9,5.2,(i+k)%3)).join('')+(i%2?`<path d="M${x} ${len+8}q-6 10 0 20q6-10 0-20Z" fill="#4f7a2c"/>`:''));}
 return `<svg class="wedding-toran" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 80" preserveAspectRatio="none" aria-hidden="true"><path d="M0 6h${w}" stroke="#d4a24c" stroke-width="2"/>${strings.join('')}</svg>`;
}
/* The card art (home and the story card): an arch of marigolds around two gold rings and a diya. */
function weddingArtSVG(id='wedding-art'){
 const arch=[...Array(19)].map((_,i)=>{const a=Math.PI*(1-i/18),x=150+Math.cos(a)*108,y=150-Math.sin(a)*112;return marigold(x.toFixed(1),y.toFixed(1),11,i);}).join('');
 return `<svg viewBox="0 0 300 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><radialGradient id="${id}-glow"><stop stop-color="#ffd98a" stop-opacity=".75"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient><linearGradient id="${id}-gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f6d27a"/><stop offset=".5" stop-color="#d4a24c"/><stop offset="1" stop-color="#a8741f"/></linearGradient></defs><circle cx="150" cy="150" r="96" fill="url(#${id}-glow)"/>${arch}<path d="M42 150v95M258 150v95" stroke="#c99a3c" stroke-width="2.5"/>${[0,1,2,3,4].map(k=>marigold(42,170+k*17,8,k)+marigold(258,170+k*17,8,k+1)).join('')}<g class="wedding-rings"><circle cx="135" cy="150" r="27" fill="none" stroke="url(#${id}-gold)" stroke-width="7"/><circle cx="165" cy="150" r="27" fill="none" stroke="url(#${id}-gold)" stroke-width="7"/><path d="m165 112 7-10h-14Z" fill="#fff6dc" stroke="#d4a24c" stroke-width="1.5"/></g><g transform="translate(150 222)"><path d="M-26 0q26 22 52 0Z" fill="#c2410c"/><path d="M-26 0h52" stroke="#f6d27a" stroke-width="3"/><path class="flame" d="M0-26c-1 7-8 11-5 17 2 5 9 5 10 0 2-6-4-10-5-17Z" fill="#ffb65a"/></g></svg>`;
}
/* A mandala: rings of petals, drawn in thin gold. */
function mandalaSVG(cls='',color='#d4a24c',rings=[[18,12,34],[14,22,62],[24,14,92],[32,10,118]]){
 const petal=(r,w,n,rot)=>[...Array(n)].map((_,i)=>`<path d="M0 ${-r+w*2.2}q${w} ${-w*1.2} 0 ${-w*2.2}q${-w} ${w} 0 ${w*2.2}Z" transform="rotate(${(360/n)*i+rot})"/>`).join('');
 return `<svg class="${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="-130 -130 260 260" aria-hidden="true"><g fill="none" stroke="${color}" stroke-width=".9">${rings.map(([n,w,r],k)=>petal(r,w/2,n,k*7)+`<circle r="${r+2}" stroke-dasharray="1 4"/>`).join('')}<circle r="10"/><circle r="4" fill="${color}"/></g></svg>`;
}
function kalashSVG(){
 return `<svg class="wp-kalash" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 210" aria-hidden="true"><defs><linearGradient id="k-brass" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#b8862b"/><stop offset=".45" stop-color="#f6d27a"/><stop offset="1" stop-color="#a8741f"/></linearGradient></defs>${[-62,-38,-14,14,38,62].map((a,i)=>`<path d="M100 78q${a*.55} -46 ${a*.95} -38q${-a*.3} 22 ${-a*.95} 38Z" fill="${i%2?'#4f7a2c':'#5f8f35'}" stroke="#3d6020" stroke-width=".8"/>`).join('')}<ellipse cx="100" cy="62" rx="22" ry="25" fill="#8b5a2b"/><path d="M84 52q16-14 32 0" stroke="#6b3f1a" stroke-width="2" fill="none"/><path d="M58 92q42-16 84 0l-6 10q-36-12-72 0Z" fill="url(#k-brass)"/><path d="M64 102q-30 30-10 66 46 26 92 0 20-36-10-66-36-10-72 0Z" fill="url(#k-brass)" stroke="#a8741f"/><path d="M60 130q40 16 80 0" stroke="#8a1c33" stroke-width="5" fill="none"/>${[70,85,100,115,130].map((x,i)=>`<circle cx="${x}" cy="${136+Math.sin(i)*2}" r="3" fill="#f6d27a"/>`).join('')}<ellipse cx="100" cy="186" rx="48" ry="8" fill="#000" opacity=".12"/></svg>`;
}
const W_MOTIF={
 haldi:()=>`<svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="h-b" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#b8862b"/><stop offset=".5" stop-color="#f6d27a"/><stop offset="1" stop-color="#a8741f"/></linearGradient></defs><ellipse cx="100" cy="72" rx="62" ry="14" fill="#e8a317"/><path d="M38 72q8 46 62 46t62-46" fill="url(#h-b)" stroke="#a8741f"/><ellipse cx="100" cy="72" rx="56" ry="10" fill="#f4c20d"/>${[[28,96,10,0],[172,98,10,1],[52,30,9,2],[150,28,9,0],[100,18,8,1]].map(([x,y,r,s])=>marigold(x,y,r,s)).join('')}</svg>`,
 mehendi:()=>mandalaSVG('wp-motif-mandala','#f3e3b6',[[12,12,26],[16,16,48],[20,12,70]]),
 sangeet:()=>`<svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g stroke="#f6d27a" stroke-width="2" fill="none"><path d="M50 50q50-22 100 0v40q-50 22-100 0Z" fill="#7a1f5c"/><ellipse cx="50" cy="70" rx="12" ry="20" fill="#f6d27a"/><ellipse cx="150" cy="70" rx="12" ry="20" fill="#f6d27a"/>${[64,80,96,112,128].map((x,i)=>`<path d="M${x} ${48-i%2*2}l8 44"/>`).join('')}</g><g fill="#f6d27a"><path d="M24 24v26a7 7 0 1 1-3-6V30l14-4v18a7 7 0 1 1-3-6V30Z"/><path d="M170 18v24a6 6 0 1 1-3-5V18Z"/><circle cx="186" cy="64" r="3"/><circle cx="16" cy="88" r="2.4"/><path d="m178 96 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/></g></svg>`,
 wedding:()=>`<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g stroke="#d4a24c" stroke-width="2.2" fill="none"><path d="M30 40q70-46 140 0"/><path d="M24 40h152"/><path d="M36 40v84M164 40v84M70 40v84M130 40v84" stroke-width="3"/><path d="M20 126h160"/></g>${[...Array(9)].map((_,i)=>[...Array(4+(i%2))].map((_,k)=>marigold(30+i*17.5,48+k*9,4.2,i+k)).join('')).join('')}<g transform="translate(100 120)"><path d="M-16 0h32l-6-10h-20Z" fill="#a8741f"/><path d="M0-34c-3 9-12 13-8 22 3 6 13 6 15 0 3-8-5-13-7-22Z" fill="#ff8c1a"/><path d="M0-24c-5 7-6 14 0 15 6-1 5-8 0-15Z" fill="#ffd85c"/></g></svg>`,
 reception:()=>`<svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g fill="none" stroke="#f6d27a" stroke-width="2"><path d="M100 6v18"/><path d="M60 40q40 26 80 0"/><path d="M70 40q30 50 60 0"/><circle cx="100" cy="30" r="8" fill="#f6d27a"/>${[60,80,100,120,140].map((x,i)=>`<path d="M${x} ${40+Math.abs(2-i)*-3}v${18-Math.abs(2-i)*4}"/><circle cx="${x}" cy="${60-Math.abs(2-i)*7}" r="3.4" fill="#fff3c4"/>`).join('')}</g><g fill="#f6d27a">${[[24,30],[176,26],[34,96],[168,100],[100,110]].map(([x,y])=>`<path d="m${x} ${y-7} 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/>`).join('')}</g></svg>`,
 engagement:()=>`<svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g fill="none" stroke="#b8862b" stroke-width="5"><circle cx="86" cy="76" r="30"/><circle cx="114" cy="76" r="30"/></g><path d="m114 34 10-14h-20Z" fill="#fff" stroke="#b8862b" stroke-width="2"/>${[[30,40],[170,40],[40,110],[160,108]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="9" fill="#f4b6c2"/><circle cx="${x}" cy="${y}" r="4" fill="#e88aa0"/>`).join('')}</svg>`,
 other:()=>mandalaSVG('wp-motif-mandala','#d4a24c',[[12,12,26],[16,16,48]]),
};

/* ---- the envelope (the opening scene): one tap on the seal ---- */
function renderWeddingEnvelope(s){
 const guest=guestName(),[a,b]=initialsOf(gift),couple=coupleOf(gift)||gift.name,hosts=hostsOf(gift),one=/ family$/.test(hosts);
 const from=hosts||couple,line=hosts?'to the wedding of '+couple:'to celebrate their wedding';
 s.className='story-scene opening-scene wedding-envelope-scene';
 s.innerHTML=`<p class="we-kicker">${e(from)}</p><p class="we-invite">${one?'invites':'invite'}</p><h1 class="we-guest" tabindex="-1">${guest?e(guest):'you'}</h1><p class="we-to">${e(line)}</p><button type="button" class="we-envelope" data-story="light" id="lightTrigger" aria-label="Break the seal and open the invitation"><span class="we-back"></span><span class="we-card"><span class="we-card-inner">${kalashSVG()}<b>${e(W_BLESSINGS[gift.blessing]??W_BLESSINGS.shubh)||'❀'}</b></span></span><span class="we-pocket"></span><span class="we-flap"></span><span class="we-seal" aria-hidden="true"><b>${e(a||'❀')}</b>${b?`<i>✦</i><b>${e(b)}</b>`:''}</span></button><p class="we-hint">Tap the seal to open</p>`;
 $('#storyProgress').innerHTML='';$('#storyAnnouncement').textContent=`${from} ${one?'invites':'invite'} ${guest||'you'} ${line}. Tap the seal to open.`;
}
async function openWeddingEnvelope(quick){
 const token=experienceToken,exp=$('#experience');transitionBusy=true;ensureAudio();startMusic();
 const env=$('.we-envelope');if(env)env.disabled=true;
 if(!quick&&env&&!reducedMotion&&gift.motion!==false){
  env.classList.add('is-open');sfx('pop');buzz([18,40,12]);
  setTimeout(()=>{if(token===experienceToken){sfx('page');chime('wish');}},380);
  await sleep(1350);if(token!==experienceToken)return;
  exp.insertAdjacentHTML('beforeend','<div class="we-flash" aria-hidden="true"></div>');
  await sleep(380);if(token!==experienceToken)return;
 }
 exp.classList.add('lit');$('meta[name="theme-color"]').content='#3d0a16';
 sceneIndex=1;renderScene();transitionBusy=false;
 setTimeout(()=>$('.we-flash')?.remove(),900);
}

/* ---- the poster pages ---- */
function weddingPages(g){
 const evs=weddingEvents(g),note=String(g.message||'').trim();
 return [{k:'hello',ms:4200},{k:'names',ms:6500},...(weddingDay(g)?[{k:'date',ms:5200}]:[]),...evs.map(ev=>({k:'event',ev,ms:6500})),...(g.photos?.length?[{k:'photos',ms:7000}]:[]),...(note?[{k:'note',ms:Math.min(14000,5000+note.length*45)}]:[])];
}
function weddingPageHTML(p,g,i,total){
 const guest=guestName(),[a,b]=[g.name,g.partner].map(v=>e(String(v||'').trim())),bless=W_BLESSINGS[g.blessing]??W_BLESSINGS.shubh,tag=String(g.hashtag||'').trim(),day=weddingDay(g);
 if(p.k==='hello')return `<section class="wp-page wp-ivory wp-hello"><div class="wp-frame"></div>${mandalaSVG('wp-bg-mandala','#e2c27e')}<div class="wp-body"><div class="wp-in" style="--d:0">${kalashSVG()}</div>${bless?`<p class="wp-bless wp-in" style="--d:1">${e(bless)}</p>`:''}<p class="wp-dear wp-in" style="--d:2">Dear ${e(guest||'family & friends')},</p><p class="wp-lead wp-in" style="--d:3">${hostsOf(g)?`with joy in their hearts,<br><b class="wp-hosts">${e(hostsOf(g).replace(/^The/,'the'))}</b><br>${/ family$/.test(hostsOf(g))?'invites':'invite'} you to celebrate<br>the wedding of`:'with joy in our hearts,<br>we invite you to celebrate<br>the wedding of'}</p></div></section>`;
 if(p.k==='names')return `<section class="wp-page wp-maroon wp-names">${toranSVG('np'+i,390)}<div class="wp-arch"></div><div class="wp-body"><p class="wp-caps wp-in" style="--d:0">${e(String(g.families||'').trim()||W_LINES[0])}</p><h2 class="wp-script wp-foil wp-in" style="--d:1">${a||'&nbsp;'}</h2><p class="wp-weds wp-in" style="--d:2">weds</p><h2 class="wp-script wp-foil wp-in" style="--d:3">${b||'&nbsp;'}</h2>${tag?`<p class="wp-tag wp-in" style="--d:4">${e(tag)}</p>`:''}</div></section>`;
 if(p.k==='date'){const [wd,dd,mm,yy]=[fmtDay(day,{weekday:'long'}),fmtDay(day,{day:'numeric'}),fmtDay(day,{month:'long'}),fmtDay(day,{year:'numeric'})];return `<section class="wp-page wp-blush wp-date"><div class="wp-frame"></div>${mandalaSVG('wp-bg-mandala','#d9a3a0')}<div class="wp-body"><p class="wp-script wp-in" style="--d:0">Save the date</p><div class="wp-cal wp-in" style="--d:1"><span>${e(wd)}</span><b>${e(dd)}</b><span>${e(mm)}</span></div><p class="wp-caps wp-in" style="--d:2">${e(yy)}${weddingPlace(g)?' · '+e(weddingPlace(g)):''}</p><p class="wp-countdown wp-in" style="--d:3" data-countdown></p></div></section>`;}
 if(p.k==='event'){const ev=p.ev,pal=palOf(ev.title),map=mapsLink(ev),cal=calendarLink(ev,g),title=e(String(ev.title||'').trim()||'Celebration');return `<section class="wp-page wp-${pal} wp-event"><div class="wp-frame"></div><div class="wp-body"><div class="wp-motif wp-in" style="--d:0">${(W_MOTIF[pal]||W_MOTIF.other)()}</div><p class="wp-caps wp-in" style="--d:1">The</p><h2 class="wp-script wp-in" style="--d:1">${title}</h2>${ev.date?`<p class="wp-when wp-in" style="--d:2">${e(fmtDay(ev.date,{weekday:'long',day:'numeric',month:'long'}))}</p>`:''}${ev.time?`<p class="wp-time wp-in" style="--d:2">${e(fmtTime(ev.time))} onwards</p>`:''}<p class="wp-orn wp-in" style="--d:3" aria-hidden="true">✦ ✦ ✦</p>${ev.venue?`<p class="wp-venue wp-in" style="--d:3">${e(ev.venue)}</p>`:''}${ev.dress?`<p class="wp-dress wp-in" style="--d:4"><span>Dress code</span>${e(ev.dress)}</p>`:''}<div class="wp-actions wp-in" style="--d:5">${map?`<a class="wp-btn" href="${e(map)}" target="_blank" rel="noopener noreferrer">📍 Directions</a>`:''}${cal?`<a class="wp-btn ghost" href="${e(cal)}" target="_blank" rel="noopener noreferrer">📅 Save the date</a>`:''}</div></div></section>`;}
 if(p.k==='photos'){const ph=g.photos.slice(0,4);return `<section class="wp-page wp-ivory wp-photos"><div class="wp-frame"></div><div class="wp-body"><p class="wp-script wp-in" style="--d:0">Our story so far</p><div class="wp-polaroids n${ph.length}">${ph.map((x,k)=>`<figure class="wp-polaroid wp-in" style="--d:${k+1};--r:${[-6,5,-3,7][k]}deg"><div><img src="${e(x.src)}" alt="${e(x.caption||'A photo of the couple')}" style="${cropStyle(x)}" referrerpolicy="no-referrer"></div>${x.caption?`<figcaption>${e(x.caption)}</figcaption>`:''}</figure>`).join('')}</div></div></section>`;}
 if(p.k==='note')return `<section class="wp-page wp-ivory wp-note"><div class="wp-frame"></div><div class="wp-body"><p class="wp-script wp-in" style="--d:0">Dear ${e(guest||'family & friends')},</p><p class="wp-letter wp-in" style="--d:1">${e(String(g.message||'').trim()).replace(/\n/g,'<br>')}</p><p class="wp-sign wp-in" style="--d:2">With love,<br>${e(coupleOf(g)||g.name)}${hostsOf(g)?`<small>and ${e(hostsOf(g).replace(/^The/,'the'))}</small>`:''}</p></div></section>`;
 return '';
}
let wpState=null;
function removeWeddingPlayer(){clearTimeout(wpState?.timer);wpState=null;$('#wpPlayer')?.remove();}
function renderWeddingStory(s){
 const g=gift,pages=weddingPages(g),exp=$('#experience');removeWeddingPlayer();
 s.className='story-scene invite-scene';s.innerHTML=`<h1 class="sr-only" tabindex="-1">${e(coupleOf(g)||g.name)}: the wedding invitation</h1>`;
 exp.insertAdjacentHTML('beforeend',`<div class="wp-player" id="wpPlayer" role="region" aria-roledescription="invitation" aria-label="The invitation, one page at a time. Tap for the next page."><div class="wp-bars" aria-hidden="true">${pages.map(()=>'<i><b></b></i>').join('')}</div><div class="wp-stage" id="wpStage">${pages.map((p,i)=>weddingPageHTML(p,g,i,pages.length)).join('')}</div><p class="wp-hint" aria-hidden="true">Tap for the next page · hold to pause</p></div>`);
 const stage=$('#wpStage'),token=experienceToken;wpState={pages,i:-1,timer:0,start:0,left:0,paused:false,token};
 $$('.wp-polaroid img',stage).forEach(img=>img.addEventListener('error',()=>img.closest('figure').hidden=true,{once:true}));
 let down=0,held=false,hold=0;
 stage.addEventListener('pointerdown',ev=>{if(ev.target.closest('a,button'))return;down=Date.now();held=false;clearTimeout(hold);hold=setTimeout(()=>{held=true;wpPause(true);},280);});
 stage.addEventListener('pointerup',ev=>{clearTimeout(hold);if(ev.target.closest('a,button')||!down)return;down=0;if(held){wpPause(false);return;}const r=stage.getBoundingClientRect();wpGo(wpState.i+(ev.clientX-r.left<r.width*.3?-1:1),true);});
 stage.addEventListener('pointercancel',()=>{clearTimeout(hold);if(held)wpPause(false);down=0;});
 stage.addEventListener('contextmenu',ev=>ev.preventDefault());
 wpState.keys=ev=>{if(scenes[sceneIndex]!=='invite')return;if(ev.key==='ArrowRight'||ev.key===' '){ev.preventDefault();wpGo(wpState.i+1,true);}if(ev.key==='ArrowLeft'){ev.preventDefault();wpGo(wpState.i-1,true);}};
 document.addEventListener('keydown',wpState.keys);
 setTimeout(()=>{if(wpState?.token===token&&wpState.i<0)wpGo(0);},60);/* once the scene change has settled */
}
function wpGo(i,manual){
 const st=wpState;if(!st||st.token!==experienceToken||manual&&transitionBusy)return;
 if(i<0)i=0;
 if(i>=st.pages.length){document.removeEventListener('keydown',st.keys);goToScene(sceneIndex+1);return;}
 clearTimeout(st.timer);const prev=st.i;st.i=i;st.paused=false;
 const pages=$$('#wpStage .wp-page'),bars=$$('#wpPlayer .wp-bars i');
 pages.forEach((p,k)=>{p.classList.toggle('is-on',k===i);p.classList.toggle('is-past',k<i);p.setAttribute('aria-hidden',String(k!==i));});
 bars.forEach((b,k)=>{b.className=k<i?'done':k===i?'now':'';b.style.setProperty('--ms',st.pages[i].ms+'ms');});
 $('#wpPlayer').classList.remove('is-paused');
 $('#storyAnnouncement').textContent=pages[i].textContent.replace(/\s+/g,' ').trim().slice(0,240);
 const p=st.pages[i];
 if(p.k==='names'){shehnai();petals(40);}else if(i!==prev)sfx(manual?'page':'note',i);
 if(p.k==='date')weddingCountdown($('[data-countdown]',pages[i]));
 st.start=performance.now();st.left=p.ms;st.timer=setTimeout(()=>wpGo(i+1),p.ms);
}
function wpPause(on){
 const st=wpState;if(!st||st.paused===on)return;st.paused=on;$('#wpPlayer')?.classList.toggle('is-paused',on);
 if(on){clearTimeout(st.timer);st.left=Math.max(400,st.left-(performance.now()-st.start));}
 else{st.start=performance.now();const i=st.i;st.timer=setTimeout(()=>wpGo(i+1),st.left);}
}
function weddingCountdown(el){
 const g=gift,day=weddingDay(g);if(!el||!day){if(el)el.hidden=true;return;}
 const t=/^\d{2}:\d{2}$/.test(weddingEventOf(g)?.time||'')?weddingEventOf(g).time:'00:00',target=new Date(`${day}T${t}:00+05:30`).getTime(),token=experienceToken;
 const tick=()=>{
  if(token!==experienceToken||!el.isConnected)return;
  const ms=target-Date.now();
  if(ms<=0){el.textContent=Date.now()-target<864e5?'Today’s the day 🎉':'Happily married 💛';return;}
  const d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5),m=Math.floor(ms%36e5/6e4),s=Math.floor(ms%6e4/1e3);
  el.innerHTML=`<b>${d}</b> days <b>${h}</b> hrs <b>${String(m).padStart(2,'0')}</b> min <b>${String(s).padStart(2,'0')}</b> sec to go`;
  setTimeout(tick,1000);
 };
 tick();
}
function shehnai(){
 const sa=293.66,notes=[[15/8/2,0,.35],[9/8,.32,.35],[5/4,.62,.45],[45/32,.98,.4],[3/2,1.32,.9],[5/4,2.1,.35],[9/8,2.4,.35],[1,2.72,1.3]];
 notes.forEach(([r,w,d])=>{tone(sa*r,w,d+.25,.07,'triangle');tone(sa*r*2,w,d,.025,'sine');});
}
function petals(count=60){
 if(reducedMotion||gift?.motion===false)return;
 const canvas=$('#confettiCanvas'),ctx=canvas?.getContext('2d');if(!ctx)return;cancelAnimationFrame(confettiFrame);canvas.hidden=false;
 const w=window.innerWidth,h=window.innerHeight,dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
 const colors=['#f7a21b','#ff8c1a','#ffc23a','#e2324f','#c2185b','#ffd85c'];
 const ps=Array.from({length:Math.min(count,140)},()=>({x:Math.random()*w,y:-20-Math.random()*h*.6,vx:(Math.random()-.5)*.8,vy:1+Math.random()*1.6,r:4+Math.random()*5,rot:Math.random()*6,spin:(Math.random()-.5)*.08,sway:Math.random()*6,c:colors[Math.floor(Math.random()*colors.length)]}));
 const t0=performance.now();let last=t0;
 const frame=now=>{const dt=Math.min((now-last)/16.67,2);last=now;ctx.clearRect(0,0,w,h);let alive=0;
  for(const p of ps){p.sway+=.03*dt;p.x+=(p.vx+Math.sin(p.sway)*.6)*dt;p.y+=p.vy*dt;p.rot+=p.spin*dt;if(p.y<h+20){alive++;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.c;ctx.globalAlpha=Math.max(0,1-(now-t0-6000)/1500);ctx.beginPath();ctx.ellipse(0,0,p.r,p.r*.55,0,0,7);ctx.fill();ctx.restore();}}
  if(alive&&now-t0<7500)confettiFrame=requestAnimationFrame(frame);else{ctx.clearRect(0,0,w,h);canvas.hidden=true;}};
 confettiFrame=requestAnimationFrame(frame);
}
/* The last page: bless the couple, every date in the calendar, and a card for their story. */
function renderWeddingFinale(s){
 const g=gift,exp=$('#experience'),tag=String(g.hashtag||'').trim(),day=weddingDay(g),calAll=g.server&&/^[a-f0-9]{24}$/.test(g.id||'')&&!isPreview?`/api/gifts/${g.id}/calendar`:'';
 removeWeddingPlayer();
 s.className='story-scene celebration-scene';s.innerHTML=`<h1 class="sr-only" tabindex="-1">We can’t wait to celebrate with you</h1>`;
 exp.insertAdjacentHTML('beforeend',`<div class="wp-player is-final" id="wpPlayer"><div class="wp-stage"><section class="wp-page wp-maroon wp-final is-on">${toranSVG('fin',390)}<div class="wp-body"><div class="wp-final-art wp-in" style="--d:0">${weddingArtSVG('fin-art')}</div><p class="wp-lead wp-in" style="--d:1">We can’t wait to<br>celebrate with you</p><h2 class="wp-script wp-foil wp-in" style="--d:2">${e(coupleOf(g)||g.name)}</h2><p class="wp-caps wp-in" style="--d:3">${day?e(fmtDay(day,{day:'numeric',month:'long',year:'numeric'})):''}${weddingPlace(g)?' · '+e(weddingPlace(g)):''}</p>${tag?`<p class="wp-tag wp-in" style="--d:3">${e(tag)}</p>`:''}<div class="wp-final-actions wp-in" style="--d:4"><button type="button" class="wp-btn gold" data-story="next">Send your blessings 💌</button>${calAll?`<a class="wp-btn" href="${e(calAll)}">📅 Add every function to my calendar</a>`:''}<button type="button" class="wp-btn" data-v3="wedding-card">Post “I’m invited” to your story 📸</button><button type="button" class="wp-link" data-story="replay">↻ Watch again</button></div></div></section></div></div>`);
 const token=experienceToken;finaleTimer=setTimeout(()=>{if(token!==experienceToken||scenes[sceneIndex]!=='celebration')return;sfx('fanfare');buzz([30,40,80]);petals(90);},reducedMotion?0:450);
}
function renderWeddingScene(type,s){
 if(type==='opening')return renderWeddingEnvelope(s);
 if(type==='invite')return renderWeddingStory(s);
 if(type==='celebration')return renderWeddingFinale(s);
}

/* "I'm invited" 9:16 card for the guest's story, made on this device. */
async function saveWeddingCard(button){
 if(button.disabled)return;button.disabled=true;const label=button.textContent;button.textContent='Making your card…';
 try{
  await Promise.all(['80px "Great Vibes"','40px "Cinzel"','italic 40px "Cormorant Garamond"'].map(f=>document.fonts?.load(f).catch(()=>{})));
  const W=1080,H=1920,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const bg=x.createRadialGradient(W/2,H*.35,80,W/2,H*.5,H*.75);bg.addColorStop(0,'#7a1428');bg.addColorStop(1,'#2c0610');x.fillStyle=bg;x.fillRect(0,0,W,H);
  x.strokeStyle='#d4a24c';x.lineWidth=4;x.strokeRect(50,50,W-100,H-100);x.lineWidth=1.5;x.strokeRect(70,70,W-140,H-140);
  const draw=async(svg,dx,dy,dw,dh)=>{const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg.replace('<svg ',`<svg width="${dw}" height="${dh}" `));await img.decode();x.drawImage(img,dx,dy,dw,dh);};
  await draw(toranSVG('card-toran',390).replace('preserveAspectRatio="none"',''),72,72,W-144,200);
  const gold=x.createLinearGradient(0,600,0,1100);gold.addColorStop(0,'#fff3c4');gold.addColorStop(.4,'#f6d27a');gold.addColorStop(1,'#b8862b');
  x.textAlign='center';x.fillStyle='#f3d9a4';x.font='600 46px Cinzel, Georgia, serif';x.fillText('I’M INVITED',W/2,400);
  x.font='italic 52px "Cormorant Garamond", Georgia, serif';x.fillStyle='#fbe9c8';x.fillText('to the wedding of',W/2,480);
  const names=[gift.name,gift.partner].map(v=>String(v||'').trim()).filter(Boolean);let y=680;
  for(const [i,n] of names.entries()){let size=180;x.font=`${size}px "Great Vibes", Georgia, serif`;while(x.measureText(n).width>W-200&&size>80){size-=8;x.font=`${size}px "Great Vibes", Georgia, serif`;}x.fillStyle=gold;x.shadowColor='#0008';x.shadowBlur=18;x.fillText(n,W/2,y);x.shadowBlur=0;if(i===0&&names.length>1){x.font='italic 60px "Cormorant Garamond", Georgia, serif';x.fillStyle='#f3d9a4';x.fillText('weds',W/2,y+110);y+=290;}}
  await draw(weddingArtSVG('card-art'),(W-500)/2,y+50,500,433);
  const day=weddingDay(gift);x.fillStyle='#fbe9c8';x.font='600 42px Cinzel, Georgia, serif';
  if(day)x.fillText(fmtDay(day,{day:'numeric',month:'long',year:'numeric'}).toUpperCase(),W/2,y+570);
  if(weddingPlace(gift)){x.font='italic 46px "Cormorant Garamond", Georgia, serif';x.fillText(weddingPlace(gift),W/2,y+635);}
  if(String(gift.hashtag||'').trim()){x.font='600 34px Cinzel, Georgia, serif';x.fillStyle='#f6d27a';x.fillText(String(gift.hashtag).trim(),W/2,H-190);}
  x.fillStyle='#d4a24c';x.font='600 28px Cinzel, Georgia, serif';x.fillText('MADE WITH KHOLONA.IN',W/2,H-110);
  const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!blob)throw new Error('No image');
  const file=new File([blob],'im-invited.png',{type:'image/png'});track('story_card_saved');
  if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'I’m invited 💛'});}catch(err){if(err.name!=='AbortError')downloadBlob(blob,'im-invited.png');}}
  else downloadBlob(blob,'im-invited.png');
  button.textContent='Saved. Post it to your story 💛';
 }catch{button.textContent=label;toast('That card could not be made in this browser. A screenshot works too. 💛');}
 finally{button.disabled=false;}
}
/* The link preview on WhatsApp: maroon and gold, the couple's names, the date and the place. */
function weddingCover(g){
 const c=document.createElement('canvas');c.width=1200;c.height=630;const x=c.getContext('2d');if(!x)return '';
 const bg=x.createRadialGradient(600,315,40,600,315,700);bg.addColorStop(0,'#7a1428');bg.addColorStop(1,'#3d0a16');x.fillStyle=bg;x.fillRect(0,0,1200,630);
 x.strokeStyle='#d4a24c';x.lineWidth=3;x.strokeRect(26,26,1148,578);x.lineWidth=1;x.strokeRect(40,40,1120,550);
 for(let i=0;i<=40;i++){const px=40+i*28;for(let k=0;k<(i%2?4:3);k++){const cx=px,cy=52+k*14,r=7;x.fillStyle=['#e67e22','#f7a21b','#ffc23a'][(i+k)%3];x.beginPath();x.arc(cx,cy,r,0,7);x.fill();x.fillStyle='#ffd85c';x.beginPath();x.arc(cx,cy,r*.4,0,7);x.fill();}}
 const gold=x.createLinearGradient(0,220,0,420);gold.addColorStop(0,'#f6d27a');gold.addColorStop(1,'#b8862b');x.textAlign='center';
 const show=g.sharePreview!==false,hosts=show?hostsOf(g):'',top=(hosts?hosts+(/ family$/.test(hosts)?' invites':' invite')+' you to the wedding of':'You’re invited to the wedding of').toUpperCase();
 x.fillStyle='#f3d9a4';let ts=26;x.font=`600 ${ts}px Cinzel, Georgia, serif`;while(x.measureText(top).width>1060&&ts>16){ts-=1;x.font=`600 ${ts}px Cinzel, Georgia, serif`;}x.fillText(top,600,190);
 const names=show?[g.name,g.partner].map(v=>String(v||'').trim()).filter(Boolean).join(' weds ')||g.name:'Our wedding';let size=104;const font=s=>`${s}px "Great Vibes", Georgia, serif`;x.font=font(size);while(x.measureText(names).width>1040&&size>44){size-=4;x.font=font(size);}
 x.fillStyle=gold;x.fillText(names,600,330);
 const day=weddingDay(g);x.fillStyle='#fbe9c8';x.font='600 30px Cinzel, Georgia, serif';x.fillText([day?fmtDay(day,{day:'numeric',month:'long',year:'numeric'}).toUpperCase():'',show?weddingPlace(g).toUpperCase():''].filter(Boolean).join('  ·  '),600,420);
 x.font='italic 28px Georgia';x.fillStyle='#e9c98f';x.fillText('Tap to open your invitation',600,480);
 x.textAlign='left';x.font='italic 26px Georgia';x.fillStyle='#d4a24c';x.fillText('kholona ♡',64,575);
 return c.toDataURL('image/jpeg',.86);
}
function weddingInviteText(g,url,guest=''){
 const day=weddingDay(g),couple=coupleOf(g)||g.name,place=weddingPlace(g),hosts=hostsOf(g),when=(day?' on '+fmtDay(day,{weekday:'long',day:'numeric',month:'long'}):'')+(place?' in '+place:'');
 return `${guest?'Dear '+guest+',\n':''}${hosts?`${hosts} joyfully ${/ family$/.test(hosts)?'invites':'invite'} you to the wedding of ${couple}${when}. 💛`:`You’re invited! 💛\n${couple} are getting married${when}.`}\n\nOpen your invitation: ${url}`;
}

/* ---- The wedding invite maker: one screen, filled in for you. Two names, the date and the venue; the wedding itself is
   always there; each extra function is one tap and arrives with its date, time, venue and dress code; every line of
   text has ready-made choices. A live poster shows what guests will see. ---- */
const wedOn=()=>occasionKey(draft)==='wedding';
let wbOpen=new Set(),wbPhotos=null,wbPhotosHome=null,wbPreviewTimer=0;
function ensureWeddingEvent(d=draft){
 d.events=Array.isArray(d.events)?d.events:[];let w=weddingEventOf(d);
 if(!w){w={title:'Wedding',date:validStoryDateAny(d.weddingDate),time:W_FUNCS.Wedding.time,venue:'',map:'',dress:W_FUNCS.Wedding.dress};d.events.push(w);if(!d.music||d.music==='none')d.music='shehnai';}
 return w;
}
function defaultEvent(title,d=draft){
 const f=W_FUNCS[title]||{off:0,time:'18:00',dress:''},day=validStoryDateAny(d.weddingDate),w=weddingEventOf(d)||{};
 return {title,date:day?addDaysYmd(day,f.off):'',time:f.time,venue:w.venue||'',map:w.map||'',dress:f.dress};
}
function hashtagIdeas(d=draft){
 const word=v=>String(v||'').trim().split(/\s+/)[0].replace(/[^\p{L}\p{N}]/gu,''),cap=s=>s.charAt(0).toUpperCase()+s.slice(1).toLowerCase();
 const [a,b]=d.groomFirst?[word(d.partner),word(d.name)]:[word(d.name),word(d.partner)];const bride=cap(d.groomFirst?b:a),groom=cap(d.groomFirst?a:b);
 if(!bride||!groom)return [];
 return [`#${bride}Weds${groom}`,`#${groom}Ki${bride}`,`#${bride}And${groom}Forever`];
}
const wbSummary=ev=>[fmtDay(ev.date,{weekday:'short',day:'numeric',month:'short'})||'Pick a date',fmtTime(ev.time)||'Pick a time',String(ev.venue||'').trim()||'Venue to come'].join(' · ');
function weddingBuilderHTML(){
 const d=draft,w=ensureWeddingEvent(d),labels=d.groomFirst?['Groom','Bride']:['Bride','Groom'],rows=d.events.map((ev,i)=>({ev,i})).sort((p,q)=>((p.ev.date||'9999')+(p.ev.time||'99:99')).localeCompare((q.ev.date||'9999')+(q.ev.time||'99:99'))||p.i-q.i);
 const chip=(text,attrs,on=false)=>`<button type="button" class="wb-chip${on?' is-on':''}" ${attrs}>${text}</button>`;
 const has=t=>d.events.some(ev=>String(ev.title||'').trim().toLowerCase()===t.toLowerCase());
 return `<div class="wb-card"><h3 class="wb-step"><span>1</span>The couple</h3>
  <div class="wb-names"><label><small>${labels[0]}</small><input class="text-input" id="wbName1" maxlength="40" autocomplete="off" autocapitalize="words" placeholder="${labels[0]==='Bride'?'Aanya':'Aditya'}" value="${e(d.name||'')}"></label><button type="button" class="wb-swap" data-wb="swap" aria-label="Swap the order of the names" title="Swap the order">⇄</button><label><small>${labels[1]}</small><input class="text-input" id="wbName2" maxlength="40" autocomplete="off" autocapitalize="words" placeholder="${labels[1]==='Bride'?'Aanya':'Aditya'}" value="${e(d.partner||'')}"></label></div>
  <p class="wb-help">Guests see <b id="wbShown">${e(String(d.name||'').trim()||labels[0])} weds ${e(String(d.partner||'').trim()||labels[1])}</b></p>
  <p class="wb-sub">Inviting on behalf of <i>optional</i></p>
  <div class="wb-row2"><label><small>${labels[0]}’s family</small><input class="text-input" id="wbFam1" maxlength="40" autocomplete="off" autocapitalize="words" placeholder="${labels[0]==='Bride'?'Sharma':'Verma'}" value="${e(d.family1||'')}"></label><label><small>${labels[1]}’s family</small><input class="text-input" id="wbFam2" maxlength="40" autocomplete="off" autocapitalize="words" placeholder="${labels[1]==='Bride'?'Sharma':'Verma'}" value="${e(d.family2||'')}"></label></div>
  <p class="wb-help" id="wbHosts">${hostsOf(d)?`The envelope reads <b>${e(hostsOf(d))} ${/ family$/.test(hostsOf(d))?'invites':'invite'} you</b>`:'Add surnames and the envelope reads <b>The Sharma &amp; Verma families invite you</b>'}</p></div>
 <div class="wb-card"><h3 class="wb-step"><span>2</span>The wedding <small>Always included</small></h3>
  <div class="wb-row2"><label><small>Date</small><input class="text-input" type="date" id="wbDate" value="${e(d.weddingDate||'')}"></label><label><small>Muhurat time</small><input class="text-input" type="time" id="wbTime" value="${e(w.time||'')}"></label></div>
  <label><small>Venue</small><input class="text-input" id="wbVenue" maxlength="140" placeholder="Jai Mahal Palace, Jaipur" value="${e(w.venue||'')}"></label>
  <label><small>Google Maps link <i>optional</i></small><input class="text-input" type="url" id="wbMap" maxlength="400" placeholder="Google Maps → Share → Copy link" value="${e(w.map||'')}"></label></div>
 <div class="wb-card"><h3 class="wb-step"><span>3</span>Functions <small>Tap to add. Dates and times fill in for you.</small></h3>
  <div class="wb-chips">${chip('✓ Wedding','disabled aria-pressed="true"',true)}${W_CHIPS.map(t=>chip((has(t)?'✓ ':'+ ')+t,`data-wb="add" data-title="${t}" aria-pressed="${has(t)}"`,has(t))).join('')}${chip('+ Other','data-wb="add" data-title=""')}</div>
  <ol class="wb-events">${rows.map(({ev,i})=>{const wed=ev===w,open=wbOpen.has(i),pal=palOf(ev.title);return `<li class="wb-ev${open?' is-open':''}" data-i="${i}"><div class="wb-ev-sum"><span class="wb-dot pal-${pal}" aria-hidden="true"></span><span class="wb-ev-text"><b>${e(String(ev.title||'').trim()||'New function')}</b><span data-sum="${i}">${e(wbSummary(ev))}</span></span><button type="button" class="wb-mini" data-wb="edit" data-i="${i}" aria-expanded="${open}">${open?'Done':'Edit'}</button>${wed?'':`<button type="button" class="wb-mini wb-x" data-wb="remove" data-i="${i}" aria-label="Remove ${e(ev.title||'this function')}">✕</button>`}</div>${open?`<div class="wb-ev-edit">${wed?'':`<label><small>Name</small><input class="text-input" data-wbe="title" data-i="${i}" maxlength="40" placeholder="Ring ceremony" value="${e(ev.title||'')}"></label>`}<div class="wb-row2"><label><small>Date</small><input class="text-input" type="date" data-wbe="date" data-i="${i}" value="${e(ev.date||'')}"></label><label><small>Time</small><input class="text-input" type="time" data-wbe="time" data-i="${i}" value="${e(ev.time||'')}"></label></div><label><small>Venue</small><input class="text-input" data-wbe="venue" data-i="${i}" maxlength="140" placeholder="Same as the wedding" value="${e(ev.venue||'')}"></label><label><small>Google Maps link <i>optional</i></small><input class="text-input" type="url" data-wbe="map" data-i="${i}" maxlength="400" value="${e(ev.map||'')}"></label><label><small>Dress code <i>optional</i></small><input class="text-input" data-wbe="dress" data-i="${i}" maxlength="60" value="${e(ev.dress||'')}"></label><div class="wb-chips small">${['Traditional','Shades of yellow','Shades of green','Pastels','Glam & sparkle','Formal','Indo-western'].map(t=>chip(t,`data-wb="dress" data-i="${i}" data-text="${e(t)}"`,ev.dress===t)).join('')}</div></div>`:''}</li>`;}).join('')}</ol></div>
 <div class="wb-card"><h3 class="wb-step"><span>4</span>The words <small>Tap one, or write your own</small></h3>
  <label><small>Invitation line</small><input class="text-input" id="wbFamilies" maxlength="160" placeholder="${e(W_LINES[0])}" value="${e(d.families||'')}"></label>
  <div class="wb-chips small">${W_LINES.map(t=>chip(e(t),`data-wb="line" data-text="${e(t)}"`,d.families===t)).join('')}</div>
  <label><small>Blessing at the top</small></label><div class="wb-chips small">${Object.entries(W_BLESSINGS).map(([k,v])=>chip(k==='none'?'None':e(v),`data-wb="bless" data-key="${k}"`,(d.blessing||'shubh')===k)).join('')}</div>
  <label><small>Wedding hashtag <i>optional</i></small><input class="text-input" id="wbTag" maxlength="40" placeholder="#AanyaWedsAditya" value="${e(d.hashtag||'')}"></label>
  <div class="wb-chips small" id="wbTagIdeas">${hashtagIdeas().map(t=>chip(e(t),`data-wb="tag" data-text="${e(t)}"`,d.hashtag===t)).join('')}</div>
  <label><small>A few words <i>optional</i></small><textarea class="text-area" id="wbNote" maxlength="600" rows="3" placeholder="${e(W_NOTES[0])}">${e(d.message||'')}</textarea></label>
  <div class="wb-chips small">${W_NOTES.map((t,k)=>chip(['Come celebrate','A new chapter','Two families'][k],`data-wb="note" data-text="${e(t)}"`,d.message===t)).join('')}</div></div>
 ${wbMusicHTML(d)}
 <div class="wb-card" id="wbPhotosSlot"><h3 class="wb-step"><span>6</span>Your photos <small>Optional · pre-wedding shoot, or any favourites</small></h3></div>
 <p class="wb-error" id="wbError" role="alert" hidden></p><p class="wb-price" id="wbPrice" hidden></p>`;
}
/* ---- Music: three original tunes made in the browser, any licensed tracks listed in WEDDING_TRACKS, or the couple's own
   song (up to 12 MB, uploaded straight to storage) starting at the moment they pick. ---- */
const WEDDING_TRACKS=[]; /* licensed files in public/music/wedding, e.g. {id:'mehendi',name:'Mehendi Laga Ke',by:'Licensed',src:'/music/wedding/mehendi.mp3'} */
let wbSong={busy:false,pct:0,local:'',dur:0,probed:''},wbListen='',wbAudio=null,wbListenTimer=0;
const fmtSec=v=>{const n=Math.max(0,Math.round(Number(v)||0));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');};
function wbSongKey(d=draft){if(d.music!=='custom')return d.music||'none';const t=WEDDING_TRACKS.find(x=>d.musicSrc===location.origin+x.src);return t?'t:'+t.id:'own';}
function wbMusicHTML(d=draft){
 const cur=wbSongKey(d),own=cur==='own';
 if(own&&!wbSong.dur&&d.musicSrc&&wbSong.probed!==d.musicSrc){wbSong.probed=d.musicSrc;const a=new Audio();a.preload='metadata';a.addEventListener('loadedmetadata',()=>{wbSong.dur=a.duration||0;renderMusicCard();},{once:true});a.src=d.musicSrc;}
 const opt=(key,title,sub)=>`<button type="button" class="wb-song${cur===key?' is-on':''}" data-wb="song" data-key="${key}" aria-pressed="${cur===key}"><span class="wb-song-ico" aria-hidden="true">${key==='none'?'✕':wbListen===key?'❚❚':'▶'}</span><span class="wb-song-txt"><b>${title}</b><small>${sub}</small></span></button>`;
 return `<div class="wb-card" id="wbMusic"><h3 class="wb-step"><span>5</span>Music <small>Starts when a guest breaks the seal. Tap to listen.</small></h3>
  <div class="wb-songs">${opt('shehnai','Shehnai','Raag Yaman · traditional')}${opt('baraat','Baraat band','Brass & dhol · festive')}${opt('sitar','Sitar evening','Soft · elegant')}${WEDDING_TRACKS.map(t=>opt('t:'+e(t.id),e(t.name),e(t.by||'Licensed track'))).join('')}${opt('none','No music','A silent invite')}</div>
  <label class="wb-upload${own?' is-on':''}"><input type="file" id="wbSongFile" accept="audio/*,.mp3,.m4a,.aac,.ogg,.wav" hidden><span class="wb-song-ico" aria-hidden="true">♫</span><span class="wb-song-txt"><b>${own?e(d.musicName||'Your song'):'Upload your own song'}</b><small>${wbSong.busy?`Uploading… ${wbSong.pct}%`:own?'Tap to change · MP3 or M4A, up to 12 MB':'Your favourite Hindi wedding song · MP3 or M4A, up to 12 MB'}</small></span></label>
  ${own?`<div class="wb-trim"><label for="wbSongStart"><small>Start from <output id="wbStartOut">${fmtSec(d.musicStart)}</output></small></label><input type="range" id="wbSongStart" min="0" max="${Math.max(30,Math.floor((wbSong.dur||600)-10))}" step="1" value="${Math.round(Number(d.musicStart)||0)}"><button type="button" class="wb-mini" data-wb="listen" ${wbSong.busy&&!wbSong.local?'disabled':''}>${wbListen==='own'?'❚❚ Stop':'▶ Listen'}</button></div><p class="wb-help">Skip the slow intro and start at the part everyone sings along to. Use a song you have the right to share.</p>`:''}</div>`;
}
function renderMusicCard(){const c=$('#wbMusic');if(c)c.outerHTML=wbMusicHTML();}
function wbStopListen(){clearTimeout(wbListenTimer);if(wbAudio){wbAudio.pause();wbAudio.removeAttribute('src');wbAudio=null;}if(RAGAS.includes(wbListen))stopMusic();wbListen='';}
function wbPlay(key){
 const was=wbListen;wbStopListen();if(was===key||key==='none')return;
 if(RAGAS.includes(key)){if(soundMuted){toast('Sound is off. Turn it on to listen.');return;}stopMusic();startRaga(key);}
 else{const t=WEDDING_TRACKS.find(x=>'t:'+x.id===key),src=key==='own'?(wbSong.local||draft.musicSrc):t?location.origin+t.src:'';if(!src)return;
  const a=new Audio(src),from=key==='own'?Number(draft.musicStart)||0:0;wbAudio=a;a.volume=.7;
  a.addEventListener('loadedmetadata',()=>{if(key==='own'&&a.duration)wbSong.dur=a.duration;if(from&&a.duration>from)a.currentTime=from;},{once:true});
  a.play().catch(()=>{if(wbAudio===a){toast('This song could not play in this browser.');wbStopListen();renderMusicCard();}});}
 wbListen=key;wbListenTimer=setTimeout(()=>{wbStopListen();renderMusicCard();},20000);
}
const SONG_TYPES={mp3:'audio/mpeg',m4a:'audio/mp4',aac:'audio/aac',ogg:'audio/ogg',wav:'audio/wav'};
async function uploadWeddingSong(file){
 if(!file||wbSong.busy)return;
 const type=String(file.type||SONG_TYPES[(file.name.split('.').pop()||'').toLowerCase()]||'').toLowerCase();
 if(!type.startsWith('audio/')){toast('Choose a song file, like an MP3 or M4A.');return;}
 if(file.size>12*1024*1024){toast('That song is over 12 MB. An MP3 of it will fit.');return;}
 wbStopListen();const d=draft,prev={music:d.music,musicSrc:d.musicSrc,musicName:d.musicName,musicStart:d.musicStart};
 if(wbSong.local)URL.revokeObjectURL(wbSong.local);
 wbSong={busy:true,pct:0,local:URL.createObjectURL(file),dur:0,probed:''};
 const probe=new Audio();probe.preload='metadata';probe.addEventListener('loadedmetadata',()=>{wbSong.dur=probe.duration||0;renderMusicCard();},{once:true});probe.src=wbSong.local;
 Object.assign(d,{music:'custom',musicSrc:'',musicName:cleanText(file.name.replace(/\.[a-z0-9]+$/i,''),100),musicStart:0});renderMusicCard();
 try{
  const owner=pendingOwner();
  if(owner){
   const r=await api('/api/gifts/'+owner.id+'/media',{method:'POST',key:owner.key,body:{kind:'song',type,size:file.size}});
   await new Promise((ok,fail)=>{const x=new XMLHttpRequest();x.open('PUT',r.uploadUrl);x.setRequestHeader('content-type',type);x.setRequestHeader('x-upsert','false');
    x.upload.onprogress=ev=>{if(!ev.lengthComputable)return;wbSong.pct=Math.round(ev.loaded/ev.total*100);const el=$('#wbMusic .wb-upload small');if(el)el.textContent=`Uploading… ${wbSong.pct}%`;};
    x.onload=()=>x.status<300?ok():fail(new Error('upload'));x.onerror=()=>fail(new Error('upload'));x.send(file);});
   d.musicSrc=r.url;
  }else if(file.size<=3*1024*1024)d.musicSrc=await readDataURL(file);
  else throw new Error('big');
  toast('Your song is in. Now pick where it starts. 🎶');
 }catch(err){Object.assign(d,prev);toast(err.message==='big'?'That song is too big to keep on this device. Try one under 3 MB.':'That song could not upload. Check your connection and try again.');}
 finally{wbSong.busy=false;wbSong.pct=0;saveDraft();renderMusicCard();scheduleWeddingPreview();const f=$('#wbSongFile');if(f)f.value='';}
}
function renderWeddingBuilder(){
 const box=$('#weddingBuilder');if(!box)return;
 const det=wbPhotos||$('#photosDetail');if(det&&box.contains(det))det.remove();
 box.innerHTML=weddingBuilderHTML();
 const slot=$('#wbPhotosSlot');if(det&&slot){wbPhotos=det;slot.append(det);det.open=true;}
 scheduleWeddingPreview(0);updateWeddingDock();
}
function mountWeddingBuilder(){
 const view=$('#creatorView'),form=$('#giftForm');if(!view||!form)return;
 const on=wedOn();view.classList.toggle('is-wedding',on);
 let box=$('#weddingBuilder');
 if(!on){
  if(box)box.hidden=true;$('#wbPreview')?.setAttribute('hidden','');
  const det=wbPhotos;if(det&&wbPhotosHome&&!wbPhotosHome.parent.contains(det))wbPhotosHome.parent.insertBefore(det,wbPhotosHome.next&&wbPhotosHome.next.parentElement===wbPhotosHome.parent?wbPhotosHome.next:null);
  return;
 }
 if(!wbPhotosHome){const det=$('#photosDetail');if(det)wbPhotosHome={parent:det.parentElement,next:det.nextSibling};}
 if(!box){form.insertAdjacentHTML('afterbegin','<section class="wb" id="weddingBuilder" aria-label="Your wedding invite"></section>');box=$('#weddingBuilder');wireWeddingBuilder(box);}
 box.hidden=false;
 let pv=$('#wbPreview');const aside=$('.preview-aside');
 if(!pv&&aside){aside.insertAdjacentHTML('afterbegin','<div class="wb-preview" id="wbPreview"><p class="eyebrow">What your guests see</p><div class="wb-phone"><div class="wb-screen" id="wbScreen"></div></div><button type="button" class="btn btn-secondary wb-play" data-wb="play">▶ Play the whole invite</button></div>');pv=$('#wbPreview');pv.addEventListener('click',ev=>{if(ev.target.closest('[data-wb=play]'))previewGift();});}
 pv?.removeAttribute('hidden');
 renderWeddingBuilder();
 document.fonts?.load('40px "Great Vibes"').then(()=>scheduleWeddingPreview(0)).catch(()=>{});
}
function scheduleWeddingPreview(ms=140){
 clearTimeout(wbPreviewTimer);wbPreviewTimer=setTimeout(()=>{const sc=$('#wbScreen');if(!sc)return;const g=sanitizeGift({...draft,occasion:'wedding'},false);sc.innerHTML=weddingPageHTML({k:'names'},g,0,1).replace('class="wp-page','class="wp-page is-on wp-static');},ms);
}
function updateWeddingDock(){
 const couple=[draft.name,draft.partner].map(v=>String(v||'').trim()).filter(Boolean).join(' & ');
 if($('#dockNote'))$('#dockNote').textContent=couple?'Wedding invite · '+couple:'Your names, the date and the venue. That’s it.';
 const shown=$('#wbShown');if(shown){const l=draft.groomFirst?['Groom','Bride']:['Bride','Groom'];shown.textContent=(String(draft.name||'').trim()||l[0])+' weds '+(String(draft.partner||'').trim()||l[1]);}
 $('#dockPreview')&&($('#dockPreview').hidden=!String(draft.name||'').trim());
 const pr=$('#wbPrice');if(pr){const t=paymentsRequired?priceText():'';pr.hidden=!t;if(t)pr.innerHTML=`Making and previewing are free. You pay <strong>${e(t)}</strong> once, when you’re ready to send it to your guests.`;}
}
function wireWeddingBuilder(box){
 box.addEventListener('input',ev=>{
  if(pickSong(ev))return;
  const t=ev.target,d=draft,w=ensureWeddingEvent(d);
  if(t.id==='wbName1'){d.name=t.value;const r=$('#recipientName');if(r)r.value=t.value;}
  else if(t.id==='wbName2')d.partner=t.value;
  else if(t.id==='wbDate'){
   const old=d.weddingDate||'',now=validStoryDateAny(t.value);d.weddingDate=now;
   for(const x of d.events){
    const off=W_FUNCS[Object.keys(W_FUNCS).find(k=>k.toLowerCase()===String(x.title||'').trim().toLowerCase())]?.off;
    if(x===w){if(!x.date||x.date===old)x.date=now;continue;}
    if(now&&off!==undefined&&(!x.date||(old&&x.date===addDaysYmd(old,off))))x.date=addDaysYmd(now,off);
   }
   refreshWeddingSummaries();
  }
  else if(t.id==='wbTime'){w.time=/^\d{2}:\d{2}$/.test(t.value)?t.value:'';refreshWeddingSummaries();}
  else if(t.id==='wbVenue'){const old=w.venue||'';for(const x of d.events)if(x===w||!x.venue||x.venue===old)x.venue=t.value;d.city=cityOf(t.value);refreshWeddingSummaries();}
  else if(t.id==='wbMap'){const old=w.map||'',v=t.value.trim();for(const x of d.events)if(x===w||!x.map||x.map===old)x.map=v;}
  else if(t.id==='wbFamilies')d.families=t.value;
  else if(t.id==='wbFam1'||t.id==='wbFam2'){d[t.id==='wbFam1'?'family1':'family2']=t.value;const h=$('#wbHosts'),x=hostsOf(d);if(h)h.innerHTML=x?`The envelope reads <b>${e(x)} ${/ family$/.test(x)?'invites':'invite'} you</b>`:'Add surnames and the envelope reads <b>The Sharma &amp; Verma families invite you</b>';}
  else if(t.id==='wbTag'){const v=t.value.replace(/\s+/g,'');d.hashtag=v&&!v.startsWith('#')?'#'+v:v;}
  else if(t.id==='wbNote')d.message=t.value;
  else if(t.id==='wbSongStart'){d.musicStart=Math.round(+t.value)||0;const o=$('#wbStartOut');if(o)o.textContent=fmtSec(d.musicStart);if(wbAudio&&wbListen==='own')wbAudio.currentTime=d.musicStart;}
  else if(t.dataset.wbe){const x=d.events[+t.dataset.i];if(!x)return;const k=t.dataset.wbe;x[k]=k==='date'?validStoryDateAny(t.value):k==='time'?(/^\d{2}:\d{2}$/.test(t.value)?t.value:''):t.value;refreshWeddingSummaries();
   if(k==='title'){const b=t.closest('.wb-ev')?.querySelector('.wb-ev-text b');if(b)b.textContent=t.value.trim()||'New function';}}
  else return;
  if(t.id==='wbName1'||t.id==='wbName2'){const ideas=$('#wbTagIdeas');if(ideas)ideas.innerHTML=hashtagIdeas().map(x=>`<button type="button" class="wb-chip${d.hashtag===x?' is-on':''}" data-wb="tag" data-text="${e(x)}">${e(x)}</button>`).join('');}
  $('#wbError').hidden=true;saveDraft();updateWeddingDock();scheduleWeddingPreview();
 });
 /* a picked song arrives on input (before change), and stays inside the maker so nothing re-renders the picker under it */
 const pickSong=ev=>{if(ev.target.id!=='wbSongFile')return false;ev.stopPropagation();const f=ev.target.files?.[0];if(f)uploadWeddingSong(f);return true;};
 box.addEventListener('change',pickSong);
 box.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-wb]');if(!b||b.disabled)return;ev.preventDefault();
  const d=draft,act=b.dataset.wb,i=+b.dataset.i;
  if(act==='song'||act==='listen'){
   const key=act==='listen'?'own':b.dataset.key;
   if(act==='song'&&wbSong.busy)return;
   if(act==='song'){const t=WEDDING_TRACKS.find(x=>'t:'+x.id===key);Object.assign(d,t?{music:'custom',musicSrc:location.origin+t.src,musicName:t.name,musicStart:0}:{music:key,musicSrc:'',musicName:'',musicStart:0});}
   wbPlay(key);saveDraft();renderMusicCard();return;
  }
  if(act==='swap'){[d.name,d.partner]=[d.partner||'',d.name||''];[d.family1,d.family2]=[d.family2||'',d.family1||''];d.groomFirst=!d.groomFirst;const r=$('#recipientName');if(r)r.value=d.name;}
  else if(act==='add'){const title=b.dataset.title;const at=title?d.events.findIndex(x=>String(x.title||'').trim().toLowerCase()===title.toLowerCase()):-1;
   if(at>=0){wbOpen.has(at)?wbOpen.delete(at):wbOpen.add(at);}
   else{if(d.events.length>=8){toast('Up to eight functions.');return;}d.events.push(title?defaultEvent(title):{...defaultEvent('Other'),title:'',dress:''});if(!title)wbOpen.add(d.events.length-1);buzz(8);}}
  else if(act==='remove'){d.events.splice(i,1);wbOpen=new Set([...wbOpen].filter(k=>k!==i).map(k=>k>i?k-1:k));}
  else if(act==='edit'){wbOpen.has(i)?wbOpen.delete(i):wbOpen.add(i);}
  else if(act==='dress'){if(d.events[i])d.events[i].dress=b.dataset.text;}
  else if(act==='line')d.families=b.dataset.text;
  else if(act==='bless')d.blessing=b.dataset.key;
  else if(act==='tag')d.hashtag=b.dataset.text;
  else if(act==='note')d.message=b.dataset.text;
  else if(act==='play'){previewGift();return;}
  else return;
  saveDraft();renderWeddingBuilder();
  const focus=act==='add'&&!b.dataset.title?$(`.wb-ev.is-open [data-wbe="title"]`):null;focus?.focus();
 });
}
function refreshWeddingSummaries(){$$('[data-sum]').forEach(el=>{const x=draft.events[+el.dataset.sum];if(x)el.textContent=wbSummary(x);});}
/* Names and the date are all an invite needs; say which is missing, right where it goes. */
function weddingReady(){
 const d=draft,miss=wbSong.busy?['wbMusic','Your song is still uploading. One moment.']:!String(d.name||'').trim()?['wbName1','Add the first name.']:!String(d.partner||'').trim()?['wbName2','Add the second name.']:!validStoryDateAny(d.weddingDate)?['wbDate','Pick the wedding date.']:null;
 const err=$('#wbError');if(!miss){if(err)err.hidden=true;return true;}
 if(err){err.textContent=miss[1];err.hidden=false;}
 const f=$('#'+miss[0]);if(f){f.scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'center'});f.focus({preventScroll:true});f.classList.remove('wb-shake');void f.offsetWidth;f.classList.add('wb-shake');}
 return false;
}

/* ---- Personal invites: one link per guest, their name on the envelope. The list stays on this device. ---- */
const guestKey=()=>'kholona.guests.'+(publishedGift?.id||'');
const guestNames=()=>{let v='';try{v=localStorage.getItem(guestKey())||'';}catch{}return [...new Set(v.split('\n').map(n=>cleanText(n,60).trim()).filter(Boolean))].slice(0,500);};
function guestLink(name){if(!publishedURL)return '';const u=new URL(publishedURL);u.searchParams.set('to',name);return u.toString();}
function renderGuestLinks(){
 let box=$('#guestLinks');const show=publishedGift?.occasion==='wedding'&&!!publishedURL;
 if(!show){if(box)box.remove();return;}
 if(!box){$('.link-wrap').insertAdjacentHTML('afterend','<section class="guest-links" id="guestLinks" aria-labelledby="guestLinksTitle"></section>');box=$('#guestLinks');}
 const locked=!!publishedGift.server&&publishedStatus==='preview';box.hidden=locked;if(locked)return;
 let saved='';try{saved=localStorage.getItem(guestKey())||'';}catch{}
 box.innerHTML=`<h3 id="guestLinksTitle">Personal invites 💌</h3><p>Paste your guest list, one name per line. Each guest gets their own link with their name on the envelope.</p><label class="sr-only" for="guestList">Guest names, one per line</label><textarea class="text-area" id="guestList" rows="5" placeholder="Sharma family&#10;Riya &amp; Kabir&#10;Nani ji">${e(saved)}</textarea><button type="button" class="btn btn-primary" data-v3="guest-links">Make personal links</button><div id="guestLinkList"></div>`;
 if(saved)makeGuestLinks(false);
}
function makeGuestLinks(announce=true){
 const area=$('#guestList');if(!area)return;
 try{localStorage.setItem(guestKey(),area.value);}catch{}
 const names=guestNames(),list=$('#guestLinkList');
 if(!names.length){list.innerHTML='<p class="input-help">Add at least one name.</p>';return;}
 list.innerHTML=`<p class="guest-count">${names.length} personal invite${names.length===1?'':'s'}. Tap WhatsApp for each guest, or copy them all.</p><ol class="guest-list">${names.map(n=>`<li><span>${e(n)}</span><button type="button" class="guest-wa" data-v3="guest-wa" data-guest="${e(n)}" aria-label="Send ${e(n)} their invite on WhatsApp">WhatsApp</button><button type="button" class="guest-copy" data-v3="guest-copy" data-guest="${e(n)}" aria-label="Copy ${e(n)}’s invite">Copy</button></li>`).join('')}</ol><button type="button" class="btn btn-secondary" data-v3="guest-copy-all">Copy all links</button>`;
 if(announce){toast(names.length+' personal invite'+(names.length===1?'':'s')+' ready 💌');track('guest_links_made',{count:names.length});}
}
/* BOOT_V2 */
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
