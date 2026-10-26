// Tests for render-tracks.mjs. Plain node:test, no dependencies:
//   node --test scripts/render-tracks.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { esc, rich, list, validate, render } from './render-tracks.mjs';

const real = JSON.parse(readFileSync(new URL('../tracks.json', import.meta.url), 'utf8'));
const clone = () => JSON.parse(JSON.stringify(real));
const page = (markers) => markers.map((m) => `  <!-- tracks:${m} -->\n  <!-- /tracks:${m} -->`).join('\n') + '\n';
const ALL = ['announce', 'chips', 'cards', 'closing'];

test('esc escapes markup and the & in app URLs', () => {
  assert.equal(esc('a&b<c>"d'), 'a&amp;b&lt;c&gt;&quot;d');
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
  // Nephrology now has a Hebrew page of its own, so it carries the pill too.
  assert.match(out, /<span class="track-pill" id="track-nephrology-lang">Hebrew content<\/span>/);
});

test('Hebrew page never shows the language pill', () => {
  assert.doesNotMatch(render(real, page(ALL), 'he', 'x'), /-lang"/);
});

test('announce and closing name every soon track, with Hebrew prefixes', () => {
  const out = render(real, page(ALL), 'he', 'x');
  assert.match(out, /הכנה לשלב א׳ ברפואת משפחה וברפואת ילדים/);
  assert.match(out, /מתכוננים לבחינה ברפואת משפחה, ברפואת ילדים או בקרדיולוגיה\?/);
});

test('a new soon entry is one list item: it reaches cards, chips, announce and closing', () => {
  const d = clone();
  d.tracks.push({ id: 'internal', status: 'soon', launchOffer: true, href: '/internal-medicine',
    he: { name: 'פנימית', inline: 'פנימית', stage: 'שלב א', blurb: 'x', action: 'להרשמה מוקדמת' },
    en: { name: 'Internal medicine', inline: 'internal medicine', stage: 'Stage A', blurb: 'x', action: 'Join' } });
  const out = render(d, page(ALL), 'he', 'x');
  assert.match(out, /id="track-internal"/);
  assert.match(out, /href="#track-internal"/);
  assert.match(out, /ברפואת משפחה, ברפואת ילדים ובפנימית/);
  assert.match(out, /ברפואת משפחה, ברפואת ילדים, בקרדיולוגיה או בפנימית/);
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
  assert.match(out, /data-track="pediatrics" data-track-via="chip">רפואת ילדים<svg class="hero-track-clock"[^]*?<\/svg><span class="hero-track-soon">· בקרוב<\/span><\/a>/);
  assert.doesNotMatch(out, /data-track="nephrology" data-track-via="chip">[^<]*<svg/);
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

test('the shipped list has the four tracks, IMA dates and the nephrology page link', () => {
  const by = Object.fromEntries(real.tracks.map((t) => [t.id, t]));
  assert.deepEqual(Object.keys(by).sort(), ['cardiology', 'family-medicine', 'nephrology', 'pediatrics']);
  assert.equal(by.nephrology.exam.date, '2027-01-12');
  assert.equal(by.cardiology.exam.date, '2026-12-15');
  assert.equal(by['family-medicine'].exam.date, '2027-06-14');
  assert.equal(by.pediatrics.exam.date, '2027-06-14');
  assert.equal(by.nephrology.exam.nameHe, 'בחינה במקצוע-על — חלק א׳');
  assert.equal(by.pediatrics.exam.nameHe, 'בחינת שלב א׳');
  assert.equal(by.nephrology.href, '/nephrology');
  assert.equal(by.nephrology.cta, undefined);
  assert.equal(by.cardiology.status, 'soon');
  assert.equal(by.cardiology.href, '/cardiology');
  assert.ok(!/מחיר השקה/.test(by.cardiology.he.blurb));
});

test('cardiology gets a card and the closing line, but not the launch-price bar', () => {
  const html = render(real, page(ALL), 'he', 't');
  assert.match(html, /id="track-cardiology"/);
  assert.match(html, /href="\/nephrology"/);
  // announce bar keeps today's text: launch price, FM + peds only
  assert.match(html, /הכנה לשלב א׳ ברפואת משפחה וברפואת ילדים · מחיר השקה/);
  // closing line names all three soon tracks, without "שלב א׳"
  assert.match(html, /מתכוננים לבחינה ברפואת משפחה, ברפואת ילדים או בקרדיולוגיה\?/);
});
