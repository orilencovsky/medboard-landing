// Tests for render-specialties.mjs. Plain node:test, no dependencies:
//   node --test scripts/render-specialties.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderPage, validatePage } from './render-specialties.mjs';
import { daysUntil, countdownState } from './countdown.mjs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const template = read('specialty.template.html');
const tracks = JSON.parse(read('tracks.json')).tracks;
const track = (id) => JSON.parse(JSON.stringify(tracks.find((t) => t.id === id)));
const page = (id) => JSON.parse(read(`specialties/${id}.json`));
const PAGES = ['family-medicine', 'pediatrics', 'nephrology'];
const SOON = ['family-medicine', 'pediatrics'];
const render = (id, edit = (p, t) => {}) => {
  const p = page(id), t = track(id);
  edit(p, t);
  return renderPage(template, p, t);
};

// Everything outside <script> … </script>: what a visitor without JS, a
// crawler or a link preview reads.
const served = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
const scripts = (html) => [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');

test('FM and peds regenerate with their own source, interest and events', () => {
  const fm = render('family-medicine');
  assert.ok(fm.includes("source: 'landing_fm'"));
  assert.ok(fm.includes("p_interest: 'family_medicine'"));
  assert.ok(fm.includes('fm_signup'));
  assert.ok(fm.includes('<link rel="canonical" href="https://meduxa.ai/family-medicine" />'));
  const peds = render('pediatrics');
  assert.ok(peds.includes('landing_peds'));
  assert.ok(peds.includes("'pediatrics'"));
  assert.ok(peds.includes('peds_signup'));
  assert.ok(!peds.includes('landing_fm'));
});

test('countdown is readable without script', () => {
  const out = served(render('family-medicine'));
  assert.ok(out.includes('בחינת שלב א׳'));
  assert.ok(out.includes('14.06.2027'));
  assert.ok(out.includes('לפי לוח הבחינות של הר״י · המועד עשוי להשתנות'));
  assert.ok(out.includes('href="https://www.ima.org.il/Internship/Events.aspx"'));
});

test('countdown script is the tested function', () => {
  const js = scripts(render('family-medicine'));
  assert.ok(js.includes(daysUntil.toString()));
  assert.ok(js.includes(countdownState.toString()));
  assert.ok(js.includes('מועד הבחינה הבא יפורסם בקרוב'));
  assert.ok(js.includes('הבחינה היום'));
});

test('sources are escaped and LTR-isolated', () => {
  const out = render('family-medicine', (p, t) => { t.sources = [{ title: "Brenner & Rector's The Kidney 11e", kind: 'book' }]; });
  assert.ok(out.includes('<span class="ltr-iso">Brenner &amp; Rector&#39;s The Kidney 11e</span>'));
  // The section names no category per item, since some "guideline" entries are articles.
  // Each item reads as its title and nothing else: no "guideline"/"book" tag.
  const unescape = (s) => s.replace(/<[^>]+>/g, '').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  for (const id of PAGES) {
    const section = render(id).match(/<section class="sources"[\s\S]*?<\/section>/)[0];
    const items = [...section.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => unescape(m[1]));
    assert.deepEqual(items.sort(), track(id).sources.map((x) => x.title).sort());
  }
});

test('questions section is omitted when empty and numbered when present', () => {
  const none = render('family-medicine', (p) => { p.questions = []; });
  assert.ok(!none.includes('id="q-title"'));
  assert.ok(!none.includes('class="q-opt"'));

  const two = render('family-medicine', (p) => { p.questions = [p.questions[0], page('pediatrics').questions[0]]; });
  assert.ok(two.includes('שאלה 1 מתוך 2'));
  assert.equal(two.match(/<button[^>]*\sdata-right[\s>]/g).length, 2);
  assert.match(two, /class="q-step q-prev"/);

  // One question: no "1 of 1" and no previous/next (Ruling 2).
  const one = render('family-medicine');
  assert.ok(!one.includes('מתוך 1'));
  assert.ok(!one.includes('class="q-step'));
  assert.equal(one.match(/<button[^>]*\sdata-right[\s>]/g).length, 1);
});

test('no placeholder survives', () => {
  for (const id of PAGES) {
    for (const out of [render(id), render(id, (p) => { p.questions = []; })]) {
      assert.doesNotMatch(out, /\{\{/);
      assert.doesNotMatch(out, /<!-- (\/)?if:/);
    }
  }
});

test('validatePage rejects a soon page without signup and a live page without app links', () => {
  for (const id of PAGES) assert.doesNotThrow(() => validatePage(page(id), track(id)));
  const soon = page('family-medicine'); delete soon.signup;
  assert.throws(() => validatePage(soon, track('family-medicine')), /signup/);
  const live = page('family-medicine'); live.mode = 'live'; delete live.signup;
  assert.throws(() => validatePage(live, track('family-medicine')), /app/);
  live.app = { hrefHero: 'https://app.meduxa.ai/?signup=1&src=landing&pl=hero' };
  assert.throws(() => validatePage(live, track('family-medicine')), /hrefClosing/);
});

test('existing FM launch-price perk is kept', () => {
  assert.ok(render('family-medicine').includes('מחיר השקה מיוחד'));
});

// Beyond the brief: the cases the template rules and the review focus lean on.

test('validatePage rejects a question without exactly one right answer, and an unknown track', () => {
  const p = page('family-medicine');
  p.questions[0].options.forEach((o) => delete o.right);
  assert.throws(() => validatePage(p, track('family-medicine')), /exactly one right/);
  assert.throws(() => validatePage(page('family-medicine'), track('pediatrics')), /trackId/);
});

test('a live page gets the app links and no sign-up form or script', () => {
  const out = render('family-medicine', (p) => {
    p.mode = 'live';
    delete p.signup;
    p.app = { hrefHero: 'https://app.meduxa.ai/?signup=1&src=landing&pl=hero', hrefClosing: 'https://app.meduxa.ai/?signup=1&src=landing&pl=closing' };
  });
  assert.ok(out.includes('href="https://app.meduxa.ai/?signup=1&amp;src=landing&amp;pl=hero" data-fm-cta="hero"'));
  assert.ok(out.includes('href="https://app.meduxa.ai/?signup=1&amp;src=landing&amp;pl=closing" data-fm-cta="closing"'));
  assert.ok(!out.includes('id="notifyForm"'));
  assert.ok(!out.includes('waitlist'));
});

test('a wrong option without a tutor line carries its reason, escaped', () => {
  const out = render('family-medicine', (p) => {
    const o = p.questions[0].options[0];
    delete o.tutor;
    o.why = 'Lancet & "NEJM" {{24h ABPM}}';
  });
  assert.ok(out.includes('data-why="Lancet &amp;amp; &amp;quot;NEJM&amp;quot; <span class=&quot;ltr-iso&quot;>24h ABPM</span>"'));
});

test('page text with markup characters is escaped, and the JS success line stays one string', () => {
  const out = render('family-medicine', (p) => {
    p.chip = 'a < b';
    p.signup.successText = "it's \\ </script>";
  });
  assert.ok(out.includes('a &lt; b'));
  assert.ok(out.includes("textContent = 'it\\'s \\\\ \\x3c/script>';"));
});

test('shipped pages are in sync with their data', () => {
  for (const id of PAGES) {
    const t = track(id);
    assert.equal(render(id), read(t.href.slice(1) + '.html'), `${id} drifted`);
  }
});

test('nephrology is a live page with app links and no form', () => {
  const out = render('nephrology');
  const s = served(out);
  assert.ok(s.includes('https://app.meduxa.ai/?signup=1&amp;src=landing&amp;pl=hero'));
  assert.ok(s.includes('https://app.meduxa.ai/?signup=1&amp;src=landing&amp;pl=closing'));
  assert.ok(s.includes('התחילו ללמוד — חינם'));
  assert.ok(s.includes('בחינה במקצוע-על — חלק א׳'));
  assert.ok(s.includes('12.01.2027'));
  assert.ok(s.includes('Brenner &amp; Rector'));
  assert.ok(!out.includes('id="notifyForm"'));
  assert.ok(!out.includes('מחיר השקה'));
  assert.ok(!out.includes('שלב א׳'), 'no stage wording on the nephrology page');
  assert.ok(out.includes('<link rel="canonical" href="https://meduxa.ai/nephrology" />'));
  assert.ok(out.includes('https://meduxa.ai/og-nephrology.png'));
  assert.ok(!out.includes('class="q-opt"'), 'no sample question yet');
  assert.ok(!out.includes('id="q-title"'));
});

test('a live page sends nephro_app_click for its two app links, home click for the rest; soon pages are untouched', () => {
  const live = scripts(render('nephrology'));
  assert.ok(live.includes("'nephro_app_click'"));
  assert.ok(live.includes("'nephro_home_click'"));
  assert.ok(live.includes("'hero'") && live.includes("'closing'"));
  assert.ok(!render('nephrology').includes('"coming soon"'));
  for (const id of SOON) assert.ok(!render(id).includes('_app_click'), `${id} must not get an app click event`);
});

test('the live page closing and later-line carry no "opening day" or waitlist wording', () => {
  const out = render('nephrology');
  assert.ok(!out.includes('ביום הפתיחה'));
  assert.ok(!out.includes('waitlist'));
  assert.ok(!out.includes('בקרוב:'));
});
