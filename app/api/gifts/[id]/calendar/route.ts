import { assertId, findGift, isExpired, isScheduled, isUnlocked } from '@/lib/gifts';
import { ApiError, handle, requireBackend } from '@/lib/http';
import { siteUrl } from '@/lib/env';

export const dynamic = 'force-dynamic';

interface WeddingEvent {
  title?: string;
  date?: string;
  time?: string;
  venue?: string;
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
const utc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const ymd = (s: string) => s.replace(/-/g, '');
const nextDay = (s: string) => new Date(Date.parse(`${s}T12:00:00Z`) + 864e5).toISOString().slice(0, 10);
/** Lines longer than 75 octets are folded, as the calendar format asks. */
const fold = (line: string) => {
  const out: string[] = [];
  let rest = line;
  while (Buffer.byteLength(rest) > 74) {
    let cut = 74;
    while (Buffer.byteLength(rest.slice(0, cut)) > 74) cut--;
    out.push(rest.slice(0, cut));
    rest = ' ' + rest.slice(cut);
  }
  return [...out, rest].join('\r\n');
};

/**
 * GET: a wedding invite's functions as a calendar file (.ics), so "Save the date" on an iPhone opens Calendar with
 * every function ready to add. `?e=<index>` gives one function. Only for an unlocked, public invite. Times are India time.
 */
export const GET = handle(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const unavailable = requireBackend();
  if (unavailable) return unavailable;
  const { id } = await params;
  assertId(id);
  const row = await findGift(id);
  if (!row || !isUnlocked(row) || isExpired(row.expires_at) || isScheduled(row)) throw new ApiError(404, 'Invite not found.');
  const gift = row.gift as Record<string, unknown>;
  if (gift.occasion !== 'wedding') throw new ApiError(404, 'Invite not found.');

  const all = (Array.isArray(gift.events) ? gift.events : []) as WeddingEvent[];
  const pick = new URL(request.url).searchParams.get('e');
  const chosen = pick !== null && /^\d$/.test(pick) ? [all[Number(pick)]].filter(Boolean) : all;
  const couple = [gift.name, gift.partner].map((v) => String(v ?? '').trim()).filter(Boolean).join(' & ');
  const link = `${siteUrl()}/g/${id}`;
  const stamp = utc(new Date());

  const events = chosen
    .filter((ev) => /^\d{4}-\d{2}-\d{2}$/.test(ev.date ?? ''))
    .map((ev, i) => {
      const date = ev.date as string;
      const when = /^\d{2}:\d{2}$/.test(ev.time ?? '')
        ? (() => {
            const start = new Date(`${date}T${ev.time}:00+05:30`);
            return [`DTSTART:${utc(start)}`, `DTEND:${utc(new Date(start.getTime() + 4 * 36e5))}`];
          })()
        : [`DTSTART;VALUE=DATE:${ymd(date)}`, `DTEND;VALUE=DATE:${ymd(nextDay(date))}`];
      const title = `${String(ev.title ?? '').trim() || 'Wedding'}${couple ? ` · ${couple}` : ''}`;
      return [
        'BEGIN:VEVENT',
        `UID:${id}-${pick ?? i}@kholona.in`,
        `DTSTAMP:${stamp}`,
        ...when,
        `SUMMARY:${esc(title)}`,
        ...(ev.venue ? [`LOCATION:${esc(String(ev.venue))}`] : []),
        `DESCRIPTION:${esc(`You’re invited 💛 ${link}`)}`,
        `URL:${link}`,
        'END:VEVENT',
      ];
    })
    .flat();
  if (!events.length) throw new ApiError(404, 'No dates in this invite yet.');

  const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kholona//Wedding invite//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${esc(couple || 'Wedding')}`, ...events, 'END:VCALENDAR']
    .map(fold)
    .join('\r\n');
  return new Response(body + '\r\n', {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `inline; filename="${couple ? couple.replace(/[^\w &-]/g, '').replace(/\s+/g, '-').toLowerCase() : 'wedding'}.ics"`,
      'cache-control': 'public, max-age=300',
    },
  });
});
