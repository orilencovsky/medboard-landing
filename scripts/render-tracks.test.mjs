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

test('cards: live spans, soon gets the notify link, nephrology keeps data-cta="hero"', () => {
  const out = render(real, page(ALL), 'he', 'x');
  assert.match(out, /<article class="track track--live" id="track-nephrology">/);
  assert.match(out, /href="https:\/\/app\.meduxa\.ai\/\?signup=1&amp;src=landing&amp;pl=hero" data-track="nephrology" data-track-via="card" data-cta="hero"/);
  assert.match(out, /<article class="track track--soon" id="track-pediatrics">/);
  assert.match(out, /href="\/pediatrics" data-track="pediatrics" data-track-via="card" aria-describedby="track-pediatrics-name"/);
});

test('/en marks Hebrew destination pages, in the pill and in the link description', () => {
  const out = render(real, page(ALL), 'en', 'x');
  assert.match(out, /<span class="track-pill" id="track-family-medicine-lang">Hebrew content<\/span>/);
  assert.match(out, /hreflang="he" aria-describedby="track-family-medicine-name track-family-medicine-lang"/);
  // The live track's page is the app itself: no language pill.
  assert.doesNotMatch(out, /track-nephrology-lang/);
});

test('Hebrew page never shows the language pill', () => {
  assert.doesNotMatch(render(real, page(ALL), 'he', 'x'), /-lang"/);
});

test('announce and closing name every soon track, with Hebrew prefixes', () => {
  const out = render(real, page(ALL), 'he', 'x');
  assert.match(out, /הכנה לשלב א׳ ברפואת משפחה וברפואת ילדים/);
  assert.match(out, /מתכוננים לשלב א׳ ברפואת משפחה או ברפואת ילדים\?/);
});

test('a new soon entry is one list item: it reaches cards, chips, announce and closing', () => {
  const d = clone();
  d.tracks.push({ id: 'internal', status: 'soon', href: '/internal-medicine',
    he: { name: 'פנימית', inline: 'פנימית', stage: 'שלב א', blurb: 'x', action: 'להרשמה מוקדמת' },
    en: { name: 'Internal medicine', inline: 'internal medicine', stage: 'Stage A', blurb: 'x', action: 'Join' } });
  const out = render(d, page(ALL), 'he', 'x');
  assert.match(out, /id="track-internal"/);
  assert.match(out, /href="#track-internal"/);
  assert.match(out, /ברפואת משפחה, ברפואת ילדים ובפנימית/);
  assert.match(out, /ברפואת משפחה, ברפואת ילדים או בפנימית/);
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
