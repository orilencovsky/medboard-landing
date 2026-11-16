// /cardiology/sources, /nephrology/sources, /family-medicine/sources and /geriatrics/sources: hand-built static pages
// (<track>/sources.html). Nothing regenerates them, so these checks keep each
// one reachable, indexable and in step with tracks.json and
// scripts/countdown.mjs.
// Run: node --test scripts/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderPage } from './render-specialties.mjs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const tracks = JSON.parse(read('tracks.json')).tracks;
const dmy = (iso) => iso.split('-').reverse().join('.');
const visible = (html) => html.replace(/<script\b[\s\S]*?<\/script>/g, '').replace(/<style\b[\s\S]*?<\/style>/g, '')
  .replace(/<\/?span\b[^>]*>/g, '').replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');

// Per page: the tracks.json source titles it was written from (a change there
// must be carried into the page by hand, then here), the strings the page must
// show for them, and whether the track's own page makes the expert-review claim.
const PAGES = [
  {
    id: 'cardiology', crumb: 'קרדיולוגיה', expertReview: false,
    sources: ["Braunwald's Heart Disease 13e", 'ESC Guidelines', 'מאמרים עדכניים מכתבי עת (Eur Heart J, JACC, Circulation, JAMA)'],
    shows: ["Braunwald's Heart Disease", 'מהדורה 13', 'הנחיות ESC', 'European Heart Journal', 'JACC', 'Circulation', 'JAMA'],
  },
  {
    id: 'nephrology', crumb: 'נפרולוגיה', expertReview: true,
    sources: ["Brenner & Rector's The Kidney 11e", 'Johnson, Comprehensive Clinical Nephrology 7e', 'Daugirdas, Handbook of Dialysis 6e',
      'Rose & Post, Clinical Physiology of Acid-Base and Electrolyte Disorders 5e', 'Danovitch, Handbook of Kidney Transplantation 7e',
      'KDIGO', 'KDOQI', 'ISPD', 'נייר עמדה ישראלי ליתר לחץ דם 2026'],
    shows: ["Brenner & Rector's The Kidney, מהדורה 11", 'Comprehensive Clinical Nephrology, מהדורה 7', 'Johnson',
      'Handbook of Dialysis, מהדורה 6', 'Daugirdas', 'Clinical Physiology of Acid-Base and Electrolyte Disorders, מהדורה 5', 'Rose', 'Post',
      'Handbook of Kidney Transplantation, מהדורה 7', 'Danovitch', 'הנחיות KDIGO', 'הנחיות KDOQI', 'הנחיות ISPD', 'נייר עמדה ישראלי ליתר לחץ דם 2026'],
  },
  {
    id: 'family-medicine', crumb: 'רפואת משפחה', expertReview: true,
    sources: ['Goroll, Primary Care Medicine 9e', 'Nelson Textbook of Pediatrics 22e', 'AFP review articles',
      'הנחיות ונייר עמדה של ההסתדרות הרפואית', 'GINA', 'GOLD', 'ADA 2025', 'מדריך החיסונים של משרד הבריאות'],
    shows: ['Primary Care Medicine, מהדורה 9', 'Goroll', 'Nelson Textbook of Pediatrics, מהדורה 22',
      'מאמרי סקירה מכתב העת AFP', 'American Family Physician', 'הנחיות ונייר עמדה של ההסתדרות הרפואית',
      'הנחיות GINA', 'הנחיות GOLD', 'הנחיות ADA לשנת 2025', 'מדריך החיסונים של משרד הבריאות'],
  },
  {
    id: 'geriatrics', crumb: 'גריאטריה', expertReview: false,
    sources: ["Hazzard's Geriatric Medicine and Gerontology 8e", "Harrison's Principles of Internal Medicine 22e", 'פרסומי משרד הבריאות', 'מאמרים מכתבי עת'],
    shows: ["Hazzard's Geriatric Medicine and Gerontology, מהדורה 8", "Harrison's Principles of Internal Medicine, מהדורה 22", 'פרסומי משרד הבריאות', 'מאמרים מכתבי עת'],
  },
];

for (const cfg of PAGES) {
  const url = `https://meduxa.ai/${cfg.id}/sources`;
  const page = read(`${cfg.id}/sources.html`);
  const text = visible(page);
  const track = tracks.find((t) => t.id === cfg.id);
  const ld = [...page.matchAll(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/g)].map((m) => JSON.parse(m[1]));

  test(`${cfg.id}/sources: canonical, indexable, WebPage + 3-level breadcrumbs`, () => {
    assert.ok(page.includes(`<link rel="canonical" href="${url}" />`));
    assert.ok(page.includes('<meta name="robots" content="index, follow" />'));
    assert.equal(page.match(/<h1\b/g).length, 1);
    assert.equal(ld.find((b) => b['@type'] === 'WebPage').url, url);
    const crumbs = ld.find((b) => b['@type'] === 'BreadcrumbList').itemListElement;
    assert.deepEqual(crumbs.map((c) => c.item), ['https://meduxa.ai/', `https://meduxa.ai/${cfg.id}`, url]);
    assert.equal(crumbs[1].name, cfg.crumb);
  });

  test(`${cfg.id}/sources: exam exactly as tracks.json has it`, () => {
    assert.ok(page.includes(`data-exam-date="${track.exam.date}"`), 'countdown date drifted from tracks.json');
    assert.ok(text.includes(track.exam.nameHe), 'exam name drifted from tracks.json');
    assert.ok(text.includes(dmy(track.exam.date)), 'visible exam date drifted from tracks.json');
    assert.ok(page.includes(track.exam.url));
    // The dated sentence outside the countdown must be hideable after the
    // exam, and must itself carry the current date (the hero line alone
    // would satisfy a page-wide check).
    const fact = page.match(/<(\w+) data-exam-fact>([\s\S]*?)<\/\1>/);
    assert.ok(fact, 'the dated sentence must carry data-exam-fact');
    assert.ok(visible(fact[2]).includes(dmy(track.exam.date)), 'the date in the data-exam-fact sentence drifted');
    for (const d of track.exam.nameHe.match(/\d{2}\.\d{2}\.\d{4}/g) || []) assert.ok(text.includes(d), `date ${d} drifted`);
  });

  test(`${cfg.id}/sources: every source in tracks.json, edition included`, () => {
    assert.deepEqual(track.sources.map((s) => s.title), cfg.sources,
      `tracks.json ${cfg.id} sources changed: update ${cfg.id}/sources.html, then this list`);
    for (const s of cfg.shows) assert.ok(text.includes(s), `missing on the page: ${s}`);
  });

  test(`${cfg.id}/sources: inlines the current countdown functions`, () => {
    const src = read('scripts/countdown.mjs');
    for (const name of ['daysUntil', 'countdownState']) {
      const fn = src.match(new RegExp(`function ${name}\\b[\\s\\S]*?\\n}`))[0];
      assert.ok(page.includes(fn), `${name} drifted from scripts/countdown.mjs`);
    }
  });

  test(`${cfg.id}/sources: not an official list; expert-review claim only where the track page makes it`, () => {
    assert.ok(text.includes('לא רשימה רשמית'));
    const claims = /ביקורת מומחה|נבדק(ה|ות)? על ידי מומחה/.test(text);
    assert.equal(claims, cfg.expertReview);
    if (claims) assert.ok(read(`${cfg.id}.html`).includes('כל שאלה עוברת ביקורת מומחה'), 'the track page no longer makes the claim');
  });

  // A track that has not opened yet has nothing to sign in to: the page sends
  // to the sign-up on the track page, never to the app.
  test(`${cfg.id}/sources: the call to action matches the track status`, () => {
    if (track.status === 'soon') {
      assert.ok(!page.includes('app.meduxa.ai'), 'a soon track must not link to the app');
      assert.ok(page.includes(`href="/${cfg.id}#signup"`));
      assert.ok(read(`${cfg.id}.html`).includes('<section id="signup"'), 'the sign-up anchor moved');
    } else {
      assert.ok(page.includes('https://app.meduxa.ai/?signup=1'));
    }
  });

  // Copied from the track page, links like the nav button's #signup can point
  // at a section this page does not have.
  test(`${cfg.id}/sources: every in-page #link has its target`, () => {
    const ids = new Set([...page.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    for (const [, id] of page.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(id), `#${id} has no target`);
  });

  test(`/${cfg.id} links to its sources page, and the sitemap lists it`, () => {
    assert.ok(read(`${cfg.id}.html`).includes(`<a href="/${cfg.id}/sources">`));
    assert.ok(read('sitemap.xml').includes(`<loc>${url}</loc>`));
    assert.equal(JSON.parse(read(`specialties/${cfg.id}.json`)).sourcesHref, `/${cfg.id}/sources`);
  });
}

test('sourcesHref adds the link only where set, and is validated', () => {
  const template = read('specialty.template.html');
  const track = tracks.find((t) => t.id === 'cardiology');
  const p = JSON.parse(read('specialties/cardiology.json'));
  assert.ok(renderPage(template, p, structuredClone(track)).includes('class="src-more"'));
  const without = { ...p }; delete without.sourcesHref;
  assert.ok(!renderPage(template, without, structuredClone(track)).includes('class="src-more"'));
  assert.throws(() => renderPage(template, { ...p, sourcesHref: '/x"><script>' }, structuredClone(track)), /sourcesHref/);
});
