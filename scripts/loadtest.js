// k6 load test for the read paths a viral share hits. Run against a PREVIEW deployment only.
//   k6 run -e ORIGIN=https://your-preview-url -e GIFT_ID=<24 hex chars> scripts/loadtest.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const ORIGIN = __ENV.ORIGIN;
const GIFT_ID = __ENV.GIFT_ID;
if (!ORIGIN) throw new Error('Set ORIGIN, e.g. -e ORIGIN=https://your-preview-url');
if (/^https:\/\/(www\.)?kholona.in/.test(ORIGIN)) throw new Error('Refusing to load-test production.');

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '2m', target: 200 },
    { duration: '1m', target: 200 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

export default function visit() {
  const pages = [`${ORIGIN}/`, `${ORIGIN}/for/birthday-wish`, `${ORIGIN}/ideas/birthday-website-for-girlfriend`, `${ORIGIN}/api/config`];
  const res = http.get(pages[Math.floor(Math.random() * pages.length)]);
  check(res, { 'status is 200': (r) => r.status === 200 });
  if (GIFT_ID) {
    const gift = http.get(`${ORIGIN}/api/gifts/${GIFT_ID}`);
    check(gift, { 'gift is readable': (r) => r.status === 200 });
  }
  sleep(Math.random() * 2 + 0.5);
}
