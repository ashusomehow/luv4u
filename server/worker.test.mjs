import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.mjs';
import { OCCASIONS, OCCASION_KEYS } from './occasions.mjs';

test('Occasions registry contains all 8 defined occasions', () => {
  assert.equal(OCCASION_KEYS.length, 8);
  const expected = ['birthday', 'proposal', 'love', 'apology', 'anniversary', 'thanks', 'congratulations', 'missyou'];
  assert.deepEqual(OCCASION_KEYS.sort(), expected.sort());

  for (const key of OCCASION_KEYS) {
    const occ = OCCASIONS[key];
    assert.ok(occ.slug, `${key} must have slug`);
    assert.ok(occ.label, `${key} must have label`);
    assert.ok(occ.description, `${key} must have description`);
  }
});

test('Worker handles /robots.txt', async () => {
  const req = new Request('https://luv4u.fun/robots.txt');
  const res = await worker.fetch(req, {});
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.ok(text.includes('Disallow: /api/'));
  assert.ok(text.includes('Disallow: /g/'));
  assert.ok(text.includes('Sitemap: https://luv4u.fun/sitemap.xml'));
});

test('Worker handles /sitemap.xml with all 8 public occasion pages', async () => {
  const req = new Request('https://luv4u.fun/sitemap.xml');
  const res = await worker.fetch(req, {});
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Content-Type'), 'application/xml');
  const text = await res.text();
  assert.ok(text.includes('<loc>https://luv4u.fun/</loc>'));
  for (const key of OCCASION_KEYS) {
    assert.ok(text.includes(`/for/${OCCASIONS[key].slug}`));
  }
});

test('Worker handles /api/config', async () => {
  const req = new Request('https://luv4u.fun/api/config');
  const res = await worker.fetch(req, {});
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.product, 'luv4u');
  assert.equal(data.version, 3);
  assert.equal(data.occasions.length, 8);
});

test('Worker handles gift creation with mock D1 database', async () => {
  // Simple mock of Cloudflare D1
  const storage = new Map();
  const mockDb = {
    prepare(sql) {
      let bound = [];
      return {
        bind(...args) {
          bound = args;
          return this;
        },
        async run() {
          if (sql.includes('INSERT INTO gifts')) {
            const [id, owner_hash, gift_json, expires_at] = bound;
            storage.set(id, { id, owner_hash, gift_json, revision: 1, expires_at });
            return { success: true };
          }
        },
        async first() {
          if (sql.includes('SELECT gift_json, expires_at FROM gifts WHERE id = ?')) {
            const id = bound[0];
            return storage.get(id) || null;
          }
        }
      };
    }
  };

  const giftBody = {
    id: 'testgift1234',
    editKey: 'secretkey1234567890',
    gift: {
      name: 'Alex',
      occasion: 'birthday',
      vibe: 'Cute',
      message: 'Happy birthday!'
    },
    expiresDays: 30
  };

  const createReq = new Request('https://luv4u.fun/api/gifts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(giftBody)
  });

  const createRes = await worker.fetch(createReq, { DB: mockDb });
  assert.equal(createRes.status, 200);
  const created = await createRes.json();
  assert.equal(created.ok, true);
  assert.equal(created.url, 'https://luv4u.fun/g/testgift1234');
  assert.equal(created.gift.name, 'Alex');

  // Verify retrieval via GET /api/gifts/:id
  const getReq = new Request('https://luv4u.fun/api/gifts/testgift1234');
  const getRes = await worker.fetch(getReq, { DB: mockDb });
  assert.equal(getRes.status, 200);
  const fetched = await getRes.json();
  assert.equal(fetched.gift.name, 'Alex');
  assert.equal(fetched.gift.occasion, 'birthday');
});
