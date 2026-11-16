// Site name for Google results. Google reads the WebSite block on the
// domain's home page (only "/"; /en is a subdirectory of the same site) and
// falls back to og:site_name and <title>. All of them must agree, and the
// Organization block must say the same thing on both home pages.
// Run: node --test scripts/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const blocks = (html) => [...html.matchAll(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/g)]
  .map((m) => JSON.parse(m[1]));
const he = read('index.html');
const en = read('en/index.html');

test('home page: one WebSite block, its name matching og:site_name and the title', () => {
  const sites = blocks(he).filter((b) => b['@type'] === 'WebSite');
  assert.equal(sites.length, 1);
  const [site] = sites;
  assert.equal(site.url, 'https://meduxa.ai/');
  assert.ok(he.includes(`<meta property="og:site_name" content="${site.name}" />`), 'og:site_name drifted');
  assert.ok(he.match(/<title>([^<]*)<\/title>/)[1].startsWith(site.name + ' '), 'title no longer starts with the site name');
  assert.deepEqual([].concat(site.alternateName).sort(), ['MeduXa', 'מדוקסה'].sort());
});

// The Hebrew spelling only counts if people can see it on the page too,
// not just in structured data.
test('home page shows the Hebrew name in the title, the FAQ and the footer', () => {
  assert.ok(he.match(/<title>([^<]*)<\/title>/)[1].includes('מדוקסה'));
  assert.ok(he.includes('<p>MeduXa, או בעברית מדוקסה, היא'));
  assert.ok(he.includes('© 2026 MeduXa · מדוקסה ·'));
});

test('/en carries no WebSite block of its own', () => {
  assert.equal(blocks(en).filter((b) => b['@type'] === 'WebSite').length, 0);
});

test('Organization is the same on both home pages and names the site', () => {
  const org = (html) => blocks(html).filter((b) => b['@type'] === 'Organization');
  assert.equal(org(he).length, 1);
  assert.deepEqual(org(en), org(he));
  const site = blocks(he).find((b) => b['@type'] === 'WebSite');
  const names = (b) => [b.name, ...[].concat(b.alternateName)].sort();
  assert.deepEqual(names(org(he)[0]), names(site));
});
