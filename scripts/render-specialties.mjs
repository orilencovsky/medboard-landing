#!/usr/bin/env node
// Renders the specialty pages (/family-medicine, /pediatrics, …) from one
// template, specialty.template.html, and one data file per page,
// specialties/<track-id>.json. The exam (name, date, IMA link) and the
// sources list come from that track in tracks.json, so the homepage and the
// page can never disagree. Each page is written to <track href>.html at the
// repo root and committed: the site still has no build step at deploy.
//
//   node scripts/render-specialties.mjs           rewrite every page
//   node scripts/render-specialties.mjs --check   exit 1 if any page differs
//
// Template syntax:
//   {{name}}      escaped text (a dotted path such as {{signup.source}} works)
//   {{{name}}}    HTML, inserted as it is. Alone on its line, every line of
//                 the value gets that line's indentation.
//   <!-- if:flag --> … <!-- /if:flag -->   kept only when the flag is on.
//                 Flags: soon, live (from mode), questions (any questions),
//                 review (page has cmpReview, the expert-review comparison row).
// The countdown, sources, questions, status states and perks are built here
// and inserted with {{{countdown}}}, {{{sources}}}, {{{questions}}},
// {{{states}}} and {{{perks}}}.
//
// Page data: plain-text fields are escaped. In lead, state titles and text,
// question topic, stem, option text, why, quote and citation, {{…}} marks a
// Latin run inside Hebrew (as in tracks.json). Fields ending in Html, a perk's
// html and an option's tutor line are trusted HTML, written by hand.
//
// Plain Node, no dependencies.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, rich, validate as validateTracks } from './render-tracks.mjs';
import { daysUntil, countdownState } from './countdown.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://meduxa.ai';
const KEYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
const MAX_QUESTIONS = 5;
const TEXT = ['title', 'description', 'ogDescription', 'ogImage', 'ogImageAlt', 'chip', 'heroStage', 'lead',
  'statementHtml', 'featuresLead', 'cmpStyle.label', 'cmpStyle.full'];

// Inside a double-quoted attribute only & and " need escaping, and the value
// may carry HTML (data-tutor is shown with innerHTML), as the pages always did.
const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
// The body of a single-quoted JS string inside <script>.
const jsStr = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/</g, '\\x3c')
  .replace(/\r?\n/g, '\\n').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
// 'YYYY-MM-DD' → 'DD.MM.YYYY'
const dateText = (iso) => iso.split('-').reverse().join('.');
const isHebrew = (s) => /[\u0590-\u05FF]/.test(s);

function lookup(obj, path) {
  let v = obj;
  for (const k of path.split('.')) v = v == null ? undefined : v[k];
  return v;
}

export function validatePage(page, track) {
  const fail = (msg) => { throw new Error(`specialties/${page && page.trackId}.json: ${msg}`); };
  if (!track || page.trackId !== track.id) fail(`trackId ${JSON.stringify(page.trackId)} does not match track ${track && track.id}`);
  if (!/^\/[a-z0-9-]+$/.test(track.href || '')) fail(`track href must look like /some-page: ${JSON.stringify(track.href)}`);
  if (!/^[a-z]+$/.test(page.prefix || '')) fail('prefix must be lowercase letters');
  if (page.mode !== 'soon' && page.mode !== 'live') fail('mode must be "soon" or "live"');
  for (const k of TEXT) if (!lookup(page, k)) fail(`${k} is required`);
  // The comparison row on expert review is optional: a page whose questions are
  // not (yet) reviewed leaves cmpReview out and the row is not rendered.
  if (page.cmpReview !== undefined) for (const k of ['cmpReview.label', 'cmpReview.full']) if (!lookup(page, k)) fail(`${k} is required when cmpReview is present`);
  if (!Array.isArray(page.states) || !page.states.length) fail('states must be a non-empty list');
  for (const s of page.states) {
    if (s.kind !== 'done' && s.kind !== 'build') fail('state kind must be "done" or "build"');
    if (!/^[a-z-]+$/.test(s.icon || '')) fail('state icon must be a Phosphor icon name, e.g. "check-circle"');
    if (!s.title || !s.text) fail('every state needs a title and text');
  }
  if (page.mode === 'soon') {
    const s = page.signup;
    if (!s) fail('a soon page needs signup');
    for (const k of ['source', 'interest']) if (!/^[a-z_]+$/.test(s[k] || '')) fail(`signup.${k} must be a lowercase key`);
    for (const k of ['consentText', 'successText']) if (!s[k]) fail(`signup.${k} is required`);
    if (!Array.isArray(s.perks) || !s.perks.length) fail('signup.perks must be a non-empty list');
    for (const p of s.perks) {
      if (typeof p === 'string' ? !p : !p || !p.html || !/^[a-z-]+$/.test(p.icon || '')) fail('a perk is an HTML string or { icon, html }');
    }
  } else {
    if (!page.app) fail('a live page needs app links (app.hrefHero, app.hrefClosing)');
    for (const k of ['hrefHero', 'hrefClosing']) if (!/^https:\/\//.test(page.app[k] || '')) fail(`app.${k} must be an https URL`);
  }
  if (!Array.isArray(page.questions)) fail('questions must be a list (empty for none)');
  if (page.questions.length > MAX_QUESTIONS) fail(`at most ${MAX_QUESTIONS} questions`);
  page.questions.forEach((q, i) => {
    const qfail = (msg) => fail(`question ${i + 1}: ${msg}`);
    for (const k of ['topic', 'stem', 'explanationHtml']) if (!q[k]) qfail(`${k} is required`);
    if (!!q.quote !== !!q.citation) qfail('quote and citation go together');
    if (!q.quote && !/class="q-src"/.test(q.explanationHtml)) qfail('needs a quote and citation (or a q-src figure in explanationHtml)');
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > KEYS.length) qfail(`needs 2–${KEYS.length} options`);
    if (q.options.filter((o) => o.right === true).length !== 1) qfail('needs exactly one right option');
    const keys = new Set();
    for (const o of q.options) {
      if (!/^[a-z]$/.test(o.key || '') || keys.has(o.key)) qfail(`option keys must be distinct letters: ${JSON.stringify(o.key)}`);
      keys.add(o.key);
      if (!o.text) qfail(`option ${o.key} needs text`);
      if (!o.right && !o.tutor && !o.why) qfail(`wrong option ${o.key} needs a tutor line or a why`);
    }
  });
}

// The served HTML names the exam and its date; the page script only adds
// the day count to <b data-days> (or swaps in the "today" / "next date" text).
function countdown(track) {
  const { date, nameHe, url } = track.exam;
  return [
    `<div class="countdown enter" style="--i:4" data-exam-date="${esc(date)}">`,
    // Empty and hidden until the script fills it: no-JS readers never see a
    // "days to the exam" line without its number.
    '  <p class="cd-days" hidden><b data-days></b> <span data-cd-unit></span></p>',
    `  <p class="cd-exam">${esc(nameHe)} · <span class="ltr-iso">${esc(dateText(date))}</span></p>`,
    `  <p class="cd-note"><a href="${esc(url)}" target="_blank" rel="noopener">לפי לוח הבחינות של הר״י · המועד עשוי להשתנות</a></p>`,
    '</div>',
  ].join('\n');
}

// Books first, then the rest. No per-item category label: some entries kept
// as "guideline" in tracks.json are really review articles.
function sources(track) {
  const ordered = [...track.sources.filter((s) => s.kind === 'book'), ...track.sources.filter((s) => s.kind !== 'book')];
  const items = ordered.map((s) => {
    const icon = s.kind === 'book' ? 'ph-book-open' : 'ph-file-text';
    // A Latin title is one isolated left-to-right run; a Hebrew one reads as is.
    const title = isHebrew(s.title) ? rich(s.title) : `<span class="ltr-iso">${esc(s.title)}</span>`;
    return `      <li><i class="ph ${icon}" aria-hidden="true"></i>${title}</li>`;
  });
  return [
    '<section class="sources" aria-labelledby="t-sources">',
    '  <div class="wrap">',
    '    <div class="sec-head" data-reveal>',
    '      <h2 id="t-sources">על מה מבוססים ההסברים</h2>',
    '      <p>המקורות המרכזיים שמהם לקוחים ההסברים והציטוטים בשאלות.</p>',
    '    </div>',
    '    <ul class="src-list" data-reveal style="--i:1">',
    ...items,
    '    </ul>',
    '  </div>',
    '</section>',
  ].join('\n');
}

function option(o, k) {
  const data = o.right ? ' data-right' : o.tutor ? ` data-tutor="${attr(o.tutor)}"` : ` data-why="${attr(rich(o.why))}"`;
  const icon = o.right ? 'ph-check-circle' : 'ph-x-circle';
  return `<button type="button" class="q-opt" data-k="${o.key}"${data}><span class="q-key">${KEYS[k]}</span>${rich(o.text)}<i class="ph ${icon}" aria-hidden="true"></i></button>`;
}

function explanation(q) {
  const src = q.quote
    ? `<figure class="q-src"><blockquote>״${rich(q.quote)}״</blockquote><figcaption>${rich(q.citation)}</figcaption></figure>`
    : '';
  return q.explanationHtml + src;
}

// One question: today's card, as it was. Two or more: one at a time, with
// "שאלה X מתוך N" and previous/next; every part of question i has data-q="i".
function questions(qs) {
  const many = qs.length > 1;
  const nth = (i) => (many ? ` data-q="${i + 1}"${i ? ' hidden' : ''}` : '');
  const head = [
    '<div class="q-head">',
    `  <h2 class="q-title" id="q-title">${many ? 'שאלות לדוגמה, נסו לענות' : 'שאלה לדוגמה, נסו לענות'}</h2>`,
    ...qs.map((q, i) => `  <span class="q-topic"${nth(i)}>${rich(q.topic)}</span>`),
    '</div>',
  ];
  const body = qs.flatMap((q, i) => {
    const id = many ? `-${i + 1}` : '';
    const lines = [
      `<p class="q-stem" id="q-stem${id}">${rich(q.stem)}</p>`,
      `<div class="q-opts" role="group" aria-labelledby="q-stem${id}">`,
      ...q.options.map((o, k) => '  ' + option(o, k)),
      '</div>',
      `<div class="q-out" id="q-out${id}" aria-live="polite"></div>`,
      `<template class="q-explain-src">${explanation(q)}</template>`,
    ];
    return many ? [`<div class="q-item"${nth(i)}>`, ...lines.map((l) => '  ' + l), '</div>'] : lines;
  });
  const nav = many ? [
    '<div class="q-nav">',
    '  <button type="button" class="q-step q-prev" disabled><i class="ph ph-arrow-right" aria-hidden="true"></i>הקודמת</button>',
    `  <span class="q-count" aria-live="polite">שאלה 1 מתוך ${qs.length}</span>`,
    '  <button type="button" class="q-step q-next">הבאה<i class="ph ph-arrow-left" aria-hidden="true"></i></button>',
    '</div>',
  ] : [];
  return [
    '<section class="q enter" style="--i:2" aria-labelledby="q-title">',
    ...[...head, ...body, ...nav].map((l) => '  ' + l),
    '</section>',
  ].join('\n');
}

const states = (list) => list.map((s) =>
  `<div class="state ${s.kind}"><i class="ph ph-${s.icon}" aria-hidden="true"></i><div><h3>${rich(s.title)}</h3><p>${rich(s.text)}</p></div></div>`).join('\n');

const perks = (list) => list.map((p) => {
  const { icon, html } = typeof p === 'string' ? { icon: 'check-circle', html: p } : p;
  return `<li><i class="ph ph-${icon}" aria-hidden="true"></i><span>${html}</span></li>`;
}).join('\n');

// Keep or drop each <!-- if:flag --> block. A marker alone on its line takes
// the line with it.
function keepBlocks(tpl, flags) {
  const re = /^[ \t]*<!-- if:(\w+) -->\n([\s\S]*?)^[ \t]*<!-- \/if:\1 -->\n|<!-- if:(\w+) -->([\s\S]*?)<!-- \/if:\3 -->/gm;
  for (let prev = null; prev !== tpl;) {
    prev = tpl;
    tpl = tpl.replace(re, (m, lineName, lineBody, name, body) => {
      const flag = lineName || name;
      if (!(flag in flags)) throw new Error(`template: unknown flag if:${flag}`);
      return flags[flag] ? (lineName ? lineBody : body) : '';
    });
  }
  const left = /<!-- \/?if:[^>]*-->/.exec(tpl);
  if (left) throw new Error(`template: unbalanced ${left[0]}`);
  return tpl;
}

// One pass, so a value that happens to contain {{…}} is never filled again.
function fill(tpl, view) {
  const get = (k) => {
    const v = lookup(view, k);
    if (v === undefined || v === null) throw new Error(`template: no value for ${k}`);
    return String(v);
  };
  return tpl.replace(/^([ \t]*)\{\{\{([\w.]+)\}\}\}[ \t]*\n|\{\{\{([\w.]+)\}\}\}|\{\{([\w.]+)\}\}/gm,
    (m, indent, lineKey, rawKey, textKey) => {
      if (lineKey) {
        const v = get(lineKey);
        return v ? v.split('\n').map((l) => (l ? indent + l : l)).join('\n') + '\n' : '';
      }
      return rawKey ? get(rawKey) : esc(get(textKey));
    });
}

export function renderPage(template, page, track) {
  validatePage(page, track);
  const signup = page.signup || {};
  const view = {
    ...page,
    name: track.he.name,
    url: SITE + track.href,
    leadHtml: rich(page.lead),
    countdown: countdown(track),
    sources: sources(track),
    questions: page.questions.length ? questions(page.questions) : '',
    states: states(page.states),
    perks: signup.perks ? perks(signup.perks) : '',
    successJs: signup.successText ? jsStr(signup.successText) : '',
    daysUntilFn: String(daysUntil),
    countdownStateFn: String(countdownState),
  };
  const flags = { soon: page.mode === 'soon', live: page.mode === 'live', questions: page.questions.length > 0, review: page.cmpReview !== undefined };
  return fill(keepBlocks(template, flags), view);
}

function main() {
  const data = JSON.parse(readFileSync(join(root, 'tracks.json'), 'utf8'));
  validateTracks(data);
  const template = readFileSync(join(root, 'specialty.template.html'), 'utf8');
  const check = process.argv.includes('--check');
  let drift = 0;
  for (const f of readdirSync(join(root, 'specialties')).filter((n) => n.endsWith('.json')).sort()) {
    const page = JSON.parse(readFileSync(join(root, 'specialties', f), 'utf8'));
    const track = data.tracks.find((t) => t.id === page.trackId);
    if (!track || f !== `${track.id}.json`) throw new Error(`specialties/${f}: trackId must name a track in tracks.json and match the file name`);
    const file = track.href.slice(1) + '.html';
    const path = join(root, file);
    const after = renderPage(template, page, track);
    const before = existsSync(path) ? readFileSync(path, 'utf8') : null;
    if (before === after) { console.log(`ok       ${file}`); continue; }
    if (check) { drift++; console.log(`DRIFT    ${file} (run: node scripts/render-specialties.mjs)`); continue; }
    writeFileSync(path, after);
    console.log(`written  ${file}`);
  }
  process.exit(drift ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
