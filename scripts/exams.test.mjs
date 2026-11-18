// Tests for render-exams.mjs and the committed /exams page:
//   node --test scripts/exams.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { renderExams, ordered, years, row } from './render-exams.mjs';
import { daysUntil, countdownState } from './countdown.mjs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const data = JSON.parse(read('tracks.json'));
const template = read('exams.template.html');
const page = read('exams.html');
const served = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
const clone = () => JSON.parse(JSON.stringify(data));
const dotted = (iso) => iso.split('-').reverse().join('.');
// Every sources page, from sourcesHref in specialties/<track>.json.
const sourcesPages = data.tracks.map((t) => existsSync(new URL(`../specialties/${t.id}.json`, import.meta.url)) && JSON.parse(read(`specialties/${t.id}.json`)).sourcesHref)
  .filter(Boolean).map((h) => h.slice(1) + '.html');

test('exams.html is what the renderer makes from tracks.json', () => {
  assert.equal(renderExams(template, data), page);
});

test('every track appears once, with its exam name, date and page link', () => {
  const out = served(page);
  for (const t of data.tracks) {
    assert.equal(out.split(`href="${t.href}" data-ex-cta="row"`).length - 1, 1, t.id);
    assert.ok(out.includes(t.exam.nameHe.replace(/&/g, '&amp;')), t.id);
    if (t.exam.date) assert.ok(out.includes(`data-exam-date="${t.exam.date}"`), t.id);
    if (t.exam.date) assert.ok(out.includes(`<span class="ltr-iso">${dotted(t.exam.date)}</span> · `), t.id);
  }
});

test('rows are in date order, undated last', () => {
  const dates = [...page.matchAll(/<li class="exam-row"(?: data-exam-date="([\d-]+)")?>/g)].map((m) => m[1] || null);
  assert.equal(dates.length, data.tracks.length);
  const dated = dates.filter(Boolean);
  assert.deepEqual(dated, [...dated].sort());
  assert.ok(dates.indexOf(null) === -1 || dates.slice(dates.indexOf(null)).every((d) => d === null));
});

test('ordered() keeps undated tracks at the end in tracks.json order', () => {
  const t = (id, date) => ({ id, exam: date ? { date } : {} });
  assert.deepEqual(ordered([t('a'), t('b', '2027-06-14'), t('c'), t('d', '2026-12-15')]).map((x) => x.id), ['d', 'b', 'a', 'c']);
});

test('years() spans the dated exams', () => {
  assert.equal(years([{ exam: { date: '2026-12-15' } }, { exam: { date: '2027-06-14' } }, { exam: {} }]), '2026-2027');
  assert.equal(years([{ exam: { date: '2027-06-14' } }]), '2027');
  assert.throws(() => years([{ exam: {} }]));
});

test('title, h1, og and twitter titles carry the years; title fits in 60 characters', () => {
  const y = years(data.tracks);
  const title = page.match(/<title>(.*?)<\/title>/)[1];
  assert.equal(title, `מועדי בחינות שלב א׳ ומקצוע-על ${y} | MeduXa.ai`);
  assert.ok(title.length <= 60, title.length);
  assert.ok(page.includes(`<meta property="og:title" content="${title}" />`));
  assert.ok(page.includes(`<meta name="twitter:title" content="${title}" />`));
  // The year range is one isolated LTR run that never breaks at its hyphen.
  assert.match(page, new RegExp(`<h1[^>]*>מועדי הבחינות <span class="ltr-iso" style="white-space: nowrap;">${y}</span></h1>`));
});

test('canonical, JSON-LD and sitemap point at /exams', () => {
  assert.ok(page.includes('<link rel="canonical" href="https://meduxa.ai/exams" />'));
  const blocks = [...page.matchAll(/<script type="application\/ld\+json">\n(.*)\n<\/script>/g)].map((m) => JSON.parse(m[1]));
  assert.deepEqual(blocks.map((b) => b['@type']), ['WebPage', 'BreadcrumbList']);
  assert.equal(blocks[0].url, 'https://meduxa.ai/exams');
  assert.equal(blocks[0].name, page.match(/<title>(.*?)<\/title>/)[1]);
  assert.equal(blocks[1].itemListElement.at(-1).item, 'https://meduxa.ai/exams');
  assert.ok(read('sitemap.xml').includes('<loc>https://meduxa.ai/exams</loc>'));
});

test('no unfilled template values and nothing left from the family-medicine page', () => {
  assert.ok(!/\{\{/.test(page));
  for (const s of ['data-fm-cta', 'fm_', 'Goroll', '#signup']) assert.ok(!page.includes(s), s);
});

test('the page cites the IMA calendar and says dates may change', () => {
  const out = served(page);
  assert.ok(out.includes('href="https://www.ima.org.il/Internship/Events.aspx"'));
  assert.ok(out.includes('מועדים עשויים להשתנות'));
});

test('a sources link appears only for tracks with a sources page, and it exists', () => {
  for (const t of data.tracks) {
    const m = page.match(new RegExp(`<a href="([^"]+)" data-ex-cta="row_sources" data-track="${t.id}">`));
    const spec = JSON.parse(read(`specialties/${t.id}.json`));
    assert.equal(m ? m[1] : undefined, spec.sourcesHref, t.id);
    if (m) assert.ok(existsSync(new URL('../' + m[1].slice(1) + '.html', import.meta.url)), m[1]);
  }
});

test('an undated row links to the IMA calendar and has no countdown', () => {
  const t = clone().tracks[0];
  delete t.exam.date;
  const html = row(t, data.ui.he, null);
  assert.ok(!html.includes('data-exam-date'));
  assert.ok(!html.includes('exam-days'));
  assert.ok(html.includes('המועד בלוח הר״י'));
});

test('the inlined day math is scripts/countdown.mjs', () => {
  assert.ok(page.includes(String(daysUntil)));
  assert.ok(page.includes(String(countdownState)));
});

test('every footer links to /exams', () => {
  assert.ok(sourcesPages.length >= 5, 'sourcesHref lookup found too few sources pages');
  const files = ['index.html', 'specialty.template.html', ...sourcesPages, 'privacy.html', 'terms.html', 'accessibility.html', 'connect.html',
    ...data.tracks.map((t) => t.href.slice(1) + '.html')];
  for (const f of files) assert.match(read(f), /<a class="foot-link" href="\/exams">מועדי בחינות<\/a>/, f);
});

// Run the page's countdown script against a fake DOM.
function runCountdown(now, dates = ['2027-06-14', '2026-11-16', '2026-11-15'], intl = Intl) {
  const src = [...page.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.includes('[data-exam-date]'));
  const iife = src.slice(src.indexOf('  // Exam countdowns'));
  const mk = (date) => {
    const el = (extra = {}) => ({ textContent: '', hidden: true, ...extra });
    const num = el(), unit = el(), line = el({ querySelector: (q) => (q === '[data-days]' ? num : unit) }), when = el({ textContent: 'served' });
    return { date, num, unit, line, when, getAttribute: () => date, querySelector: (q) => (q === '.exam-days' ? line : when) };
  };
  const rows = dates.map(mk);
  const list = { order: [...rows], appendChild(r) { this.order.splice(this.order.indexOf(r), 1); this.order.push(r); } };
  for (const r of rows) r.parentNode = list;
  const RealDate = Date;
  const ctx = vm.createContext({
    Intl: intl, Math, Number, isFinite, Array,
    Date: class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(now); } static UTC(...a) { return RealDate.UTC(...a); } },
    document: { querySelectorAll: () => rows },
    window: { matchMedia: () => ({ matches: true }) },
  });
  vm.runInContext(iife, ctx);
  rows.order = list.order;
  return rows;
}

test('countdown: future shows days, exam day says so, past swaps the line', () => {
  const [future, today, past] = runCountdown(new Date('2026-11-16T10:00:00+02:00'));
  assert.equal(future.num.textContent, 210);
  assert.equal(future.unit.textContent, 'ימים לבחינה');
  assert.equal(future.line.hidden, false);
  assert.equal(today.unit.textContent, 'הבחינה היום');
  assert.equal(today.num.hidden, true);
  assert.equal(past.when.textContent, 'מועד הבחינה הבא יפורסם בקרוב');
  assert.equal(past.line.hidden, true);
});

test('countdown: a past sitting moves to the end of the list, the rest keep their order', () => {
  const rows = runCountdown(new Date('2026-12-20T10:00:00+02:00'), ['2026-12-15', '2027-01-12', '2027-06-14']);
  assert.deepEqual(rows.order.map((r) => r.date), ['2027-01-12', '2027-06-14', '2026-12-15']);
});

test('countdown: one day left reads in the singular', () => {
  const [r] = runCountdown(new Date('2027-06-13T10:00:00+03:00'), ['2027-06-14']);
  assert.equal(r.num.textContent, 1);
  assert.equal(r.unit.textContent, 'יום לבחינה');
});

test('countdown: if the day math throws, the row stays as served', () => {
  const broken = { DateTimeFormat: function () { throw new Error('no Intl'); } };
  const [r] = runCountdown(new Date('2026-11-16T10:00:00+02:00'), ['2027-06-14'], broken);
  assert.equal(r.line.hidden, true);
  assert.equal(r.when.textContent, 'served');
});

test('the templates are not deployed (.vercelignore)', () => {
  const ignored = read('.vercelignore').split(/\r?\n/).map((l) => l.trim());
  for (const f of ['specialty.template.html', 'exams.template.html']) assert.ok(ignored.includes(f), f);
});

test('row() escapes what it prints', () => {
  const t = clone().tracks[0];
  t.he.name = '<b>x</b>'; t.exam.nameHe = 'a & "b"'; t.href = '/x"y';
  const html = row(t, data.ui.he, null);
  assert.ok(!html.includes('<b>x</b>'));
  assert.ok(html.includes('&lt;b&gt;x&lt;/b&gt;') && html.includes('a &amp; &quot;b&quot;') && html.includes('href="/x&quot;y"'));
});

test('pages inside the site link to /exams, not only footers', () => {
  // Home: the line under the study tracks.
  assert.match(read('index.html'), /<p class="tracks-more">[^\n]*<a href="\/exams">/);
  // Every dated countdown, on the specialty pages and the sources pages.
  const files = [...data.tracks.filter((t) => t.exam.date).map((t) => t.href.slice(1) + '.html'), ...sourcesPages];
  for (const f of files) assert.match(read(f), /<p class="cd-note">[^\n]*<a href="\/exams">כל מועדי הבחינות<\/a><\/p>/, f);
});
