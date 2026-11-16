#!/usr/bin/env node
// Compares every exam.date in tracks.json with the IMA exam calendar
// (https://www.ima.org.il/Internship/Events.aspx) and, when the calendar
// shows a different next sitting, writes the new date into tracks.json. It
// never publishes anything itself: the daily workflow
// (.github/workflows/ima-dates.yml) re-renders the pages and opens a PR for
// the owner to merge.
//
//   node scripts/check-ima-dates.mjs                       fetch, compare, write tracks.json
//   node scripts/check-ima-dates.mjs --dry-run             compare only
//   node scripts/check-ima-dates.mjs --file saved.html     read a saved copy instead of fetching
//   node scripts/check-ima-dates.mjs --report out.md       also write the report as Markdown
//
// Exit codes: 0 every date matches, or changed dates were written;
//             1 something needs a person (a sitting no longer listed, a
//               date written inside nameHe, a track with no sitting at all);
//             2 the page could not be fetched or no longer has the layout
//               this parser knows. Nothing is written on 2.
//
// Calendar layout (server-rendered ASP.NET): each row's cells carry ids
// ending in _<ctlNN>_dvEventDate (dd/mm/yyyy), _spnDeadLineDate
// (registration), _dvSpecialization, _spnRoute (usually empty) and _spnName
// (the event type). Cells are grouped by that ctlNN, so an empty or filled
// cell never shifts the others. In the page's text the event type comes
// AFTER the specialty: the line before a date is the previous row's type.
//
// Plain Node 18+, no dependencies.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const IMA_URL = 'https://www.ima.org.il/Internship/Events.aspx';
// Fewer rows than this means the page changed or came back truncated.
const MIN_ROWS = 100;

const ENTITIES = { '&nbsp;': ' ', '&#39;': "'", '&quot;': '"', '&amp;': '&', '&lt;': '<', '&gt;': '>' };

// Geresh (׳) and apostrophe are the same letter mark; spaces vary.
export const norm = (s) => String(s).replace(/[׳’`]/g, "'").replace(/\s+/g, ' ').trim();

const FIELDS = { dvEventDate: 'date', spnDeadLineDate: 'registration', dvSpecialization: 'specialty', spnRoute: 'route', spnName: 'event' };
const text = (s) => norm(s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#39;|&quot;|&amp;|&lt;|&gt;/g, (m) => ENTITIES[m]));
const CELL = /<(div|span)\b[^>]*\bid="[^"]*_(ctl\d+)_(dvEventDate|spnDeadLineDate|dvSpecialization|spnRoute|spnName)"[^>]*>([\s\S]*?)<\/\1>/g;

export function parseRows(html) {
  const byRow = new Map();
  for (const [, , ctl, field, inner] of html.matchAll(CELL)) {
    if (!byRow.has(ctl)) byRow.set(ctl, {});
    byRow.get(ctl)[FIELDS[field]] = text(inner);
  }
  const rows = [];
  for (const r of byRow.values()) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(r.date || '');
    if (!m || !r.specialty || !r.event) continue;
    rows.push({ date: `${m[3]}-${m[2]}-${m[1]}`, registration: r.registration || '', specialty: r.specialty, route: r.route || '', event: r.event });
  }
  return rows;
}

// Today in Israel as YYYY-MM-DD (the pages count Israel calendar days too).
export function israelToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

const dotted = (iso) => iso.split('-').reverse().join('.');

// One verdict per track:
//   ok      exam.date is a listed, upcoming sitting
//   change  the calendar's next sitting differs (or the track had none): `to`
//   none    no upcoming sitting listed; the date stays (a past date makes the
//           page say the next date is coming)
// `notes` are things a person should look at.
export function compare(tracks, rows, today) {
  const specialties = new Set(rows.map((r) => norm(r.specialty)));
  return tracks.map((t) => {
    const { specialty, event, route = '' } = t.exam.ima;
    const from = t.exam.date || null;
    const notes = [];
    if (!specialties.has(norm(specialty))) notes.push(`The calendar has no rows at all for "${specialty}": renamed?`);
    const ofSpecialty = rows.filter((r) => norm(r.specialty) === norm(specialty));
    const dates = [...new Set(ofSpecialty.filter((r) => norm(r.event) === norm(event) && norm(r.route) === norm(route)).map((r) => r.date))].sort();
    if (ofSpecialty.length && !dates.length) notes.push(`"${specialty}" has rows, but none for "${event}"${route ? ` (route "${route}")` : ''}: renamed?`);
    const upcoming = dates.filter((d) => d >= today);
    let verdict;
    if (from && upcoming.includes(from)) {
      verdict = { status: 'ok' };
      if (upcoming[0] < from) notes.push(`An earlier sitting is also listed (${dotted(upcoming[0])}) before ${dotted(from)}: which one applies?`);
    }
    else if (upcoming.length) verdict = { status: 'change', to: upcoming[0] };
    else {
      verdict = { status: 'none' };
      if (from && from >= today) notes.push(`${dotted(from)} is no longer on the calendar and no other sitting is listed.`);
    }
    if (verdict.status === 'change' && /\d{1,2}\.\d{1,2}\.\d{4}/.test(t.exam.nameHe)) {
      notes.push(`exam.nameHe carries its own date ("${t.exam.nameHe}"): check it by hand.`);
    }
    return { id: t.id, specialty, event, from, upcoming, ...verdict, notes };
  });
}

export function report(results, today) {
  const changed = results.filter((r) => r.status === 'change');
  const notes = results.filter((r) => r.notes.length);
  const out = [`IMA exam calendar check, ${dotted(today)} (Israel). Source: ${IMA_URL}`, ''];
  if (changed.length) {
    out.push('Dates changed in tracks.json:', '');
    for (const r of changed) out.push(`- ${r.id}: ${r.from ? dotted(r.from) : '(none)'} → ${dotted(r.to)} (${r.specialty}, ${r.event})`);
    out.push('');
  }
  if (notes.length) {
    out.push('Needs a person:', '');
    for (const r of notes) for (const n of r.notes) out.push(`- ${r.id}: ${n}`);
    out.push('');
  }
  out.push('All tracks:', '');
  for (const r of results) {
    const listed = r.upcoming.length ? r.upcoming.map(dotted).join(', ') : 'none';
    out.push(`- ${r.id}: site ${r.from ? dotted(r.from) : '(none)'}; calendar upcoming: ${listed}; ${r.status}`);
  }
  return out.join('\n') + '\n';
}

// Sets exam.date (first key of exam, as in the rest of the file) and writes
// the file back in its own format, JSON.stringify with two spaces, so the
// diff is the changed dates only.
export function applyChanges(src, results) {
  const data = JSON.parse(src);
  for (const r of results.filter((x) => x.status === 'change')) {
    const t = data.tracks.find((x) => x.id === r.id);
    t.exam = { date: r.to, ...Object.fromEntries(Object.entries(t.exam).filter(([k]) => k !== 'date')) };
  }
  return JSON.stringify(data, null, 2) + '\n';
}

// The sources pages (/<track>/sources) are hand-built and carry the exam
// date as text: in data-exam-date and as dd.mm.yyyy (countdown and the
// data-exam-fact sentence). For a changed date, swap the old value for the
// new one there. Returns { file: newHtml } and adds a note where the swap
// cannot be done mechanically. `read` returns a file's text or null.
export function updateSourcesPages(results, read) {
  const out = {};
  for (const r of results.filter((x) => x.status === 'change')) {
    const spec = read(`specialties/${r.id}.json`);
    const href = spec && JSON.parse(spec).sourcesHref;
    if (!href) continue;
    const file = href.slice(1) + '.html';
    const html = read(file);
    if (html === null) { r.notes.push(`${file} not found.`); continue; }
    if (!r.from) { r.notes.push(`${file} had no date to swap: edit it by hand.`); continue; }
    const attr = `data-exam-date="${r.from}"`;
    if (!html.includes(attr) || !html.includes(dotted(r.from))) { r.notes.push(`${file} does not show ${dotted(r.from)} as expected: edit it by hand.`); continue; }
    out[file] = html.split(attr).join(`data-exam-date="${r.to}"`).split(dotted(r.from)).join(dotted(r.to));
  }
  return out;
}

// Three tries, 30 s apart: one network blip should not open an issue.
async function fetchPage() {
  let last;
  for (let i = 0; i < 3; i++) {
    if (i) await new Promise((r) => setTimeout(r, 30000));
    try {
      const res = await fetch(IMA_URL, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; exam-date-check)' }, signal: AbortSignal.timeout(60000) });
      if (res.ok) return await res.text();
      last = new Error(`HTTP ${res.status}`);
    } catch (e) { last = e; }
  }
  throw last;
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  const reportPath = opt('--report');
  const fail = (msg) => {
    const text = `IMA exam calendar check could not run: ${msg}\nNothing was changed. Source: ${IMA_URL}\n`;
    process.stdout.write(text);
    if (reportPath) writeFileSync(reportPath, text);
    process.exit(2);
  };

  let html;
  try { html = opt('--file') ? readFileSync(opt('--file'), 'utf8') : await fetchPage(); } catch (e) { return fail(`fetch failed (${e.message})`); }
  const rows = parseRows(html);
  if (rows.length < MIN_ROWS) return fail(`found ${rows.length} rows (expected at least ${MIN_ROWS}); the page layout may have changed`);

  const path = join(root, 'tracks.json');
  const src = readFileSync(path, 'utf8');
  const today = israelToday();
  const results = compare(JSON.parse(src).tracks, rows, today);
  const readRel = (p) => { try { return readFileSync(join(root, p), 'utf8'); } catch { return null; } };
  const pages = updateSourcesPages(results, readRel); // may add notes, so before the report
  const text = report(results, today);
  process.stdout.write(text);
  if (reportPath) writeFileSync(reportPath, text);

  if (!args.includes('--dry-run') && results.some((r) => r.status === 'change')) {
    writeFileSync(path, applyChanges(src, results));
    for (const [file, html] of Object.entries(pages)) writeFileSync(join(root, file), html);
  }
  process.exit(results.some((r) => r.notes.length) ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
