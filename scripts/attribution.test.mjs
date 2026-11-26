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

test('internal referrer with nothing stored is unknown (other), never direct; first stored value wins', () => {
  const s = memStore();
  assert.equal(A.firstTouch(s, 'https://meduxa.ai/nephrology', 'https://www.meduxa.ai/'), 'other');
  assert.equal(A.firstTouch(s, 'https://meduxa.ai/?utm_source=whatsapp', ''), 'other'); // stored first touch wins
  assert.equal(A.firstTouch(throwing, 'https://meduxa.ai/', 'https://app.meduxa.ai/'), 'other');
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
  assert.equal(A.firstTouch(throwing, 'https://meduxa.ai/', 'https://meduxa.ai/en'), 'other');
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

// Literal snapshot of the app's api/_lib/external/via.js tables (MeduXa repo): keep the two identical.
test('mapping tables equal the app-side via.js snapshot', () => {
  const T = A.TABLES;
  assert.deepEqual(JSON.parse(JSON.stringify(T.INTERNAL_HOSTS)), ['meduxa.ai']);
  assert.deepEqual(JSON.parse(JSON.stringify(T.HOST_SUFFIXES)), [
    ['bing', ['bing.com']],
    ['facebook', ['facebook.com', 'fb.com', 'fb.me']],
    ['instagram', ['instagram.com']],
    ['whatsapp', ['whatsapp.com', 'wa.me']],
    ['linkedin', ['linkedin.com', 'lnkd.in']],
    ['x', ['x.com', 't.co', 'twitter.com']],
    ['chatgpt', ['chatgpt.com', 'chat.openai.com', 'openai.com']],
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(T.ALIASES)), {
    google: 'google', bing: 'bing', facebook: 'facebook', fb: 'facebook', instagram: 'instagram',
    ig: 'instagram', whatsapp: 'whatsapp', wa: 'whatsapp', linkedin: 'linkedin', x: 'x',
    twitter: 'x', chatgpt: 'chatgpt', newsletter: 'newsletter', direct: 'direct',
  });
  assert.equal(T.GOOGLE_RE.source, '^(?:[a-z0-9-]+\\.)*google\\.[a-z]{2,3}(?:\\.[a-z]{2})?$');
});

// Click wiring, run for real against a stub DOM.
function loadWithDom({ href, referrer = '', page = 'home', storage = memStore() }) {
  const listeners = {};
  const document = {
    referrer, nodeType: 9,
    documentElement: { getAttribute: (k) => (k === 'data-page' ? page : null) },
    addEventListener: (type, fn, capture) => { listeners[type] = { fn, capture }; },
  };
  const w = { location: { href }, sessionStorage: storage };
  vm.runInNewContext(src, { window: w, document, URL });
  return { w, listeners };
}
function anchor(h) {
  const a = { nodeType: 1, tagName: 'A', href: new URL(h, 'https://meduxa.ai/').href, parentNode: null,
    getAttribute: (k) => (k === 'href' ? a.href : null), setAttribute: (k, v) => { if (k === 'href') a.href = v; } };
  return a;
}
test('click wiring: app link decorated at click time (also via a child node), other links untouched', () => {
  const { w, listeners } = loadWithDom({ href: 'https://meduxa.ai/nephrology?utm_source=whatsapp', page: 'nephrology' });
  assert.equal(listeners.click.capture, true);
  assert.equal(w.MeduxaAttribution.current(), 'whatsapp');
  const app = anchor('https://app.meduxa.ai/?signup=1&src=landing&pl=hero');
  const child = { nodeType: 1, tagName: 'SPAN', parentNode: app };
  listeners.click.fn({ target: child });
  assert.equal(app.href, 'https://app.meduxa.ai/?signup=1&src=landing&pl=hero&pg=nephrology&via=whatsapp');
  const other = anchor('https://claude.ai/directory/meduxa');
  listeners.click.fn({ target: other });
  assert.equal(other.href, 'https://claude.ai/directory/meduxa');
  const noSrc = anchor('https://app.meduxa.ai/?signup=1');
  listeners.click.fn({ target: noSrc });
  assert.equal(noSrc.href, 'https://app.meduxa.ai/?signup=1');
  listeners.click.fn({ target: { nodeType: 1, tagName: 'DIV', parentNode: null } }); // no anchor: no throw
});

// The waitlist submit script of specialty.template.html, run in vm with a stub fetch.
function runWaitlist(statuses, via) {
  const html = readFileSync(new URL('../specialty.template.html', import.meta.url), 'utf8');
  const start = html.indexOf('  (function () {\n    var SUPA_URL');
  const end = html.indexOf('<!-- /if:soon -->', start);
  assert.ok(start > 0 && end > start, 'waitlist snippet found');
  const code = html.slice(start, end)
    .replace(/\{\{\{successJs\}\}\}/g, 'OK').replace(/\{\{[a-zA-Z.]*signup\.source\}\}/g, 'landing_x')
    .replace(/\{\{signup\.interest\}\}/g, 'x').replace(/\{\{prefix\}\}/g, 'x');
  assert.ok(!/\{\{/.test(code.replace(/\/\/.*$/gm, '')), 'no unresolved placeholder in code');
  const el = (o = {}) => ({ style: {}, setAttribute() {}, removeAttribute() {}, textContent: '', innerHTML: '', ...o });
  const form = el({ parentNode: el() });
  let submit;
  form.addEventListener = (t, fn) => { submit = fn; };
  const els = { notifyForm: form, notifyEmail: el({ value: 'a@b.c' }), notifyConsent: el({ checked: true }), notifySubmit: el(), notifyMsg: el({ lastChild: {} }) };
  const calls = [];
  const fetch = (u, o) => {
    const isW = /\/rest\/v1\/waitlist$/.test(u);
    calls.push({ u, body: o && o.body, isW });
    const st = isW ? statuses[calls.filter((c) => c.isW).length - 1] : 200;
    return Promise.resolve({ status: st, ok: st >= 200 && st < 300 });
  };
  vm.runInNewContext(code, {
    document: { getElementById: (id) => els[id] }, fetch, Promise, Date, JSON, Error,
    swapHeight: (c, fn) => fn(),
    window: { MeduxaAttribution: via ? { current: () => via } : undefined },
  });
  submit({ preventDefault() {} });
  return new Promise((r) => setTimeout(() => r({ calls: calls.filter((c) => c.isW), all: calls, els }), 20));
}
const hasVia = (c) => 'via' in JSON.parse(c.body);

test('waitlist: 201 with via -> one insert carrying via, then the interest call', async () => {
  const r = await runWaitlist([201], 'whatsapp');
  assert.equal(r.calls.length, 1); assert.equal(JSON.parse(r.calls[0].body).via, 'whatsapp');
  assert.equal(r.all.length, 2);
  assert.equal(r.els.notifyMsg.className, 'ok-box');
});
test('waitlist: 400 with via -> exactly one retry without via, then success', async () => {
  const r = await runWaitlist([400, 201], 'whatsapp');
  assert.equal(r.calls.length, 2); assert.ok(hasVia(r.calls[0])); assert.ok(!hasVia(r.calls[1]));
  assert.equal(r.els.notifyMsg.className, 'ok-box');
});
test('waitlist: 409 -> one insert, no retry, success path', async () => {
  const r = await runWaitlist([409], 'whatsapp');
  assert.equal(r.calls.length, 1); assert.equal(r.els.notifyMsg.className, 'ok-box');
  assert.equal(r.all.length, 2); // interest call still made
});
test('waitlist: 400 without via -> no retry, error shown', async () => {
  const r = await runWaitlist([400], null);
  assert.equal(r.calls.length, 1); assert.ok(!hasVia(r.calls[0]));
  assert.equal(r.els.notifyMsg.className, 'err');
});
test('waitlist: 400 then 400 -> two inserts total, error shown', async () => {
  const r = await runWaitlist([400, 400], 'whatsapp');
  assert.equal(r.calls.length, 2); assert.equal(r.els.notifyMsg.className, 'err');
});

// Page coverage: every public page loads attribution.js with a valid data-page.
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const SKIP = new Set(['docs', 'scripts', 'design-system', 'specialties', 'node_modules', '.git', '.github', '.design-sync']);
const PRIVATE = new Set(['specialty.template.html', 'exams.template.html']); // templates are checked via their output
function htmlFiles(dir = root, out = []) {
  for (const n of readdirSync(dir)) {
    if (SKIP.has(n)) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) htmlFiles(p, out);
    else if (n.endsWith('.html') && !(dir === root && PRIVATE.has(n))) out.push(p);
  }
  return out;
}
test('every public page loads /attribution.js and has a valid <html data-page>', () => {
  const files = htmlFiles();
  assert.ok(files.length >= 25, 'found the public pages');
  for (const f of files) {
    const h = readFileSync(f, 'utf8');
    assert.ok(h.includes('<script defer src="/attribution.js"></script>'), f + ' loads attribution.js');
    const m = h.match(/<html[^>]*\sdata-page="([^"]*)"/);
    assert.ok(m && /^[a-z][a-z-]{0,30}$/.test(m[1]), f + ' data-page');
  }
});
test('every page with an app src=landing link has attribution.js (explicit)', () => {
  for (const f of htmlFiles()) {
    const h = readFileSync(f, 'utf8');
    if (/app\.meduxa\.ai\/[^"']*src=landing/.test(h)) assert.ok(h.includes('/attribution.js'), f);
  }
});
