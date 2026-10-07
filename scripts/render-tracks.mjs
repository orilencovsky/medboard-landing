#!/usr/bin/env node
// Renders the homepage's study tracks from tracks.json into index.html and
// en/index.html, between marker comments:
//
//   <!-- tracks:cards -->     … <!-- /tracks:cards -->     the #tracks grid        (required)
//   <!-- tracks:chips -->     … <!-- /tracks:chips -->     the hero chips          (required)
//   <!-- tracks:closing -->   … <!-- /tracks:closing -->   the line under #pilot   (required)
//   <!-- tracks:announce -->  … <!-- /tracks:announce -->  the top bar             (optional: /en has none)
//
// The site has no build step, so the pages stay plain static HTML (crawlers,
// no-JS and first paint all see the cards); this script is the "one list"
// half, run by hand after editing tracks.json:
//
//   node scripts/render-tracks.mjs           rewrite both pages
//   node scripts/render-tracks.mjs --check   exit 1 if either page differs
//
// Plain Node, no dependencies.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = [
  { file: 'index.html', locale: 'he' },
  { file: 'en/index.html', locale: 'en' },
];

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Escaped text, with {{…}} turned into an isolated left-to-right run.
export const rich = (s) => esc(s).replace(/\{\{(.+?)\}\}/g, '<span class="ltr-iso">$1</span>');

export function list(items, joiner) {
  if (items.length <= 1) return items.join('');
  return items.slice(0, -1).join(', ') + joiner + items[items.length - 1];
}

const CHECK = '<svg class="track-pill-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 6.2 5 8.6l4.5-5.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
const ARROW = '<svg class="track-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 7h9M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

export function validate(data) {
  const ids = new Set();
  for (const t of data.tracks) {
    if (!/^[a-z0-9-]+$/.test(t.id || '')) throw new Error(`track id must be a lowercase slug: ${JSON.stringify(t.id)}`);
    if (ids.has(t.id)) throw new Error(`duplicate track id: ${t.id}`);
    ids.add(t.id);
    if (t.status !== 'live' && t.status !== 'soon') throw new Error(`${t.id}: status must be "live" or "soon"`);
    if (!t.href) throw new Error(`${t.id}: href is required`);
    for (const loc of ['he', 'en']) for (const k of ['name', 'inline', 'stage', 'blurb', 'action']) {
      if (!t[loc] || !t[loc][k]) throw new Error(`${t.id}: ${loc}.${k} is required`);
    }
  }
}

function cards(data, locale) {
  const ui = data.ui[locale];
  return data.tracks.map((t) => {
    const c = t[locale];
    const nameId = `track-${t.id}-name`;
    const otherLang = t.pageLang && t.pageLang !== locale && ui.otherLang;
    const langId = `track-${t.id}-lang`;
    const live = t.status === 'live';
    const pills = [
      live
        ? `<span class="track-pill track-pill--live">${CHECK}${esc(ui.live)}</span>`
        : `<span class="track-pill">${esc(ui.soon)}</span>`,
    ];
    if (otherLang) pills.push(`<span class="track-pill" id="${langId}">${esc(ui.otherLang)}</span>`);
    const attrs = [
      `class="track-link${live ? '' : ' track-link--soon'}"`,
      `href="${esc(t.href)}"`,
      `data-track="${t.id}"`,
      'data-track-via="card"',
      t.cta ? `data-cta="${esc(t.cta)}"` : '',
      otherLang ? `hreflang="${esc(t.pageLang)}"` : '',
      `aria-describedby="${nameId}${otherLang ? ' ' + langId : ''}"`,
    ].filter(Boolean).join(' ');
    const action = live
      ? `<span class="btn-action btn-action-md track-btn">${esc(c.action)}</span>`
      : `<span class="track-soon-btn">${esc(c.action)}${ARROW}</span>`;
    return [
      `<article class="track track--${t.status}" id="track-${t.id}">`,
      `  <div class="track-pills">${pills.join('')}</div>`,
      `  <h3 class="track-name" id="${nameId}">${esc(c.name)} <span class="track-stage">${esc(c.stage)}</span></h3>`,
      `  <p class="track-blurb">${rich(c.blurb)}</p>`,
      `  <a ${attrs}>${action}</a>`,
      '</article>',
    ].join('\n');
  }).join('\n');
}

function chips(data, locale) {
  const ui = data.ui[locale];
  return data.tracks.map((t) => {
    const soon = t.status === 'soon' ? `<span class="hero-track-soon">${esc(ui.chipSoon)}</span>` : '';
    return `<a class="hero-track hero-track--${t.status}" href="#track-${t.id}" data-track="${t.id}" data-track-via="chip">${esc(t[locale].name)}${soon}</a>`;
  }).join('\n');
}

const soonTracks = (data) => data.tracks.filter((t) => t.status === 'soon');
const fill = (tpl, name) => tpl.replace('{name}', esc(name));

function closing(data, locale) {
  const ui = data.ui[locale];
  const soon = soonTracks(data);
  if (!soon.length) return '';
  const names = soon.map((t) => fill(ui.closingItem, t[locale].inline));
  return `<p class="pilot-tracks">${ui.closing.replace('{list}', list(names, ui.or))}</p>`;
}

function announce(data, locale) {
  const ui = data.ui[locale];
  const soon = soonTracks(data);
  if (!soon.length) return '';
  const names = soon.map((t) => fill(ui.announceItem, t[locale].inline));
  return [
    '<a href="#tracks" class="announce">',
    `  <span class="announce-pill">${esc(ui.soon)}</span>${ui.announce.replace('{list}', list(names, ui.and))}`,
    '</a>',
  ].join('\n');
}

const BLOCKS = { cards, chips, closing, announce };
const REQUIRED = new Set(['cards', 'chips', 'closing']);

export function render(data, html, locale, file) {
  for (const name of Object.keys(BLOCKS)) {
    const re = new RegExp(`^([ \\t]*)<!-- tracks:${name} -->\\n[\\s\\S]*?^[ \\t]*<!-- /tracks:${name} -->`, 'm');
    const m = re.exec(html);
    if (!m) {
      if (REQUIRED.has(name)) throw new Error(`${file}: missing <!-- tracks:${name} --> … <!-- /tracks:${name} --> markers`);
      continue;
    }
    const indent = m[1];
    const body = BLOCKS[name](data, locale).split('\n').filter((l) => l !== '').map((l) => indent + l).join('\n');
    const block = `${indent}<!-- tracks:${name} -->\n${body ? body + '\n' : ''}${indent}<!-- /tracks:${name} -->`;
    html = html.slice(0, m.index) + block + html.slice(m.index + m[0].length);
  }
  return html;
}

function main() {
  const data = JSON.parse(readFileSync(join(root, 'tracks.json'), 'utf8'));
  validate(data);
  const check = process.argv.includes('--check');
  let drift = 0;
  for (const { file, locale } of PAGES) {
    const path = join(root, file);
    const before = readFileSync(path, 'utf8');
    const after = render(data, before, locale, file);
    if (before === after) { console.log(`ok       ${file}`); continue; }
    if (check) { drift++; console.log(`DRIFT    ${file} (run: node scripts/render-tracks.mjs)`); continue; }
    writeFileSync(path, after);
    console.log(`written  ${file}`);
  }
  process.exit(drift ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
