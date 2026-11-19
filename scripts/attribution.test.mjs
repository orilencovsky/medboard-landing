// attribution.js: first-touch traffic source + sign-up link decoration. Run: node --test scripts/attribution.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../attribution.js', import.meta.url), 'utf8');
const win = {};
vm.runInNewContext(src, { window: win, URL });
const A = win.MeduxaAttribution;

const memStore = () => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, m }; };
const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };

test('VIAS equals the app-side list', () => {
  assert.deepEqual([...A.VIAS], ['google', 'bing', 'facebook', 'instagram', 'whatsapp', 'linkedin', 'x',
    'chatgpt', 'newsletter', 'direct', 'other']);
});

test('viaOfHost table', () => {
  const t = [['www.google.com', 'google'], ['google.co.il', 'google'], ['www.google.co.uk', 'google'],
    ['l.facebook.com', 'facebook'], ['fb.me', 'facebook'], ['m.instagram.com', 'instagram'],
    ['wa.me', 'whatsapp'], ['api.whatsapp.com', 'whatsapp'], ['lnkd.in', 'linkedin'], ['t.co', 'x'],
    ['x.com', 'x'], ['chatgpt.com', 'chatgpt'], ['openai.com', 'chatgpt'], ['www.bing.com', 'bing'],
    ['example.org', 'other'], ['notgoogle.com', 'other'], ['evilwa.me', 'other'],
    ['', 'direct'], ['(direct)', 'direct'], ['(not set)', 'direct'],
    ['whatsapp', 'whatsapp'], ['google', 'google'], ['newsletter', 'newsletter'], ['FB', 'facebook'],
    ['meduxa.ai', null], ['www.meduxa.ai', null], ['app.meduxa.ai', null]];
  for (const [h, v] of t) assert.equal(A.viaOfHost(h), v, h);
  assert.equal(A.viaOfHost(null), 'direct');
});

test('viaOfUtm table', () => {
  assert.equal(A.viaOfUtm('WhatsApp'), 'whatsapp');
  assert.equal(A.viaOfUtm('wa'), 'whatsapp');
  assert.equal(A.viaOfUtm('twitter'), 'x');
  assert.equal(A.viaOfUtm('some-campaign'), 'other');
  assert.equal(A.viaOfUtm(''), null);
  assert.equal(A.viaOfUtm(null), null);
});

test('utm_source beats referrer; home -> nephrology keeps whatsapp', () => {
  const s = memStore();
  assert.equal(A.firstTouch(s, 'https://meduxa.ai/?utm_source=whatsapp', 'https://www.google.com/'), 'whatsapp');
  assert.equal(s.m.mx_via, 'whatsapp');
  assert.equal(A.firstTouch(s, 'https://meduxa.ai/nephrology', 'https://meduxa.ai/?utm_source=whatsapp'), 'whatsapp');
  assert.equal(A.firstTouch(s, 'https://meduxa.ai/nephrology', 'https://app.meduxa.ai/'), 'whatsapp');
});

test('direct visit and external referrer', () => {
  assert.equal(A.firstTouch(memStore(), 'https://meduxa.ai/', ''), 'direct');
  assert.equal(A.firstTouch(memStore(), 'https://meduxa.ai/', 'https://www.google.co.il/search?q=x'), 'google');
  assert.equal(A.firstTouch(memStore(), 'https://meduxa.ai/', 'not a url'), 'other');
});

test('internal referrer with nothing stored is direct; first stored value wins', () => {
  const s = memStore();
  assert.equal(A.firstTouch(s, 'https://meduxa.ai/nephrology', 'https://www.meduxa.ai/'), 'direct');
  assert.equal(A.firstTouch(s, 'https://meduxa.ai/?utm_source=whatsapp', ''), 'direct');
});

test('an invalid stored value is ignored and recomputed', () => {
  const s = memStore(); s.setItem('mx_via', 'free text');
  assert.equal(A.firstTouch(s, 'https://meduxa.ai/?utm_source=bing', ''), 'bing');
  assert.equal(s.m.mx_via, 'bing');
});

test('English entry: /en?utm_source=whatsapp decorates the hero link, en -> he keeps it', () => {
  const s = memStore();
  const via = A.firstTouch(s, 'https://meduxa.ai/en?utm_source=whatsapp', '');
  assert.equal(A.decorate('https://app.meduxa.ai/?signup=1&src=landing&pl=hero', 'home', via),
    'https://app.meduxa.ai/?signup=1&src=landing&pl=hero&pg=home&via=whatsapp');
  assert.equal(A.firstTouch(s, 'https://meduxa.ai/', 'https://meduxa.ai/en'), 'whatsapp');
});

test('storage that throws gives the computed value and stores nothing', () => {
  assert.equal(A.firstTouch(throwing, 'https://meduxa.ai/?utm_source=linkedin', ''), 'linkedin');
  assert.equal(A.firstTouch(throwing, 'https://meduxa.ai/', ''), 'direct');
});

test('decorate leaves non-app links alone and drops an invalid page key', () => {
  for (const h of ['https://claude.ai/directory/meduxa', '/connect', 'https://app.meduxa.ai/?signup=1',
    'https://app.meduxa.ai.evil.com/?src=landing', 'http://app.meduxa.ai/?src=landing', 'mailto:a@b.c', '']) {
    assert.equal(A.decorate(h, 'home', 'google'), h, h);
  }
  const app = 'https://app.meduxa.ai/?signup=1&src=landing&pl=nav';
  assert.equal(A.decorate(app, 'Bad Page!', 'google'), app + '&via=google');
  assert.equal(A.decorate(app, 'exams', 'bogus'), app + '&pg=exams');
  assert.equal(A.decorate(app, 'x'.repeat(32), 'bogus'), app);
  for (const bad of ['Home', 'cardio_hero', '1abc', 'a1', '-a', '']) assert.equal(A.decorate(app, bad, 'bogus'), app, bad);
  assert.equal(A.decorate(app, 'family-medicine', 'bogus'), app + '&pg=family-medicine');
  assert.equal(A.decorate(app, 'x'.repeat(31), 'bogus'), app + '&pg=' + 'x'.repeat(31));
  // idempotent: a second decoration replaces rather than duplicates
  const once = A.decorate(app, 'home', 'google');
  assert.equal(A.decorate(once, 'exams', 'bing'), app + '&pg=exams&via=bing');
});

test('en old-visitor redirect keeps the query and hash', () => {
  const html = readFileSync(new URL('../en/index.html', import.meta.url), 'utf8');
  const m = html.match(/location\.replace\(([^;]*)\);/);
  assert.ok(m, 'redirect present');
  const run = (search, hash) => { let to; vm.runInNewContext(`location.replace(${m[1]})`, { location: { search, hash, replace: (u) => { to = u; } } }); return to; };
  assert.equal(run('', ''), '/?lang=he');
  assert.equal(run('?utm_source=whatsapp', '#x'), '/?lang=he&utm_source=whatsapp#x');
});
