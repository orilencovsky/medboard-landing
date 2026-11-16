// The homepage FAQ (#faq) and its FAQPage JSON-LD in <head> must say the same
// thing: Google ignores structured data that does not match the visible page.
// Run: node --test scripts/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const text = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

export function visibleFaq(html) {
  const section = html.match(/<section id="faq"[\s\S]*?<\/section>/);
  if (!section) return [];
  return [...section[0].matchAll(/<summary>([\s\S]*?)<\/summary>\s*<div class="faq-a">([\s\S]*?)<\/div>/g)]
    .map((m) => ({ q: text(m[1]), a: text(m[2]) }));
}

export function faqJsonLd(html) {
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const data = JSON.parse(m[1]);
    if (data['@type'] === 'FAQPage') return data.mainEntity.map((e) => ({ q: e.name, a: e.acceptedAnswer.text }));
  }
  return null;
}

test('homepage FAQ: JSON-LD matches the visible questions and answers', () => {
  const html = readFileSync(root + 'index.html', 'utf8');
  const shown = visibleFaq(html);
  assert.ok(shown.length >= 3, 'expected a #faq section with questions');
  assert.deepEqual(faqJsonLd(html), shown);
});
