import { isOccasionKey, type OccasionKey } from './occasions';

/** Every event the app may record. Anything else is dropped. */
export const EVENT_NAMES = [
  'page_view',
  'occasion_selected',
  'creator_opened',
  'wizard_next',
  'publish_clicked',
  'gift_published',
  'preview_opened',
  'link_copied',
  'whatsapp_clicked',
  'download_clicked',
  'gift_opened',
  'reply_sent',
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export interface CleanEvent {
  name: EventName;
  session_id: string;
  occasion: OccasionKey | null;
  path: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  props: Record<string, string>;
}

const SESSION_PATTERN = /^[a-f0-9]{16,32}$/;
const BOT_PATTERN = /bot|crawl|spider|slurp|headless|lighthouse|preview|monitor|curl|wget/i;
// Only these prop keys are kept, so free text (names, messages) can never be stored.
const PROP_KEYS = ['label', 'step', 'delivery', 'kind'] as const;

function text(value: unknown, max: number): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;
}

/** `/g/<id>` links are private; store the route pattern, never the id. */
export function normalizePath(value: unknown): string | null {
  const path = text(value, 200);
  if (!path?.startsWith('/')) return null;
  return path.split(/[?#]/)[0].replace(/^\/g\/[^/]+/, '/g/:id').replace(/^\/edit\/.*/, '/edit');
}

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

/** Respects Do Not Track and Global Privacy Control. */
export function optedOut(headers: Headers): boolean {
  return headers.get('dnt') === '1' || headers.get('sec-gpc') === '1';
}

export function cleanEvent(input: unknown): CleanEvent | null {
  if (!input || typeof input !== 'object') return null;
  const body = input as Record<string, unknown>;
  const name = body.name;
  const session = text(body.session, 32);
  if (typeof name !== 'string' || !(EVENT_NAMES as readonly string[]).includes(name)) return null;
  if (!session || !SESSION_PATTERN.test(session)) return null;

  const props: Record<string, string> = {};
  const raw = body.props && typeof body.props === 'object' ? (body.props as Record<string, unknown>) : {};
  for (const key of PROP_KEYS) {
    const value = text(raw[key], 60);
    if (value) props[key] = value;
  }

  return {
    name: name as EventName,
    session_id: session,
    occasion: isOccasionKey(body.occasion) ? body.occasion : null,
    path: normalizePath(body.path),
    referrer: text(body.referrer, 100),
    utm_source: text(body.utm_source, 60),
    utm_medium: text(body.utm_medium, 60),
    utm_campaign: text(body.utm_campaign, 60),
    props,
  };
}
