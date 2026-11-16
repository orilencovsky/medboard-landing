#!/usr/bin/env node
// Renders /exams (exams.html): the exam date of every study track, in date
// order, from the `exam` objects in tracks.json, the same data behind the
// specialty pages' countdowns, so the two can never disagree. The page shell
// is exams.template.html; this fills it and writes exams.html, which is
// committed (the site has no build step at deploy).
//
//   node scripts/render-exams.mjs           rewrite exams.html
//   node scripts/render-exams.mjs --check   exit 1 if exams.html differs
//
// Template syntax: {{name}} escaped text; {{{name}}} HTML as it is (alone on
// its line, every line of the value gets that line's indentation).
//
// Plain Node, no dependencies.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, validate } from './render-tracks.mjs';
import { daysUntil, countdownState } from './countdown.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://meduxa.ai';
const URL_ = SITE + '/exams';
const IMA = 'https://www.ima.org.il/Internship/Events.aspx';
const dateText = (iso) => iso.split('-').reverse().join('.');

// Dated tracks first, earliest exam first; a track without a date keeps its
// tracks.json place at the end. Array.prototype.sort is stable.
export function ordered(tracks) {
  return [...tracks].sort((a, b) => {
    const x = a.exam.date, y = b.exam.date;
    if (x && y) return x < y ? -1 : x > y ? 1 : 0;
    return x ? -1 : y ? 1 : 0;
  });
}

// "2026-2027" (a hyphen-minus, not an en dash: between two numbers it keeps
// them one left-to-right run in Hebrew text; an en dash flips them), or one
// year when every dated exam falls in the same one.
export function years(tracks) {
  const ys = tracks.filter((t) => t.exam.date).map((t) => Number(t.exam.date.slice(0, 4)));
  if (!ys.length) throw new Error('tracks.json: no track has an exam date');
  const lo = Math.min(...ys), hi = Math.max(...ys);
  return lo === hi ? String(lo) : `${lo}-${hi}`;
}

function sourcesHref(track) {
  const f = join(root, 'specialties', `${track.id}.json`);
  if (!existsSync(f)) return null;
  const href = JSON.parse(readFileSync(f, 'utf8')).sourcesHref;
  if (href && !existsSync(join(root, href.slice(1) + '.html'))) throw new Error(`${track.id}: sourcesHref ${href} has no page`);
  return href || null;
}

export function row(track, ui, srcHref) {
  const { date, nameHe } = track.exam;
  const id = esc(track.id);
  const cta = (placement) => `data-ex-cta="${placement}" data-track="${id}"`;
  // Date first: in a list of dates it is what the eye scans for, and a name
  // that carries a second date (cardiology's part B) no longer comes before it.
  const when = date
    ? `<span class="ltr-iso">${esc(dateText(date))}</span> · ${esc(nameHe)}`
    : `${esc(nameHe)} · <a href="${esc(track.exam.url)}" target="_blank" rel="noopener" ${cta('row_ima')}>המועד בלוח הר״י</a>`;
  return [
    date ? `<li class="exam-row" data-exam-date="${esc(date)}">` : '<li class="exam-row">',
    '  <div>',
    // The chip sits beside the heading, not in it: the heading's name is the specialty alone.
    `    <div class="exam-head"><h3><a href="${esc(track.href)}" ${cta('row')}>${esc(track.he.name)}</a></h3><span class="exam-chip exam-chip--${esc(track.status)}">${esc(ui[track.status])}</span></div>`,
    `    <p class="exam-when">${when}</p>`,
    ...(srcHref ? [`    <p class="exam-more"><a href="${esc(srcHref)}" ${cta('row_sources')}>המקורות להכנה</a></p>`] : []),
    '  </div>',
    // Empty and hidden until the script fills it: no-JS readers never see a
    // "days to the exam" line without its number.
    ...(date ? ['  <p class="exam-days" hidden><b data-days></b> <span data-cd-unit></span></p>'] : []),
    '</li>',
  ].join('\n');
}

function jsonLd(view) {
  const blocks = [
    {
      '@context': 'https://schema.org', '@type': 'WebPage', '@id': URL_ + '#webpage', url: URL_,
      name: view.title, description: view.description, inLanguage: 'he',
      isPartOf: { '@type': 'WebSite', name: 'MeduXa.ai', url: SITE + '/' },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'MeduXa.ai', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: 'מועדי בחינות', item: URL_ },
      ],
    },
  ];
  return blocks.map((b) => `<script type="application/ld+json">\n${JSON.stringify(b).replace(/</g, '\\u003c')}\n</script>`).join('\n');
}

function fill(tpl, view) {
  const get = (k) => {
    if (!(k in view)) throw new Error(`template: no value for ${k}`);
    return String(view[k]);
  };
  return tpl.replace(/^([ \t]*)\{\{\{(\w+)\}\}\}[ \t]*\n|\{\{\{(\w+)\}\}\}|\{\{(\w+)\}\}/gm, (m, indent, lineKey, rawKey, textKey) => {
    if (lineKey) return get(lineKey).split('\n').map((l) => (l ? indent + l : l)).join('\n') + '\n';
    return rawKey ? get(rawKey) : esc(get(textKey));
  });
}

export function renderExams(template, data, srcOf = sourcesHref) {
  const tracks = data.tracks;
  const y = years(tracks);
  const view = {
    years: y,
    title: `מועדי בחינות שלב א׳ ומקצוע-על ${y} | MeduXa.ai`,
    description: `מועדי בחינות שלב א׳ ומקצוע-על ${y} במקצועות שיש להם הכנה ב-MeduXa, לפי לוח הבחינות של הר״י, עם ספירת ימים לכל בחינה.`,
    lead: `בחינות שלב א׳ ובחינות מקצוע-על ב-${tracks.length} המקצועות שיש להם הכנה ב-MeduXa, במקום אחד ולפי סדר התאריכים. כל מועד לקוח מלוח הבחינות של הר״י.`,
    list: ordered(tracks).map((t) => row(t, data.ui.he, srcOf(t))).join('\n'),
    daysUntilFn: String(daysUntil),
    countdownStateFn: String(countdownState),
  };
  view.jsonld = jsonLd(view);
  return fill(template, view);
}

function main() {
  const data = JSON.parse(readFileSync(join(root, 'tracks.json'), 'utf8'));
  validate(data);
  const template = readFileSync(join(root, 'exams.template.html'), 'utf8');
  const path = join(root, 'exams.html');
  const after = renderExams(template, data);
  const before = existsSync(path) ? readFileSync(path, 'utf8') : null;
  if (before === after) { console.log('ok       exams.html'); return; }
  if (process.argv.includes('--check')) { console.log('DRIFT    exams.html (run: node scripts/render-exams.mjs)'); process.exit(1); }
  writeFileSync(path, after);
  console.log('written  exams.html');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
