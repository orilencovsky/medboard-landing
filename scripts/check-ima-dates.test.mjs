// Tests for check-ima-dates.mjs, on a synthetic copy of the IMA calendar
// layout (the real page is not committed):
//   node --test scripts/check-ima-dates.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseRows, compare, applyChanges, report, israelToday, norm, updateSourcesPages } from './check-ima-dates.mjs';

const script = fileURLToPath(new URL('./check-ima-dates.mjs', import.meta.url));
const tracksSrc = readFileSync(new URL('../tracks.json', import.meta.url), 'utf8');

// One calendar row as the page serves it: date, registration, specialty,
// "מסלול", "אירוע", the event type, then the add-to-calendar link.
const rowHtml = ([date, spec, event, reg = '01.02.27-28.02.27']) => `
<tr><td><span>${date}</span></td><td>${reg}</td><td><b>${spec}</b></td>
<td><small>מסלול</small></td><td><small>אירוע</small></td><td>${event.replace(/'/g, '&#39;')}</td>
<td><a href="#">הוספה ליומן</a></td></tr>`;
const page = (rows) => `<html><head><script>var x = "01/01/2027";</script></head><body><table>${rows.map(rowHtml).join('')}</table></body></html>`;

const track = (id, date, specialty, event = "בחינת שלב א'", nameHe = 'בחינת שלב א׳') =>
  ({ id, exam: { ...(date ? { date } : {}), nameHe, url: 'https://www.ima.org.il/Internship/Events.aspx', ima: { specialty, event } } });

test('parseRows reads date, registration, specialty and the event that FOLLOWS the specialty', () => {
  const rows = parseRows(page([
    ['15/12/2026', 'קרדיולוגיה', "בחינה במקצוע-על - חלק א'"],
    ['16/12/2026', 'קרדיולוגיה', "בחינה במקצוע-על - חלק ב'"],
    ['30/06/2027', 'הרדמה', 'ועדה מקצועית', '09/06/2027'],
  ]));
  assert.deepEqual(rows, [
    { date: '2026-12-15', registration: '01.02.27-28.02.27', specialty: 'קרדיולוגיה', event: "בחינה במקצוע-על - חלק א'" },
    { date: '2026-12-16', registration: '01.02.27-28.02.27', specialty: 'קרדיולוגיה', event: "בחינה במקצוע-על - חלק ב'" },
    { date: '2027-06-30', registration: '09/06/2027', specialty: 'הרדמה', event: 'ועדה מקצועית' },
  ]);
});

test('parseRows ignores dates outside the row layout (scripts, stray text)', () => {
  assert.deepEqual(parseRows('<p>01/01/2027</p><script>"02/02/2027"</script>'), []);
});

test('norm treats geresh and apostrophe alike and collapses spaces', () => {
  assert.equal(norm("בחינת  שלב א׳"), norm("בחינת שלב א'"));
});

const rows = parseRows(page([
  ['14/06/2027', 'גריאטריה', "בחינת שלב א'"],
  ['22/06/2027', 'הרדמה', "בחינת שלב א'"],
  ['22/06/2027', 'הרדמה', "בחינת שלב א'"],
  ['30/06/2027', 'הרדמה', 'ועדה מקצועית'],
  ['15/12/2026', 'קרדיולוגיה', "בחינה במקצוע-על - חלק א'"],
  ['14/12/2027', 'קרדיולוגיה', "בחינה במקצוע-על - חלק א'"],
  ['02/06/2027', 'יילוד וגינקולוגיה', "בחינת שלב א'"],
]));
const TODAY = '2026-11-16';

test('a listed upcoming date is ok; duplicates and committees do not matter', () => {
  const [r] = compare([track('anesthesia', '2027-06-22', 'הרדמה')], rows, TODAY);
  assert.equal(r.status, 'ok');
  assert.deepEqual(r.upcoming, ['2027-06-22']);
  assert.deepEqual(r.notes, []);
});

test('an undated track gets the listed date', () => {
  const [r] = compare([track('geriatrics', undefined, 'גריאטריה')], rows, TODAY);
  assert.equal(r.status, 'change');
  assert.equal(r.to, '2027-06-14');
});

test('a past date moves to the next listed sitting', () => {
  const r = compare([track('cardiology', '2026-12-15', 'קרדיולוגיה', "בחינה במקצוע-על - חלק א'")], rows, '2026-12-16')[0];
  assert.equal(r.status, 'change');
  assert.equal(r.to, '2027-12-14');
});

test('a moved date is picked up (the old one is gone, a new one is listed)', () => {
  const [r] = compare([track('obgyn', '2027-06-01', 'יילוד וגינקולוגיה')], rows, TODAY);
  assert.equal(r.status, 'change');
  assert.equal(r.to, '2027-06-02');
});

test('a future date that vanished with nothing listed needs a person, and is not changed', () => {
  const [r] = compare([track('psychiatry', '2027-06-14', 'פסיכיאטריה')], rows, TODAY);
  assert.equal(r.status, 'none');
  assert.equal(r.notes.length, 2); // no rows for the specialty at all, and the date vanished
});

test('a past date with nothing listed stays, quietly (the page already says the next date is coming)', () => {
  const [r] = compare([track('geriatrics', '2026-01-01', 'גריאטריה', 'בחינה שלא קיימת')], rows, TODAY);
  assert.equal(r.status, 'none');
  assert.deepEqual(r.notes, []);
});

test('a change to a track whose nameHe holds its own date is flagged', () => {
  const t = track('cardiology', '2026-12-15', 'קרדיולוגיה', "בחינה במקצוע-על - חלק א'", 'בחינה במקצוע-על — חלק א׳ (חלק ב׳ למחרת, 16.12.2026)');
  const [r] = compare([t], rows, '2026-12-16');
  assert.equal(r.status, 'change');
  assert.match(r.notes.join(' '), /nameHe/);
});

test('applyChanges sets only the changed dates and keeps the file format', () => {
  const data = JSON.parse(tracksSrc);
  const results = data.tracks.map((t, i) => (i === 0 ? { id: t.id, status: 'change', to: '2030-01-01' } : { id: t.id, status: 'ok' }));
  const out = applyChanges(tracksSrc, results);
  const before = tracksSrc.split('\n'), after = out.split('\n');
  assert.equal(after.length, before.length);
  const diff = before.map((l, i) => [l, after[i]]).filter(([a, b]) => a !== b);
  assert.equal(diff.length, 1);
  assert.match(diff[0][1], /"date": "2030-01-01"/);
});

test('applyChanges puts a new date first in an undated exam', () => {
  const src = JSON.stringify({ tracks: [track('x', undefined, 'גריאטריה')] }, null, 2) + '\n';
  const out = JSON.parse(applyChanges(src, [{ id: 'x', status: 'change', to: '2027-06-14' }]));
  assert.deepEqual(Object.keys(out.tracks[0].exam), ['date', 'nameHe', 'url', 'ima']);
});

test('every track in tracks.json is matched on today\'s calendar shape', () => {
  // Shape only: each track names an IMA specialty and event.
  for (const t of JSON.parse(tracksSrc).tracks) assert.ok(t.exam.ima.specialty && t.exam.ima.event, t.id);
});

test('report lists changes and notes', () => {
  const res = compare([track('geriatrics', undefined, 'גריאטריה'), track('psychiatry', '2027-06-14', 'פסיכיאטריה')], rows, TODAY);
  const text = report(res, TODAY);
  assert.match(text, /geriatrics: \(none\) → 14\.06\.2027/);
  assert.match(text, /Needs a person:/);
});

test('israelToday is the Israel calendar day', () => {
  assert.equal(israelToday(new Date('2026-11-15T22:30:00Z')), '2026-11-16'); // 00:30 in Israel
});

test('a page with too few rows exits 2 and writes nothing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ima-'));
  const f = join(dir, 'page.html'), rep = join(dir, 'report.md');
  writeFileSync(f, page([['14/06/2027', 'גריאטריה', "בחינת שלב א'"]]));
  const r = spawnSync(process.execPath, [script, '--file', f, '--report', rep], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(readFileSync(rep, 'utf8'), /could not run/);
  assert.equal(readFileSync(new URL('../tracks.json', import.meta.url), 'utf8'), tracksSrc);
});

test('updateSourcesPages swaps the old date on a sources page, and flags what it cannot swap', () => {
  const files = {
    'specialties/fm.json': JSON.stringify({ sourcesHref: '/fm/sources' }),
    'fm/sources.html': '<div data-exam-date="2027-06-14"><span>14.06.2027</span></div><p data-exam-fact>14.06.2027</p>',
    'specialties/peds.json': JSON.stringify({}),
    'specialties/odd.json': JSON.stringify({ sourcesHref: '/odd/sources' }),
    'odd/sources.html': '<p>no date here</p>',
  };
  const read = (p) => (p in files ? files[p] : null);
  const results = [
    { id: 'fm', status: 'change', from: '2027-06-14', to: '2027-06-21', notes: [] },
    { id: 'peds', status: 'change', from: '2027-06-14', to: '2027-06-21', notes: [] },
    { id: 'odd', status: 'change', from: '2027-06-14', to: '2027-06-21', notes: [] },
  ];
  const out = updateSourcesPages(results, read);
  assert.deepEqual(Object.keys(out), ['fm/sources.html']);
  assert.equal(out['fm/sources.html'], '<div data-exam-date="2027-06-21"><span>21.06.2027</span></div><p data-exam-fact>21.06.2027</p>');
  assert.deepEqual(results[1].notes, []);
  assert.match(results[2].notes[0], /by hand/);
});
