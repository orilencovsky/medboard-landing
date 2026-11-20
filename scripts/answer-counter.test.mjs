// answer-counter.js: the live "answers so far" line in the hero. Run: node --test scripts/answer-counter.test.mjs
// Pure logic and the poller / tweener state machines run in a vm with injected clocks (no browser); the page wiring, CSP and privacy
// copy are pinned by reading the files.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const src = read('answer-counter.js');
const win = {};
vm.runInNewContext(src, { window: win, Intl, Math, Promise, setTimeout, clearTimeout, isFinite });
const C = win.MeduxaAnswerCounter;

// ---- parse ----
test('parsePayload accepts only a real {ok:true,total,last24h}', () => {
  assert.deepEqual({ ...C.parsePayload({ ok: true, total: 14082, last24h: 654 }) }, { total: 14082, last24h: 654 });
  assert.deepEqual({ ...C.parsePayload({ ok: true, total: 0, last24h: 0 }) }, { total: 0, last24h: 0 });
});
test('parsePayload rejects everything else (never coerced)', () => {
  const bad = [null, undefined, 5, 'x', [], {}, { ok: false }, { ok: 'true', total: 1, last24h: 1 },
    { ok: true, total: '10', last24h: 1 }, { ok: true, total: 10, last24h: '1' }, { ok: true, total: -1, last24h: 0 },
    { ok: true, total: 1.5, last24h: 0 }, { ok: true, total: NaN, last24h: 0 }, { ok: true, total: Infinity, last24h: 0 },
    { ok: true, total: 10, last24h: 11 }, { ok: true, total: 10 }, { ok: true, last24h: 1 },
    { ok: true, total: Number.MAX_SAFE_INTEGER + 1, last24h: 0 }];
  for (const b of bad) assert.equal(C.parsePayload(b), null, JSON.stringify(b));
});

// ---- floors ----
test('view: below the total floor hides the whole line, below the 24 h floor only the day line', () => {
  assert.equal(C.FLOOR_TOTAL, 1000);
  assert.equal(C.FLOOR_24H, 25);
  assert.equal(C.view(null).state, 'hidden');
  assert.equal(C.view({ total: 999, last24h: 500 }).state, 'hidden');
  assert.deepEqual({ ...C.view({ total: 1000, last24h: 24 }) }, { state: 'ok', total: 1000, last24h: 24, showDay: false });
  assert.deepEqual({ ...C.view({ total: 1000, last24h: 25 }) }, { state: 'ok', total: 1000, last24h: 25, showDay: true });
  assert.equal(C.view({ total: 'x', last24h: 1 }).state, 'hidden');
});

// ---- formatting and copy ----
test('formatCount: Latin digits with grouping in both languages', () => {
  assert.equal(C.formatCount(14082, 'en-US'), '14,082');
  assert.equal(C.formatCount(14082, 'he-IL'), '14,082');
});
test('strings: he and en, number-first label, 24 h clause, screen-reader sentence drops the day clause when hidden', () => {
  const he = C.text('he'), en = C.text('en-GB'), other = C.text('fr');
  assert.equal(he.label, 'תשובות לשאלות עד היום');
  assert.equal(he.dayAfter, ' ב-24 השעות האחרונות');
  assert.equal(en.label, 'questions answered so far');
  assert.equal(other.label, en.label, 'unknown language falls back to English');
  assert.equal(he.srSummary('14,082', '654'), '14,082 תשובות לשאלות עד היום. 654 ב-24 השעות האחרונות.');
  assert.equal(en.srSummary('14,082', null), '14,082 questions answered so far.');
  for (const lang of ['he', 'en']) { const t = C.STRINGS[lang]; for (const v of Object.values(t)) assert.ok(!/[–—]/.test(v), 'no en/em dash'); }
});

// ---- count-up frames and the tween ----
test('countUpFrames: only an increase animates, non-decreasing, ends exactly on `to`', () => {
  assert.deepEqual([...C.countUpFrames(10, 5, false)], [5]);
  assert.deepEqual([...C.countUpFrames(10, 10, false)], [10]);
  assert.deepEqual([...C.countUpFrames(10, 99, true)], [99], 'reduced motion: one instant frame');
  assert.deepEqual([...C.countUpFrames(NaN, 99, false)], [99]);
  const f = [...C.countUpFrames(1000, 1100, false)];
  assert.equal(f.length, 24);
  assert.equal(f[f.length - 1], 1100);
  for (let i = 1; i < f.length; i++) assert.ok(f[i] >= f[i - 1]);
});

function fakeClock() {
  let t = 0, id = 0; const q = new Map();
  return {
    now: () => t,
    setTimeoutFn: (fn, ms) => { id += 1; q.set(id, { at: t + ms, fn }); return id; },
    clearTimeoutFn: (i) => { q.delete(i); },
    advance(ms) {
      const end = t + ms;
      for (;;) {
        let next = null;
        for (const [k, v] of q) if (v.at <= end && (!next || v.at < next.v.at)) next = { k, v };
        if (!next) break;
        q.delete(next.k); t = next.v.at; next.v.fn();
      }
      t = end;
    },
    pending: () => q.size,
  };
}
const tick = () => new Promise((r) => setImmediate(r));

test('tweener: emits `from` synchronously, never the target before the end, final frame exactly `to`, cancel stops', () => {
  const frames = []; let cb = null; let t = 0;
  const tw = C.createTweener({ raf: (f) => { cb = f; return 1; }, caf: () => { cb = null; }, now: () => t, reducedMotion: () => false, onFrame: (v, d) => frames.push([v, d]) });
  tw.start(1000, 1100);
  assert.deepEqual(frames[0], [1000, false]);
  t = 100; cb(); assert.ok(frames[frames.length - 1][0] < 1100 && frames[frames.length - 1][1] === false);
  t = 600; cb();
  assert.deepEqual(frames[frames.length - 1], [1100, true]);
  tw.start(1100, 1200); tw.cancel();
  const n = frames.length; if (cb) cb(); assert.equal(frames.length, n);
});
test('tweener: reduced motion and a lower value are one instant final frame, no rAF', () => {
  let raf = 0; const frames = [];
  const mk = (reduced) => C.createTweener({ raf: () => { raf += 1; return 1; }, caf() {}, now: () => 0, reducedMotion: () => reduced, onFrame: (v, d) => frames.push([v, d]) });
  mk(true).start(1000, 1100); mk(false).start(1100, 1000);
  assert.deepEqual(frames, [[1100, true], [1000, true]]);
  assert.equal(raf, 0);
});
test('tweenStart / ringBumps: first value and across-the-floor never animate; ring only on a real increase', () => {
  const a = { total: 2000, last24h: 100 }, b = { total: 2010, last24h: 110 }, low = { total: 10, last24h: 1 };
  assert.equal(C.tweenStart(null, a, null), null);
  assert.equal(C.tweenStart(low, a, null), null);
  assert.deepEqual({ ...C.tweenStart(a, b, 2005) }, { from: 2005, to: 2010 });
  assert.deepEqual({ ...C.tweenStart(a, b, null) }, { from: 2000, to: 2010 });
  assert.equal(C.ringBumps(null, a), false);
  assert.equal(C.ringBumps(a, a), false);
  assert.equal(C.ringBumps(a, b), true);
  assert.equal(C.ringBumps(b, a), false);
  assert.equal(C.ringBumps(low, a), false);
});

// ---- poller ----
const GOOD = { ok: true, total: 5000, last24h: 100 };
function harness(extra = {}) {
  const clock = fakeClock(); const log = { values: [], fails: [], health: [], loads: [] };
  let visible = true; let visCb = null;
  const loads = extra.loads || [];
  const poller = C.createPoller({
    load: (signal) => { log.loads.push(signal); const next = loads.shift(); return typeof next === 'function' ? next(signal) : Promise.resolve(next === undefined ? GOOD : next); },
    pollMs: 30000,
    onValue: (v) => log.values.push(v), onFail: (f) => log.fails.push(f), onHealth: (h) => log.health.push(h),
    isVisible: () => visible, subscribeVisibility: (cb) => { visCb = cb; return () => { visCb = null; }; },
    setTimeoutFn: clock.setTimeoutFn, clearTimeoutFn: clock.clearTimeoutFn,
    AbortControllerCtor: class { constructor() { this.signal = { aborted: false }; } abort() { this.signal.aborted = true; } },
  });
  return { poller, clock, log, setVisible: (v) => { visible = v; visCb && visCb(); } };
}

test('poller: one load at once, then ONE timer per poll after the previous load settled', async () => {
  const h = harness(); h.poller.start(); await tick();
  assert.equal(h.log.loads.length, 1); assert.equal(h.log.values.length, 1); assert.equal(h.clock.pending(), 1);
  h.clock.advance(30000); await tick();
  assert.equal(h.log.loads.length, 2); assert.equal(h.log.values.length, 2);
  assert.deepEqual(h.log.health, [true]);
  h.poller.stop();
});
test('poller: a failure backs off (doubling), 3 in a row give up for good, a success resets the streak', async () => {
  const h = harness({ loads: [null, null, GOOD, null, null, null] }); h.poller.start(); await tick();
  assert.equal(h.log.fails.length, 1); // 1st failure: next at 30000 * 2 = 60000
  h.clock.advance(59999); await tick(); assert.equal(h.log.loads.length, 1);
  h.clock.advance(1); await tick(); assert.equal(h.log.loads.length, 2); // 2nd failure: next 120000
  h.clock.advance(120000); await tick(); assert.equal(h.log.loads.length, 3); assert.equal(h.log.values.length, 1); // success
  h.clock.advance(30000); await tick(); assert.equal(h.log.fails.length, 3); // failure streak restarted at 1
  h.clock.advance(60000); await tick(); h.clock.advance(120000); await tick();
  assert.equal(h.log.fails[h.log.fails.length - 1].final, true);
  const n = h.log.loads.length; h.clock.advance(10 * 60 * 1000); await tick();
  assert.equal(h.log.loads.length, n, 'gave up: no further load');
});
test('poller: hiding the tab aborts the in-flight load (its late result is ignored), visible again loads at once', async () => {
  let release; const slow = (signal) => new Promise((r) => { release = () => r(GOOD); });
  const h = harness({ loads: [slow, GOOD] }); h.poller.start(); await tick();
  const first = h.log.loads[0]; assert.equal(first.aborted, false);
  h.setVisible(false); assert.equal(first.aborted, true);
  release(); await tick();
  assert.equal(h.log.values.length, 0, 'late settlement of an aborted load is silent');
  assert.equal(h.log.fails.length, 0, 'an abort is not a failure');
  assert.equal(h.clock.pending(), 0, 'nothing armed while hidden');
  h.setVisible(true); await tick();
  assert.equal(h.log.values.length, 1);
  h.poller.stop();
});
test('poller: a throwing callback does not break the chain; stop() makes a late load silent', async () => {
  const clock = fakeClock(); let n = 0;
  const p = C.createPoller({ load: () => Promise.resolve(GOOD), pollMs: 1000, onValue: () => { n += 1; throw new Error('caller bug'); },
    isVisible: () => true, subscribeVisibility: () => () => {}, setTimeoutFn: clock.setTimeoutFn, clearTimeoutFn: clock.clearTimeoutFn });
  p.start(); await tick(); clock.advance(1000); await tick();
  assert.equal(n, 2, 'cadence continues after a throwing onValue');
  p.stop(); clock.advance(5000); await tick(); assert.equal(n, 2);
});

// ---- DOM mount (a minimal fake document; no jsdom) ----
function fakeDom() {
  class El {
    constructor(tag) { this.tagName = tag; this.className = ''; this.children = []; this.attrs = {}; this._text = ''; this.hidden = false; this.classList = { add: (c) => { if (!this.className.split(' ').includes(c)) this.className = (this.className + ' ' + c).trim(); }, remove: (c) => { this.className = this.className.split(' ').filter((x) => x && x !== c).join(' '); } }; }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    getAttribute(k) { return this.attrs[k]; }
    appendChild(c) { this.children.push(c); return c; }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() { return this._text + this.children.map((c) => c.textContent).join(''); }
  }
  const listeners = {};
  const doc = {
    documentElement: { lang: 'he' }, visibilityState: 'visible', readyState: 'complete',
    createElement: (t) => new El(t), querySelectorAll: () => [], querySelector: () => null, head: new El('head'),
    addEventListener: (e, f) => { (listeners[e] = listeners[e] || []).push(f); },
    removeEventListener: (e, f) => { listeners[e] = (listeners[e] || []).filter((x) => x !== f); },
    fire(e) { (listeners[e] || []).slice().forEach((f) => f()); },
  };
  return { El, doc };
}
function mountWith(loads, lang = 'he', o = {}) {
  const { El, doc } = fakeDom();
  const clock = fakeClock();
  const raf = { cb: null, t: 0 };
  const w = { matchMedia: () => ({ matches: true }), requestAnimationFrame: (cb) => { raf.cb = cb; return 1; }, cancelAnimationFrame() { raf.cb = null; }, performance: { now: () => raf.t } };
  const sandbox = { window: w, document: doc, Intl, Math, Promise, setTimeout: clock.setTimeoutFn, clearTimeout: clock.clearTimeoutFn, isFinite, fetch: o.fetch };
  vm.runInNewContext(src, sandbox);
  const host = new El('div');
  const q = [...loads];
  const opts = { lang, reducedMotion: () => (o.reduced === undefined ? true : o.reduced) };
  if (!o.defaultLoad) opts.load = () => Promise.resolve(q.length ? q.shift() : GOOD);
  const handle = w.MeduxaAnswerCounter.mount(host, opts);
  return { host, handle, clock, raf, doc, api: w.MeduxaAnswerCounter, El };
}
const numOf = (host) => host.children[0].children[0].children[1].textContent;
const flat = (e) => [e.className, ...e.children.map(flat)].join('|');
const findText = (e) => e.textContent;

test('mount: stays hidden=false/reserved until a value, shows numbers and the screen-reader sentence on a good read', async () => {
  const { host, handle } = mountWith([{ ok: true, total: 14082, last24h: 654 }]);
  assert.equal(host.hidden, false, 'space reserved before the first read');
  assert.ok(!host.className.includes('mx-on'));
  await tick();
  assert.ok(host.className.includes('mx-on'));
  const txt = findText(host);
  assert.ok(txt.includes('14,082') && txt.includes('654') && txt.includes('תשובות לשאלות עד היום'));
  assert.ok(txt.includes('14,082 תשובות לשאלות עד היום. 654 ב-24 השעות האחרונות.'), 'sr summary present');
  handle.stop();
});
test('mount: a first-read failure removes the reserved space; a below-floor read does too', async () => {
  for (const first of [{ ok: false }, { ok: true, total: 999, last24h: 10 }]) {
    const { host, handle } = mountWith([first]);
    await tick();
    if (first.ok) assert.equal(host.hidden, true, 'below the floor: hidden');
    handle.stop();
  }
  const fail = mountWith([{ ok: false }]); await tick();
  assert.equal(fail.host.hidden, true, 'failed first read: hidden');
  fail.handle.stop();
});
test('mount: the visible digits are aria-hidden and only the sr span is announced; no aria-live anywhere', async () => {
  const { host, handle } = mountWith([GOOD]); await tick();
  assert.equal(host.children[0].getAttribute('aria-hidden'), 'true');
  assert.ok(host.children[1].className.includes('mx-sr'));
  assert.ok(!/aria-live/.test(src));
  handle.stop();
});
test('mount: the English page renders English copy and the day line only above its floor', async () => {
  const a = mountWith([{ ok: true, total: 5000, last24h: 24 }], 'en'); await tick();
  assert.ok(a.host.textContent.includes('questions answered so far'));
  const dayEl = a.host.children[0].children[1];
  assert.equal(dayEl.hidden, true, '24 h line hidden below its floor');
  a.handle.stop();
});


test('mount: a failed poll after a good value keeps the last number; a later drop below the floor closes the space again', async () => {
  const m = mountWith([GOOD, { ok: false }, { ok: true, total: 500, last24h: 5 }]);
  await tick(); assert.equal(numOf(m.host), '5,000');
  m.clock.advance(30000); await tick();
  assert.equal(m.host.hidden, false, 'after a failure the last good value stays');
  assert.equal(numOf(m.host), '5,000');
  assert.equal(m.host.children[0].children[0].children[0].getAttribute('data-on'), 'false', 'the live dot goes off while reads fail');
  m.clock.advance(60000); await tick();
  assert.equal(m.host.hidden, true, 'a real read below the floor hides it');
  assert.equal(m.host.className.includes('mx-on'), false);
  m.handle.stop();
});
test('mount: a rise above the floor re-opens the space after a hidden first read', async () => {
  const m = mountWith([{ ok: true, total: 100, last24h: 1 }, { ok: true, total: 5000, last24h: 100 }]);
  await tick(); assert.equal(m.host.hidden, true);
  m.clock.advance(30000); await tick();
  assert.equal(m.host.hidden, false); assert.equal(numOf(m.host), '5,000');
  m.handle.stop();
});
test('mount: a real increase tweens through the DOM (from, in-between, exactly the new total) and rings the dot once', async () => {
  const m = mountWith([GOOD, { ok: true, total: 5100, last24h: 150 }], 'he', { reduced: false });
  await tick(); assert.equal(numOf(m.host), '5,000');
  const dot = m.host.children[0].children[0].children[0];
  assert.equal(dot.children.length, 0, 'no ring for the first value');
  m.clock.advance(30000); await tick();
  assert.equal(numOf(m.host), '5,000', 'starts from the shown value, never the target first');
  assert.equal(dot.children.length, 1, 'one ring for the real increase');
  m.raf.t = 200; m.raf.cb();
  const mid = Number(numOf(m.host).replace(',', ''));
  assert.ok(mid > 5000 && mid < 5100, `in between (${mid})`);
  m.raf.t = 700; m.raf.cb();
  assert.equal(numOf(m.host), '5,100');
  assert.ok(m.host.children[1].textContent.startsWith('5,100'), 'screen-reader sentence is the final value');
  m.handle.stop();
});
test('mount: hiding the tab settles a running count-up on the latest real total', async () => {
  const m = mountWith([GOOD, { ok: true, total: 5100, last24h: 150 }], 'he', { reduced: false });
  await tick(); m.clock.advance(30000); await tick();
  m.raf.t = 100; m.raf.cb();
  m.doc.visibilityState = 'hidden'; m.doc.fire('visibilitychange');
  assert.equal(numOf(m.host), '5,100');
  m.handle.stop();
});
test('mount: a second mount on the same host is a no-op (no second poller or listeners)', async () => {
  const m = mountWith([GOOD]);
  const again = m.api.mount(m.host, { lang: 'he', load: () => { throw new Error('second poller must not start'); } });
  await tick();
  assert.equal(typeof again.stop, 'function');
  assert.equal(numOf(m.host), '5,000');
  m.handle.stop();
});
test('mount: the default load times out after FETCH_TIMEOUT_MS and counts as a failed read (hung request closes the space)', async () => {
  const m = mountWith([], 'he', { defaultLoad: true, fetch: () => new Promise(() => {}) });
  assert.equal(m.api.FETCH_TIMEOUT_MS, 8000);
  assert.equal(m.host.hidden, false);
  m.clock.advance(7999); await tick(); assert.equal(m.host.hidden, false);
  m.clock.advance(1); await tick(); assert.equal(m.host.hidden, true);
  m.handle.stop();
});
test('mount: the default load reads only a 200 JSON body, with no credentials and no query string', async () => {
  let seen;
  const m = mountWith([], 'he', { defaultLoad: true, fetch: (url, opts) => { seen = { url, opts }; return Promise.resolve({ status: 200, json: () => Promise.resolve(GOOD) }); } });
  await tick();
  assert.equal(seen.url, 'https://app.meduxa.ai/api/answer-counter');
  assert.equal(seen.opts.credentials, 'omit'); assert.equal(seen.opts.mode, 'cors');
  assert.equal(numOf(m.host), '5,000');
  m.handle.stop();
  const f = mountWith([], 'he', { defaultLoad: true, fetch: () => Promise.resolve({ status: 503, json: () => Promise.resolve({ ok: false }) }) });
  await tick(); assert.equal(f.host.hidden, true, 'a 503 is a failed read');
  f.handle.stop();
});

// ---- init: kill switch and exceptions close the reserved space ----
function initWith(patch, mutateDoc) {
  const { El, doc } = fakeDom();
  const hosts = [new El('div'), new El('div')];
  doc.querySelectorAll = (sel) => (sel === '[data-mx-live]' ? hosts : []);
  doc.readyState = 'complete';
  if (mutateDoc) mutateDoc(doc);
  const w = { matchMedia: () => ({ matches: true }), requestAnimationFrame: () => 1, cancelAnimationFrame() {}, performance: { now: () => 0 } };
  vm.runInNewContext(patch ? patch(src) : src, { window: w, document: doc, Intl, Math, Promise, setTimeout: () => 1, clearTimeout() {}, isFinite, fetch: () => new Promise(() => {}) });
  return { hosts, doc };
}
test('init: ENABLED=false hides every mount and starts nothing', () => {
  const { hosts, doc } = initWith((t) => t.replace('var ENABLED = true;', 'var ENABLED = false;'));
  assert.deepEqual(hosts.map((h) => h.hidden), [true, true]);
  assert.equal(doc.head.children.length, 0, 'no stylesheet injected');
});
test('init: an exception while mounting closes the reserved space instead of leaving an empty gap', () => {
  const { hosts } = initWith(null, (doc) => { doc.head = null; });
  assert.deepEqual(hosts.map((h) => h.hidden), [true, true]);
});
test('init: the shipped constant is ON and the stylesheet is injected once for several mounts', () => {
  const { hosts, doc } = initWith(null);
  assert.deepEqual(hosts.map((h) => h.hidden), [false, false]);
  assert.equal(doc.head.children.length, 1);
});

test('tweener: before the end it never emits the target, even for +1 (clamped to to-1)', () => {
  const frames = []; let cb = null; let t = 0;
  const tw = C.createTweener({ raf: (f) => { cb = f; return 1; }, caf() {}, now: () => t, reducedMotion: () => false, onFrame: (v, d) => frames.push([v, d]) });
  tw.start(1000, 1001);
  for (t = 50; t < 600; t += 50) cb();
  assert.ok(frames.filter(([, d]) => !d).every(([v]) => v <= 1000), 'only `from` until the end');
  t = 600; cb(); assert.deepEqual(frames[frames.length - 1], [1001, true]);
});
test('poller: health goes false on hide and on failure, never true while hidden; the backoff is capped', async () => {
  const h = harness({ loads: [GOOD, null] });
  h.poller.start(); await tick();
  assert.deepEqual(h.log.health, [true]);
  h.setVisible(false); assert.deepEqual(h.log.health, [true, false]);
  h.setVisible(true); await tick(); // second load fails
  assert.equal(h.log.health[h.log.health.length - 1], false);
  h.poller.stop();
  const clock = fakeClock(); const delays = [];
  const p = C.createPoller({ load: () => Promise.resolve(null), pollMs: 30000, maxFailures: 99, backoffCapMs: 300000, onFail: () => {},
    isVisible: () => true, subscribeVisibility: () => () => {}, setTimeoutFn: (fn, ms) => { delays.push(ms); return clock.setTimeoutFn(fn, ms); }, clearTimeoutFn: clock.clearTimeoutFn });
  p.start(); await tick();
  for (let i = 0; i < 6; i++) { clock.advance(300000); await tick(); }
  assert.ok(Math.max(...delays) === 300000 && delays.every((d) => d <= 300000), `capped: ${delays}`);
  p.stop();
});

// ---- the page wiring ----
const HOME_PAGES = ['index.html', 'en/index.html'];
const SPECIALTIES = readdirSync(new URL('../specialties/', import.meta.url)).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '.html'));

test('every hero that should carry the counter has the mount, the script tag and the no-script rule, exactly once', () => {
  assert.equal(SPECIALTIES.length, 8);
  for (const p of [...HOME_PAGES, ...SPECIALTIES, 'specialty.template.html']) {
    const html = read(p);
    assert.equal((html.match(/<div data-mx-live /g) || []).length, 1, `${p}: one mount`);
    assert.equal((html.match(/<script defer src="\/answer-counter\.js" onerror="document\.documentElement\.classList\.add\('mx-live-off'\)"><\/script>/g) || []).length, 1, `${p}: one script tag with the blocked-script close-up`);
    assert.equal((html.match(/<script defer src="\/answer-counter\.js"/g) || []).length, 1, `${p}: exactly one answer-counter script tag`);
    assert.ok(html.includes('<style>.mx-live-off [data-mx-live] { display: none; }</style>'), `${p}: script-blocked rule`);
    assert.ok(html.includes('<noscript><style>[data-mx-live] { display: none; }</style></noscript>'), `${p}: no-script rule`);
    const headEnd = html.indexOf('</head>');
    assert.ok(html.indexOf('mx-live-off') < headEnd && html.indexOf('<noscript><style>[data-mx-live]') < headEnd, `${p}: both rules live in <head> (valid HTML)`);
  }
});
test('the home hero mounts the counter directly after the CTA row and before the track chips', () => {
  for (const p of HOME_PAGES) {
    const html = read(p);
    const cta = html.indexOf('data-mq-hero-actions style=');
    const mount = html.indexOf('<div data-mx-live ');
    const chips = html.indexOf('class="hero-tracks"');
    assert.ok(cta > 0 && mount > cta && mount < chips, p);
  }
});
test('pages with a mount and an html lang get the matching language', () => {
  assert.ok(read('index.html').includes('<div data-mx-live style="min-height: 56px;" lang="he">'));
  assert.ok(read('en/index.html').includes('<div data-mx-live style="min-height: 56px;" lang="en">'));
});

// ---- CSP ----
test('CSP: connect-src gained exactly https://app.meduxa.ai on the meduxa.ai host rule, nothing else changed', () => {
  const cfg = JSON.parse(read('vercel.json'));
  const rule = cfg.headers.find((h) => h.has && h.has.some((x) => x.type === 'host' && /meduxa/.test(x.value)));
  const csp = rule.headers.find((h) => h.key === 'Content-Security-Policy').value;
  const dirs = Object.fromEntries(csp.split(';').map((d) => d.trim()).filter(Boolean).map((d) => { const [k, ...v] = d.split(/\s+/); return [k, v]; }));
  assert.ok(dirs['connect-src'].includes('https://app.meduxa.ai'));
  assert.deepEqual(dirs['connect-src'].filter((x) => /meduxa/.test(x)), ['https://app.meduxa.ai']);
  // The whole policy, pinned: the previous directives are byte-for-byte what they were, plus the one new connect-src origin.
  assert.deepEqual(dirs, {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com', 'https://www.clarity.ms', 'https://*.clarity.ms'],
    'style-src': ["'self'", "'unsafe-inline'"],
    'font-src': ["'self'"],
    'img-src': ["'self'", 'data:', 'https://*.googletagmanager.com', 'https://www.google-analytics.com', 'https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.clarity.ms', 'https://c.bing.com'],
    'connect-src': ["'self'", 'https://pappjpdsajkcoqrfqqqx.supabase.co', 'https://app.meduxa.ai', 'https://*.googletagmanager.com', 'https://www.google-analytics.com', 'https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.clarity.ms', 'https://c.bing.com'],
    'media-src': ["'self'"], 'object-src': ["'none'"], 'base-uri': ["'self'"], 'form-action': ["'self'"], 'frame-ancestors': ["'none'"], 'upgrade-insecure-requests': [],
  });
  assert.equal(ENDPOINT_ORIGIN(), 'https://app.meduxa.ai');
});
function ENDPOINT_ORIGIN() { return new URL(C.ENDPOINT).origin; }

test('the script is plain: no storage, no cookie, no query string on the request', () => {
  assert.ok(!/localStorage|sessionStorage|document\.cookie|indexedDB/.test(src));
  assert.ok(!/ENDPOINT\s*\+|\?[a-z]+=/.test(src.replace(/\/\*[\s\S]*?\*\//g, '')), 'no cache-buster / query on the endpoint');
  assert.ok(/credentials:\s*'omit'/.test(src));
  assert.equal(C.isEnabled(), true);
});

// ---- privacy copy ----
test('privacy section 14 (en + he) names the information site as well as the app and keeps the accuracy rules', () => {
  const en = read('en/privacy.html'), he = read('privacy.html');
  assert.ok(en.includes('the MeduXa information site (meduxa.ai) may show how many answers have been recorded'));
  assert.ok(he.includes('באתר המידע של <span class="ltr-iso">MeduXa</span> (<span class="ltr-iso">meduxa.ai</span>) עשוי להופיע'));
  for (const html of [en, he]) assert.ok(!/cannot be used to identify|אי אפשר להשתמש בהם כדי לזהות/.test(html.split('14.')[html.split('14.').length - 1]), 'no overclaim');
  assert.ok(en.includes('it carries no cookie, it sets none'));
  assert.equal(C.POLL_MS, 30000);
  assert.ok(en.includes(`about every ${C.POLL_MS / 1000} seconds while the page is open and visible`), 'cadence in the policy matches POLL_MS');
  assert.ok(he.includes(`כל ${C.POLL_MS / 1000} שניות כל עוד העמוד פתוח ונראה`));
  assert.ok(he.includes('היא אינה נושאת עוגייה, אינה יוצרת עוגייה'));
});
