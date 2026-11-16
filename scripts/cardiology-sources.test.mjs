// /cardiology/sources: a hand-built static page (cardiology/sources.html).
// These checks keep it reachable, indexable and in step with tracks.json.
// Run: node --test scripts/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const page = read('cardiology/sources.html');
const track = JSON.parse(read('tracks.json')).tracks.find((t) => t.id === 'cardiology');
const ld = [...page.matchAll(/<script type="application\/ld\+json">\r?\n([\s\S]*?)\r?\n<\/script>/g)].map((m) => JSON.parse(m[1]));

test('sources page is canonical, indexable and carries WebPage + 3-level breadcrumbs', () => {
  assert.ok(page.includes('<link rel="canonical" href="https://meduxa.ai/cardiology/sources" />'));
  assert.ok(page.includes('<meta name="robots" content="index, follow" />'));
  assert.equal(page.match(/<h1\b/g).length, 1);
  const web = ld.find((b) => b['@type'] === 'WebPage');
  assert.equal(web.url, 'https://meduxa.ai/cardiology/sources');
  const crumbs = ld.find((b) => b['@type'] === 'BreadcrumbList').itemListElement;
  assert.deepEqual(crumbs.map((c) => c.item), ['https://meduxa.ai/', 'https://meduxa.ai/cardiology', 'https://meduxa.ai/cardiology/sources']);
});

test('sources page shows the exam date from tracks.json and every source', () => {
  assert.ok(page.includes(`data-exam-date="${track.exam.date}"`), 'exam date drifted from tracks.json');
  assert.ok(page.includes(track.exam.url));
  assert.ok(page.includes('Braunwald'));
  assert.ok(page.includes('ESC'));
  for (const j of ['European Heart Journal', 'JACC', 'Circulation', 'JAMA']) assert.ok(page.includes(j), j);
  assert.equal(track.sources.length, 3, 'tracks.json sources changed: update cardiology/sources.html');
});

test('sources page says the list is MeduXa\'s, not an official one', () => {
  assert.ok(page.includes('לא רשימה רשמית'));
});

test('/cardiology links to its sources page, and the sitemap lists it', () => {
  assert.ok(read('cardiology.html').includes('<a href="/cardiology/sources">'));
  assert.ok(read('sitemap.xml').includes('<loc>https://meduxa.ai/cardiology/sources</loc>'));
  assert.ok(!read('nephrology.html').includes('class="src-more"'), 'only pages with sourcesHref get the link');
});
