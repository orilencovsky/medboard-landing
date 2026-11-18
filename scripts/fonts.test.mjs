// The fonts are self-hosted under /fonts/ (README "Fonts"): no page may load
// them from Google Fonts again (that sent every visitor's IP to Google before
// any consent), and every file the stylesheet or a preload names must exist.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const SKIP = new Set(['node_modules', '.git', '.claude', 'docs', 'fonts']);
const GOOGLE = /fonts\.(googleapis|gstatic)\.com/;

function walk(dir, re, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, re, out);
    else if (re.test(name) && !/\.test\.mjs$/.test(name)) out.push(p);
  }
  return out;
}
const rel = (p) => relative(root, p).replace(/\\/g, '/');
const pages = walk(root, /\.html$/);
const fontsCss = readFileSync(join(root, 'fonts', 'fonts.css'), 'utf8');
const cssFiles = [...fontsCss.matchAll(/url\(([^)]+\.woff2)\)/g)].map((m) => m[1]);

test('no page, script, stylesheet or vercel.json loads Google Fonts', () => {
  const hits = walk(root, /\.(html|js|mjs|css|json)$/).filter((f) => GOOGLE.test(readFileSync(f, 'utf8'))).map(rel);
  assert.deepEqual(hits, []);
});

test('the CSP allows fonts and stylesheets from the site itself only', () => {
  const csp = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8')).headers
    .flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy').value;
  assert.match(csp, /(^|; )font-src 'self'(;|$)/);
  assert.match(csp, /(^|; )style-src 'self' 'unsafe-inline'(;|$)/);
});

test('every woff2 that fonts.css references exists', () => {
  assert.ok(cssFiles.length > 0);
  assert.deepEqual(cssFiles.filter((f) => !existsSync(join(root, 'fonts', f))), []);
});

test('every page links /fonts/fonts.css and preloads only files fonts.css serves', () => {
  for (const f of pages) {
    const s = readFileSync(f, 'utf8');
    if (!/<link rel="stylesheet" href="\/fonts\/fonts\.css">/.test(s)) {
      assert.ok(!/IBM Plex/.test(s), `${rel(f)} uses IBM Plex but does not link /fonts/fonts.css`);
      continue;
    }
    const pre = [...s.matchAll(/<link rel="preload" href="\/fonts\/([^"]+)" as="font" type="font\/woff2" crossorigin>/g)].map((m) => m[1]);
    assert.ok(pre.length > 0, `${rel(f)} links fonts.css but preloads no font`);
    for (const p of pre) assert.ok(cssFiles.includes(p), `${rel(f)} preloads ${p}, which fonts.css does not use`);
    assert.ok(s.indexOf('rel="preload" href="/fonts/') < s.indexOf('href="/fonts/fonts.css"'), `${rel(f)}: preloads go before the stylesheet`);
  }
});

test('every IBM Plex stack names its metric-matched fallback', () => {
  for (const f of pages) {
    const s = readFileSync(f, 'utf8');
    for (const m of s.matchAll(/'IBM Plex (Sans Hebrew|Sans|Mono)'\s*,\s*([^;"}]+)/g)) {
      if (m[1] === 'Sans' && /^var\(--sans\)/.test(m[2])) continue; // falls through to the Hebrew stack
      assert.ok(m[2].startsWith(`'IBM Plex ${m[1]} Fallback'`), `${rel(f)}: '${m[0].slice(0, 80)}' has no fallback face`);
    }
  }
  for (const fam of ['Sans Hebrew', 'Sans', 'Mono']) assert.match(fontsCss, new RegExp(`font-family: 'IBM Plex ${fam} Fallback'`));
});
