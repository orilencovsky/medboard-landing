// /cardiology/sources: a hand-built static page (cardiology/sources.html).
// These checks keep it reachable, indexable and in step with tracks.json and
// scripts/countdown.mjs, since nothing regenerates it.
// Run: node --test scripts/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderPage } from './render-specialties.mjs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const page = read('cardiology/sources.html');
const tracks = JSON.parse(read('tracks.json')).tracks;
const track = tracks.find((t) => t.id === 'cardiology');
const ld = [...page.matchAll(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/g)].map((m) => JSON.parse(m[1]));
const dmy = (iso) => iso.split('-').reverse().join('.');
const text = page.replace(/<script\b[\s\S]*?<\/script>/g, '').replace(/<style\b[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/\s+/g, ' ');

test('sources page is canonical, indexable and carries WebPage + 3-level breadcrumbs', () => {
  assert.ok(page.includes('<link rel="canonical" href="https://meduxa.ai/cardiology/sources" />'));
  assert.ok(page.includes('<meta name="robots" content="index, follow" />'));
  assert.equal(page.match(/<h1\b/g).length, 1);
  const web = ld.find((b) => b['@type'] === 'WebPage');
  assert.equal(web.url, 'https://meduxa.ai/cardiology/sources');
  const crumbs = ld.find((b) => b['@type'] === 'BreadcrumbList').itemListElement;
  assert.deepEqual(crumbs.map((c) => c.item), ['https://meduxa.ai/', 'https://meduxa.ai/cardiology', 'https://meduxa.ai/cardiology/sources']);
});

test('sources page shows the exam exactly as tracks.json has it', () => {
  assert.ok(page.includes(`data-exam-date="${track.exam.date}"`), 'countdown date drifted from tracks.json');
  assert.ok(text.includes(track.exam.nameHe), 'exam name drifted from tracks.json');
  assert.ok(text.includes(dmy(track.exam.date)), 'visible exam date drifted from tracks.json');
  assert.ok(page.includes(track.exam.url));
  // The part B date is written into nameHe ("חלק ב׳ למחרת, 16.12.2026"); the facts paragraph repeats it.
  const partB = track.exam.nameHe.match(/\d{2}\.\d{2}\.\d{4}/);
  if (partB) assert.ok(page.includes(`<span data-exam-fact>`) && text.includes(partB[0]), 'part B date drifted');
});

test('sources page names every source in tracks.json, edition included', () => {
  const titles = track.sources.map((s) => s.title);
  assert.deepEqual(titles, ["Braunwald's Heart Disease 13e", 'ESC Guidelines', 'מאמרים עדכניים מכתבי עת (Eur Heart J, JACC, Circulation, JAMA)'],
    'tracks.json cardiology sources changed: update cardiology/sources.html, then this list');
  const edition = titles[0].match(/(\d+)e$/)[1];
  assert.ok(text.includes("Braunwald's Heart Disease") && text.includes(`מהדורה ${edition}`), 'Braunwald edition drifted');
  assert.ok(/הנחיות\s+ESC/.test(text));
  for (const j of titles[2].match(/\(([^)]+)\)/)[1].split(/,\s*/)) {
    assert.ok(text.includes(j === 'Eur Heart J' ? 'European Heart Journal' : j), j);
  }
});

test('sources page inlines the current countdown functions', () => {
  // Same check the renderer makes for generated pages: the inlined copy must
  // be scripts/countdown.mjs without its export keywords.
  const src = read('scripts/countdown.mjs');
  for (const name of ['daysUntil', 'countdownState']) {
    const fn = src.match(new RegExp(`function ${name}\\b[\\s\\S]*?\\n}`))[0];
    assert.ok(page.includes(fn), `${name} drifted from scripts/countdown.mjs`);
  }
});

test('sources page says the list is MeduXa\'s, not an official one, and makes no expert-review claim', () => {
  assert.ok(text.includes('לא רשימה רשמית'));
  assert.ok(!/ביקורת מומחה|נבדק(ה|ות)? על ידי מומחה/.test(text));
});

test('/cardiology links to its sources page, and the sitemap lists it', () => {
  assert.ok(read('cardiology.html').includes('<a href="/cardiology/sources">'));
  assert.ok(read('sitemap.xml').includes('<loc>https://meduxa.ai/cardiology/sources</loc>'));
});

test('sourcesHref adds the link only where set, escaped', () => {
  const template = read('specialty.template.html');
  const p = JSON.parse(read('specialties/cardiology.json'));
  assert.ok(renderPage(template, p, structuredClone(track)).includes('class="src-more"'));
  const without = { ...p }; delete without.sourcesHref;
  assert.ok(!renderPage(template, without, structuredClone(track)).includes('class="src-more"'));
  assert.throws(() => renderPage(template, { ...p, sourcesHref: '/x"><script>' }, structuredClone(track)), /sourcesHref/);
});
