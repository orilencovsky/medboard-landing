// Tests for render-tracks.mjs. Plain node:test, no dependencies:
//   node --test scripts/render-tracks.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { esc, rich, list, validate, render, fillSpans } from './render-tracks.mjs';

const real = JSON.parse(readFileSync(new URL('../tracks.json', import.meta.url), 'utf8'));
const clone = () => JSON.parse(JSON.stringify(real));
const page = (markers) => markers.map((m) => `  <!-- tracks:${m} -->\n  <!-- /tracks:${m} -->`).join('\n') + '\n';
const ALL = ['announce', 'chips', 'cards', 'closing'];

test('esc escapes markup, quotes and the & in app URLs', () => {
  assert.equal(esc('a&b<c>"d'), 'a&amp;b&lt;c&gt;&quot;d');
  assert.equal(esc("Brenner & Rector's"), 'Brenner &amp; Rector&#39;s');
});

test('rich isolates {{…}} runs and still escapes them', () => {
  assert.equal(rich('{{1,000+}} שאלות & {{<AI>}}'), '<span class="ltr-iso">1,000+</span> שאלות &amp; <span class="ltr-iso">&lt;AI&gt;</span>');
});

test('list joins one, two and three names', () => {
  assert.equal(list(['א'], ' ו'), 'א');
  assert.equal(list(['ברפואת משפחה', 'ברפואת ילדים'], ' ו'), 'ברפואת משפחה וברפואת ילדים');
  assert.equal(list(['a', 'b', 'c'], ' and '), 'a, b and c');
});

test('validate accepts the shipped list', () => {
  assert.doesNotThrow(() => validate(real));
});

test('validate rejects a bad status, a duplicate id, a non-slug id and a missing field', () => {
  const s = clone(); s.tracks[0].status = 'beta';
  assert.throws(() => validate(s), /status/);
  const d = clone(); d.tracks[1].id = d.tracks[0].id;
  assert.throws(() => validate(d), /duplicate/);
  const n = clone(); n.tracks[0].id = 'Nephro logy';
  assert.throws(() => validate(n), /slug/);
  const m = clone(); delete m.tracks[2].en.blurb;
  assert.throws(() => validate(m), /en\.blurb/);
});

test('cards: live spans, soon gets the notify link, nephrology links to its own page', () => {
  const out = render(real, page(ALL), 'he', 'x');
  assert.match(out, /<article class="track track--live" id="track-nephrology">/);
  assert.match(out, /href="\/nephrology" data-track="nephrology" data-track-via="card" aria-describedby="track-nephrology-name"/);
  assert.doesNotMatch(out, /data-cta=/);
  assert.match(out, /<article class="track track--soon" id="track-pediatrics">/);
  assert.match(out, /href="\/pediatrics" data-track="pediatrics" data-track-via="card" aria-describedby="track-pediatrics-name"/);
});

test('/en marks Hebrew destination pages, in the pill and in the link description', () => {
  const out = render(real, page(ALL), 'en', 'x');
  assert.match(out, /<span class="track-pill" id="track-family-medicine-lang">Hebrew content<\/span>/);
  assert.match(out, /hreflang="he" aria-describedby="track-family-medicine-name track-family-medicine-lang"/);
});

test('/en sends the nephrology card straight to the app, not to the Hebrew-only page', () => {
  const out = render(real, page(ALL), 'en', 'x');
  assert.match(out, /<a class="track-link" href="https:\/\/app\.meduxa\.ai\/\?signup=1&amp;src=landing&amp;pl=hero" data-track="nephrology" data-track-via="card" data-cta="hero" aria-describedby="track-nephrology-name">/);
  // The override drops pageLang for that card: no pill, no hreflang.
  assert.doesNotMatch(out, /id="track-nephrology-lang"/);
  assert.doesNotMatch(out, /data-track="nephrology" data-track-via="card"[^>]*hreflang/);
});

test('Hebrew page never shows the language pill', () => {
  assert.doesNotMatch(render(real, page(ALL), 'he', 'x'), /-lang"/);
});

test('announce and closing name every soon track, with Hebrew prefixes', () => {
  const out = render(real, page(ALL), 'he', 'x');
  assert.match(out, /הכנה לשלב א׳ ברפואת משפחה וברפואת ילדים/);
  assert.match(out, /מתכוננים לבחינה ברפואת משפחה, ברפואת ילדים, בגריאטריה, בפסיכיאטריה, בהרדמה או במיילדות וגינקולוגיה\?/);
});

test('a new soon entry is one list item: it reaches cards, chips, announce and closing', () => {
  const d = clone();
  d.tracks.push({ id: 'internal', status: 'soon', icon: 'family-medicine', launchOffer: true, href: '/internal-medicine',
    he: { name: 'פנימית', inline: 'פנימית', stage: 'שלב א', blurb: 'x', action: 'להרשמה מוקדמת' },
    en: { name: 'Internal medicine', inline: 'internal medicine', stage: 'Stage A', blurb: 'x', action: 'Join' } });
  const out = render(d, page(ALL), 'he', 'x');
  assert.match(out, /id="track-internal"/);
  assert.match(out, /href="#track-internal"/);
  assert.match(out, /ברפואת משפחה, ברפואת ילדים ובפנימית/);
  assert.match(out, /במיילדות וגינקולוגיה או בפנימית/);
});

test('no soon tracks: announce and closing render empty, markers kept', () => {
  const d = clone(); d.tracks = d.tracks.filter((t) => t.status === 'live');
  const out = render(d, page(ALL), 'he', 'x');
  assert.match(out, /  <!-- tracks:announce -->\n  <!-- \/tracks:announce -->/);
  assert.doesNotMatch(out, /class="announce"/);
  assert.doesNotMatch(out, /pilot-tracks/);
});

test('missing required marker throws; missing announce is skipped', () => {
  assert.throws(() => render(real, page(['chips', 'cards']), 'he', 'p.html'), /p\.html: missing <!-- tracks:closing -->/);
  assert.doesNotThrow(() => render(real, page(['chips', 'cards', 'closing']), 'en', 'x'));
});

test('output is indented to the marker and render is idempotent (what --check relies on)', () => {
  const src = '<div>\n      <!-- tracks:cards -->\n      stale hand edit\n      <!-- /tracks:cards -->\n</div>\n' + page(['chips', 'closing']);
  const once = render(real, src, 'he', 'x');
  assert.doesNotMatch(once, /stale hand edit/);
  assert.match(once, /\n      <article class="track track--live"/);
  assert.equal(render(real, once, 'he', 'x'), once);
});

test('shipped pages are in sync with tracks.json', () => {
  for (const [file, loc] of [['index.html', 'he'], ['en/index.html', 'en']]) {
    const html = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
    assert.equal(render(real, html, loc, file), html, file + ' drifted');
  }
});

test('coming-soon chips carry a non-colour marker (clock + words), live chips do not', () => {
  const out = render(real, page(ALL), 'he', 'x');
  assert.match(out, /data-track="pediatrics" data-track-via="chip" data-pack="[^"]*"><svg class="hero-track-icon"[^]*?<\/svg>רפואת ילדים<svg class="hero-track-clock"[^]*?<\/svg><span class="hero-track-soon">· בקרוב<\/span><\/a>/);
  assert.doesNotMatch(out, /data-track="nephrology" data-track-via="chip"[^]*?<\/svg>נפרולוגיה<svg/);
});

test('validate requires an ISO exam date, an exam name and a non-empty sources list', () => {
  const a = clone(); a.tracks[0].exam.date = '12/01/2027';
  assert.throws(() => validate(a), /exam\.date/);
  const b = clone(); delete b.tracks[0].exam.nameHe;
  assert.throws(() => validate(b), /exam\.nameHe/);
  const c = clone(); c.tracks[0].sources = [];
  assert.throws(() => validate(c), /sources/);
  const d = clone(); d.tracks[0].sources[0].kind = 'paper';
  assert.throws(() => validate(d), /kind/);
});

test('validate accepts a track whose exam date is not published yet, but not an empty date', () => {
  const a = clone(); delete a.tracks[0].exam.date;
  assert.doesNotThrow(() => validate(a));
  const b = clone(); b.tracks[0].exam.date = '';
  assert.throws(() => validate(b), /exam\.date/);
  const c = clone(); delete c.tracks[0].exam;
  assert.throws(() => validate(c), /exam is required/);
});

test('the shipped list has the eight tracks, IMA dates and the nephrology page link', () => {
  const by = Object.fromEntries(real.tracks.map((t) => [t.id, t]));
  assert.deepEqual(Object.keys(by).sort(), ['anesthesia', 'cardiology', 'family-medicine', 'geriatrics', 'nephrology', 'obgyn', 'pediatrics', 'psychiatry']);
  for (const id of ['geriatrics', 'psychiatry', 'anesthesia', 'obgyn']) {
    assert.equal(by[id].status, 'soon', id);
    assert.equal(by[id].href, '/' + id, id);
    assert.equal(by[id].launchOffer, undefined, id); // no launch-price promise on these
  }
  assert.equal(by.obgyn.exam.date, '2027-06-02');
  for (const id of ['geriatrics', 'psychiatry', 'anesthesia']) assert.equal(by[id].exam.date, undefined, id);
  assert.equal(by.nephrology.exam.date, '2027-01-12');
  assert.equal(by.cardiology.exam.date, '2026-12-15');
  assert.equal(by['family-medicine'].exam.date, '2027-06-14');
  assert.equal(by.pediatrics.exam.date, '2027-06-14');
  assert.equal(by.nephrology.exam.nameHe, 'בחינה במקצוע-על — חלק א׳');
  assert.equal(by.pediatrics.exam.nameHe, 'בחינת שלב א׳');
  assert.equal(by.nephrology.href, '/nephrology');
  assert.equal(by.nephrology.cta, undefined);
  assert.equal(by.nephrology.en.href, 'https://app.meduxa.ai/?signup=1&src=landing&pl=hero');
  assert.equal(by.nephrology.en.cta, 'hero');
  assert.equal(by.cardiology.status, 'live');
  assert.equal(by.cardiology.exam.nameHe, 'בחינה במקצוע-על — חלק א׳ (חלק ב׳ למחרת, 16.12.2026)');
  assert.equal(by.cardiology.href, '/cardiology');
  assert.ok(!/מחיר השקה/.test(by.cardiology.he.blurb));
});

test('cardiology is live: a live card, out of the launch-price bar and the closing line', () => {
  const html = render(real, page(ALL), 'he', 't');
  assert.match(html, /<article class="track track--live" id="track-cardiology">/);
  assert.match(html, /class="hero-track hero-track--live" href="#track-cardiology"/);
  assert.match(html, /href="\/nephrology"/);
  // announce bar keeps today's text: launch price, FM + peds only
  assert.match(html, /הכנה לשלב א׳ ברפואת משפחה וברפואת ילדים · מחיר השקה/);
  // the closing line names soon tracks only
  assert.match(html, /מתכוננים לבחינה ברפואת משפחה, ברפואת ילדים, בגריאטריה, בפסיכיאטריה, בהרדמה או במיילדות וגינקולוגיה\?/);
  assert.doesNotMatch(html, /בקרדיולוגיה\? <a href="#tracks">/);
});

test('fillSpans widens the soon cards of the last row so the 4-column grid has no empty cells', () => {
  const L = (id) => ({ id, status: 'live' }), S = (id) => ({ id, status: 'soon' });
  assert.deepEqual(fillSpans([L('a'), S('b'), S('c')]), {}); // full row
  assert.deepEqual(fillSpans([L('a'), S('b'), S('c'), S('d'), S('e')]), { d: 2, e: 2 });
  assert.deepEqual(fillSpans([S('a'), S('b'), S('c'), S('d'), S('e')]), { e: 4 });
  assert.deepEqual(fillSpans([S('a'), S('b'), S('c'), S('d'), S('e'), S('f'), S('g')]), { e: 2 });
  assert.deepEqual(fillSpans([L('a'), L('b'), L('c')]), {}); // a live-only last row stays as it is
  // the shipped list: 2 live + 6 soon leaves the last two soon cards half a row each
  assert.deepEqual(fillSpans(real.tracks), { anesthesia: 2, obgyn: 2 });
});

test('every track has its specialty icon on the card and the chip, hidden from screen readers', () => {
  const out = render(real, page(ALL), 'he', 'x');
  for (const t of real.tracks) {
    assert.match(out, new RegExp(`id="track-${t.id}">\\s*<div class="track-top"><span class="track-icon" data-pack="[^"]*"><svg class="track-icon-svg" aria-hidden="true" focusable="false"`), t.id);
    assert.match(out, new RegExp(`data-track="${t.id}" data-track-via="chip" data-pack="[^"]*"><svg class="hero-track-icon" aria-hidden="true" focusable="false"`), t.id);
  }
  assert.doesNotMatch(out, /<svg[^>]*\swidth="48"/); // the source size is dropped; CSS sizes the icon
});

test('validate refuses a track whose icon file does not exist', () => {
  const a = clone(); a.tracks[0].icon = 'no-such-icon';
  assert.throws(() => validate(a), /icon/);
  const b = clone(); delete b.tracks[0].icon;
  assert.throws(() => validate(b), /icon/);
});

test('the pack label names the pack and its stage, on the card icon and the chip', () => {
  const he = render(real, page(ALL), 'he', 'x');
  assert.match(he, /<span class="track-icon" data-pack="חבילת גריאטריה · שלב א׳">/);
  assert.match(he, /data-track="geriatrics" data-track-via="chip" data-pack="חבילת גריאטריה · שלב א׳">/);
  assert.match(he, /data-pack="חבילת קרדיולוגיה · מקצוע-על, חלקים א׳ וב׳"/);
  const en = render(real, page(ALL), 'en', 'x');
  assert.match(en, /data-pack="Geriatrics pack · Stage A"/);
});
