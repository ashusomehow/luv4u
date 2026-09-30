// Local stand-in for the Supabase REST + Storage endpoints Luv4u calls, used by the e2e smoke test.
// Not a full implementation: it supports exactly the queries the app issues.
import http from 'node:http';
const tables = { gifts: [], gift_views: [], gift_replies: [], events: [], gift_reports: [], rate_hits: [] };
const pk = { gifts: 'id' };
const files = new Map();
let seq = 1;
const PORT = Number(process.env.MOCK_PORT || 54321);
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };

function matchRows(table, params) {
  let rows = tables[table];
  for (const [k, v] of params) {
    if (['select', 'order', 'limit', 'on_conflict', 'columns'].includes(k)) continue;
    const [op, ...rest] = v.split('.'); const val = rest.join('.');
    rows = rows.filter(r => op === 'eq' ? String(r[k]) === val : op === 'neq' ? String(r[k]) !== val :
      op === 'lt' ? String(r[k]) < val : op === 'gte' ? String(r[k]) >= val : op === 'is' ? (val === 'null' ? r[k] == null : r[k] != null) : op === 'in' ? val.slice(1, -1).split(',').includes(String(r[k])) : true);
  }
  return rows;
}
const readBody = req => new Promise(r => { const c = []; req.on('data', d => c.push(d)); req.on('end', () => r(Buffer.concat(c))); });
const send = (res, code, body, headers = {}) => { res.writeHead(code, { 'content-type': 'application/json', ...cors, ...headers }); res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body)); };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') return send(res, 204, '');
  const raw = await readBody(req);
  const p = url.pathname;
  let m;
  if ((m = p.match(/^\/rest\/v1\/(\w+)$/))) {
    const table = m[1]; const prefer = req.headers.prefer || '';
    if (req.method === 'GET' || req.method === 'HEAD') {
      let rows = matchRows(table, url.searchParams);
      const total = rows.length;
      const order = url.searchParams.get('order');
      if (order) { const [c, d] = order.split('.'); rows = [...rows].sort((a, b) => (Number(a[c]) - Number(b[c])) * (d === 'desc' ? -1 : 1)); }
      const lim = url.searchParams.get('limit'); if (lim) rows = rows.slice(0, +lim);
      const range = { 'content-range': `0-${Math.max(total - 1, 0)}/${total}` };
      if (req.method === 'HEAD') return send(res, 200, '', range);
      if ((req.headers.accept || '').includes('pgrst.object')) {
        if (rows.length !== 1) return send(res, 406, { code: 'PGRST116', details: 'The result contains 0 rows', message: 'JSON object requested, multiple (or no) rows returned' });
        return send(res, 200, rows[0], range);
      }
      return send(res, 200, rows, range);
    }
    if (req.method === 'POST') {
      const body = JSON.parse(raw.toString()); const list = Array.isArray(body) ? body : [body];
      for (const row of list) {
        const conflict = (url.searchParams.get('on_conflict') || pk[table] || 'id').split(',');
        const dup = tables[table].find(r => conflict.every(c => r[c] === row[c]));
        if (dup) { if (prefer.includes('ignore-duplicates')) continue; if (prefer.includes('merge-duplicates')) { Object.assign(dup, row); continue; } return send(res, 409, { code: '23505', message: 'duplicate key value' }); }
        tables[table].push({ ...(pk[table] ? {} : { id: seq++ }), created_at: new Date().toISOString(), ...row });
      }
      return send(res, 201, '');
    }
    if (req.method === 'PATCH') {
      const rows = matchRows(table, url.searchParams); const body = JSON.parse(raw.toString());
      rows.forEach(r => Object.assign(r, body));
      return send(res, 200, prefer.includes('return=representation') ? rows : '');
    }
    if (req.method === 'DELETE') {
      const del = new Set(matchRows(table, url.searchParams));
      tables[table] = tables[table].filter(r => !del.has(r));
      if (table === 'gifts') for (const t of ['gift_views', 'gift_replies']) tables[t] = tables[t].filter(r => tables.gifts.some(g => g.id === r.gift_id));
      return send(res, 204, '');
    }
  }
  if ((m = p.match(/^\/storage\/v1\/object\/list\/([^/]+)$/))) {
    const { prefix } = JSON.parse(raw.toString()); const pre = prefix ? prefix + '/' : ''; const seen = new Map();
    for (const [path, f] of files) if (path.startsWith(pre)) seen.set(path.slice(pre.length).split('/')[0], f.created_at);
    return send(res, 200, [...seen].map(([name, created_at]) => ({ name, created_at, id: name.includes('.') ? name : null })));
  }
  if ((m = p.match(/^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/))) {
    const f = files.get(decodeURIComponent(m[2]));
    if (!f) return send(res, 404, { error: 'not found' });
    res.writeHead(200, { 'content-type': f.type, ...cors }); return res.end(f.bytes);
  }
  if ((m = p.match(/^\/storage\/v1\/object\/([^/]+)\/(.+)$/)) && req.method === 'POST') {
    const path = decodeURIComponent(m[2]);
    // supabase-js sends multipart/form-data for Buffer bodies
    let bytes = raw, type = req.headers['content-type'] || 'application/octet-stream';
    const bm = /boundary=(.+)$/.exec(type);
    if (bm) {
      const s = raw.toString('latin1'); const parts = s.split('--' + bm[1]);
      for (const part of parts) { const i = part.indexOf('\r\n\r\n'); if (i < 0 || !/name="file"|filename=|name=""/.test(part.slice(0, i)) && !/Content-Type/i.test(part.slice(0, i))) continue;
        const head = part.slice(0, i); const t = /Content-Type: ([^\r\n]+)/i.exec(head); if (!/filename|name=""/.test(head)) continue;
        bytes = Buffer.from(part.slice(i + 4, part.length - 2), 'latin1'); if (t) type = t[1]; }
    }
    files.set(path, { bytes, type, created_at: new Date().toISOString() });
    return send(res, 200, { Key: m[1] + '/' + path });
  }
  if ((m = p.match(/^\/storage\/v1\/object\/([^/]+)$/)) && req.method === 'DELETE') {
    const { prefixes } = JSON.parse(raw.toString()); prefixes.forEach(x => files.delete(x));
    return send(res, 200, prefixes.map(name => ({ name })));
  }
  if (p === '/__state') return send(res, 200, { gifts: tables.gifts.length, views: tables.gift_views.length, replies: tables.gift_replies.length, reports: tables.gift_reports.length, rateHits: tables.rate_hits.length, events: tables.events.map(e => e.name), files: [...files].map(([k, v]) => [k, v.type, v.bytes.length]) });
  send(res, 404, { error: 'mock: unhandled ' + req.method + ' ' + p });
}).listen(PORT, () => console.log('mock supabase on', PORT));
