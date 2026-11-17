// The site draws its icons from /ph.css (Phosphor glyphs as CSS masks), not from
// a third-party icon font. An icon with no rule there renders as a solid square.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const SKIP = new Set(['node_modules', '.git', '.claude', 'docs', 'design-system']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(html|mjs|json)$/.test(name) && !/\.test\.mjs$/.test(name)) out.push(p);
  }
  return out;
}

const css = readFileSync(join(root, 'ph.css'), 'utf8');
const defined = new Set([...css.matchAll(/^\.ph-([a-z-]+)\{/gm)].map((m) => m[1]));

test('every ph-* icon the pages, scripts and specialty data use has a rule in ph.css', () => {
  const used = new Map();
  for (const f of walk(root)) {
    const s = readFileSync(f, 'utf8');
    for (const m of s.matchAll(/\bph-([a-z]+(?:-[a-z]+)*)/g)) used.set(m[1], f);
    // state and perk icons are written as bare names in the specialty data
    if (/specialties[\\/].*\.json$/.test(f)) {
      for (const m of s.matchAll(/"icon":\s*"([a-z-]+)"/g)) used.set(m[1], f);
    }
  }
  const missing = [...used].filter(([n]) => !defined.has(n)).map(([n, f]) => `${n} (${f})`);
  assert.deepEqual(missing, []);
});

test('icons stay visible in Windows High Contrast and in print', () => {
  assert.match(css, /@media \(forced-colors: active\)\{[^}]*\.ph::before\{[^}]*forced-color-adjust:none[^}]*background-color:CanvasText/);
  assert.match(css, /print-color-adjust:exact/);
});

test('no page loads the icon font from a CDN', () => {
  const offenders = walk(root).filter((f) => f.endsWith('.html') && /phosphor-icons|cdn\.jsdelivr\.net/.test(readFileSync(f, 'utf8')));
  assert.deepEqual(offenders, []);
});

test('the Content-Security-Policy no longer allows jsdelivr', () => {
  assert.doesNotMatch(readFileSync(join(root, 'vercel.json'), 'utf8'), /jsdelivr/);
});
