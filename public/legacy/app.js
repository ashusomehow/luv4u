
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
  description:'A wish, a little cake, and their very own pocket-sized party.',
  whisper:'For their one-in-a-year kind of day.',
  title:'Who’s your<br><em>birthday person?</em>',intro:'A name is all you need. The rest is icing.',
  greeting:'Happy Birthday,',eyebrow:'Today is all about you',portrait:'TODAY IS ALL ABOUT',
  path:['Light up the room','Make a wish','Open a gift','All the birthday love'],
  fallback:'',finish:'',noteLabel:'A birthday note',extras:'A lovely note, cake, candles and celebration are already included.',
  detailTitle:'A little more birthday magic',share:'a little birthday world',cta:'Make a birthday wish',
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
  slug:'apology-card',label:'Apology card',short:'Apology',symbol:'❦',art:'olive',vibe:'Emotional',group:'care',
  description:'An honest note, a quieter moment, and space to be heard.',
  whisper:'Not a shortcut to forgiveness. A place to start.',
  title:'Who do you want<br><em>to reach out to?</em>',intro:'A name to begin. Honest words, at your pace. No pressure on theirs.',
  greeting:'A quiet note for',eyebrow:'With care. Without expectations.',portrait:'SOME WORDS, SAID WITH CARE',
  opening:'A quieter kind<br><em>of hello.</em>',welcome:'There are a few things I want to say with care. Read them when you’re ready. There is no rush, and no need to reply.',
  path:['A quiet little light','Unfold an honest note','A step forward, if added','Space, not expectations'],
  fallback:'{name}, I’m sorry. I know words on a screen cannot make things right on their own. I want to listen, take responsibility and do better.\n\nYou do not owe me a reply or forgiveness. Take the time and space you need.',
  finish:'There is nothing you need to do with this moment. No deadline, no expectation. Your time and your feelings are yours.',
  finalTitle:'A little space.<br><em>For whatever you feel.</em>',noteLabel:'An honest apology',extras:'A quiet opening, a considerate apology note and a pressure-free ending are already included.',
  detailTitle:'A small, honest step forward',share:'a quiet note for you',cta:'Write a thoughtful apology',
  seo:'Create a thoughtful apology card with editable words, an optional concrete next step, and space for the recipient to respond in their own time.'
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
const QUIET_REACTIONS=[['🤍','Received with care'],['🕊️','A little peace'],['🙏','Thank you for the words'],['💬','A conversation']];
let homeOccasion='love',journeyReply='',proposalAnswer='',openedNotes=new Set(),chapterIndex=0,occasionSwitchBusy=false;
let backendOccasions=['birthday'];
const occasionDrafts=new Map();

const emptyDraft = () => ({occasion:'birthday',proposalKind:'relationship',proposalQuestion:'',reasons:[],commitment:'',togetherSince:'',milestone:'',reunionMessage:'',name:'',vibe:'Cute',message:'',sender:'',photos:[],memories:[],voice:'',voiceName:'',music:'none',musicSrc:'',musicName:'',volume:.24,branch:true,motion:true,sharePreview:true,replyPhone:'',quizQuestion:'',quizAnswer:'',quizOptions:[],fun:'none',funMessage:'',finalMessage:'',finalUrl:''});
let draft=emptyDraft(), currentView='home', publishedGift=null, publishedURL='', previewReturn='creator', gift=null, scenes=[], sceneIndex=0, transitionBusy=false, experienceToken=0, saveTimer, toastTimer, localStorageOkay=true, photoBusy=false;
let micStream=null, micFrame=null, micTimeout=null, mediaRecorder=null, recordedChunks=[], recordInterval=null, recordingSeconds=0, recordingGeneration=0;
let musicAudio=null, audioContext=null, masterGain=null, melodyTimer=null, melodyVoices=[], soundMuted=false, musicDucked=false, scratchCleanup=null, confettiFrame=null, voiceWasMusicPlaying=false, activeAudioNodes=new Set();
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
 x.music=['none','musicbox','dreamy','custom'].includes(d.music)?d.music:'none';x.musicSrc=safeMedia(d.musicSrc,'audio');x.musicName=cleanText(d.musicName,100);
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
 $('#headerRight').innerHTML=view==='home'?'<a href="#how-it-works" class="nav-link nav-how">How it works</a><button class="nav-link pill-link" data-action="create">Make a gift '+icon('up')+'</button>':'<span class="header-note">A little love goes a long way.</span><span style="color:#c59b9e;font-size:19px" aria-hidden="true">♡</span>';
 document.title=SERVER_TITLE;
 $('meta[name="theme-color"]').content='#faf7f2';
 window.scrollTo(0,0);
}
function goHome(){clearGiftHash();resetLanding();showView('home');}
function updatePreviewV1() {
 const name=draft.name.trim();$('#previewName').textContent=name?name+'.':'your person.';
 $('#previewLiveTag').textContent=name?`${name}'s birthday world is ready`:'Their birthday world is almost ready';
 $('#dockNote').textContent=name?`A whole little birthday for ${name}.`:'A name. That\'s all the magic needs.';
 const accents={Romantic:'#a45164',Cute:'#ac6272',Funny:'#ac804e',Emotional:'#928085',Crazy:'#b77759',Elegant:'#9b8759'};
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
function cakeSVG(id='cake'){
 return `<svg viewBox="0 0 300 270" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="${id}-body" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#d9a4a8"/><stop offset=".45" stop-color="#f3c7c5"/><stop offset="1" stop-color="#d39aa2"/></linearGradient><linearGradient id="${id}-icing" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff9e9"/><stop offset="1" stop-color="#f4e2ca"/></linearGradient><linearGradient id="${id}-stand" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#c2a77d"/><stop offset=".5" stop-color="#ebd3aa"/><stop offset="1" stop-color="#bfa178"/></linearGradient><radialGradient id="${id}-glow"><stop stop-color="#ffdf94" stop-opacity=".7"/><stop offset="1" stop-color="#ffe7a0" stop-opacity="0"/></radialGradient></defs><ellipse cx="150" cy="255" rx="99" ry="10" fill="#97694b" opacity=".055"/><path d="M140 218v20q-4 9-32 11v5h85v-5q-30-2-34-11v-20" fill="url(#${id}-stand)"/><ellipse cx="150" cy="218" rx="112" ry="15" fill="#dfc8a6"/><ellipse cx="150" cy="213" rx="112" ry="15" fill="#f8edda"/><ellipse cx="150" cy="211" rx="98" ry="13" fill="#cdaa862e"/><path d="M62 143v54c0 24 176 24 176 0v-54Z" fill="url(#${id}-body)"/><ellipse cx="150" cy="196" rx="88" ry="20" fill="#d0949d" opacity=".32"/><path d="M62 144v20c4 10 12 10 17 0v-3c0-9 10-9 10 0v11c0 11 13 11 13 0v-2c0-10 11-10 11 0v9c0 11 13 11 13 0v-7c0-10 12-10 12 0v12c0 12 15 12 15 0v-9c0-11 11-11 11 0v7c0 10 13 10 13 0v-15c0-9 11-9 11 0v7c0 9 12 9 12 0v-13c0-8 10-8 10 0v6c0 8 13 8 13-2v-9c0-8 8-8 9 0l6 1v-16Z" fill="url(#${id}-icing)"/><ellipse cx="150" cy="143" rx="88" ry="25" fill="#fff5df"/><ellipse cx="150" cy="142" rx="78" ry="19" fill="#f6e7d0"/><ellipse cx="150" cy="141" rx="71" ry="15" fill="#fff6e5"/>${[[82,148],[100,158],[121,164],[145,166],[170,164],[193,158],[214,151]].map(([x,y])=>`<path d="M${x-5} ${y}q-1-5 3-6 3-6 6 0 5 3 0 6Z" fill="#fff9e9" stroke="#e5d1b3" stroke-width=".4"/>`).join('')}<path d="M84 194q64 21 131 1" fill="none" stroke="#fae0d2" stroke-width="1.5" opacity=".5"/><g fill="#bc7c89" opacity=".8">${[[83,181],[113,197],[143,193],[177,199],[205,185]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.7"/>`).join('')}</g>${[[116,91,137],[151,79,138],[185,91,137]].map(([x,top,bottom],i)=>`<g><rect x="${x-4}" y="${top}" width="8" height="${bottom-top}" rx="2" fill="${i===1?'#c6b894':'#e2a6ab'}"/><path d="M${x-4} ${top+9}l8-5m-8 17 8-5m-8 17 8-5m-8 17 8-5" stroke="#fff5df" stroke-width="2.6"/><ellipse cx="${x}" cy="${top}" rx="4" ry="1.6" fill="#fff4da"/><path d="M${x} ${top-1}v-5" stroke="#735d4a" stroke-width="1.2"/><g class="flame" style="transform-origin:${x}px ${top-6}px;animation-delay:${i*.4}s"><circle cx="${x}" cy="${top-14}" r="26" fill="url(#${id}-glow)"/><path d="M${x} ${top-28}c-1 7-9 11-6 18 2 6 11 5 12 0 2-6-5-11-6-18Z" fill="#edba6c"/><path d="M${x} ${top-20}c-4 5-5 12 0 13 5-1 4-8 0-13Z" fill="#fff6cf"/></g><path class="cake-smoke" d="M${x} ${top-7}q-9-9 0-17t-2-18" stroke-width="1.2"/></g>`).join('')}</svg>`;
}
function giftSVG(id='gift'){
 return `<svg viewBox="0 0 260 255" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="${id}-box" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#dcb3ad"/><stop offset="1" stop-color="#c99598"/></linearGradient><linearGradient id="${id}-ribbon" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#ede0c4"/><stop offset=".5" stop-color="#fff0d1"/><stop offset="1" stop-color="#e4cdb0"/></linearGradient></defs><ellipse cx="130" cy="237" rx="96" ry="11" fill="#94664b" opacity=".06"/><g class="gift-rays" stroke="#bc9563" stroke-width="1.3" stroke-linecap="round"><path d="m47 77-12-9m78-33-3-17m78 45 13-9m-2 55 18-2M71 44l-6-9m89 0 5-16"/><path d="m46 42 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#c9a46e" stroke="none"/></g><g class="gift-heart"><path d="M131 91c-8-17-36-16-38 4-3 23 38 43 38 43s42-23 39-45c-3-18-29-19-39-2Z" fill="#b77486"/><path d="M106 88q-6 0-8 7" stroke="#e9bbc4" stroke-width="3" fill="none" stroke-linecap="round"/></g><path d="M49 124h164v94q0 13-13 13H61q-12 0-12-12Z" fill="url(#${id}-box)"/><path d="M49 126h164v9H49Z" fill="#b77d87" opacity=".22"/><path d="M115 129h30v102h-30Z" fill="url(#${id}-ribbon)"/><g fill="#fff2e6" opacity=".37">${[[68,151],[91,176],[67,204],[175,151],[192,184],[173,215]].map(([x,y])=>`<path d="m${x} ${y-3} 1 2 3 1-3 1-1 3-1-3-3-1 3-1Z"/>`).join('')}</g><g class="gift-lid"><rect x="40" y="106" width="181" height="29" rx="5" fill="#ddb5b1"/><path d="M42 110h177" stroke="#f3d3c6" stroke-width="2" opacity=".6"/><path d="M113 106h34v29h-34Z" fill="url(#${id}-ribbon)"/><path d="M131 107C67 103 67 59 87 58c22-1 43 49 44 49Z" fill="#ecd9bd" stroke="#d8b89f" stroke-width="1.2"/><path d="M124 102C96 95 80 70 87 65c9-5 26 19 37 37Z" fill="#c4a285" opacity=".32"/><path d="M131 107c66-5 65-49 45-50-22-1-44 50-45 50Z" fill="#f5e6cb" stroke="#d8b89f" stroke-width="1.2"/><path d="M138 101c27-6 44-32 37-36-9-5-25 18-37 36Z" fill="#c4a285" opacity=".25"/><path d="M128 106c-10 12-20 16-29 39l17-5 11 8 8-41" fill="#f6e6c9"/><path d="M136 105c12 13 18 24 25 33l5-15 13 3c-16-13-27-16-35-23" fill="#efdbbb"/><ellipse cx="132" cy="103" rx="11" ry="8" fill="#f5e4c8" stroke="#d8b89f" stroke-width=".6"/></g></svg>`;
}
function fairySVG(id='fairy',live=false){
 const pos=Array.from({length:17},(_,i)=>{const x=16+i*61;return {x,y:20+62*Math.sin(Math.PI*x/1020),len:13+(i%3)*7};});
 return `<svg viewBox="0 0 1060 155" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true"><defs><radialGradient id="${id}-g"><stop stop-color="#ffdf9d" stop-opacity=".6"/><stop offset=".45" stop-color="#ffe3a8" stop-opacity=".19"/><stop offset="1" stop-color="#ffe1a0" stop-opacity="0"/></radialGradient></defs><path d="M-15 17Q520 164 1080 13" fill="none" stroke="#a58c69" stroke-width="1.15" opacity=".62"/>${pos.map((p,i)=>`<g class="${live?'live-bulb':'bulb-glow'}" style="--delay:${.15+i*.105}s"><path d="M${p.x} ${p.y}v${p.len}" stroke="#a18868" stroke-width="1"/><circle cx="${p.x}" cy="${p.y+p.len+5}" r="22" fill="url(#${id}-g)"/><rect x="${p.x-2.5}" y="${p.y+p.len-2}" width="5" height="5" rx="1" fill="#ad9370"/><ellipse cx="${p.x}" cy="${p.y+p.len+5}" rx="4" ry="6" fill="#fff0bd"/><ellipse cx="${p.x-1}" cy="${p.y+p.len+4}" rx="1.3" ry="3" fill="#fffbea"/></g>`).join('')}</svg>`;
}
function balloonSVG(id='balloon'){
 return `<svg viewBox="0 0 150 380" width="100%" height="100%" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="${id}-b" cx="32%" cy="25%" r="75%"><stop stop-color="#fff2e2" stop-opacity=".5"/><stop offset="1" stop-color="#895b62" stop-opacity=".04"/></radialGradient></defs><path d="M72 169c39 71-33 101 5 199" fill="none" stroke="#a8947c" stroke-width=".85"/><path d="m72 163-5 9h11Z" class="balloon-fill" fill="#d8abb6"/><ellipse cx="73" cy="92" rx="57" ry="73" class="balloon-fill" fill="#d8abb6"/><ellipse cx="73" cy="92" rx="57" ry="73" fill="url(#${id}-b)"/><path d="M43 48q-13 14-13 31" fill="none" stroke="#fff9ef" stroke-width="6" opacity=".42" stroke-linecap="round"/><path d="m84 182-21-8 6 15 7-11 4 15Z" fill="#e3ceb4" opacity=".8"/></svg>`;
}
function portraitSVG(id){
 return `<svg viewBox="0 0 440 530" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="${id}-wall" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#efddd0"/><stop offset=".55" stop-color="#f3ddd7"/><stop offset="1" stop-color="#eacfbe"/></linearGradient><radialGradient id="${id}-glow"><stop stop-color="#fff4d2" stop-opacity=".85"/><stop offset="1" stop-color="#ffe5b7" stop-opacity="0"/></radialGradient><linearGradient id="${id}-pink" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eed0d1"/><stop offset="1" stop-color="#cf9ca9"/></linearGradient><linearGradient id="${id}-gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f5e7c7"/><stop offset="1" stop-color="#d7bd95"/></linearGradient><linearGradient id="${id}-sage" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e8e5d3"/><stop offset="1" stop-color="#bfc4ab"/></linearGradient></defs><rect width="440" height="530" fill="url(#${id}-wall)"/><ellipse cx="218" cy="132" rx="250" ry="244" fill="url(#${id}-glow)"/><path d="M26 530V221C26-13 414-13 414 221v309" fill="none" stroke="#d4b6a2" stroke-width="1" opacity=".4"/><path d="M36 530V224C36 0 404 0 404 224v306" fill="none" stroke="#fff2de" stroke-width="1" opacity=".48"/><path d="M0 421h440v109H0Z" fill="#daba9f" opacity=".18"/><path d="M0 422h440M0 426h440" stroke="#bfa78e" stroke-width=".7" opacity=".3"/>${[45,95,145,195,245,295,345,395].map(x=>`<path d="M${x} 428v102" stroke="#bfa78e" stroke-width=".6" opacity=".16"/>`).join('')}<path d="M-8 79Q220 201 450 76" fill="none" stroke="#a78c68" stroke-width=".85"/>${Array.from({length:13},(_,i)=>{let x=-3+i*37;let y=80+62*Math.sin(Math.PI*(x+3)/450);return `<g class="bulb-glow"><path d="M${x} ${y}v${11+(i%3)*4}" stroke="#a58a69" stroke-width=".7"/><circle cx="${x}" cy="${y+19}" r="18" fill="url(#${id}-glow)"/><ellipse cx="${x}" cy="${y+19}" rx="3.2" ry="4.5" fill="#fff7da"/><rect x="${x-2}" y="${y+12}" width="4" height="4" rx="1" fill="#ad9570"/></g>`}).join('')}<path d="M-9 168Q78 198 126 177M314 177q58 23 137-11" stroke="#c3a78d" stroke-width=".9" fill="none"/><g fill="#d0a4a1" opacity=".65"><path d="m5 172 23 6-17 25Zm36 9 23 3-13 22Zm36 3 21-1-7 23Z"/><path d="m335 183 22 0-10 24Zm37-2 23-4-7 25Zm36-7 24-6-3 27Z"/></g><g class="svg-balloon"><path d="M58 321q-26 58 9 109" fill="none" stroke="#a8947b" stroke-width=".8"/><ellipse cx="56" cy="271" rx="31" ry="45" fill="url(#${id}-pink)"/><path d="m56 315-4 7h8Z" fill="#c898a6"/><path d="M40 244q-8 9-8 19" stroke="#fff7ee" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/></g><g class="svg-balloon"><path d="M88 341q12 25-8 70" fill="none" stroke="#ae9b7c" stroke-width=".7"/><ellipse cx="87" cy="305" rx="25" ry="37" fill="url(#${id}-gold)"/><path d="m87 340-4 6h8Z" fill="#d1b790"/><path d="M73 282q-5 6-6 16" stroke="#fffdf0" stroke-width="2.8" fill="none" opacity=".55" stroke-linecap="round"/></g><g class="svg-balloon"><path d="M382 307q22 60-11 124" fill="none" stroke="#a8947b" stroke-width=".8"/><ellipse cx="380" cy="261" rx="32" ry="47" fill="url(#${id}-gold)"/><path d="m380 306-4 7h8Z" fill="#d1b58a"/><path d="M361 232q-9 10-8 23" stroke="#fffdf0" stroke-width="3.5" fill="none" opacity=".7" stroke-linecap="round"/></g><g class="svg-balloon"><path d="M345 349q-20 30-2 72" fill="none" stroke="#a6947b" stroke-width=".7"/><ellipse cx="345" cy="314" rx="25" ry="36" fill="url(#${id}-sage)"/><path d="m345 348-4 7h8Z" fill="#b8bea3"/><path d="M331 291q-6 6-6 15" stroke="#fffdf0" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/></g><ellipse cx="220" cy="492" rx="165" ry="19" fill="#b58a6e" opacity=".075"/><g transform="translate(54 433) rotate(-5)"><rect x="0" y="15" width="55" height="45" rx="3" fill="#c5c6ae"/><rect x="-3" y="11" width="61" height="13" rx="2" fill="#d6d4bb"/><path d="M22 12h9v48h-9Z" fill="#f7e9d1"/><path d="M27 13C7 12 10-8 16-7c8 0 11 20 11 20Zm0 0c23-1 20-20 13-20-8 0-13 20-13 20Z" fill="none" stroke="#eddfc3" stroke-width="4"/></g><g transform="translate(316 419) rotate(6)"><rect x="0" y="18" width="61" height="61" rx="3" fill="#d0a0a6"/><rect x="-4" y="13" width="69" height="16" rx="3" fill="#deb6b9"/><path d="M26 14h10v65H26Z" fill="#f1e3c7"/><path d="M31 14C5 13 12-8 19-7c9 1 12 21 12 21Zm0 0C55 13 53-9 46-8c-8 1-15 22-15 22Z" fill="none" stroke="#eadabe" stroke-width="4"/></g><g stroke="#ba9267" stroke-width="1" fill="none" opacity=".7"><path d="m126 251 2-7 2 7 7 2-7 2-2 7-2-7-7-2Zm180 65 2-6 2 6 6 2-6 2-2 6-2-6-6-2ZM280 203v9m-4-5h8"/></g><g fill="#aa7c65" opacity=".3"><circle cx="117" cy="334" r="1.1"/><circle cx="290" cy="236" r="1.1"/><circle cx="158" cy="207" r="1"/><circle cx="286" cy="342" r="1"/><circle cx="110" cy="396" r="1.1"/></g><path d="M121 462q14-5 11-16t10-10m125 45q13-4 9-13t9-11" fill="none" stroke="#d1a68d" stroke-width="1.4" opacity=".6"/><path d="m289 497 9 3m-157-2 7-3m237-25 5-5m-254-29-5-4" stroke="#b99577" stroke-width="1.3" opacity=".5"/></svg>`;
}

function renderMemoryListV1(){
 $('#memoryList').innerHTML=draft.memories.map((m,i)=>`<div class="memory-edit"><label class="field-label" for="memoryWhen${i}">Little memory ${i+1}</label><button type="button" class="remove-btn" data-remove-memory="${i}" aria-label="Remove memory ${i+1}">${icon('x')}</button><input class="text-input" id="memoryWhen${i}" data-memory-when="${i}" maxlength="40" placeholder="When was it? (optional)" value="${e(m.when)}" aria-label="When memory ${i+1} happened"><textarea class="text-area" id="memoryText${i}" data-memory-text="${i}" maxlength="200" aria-label="Memory ${i+1}" placeholder="That time we got completely lost and somehow found the best little café…">${e(m.text)}</textarea></div>`).join('');updatePreview();
}
function readDataURL(file){return new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=()=>reject(new Error('This file could not be read.'));fr.readAsDataURL(file);});}
async function compressPhoto(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose a JPG, PNG or WebP photo.');
 if(file.size>15*1024*1024)throw new Error('That photo is a little big. Please choose one under 15 MB.');
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
 try{for(const file of list){try{const src=await compressPhoto(file);draft.photos.push({src,caption:''});added++;renderPhotoList();}catch(err){toast(err.message);}}}finally{photoBusy=false;$('#photoUpload').value='';saveDraft();if(added)toast(`${added===1?'A lovely photo':'Your lovely photos'}, tucked inside. You can frame and reorder them below.`);}
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
function startMusicV1(){
 stopMusic();if(!gift||soundMuted||gift.music==='none')return;
 if(gift.music==='custom'&&gift.musicSrc){musicAudio=new Audio(gift.musicSrc);musicAudio.loop=true;musicAudio.volume=musicDucked?.07:.24;musicAudio.preload='none';musicAudio.addEventListener('error',()=>{if(currentView==='experience')toast("The soundtrack couldn't load. The little magic is still here.");},{once:true});musicAudio.play().catch(()=>{if(currentView==='experience')toast('Tap the sound button to try the soundtrack.');});return;}
 if(!ensureAudio())return;
 const melody=gift.music==='dreamy'?[523.25,0,783.99,659.25,0,587.33,440,0,523.25,659.25,0,783.99,698.46,0,587.33,0]:[659.25,783.99,1046.5,0,987.77,783.99,659.25,0,587.33,659.25,783.99,0,659.25,523.25,587.33,0];
 let note=0;const play=()=>{if(soundMuted||document.hidden)return;const frequency=melody[note++%melody.length];if(frequency){const vol=(gift.volume??.24)/.24*(musicDucked?.016:.065);tone(frequency*THEMES[gift.vibe].transpose,0,2.1,vol,'sine',true);tone(frequency*2*THEMES[gift.vibe].transpose,.012,1.05,vol*.13,'sine',true);if(note%4===1)tone(frequency/2*THEMES[gift.vibe].transpose,0,2.6,vol*.65,'sine',true);}};
 play();melodyTimer=setInterval(play,(gift.music==='dreamy'?1000:720)*THEMES[gift.vibe].speed);
}
function stopMusic(){clearInterval(melodyTimer);melodyTimer=null;if(musicAudio){musicAudio.pause();musicAudio.removeAttribute('src');musicAudio.load();musicAudio=null;}for(const {osc} of melodyVoices){try{osc.stop();}catch{}}melodyVoices=[];}
function updateSoundControl(){const b=$('#soundToggle');if(!b)return;b.innerHTML=icon(soundMuted?'muted':'volume');b.setAttribute('aria-label',soundMuted?'Turn sound on':'Turn sound off');b.setAttribute('aria-pressed',String(!soundMuted));b.title=soundMuted?'A little sound?':'Keep it quiet';}
function toggleSound(){
 soundMuted=!soundMuted;ensureAudio();if(masterGain)masterGain.gain.setValueAtTime(soundMuted?0:.28,audioContext.currentTime);if(soundMuted)stopMusic();else{if($('#experience').classList.contains('lit'))startMusic();chime();}updateSoundControl();try{localStorage.setItem('luv4u.muted',String(soundMuted));}catch{}
}

/* Confetti: little paper pieces, no flashing or recurring animation. */
function confetti(count=100,origin=null){
 if(reducedMotion||(currentView==='experience'&&gift&&(gift.motion===false||gift.occasion==='apology')))return;
 const canvas=$('#confettiCanvas'),ctx=canvas.getContext('2d');if(!ctx)return;cancelAnimationFrame(confettiFrame);canvas.hidden=false;
 const w=window.innerWidth,h=window.innerHeight,dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
 const colors=['#c78792','#dec4a0','#b4bba0','#f1d4b2','#b47582','#e0b6bc'];
 const particles=Array.from({length:Math.min(count,130)},()=>({x:origin?origin.x:w/2+(Math.random()-.5)*w*.55,y:origin?origin.y:-20-Math.random()*h*.45,vx:origin?(Math.random()-.5)*8:(Math.random()-.5)*3,vy:origin?-3-Math.random()*5:1.6+Math.random()*2.6,size:3+Math.random()*5,rotation:Math.random()*Math.PI,spin:(Math.random()-.5)*.12,color:colors[Math.floor(Math.random()*colors.length)],heart:Math.random()>.88,life:1}));
 const started=performance.now();let last=started;
 function frame(now){const dt=Math.min((now-last)/16.67,2);last=now;ctx.clearRect(0,0,w,h);let alive=0;for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.035*dt;p.rotation+=p.spin*dt;p.vx*=.998;p.life=Math.max(0,1-(now-started-2200)/1900);if(p.y<h+20&&p.life>0){alive++;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rotation);ctx.fillStyle=p.color;ctx.globalAlpha=p.life*.9;if(p.heart){ctx.beginPath();ctx.moveTo(0,p.size*.55);ctx.bezierCurveTo(-p.size*1.5,-p.size*.4,-p.size*.5,-p.size*1.2,0,-p.size*.45);ctx.bezierCurveTo(p.size*.5,-p.size*1.2,p.size*1.5,-p.size*.4,0,p.size*.55);ctx.fill();}else{ctx.fillRect(-p.size/2,-p.size/3,p.size,p.size*.58);}ctx.restore();}}if(alive&&now-started<4600)confettiFrame=requestAnimationFrame(frame);else{canvas.hidden=true;ctx.clearRect(0,0,w,h);confettiFrame=null;}}
 confettiFrame=requestAnimationFrame(frame);
}

let isPreview=false, previewScrollY=0, micGeneration=0, blowSource=null;
function storyButton(text='A little more magic',action='next'){return `<button class="btn story-btn" data-story="${action}">${e(text)} ${icon('arrow')}</button>`;}
function sceneTitle(title,eyebrow=''){return `${eyebrow?`<div class="story-eyebrow">${eyebrow}</div>`:''}<h1 class="story-title" tabindex="-1">${title}</h1>`;}
function startExperienceV1(data,options={}){
 cleanupExperience();gift=sanitizeGift(data);if(!gift.id)gift.id='preview';isPreview=!!options.preview;previewReturn=options.returnView||'creator';experienceToken++;transitionBusy=false;sceneIndex=0;reaction='';replySharedText='';journeyReply='';proposalAnswer='';openedNotes=new Set();chapterIndex=0;musicDucked=false;
 try{soundMuted=localStorage.getItem('luv4u.muted')==='true';}catch{soundMuted=false;}
 if(masterGain)masterGain.gain.setValueAtTime(soundMuted?0:.28,audioContext.currentTime);
 scenes=buildScenes(gift);
 for(const id of ['homeView','creatorView','shareView','errorView'])$('#'+id).hidden=true;
 $('#siteHeader').hidden=true;const exp=$('#experience');exp.hidden=false;exp.className='experience'+(isPreview?' preview-mode':'');exp.dataset.vibe=gift.vibe;exp.dataset.occasion=gift.occasion;exp.setAttribute('aria-label','Your '+occasionOf(gift).label.toLowerCase()+' surprise');
 exp.innerHTML=`<div class="room-warmth"></div><div class="room-decor" aria-hidden="true"><div class="room-wall"></div><div class="room-arch"></div><div class="room-side-balloon left">${balloonSVG('story-left')}</div><div class="room-side-balloon right">${balloonSVG('story-right')}</div><div class="room-floor-stars">${[[14,23,17],[83,19,13],[10,71,15],[90,73,20],[22,87,12],[78,88,12]].map(([x,y,s],i)=>`<span class="room-star" style="left:${x}%;top:${y}%;font-size:${s}px;animation-delay:${i*.6}s">✧</span>`).join('')}${Array.from({length:12},(_,i)=>`<span class="floating-dust" style="left:${9+i*7.2}%;top:${30+(i%5)*13}%;animation-delay:${-i*.8}s"></span>`).join('')}</div></div><div class="room-lights">${fairySVG('story-fairy',true)}</div><div class="room-vignette"></div><span class="experience-brand" aria-label="Luv4u">luv4u<span style="font-size:10px;vertical-align:top;position:relative;top:4px;left:3px">♡</span></span>${isPreview?'<div class="preview-banner"><span>A PEEK AT THEIR SURPRISE</span><button data-story="exit-preview">Back to editing</button></div>':''}<div class="experience-topright"><button class="round-control" id="soundToggle" data-story="sound" aria-label="Turn sound off"></button></div><div class="story-scroll" id="storyScroll"><div class="story-scene" id="storyScene"></div></div><div class="story-bottom" id="storyProgress" aria-hidden="true"></div><p class="sr-only" id="storyAnnouncement" aria-live="polite"></p>`;
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
 if(transitionBusy||index<0||index>=scenes.length)return;transitionBusy=true;const token=experienceToken;stopBlowing();if(scratchCleanup){scratchCleanup();scratchCleanup=null;}const voice=$('#recipientVoice');if(voice)voice.pause();duckMusic(false);const scene=$('#storyScene');scene.classList.add('leaving');await sleep(360);if(token!==experienceToken)return;sceneIndex=index;renderScene();transitionBusy=false;
}
function renderSceneV1(){
 const type=scenes[sceneIndex],s=$('#storyScene'),name=e(gift.name);s.className='story-scene '+type+'-scene';popCount=0;scratchDone=false;
 const markup={
 opening:()=>`<span class="opening-star a" aria-hidden="true">✧</span><span class="opening-star b" aria-hidden="true">✦</span><span class="opening-star c" aria-hidden="true">✧</span>${sceneTitle('Some things are better<br>with the <em>lights on.</em>','A little surprise is waiting')}<p class="story-description">Someone put a little love into this moment.<br>And it's all for you.</p><button class="light-trigger" data-story="light" id="lightTrigger"><span class="switch-orb">${icon('bulb')}</span><span>Click to light up ✨</span></button><div class="opening-bottom">Go on. This little world is yours.</div>`,
 birthday:()=>`<svg class="birthday-garland" viewBox="0 0 180 50" fill="none" aria-hidden="true"><path d="M6 14q85 50 169 0" stroke="#b69473" stroke-width=".9"/><path d="m20 20 18 8-15 15 0-12Zm34 13 18 4-9 16-4-13Zm35 5 18-1-8 17-5-12Zm35-5 17-5 0 21-7-11Zm32-10 14-7 4 19-11-8Z" fill="#c395a0" opacity=".66"/></svg>${sceneTitle(`Happy Birthday,<span class="name-line${gift.name.length>18?' long-name':''}"><em>${name}.</em></span>`,'Today is all about you')}<div class="birthday-heart" aria-hidden="true">♡</div><p class="story-description">Of all the days, this one's a little more special.<br>Because it gave the world you.</p>${storyButton('First, make a wish')}`,
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
 const gradient=ctx.createLinearGradient(0,0,w,h);gradient.addColorStop(0,'#e2ceb0');gradient.addColorStop(.5,'#d5b996');gradient.addColorStop(1,'#eadbc0');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);ctx.fillStyle='#fff7e72e';
 for(let i=0;i<90;i++){const x=(i*67.33)%w,y=(i*43.13)%h;ctx.beginPath();ctx.arc(x,y,.5+(i%3)*.35,0,Math.PI*2);ctx.fill();}
 ctx.strokeStyle='#ab8d6533';ctx.lineWidth=1;ctx.strokeRect(12,12,w-24,h-24);ctx.fillStyle='#96774f';ctx.textAlign='center';ctx.font='26px Georgia';ctx.fillText('A little secret…',w/2,h/2-4);ctx.font='10px "Segoe UI", sans-serif';ctx.fillStyle='#a48761';ctx.fillText('WAITING JUST FOR YOU',w/2,h/2+24);
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
function selectReaction(value,play=true){if(![...GENERIC_REACTIONS,...QUIET_REACTIONS].some(r=>r[0]===value))return;reaction=value;replySharedText='';if($('#replyResult'))$('#replyResult').innerHTML='';$$('.reaction-btn').forEach(b=>{const selected=b.dataset.reaction===value;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});if(play)chime('pop');}
function prepareReplyV1(){
 const text=$('#recipientReply').value.trim();if(!reaction&&!text){toast('Pick a little feeling, or write a few words. Either one is lovely.');return;}
 let saved=false;try{localStorage.setItem('luv4u.reply.'+gift.id,JSON.stringify({reaction,text,at:new Date().toISOString()}));saved=true;}catch{}
 replySharedText=`A little reply from ${gift.name} ${reaction||'♡'}\n\n${text||(gift.occasion==='apology'?'I’ve read your note.':gift.occasion==='proposal'?'I’ve seen your little question.':'Thank you for making this little moment for me.')}`;
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

/* ───────── Luv4u v2: the story builder, tiny rooms and real gift delivery ───────── */
const THEMES = {
 Romantic:{symbol:'♡',caption:'Candlelight & a little butterflies',line:'Some people feel like coming home.',motifs:['♡','❦','✧','❀'],speed:1.15,transpose:.89,opening:'Someone saved a little<br><em>light for you.</em>',birthday:'My favorite reason to celebrate.',cake:'A wish for you.<br><em>And a thousand more with you.</em>',cakeNote:'Close your eyes. I’ll keep this little light for you.',gift:'Some things are small.<br><em>The love isn’t.</em>',ending:'Of all the days in the year, I’m really glad this one gave us you.',finalTitle:'Always, a little<br><em>more you.</em>'},
 Cute:{symbol:'✿',caption:'Soft balloons & happy little things',line:'A pocket-sized party. An enormous hug.',motifs:['✿','♡','✧','◌'],speed:.9,transpose:1.06,opening:'A tiny party is hiding<br><em>in the dark.</em>',birthday:'Your very own pocket-sized party.',cake:'One little cake.<br><em>One enormous wish.</em>',cakeNote:'Eyes closed. Cheeks puffed. Big birthday energy.',gift:'Special delivery.<br><em>Handle with hugs.</em>',ending:'Here’s a pocketful of sunshine, a ridiculous amount of cake, and all the hugs you can carry.',finalTitle:'The happiest birthday,<br><em>lovely you.</em>'},
 Funny:{symbol:'☺',caption:'A wonky cake & excellent nonsense',line:'Another year older. Still not a grown-up.',motifs:['☺','✶','~','✧'],speed:.85,transpose:.79,opening:'We forgot one thing.<br><em>The electricity.</em>',birthday:'Congratulations on surviving another orbit.',cake:'Your age? Classified.<br><em>Your cake? Enormous.</em>',cakeNote:'Make a wish. “More cake” is a completely valid answer.',gift:'Definitely not socks.<br><em>Probably.</em>',ending:'May your cake be bigger than your responsibilities. And may nobody sing the awkward second verse.',finalTitle:'Older. Wiser?<br><em>Still iconic.</em>'},
 Emotional:{symbol:'☁',caption:'Quiet words & memories held close',line:'You matter more than you’ll ever know.',motifs:['☾','✧','♡','⋆'],speed:1.25,transpose:.75,opening:'Take a little breath.<br><em>This moment is yours.</em>',birthday:'I’m so glad you exist.',cake:'For every quiet dream.<br><em>Make a wish.</em>',cakeNote:'The little wishes count, too. Especially those.',gift:'A few pieces of us.<br><em>Held close.</em>',ending:'May this next chapter be gentle with your heart. You deserve so much of the love you give away.',finalTitle:'The world is softer<br><em>with you in it.</em>'},
 Crazy:{symbol:'✷',caption:'Confetti, plot twists & zero chill',line:'Birthday rules? Absolutely not.',motifs:['✷','↝','✦','!'],speed:.7,transpose:1.19,opening:'The party is loading.<br><em>You’re the main event.</em>',birthday:'A certified legend was born today.',cake:'Make a wish.<br><em>Make it ridiculous.</em>',cakeNote:'World domination? A pet dragon? We’re not judging.',gift:'Warning: contains<br><em>birthday chaos.</em>',ending:'More wild stories. More terrible dancing. More “we actually did that” moments. Go be gloriously you.',finalTitle:'Maximum cake.<br><em>Minimum chill.</em>'},
 Elegant:{symbol:'✧',caption:'Champagne details & quiet joy',line:'A beautiful day, made more beautiful by you.',motifs:['✧','❦','·','✦'],speed:1.15,transpose:.84,opening:'A moment, set aside<br><em>just for you.</em>',birthday:'A beautiful reason to pause and celebrate.',cake:'A candle.<br><em>A beautiful possibility.</em>',cakeNote:'For the things you hope for. And the joys you haven’t met yet.',gift:'Thoughtfully chosen.<br><em>Entirely yours.</em>',ending:'To a year of meaningful moments, quiet joys, and wonderful things unfolding in their own time.',finalTitle:'To your next<br><em>beautiful chapter.</em>'}
};
let reelTimer=0,mediaBase='',paymentsRequired=false,publishedStatus='paid',payPrice=0,payLinkDays=365,publishedExpiresAt='',wizardStep=0,backendReady=false,backendChecked=false,delivery='portable',editing=null,publishing=false,previewAudio=null,previewMelody=null,previewGain=null,lightStage=0,tiltEnabled=true,tiltHandler=null,finaleTimer=null,libraryCache=[],coverData='',draftDB=null,saveGeneration=0,cropContext=null,publishAttempt=null;
const LIBRARY_KEY='luv4u.library.v2';
const hexToken=n=>{const bytes=new Uint8Array(n);crypto.getRandomValues(bytes);return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');};
const clamp=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):fallback;
function sanitizeGift(d,needName=true){const x=sanitizeGiftV1(d,needName);x.version=3;x.server=d.server===true;x.volume=clamp(d.volume,0,.65,.24);x.branch=d.branch!==false;x.motion=d.motion!==false;x.sharePreview=d.sharePreview!==false;x.replyPhone=cleanText(d.replyPhone,18).replace(/\D/g,'');x.fun=['none','balloons','scratch','quiz','gifts'].includes(d.fun)?d.fun:'none';x.quizQuestion=cleanText(d.quizQuestion,140);x.quizAnswer=cleanText(d.quizAnswer,80);x.quizOptions=(Array.isArray(d.quizOptions)?d.quizOptions:[]).slice(0,3).map(v=>cleanText(v,80));x.photos=x.photos.map((p,i)=>({...p,x:clamp(d.photos[i]?.x,0,100,50),y:clamp(d.photos[i]?.y,0,100,50),zoom:clamp(d.photos[i]?.zoom,1,2,1)}));x.occasion=Object.hasOwn(OCCASIONS,d.occasion)?d.occasion:'birthday';
 if(x.occasion==='proposal'){x.proposalKind=Object.hasOwn(PROPOSAL_QUESTIONS,d.proposalKind)?d.proposalKind:'relationship';x.proposalQuestion=cleanText(d.proposalQuestion,140);}
 if(['love','thanks'].includes(x.occasion))x.reasons=(Array.isArray(d.reasons)?d.reasons:[]).slice(0,3).map(v=>cleanText(v,160));
 if(x.occasion==='apology'){x.commitment=cleanText(d.commitment,300);x.fun='none';x.branch=false;if(!['Emotional','Elegant'].includes(x.vibe))x.vibe='Emotional';}
 if(x.occasion==='anniversary')x.togetherSince=validStoryDate(d.togetherSince);
 if(x.occasion==='congratulations')x.milestone=cleanText(d.milestone,80);
 if(x.occasion==='missyou')x.reunionMessage=cleanText(d.reunionMessage,200);
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
async function api(path,options={}){const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),options.timeout||45000);try{const r=await fetch(path,{method:options.method||'GET',headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(options.key?{Authorization:'Bearer '+options.key}:{})},body:options.body?JSON.stringify(options.body):undefined,signal:controller.signal,cache:'no-store',credentials:'omit'});let data;try{data=await r.json();}catch{throw new Error('The gift server returned an unexpected response. Your draft is still safe.');}if(!r.ok){const err=new Error(data.error||'The gift could not be saved.');err.status=r.status;throw err;}return data;}catch(err){if(err.name==='AbortError')throw new Error('The gift server is taking too long. Try again; your draft is still here.');throw err;}finally{clearTimeout(timeout);}}
async function checkBackend(){if(!['http:','https:'].includes(location.protocol)){backendChecked=true;return;}try{const c=await api('/api/config',{timeout:2500});backendReady=c.product==='luv4u'&&[2,3].includes(c.version)&&c.hosted;backendOccasions=Array.isArray(c.occasions)?c.occasions:['birthday'];mediaBase=typeof c.mediaBase==='string'?c.mediaBase:'';paymentsRequired=backendReady&&c.payments?.required===true;payPrice=paymentsRequired?Number(c.payments.priceInr)||0:0;paySimulated=paymentsRequired&&c.payments.simulated===true;payLinkDays=Number(c.payments?.linkDays)||365;updatePaymentsUI();}catch{}backendChecked=true;delivery=backendReady?'hosted':'portable';updateDelivery();}
function clearGiftHash(){try{const p=/^\/(g|for)\//.test(location.pathname)?'/':location.pathname;history.replaceState(null,'',p+location.search);}catch{}}
function showView(view){if($('.skip-link'))$('.skip-link').hidden=view!=='home';stopPreviewAudio();showViewV1(view);updateResumeBanner();$('#myGiftsView').hidden=view!=='library';if(view==='library')$('#myGiftsView').hidden=false;const right=$('#headerRight');if(!right.querySelector('.my-gifts-link'))right.insertAdjacentHTML('afterbegin','<button class="nav-link my-gifts-link" data-v2="library">My little gifts</button>');if(view==='creator')setStep(wizardStep,false);if(view==='library'){document.title='Your little gifts · Luv4u';right.innerHTML='<button class="nav-link pill-link" data-action="create">Make another little gift ♡</button>';}}
async function openCreator(key='birthday'){
 if(occasionSwitchBusy||publishing)return;occasionSwitchBusy=true;
 try{
  key=Object.hasOwn(OCCASIONS,key)?key:'birthday';stopPreviewAudio();
  const old=JSON.parse(JSON.stringify(draft));clearTimeout(saveTimer);saveGeneration++;occasionDrafts.set(occasionKey(old),old);
  await store('draft:'+occasionKey(old),old).catch(()=>{try{localStorage.setItem('luv4u.draft.'+occasionKey(old),JSON.stringify(old));}catch{}});
  if(key!==occasionKey(draft)){
   let saved=occasionDrafts.get(key);if(!saved)try{saved=await store('draft:'+key);}catch{}
   if(!saved)try{saved=JSON.parse(localStorage.getItem('luv4u.draft.'+key)||'null');}catch{}
   draft=saved?sanitizeGift(saved,false):{...emptyDraft(),occasion:key,vibe:OCCASIONS[key].vibe};
  }
  clearGiftHash();try{history.replaceState(null,'',location.pathname+location.search+'#make='+key);}catch{}
  editing=null;publishAttempt=null;await removeStored('pending-create').catch(()=>{});
  wizardStep=0;populateForm();showView('creator');setStep(0,true);saveDraft();
 }finally{occasionSwitchBusy=false;}
}
/* Three steps: 1 name + mood, 2 words + photos (all optional), 3 preview + get the link. */
const STEP_COUNT=3;
let noteOpenedOnce=false;
/* "Create" becomes "Save & continue" when the gift is unlocked afterwards. */
const createLabel=()=>editing?.mode==='hosted'?'Save gift changes '+icon('heart'):paymentsRequired?'Save & continue '+icon('arrow'):'Create My Gift '+icon('spark');
function setStep(step,focus=true){
 if(step>0&&!draft.name.trim())step=0;
 wizardStep=Math.max(0,Math.min(STEP_COUNT-1,step));
 $$('.wizard-panel').forEach((el,i)=>el.hidden=i!==wizardStep);
 $$('[data-wizard-step]').forEach((b,i)=>{b.setAttribute('aria-current',i===wizardStep?'step':'false');b.disabled=i>0&&!draft.name.trim();});
 const o=occasionOf(draft),birth=occasionKey(draft)==='birthday',last=wizardStep===STEP_COUNT-1;
 const titles=[
  [birth?'Who’s your<br><em>birthday person?</em>':o.title,birth?'A name is all you need. The rest is icing.':o.intro],
  ['Add a little<br><em>you.</em>','Your '+o.short.toLowerCase()+' is already complete. A note, a photo or your voice makes it yours.'],
  ['Take a look.<br><em>Then send it.</em>','See it the way they will, then get your link.']
 ];
 updateOccasionUI();
 $('.creator-head h1').innerHTML=titles[wizardStep][0];$('.creator-head>p').textContent=titles[wizardStep][1];
 $('#wizardBack').hidden=wizardStep===0;$('#wizardNext').hidden=last;
 $('#wizardNext').innerHTML=(wizardStep===0?'Next: your words':'Next: preview & send')+' '+icon('arrow');
 /* One way forward per step: the full-screen preview is what step 3 is for, so it only appears there. */
 $('#createGiftBtn').hidden=!last;$('#createGiftBtn').innerHTML=createLabel();
 $('#dockPreview').hidden=!draft.name.trim()||!last;
 $('#wizardNext').classList.add('wizard-next');
 if(last){renderReview();updatePriceLine();}
 updateMiniPreview();
 /* The note is the heart of the gift: open it the first time someone reaches this step. */
 if(wizardStep===1&&!noteOpenedOnce){noteOpenedOnce=true;for(const id of ['noteDetail','photosDetail']){const d=$('#'+id);if(d)d.open=true;}}
 if(wizardStep===1)renderMediaStatus();
 if(focus&&currentView==='creator'){window.scrollTo({top:0,behavior:reducedMotion?'auto':'smooth'});const target=wizardStep===0?$('#recipientName'):$('.creator-head h1');target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}
}
function advanceWizard(){if(!draft.name.trim()){setStep(0,false);validateForm();return;}stopPreviewAudio();if(wizardStep===1)askAboutMedia(()=>setStep(2));else setStep(wizardStep+1);}
/* Photos and a voice note change how a gift feels more than anything else, and they sit in folded sections that are easy to miss.
   So leaving step 2 with neither asks once, and leaving them out is a choice the person makes. */
let mediaDecided=false,statusTimer=0;
function askAboutMedia(proceed){
 if(mediaDecided||draft.photos.length||draft.voice){proceed();return;}
 const previous=document.activeElement,root=$('#modalRoot'),name=e(draft.name.trim()||'them');
 root.innerHTML=`<div class="modal-backdrop"><section class="modal media-ask" role="dialog" aria-modal="true" aria-labelledby="mediaTitle"><h2 id="mediaTitle">Add something only you have?</h2><p>A photo or your own voice is what makes ${name} stop and smile. Right now this gift is words only.</p><div class="media-ask-actions"><button type="button" class="btn btn-primary" id="askPhotos">Add a photo</button><button type="button" class="btn btn-secondary" id="askVoice">Add a voice note</button></div><button type="button" class="media-skip" id="askSkip">Continue with words only</button></section></div>`;
 const close=()=>{root.innerHTML='';document.removeEventListener('keydown',trap);previous?.focus?.();};
 const trap=ev=>{if(ev.key==='Escape')close();if(ev.key==='Tab'){const bs=$$('button',root),first=bs[0],last=bs[bs.length-1];if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus();}else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus();}}};
 document.addEventListener('keydown',trap);
 $('#askPhotos').onclick=()=>{close();chooseTouches('photosDetail');setTimeout(()=>$('#photoUpload')?.focus({preventScroll:true}),300);};
 $('#askVoice').onclick=()=>{close();chooseTouches('voiceDetail');};
 $('#askSkip').onclick=()=>{mediaDecided=true;close();proceed();};
 $('#askPhotos').focus();
}
/* A plain status on each of the three "make it yours" sections, so nothing is hidden behind a fold without saying so. */
function renderMediaStatus(){
 const rows=[['noteDetail',draft.message.trim()?'Written':'We’ll add a note',!!draft.message.trim()],['photosDetail',draft.photos.length?draft.photos.length+(draft.photos.length===1?' photo':' photos'):'Not added yet',!!draft.photos.length],['voiceDetail',draft.voice?'Added':'Not added yet',!!draft.voice]];
 for(const [id,text,done] of rows){const summary=$('#'+id+' summary');if(!summary)continue;let tag=$('.detail-status',summary);if(!tag){tag=document.createElement('span');tag.className='detail-status';summary.insertBefore(tag,$('.detail-chevron',summary));}tag.textContent=(done?'✓ ':'')+text;tag.classList.toggle('done',done);}
}
for(const type of ['input','change','click'])document.addEventListener(type,()=>{clearTimeout(statusTimer);statusTimer=setTimeout(()=>{if($('#photosDetail'))renderMediaStatus();},120);});
function touchCount(){return [!!draft.message.trim(),!!draft.photos.length,draft.memories.some(m=>m.text.trim()),!!draft.voice,draft.music!=='none',draft.fun!=='none',!!(draft.finalMessage.trim()||draft.finalUrl),occasionHasExtras()].filter(Boolean).length;}
/* Opens (and scrolls to) one of the optional sections, also opening the "More" group when it lives there. */
function chooseTouches(detailId){
 setStep(1,false);refreshMessageTemplates();
 const target=document.getElementById(detailId||'noteDetail');
 if(target){const group=target.closest('#moreTouches');if(group)group.open=true;target.open=true;target.querySelector('summary').focus({preventScroll:true});target.scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'});}
}
function skipTouches(){if(wizardStep!==1)return;stopPreviewAudio();setStep(2);}
/* Compact live card on the words & photos step; phones only (desktop has the side preview). Kept off step 1 so the name field never jumps while typing. */
function updateMiniPreview(){
 const box=$('#miniPreview');if(!box)return;
 const name=draft.name.trim(),o=occasionOf(draft),photo=draft.photos[0];
 box.hidden=!name||currentView!=='creator'||wizardStep!==1;
 if(box.hidden)return;
 const note=draft.message.trim();
 box.innerHTML=`<span class="mini-art" aria-hidden="true">${photo?`<img src="${e(photo.src)}" alt="" style="${cropStyle(photo)}" referrerpolicy="no-referrer">`:e(o.symbol)}</span><span class="mini-copy"><strong>${e(o.short)} for ${e(name)}</strong><span>${e(note?note.slice(0,70)+(note.length>70?'…':''):draft.vibe+' mood · a ready-made note is tucked in')}</span></span>`;
}

function validateForm(){if(!draft.name.trim())setStep(0,false);for(const id of ['voiceUrl','musicUrl','finalUrl']){const input=$('#'+id);if(input.value.trim()&&!safeWebURL(input.value)){setStep(1,false);}}return validateFormV1();}
function updatePreview(){updatePreviewV1();if(!$('#wizardNext'))return;$('#wizardNext').classList.toggle('is-ready',!!draft.name.trim());$('#vibePreviewLine').textContent=occasionKey(draft)==='birthday'?THEMES[draft.vibe].line:'';$('#editorRoom').dataset.vibe=draft.vibe;$('#editorRoom').style.filter=draft.vibe==='Elegant'?'saturate(.55)':draft.vibe==='Crazy'?'saturate(1.15)':'';$$('[data-wizard-step]').forEach((b,i)=>b.disabled=i>0&&!draft.name.trim());$('#quizFields').hidden=draft.fun!=='quiz';if(wizardStep===2&&currentView==='creator')renderReview();updateMiniPreview();updateOccasionUI();}
function populateForm(){populateFormV1();if(!$('#musicVolume'))return;$('#musicVolume').value=Math.round((draft.volume??.24)*100);$('#volumeReadout').textContent=Math.round((draft.volume??.24)*100)+'%';$('#replyPhone').value=draft.replyPhone||'';$('#branchToggle').checked=draft.branch!==false;$('#motionToggle').checked=draft.motion!==false;$('#sharePreviewToggle').checked=draft.sharePreview!==false;$('#quizQuestion').value=draft.quizQuestion||'';$('#quizAnswer').value=draft.quizAnswer||'';for(let i=0;i<2;i++)$('#quizDecoy'+i).value=draft.quizOptions?.[i]||'';updateOccasionUI();renderOccasionDetails(true);installMessageTemplates();refreshMessageTemplates();updateDelivery();}
function updateDelivery(){if(!$('#deliverySelect'))return;$('#deliverySelect').closest('.quiet-field').hidden=paymentsRequired;$('#hostedOption').disabled=!backendReady;$('#deliverySelect').value=editing?.mode==='hosted'?'hosted':delivery;$('#deliverySelect').disabled=editing?.mode==='hosted';$('#expiryField').hidden=(editing?.mode==='hosted'?'hosted':delivery)!=='hosted'||paymentsRequired;$('#deliveryStatus').hidden=backendReady;$('#deliveryStatus').classList.toggle('offline',!backendReady);$('#deliveryStatus').textContent=backendReady?'':'Short links are not available right now, so your gift will be a file or a long link you can send.';$('#backendPublishNote').textContent=delivery==='hosted'?'Photos and audio are uploaded when you create your gift. Anyone with the link can open it.':'Large media gifts are shared as a downloadable HTML file. Short, text-only gifts can travel in a link.';}
function renderReview(){renderOccasionReview();}
function installWizard(){
 if($('#giftForm').dataset.v2Installed==='true'){ $('#vibeGrid').innerHTML=VIBES.map(v=>`<button type="button" class="vibe-btn" data-vibe="${v.name}" aria-pressed="false"><span class="vibe-icon" aria-hidden="true">${v.symbol}</span><strong>${v.name}</strong><span class="vibe-caption">${THEMES[v.name].caption}</span></button>`).join(''); return; }
 const form=$('#giftForm'),sections=$$('.form-section',form);const nav=document.createElement('nav');nav.className='wizard-steps';nav.setAttribute('aria-label','Birthday gift creation steps');nav.innerHTML=['Name & mood','Words & photos','Preview & send'].map((label,i)=>`${i?'<span class="step-rule" aria-hidden="true"></span>':''}<button type="button" data-wizard-step="${i}" aria-current="${i===0?'step':'false'}" aria-label="Step ${i+1} of 3: ${label}"><i aria-hidden="true">${i+1}</i>${label}</button>`).join('');$('.creator-head').before(nav);$('.creator-head').after(Object.assign(document.createElement('div'),{id:'miniPreview',className:'mini-preview',hidden:true}));
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
 panels[2].innerHTML=`<div id="reviewSummary"></div><p class="price-line" id="priceLine" hidden></p><details class="more-options" id="moreOptions"><summary><span>More options</span><span class="detail-chevron">${icon('chevron')}</span></summary><div class="more-options-body"><div class="quiet-field"><label class="field-label" for="deliverySelect">Link type</label><select id="deliverySelect"><option value="hosted" id="hostedOption" disabled>Short link (recommended)</option><option value="portable">Standalone: long link or downloadable file</option></select></div><div class="quiet-field" id="expiryField" hidden><label class="field-label" for="expiryDays">Keep the link live for</label><select id="expiryDays"><option value="0">No expiry</option><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="365">1 year</option></select><p class="privacy-small">After that the link stops working. Downloaded copies cannot be recalled.</p></div><label class="settings-line"><input type="checkbox" id="sharePreviewToggle" checked><span>Show their name in link previews<small>Previews and the downloadable artwork show the name, never private photos or messages.</small></span></label></div></details><div class="service-label offline" id="deliveryStatus" hidden></div><p class="backend-publish-note" id="backendPublishNote"></p>`;
 panels.forEach(p=>form.append(p));
 $('#vibeGrid').innerHTML=VIBES.map(v=>`<button type="button" class="vibe-btn" data-vibe="${v.name}" aria-pressed="${v.name===draft.vibe}"><span class="vibe-icon" aria-hidden="true">${v.symbol}</span><strong>${v.name}</strong><span class="vibe-caption">${THEMES[v.name].caption}</span></button>`).join('');
 $('.dock-buttons').innerHTML=`<button type="button" class="wizard-back" id="wizardBack" data-v2="wizard-back" hidden>← Back</button><button type="button" class="btn btn-secondary" id="dockPreview" data-action="preview" hidden>${icon('eye')} Preview</button><button type="button" class="btn btn-primary" id="wizardNext" data-v2="wizard-next">Next: your words ${icon('arrow')}</button><button type="button" class="btn btn-primary" id="createGiftBtn" data-action="publish" hidden>Create My Gift ${icon('spark')}</button>`;
 $('#musicDetail .detail-body').insertAdjacentHTML('beforeend',`<div class="audio-preview"><button type="button" class="btn btn-secondary btn-small" id="previewMusic" data-v2="preview-music">${icon('music')} Listen a little</button><label for="musicVolume">Volume <span id="volumeReadout">24%</span></label><input type="range" id="musicVolume" min="0" max="65" value="24" aria-label="Background music volume"></div>`);
 $('#moreOptions .more-options-body').insertAdjacentHTML('beforeend','<div class="field-gap"><label class="field-label" for="replyPhone">Get replies on WhatsApp <small>Optional</small></label><input class="text-input" type="tel" id="replyPhone" inputmode="tel" maxlength="18" placeholder="Country code + number, e.g. 919876543210"><p class="input-help">Their thank-you can then come straight to your WhatsApp. Your number becomes part of the gift link, so only add one you are happy to share.</p></div>');
 $('#funChoices').insertAdjacentHTML('beforeend','<button type="button" class="surprise-choice" data-fun="gifts" aria-pressed="false"><span>🎁</span>Pick a mystery gift</button>');
 $('#funDetail .detail-body').insertAdjacentHTML('beforeend','<div class="field-gap" id="quizFields" hidden><label class="field-label" for="quizQuestion">Your tiny question <small>Optional</small></label><input class="text-input" id="quizQuestion" maxlength="140" placeholder="Where did we first meet?"><div class="field-gap"><label class="field-label" for="quizAnswer">The right answer</label><input class="text-input" id="quizAnswer" maxlength="80" placeholder="That tiny coffee shop"></div><div class="field-gap"><label class="field-label" for="quizDecoy0">Two playful alternatives <small>Optional</small></label><input class="text-input" id="quizDecoy0" maxlength="80" placeholder="On the moon"><input class="text-input" id="quizDecoy1" maxlength="80" placeholder="In another lifetime" aria-label="Second playful quiz alternative" style="margin-top:8px"></div><p class="input-help">Leave this blank for a ready-made birthday question. Wrong guesses get a friendly hint, never a dead end.</p></div><label class="settings-line"><input type="checkbox" id="branchToggle" checked><span>Let them choose what to open first<small>A tiny choice between their gift and a note, or a trip down memory lane.</small></span></label><label class="settings-line"><input type="checkbox" id="motionToggle" checked><span>A little movement in their room<small>Gentle floating details. Device tilt is always opt-in.</small></span></label>');
 $('#shareView').insertAdjacentHTML('beforeend','<img class="share-cover" id="shareCover" alt="Shareable birthday artwork" hidden><div class="share-extra-actions"><button class="btn btn-secondary btn-small" id="nativeShareGift" data-v2="native-share">More apps ↗</button><button class="btn btn-secondary btn-small" data-v2="download-cover">Save this picture</button></div><p class="share-cover-note">This is the picture people see when you send the link.</p><div class="owner-note" id="ownerNote"></div>');
 $('#creatorView').insertAdjacentHTML('afterend','<main id="myGiftsView" class="view my-gifts-view" hidden><button class="back-link" data-action="home">← Back to the little magic</button><div class="eyebrow" style="margin-top:20px">Your little corner of the internet</div><h1>Gifts you’ve<br><em>put your heart into.</em></h1><p class="my-gifts-intro">No account needed. This browser remembers your gifts. Save each private recovery link to edit from another device. Keep those links just for you.</p><div id="savedGiftList"></div><button class="btn btn-primary" data-action="create">Make another little gift ♡</button></main>');
 document.body.insertAdjacentHTML('beforeend','<dialog class="crop-dialog" id="cropDialog" aria-labelledby="cropTitle"><h2 id="cropTitle">A little closer.</h2><p>Drag to frame your photo, or use the sliders. The original stays safely in your draft.</p><div class="crop-window" id="cropWindow"><img id="cropImage" alt="Photo crop preview" draggable="false"><span class="crop-guides" aria-hidden="true"></span></div><div class="crop-controls"><label>Left / right <input type="range" id="cropX" min="0" max="100" value="50"></label><label>Up / down <input type="range" id="cropY" min="0" max="100" value="50"></label><label>A little zoom <input type="range" id="cropZoom" min="1" max="2" step=".01" value="1"></label></div><div class="crop-actions"><button class="btn btn-secondary btn-small" data-v2="cancel-crop">Keep it as it was</button><button class="btn btn-primary btn-small" data-v2="save-crop">That’s the moment ♡</button></div></dialog>');
 // Copy is descriptive in both connected and standalone mode.
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
function stopPreviewAudio(){if(previewAudio){previewAudio.pause();previewAudio.src='';previewAudio=null;}if(previewMelody){clearInterval(previewMelody);previewMelody=null;}if(previewGain){try{previewGain.disconnect();}catch{}previewGain=null;}if($('#previewMusic'))$('#previewMusic').innerHTML=icon('music')+' Listen a little';}
function previewMusic(){if(previewAudio||previewMelody){stopPreviewAudio();return;}if(draft.music==='none'){toast('Choose a little soundtrack first.');return;}$('#voiceFileChip audio')?.pause();ensureAudio();if(audioContext?.state==='suspended')audioContext.resume().catch(()=>{});if(draft.music==='custom'){previewAudio=new Audio(draft.musicSrc);previewAudio.volume=draft.volume??.24;previewAudio.addEventListener('ended',stopPreviewAudio,{once:true});previewAudio.addEventListener('error',()=>{stopPreviewAudio();toast('That soundtrack could not load. Check the direct audio link.');},{once:true});previewAudio.play().catch(()=>{stopPreviewAudio();toast('Tap Listen again, or check the audio file.');});}else if(audioContext){previewGain=audioContext.createGain();previewGain.gain.value=(draft.volume??.24)*.2;previewGain.connect(audioContext.destination);let n=0;const notes=draft.music==='dreamy'?[523.25,783.99,659.25,587.33,440,523.25]:[659.25,783.99,1046.5,987.77,783.99,659.25];const play=()=>{if(!previewGain||document.hidden)return;const osc=audioContext.createOscillator(),gain=audioContext.createGain(),t=audioContext.currentTime;osc.frequency.value=notes[n++%notes.length]*THEMES[draft.vibe].transpose;gain.gain.setValueAtTime(.8,t);gain.gain.exponentialRampToValueAtTime(.001,t+1.7);osc.connect(gain);gain.connect(previewGain);osc.start();osc.stop(t+1.8);osc.onended=()=>{osc.disconnect();gain.disconnect();};};play();previewMelody=setInterval(play,draft.music==='dreamy'?1000:720);}
 $('#previewMusic').innerHTML=icon('music')+' That’s lovely. Stop';}
/* Single source of truth for the optional story beats. */
function buildScenes(g){
 const kind=occasionKey(g),content=g.vibe==='Emotional'?['memories','photos','message']:['message','photos','memories'];
 const core=content.filter(t=>t==='message'||t==='photos'&&g.photos.length||t==='memories'&&g.memories.some(m=>m.text.trim()));
 let list;
 if(kind==='birthday')list=['opening','birthday','cake',...(g.branch?['choice']:[]),'gift',...core];
 else if(kind==='apology')list=['opening','welcome','gift','message',...(g.commitment?.trim()?['accountability']:[]),...core.filter(t=>t!=='message')];
 else {const interaction={proposal:'gift',love:'hearts',anniversary:'storybook',thanks:'bouquet',congratulations:'ribbon',missyou:'distance'}[kind];list=['opening','welcome',interaction,...core];}
 if(g.voice)list.push('voice');if(g.fun!=='none'&&kind!=='apology')list.push('fun');
 if(kind==='missyou'&&g.reunionMessage?.trim())list.push('reunion');
 if(kind==='proposal')list.push('proposal');
 if(g.finalMessage.trim()||g.finalUrl)list.push('final');
 return [...list,'celebration','reply'];
}
function seeded(seed){let h=2166136261;for(const c of seed)h=Math.imul(h^c.charCodeAt(0),16777619);return()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function roomDetails(){const t={...THEMES[gift.vibe],motifs:gift.occasion==='birthday'?THEMES[gift.vibe].motifs:gift.occasion==='apology'?['❦','·','◌']:gift.occasion==='missyou'?['☾','✧','·']:gift.occasion==='thanks'?['✿','❦','·']:gift.occasion==='congratulations'?['✧','✦','·']:['♡','✧','❦']},rand=seeded(gift.id+gift.name+gift.vibe+gift.occasion),count=gift.vibe==='Elegant'?9:gift.vibe==='Crazy'?23:15;return `<div class="vibe-room-doodles" aria-hidden="true">${Array.from({length:count},(_,i)=>{const x=i%2?78+rand()*18:4+rand()*18;return `<span class="room-motif" style="--x:${x.toFixed(2)}%;--y:${(20+rand()*69).toFixed(2)}%;--size:${(11+rand()*18).toFixed(1)}px;--rotation:${(-25+rand()*50).toFixed(1)}deg;--delay:${(-rand()*9).toFixed(2)}s">${t.motifs[i%t.motifs.length]}</span>`;}).join('')}<i class="room-ribbon"></i><i class="room-ribbon right"></i></div>`;}
function startExperience(data,options={}){if($('.skip-link'))$('.skip-link').hidden=true;stopPreviewAudio();lightStage=0;tiltEnabled=true;startExperienceV1(data,options);$('#myGiftsView').hidden=true;$('#experience').classList.toggle('motion-off',!gift.motion);$('#experience').insertAdjacentHTML('afterbegin',roomDetails());if(isPreview&&previewReturn==='home')$('[data-story=exit-preview]').textContent='Back to the little gifts';if(!reducedMotion&&gift.motion){$('.experience-topright').insertAdjacentHTML('afterbegin','<button class="round-control tilt-toggle" data-v2="tilt" aria-label="Toggle gentle room tilt" aria-pressed="true" title="A little room movement">⌁</button>');enableTilt(true);}if(!options.skipSeal)mountSeal();if(!options.preview&&gift.server&&/^\/g\/[a-f0-9]{24}/.test(location.pathname))countOpening();}
/* The ritual before the first scene: a sealed envelope, opened by pressing and holding the wax seal. */
/* Anyone holding a gift link can report it without opening it (the report page takes the link). Only for real, hosted gifts. */
function reportLink(){return gift?.server&&!isPreview&&/^[a-f0-9]{24}$/.test(gift.id||'')?`<a class="report-link" href="/report?gift=${gift.id}">Didn’t expect this? Report it</a>`:'';}
function mountSeal(){
 const exp=$('#experience'),scroll=$('#storyScroll');if(!exp||!scroll)return;
 const name=e(gift.name),from=gift.sender?'<span class="seal-from">from '+e(gift.sender)+'</span>':'';
 exp.insertAdjacentHTML('beforeend',`<div class="seal-gate" id="sealGate" role="dialog" aria-modal="true" aria-label="A sealed gift for ${name}"><div class="seal-card"><p class="seal-kicker">Something is waiting</p><div class="seal-address"><span class="seal-to">For</span><span class="seal-name">${name}</span>${from}</div><div class="seal-stage"><div class="seal-envelope" aria-hidden="true"><div class="seal-letter"><span>♡</span></div><div class="seal-front"></div><div class="seal-flap"></div></div><button type="button" class="seal-btn" id="sealBtn" aria-label="Press and hold to break the seal and open the gift"><svg class="seal-ring" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" pathLength="100"/></svg><span class="seal-heart" aria-hidden="true">♡</span></button></div><p class="seal-hint" id="sealHint" aria-live="polite">Press and hold the seal</p><button type="button" class="seal-skip" id="sealSkip">Just open it</button>${reportLink()}</div></div>`);
 const gate=$('#sealGate'),btn=$('#sealBtn'),hint=$('#sealHint');scroll.inert=true;
 const hold=reducedMotion?1:1000;let raf=0,start=0,done=false;
 const open=()=>{
  if(done)return;done=true;cancelAnimationFrame(raf);gate.style.setProperty('--p',1);gate.classList.add('opening');hint.textContent='Opening…';
  ensureAudio();chime('wish');try{navigator.vibrate?.(35);}catch{}
  const finish=()=>{gate.remove();scroll.inert=false;$('#lightTrigger')?.focus({preventScroll:true});};
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
function cleanupExperience(){clearInterval(reelTimer);clearTimeout(finaleTimer);stopTilt();tiltEnabled=true;cleanupExperienceV1();}
function previewGift(){stopPreviewAudio();previewGiftV1();}
function renderScene(){renderSceneCore();updateUnlockTray();}
function renderSceneCore(){
 const type=scenes[sceneIndex],t=THEMES[gift.vibe];
 if(renderOccasionScene(type))return;
 if(type==='choice'){const s=$('#storyScene');s.className='story-scene choice-scene';const memoryFirst=gift.vibe==='Emotional'&&gift.memories.length; s.innerHTML=`${sceneTitle('Follow your<br><em>little curiosity.</em>','This bit is up to you')}<p class="story-description">Two little things, both yours.<br>Which one are we opening first?</p><div class="branch-choices"><button class="branch-choice" data-v2="choose-path" data-path="gift"><span>♧</span>The little gift<small>For the happily curious</small></button><button class="branch-choice" data-v2="choose-path" data-path="${memoryFirst?'memories':'message'}"><span>${memoryFirst?'☁':'♡'}</span>${memoryFirst?'A memory of us':'The words inside'}<small>For the sentimental heart</small></button></div><p class="story-footnote">No wrong turns. You won’t miss a thing.</p>`;$('#storyScroll').scrollTop=0;$('#storyProgress').innerHTML='';$('#storyAnnouncement').textContent='Choose what to open first. Both are waiting for you.';$('h1',s)?.focus({preventScroll:true});return;}
 renderSceneV1();const s=$('#storyScene');
 if(type==='opening'){$('.story-title',s).innerHTML=t.opening;$('.story-eyebrow',s).textContent='A little world. Just for '+gift.name+(gift.sender?', from '+gift.sender:'')+'.';s.insertAdjacentHTML('beforeend','<p class="lighting-caption" id="lightingCaption">First, a spark. Then, the whole little room.</p>');}
 if(type==='birthday'){$('.story-description',s).textContent=t.birthday;$('.birthday-heart',s).textContent=t.symbol;}
 if(type==='cake'){$('.story-title',s).innerHTML=t.cake;$('#cakeDescription').textContent=t.cakeNote;$('#birthdayCake').style.filter=gift.vibe==='Elegant'?'saturate(.35)':gift.vibe==='Funny'?'hue-rotate(24deg)':gift.vibe==='Crazy'?'saturate(1.2)':'none';}
 if(type==='gift'){$('.story-title',s).innerHTML=t.gift;}
 if(type==='message'){const button=$('[data-story=next]',s);if(button)button.innerHTML=(scenes[sceneIndex+1]==='gift'?'Your little gift is still waiting':'There’s a little more')+' '+icon('arrow');}
 if(type==='photos'){$$('.polaroid img',s).forEach((img,i)=>{const wrap=document.createElement('div');wrap.className='polaroid-media';img.before(wrap);wrap.append(img);img.style.cssText=cropStyle(gift.photos[i]);});}
 if(type==='celebration'){
 $('.story-title',s).innerHTML=t.finalTitle;$('.story-description',s).textContent='Happy Birthday, '+gift.name+'. '+t.symbol;
 const description=$('.story-description',s);description.insertAdjacentHTML('afterend',`<p class="finale-words" aria-label="${e(t.ending)}">${t.ending.split(' ').map((w,i)=>`<span class="fw" aria-hidden="true" style="--w:${i}">${e(w)}</span>`).join(' ')}</p>${gift.photos.length&&!reducedMotion?finaleReel():gift.photos.length?`<div class="finale-montage" aria-label="A few of your favorite moments">${gift.photos.map((p,i)=>`<figure class="finale-photo" style="--delay:${i*.18}s"><div><img src="${e(p.src)}" alt="${e(p.caption||'A favorite memory')}" style="${cropStyle(p)}" referrerpolicy="no-referrer"></div></figure>`).join('')}</div>`:''}`);
 const token=experienceToken;startReel(token);finaleTimer=setTimeout(()=>{if(token!==experienceToken||scenes[sceneIndex]!=='celebration')return;confetti(gift.vibe==='Crazy'?130:gift.vibe==='Elegant'?48:95);swellMusic();},reducedMotion?0:650);
 }
 if(type==='reply'){
 mountMessageTemplates($('#recipientReply'),'reply');
 if(gift.server&&!isPreview){
  const b=$('[data-story=prepare-reply]',s);b.dataset.v2='send-reply';delete b.dataset.story;b.innerHTML='Send my reply '+icon('heart');
  $('.reply-hint',s).id='deliveryFeedback';$('.reply-hint',s).setAttribute('role','status');$('.reply-hint',s).innerHTML='It goes straight to '+e(gift.sender||'the person who made this')+', privately.<br>Nothing is sent until you choose to.';
 }
 }
 if(type==='reply'&&reportLink())s.insertAdjacentHTML('beforeend','<p class="report-line">'+reportLink()+'</p>');
 adaptOccasionScene(type,s);
}
function choosePath(path){if(transitionBusy||scenes[sceneIndex]!=='choice')return;const pos=scenes.indexOf(path,sceneIndex+1);if(pos<0)return;scenes.splice(pos,1);scenes.splice(sceneIndex+1,0,path);chime();goToScene(sceneIndex+1);}
async function lightUp(){
 if(transitionBusy||scenes[sceneIndex]!=='opening')return;const token=experienceToken,exp=$('#experience');ensureAudio();enableTilt(true);
 if(lightStage===0){transitionBusy=true;lightStage=1;exp.classList.add('sparked');chime('soft');const b=$('#lightTrigger');b.disabled=true;$('#lightingCaption').textContent=gift.vibe==='Funny'?'Oh good. We paid the electricity bill.':'There it is. Your first little light.';await sleep(700);if(token!==experienceToken)return;b.disabled=false;b.innerHTML='<span class="switch-orb">'+icon('bulb')+'</span><span>One more touch. Let it all in ✨</span>';b.setAttribute('aria-label',gift.occasion==='birthday'?'Light up the whole birthday room':'Let the whole little room light up');transitionBusy=false;return;}
 transitionBusy=true;$('#lightTrigger').disabled=true;exp.classList.add('lit','lighting');chime('wish');startMusic();$('meta[name="theme-color"]').content='#f5e6df';await sleep(2300*THEMES[gift.vibe].speed);if(token!==experienceToken)return;exp.classList.remove('lighting');sceneIndex=1;renderScene();transitionBusy=false;
}
async function blowCandles(){const cake=$('#birthdayCake');if(!cake||cake.classList.contains('extinguished'))return;cake.classList.add('extinguished');cake.disabled=true;stopBlowing();const token=experienceToken;$('#blowMic').hidden=true;$('#cakeInstruction').textContent='A little wish, tucked into the dark. ♡';$('.story-title',$('#storyScene')).innerHTML=gift.vibe==='Funny'?'Excellent blowing.<br><em>Very professional.</em>':'Keep it <em>close.</em>';$('#cakeDescription').textContent=gift.vibe==='Crazy'?'Your outrageous wish has been submitted to the universe.':'Some wishes don’t need to be said out loud.';const exp=$('#experience');exp.classList.add('candle-pause');duckMusic(true);await sleep(1100);if(token!==experienceToken)return;exp.classList.remove('candle-pause');chime('wish');duckMusic(false);await sleep(650);if(token!==experienceToken||scenes[sceneIndex]!=='cake')return;$('#cakeAfter').className='wish-success';$('#cakeAfter').innerHTML=storyButton(scenes[sceneIndex+1]==='choice'?'A little curiosity next':'Now, your little gift');}
async function openPresent(){await openPresentV1();if($('#giftAfter')?.firstElementChild){const next=scenes[sceneIndex+1];$('#giftAfter').innerHTML=storyButton(next==='message'?'Read your little note':next==='memories'?'A few pieces of our story':next==='photos'?'Look what I kept':'There’s a little more');}}
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
function startMusic(){startMusicV1();if(musicAudio)musicAudio.volume=musicDucked?(gift.volume??.24)*.23:(gift.volume??.24);}
function duckMusic(duck){musicDucked=duck;if(musicAudio)musicAudio.volume=(gift.volume??.24)*(duck?.23:1);}
function stopTilt(){if(tiltHandler)window.removeEventListener('deviceorientation',tiltHandler);tiltHandler=null;tiltEnabled=false;$('[data-v2=tilt]')?.setAttribute('aria-pressed','false');$('#experience')?.style.removeProperty('--mx');$('#experience')?.style.removeProperty('--my');}
async function enableTilt(silent=false){if(reducedMotion||!gift?.motion)return;tiltEnabled=true;$('[data-v2=tilt]')?.setAttribute('aria-pressed','true');if(!silent)toast('Tilt active. A tiny room, following you.');if(tiltHandler)return;try{if(typeof DeviceOrientationEvent==='undefined')return;if(typeof DeviceOrientationEvent.requestPermission==='function'&&await DeviceOrientationEvent.requestPermission()!=='granted')return;tiltHandler=ev=>{if(currentView!=='experience'||document.hidden||!tiltEnabled)return;$('#experience')?.style.setProperty('--mx',clamp((ev.gamma||0)/5,-8,8,0)+'px');$('#experience')?.style.setProperty('--my',clamp(((ev.beta||35)-35)/7,-7,7,0)+'px');};window.addEventListener('deviceorientation',tiltHandler,{passive:true});}catch{}}
function toggleTilt(){if(tiltEnabled){stopTilt();toast('Tilt paused.');}else{enableTilt(false);}}
/* A real postbox when connected; a genuinely portable gift when not. */
function buildGiftURL(encoded){const base=new URL(location.href);if(/^\/(g|for)\//.test(base.pathname))base.pathname='/';base.hash='gift='+encoded;return base.href;}
function recoveryURL(entry){const base=new URL(location.href);base.pathname='/';base.search='';base.hash='edit='+entry.id+'.'+entry.key;return base.href;}
function makeCover(g){
 const c=document.createElement('canvas');c.width=1200;c.height=630;const x=c.getContext('2d');if(!x)return '';
 const bg=x.createLinearGradient(0,0,1200,630);bg.addColorStop(0,'#fbf5eb');bg.addColorStop(1,g.vibe==='Elegant'?'#eee5d0':'#f2dfd9');x.fillStyle=bg;x.fillRect(0,0,1200,630);
 x.strokeStyle='#d7b7a4';x.lineWidth=1.2;x.strokeRect(24,24,1152,582);
 x.fillStyle='#fff7ed';x.beginPath();x.roundRect(315,68,570,640,[285,285,0,0]);x.fill();
 const glow=x.createRadialGradient(600,120,10,600,170,450);glow.addColorStop(0,'#ffecb544');glow.addColorStop(1,'#ffecb500');x.fillStyle=glow;x.fillRect(0,0,1200,630);
 x.beginPath();x.moveTo(-20,15);x.bezierCurveTo(220,90,410,155,620,72);x.bezierCurveTo(870,-20,1020,80,1220,30);x.strokeStyle='#a79678';x.stroke();
 for(let i=0;i<18;i++){const px=25+i*68,py=50+Math.sin(i*.4)*30;x.strokeStyle='#a79678';x.beginPath();x.moveTo(px,py-10);x.lineTo(px,py+7);x.stroke();x.fillStyle='#ecca82';x.shadowColor='#e5c178';x.shadowBlur=19;x.beginPath();x.ellipse(px,py+12,5,9,0,0,Math.PI*2);x.fill();}x.shadowBlur=0;
 x.fillStyle='#99606d';x.textAlign='center';x.font='14px Arial';x.fillText('A LITTLE WORLD, JUST FOR YOU',600,189);
 x.fillStyle='#67464c';x.font='italic 58px Georgia';if(x.measureText(occasionOf(g).greeting).width>790)x.font='italic 44px Georgia';x.fillText(occasionOf(g).greeting,600,267);
 const name=g.sharePreview!==false?g.name:'lovely you';let size=88;x.font=`${size}px Georgia`;while(x.measureText(name).width>790&&size>34){size-=2;x.font=`${size}px Georgia`;}x.fillStyle=g.vibe==='Elegant'?'#968052':'#a45c70';x.fillText(name,600,365);
 x.font='24px Georgia';x.fillText(occasionOf(g).symbol,600,407);x.font='italic 21px Georgia';x.fillStyle='#99776d';x.fillText('Open this when you have a quiet moment.',600,453);
 // A slightly wonky balloon, a small ribbon, and a tiny birthday cake.
 if(g.occasion==='birthday'){for(const [px,py,color,angle]of [[141,322,'#dec0c2',-.15],[1060,264,'#d9c9a5',.14]]){x.save();x.translate(px,py);x.rotate(angle);x.fillStyle=color;x.beginPath();x.ellipse(0,0,44,58,0,0,Math.PI*2);x.fill();x.strokeStyle='#b79b7c';x.beginPath();x.moveTo(0,58);x.bezierCurveTo(-15,115,22,113,9,160);x.stroke();x.restore();}
 x.fillStyle='#e2b9b9';x.beginPath();x.roundRect(553,518,94,47,[8,8,10,10]);x.fill();x.fillStyle='#fff8e7';x.beginPath();x.ellipse(600,519,47,10,0,0,Math.PI*2);x.fill();x.fillStyle='#c9aa77';x.fillRect(597,492,6,25);x.fillStyle='#ebbe71';x.beginPath();x.ellipse(600,484,5,9,0,0,Math.PI*2);x.fill();x.strokeStyle='#c39c9d';x.beginPath();x.moveTo(544,569);x.lineTo(656,569);x.stroke();}else{
  // A small wax-sealed envelope: the share image never reveals the question or note.
  x.save();x.translate(600,534);x.rotate(-.04);x.fillStyle='#f3e5d7';x.strokeStyle='#c7a997';x.lineWidth=1.3;x.beginPath();x.roundRect(-65,-27,130,64,4);x.fill();x.stroke();x.beginPath();x.moveTo(-64,-25);x.lineTo(0,16);x.lineTo(64,-25);x.stroke();x.fillStyle=g.occasion==='apology'?'#9da389':'#c28a98';x.beginPath();x.arc(0,15,11,0,Math.PI*2);x.fill();x.restore();
  x.font='38px Georgia';x.fillStyle='#c5ab91';x.fillText(occasionOf(g).symbol,165,340);x.fillText(occasionOf(g).symbol,1035,290);
 }
 x.font='italic 28px Georgia';x.fillStyle='#9f6573';x.textAlign='left';x.fillText('luv4u ♡',53,581);x.textAlign='right';x.font='12px Arial';x.fillStyle='#a4897d';x.fillText('A SMALL LINK. BIG FEELINGS.',1142,578);
 return c.toDataURL('image/png');
}
/* Hosted mode: upload embedded photos/audio/cover to Storage first, so the publish request stays tiny
   (serverless platforms cap request bodies at a few MB). Already-hosted URLs pass through untouched. */
async function offloadMedia(id,key,g,cover){
 const up=(dataUri,kind)=>api('/api/gifts/'+id+'/media',{method:'POST',key,body:{dataUri,kind}}).then(r=>r.url);
 const out=JSON.parse(JSON.stringify(g));
 for(const p of out.photos)if(p.src.startsWith('data:'))p.src=await up(p.src,'image');
 if(out.voice.startsWith('data:'))out.voice=await up(out.voice,'audio');
 if(out.musicSrc.startsWith('data:'))out.musicSrc=await up(out.musicSrc,'audio');
 return {gift:out,coverUrl:cover?await up(cover,'cover'):''};
}
async function publishGift(){
 if(publishing||!validateForm())return;publishing=true;stopPreviewAudio();const btn=$('#createGiftBtn');btn.disabled=true;btn.textContent='Tying the little ribbon…';
 try{
 const g=collectGift();g.version=3;const mode=editing?.mode==='hosted'?'hosted':paymentsRequired?'hosted':delivery;coverData=makeCover(g);
 if(mode==='hosted'){
 if(!backendReady)throw new Error(paymentsRequired?'Gifts are created online. Check your connection and try again.':'The gift server is not connected. Choose standalone mode to make a gift file.');if(!backendOccasions.includes(g.occasion))throw new Error('This gift server needs the v3 update for '+occasionOf(g).label.toLowerCase()+'. Choose standalone to export this gift, or update the server.');
 if(editing?.mode==='hosted'){
 const media=await offloadMedia(editing.id,editing.key,g,g.sharePreview?coverData:'');
 const data=await api('/api/gifts/'+editing.id,{method:'PATCH',key:editing.key,body:{gift:media.gift,coverUrl:media.coverUrl,revision:editing.revision,...($('#expiryDays').dataset.changed==='true'?{expiresDays:+$('#expiryDays').value}:{})}});
 publishedGift=sanitizeGift(data.gift);publishedURL=data.url;publishedStatus=data.status||'paid';publishedExpiresAt=data.expiresAt||'';editing.revision=data.revision;
 rememberGift({...editing,name:g.name,vibe:g.vibe,occasion:g.occasion,url:data.url,expiresAt:data.expiresAt});
 }else{
 // Keep these values after a network failure, so retrying does not duplicate gifts.
 if(!publishAttempt)publishAttempt={id:hexToken(12),key:hexToken(32)};
 await store('pending-create',{...publishAttempt,gift:g}).catch(()=>{});
 const media=await offloadMedia(publishAttempt.id,publishAttempt.key,g,g.sharePreview?coverData:'');
 const data=await api('/api/gifts',{method:'POST',body:{id:publishAttempt.id,editKey:publishAttempt.key,gift:media.gift,coverUrl:media.coverUrl,expiresDays:+$('#expiryDays').value}});
 publishedGift=sanitizeGift(data.gift);publishedURL=data.url;publishedStatus=data.status||'paid';publishedExpiresAt=data.expiresAt||'';editing={id:publishedGift.id,key:publishAttempt.key,revision:data.revision,mode:'hosted'};
 rememberGift({...editing,name:g.name,vibe:g.vibe,occasion:g.occasion,url:data.url,expiresAt:data.expiresAt});publishAttempt=null;await removeStored('pending-create').catch(()=>{});
 }
 }else{
 publishedStatus='paid';publishedGift={...g,id:hexToken(12),server:false};const encoded=await encodeGift(publishedGift);const candidate=buildGiftURL(encoded);publishedURL=candidate.length<=8000?candidate:'';
 await store('gift:'+publishedGift.id,publishedGift).catch(()=>{toast('This browser cannot keep this gift. Download its HTML before closing.');});editing={mode:'portable',id:publishedGift.id};rememberGift({id:publishedGift.id,name:g.name,vibe:g.vibe,occasion:g.occasion,mode:'portable',url:publishedURL});
 }
 await store('lastGift',publishedGift).catch(()=>{});showShare();saveDraft();
 }catch(err){toast(err.message||'The ribbon got tangled. Your draft is still here.');}finally{publishing=false;btn.disabled=false;btn.innerHTML=createLabel();}
}
function showShare(){
 if(!publishedGift)return;showShareV1();const isHosted=publishedGift.server,tooLarge=!publishedURL;
 $('.share-view h1').innerHTML=`It’s ready for<br><em>${e(publishedGift.name)}.</em>`;
 $('#shareLead').textContent=occasionOf(publishedGift).whisper;$('#shareArt').innerHTML=occasionArt(occasionArtFor(publishedGift),'share-occasion');$('#shareCover').alt=occasionOf(publishedGift).label+' share artwork';
 $('#giftLink').value=publishedURL||'Your media-rich gift is ready as an HTML file.';$('#giftLink').disabled=tooLarge;$('#copyGiftLink').disabled=tooLarge;$('#whatsappGift').disabled=tooLarge||!publicHosting();
 $('#linkSize').textContent=isHosted?'A small link. Every lovely detail included.':tooLarge?'Wrapped as a gift file · all uploaded media included':'Standalone gift · carried inside the link';
 $('#sizeWarning').hidden=!tooLarge;$('#sizeWarning').innerHTML='<strong>More love than fits in a link.</strong> This gift contains photos or audio. Use <strong>Download gift HTML</strong> and send it as a document, or use the server-backed version for a short web link. Nothing has been uploaded in standalone mode.';
 if(isHosted)$('#sizeWarning').hidden=true;
 $('.share-privacy').innerHTML=isHosted?'Your gift is stored on this gift server. Anyone with its link can open it.<br>Keep the private recovery link to edit, see replies, or remove it.':tooLarge?'Your gift is wrapped in the HTML file. Share it with someone you trust.<br>No server inbox, opening counts, or link expiry.':'Your gift travels inside its link. Anyone with the link can open it.<br>No server inbox, opening counts, or link expiry.';
 if(isHosted&&!publicHosting())$('#hostingWarning').innerHTML='<strong>Your gift is still at home.</strong> This gift is on your local server, so its URL will not open on another device. Deploy the complete project on a public HTTPS domain and create your gift there. Or use <strong>Download gift HTML</strong> and send the file itself.';
 $('#nativeShareGift').hidden=!publishedURL;$('#nativeShareGift').disabled=!publicHosting();
 coverData=makeCover(publishedGift);$('#shareCover').src=coverData;$('#shareCover').hidden=!coverData;
 const entry=libraryCache.find(v=>v.id===publishedGift.id);
 $('#ownerNote').innerHTML=isHosted&&entry?`<strong>Save your private edit link.</strong><br>Your recipient link opens the surprise. Your private edit link lets you change it, see replies, or remove it. Keep it to yourself.<br><button data-v2="copy-recovery" data-id="${entry.id}">Copy my private edit link</button>`:'<strong>Beautifully portable.</strong><br>Your gift file opens without this website. Uploaded photos and audio go with it. External media links still need the internet.<br><button data-v2="library">Back to my little gifts</button>';
 applyShareLock();
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
 const name=draft.name.trim(),show=!!name&&currentView==='home'&&!dismissed;
 b.dataset.on=show?'1':'';b.classList.toggle('show',show);b.inert=!show;
 if(!show)return;
 const o=occasionOf(draft),key=occasionKey(draft);
 b.innerHTML=`<span class="resume-copy"><strong>${e(o.short)} for ${e(name)}</strong><span>Saved on this device. Pick up where you left off.</span></span><a class="resume-btn" href="#make=${e(key)}" data-choose-occasion="${e(key)}">Continue</a><button type="button" class="resume-close" data-v3="resume-dismiss" aria-label="Dismiss">×</button>`;
}
/* ---- Paywall: everything shown here is true (real deletion date, real price and terms). ---- */
const priceText=()=>payPrice?'₹'+payPrice.toLocaleString('en-IN'):'';
function savedDaysLeft(){if(!publishedExpiresAt)return null;return Math.max(0,Math.ceil((new Date(publishedExpiresAt).getTime()-Date.now())/86400000));}
function savedLossLine(){const n=savedDaysLeft();if(n===null)return '';return n<=1?'Your saved gift is deleted within a day unless you unlock it.':`Your saved gift is kept for ${n} more days. After that it is deleted.`;}
const lifeText=days=>days>=365?'a full year':days+' days';
function updatePriceLine(){const el=$('#priceLine');if(!el)return;const show=paymentsRequired&&!!priceText();el.hidden=!show;if(show)el.innerHTML=`Previewing is free. You pay <strong>${e(priceText())}</strong> once, only when you are ready to send it.`;}
function madeSummary(g){const parts=[];if(g.message?.trim())parts.push('your own words');if(g.photos.length)parts.push(g.photos.length+(g.photos.length===1?' photo':' photos'));if(g.voice)parts.push('a voice note');if(g.memories.some(m=>m.text.trim()))parts.push('little memories');if(g.music!=='none')parts.push('a soundtrack');return parts.length?parts.join(' · '):'A thoughtful ready-made note is tucked inside';}
/* A preview gift is saved and editable but its link does not open yet: show what is at stake and how to unlock it. */
function applyShareLock(){
 const locked=!!publishedGift?.server&&publishedStatus==='preview';
 let panel=$('#unlockPanel');
 if(!panel){$('.link-wrap').insertAdjacentHTML('beforebegin','<section class="unlock-panel" id="unlockPanel" aria-labelledby="unlockTitle" hidden></section>');panel=$('#unlockPanel');}
 panel.hidden=!locked;
 if(!locked)return;
 const o=occasionOf(publishedGift),name=e(publishedGift.name),photo=publishedGift.photos[0],price=priceText();
 panel.innerHTML=`<div class="unlock-gift"><span class="unlock-art" aria-hidden="true">${photo?`<img src="${e(photo.src)}" alt="" style="${cropStyle(photo)}" referrerpolicy="no-referrer">`:e(o.symbol)}</span><span class="unlock-gift-copy"><strong>${e(o.short)} for ${name}</strong><span>${e(madeSummary(publishedGift))}</span></span></div>
<h2 id="unlockTitle">${name} can’t open it yet.</h2>
<p id="unlockText">Right now only you can see this gift. Unlock it to get the link you can send, and ${name} gets to open the whole thing.</p>
${price?`<div class="unlock-price"><strong>${e(price)}</strong><span>one-time · no subscription</span></div>`:''}
<ul class="unlock-list"><li>A private link only ${name} gets</li><li>Stays live for ${lifeText(payLinkDays)}</li><li>Their reply comes to you, privately</li><li>Edit it any time, on the same link</li></ul>
<div class="unlock-actions"><button type="button" class="btn btn-primary pulse-cta" data-v3="unlock">Unlock & get link${price?' · '+e(price):''}</button></div>
<p class="unlock-loss">${e(savedLossLine())}</p>
<p class="unlock-note">Previewing is free, so look as often as you like. Once a gift is unlocked, the payment is not refundable.</p>`;
 $('#giftLink').value='Your link appears here once it is unlocked';
 for(const id of ['giftLink','copyGiftLink','whatsappGift','downloadGift','nativeShareGift'])if($('#'+id))$('#'+id).disabled=true;
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
 $('.unlock-tray-copy',tray).innerHTML=last?`<strong>This is what ${name} will feel.</strong><span>${saved?'Unlock it and send it':'Save it, then unlock it to send it'}${price?' · '+e(price)+' one-time':''}.</span>`:'<span>Preview · not sent yet</span>';
 const btn=$('.unlock-tray-btn',tray);btn.dataset.story=saved?'preview-unlock':'preview-save';
 btn.textContent=saved?(last?'Unlock & send':'Unlock')+(price?' · '+price:''):(last?'Save & continue':'Save');
}
let paySimulated=false;
/* The payment modal. It states the price, what is included and the refund rule, then takes the buyer to checkout. */
function unlockGift(){
 if(!editing?.key||!publishedGift?.server)return;
 const previous=document.activeElement,root=$('#modalRoot'),name=e(publishedGift.name),price=priceText(),o=occasionOf(publishedGift);
 root.innerHTML=`<div class="modal-backdrop pay-backdrop"><section class="modal pay-modal" role="dialog" aria-modal="true" aria-labelledby="payTitle">
<button type="button" class="pay-close" id="payClose" aria-label="Close">×</button>
<div class="pay-body" id="payBody">
<div class="pay-gift"><span class="pay-gift-art" aria-hidden="true">${e(o.symbol)}</span><span><strong>${e(o.short)} for ${name}</strong><small>${e(madeSummary(publishedGift))}</small></span></div>
<h2 id="payTitle">Unlock ${name}’s gift</h2>
<div class="pay-price"><strong>${e(price||'Free')}</strong><span>one-time · no subscription</span></div>
<ul class="pay-list"><li>Your private link, ready to send the moment you pay</li><li>Stays live for ${lifeText(payLinkDays)}</li><li>Their reply comes back to you, privately</li><li>Edit it any time, on the same link</li></ul>
${paySimulated?'<p class="pay-test"><strong>Test mode.</strong> Nothing is charged. This only shows how paying will work.</p>':'<p class="pay-methods" aria-label="Payment methods">UPI · Cards · Netbanking</p>'}
<p class="pay-error" id="payError" role="alert" hidden></p>
<button type="button" class="btn btn-primary pay-btn" id="payGo">${paySimulated?'Continue (test mode)':'Pay '+e(price)}</button>
<button type="button" class="pay-later" id="payLater">Not yet, keep it saved</button>
<p class="pay-terms">Once a gift is unlocked, the payment is not refundable. Previewing stays free, so look as often as you like.</p>
</div></section></div>`;
 const close=()=>{root.innerHTML='';document.removeEventListener('keydown',trap);previous?.focus?.();};
 const trap=event=>{if(event.key==='Escape'&&!$('#payGo')?.disabled)close();if(event.key==='Tab'){const bs=$$('button:not([disabled])',root),first=bs[0],last=bs[bs.length-1];if(!first)return;if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}};
 document.addEventListener('keydown',trap);
 $('#payClose').onclick=close;$('#payLater').onclick=close;
 $('.pay-backdrop',root).addEventListener('click',ev=>{if(ev.target.classList.contains('pay-backdrop')&&!$('#payGo')?.disabled)close();});
 $('#payGo').onclick=async()=>{
  const go=$('#payGo'),err=$('#payError'),label=go.textContent;
  go.disabled=true;go.classList.add('is-busy');go.textContent='Processing…';err.hidden=true;$('#payLater').disabled=true;
  try{
   const r=await api('/api/gifts/'+editing.id+'/checkout',{method:'POST',key:editing.key});
   if(r.status!=='paid')throw new Error('We could not confirm the payment. Nothing was unlocked.');
   const owner=await api('/api/gifts/'+editing.id+'/owner',{key:editing.key});
   publishedStatus='paid';publishedURL=owner.url;
   $('#payBody').innerHTML=`<div class="pay-done"><span class="pay-check" aria-hidden="true">✓</span><h2 id="payTitle">Unlocked. ${name} can open it now.</h2><p>Your private link is ready. Send it whenever you like.</p><button type="button" class="btn btn-primary pay-btn" id="payDone">Get my link</button></div>`;
   $('#payClose').hidden=true;confetti(140);$('#payDone').focus();
   $('#payDone').onclick=()=>{close();showShare();toast('Unlocked. Send it with love. ♡');};
  }catch(ex){
   go.disabled=false;go.classList.remove('is-busy');go.textContent=label;$('#payLater').disabled=false;
   err.textContent=ex.message||'We could not take the payment. Your gift is still saved.';err.hidden=false;
  }
 };
 $('#payGo').focus();
}
/* Open a saved gift's share screen (used for gifts still waiting to be unlocked). */
async function openSavedShare(id){
 const entry=libraryCache.find(v=>v.id===id);if(!entry)return;
 try{const r=await api('/api/gifts/'+id+'/owner',{key:entry.key});publishedGift=sanitizeGift(r.gift);publishedURL=r.url;publishedStatus=r.status||'paid';publishedExpiresAt=r.expiresAt||'';editing={id,key:entry.key,mode:'hosted',revision:r.revision};showShare();}
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
async function nativeShare(){if(!publishedURL||!publicHosting())return;const data={title:occasionOf(publishedGift).label+(publishedGift.sharePreview===false?' for you':' for '+publishedGift.name),text:'Psst… open this when you have a quiet moment. ♡',url:publishedURL};try{if(navigator.share)await navigator.share(data);else await copyText(publishedURL);}catch(err){if(err.name!=='AbortError')toast('Sharing is unavailable here. Copy the little link instead.');}}
async function shareCover(){if(!coverData)return;const blob=await (await fetch(coverData)).blob();const file=new File([blob],'a-little-gift.png',{type:'image/png'});try{if(navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:occasionOf(publishedGift).label,text:publishedURL||'A little world, made just for you.'});else{downloadBlob(blob,'a-little-gift.png');toast('Artwork saved. Attach it with the gift link in your message.');}}catch(err){if(err.name!=='AbortError')toast('This browser cannot share artwork directly. Use Save the little artwork.');}}
async function showLibrary(){clearGiftHash();showView('library');$('#savedGiftList').innerHTML=libraryCache.length?libraryCache.map(entry=>`<article class="saved-gift"><span aria-hidden="true">${THEMES[entry.vibe]?.symbol||'♡'}</span><div><h2>For ${e(entry.name||'your person')}.</h2><p>${e(occasionOf(entry).short)} · ${e(entry.vibe||'A little')} · ${entry.mode==='hosted'?'A live little world':'A standalone keepsake'}${entry.at?' · '+e(new Date(entry.at).toLocaleDateString(undefined,{month:'short',day:'numeric'})):''}</p><div class="saved-actions"><button data-v2="edit-saved" data-id="${e(entry.id)}">Open & edit</button><button data-v2="copy-saved" data-id="${e(entry.id)}">${entry.url?'Copy gift link':'Open gift file options'}</button>${entry.mode==='hosted'?`<button data-v2="stats" data-id="${e(entry.id)}">Little replies</button><button data-v2="copy-recovery" data-id="${e(entry.id)}">Private recovery link</button>`:''}<button class="danger" data-v2="delete-saved" data-id="${e(entry.id)}">${entry.mode==='hosted'?'Remove gift':'Forget here'}</button></div><div class="saved-stats" id="stats-${e(entry.id)}" hidden></div></div></article>`).join(''):'<p class="empty-shelf">No ribbons tied just yet.<br>Your first little gift belongs right here.</p>';}
async function editSaved(id,key=null){let entry=libraryCache.find(v=>v.id===id);if(key)entry={id,key,mode:'hosted'};if(!entry){toast('That gift is not saved in this browser. Use its private recovery link.');return;}try{let g;if(entry.mode==='hosted'){const result=await api('/api/gifts/'+id+'/owner',{key:entry.key});g=sanitizeGift(result.gift);publishedStatus=result.status||'paid';publishedExpiresAt=result.expiresAt||'';editing={id,key:entry.key,mode:'hosted',revision:result.revision};rememberGift({...editing,name:g.name,vibe:g.vibe,occasion:g.occasion,url:result.url,expiresAt:result.expiresAt});delivery='hosted';}else{g=await store('gift:'+id);if(!g)throw new Error('The saved gift data is no longer in this browser. Open the exported HTML to enjoy it.');editing=null;delivery=backendReady?'hosted':'portable';}draft=sanitizeGift(g);publishAttempt=null;clearGiftHash();wizardStep=1;populateForm();$('#expiryDays').dataset.changed='false';showView('creator');toast(entry.mode==='hosted'?'Your little gift is open. Changes will keep the same link.':'A new copy of your standalone gift is ready to edit.');}catch(err){toast(err.message);}}
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
 const step=event.target.closest('[data-wizard-step]');if(step){event.preventDefault();const to=+step.dataset.wizardStep;if(to===2&&wizardStep<2){if(wizardStep===0)setStep(1);else advanceWizard();}else setStep(to);return;}
 const crop=event.target.closest('[data-crop]');if(crop){openCrop(+crop.dataset.crop);return;}
 const move=event.target.closest('[data-move]');if(move){const [kind,i,delta]=move.dataset.move.split(':');moveItem(kind,+i,+i+(+delta));return;}
 const b=event.target.closest('[data-v2]');if(!b)return;event.preventDefault();const id=b.dataset.id;
 switch(b.dataset.v2){
 case'wizard-next':advanceWizard();break;case'wizard-back':setStep(wizardStep-1);break;case'skip-extras':skipTouches();break;case'choose-touches':chooseTouches();break;case'choose-touch':chooseTouches(b.dataset.detail);break;case'edit-touches':chooseTouches();break;
 case'library':showLibrary();break;case'preview-music':previewMusic();break;case'cancel-crop':closeCrop(false);break;case'save-crop':closeCrop(true);break;
 case'choose-path':choosePath(b.dataset.path);break;case'pick-gift':pickMystery(b);break;case'custom-quiz':customQuiz(b);break;
 case'reveal-quiz':{const right=$('[data-right=true]');if(right){$('#quizHint').textContent='A tiny hint: '+gift.quizAnswer+'. Give it a tap. ♡';}break;}
 case'tilt':toggleTilt();break;case'native-share':nativeShare();break;case'share-cover':shareCover();break;
 case'download-cover':if(coverData){const blob=await (await fetch(coverData)).blob();downloadBlob(blob,'a-little-gift.png');}break;
 case'edit-saved':editSaved(id);break;case'stats':showStats(id);break;case'delete-saved':deleteSaved(id);break;case'send-reply':sendDirectReply(b);break;
 case'copy-recovery':{const entry=libraryCache.find(v=>v.id===id);if(entry?.key)copyText(recoveryURL(entry),'Your private edit link is copied. Keep this one just for you.');break;}
 case'save-recovery':{const entry=libraryCache.find(v=>v.id===id);if(entry?.key)downloadBlob(new Blob(['Luv4u — PRIVATE gift recovery\n\nFor: '+entry.name+'\n\nPRIVATE edit/recovery link (do not share):\n'+recoveryURL(entry)+'\n\nRecipient link (safe to share):\n'+entry.url+'\n\nAnyone with the private link can edit or delete this gift and read replies.\n'],{type:'text/plain;charset=utf-8'}),'luv4u-private-recovery.txt');break;}
 case'copy-saved':{const entry=libraryCache.find(v=>v.id===id);if(!entry)break;if(entry.url)copyText(entry.url);else{try{publishedGift=await store('gift:'+id);if(!publishedGift)throw new Error('This gift is no longer saved in the browser.');publishedURL='';showShare();}catch(err){toast(err.message);}}break;}
 }
 });
 $('#giftForm').addEventListener('submit',event=>{event.preventDefault();event.stopImmediatePropagation();if(wizardStep<3)advanceWizard();else publishGift();},true);
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
async function routeV2(){const occasionRoute=/^#occasion=(birthday|proposal|love|apology|anniversary|thanks|congratulations|missyou)$/.exec(location.hash);if(occasionRoute){applyCampaign(occasionRoute[1]);return true;}
 const make=/^#make=([a-z]+)$/.exec(location.hash);if(make&&Object.hasOwn(OCCASIONS,make[1])){await openCreator(make[1]);return true;}
 if(location.hash.startsWith('#make=')){browseGifts();toast('Choose one of the little gifts below.');return true;}

 const edit=/^#edit=([a-f0-9]{24})\.([a-f0-9]{64})$/.exec(location.hash);if(edit){const [,id,key]=edit;clearGiftHash();await editSaved(id,key);return true;}
 if(location.hash.startsWith('#edit=')){clearGiftHash();showView('error');$('#errorMessage').textContent='That private edit link is incomplete. Use the complete recovery link you saved.';return true;}
 if(location.hash.startsWith('#gift=')){await loadGiftFromLocation();return true;}
 let embedded;try{embedded=JSON.parse($('#giftPayload').textContent);}catch{}
 if(embedded){try{embedded.server=false;startExperience(sanitizeGift(embedded));}catch(err){showView('error');$('#errorMessage').textContent=err.message;}return true;}
 const match=/^\/g\/([a-f0-9]{24})\/?$/.exec(location.pathname);
 if(match){try{const result=await api('/api/gifts/'+match[1]);startExperience(result.gift);}catch(err){showView('error');$('#errorMessage').textContent=err.message;}return true;}const campaign=Object.entries(OCCASIONS).find(([,o])=>location.pathname==='/for/'+o.slug||location.pathname==='/for/'+o.slug+'/');if(campaign){/* The server already set this page's own title. */applyCampaign(campaign[0],true);return true;}return false;
}
async function init(){
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
const TEMPLATE_LABELS={note:'Borrow a few heartfelt words',secret:'A few little secrets',finale:'A lovely last line',memory:'A memory starter',memoryWhen:'A little label',caption:'Caption ideas',question:'Pick a ready-made quiz',answer:'Answer ideas',decoy:'Playful alternatives',reply:'A few words you could borrow',proposalQuestion:'A little help asking',reason:'A few little reasons',commitment:'An honest place to start',milestone:'A little dedication',reunion:'Until the next hello'};
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
 const button=event.target.closest('[data-action]');if(!button)return;event.preventDefault();switch(button.dataset.action){case'home':goHome();break;case'create':browseGifts();break;case'preview':previewGift();break;case'publish':publishGift();break;case'edit':wizardStep=1;populateForm();showView('creator');break;}
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
$('#whatsappGift').addEventListener('click',()=>{if(!publicHosting()||publishedURL.length>8000)return;openWhatsApp(`Psst, ${publishedGift.name}… I made ${occasionOf(publishedGift).share}. Open this when you have a quiet moment. ♡\n\n${publishedURL}`);});
$('#previewPublished').addEventListener('click',()=>{if(!publishedGift)return;previewScrollY=window.scrollY;startExperience(publishedGift,{preview:true,returnView:'share'});});$('#downloadGift').addEventListener('click',downloadGiftHTML);
$('#homeCandle').addEventListener('click',()=>{if(homeOccasion!=='birthday'){previewOccasion(homeOccasion);return;}const cake=$('#homeCandle');if(cake.classList.contains('extinguished')){cake.classList.remove('extinguished');$('#homeCandleHint').textContent='another little wish? go on.';cake.setAttribute('aria-label','Make a little wish and blow out the candles');return;}cake.classList.add('extinguished');cake.setAttribute('aria-label','Relight the birthday candles');$('#homeCandleHint').textContent='your little wish is on its way ♡';chime('wish');const r=cake.getBoundingClientRect();confetti(30,{x:r.x+r.width/2,y:r.y+30});});
$('#experience').addEventListener('click',event=>{
 const balloon=event.target.closest('[data-balloon]');if(balloon){popBalloon(balloon);return;}const quiz=event.target.closest('[data-quiz]');if(quiz){answerQuiz(quiz);return;}const r=event.target.closest('[data-reaction]');if(r){selectReaction(r.dataset.reaction);return;}
 const button=event.target.closest('[data-story]');if(!button)return;switch(button.dataset.story){case'light':lightUp();break;case'next':chime();goToScene(sceneIndex+1);break;case'blow':blowCandles();break;case'microphone':startBlowing();break;case'open-gift':openPresent();break;case'sound':toggleSound();break;case'exit-preview':exitPreview();break;case'preview-unlock':exitPreview();unlockGift();break;case'preview-save':exitPreview();publishGift();break;case'reveal-scratch':revealScratch();break;case'prepare-reply':prepareReply();break;case'share-reply':shareReply();break;case'copy-reply':copyText(replySharedText,'Your little thank-you is copied. Send it back with love.');break;case'whatsapp-reply':whatsappReply();break;case'replay':{const data=gift,preview=isPreview,ret=previewReturn;startExperience(data,{preview,returnView:ret,skipSeal:true});break;}case'make-your-own':browseGifts();break;}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopBlowing();if(mediaRecorder)stopRecording(true);if(musicAudio)musicAudio.pause();if(audioContext?.state==='running')audioContext.suspend().catch(()=>{});cancelAnimationFrame(confettiFrame);$('#confettiCanvas').hidden=true;}else if(currentView==='experience'&&$('#experience').classList.contains('lit')&&!soundMuted){ensureAudio();if(musicAudio)musicAudio.play().catch(()=>{});}});
window.addEventListener('pagehide',()=>{stopBlowing();stopRecording(false);stopMusic();});
window.addEventListener('hashchange',async()=>{if(!await routeV2()&&currentView==='experience'&&!isPreview)goHome();});
async function loadGiftFromLocation(){
 const token=++experienceToken;try{const g=await decodeGift(location.hash.slice(6));if(token!==experienceToken)return;startExperience(g);}catch(err){if(token!==experienceToken)return;showView('error');$('#errorMessage').textContent=err.message||'The gift link looks incomplete. Ask the sender to copy the whole link, or send the downloadable gift file.';}
}
/* Original little paper objects. No external images, fonts or network assets. */
function occasionArt(kind,id='little-art'){
 if(kind==='cake')return cakeSVG(id);
 const svg=(body)=>`<svg viewBox="0 0 300 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="${id}-paper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fffaf0"/><stop offset="1" stop-color="#edddd0"/></linearGradient><linearGradient id="${id}-rose" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e0b1b7"/><stop offset="1" stop-color="#b97587"/></linearGradient><linearGradient id="${id}-gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eddaaf"/><stop offset="1" stop-color="#b79a67"/></linearGradient></defs><ellipse cx="150" cy="233" rx="89" ry="7" fill="#805a44" opacity=".055"/>${body}</svg>`;
 const littleStars=`<g fill="none" stroke="#bf9a70" stroke-width="1.2" stroke-linecap="round"><path d="M55 65v14m-7-7h14M251 121v12m-6-6h12"/><path d="m231 43 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/></g>`;
 const shapes={
  envelope:`${littleStars}<g transform="rotate(-5 150 150)"><rect x="47" y="87" width="206" height="128" rx="7" fill="url(#${id}-paper)" stroke="#cdb6a4" stroke-width="1.2"/><path d="m48 207 96-68q6-5 12 0l95 68" fill="#f8ecdf" stroke="#dcc7b6" stroke-width="1"/><path class="envelope-flap" d="m48 89 94 70q8 6 16 0l94-70" fill="#fff8ed" stroke="#cdb6a4" stroke-width="1.1"/><path d="m64 107 71 54m37 0 65-47" fill="none" stroke="#ddc9b5" stroke-width=".7" stroke-dasharray="3 4"/><circle cx="150" cy="161" r="20" fill="#c58a96"/><circle cx="150" cy="161" r="16" fill="none" stroke="#dfa9af" stroke-width="1"/><path d="M150 169c-22-13-10-25 0-13 10-12 22 0 0 13" fill="#f7d9d3"/></g>`,
  hearts:`${littleStars}<g class="art-heart-back" transform="translate(-6 -12) rotate(-15 113 113)"><path d="M128 159 66 112q-23-39 7-46 22-7 38 20 12-23 32-15 32 12 12 46Z" fill="#ddc6bb" stroke="#c2a692"/><path d="m74 88 53 69 27-69m-80 0 51 19 29-19m-27 19v49" stroke="#b99780" fill="none" opacity=".5"/></g><g transform="rotate(8 167 152)"><path d="m171 213-78-65q-25-47 11-59 26-8 45 27 17-31 41-20 35 17 15 56Z" fill="url(#${id}-rose)" stroke="#b7808d" stroke-width="1.2"/><path d="m102 114 69 96 32-83m-101-13 65 34 36-21m-36 21 4 62" fill="none" stroke="#a86f80" opacity=".6"/><path d="m105 113 59 31-15-28" fill="#f0c6cb" opacity=".8"/></g><path d="m212 184 12 9-12 11-12-11q-4-15 12-9Z" fill="#edd6ce"/>`,
  olive:`<g fill="none" stroke="#819174" stroke-width="2.2" stroke-linecap="round"><path d="M112 225Q128 138 192 53M135 165l-47-46m67 13 44-15m-24-21-21-43"/></g><g fill="#a1ad90" stroke="#879575" stroke-width=".8"><path d="M116 190q-46-11-39-48 38 4 39 48Z"/><path d="M130 171q44 2 49-32-35-6-49 32Z"/><path d="M142 144q-33-18-21-49 30 7 21 49Z"/><path d="M160 119q45 1 53-32-38-8-53 32Z"/><path d="M174 93q-29-21-13-52 31 18 13 52Z"/><path d="M190 67q34-9 29-40-30 0-29 40Z"/></g><g fill="#687c66"><ellipse cx="131" cy="178" rx="6" ry="8" transform="rotate(20 131 178)"/><ellipse cx="157" cy="133" rx="5" ry="7"/></g><path d="M122 199c-44-25-36 21 0 5 30 24 44-15 0-5Z" fill="#e2c7c4" stroke="#c39d9e"/><path d="m122 204-12 30m14-30 11 25" fill="none" stroke="#c39d9e" stroke-width="6"/><path d="M69 64q6-12 15 0-9 14-15 0Z" fill="none" stroke="#c3a995"/>`,
  book:`${littleStars}<g transform="rotate(-4 150 140)"><path d="M42 91q54-28 108-4 54-24 108 4v129q-61-23-108-3-48-20-108 3Z" fill="#ba8d93" stroke="#a4747d" stroke-width="1.3"/><path d="M47 79q51-19 103 8v119q-49-24-103-8Zm103 8q49-27 103-8v119q-53-26-103 8Z" fill="url(#${id}-paper)" stroke="#d1bbaa"/><path d="M150 87v119M57 190q37-11 82 5m22 0q41-17 81-5" stroke="#cfb8a1" stroke-width=".9" fill="none"/><path d="M174 79v66l9-7 9 7V74" fill="#c38897"/><path d="M83 124q-8-15 8-14 11 0 10 15 18-9 21 4 3 10-16 20Z" fill="#ddadb4"/><g fill="none" stroke="#ccb5a2" stroke-linecap="round"><path d="m69 160 56 4m-56 8 44 4m47-21 71-6m-71 18 58-6m-58 18 46-5"/></g></g>`,
  bouquet:`<g stroke="#8e9b7a" stroke-width="2.5" fill="none"><path d="m150 215-47-119m47 119 47-120m-47 119 2-145"/></g><g fill="#a5b191"><path d="M139 188q-44-1-39-35 36 2 39 35Z"/><path d="M161 174q41-6 33-37-33 7-33 37Z"/></g><g class="bouquet-flower">${[[100,93,'#d7a3af',24],[153,65,'#ead7ad',25],[202,104,'#c9b8ae',22]].map(([x,y,color,r])=>`<g transform="translate(${x} ${y})">${[0,60,120,180,240,300].map(a=>`<ellipse cx="0" cy="-${r*.65}" rx="${r*.55}" ry="${r*.77}" transform="rotate(${a})" fill="${color}" stroke="#ad8581" stroke-opacity=".24"/>`).join('')}<circle r="9" fill="#ba9970"/><circle r="5" fill="#eddbad"/></g>`).join('')}</g><path d="m150 171-66-33 35 92h58l41-92-66 33" fill="url(#${id}-paper)" stroke="#ccb5a2" stroke-width="1" opacity=".94"/><path d="m98 155 34 63m66-65-32 66" stroke="#dcc8b4" fill="none"/><path d="M150 200c-41-22-43 21 0 6 31 25 46-20 0-6Z" fill="#c78f9e" stroke="#ae7385"/><path d="m148 207-9 30m12-30 10 26" stroke="#c78f9e" stroke-width="7"/><path d="M236 61v12m-6-6h12" stroke="#bd9e7e" fill="none"/>`,
  medal:`${littleStars}<path class="medal-ribbon" d="m112 147-30 86 41-17 19 22 14-80m12-11 37 86-40-13-21 17-8-78" fill="#c58b99" stroke="#ac7889" stroke-width="1.1"/><g transform="translate(151 113)"><path d="${Array.from({length:32},(_,i)=>{const a=i*Math.PI/16,r=i%2?54:64;return(i?'L':'M')+(Math.cos(a)*r).toFixed(1)+' '+(Math.sin(a)*r).toFixed(1);}).join('')}Z" fill="url(#${id}-gold)" stroke="#b89a67"/><circle r="45" fill="#f2e2bd" stroke="#ba9c70"/><circle r="39" fill="none" stroke="#d2b781" stroke-dasharray="1 5" stroke-linecap="round"/><path d="m0-26 8 17 19 3-14 13 3 19L0 17l-17 9 4-19-14-13 19-3Z" fill="#d0ad71" stroke="#b99663" stroke-width="1"/></g>`,
  plane:`<path d="M66 191c-61-31-29-78 5-52 22 17-5 38-10 17-7-28 62-24 94-33" fill="none" stroke="#c8a78e" stroke-width="1.5" stroke-dasharray="4 6" stroke-linecap="round"/><g class="paper-plane" transform="rotate(-9 170 120)"><path d="m77 112 169-49-62 132-32-49-49 6 7-25Z" fill="url(#${id}-paper)" stroke="#b99c89" stroke-width="1.4"/><path d="m103 151 143-88-94 83m-42-19 136-64m-94 83 32 49" fill="none" stroke="#c9a28f" stroke-width="1.2"/><path d="m152 146-16 24-8-32 118-75Z" fill="#e0b6bb" stroke="#c296a1" stroke-width=".8"/></g><path d="M228 194c-20-12-9-23 0-12 9-11 20 0 0 12Z" fill="#cf9aa6"/><path d="M62 62q-15 31 19 28-35 24-40-4-3-16 21-24Z" fill="#d6bd98"/>`,
  ring:`${littleStars}<ellipse cx="150" cy="219" rx="82" ry="11" fill="#b2787f" opacity=".11"/><path d="M68 157q82-32 164 0v50q-82 38-164 0Z" fill="#b47d8b" stroke="#956374"/><ellipse cx="150" cy="157" rx="82" ry="25" fill="#d8acb3" stroke="#aa7987"/><ellipse cx="150" cy="158" rx="68" ry="18" fill="#926070"/><path d="M71 152V66q79-35 158 0v86q-77-47-158 0Z" fill="#bd8996" stroke="#9e687b"/><path d="M83 132V74q68-26 134 0v58q-69-32-134 0Z" fill="#edcbd0"/><ellipse cx="150" cy="145" rx="26" ry="30" fill="none" stroke="#d8b276" stroke-width="7"/><path d="m133 113 9-13h17l9 13-18 16Z" fill="#fff8e6" stroke="#d0b78f" stroke-width="1.4"/><path d="m133 113 35 0m-26-13 8 29 9-29" fill="none" stroke="#e0c9a4"/>`
 };
 return svg(shapes[kind]||shapes.envelope);
}
function occasionArtFor(g){const o=occasionOf(g);return g.occasion==='proposal'&&g.proposalKind==='marriage'?'ring':o.art;}

/* Every suggestion is written locally, selectable, editable, and never sent for you. */
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
  note:[['A place to start','{name}, I’m sorry. I know a message cannot make things right on its own. I want to take responsibility, listen properly and do better. You don’t owe me a reply or forgiveness.'],['Room for your feelings','I want to apologize, {name}, without asking you to make me feel better. Your feelings matter. I’m ready to listen when you want to talk, and to respect your space when you don’t.'],['More than words','{name}, I’m sorry. I want my actions, not just this note, to show that I mean it. I know that takes time. There is no pressure to respond to this.']],
  finale:[['Your own time','Take the time and space you need. There is no deadline and no expectation here.'],['Ready to listen','When you want to speak, I want to listen. And when you need space, I will respect that.'],['No reply owed','You don’t owe me a reply. I simply wanted to say this clearly and with care.']],
  secret:['You are allowed to feel exactly what you feel.','There is no timer on this. Your space matters.','A conversation, only when you’re ready.'],
  captions:[['A moment kept','A moment I wanted to acknowledge with care.'],['With care','Held gently, without expectations.'],['No pressure','A small memory. No reply needed.']],
  memory:['I’ve been thinking about what this moment meant to you, not just to me.','I want to hold this memory with care, without using it to ask anything of you.','Some things deserve a more thoughtful conversation than I gave them.'],
  replies:[['I need time','I’ve read your note. I need some time and space, and I’d like you to respect that.'],['We can talk','Thank you for acknowledging this. I’m open to a conversation when we can both listen.'],['Received','I’ve read what you wrote. I’m not ready to say more right now.']]
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
 if(kind==='commitment')return rows([['Listen properly','I want to listen without interrupting or defending myself. I’ll respect the time and space you ask for.'],['Ask, don’t assume','I want to ask what would help, rather than decide for you. Then I want to follow through on what I can honestly commit to.'],['Respect the boundary','I will respect your boundaries, including your decision not to respond. I want my next actions to be more thoughtful than my last ones.']]);
 if(kind==='milestone')return rows([['A big new chapter','Your brave new chapter'],['A well-earned win','A well-earned moment'],['All those little steps','The little steps that became something big']]);
 if(kind==='reunion')return rows([['The next hello','Here’s to the next hello. Whenever it comes, I’ll be glad to share it with you.'],['No big plans needed','No big plans needed. A little time together would be lovely.'],['Until then','Until we can share the same little corner of the world, there’s a light for you in mine.']]);
 if(!bank)return null;
 if(kind==='note'){
  const result=rows(bank.note);
  // Preserve the meaning of sensitive copy. Vibe can soften/play up other gifts.
  if(!['apology','proposal'].includes(g.occasion)){
   const touch={Romantic:'Made with a little extra love. ♡',Cute:'A pocket-sized hug, just for you. ♡',Funny:'Yes, I did make a whole little website for this. Very normal of me.',Emotional:'I hope these words find you gently.',Crazy:'A whole little moment for a one-of-a-kind human. ✷',Elegant:'Thoughtfully made, just for you.'}[g.vibe];
   result[2].text+='\n\n'+touch;
  }return result;
 }
 if(kind==='finale')return rows(bank.finale);
 if(kind==='secret')return rows(bank.secret,['A little reminder','A quiet thought','One more little thing']);
 if(kind==='caption')return rows(bank.captions);
 if(kind==='memory')return rows(bank.memory,['A moment to keep','The little things','Another way to say it']);
 if(kind==='memoryWhen')return rows(g.occasion==='anniversary'?['Our beginning','Somewhere along the way','This little chapter']:g.occasion==='apology'?['A moment I’m reflecting on','Something I want to acknowledge','Held with care']:['A little moment','One I’ve kept close','A day worth remembering']);
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
 const soft=occasion==='apology'?'#e7e8d9':occasion==='thanks'?'#f2e9d5':occasion==='missyou'?'#e8dfdc':'#f2e0d6';
 return `<svg viewBox="0 0 420 520" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><radialGradient id="${id}-ambient"><stop stop-color="#fff8e3"/><stop offset="1" stop-color="${soft}"/></radialGradient><radialGradient id="${id}-lamp"><stop stop-color="#ffe1a4" stop-opacity=".8"/><stop offset="1" stop-color="#ffe1a4" stop-opacity="0"/></radialGradient></defs><rect width="420" height="520" fill="url(#${id}-ambient)"/><path d="M60 520V215a150 150 0 0 1 300 0v305" fill="none" stroke="#b995771e"/><path d="M18 58q180 114 385 6M-10 99q225 124 450-10" stroke="#bba187" stroke-width="1.1" fill="none"/>${Array.from({length:13},(_,i)=>{const x=17+i*32,y=63+Math.sin(i/12*Math.PI)*62;return `<path d="M${x} ${y}v12" stroke="#a38c71" stroke-width="1"/><circle cx="${x}" cy="${y+16}" r="20" fill="url(#${id}-lamp)"/><ellipse cx="${x}" cy="${y+16}" rx="3.3" ry="5.5" fill="#f4ce88"/>`;}).join('')}<g fill="none" stroke="#d2b29b" stroke-width="1.1"><path d="m35 234 3 9 9 3-9 3-3 9-3-9-9-3 9-3ZM372 311v15m-7-7h14m-34-119 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/></g><g fill="#c08c98" opacity=".32"><path d="M77 335c-23-14-11-27 0-13 11-14 23 0 0 13Z"/><path d="M344 254c-16-10-8-19 0-9 8-10 16 0 0 9Z"/></g><path d="M0 454q208-18 420 0v66H0Z" fill="#b49a7d" opacity=".05"/></svg>`;
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
 startExperience(g,{preview:true,returnView:'home'});
}
function renderOccasionDetails(force=false){
 const host=$('#occasionDetail');if(!host)return;const key=occasionKey(draft),o=occasionOf(draft);
 host.hidden=key==='birthday';if(key==='birthday'){host.dataset.occasion=key;return;}
 if(!force&&host.dataset.occasion===key)return;host.dataset.occasion=key;
 const field=(id,label,kind,placeholder='',max=160,area=false,extra='')=>`<div class="field-gap"><label class="field-label" for="${id}">${label}<small>Optional</small></label><${area?'textarea':'input'} class="${area?'text-area':'text-input'}" id="${id}" maxlength="${max}" placeholder="${e(placeholder)}" data-occasion-template="${kind}" ${extra}>${area?'</textarea>':''}</div>`;
 let body='';
 if(key==='proposal')body=`<p class="occasion-help">A first date, a relationship, or a lifetime. Choose the kind of question you’re actually asking. The recipient can say yes, ask to talk, decline, or leave it unanswered.</p><div class="field-label" id="proposalKindLabel">What are you asking?</div><div class="proposal-kind" role="group" aria-labelledby="proposalKindLabel">${[['relationship','Be my person'],['date','A little date'],['marriage','Marry me']].map(([value,label])=>`<button type="button" data-proposal-kind="${value}" aria-pressed="${(draft.proposalKind||'relationship')===value}">${label}</button>`).join('')}</div>${field('proposalQuestion','The question, in your words','proposalQuestion',proposalQuestion(draft),140)}<p class="input-help">Blank is lovely too. We’ll use the matching question above. Choosing a new kind never replaces words you’ve written.</p>`;
 if(key==='love'||key==='thanks')body=`<p class="occasion-help">${key==='love'?'Three little paper hearts, with a reason tucked inside each one.':'Three little flowers. Three things you’re grateful for.'} Leave any blank and we’ll add a thoughtful ready-made line.</p>${[0,1,2].map(i=>`<div class="reason-field">${field('reason'+i,key==='love'?'Little reason '+(i+1):'Thank-you flower '+(i+1),'reason',o.reasons[i],160,true,`data-reason="${i}"`)}</div>`).join('')}`;
 if(key==='apology')body=`<p class="occasion-help">Words matter. A specific, realistic action can matter more. Only promise something you intend and are able to do.</p>${field('commitment','One thing you’ll do differently','commitment','A small, concrete next step. In your own words.',300,true)}<p class="occasion-quiet-warning">No games, confetti, deadlines, or requests for forgiveness are added to this journey. Their response stays entirely their choice.</p>`;
 if(key==='anniversary')body=`<p class="occasion-help">A date to put in the front of your little storybook. No countdowns, no calculations—just a day that means something to you.</p><label class="field-label" for="togetherSince">When did your story begin?<small>Optional</small></label><input class="text-input" type="date" id="togetherSince" max="${new Date().toISOString().slice(0,10)}"><p class="input-help">A wedding date, a first date, or a day you both hold close. Leave it out and the storybook is just as lovely.</p>`;
 if(key==='congratulations')body=`<p class="occasion-help">A new job. A finished project. A brave first step. It doesn’t have to be a huge milestone to matter.</p>${field('milestone','What are we celebrating?','milestone','Their well-earned moment',80)}<p class="input-help">This becomes a little dedication under their spotlight. Skip it for a celebration that fits any win.</p>`;
 if(key==='missyou')body=`<p class="occasion-help">A hopeful little thought about being together again. No dates or plans need to be promised.</p>${field('reunionMessage','Until the next hello','reunion','A little thought for when you’re together again…',200,true)}<p class="input-help">This adds one quiet extra chapter. Leave it blank to end with your note and a paper hug.</p>`;
 host.innerHTML=`<summary><span class="detail-icon">${icon(key==='apology'?'pen':key==='anniversary'?'clock':'heart')}</span><span><span class="detail-title">${e(o.detailTitle)}</span><span class="detail-subtitle" style="display:block">A little detail just for this kind of gift</span></span><span class="detail-chevron">${icon('chevron')}</span></summary><div class="detail-body occasion-settings">${body}</div>`;
 const values={proposalQuestion:draft.proposalQuestion,commitment:draft.commitment,togetherSince:draft.togetherSince,milestone:draft.milestone,reunionMessage:draft.reunionMessage};
 for(const [id,value]of Object.entries(values)){const field=$('#'+id);if(field)field.value=value||'';}
 for(let i=0;i<3;i++){const input=$('#reason'+i);if(input)input.value=draft.reasons?.[i]||'';}
 $$('[data-occasion-template]',host).forEach(input=>mountMessageTemplates(input,input.dataset.occasionTemplate));
}
function occasionHasExtras(g=draft){
 return !!(g.proposalQuestion?.trim()||g.proposalKind&&g.proposalKind!=='relationship'||g.reasons?.some(v=>v.trim())||g.commitment?.trim()||g.togetherSince||g.milestone?.trim()||g.reunionMessage?.trim());
}
function updateOccasionUI(){
 if(!$('#occasionRibbon'))return;const key=occasionKey(draft),o=occasionOf(draft),birth=key==='birthday';
 $('#occasionRibbonLabel').innerHTML=`<span aria-hidden="true">${o.symbol}</span> <span>${e(o.label)} <span aria-hidden="true">·</span> made your way</span>`;
 const art=occasionArtFor(draft);if($('#editorRoom').dataset.occasion!==key||$('#editorCake').dataset.art!==art){
  $('#editorRoom').dataset.occasion=key;$('#editorRoomBg').innerHTML=occasionPortraitSVG('editor-room',key);$('#editorCake').innerHTML=occasionArt(art,'editor-object');$('#editorCake').dataset.art=art;
 }
 $('#previewGreeting').textContent=o.greeting;$('#previewName').textContent=draft.name.trim()?draft.name.trim()+'.':'your person.';
 $('#editorRoom .tiny').textContent=o.portrait;$('#editorRoom .small-heart').textContent=o.symbol;
 $('.preview-aside>.eyebrow').textContent='A peek inside their '+(birth?'birthday':'little gift');
 $('#previewLiveTag').textContent=draft.name.trim()?`${draft.name.trim()}’s little ${o.short.toLowerCase()} is ready`:'Their little world is almost ready';
 $('#dockNote').textContent=draft.name.trim()?o.label+' · for '+draft.name.trim()+'.':'A name. That’s all the magic needs.';
 $('#vibePreviewLine').textContent=birth?THEMES[draft.vibe].line:'';
 /* For a birthday the mood rewrites the words. For every other gift it sets the colours and soft sounds, so it is offered as a look, and says so. */
 const captions={Romantic:'Rose & candlelight',Cute:'Soft pink',Funny:'Warm amber',Emotional:'Quiet dusk',Crazy:'Bold terracotta',Elegant:'Muted gold'};
 $('#vibeGrid').classList.toggle('is-look',!birth);
 if($('#vibeLabel'))$('#vibeLabel').innerHTML=(birth?'Pick a mood':'Pick a look')+' <span class="field-hint">'+(birth?'Sets the words, colours and music':'Sets the colours and soft sounds')+'</span>';
 $$('#vibeGrid button').forEach(b=>{b.hidden=key==='apology'&&!['Emotional','Elegant'].includes(b.dataset.vibe);const caption=$('.vibe-caption',b);if(caption)caption.textContent=birth?THEMES[b.dataset.vibe].caption:captions[b.dataset.vibe];});
 const guide=$('#occasionGuide');guide.innerHTML=`<div class="guide-caption">What they will go through</div><ol>${o.path.map(line=>`<li>${e(line)}</li>`).join('')}</ol>`;
 $('[data-step="0"]>.step-count-note').textContent=birth?'Just their name. A beautiful birthday, even without the extras.':'Just their name. A complete '+o.short.toLowerCase()+', even without the extras.';
 $('#noteDetail .detail-title').textContent=o.noteLabel;$('label[for=personalMessage]').textContent=o.noteLabel;
 $('#noteDetail .input-help').textContent='Leave this blank and we’ll tuck in a thoughtful '+(birth?'birthday note':key==='apology'?'apology note':'ready-made note')+'.';
 $('#personalMessage').placeholder=birth?'You know what I love about you? So many things. But let’s start here…':personalize(o.fallback,draft).split('\n')[0].slice(0,170);
 $('#musicDetail .detail-title').textContent=birth?'A birthday soundtrack':key==='apology'?'A quiet little soundtrack':'A little soundtrack';
 $('#funChoices [data-fun=quiz]').innerHTML='<span>?</span>'+(birth?'A tiny birthday quiz':'A tiny little quiz');
 $('#voiceUrl').placeholder='https://…/voice-note.mp3';
 $('#branchToggle').closest('label').hidden=!birth;$('#funDetail').hidden=key==='apology';$('#funMessage').placeholder=birth?'You’re my favorite person in the whole birthday universe.':key==='apology'?'A little thought, held with care.':'A small secret, just for you.';
 $('#quizFields .input-help').textContent='Leave this blank for a ready-made '+(birth?'birthday':'little')+' question. Wrong guesses get a friendly hint, never a dead end.';
 $('#finalDetail .detail-title').textContent=key==='apology'?'One final thought':'One last surprise';
  $('.wizard-steps').setAttribute('aria-label',o.label+' creation steps');renderOccasionDetails();
}
function installOccasions(){
 if(!$('#occasionRibbon'))$('.wizard-steps').insertAdjacentHTML('beforebegin','<div class="occasion-ribbon" id="occasionRibbon"><span class="occasion-ribbon-label" id="occasionRibbonLabel"></span><button type="button" data-v3="change-gift">Change gift</button></div>');
 if(!$('#occasionGuide'))$('[data-step="0"]').insertAdjacentHTML('beforeend','<aside class="occasion-guide" id="occasionGuide" aria-label="A preview of the recipient journey"></aside>');
 if(!$('#occasionDetail'))$('#noteDetail').insertAdjacentHTML('afterend','<details class="detail" id="occasionDetail" hidden></details>');
 $('#editorRoom .portrait-title h2').innerHTML='<span id="previewGreeting">Happy Birthday,</span><br><em id="previewName">your person.</em>';
 $('#giftForm').dataset.v3Installed='true';setHomeOccasion(homeOccasion);
 $('#giftForm').addEventListener('input',event=>{
  const input=event.target,map={proposalQuestion:'proposalQuestion',commitment:'commitment',togetherSince:'togetherSince',milestone:'milestone',reunionMessage:'reunionMessage'};
  if(map[input.id]){draft[map[input.id]]=input.id==='togetherSince'?validStoryDate(input.value):input.value;saveDraft();}
  if(input.dataset.reason!==undefined){draft.reasons=draft.reasons||['','',''];draft.reasons[Number(input.dataset.reason)]=input.value;saveDraft();}
 });
 document.addEventListener('click',event=>{
  const campaign=event.target.closest('[data-campaign]');if(campaign){event.preventDefault();openCampaign(campaign.dataset.campaign);return;}
  const choice=event.target.closest('[data-choose-occasion]');if(choice){event.preventDefault();openCreator(choice.dataset.chooseOccasion);return;}
  const demo=event.target.closest('[data-home-occasion]');if(demo){setHomeOccasion(demo.dataset.homeOccasion,true);return;}
  const kind=event.target.closest('[data-proposal-kind]');if(kind){draft.proposalKind=kind.dataset.proposalKind;$$('[data-proposal-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.proposalKind===draft.proposalKind)));$('#proposalQuestion').placeholder=PROPOSAL_QUESTIONS[draft.proposalKind];refreshMessageTemplates();updateOccasionUI();saveDraft();return;}
  const b=event.target.closest('[data-v3]');if(!b)return;event.preventDefault();
  switch(b.dataset.v3){
   case'change-gift':browseGifts();break;
   case'unlock':unlockGift();break;
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
   case'quiet-close':goToScene(scenes.indexOf('celebration'));break;
   case'finish-reading':showQuietFinish();break;
  }
 });
 // Do not let an old prepared reply be shared after the text or reaction changes.
 $('#experience').addEventListener('input',event=>{if(event.target.id==='recipientReply'){replySharedText='';if($('#replyResult'))$('#replyResult').innerHTML='';}});
}
function renderOccasionReview(){
 const g=sanitizeGift(draft,false),o=occasionOf(g);const labels={opening:'A little light',birthday:'Their birthday',cake:'Make a wish',choice:'A tiny choice',gift:'Open a gift',welcome:'A personal welcome',message:'Your note',hearts:'Three little hearts',bouquet:'A gratitude bouquet',storybook:'Our little storybook',ribbon:'A ribbon reveal',distance:'A paper hug',proposal:'Your little question',accountability:'An honest next step',reunion:'The next hello',photos:g.photos.length+' photos',memories:'Little memories',voice:'Your voice',fun:'A playful detour',final:g.occasion==='apology'?'One final thought':'One more surprise',celebration:g.occasion==='apology'?'A little space':'A lovely ending',reply:'An optional reply'};
 const parts=buildScenes(g).map(k=>labels[k]);
 $('#reviewSummary').innerHTML=`<p class="v3-occasion-review">${e(o.label)} · made your way</p><div class="ready-stamp"><span>${o.symbol}</span><span>For ${e(g.name||'your person')}.<br><em>A whole little ${g.vibe.toLowerCase()} world.</em></span></div><div class="story-itinerary">${parts.map(p=>'<span>'+e(p)+'</span>').join('')}</div><p class="step-help">${g.message?'Your own words are tucked inside.':'A thoughtful '+(g.occasion==='birthday'?'birthday':'ready-made')+' note is already tucked inside.'} ${g.music==='none'?'Soft interaction sounds, no background music.':'A little soundtrack, at '+Math.round(g.volume*100)+'% volume.'}</p>${g.occasion==='proposal'?'<p class="occasion-quiet-warning">They can say yes, ask to talk, decline, or leave the question unanswered. No reply is sent automatically.</p>':g.occasion==='apology'?'<p class="occasion-quiet-warning">A quiet ending. No confetti, games or pressure to forgive. They can finish reading without replying.</p>':''}<div class="review-touches"><span>${touchCount()?touchCount()+' little '+(touchCount()===1?'touch':'touches')+' tucked inside':'Little touches: kept simple. Just as lovely.'}</span><button type="button" data-v2="edit-touches">${touchCount()?'Edit little touches':'Add little touches'} ${icon('arrow')}</button></div>`;
 updateDelivery();
}

function finishOccasionRender(type){
 const scene=$('#storyScene');$('#storyScroll').scrollTop=0;
 $('#storyProgress').innerHTML=scenes.slice(1).map((_,i)=>`<span class="story-dot ${i+1===sceneIndex?'active':i+1<sceneIndex?'past':''}"></span>`).join('');
 $('#storyAnnouncement').textContent=occasionOf(gift).label+': moment '+sceneIndex+' of '+(scenes.length-1)+'.';
 requestAnimationFrame(()=>$('h1',scene)?.focus({preventScroll:true}));
}
function renderOccasionScene(type){
 const o=occasionOf(gift),name=e(gift.name),s=$('#storyScene');
 const custom=['welcome','hearts','bouquet','storybook','ribbon','distance','proposal','accountability','reunion'];
 if(!custom.includes(type)&&!(gift.occasion!=='birthday'&&['gift','celebration'].includes(type)))return false;
 s.className='story-scene '+type+'-scene';
 if(type==='welcome')s.innerHTML=`<div class="occasion-welcome-art">${occasionArt(occasionArtFor(gift),'welcome-object')}</div>${sceneTitle(`${e(o.greeting)}<span class="name-line${gift.name.length>18?' long-name':''}"><em>${name}.</em></span>`,e(o.eyebrow))}<p class="story-description">${e(o.welcome)}</p>${gift.occasion==='congratulations'&&gift.milestone?`<p class="achievement-note">${e(gift.milestone)}</p>`:''}${storyButton(gift.occasion==='apology'?'Read when you’re ready':gift.occasion==='love'?'There are a few little reasons':gift.occasion==='thanks'?'A little bouquet for you':gift.occasion==='anniversary'?'Open our little story':gift.occasion==='missyou'?'Catch a little hug':'Step a little closer')}${gift.occasion==='apology'?'<button class="story-soft-skip" data-v3="quiet-close">Not right now. I need some space.</button>':''}`;
 if(type==='gift')s.innerHTML=`${sceneTitle(gift.occasion==='apology'?'A few words.<br><em>Said with care.</em>':'Some words,<br><em>sealed with a little courage.</em>',gift.occasion==='apology'?'No expectations tucked inside':'A little note, from the heart')}<button class="story-object" data-v3="open-note" aria-label="Unfold the personal note">${occasionArt('envelope','story-envelope')}<span class="object-tap">${icon('hand')}</span></button><p class="story-footnote soft" id="noteInstruction">${gift.occasion==='apology'?'Unfold it whenever you’re ready.':'A little envelope. A lot inside.'}</p><div id="occasionAfter" aria-live="polite"></div>`;
 if(type==='hearts'){
  openedNotes=new Set();s.innerHTML=`${sceneTitle('A few little reasons.<br><em>All of them you.</em>','Three paper hearts, folded with love')}<p class="story-description">Each little heart has something to tell you.</p><div class="heart-notes">${[0,1,2].map(i=>`<button class="heart-note" data-v3="heart-note" data-note="${i}" aria-pressed="false" aria-label="Unfold heart ${i+1}"><span aria-hidden="true">♡</span><small>open me · 0${i+1}</small></button>`).join('')}</div><p class="note-progress" id="noteProgress" role="status">0 of 3 little hearts unfolded</p>${storyButton('Keep a little love with me')}`;
 }
 if(type==='bouquet'){
  openedNotes=new Set();s.innerHTML=`${sceneTitle('A little bouquet.<br><em>For a lot of kindness.</em>','One flower. One little thank-you.')}<div class="gratitude-bouquet" id="gratitudeBouquet" data-bloomed="0">${occasionArt('bouquet','gratitude-bouquet')}</div><div class="gratitude-petals" role="group" aria-label="Open each gratitude flower">${[0,1,2].map(i=>`<button data-v3="flower" data-note="${i}" aria-pressed="false" aria-label="Open thank-you flower ${i+1}">${['✿','❀','✾'][i]}</button>`).join('')}</div><p class="gratitude-message" id="gratitudeMessage" aria-live="polite">Tap a little flower.<br>There’s a thank-you inside.</p><p class="note-progress" id="noteProgress" role="status">0 of 3 thank-yous gathered</p>${storyButton('Keep the bouquet close')}`;
 }
 if(type==='storybook'){
  chapterIndex=0;s.innerHTML=`${sceneTitle('Our little story.<br><em>Still unfolding.</em>','A few pages worth keeping')}${gift.togetherSince?`<p class="story-date">Since ${e(new Intl.DateTimeFormat('en',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(gift.togetherSince+'T12:00:00Z')))}</p>`:''}<article class="storybook" id="storyBook" aria-live="polite"></article><button class="btn story-btn" data-v3="turn-page" id="turnPage">Turn the little page ${icon('arrow')}</button><button class="story-soft-skip" data-story="next">Read the note inside</button>`;paintStoryPage();
 }
 if(type==='ribbon')s.innerHTML=`${sceneTitle('A little ribbon.<br><em>A very big well done.</em>','Go on. This moment belongs to you.')}<button class="story-object" data-v3="untie-ribbon" aria-label="Untie your celebration ribbon">${occasionArt('medal','achievement-ribbon')}<span class="object-tap">${icon('hand')}</span></button><p class="story-footnote soft" id="ribbonInstruction">Tap to untie your little celebration.</p><div id="occasionAfter" aria-live="polite"></div>`;
 if(type==='distance')s.innerHTML=`${sceneTitle('A paper hug.<br><em>All the way to you.</em>','Some little things can cross the distance')}<div class="distance-route" id="distanceRoute">${occasionArt('plane','travelling-hug')}<div class="distance-label"><span>from over here</span><span>to lovely you</span></div></div><button class="btn story-btn" data-v3="send-hug" id="sendPaperHug">Catch your paper hug ${icon('heart')}</button><div id="occasionAfter" aria-live="polite"></div>`;
 if(type==='proposal')s.innerHTML=`${sceneTitle('One little question.<br><em>From the heart.</em>','A moment for the butterflies')}<button class="story-object" data-v3="reveal-question" aria-label="Open the little proposal question">${occasionArt(occasionArtFor(gift),'proposal-object')}<span class="object-tap">${icon('hand')}</span></button><p class="story-footnote soft" id="proposalInstruction">You don’t owe this question a particular answer.</p><div id="proposalReveal" class="occasion-reveal" hidden></div><button class="story-soft-skip" data-v3="no-answer">Continue without answering</button>`;
 if(type==='accountability')s.innerHTML=`<span class="quiet-stamp" aria-hidden="true">❦</span>${sceneTitle('More than words.<br><em>A small next step.</em>','An intention to follow through')}<article class="letter-paper"><p class="letter-text">${e(gift.commitment)}</p></article><p class="story-footnote soft">This is theirs to follow through on. You don’t have to do anything in return.</p>${storyButton('Keep reading, gently')}`;
 if(type==='reunion')s.innerHTML=`<div class="occasion-welcome-art">${occasionArt('plane','next-hello')}</div>${sceneTitle('Until the next<br><em>little hello.</em>','A hopeful thought, from over here')}<p class="final-surprise-note">${e(gift.reunionMessage)}</p>${storyButton('Keep a little light for me')}`;
 if(type==='celebration'){
  const quiet=gift.occasion==='apology'||gift.occasion==='missyou'||gift.occasion==='proposal'&&proposalAnswer!=='yes';
  let title=o.finalTitle,ending=o.finish;
  if(gift.occasion==='proposal'&&proposalAnswer==='yes'){title='A little yes.<br><em>A lovely beginning.</em>';ending='A moment to keep close. Your answer is still yours to share, when you’re ready.';}
  if(gift.occasion==='proposal'&&proposalAnswer==='no'){title='Thank you<br><em>for being honest.</em>';ending='Your answer deserves care and respect. Nothing has been sent. Share it only when you choose to.';}
  if(gift.occasion==='proposal'&&proposalAnswer==='talk'){title='A little room<br><em>for a conversation.</em>';ending='No rush to decide. Nothing has been sent. You can share your words when you’re ready.';}
  s.classList.toggle('quiet-ending',quiet);
  s.innerHTML=`<div class="${quiet?'quiet-stamp':'celebration-halo'}" aria-hidden="true">${o.symbol}</div>${sceneTitle(title,gift.occasion==='apology'?'Your feelings. Your time.':'Made with a little heart')}<p class="finale-words" aria-label="${e(ending)}">${ending.split(' ').map((w,i)=>`<span class="fw" aria-hidden="true" style="--w:${i}">${e(w)}</span>`).join(' ')}</p>${gift.photos.length&&gift.occasion!=='apology'&&!quiet&&!reducedMotion?finaleReel():gift.photos.length&&gift.occasion!=='apology'?`<div class="finale-montage" aria-label="A few little moments to keep">${gift.photos.map((p,i)=>`<figure class="finale-photo" style="--delay:${i*.18}s"><div><img src="${e(p.src)}" alt="${e(p.caption||'A favorite moment')}" style="${cropStyle(p)}" referrerpolicy="no-referrer"></div></figure>`).join('')}</div>`:''}<p class="final-dedication">Made especially for you. ${gift.occasion==='apology'?'With care.':'♡'}${gift.sender?'<br><span style="font-size:14px">From '+e(gift.sender)+'.</span>':''}</p>${storyButton(gift.occasion==='apology'||gift.occasion==='proposal'?'Leave a reply, only if you’d like':'Send a little feeling back')}${quiet?'<button class="story-soft-skip" data-v3="finish-reading">Finish here. No reply needed.</button>':''}`;
  $$('.finale-photo img',s).forEach(img=>img.addEventListener('error',()=>img.closest('figure').hidden=true,{once:true}));
  startReel(experienceToken);
  if(!quiet){const token=experienceToken;finaleTimer=setTimeout(()=>{if(token!==experienceToken||scenes[sceneIndex]!==type)return;confetti(gift.occasion==='congratulations'?100:46);swellMusic();},reducedMotion?0:600);}
 }
 finishOccasionRender(type);return true;
}
function openOccasionNote(button){
 if(button.classList.contains('opened'))return;button.classList.add('opened');button.disabled=true;chime();
 $('#noteInstruction').textContent=gift.occasion==='apology'?'Take it at your own pace.':'A little courage, all unfolded.';
 $('#occasionAfter').innerHTML=storyButton('Read the words inside');
}
function openHeartNote(button){
 const i=Number(button.dataset.note);if(openedNotes.has(i))return;openedNotes.add(i);
 const text=gift.reasons?.[i]?.trim()||OCCASIONS.love.reasons[i];
 button.classList.add('revealed');button.setAttribute('aria-pressed','true');button.setAttribute('aria-label','Heart '+(i+1)+': '+text);
 button.innerHTML='<span aria-hidden="true">♡</span><p>'+e(text)+'</p>';
 $('#noteProgress').textContent=openedNotes.size+' of 3 little hearts unfolded';chime('soft');
}
function pickFlower(button){
 const i=Number(button.dataset.note);openedNotes.add(i);button.setAttribute('aria-pressed','true');
 $('#gratitudeBouquet').dataset.bloomed=String(openedNotes.size);$('#gratitudeMessage').textContent=gift.reasons?.[i]?.trim()||OCCASIONS.thanks.reasons[i];
 $('#noteProgress').textContent=openedNotes.size+' of 3 thank-yous gathered';chime('soft');
}
function paintStoryPage(){
 const pages=[['Our beginning','Every story has a little beginning. I’m glad ours found its way here.'],['The everyday','The familiar smiles. The little conversations. The ordinary moments that slowly become a life.'],['What comes next','More days to discover. More little things to learn about each other. More pages to write, together.']];
 const [title,text]=pages[chapterIndex];$('#storyBook').innerHTML=`<span class="book-ribbon" aria-hidden="true"></span><span class="page-number">OUR LITTLE STORY · 0${chapterIndex+1} / 03</span><h2>${title}</h2><p>${text}</p>`;
 $('#turnPage').innerHTML=(chapterIndex===2?'And a note for this chapter':'Turn the little page')+' '+icon('arrow');
}
function turnStoryPage(){if(chapterIndex>=2){goToScene(sceneIndex+1);return;}chapterIndex++;paintStoryPage();chime('soft');}
function untieRibbon(button){
 if(button.classList.contains('opened'))return;button.classList.add('opened');button.disabled=true;$('#ribbonInstruction').textContent='A well-earned moment. Let yourself enjoy it.';
 $('#occasionAfter').innerHTML=`<div class="occasion-reveal"><p>${e(gift.milestone||'Here’s to the effort, the courage, and the little steps that got you here.')}</p></div>${storyButton('There’s a little cheering inside')}`;
 confetti(42);chime('wish');
}
async function sendPaperHug(button){
 if(button.disabled)return;button.disabled=true;$('#distanceRoute').classList.add('sent');const token=experienceToken;chime('soft');
 await sleep(gift.motion?900:0);if(token!==experienceToken||scenes[sceneIndex]!=='distance')return;
 button.hidden=true;$('#occasionAfter').innerHTML=`<div class="occasion-reveal"><p>A little hug, delivered to your corner of the world. Keep it as long as you need.</p></div>${storyButton('A note came with it')}`;
}
function revealProposal(button){
 if(button.disabled)return;button.disabled=true;$('#storyScene').classList.add('question-revealed');$('#proposalInstruction').hidden=true;const reveal=$('#proposalReveal');reveal.hidden=false;
 reveal.innerHTML=`<h2 class="proposal-question" tabindex="-1">${e(proposalQuestion(gift))}</h2><div class="proposal-responses" role="group" aria-label="Your answer, entirely your choice">${[['yes','Yes, I’d love to'],['talk','Let’s talk about it'],['no','Not for me']].map(([key,label])=>`<button data-v3="proposal-answer" data-answer="${key}" aria-pressed="false">${label}</button>`).join('')}</div><p class="proposal-response-note" id="proposalResponseNote" role="status">Choose only what feels true. Nothing is sent until you choose to share your reply.</p><div id="proposalContinue"></div>`;
 $('.proposal-question',reveal).focus({preventScroll:true});chime('soft');
}
function chooseProposalAnswer(button){
 proposalAnswer=button.dataset.answer;
 journeyReply=proposalAnswer==='yes'?'Yes, I’d love to. Thank you for asking with so much care. ♡':proposalAnswer==='talk'?'Thank you for asking. I’d like to talk about it before I answer.':'Thank you for asking so thoughtfully. I don’t feel the same way, and I wanted to be honest with you.';
 $$('[data-v3=proposal-answer]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 $('#proposalResponseNote').textContent='Your choice is here, just for you. You can edit it before sharing, or keep it private.';
 $('#proposalContinue').innerHTML=storyButton('Keep going, at my pace');chime('soft');
}
function showQuietFinish(){
 const s=$('#storyScene');s.className='story-scene quiet-finish-scene';
 s.innerHTML=`<span class="quiet-stamp" aria-hidden="true">${occasionOf(gift).symbol}</span>${sceneTitle('You can leave<br><em>it here.</em>','Nothing more is needed')}<p class="end-note">Thank you for sharing this little moment.</p><p class="story-footnote soft">You can close this tab whenever you’re ready. No reply has been sent by this screen.</p><button class="story-soft-skip" data-story="replay">Read it again another time</button>`;
 $('#storyProgress').innerHTML='';$('#storyAnnouncement').textContent='End of the note. No reply is required.';$('h1',s).focus({preventScroll:true});
}
function adaptOccasionScene(type,s){
 if(gift.occasion==='birthday')return;const o=occasionOf(gift);
 if(type==='opening'){
  $('.story-title',s).innerHTML=o.opening;$('.story-description',s).textContent=gift.occasion==='apology'?'A little light, and some words said with care. Open them whenever you’re ready.':'Someone made a little space in the world for you. It starts with one small light.';
  if(gift.occasion==='apology')$('.opening-bottom',s).textContent='No rush. This moment can wait.';
 }
 if(type==='message'){
  $('.letter-sign',s).innerHTML=gift.sender?(gift.occasion==='apology'?'With care,<br>':'From my little corner,<br>')+e(gift.sender):gift.occasion==='apology'?'Said with care. Without expectations.':'A little heart, tucked into a note.';
  const next=$('[data-story=next]',s);if(next)next.innerHTML=(gift.occasion==='apology'?'A little more, at your pace':'There’s a little more')+' '+icon('arrow');
 }
 if(type==='memories'&&gift.occasion==='apology'){
  $('.story-title',s).innerHTML='A little moment.<br><em>Held with care.</em>';$('.story-eyebrow',s).textContent='A thought, not an expectation';
  $('[data-story=next]',s).innerHTML='Keep reading, gently '+icon('arrow');
 }
 if(type==='voice'){
  $('[data-story=next]',s).innerHTML='There’s a little more '+icon('arrow');
  if(gift.occasion==='apology')$('.story-eyebrow',s).textContent='Listen when you’re ready';
 }
 if(type==='final'){
  $('.story-eyebrow',s).textContent=gift.occasion==='apology'?'One final thought':'A little something, just for you';
  if(gift.occasion==='apology')$('.story-title',s).innerHTML='One more thought.<br><em>Said gently.</em>';
  $('[data-story=next]',s).innerHTML=(gift.occasion==='apology'?'Take a little space':'One last little moment')+' '+icon('arrow');
 }
 if(type==='fun'){
  const eyebrow=$('.story-eyebrow',s);if(eyebrow)eyebrow.textContent=eyebrow.textContent.replace(/birthday/gi,'little');
 }
 if(type==='reply'){
  $('.story-eyebrow',s).textContent=gift.occasion==='apology'?'Only if you’d like to respond':'A little feeling, in your own words';
  $('.story-title',s).innerHTML=gift.occasion==='apology'?'Your feelings.<br><em>Your own words.</em>':gift.occasion==='proposal'?'Your answer.<br><em>In your own words.</em>':'A little feeling,<br><em>sent back with care.</em>';
  $('.story-description',s).textContent=gift.occasion==='apology'?'A reply is optional. So is forgiveness. Say only what feels true.':'An emoji, a few words, or simply keeping this moment. It’s up to you.';
  const quiet=gift.occasion==='apology',reactions=quiet?QUIET_REACTIONS:GENERIC_REACTIONS;
  $('.reactions',s).setAttribute('aria-label','Choose a feeling, optionally');$('.reactions',s).innerHTML=reactions.map(([emoji,label])=>`<button class="reaction-btn" data-reaction="${emoji}" aria-label="${label}" aria-pressed="false">${emoji}</button>`).join('');
  reaction='';$('#recipientReply').placeholder=quiet?'Your honest words… only if you’d like to reply.':gift.occasion==='proposal'?'Your answer, in your own words…':'A little feeling, in your own words… (optional)';
  if(gift.occasion==='proposal'&&journeyReply){$('#recipientReply').value=journeyReply;}
  else{try{const old=JSON.parse(localStorage.getItem('luv4u.reply.'+gift.id)||'null');if(old){$('#recipientReply').value=cleanText(old.text,500);if(reactions.some(v=>v[0]===old.reaction))selectReaction(old.reaction,false);}}catch{}}
  $('.reply-form [data-story=prepare-reply]',s).innerHTML='Prepare my reply '+icon('heart');
  if(quiet||gift.occasion==='proposal')$('.reply-form',s).insertAdjacentHTML('beforeend','<p class="reply-template-boundary">Choosing words doesn’t send them. Your reply stays here until you use a sharing or send button.</p><button class="story-soft-skip" data-v3="finish-reading">Finish without replying</button>');
  refreshMessageTemplates();
 }
 $('#storyAnnouncement').textContent=type==='opening'?'Your little '+o.short.toLowerCase()+' is waiting.':o.label+': moment '+sceneIndex+' of '+(scenes.length-1)+'.';
}

const CAMPAIGN_HEADINGS={birthday:'A birthday wish.<br>A whole little<br><em>world.</em>',proposal:'A brave question.<br>A little room for<br><em>butterflies.</em>',love:'No big occasion.<br>Just a whole lot of<br><em>love.</em>',apology:'Honest words.<br>A little room to<br><em>be heard.</em>',anniversary:'Your little story.<br>Another lovely<br><em>chapter.</em>',thanks:'A little bouquet.<br>A whole lot of<br><em>thank you.</em>',congratulations:'Their little win.<br>A very well-earned<br><em>spotlight.</em>',missyou:'A paper hug.<br>For the one you<br><em>miss.</em>'};
function applyCampaign(key,keepTitle=false){
 if(!Object.hasOwn(OCCASIONS,key))return;const o=OCCASIONS[key];showView('home');
 $('#landingTitle').innerHTML=CAMPAIGN_HEADINGS[key];$('#landingLead').textContent=o.description;const b=$('#primaryCreate');b.removeAttribute('data-action');b.dataset.chooseOccasion=key;b.innerHTML=e(o.cta)+' '+icon('arrow');
 setHomeOccasion(key);if(!keepTitle)document.title=o.label+' website · Luv4u';
}
function resetLanding(){
 if(!$('#landingTitle'))return;$('#landingTitle').innerHTML='Some feelings<br>deserve a little<br><em>magic.</em>';$('#landingLead').innerHTML='More than a message. A little world they get to<br>open, feel, and keep. Made by you, just for them.';
 const b=$('#primaryCreate');delete b.dataset.chooseOccasion;b.dataset.action='create';b.innerHTML='Make a gift '+icon('spark');setHomeOccasion(homeOccasion);
}

function openCampaign(key){
 if(!Object.hasOwn(OCCASIONS,key))return;
 clearGiftHash();try{history.replaceState(null,'',backendReady?'/for/'+OCCASIONS[key].slug:location.pathname+'#occasion='+key);}catch{}
 applyCampaign(key);window.scrollTo({top:0,behavior:'instant'});$('#landingTitle').setAttribute('tabindex','-1');$('#landingTitle').focus({preventScroll:true});
}

/* BOOT_V2 */
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
