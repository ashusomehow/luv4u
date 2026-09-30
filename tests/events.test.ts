import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeSupabase } from './fake-supabase';

const fake = new FakeSupabase();
let configured = true;
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: () => configured,
  supabase: () => fake,
}));

import { POST } from '@/app/api/events/route';
import { cleanEvent, normalizePath } from '@/lib/events';

const SESSION = 'a1b2c3d4e5f6a1b2c3d4e5f6';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request('https://luv4u.test/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': UA, ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  fake.tables = {};
  configured = true;
});

describe('cleanEvent', () => {
  it('accepts an allowlisted event and keeps only known fields', () => {
    const event = cleanEvent({
      name: 'wizard_next',
      session: SESSION,
      occasion: 'love',
      path: '/for/show-your-love?utm_source=x',
      referrer: 'google.com',
      utm_source: 'insta',
      props: { label: 'Wrap it up', name: 'Sarah Connor', message: 'secret' },
    });
    expect(event).toMatchObject({ name: 'wizard_next', occasion: 'love', path: '/for/show-your-love', referrer: 'google.com', utm_source: 'insta' });
    expect(event?.props).toEqual({ label: 'Wrap it up' });
  });

  it('rejects unknown events and malformed sessions', () => {
    expect(cleanEvent({ name: 'drop_table', session: SESSION })).toBeNull();
    expect(cleanEvent({ name: 'page_view', session: 'short' })).toBeNull();
    expect(cleanEvent({ name: 'page_view' })).toBeNull();
    expect(cleanEvent(null)).toBeNull();
  });

  it('drops an unknown occasion instead of storing it', () => {
    expect(cleanEvent({ name: 'page_view', session: SESSION, occasion: 'nope' })?.occasion).toBeNull();
  });

  it('never stores a private gift id in the path', () => {
    expect(normalizePath('/g/a1b2c3d4e5f6a1b2c3d4e5f6')).toBe('/g/:id');
    expect(normalizePath('/g/abc/whatever?x=1#frag')).toBe('/g/:id/whatever');
    expect(normalizePath('/edit/secret-key')).toBe('/edit');
    expect(normalizePath('not-a-path')).toBeNull();
  });
});

describe('POST /api/events', () => {
  it('stores a clean event and answers 204', async () => {
    const res = await post({ name: 'page_view', session: SESSION, path: '/g/a1b2c3d4e5f6a1b2c3d4e5f6' });
    expect(res.status).toBe(204);
    expect(fake.tables.events).toHaveLength(1);
    expect(fake.tables.events[0]).toMatchObject({ name: 'page_view', path: '/g/:id', session_id: SESSION });
  });

  it('is a silent no-op for bad input, bots, Do Not Track and Global Privacy Control', async () => {
    expect((await post('not json')).status).toBe(204);
    expect((await post({ name: 'nope', session: SESSION })).status).toBe(204);
    expect((await post({ name: 'page_view', session: SESSION }, { 'user-agent': 'Googlebot/2.1' })).status).toBe(204);
    expect((await post({ name: 'page_view', session: SESSION }, { dnt: '1' })).status).toBe(204);
    expect((await post({ name: 'page_view', session: SESSION }, { 'sec-gpc': '1' })).status).toBe(204);
    expect(fake.tables.events ?? []).toHaveLength(0);
  });

  it('does nothing when Supabase is not configured', async () => {
    configured = false;
    expect((await post({ name: 'page_view', session: SESSION })).status).toBe(204);
    expect(fake.tables.events ?? []).toHaveLength(0);
  });

  it('never fails the caller when the database errors', async () => {
    vi.spyOn(fake, 'from').mockImplementationOnce(() => {
      throw new Error('db down');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await post({ name: 'page_view', session: SESSION })).status).toBe(204);
  });
});
