# Specialty Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each of the four specialties (nephrology live; family medicine, pediatrics, cardiology coming soon) its own Hebrew page on meduxa.ai with an IMA exam countdown, a sources list, the existing product sections and, after owner sign-off, 1–5 sample questions.

**Architecture:** The facts shared by homepage and pages (exam date and name, sources) go into `tracks.json`. Per-page copy and questions go into `specialties/<track-id>.json`. One template, `specialty.template.html` (derived from today's `family-medicine.html`), is rendered by a plain-Node script, `scripts/render-specialties.mjs`, into four committed static pages at the repo root. There is still no deploy-time build, and a `--check` drift guard works the same way as `render-tracks.mjs`. The countdown's day math lives in one tested module, which the renderer inlines into each page.

**Tech Stack:** Static HTML/CSS/inline JS, Node ≥ 20 (`node:test`, no dependencies), Vercel static hosting (`cleanUrls`), Supabase (product repo, waitlist + question data).

**Spec:** `docs/superpowers/specs/2026-10-26-specialty-pages-design.md`

## Global Constraints

- No dependencies and no build step at deploy. Generated pages are committed. Scripts are plain Node.
- Pages are Hebrew only (`lang="he" dir="rtl"`). `/en` links to them with the existing "Hebrew content" pill (`pageLang: "he"`).
- URLs: `/nephrology`, `/cardiology` (new), `/family-medicine`, `/pediatrics` (kept, regenerated in place).
- Exam dates and sources live only in `tracks.json`. No page or script hard-codes a date.
- Exam names use the IMA wording. Nephrology and cardiology: `בחינה במקצוע-על — חלק א׳`. Family medicine and pediatrics: `בחינת שלב א׳`.
- Dates (IMA calendar, read 2026-10-25): nephrology `2027-01-12`, cardiology `2026-12-15`, family medicine `2027-06-14`, pediatrics `2027-06-14`. IMA link: `https://www.ima.org.il/Internship/Events.aspx`.
- Countdown footnote, verbatim: `לפי לוח הבחינות של הר״י · המועד עשוי להשתנות`. After the date: `מועד הבחינה הבא יפורסם בקרוב`. On the day: `הבחינה היום`.
- No new pricing. Existing launch-price / group-discount copy on FM and peds stays. Cardiology's card, page and images mention no launch price.
- Page order: header + countdown → sample questions (absent when there are none) → sources → status → method → features → comparison → closing (sign-up form on soon pages, `התחילו ללמוד — חינם` on nephrology).
- App links from `/nephrology`: `https://app.meduxa.ai/?signup=1&src=landing&pl=hero` (header) and `…&pl=closing` (bottom). No new `src`/`pl` values.
- CSP is unchanged: no new external hosts. Every new text colour meets 4.5:1 contrast.
- Track id ↔ analytics prefix ↔ waitlist ↔ DB module: `nephrology`/`nephro`/–/`nephrology`; `family-medicine`/`fm`/`landing_fm`+`family_medicine`/`family`; `pediatrics`/`peds`/`landing_peds`+`pediatrics`/`peds`; `cardiology`/`cardio`/`landing_cardio`+`cardiology`/`cardio`.
- Every public sample question carries the owner's medical sign-off. The product DB is the authority, not `src/data/questions.js`.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. A visitor at 00:30 Israel time (still the previous day in UTC) must see the Israel-date count, not one day off. Pinned in Task 3.
2. The exam date has passed and nobody has updated `tracks.json`: no negative or stale number, show the "next date" line. Pinned in Tasks 3 and 4.
3. No JavaScript (crawlers, link previews, script blocked): the exam name and date must still be readable in the served HTML. Pinned in Task 4.
4. Latin source titles inside RTL Hebrew (`Brenner & Rector's`, `KDIGO`): the text is escaped (`&amp;`, `&#39;`) and LTR-isolated, so it renders neither as broken markup nor reversed. Pinned in Task 4.
5. A cardiology sign-up before the product migration is applied gets saved without its interest mark, silently. Gated in Tasks 1 and 6 by a DB check before deploy.

---

## Release 1 — pages, countdown, sources, cardiology sign-up

### Task 1: Cardiology waitlist interest key (product repo, lands first)

**Files:**
- Create: `/Users/ori/dev/meduxa/supabase/migrations/20261026120000_waitlist_interest_cardiology.sql`

**Interfaces:**
- Produces: the active waitlist interest key `cardiology`. Task 6's form calls `rpc/waitlist_add_interest` with `p_interest: 'cardiology'`.

- [ ] **Step 1:** In a new branch of the product repo (`feat/waitlist-interest-cardiology`), write the migration as a copy of `20261006153000_waitlist_interest_pediatrics.sql`. Change the header comment to cardiology (`meduxa.ai/cardiology`, source `'landing_cardio'`). Insert the row `('cardiology', 'הכנה לבחינת מקצוע-על בקרדיולוגיה')` with `on conflict (key) do nothing`.
- [ ] **Step 2: Verify the source needs no change.** Read `20260926140000_waitlist_insert_sources.sql` and confirm `landing_cardio` matches its source check. Expected: it matches (as the builder review found). If it doesn't, stop and add the source to the same migration.
- [ ] **Step 3:** Commit and open a PR in the product repo. Follow that repo's migration-apply process; do not apply it to production by hand.
- [ ] **Step 4: Gate check after it is applied.** Run read-only SQL: `select key, active from public.waitlist_interest_keys where key = 'cardiology';`
  Expected: one row. Task 6 must not be deployed until this returns a row.

### Task 2: Track data — cardiology, nephrology page link, exam and sources

**Files:**
- Modify: `tracks.json`
- Modify: `scripts/render-tracks.mjs` (`validate`)
- Modify: `scripts/render-tracks.test.mjs`
- Regenerate: `index.html`, `en/index.html`

**Interfaces:**
- Produces: on every track, `exam: { date: 'YYYY-MM-DD', nameHe: string, url: string }` and `sources: [{ title: string, kind: 'book' | 'guideline' }]`. Tasks 4–6 read these. `validate(data)` throws on a missing or bad `exam`/`sources`.

- [ ] **Step 1: Write the failing tests** in `render-tracks.test.mjs`:

```js
test('validate requires an ISO exam date, an exam name and a non-empty sources list', () => {
  const a = clone(); a.tracks[0].exam.date = '12/01/2027';
  assert.throws(() => validate(a), /exam\.date/);
  const b = clone(); delete b.tracks[0].exam.nameHe;
  assert.throws(() => validate(b), /exam\.nameHe/);
  const c = clone(); c.tracks[0].sources = [];
  assert.throws(() => validate(c), /sources/);
  const d = clone(); d.tracks[0].sources[0].kind = 'paper';
  assert.throws(() => validate(d), /kind/);
});

test('the shipped list has the four tracks, IMA dates and the nephrology page link', () => {
  const by = Object.fromEntries(real.tracks.map((t) => [t.id, t]));
  assert.deepEqual(Object.keys(by).sort(), ['cardiology', 'family-medicine', 'nephrology', 'pediatrics']);
  assert.equal(by.nephrology.exam.date, '2027-01-12');
  assert.equal(by.cardiology.exam.date, '2026-12-15');
  assert.equal(by['family-medicine'].exam.date, '2027-06-14');
  assert.equal(by.pediatrics.exam.date, '2027-06-14');
  assert.equal(by.nephrology.exam.nameHe, 'בחינה במקצוע-על — חלק א׳');
  assert.equal(by.pediatrics.exam.nameHe, 'בחינת שלב א׳');
  assert.equal(by.nephrology.href, '/nephrology');
  assert.equal(by.nephrology.cta, undefined);
  assert.equal(by.cardiology.status, 'soon');
  assert.equal(by.cardiology.href, '/cardiology');
  assert.ok(!/מחיר השקה/.test(by.cardiology.he.blurb));
});

test('cardiology gets a card and the closing line, but not the launch-price bar', () => {
  const html = render(real, page(ALL), 'he', 't');
  assert.match(html, /id="track-cardiology"/);
  assert.match(html, /href="\/nephrology"/);
  // announce bar keeps today's text: launch price, FM + peds only
  assert.match(html, /הכנה לשלב א׳ ברפואת משפחה וברפואת ילדים · מחיר השקה/);
  // closing line names all three soon tracks, without "שלב א׳"
  assert.match(html, /מתכוננים לבחינה ברפואת משפחה, ברפואת ילדים או בקרדיולוגיה\?/);
});
```

- [ ] **Step 2: Run them to see them fail.**
  Run: `node --test scripts/render-tracks.test.mjs`
  Expected: FAIL, because `exam` is undefined and there is no cardiology track.
- [ ] **Step 3: Update the data and `validate`.**
  - In `tracks.json`:
    - Nephrology: `href: "/nephrology"`, add `pageLang: "he"`, drop `cta`.
    - Add a `cardiology` entry after pediatrics, modelled on pediatrics. Use `status: "soon"`, `href: "/cardiology"`, `pageLang: "he"`.
      - he: name / inline `קרדיולוגיה`, stage `מקצוע-על, חלק א׳`, blurb `שאלות בסגנון הבחינה, הסבר עם ציטוט מהמקור ומורה {{AI}} סוקרטי.`, action `הרשמה לעדכון`.
      - en: `Cardiology`, `Sub-specialty, part A`, `Exam-style questions, answers explained with a quote from the source, and a Socratic {{AI}} tutor.`, `Get notified`.
    - Nephrology stage: he `מקצוע-על, חלק א׳`, en `Sub-specialty, part A`.
    - Each track's `exam`: the date and name from Global Constraints, `url` = the IMA link.
    - Each track's `sources`: the spec's "Sources section" lists, one entry per book (with edition) or guideline group, with `kind`.
  - Launch-price scoping, so cardiology never inherits the offer:
    - Add `launchOffer: true` to family-medicine and pediatrics.
    - `announce()` lists only `soon` tracks that have `launchOffer`, which keeps the bar's text exactly as today.
    - `closing()` keeps listing every `soon` track. Change `ui.he.closing` to `מתכוננים לבחינה {list}? <a href="#tracks">לפרטים ולהרשמה לעדכון</a>` and `ui.en.closing` to `Preparing for an exam in {list}? <a href="#tracks">Details and updates</a>`, because "Stage A" is wrong for cardiology.
  - In `validate`: `exam.date` must match `/^\d{4}-\d{2}-\d{2}$/`, `exam.nameHe` and `exam.url` are required, `sources` must be a non-empty array, and each `kind` must be `book` or `guideline`.
  - The nephrology card's action text stays `התחילו ללמוד — חינם` / `Start studying free`.
- [ ] **Step 4: Run the tests.**
  Run: `node --test scripts/render-tracks.test.mjs`
  Expected: PASS, all tests.
- [ ] **Step 5: Regenerate and check.**
  Run: `node scripts/render-tracks.mjs && node scripts/render-tracks.mjs --check`
  Expected: `written` for both pages, then `ok index.html` and `ok en/index.html`.
- [ ] **Step 6: Commit.**
  ```bash
  git add tracks.json scripts/render-tracks.mjs scripts/render-tracks.test.mjs index.html en/index.html
  git commit -m "feat(tracks): cardiology track, exam dates and sources per specialty"
  ```

### Task 3: Countdown day math

**Files:**
- Create: `scripts/countdown.mjs`
- Test: `scripts/countdown.test.mjs`

**Interfaces:**
- Produces:
  - `daysUntil(examDate: string /* 'YYYY-MM-DD' */, now: Date) -> number`: calendar days from today's date in `Asia/Jerusalem` to the exam date. 0 on exam day, negative after.
  - `countdownState(days: number) -> 'future' | 'today' | 'past'`.
  - Both are self-contained (no imports, no closures over module scope), because Task 4 inlines them with `String(fn)`.

- [ ] **Step 1: Write the failing tests.**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daysUntil, countdownState } from './countdown.mjs';

test('counts Israel calendar days', () => {
  assert.equal(daysUntil('2027-01-12', new Date('2026-10-25T09:00:00Z')), 79);
  assert.equal(daysUntil('2026-12-15', new Date('2026-10-25T09:00:00Z')), 51);
  assert.equal(daysUntil('2027-06-14', new Date('2026-10-25T09:00:00Z')), 232);
});
test('uses the Israel date after local midnight, not the UTC date', () => {
  // 2026-10-25 22:30 UTC is 00:30 on 2026-10-26 in Israel (UTC+2 after DST ends)
  assert.equal(daysUntil('2027-01-12', new Date('2026-10-25T22:30:00Z')), 78);
});
test('exam day is 0 and the day after is negative', () => {
  assert.equal(daysUntil('2027-01-12', new Date('2027-01-12T05:00:00Z')), 0);
  assert.equal(daysUntil('2027-01-12', new Date('2027-01-13T05:00:00Z')), -1);
});
test('state', () => {
  assert.equal(countdownState(79), 'future');
  assert.equal(countdownState(0), 'today');
  assert.equal(countdownState(-1), 'past');
});
```

- [ ] **Step 2: Run them to see them fail.**
  Run: `node --test scripts/countdown.test.mjs`
  Expected: FAIL, module not found.
- [ ] **Step 3: Implement both functions in `scripts/countdown.mjs`.**
  Get today's Y-M-D in Israel with `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' })`. Compare the two dates as `Date.UTC(y, m - 1, d)` values divided by 86400000. Don't use local-time `Date` math, because DST would shift it.
- [ ] **Step 4: Run the tests.**
  Run: `node --test scripts/countdown.test.mjs`
  Expected: PASS.
- [ ] **Step 5: Commit.**
  ```bash
  git add scripts/countdown.mjs scripts/countdown.test.mjs
  git commit -m "feat(countdown): Israel-date day count to an exam"
  ```

### Task 4: Template, renderer, and FM / peds regenerated from it

**Files:**
- Create: `specialty.template.html`
- Create: `specialties/family-medicine.json`, `specialties/pediatrics.json`
- Create: `scripts/render-specialties.mjs`
- Test: `scripts/render-specialties.test.mjs`
- Regenerate: `family-medicine.html`, `pediatrics.html`

**Interfaces:**
- Consumes: `tracks.json` `exam` and `sources` (Task 2); `daysUntil` and `countdownState` (Task 3).
- Produces:
  - `renderPage(template: string, page: object, track: object) -> string`
  - `validatePage(page: object, track: object) -> void` (throws)
  - The CLI `node scripts/render-specialties.mjs [--check]`, which writes `<track.href without slash>.html` for every `specialties/*.json`.
  - The page JSON shape used by Tasks 5, 6 and 9:
    - `trackId`, `prefix`, `mode` (`'soon' | 'live'`)
    - `signup?: { source, interest, consentText, perks: string[] }` (soon pages)
    - `app?: { hrefHero, hrefClosing }` (live)
    - `questions: [{ topic, stem, options: [{ key, text, right?: true, tutor?: string, why?: string }], explanationHtml, quote, citation }]`
    - plus one field for each piece of copy that differs between FM and peds today.

Template syntax (exact): `{{name}}` is escaped text; `{{{name}}}` is pre-rendered HTML; a block between `<!-- if:name -->` and `<!-- /if:name -->` is kept only when `name` is truthy. Supported flags: `soon`, `live`, `questions`. The countdown, sources and questions blocks are produced by the renderer and inserted with `{{{countdown}}}`, `{{{sources}}}` and `{{{questions}}}`.

- [ ] **Step 1: Build the template.**
  - Copy `family-medicine.html` to `specialty.template.html`.
  - Every line that differs between `family-medicine.html` and `pediatrics.html` (about 98 lines: meta, names, analytics prefix, chip, lead, topic and question, status states, features lead, the comparison review row, signup copy, form source and interest) becomes a field in both JSON files. Everything else stays literal.
  - Rename `data-fm-cta` / `fm_*` events to `data-{{prefix}}-cta` / `{{prefix}}_*`.
  - Add the countdown under the hero CTA and the sources section after questions, in the order from Global Constraints.
  - Wrap the signup section in `if:soon` and add a live closing CTA in `if:live`.
- [ ] **Step 2: Write the failing tests.** Each test renders through `renderPage` with the real template, JSON and track data:
  - `'FM and peds regenerate with their own source, interest and events'`
    - FM output contains `source: 'landing_fm'`, `p_interest: 'family_medicine'`, `fm_signup`, `<link rel="canonical" href="https://meduxa.ai/family-medicine" />`
    - peds output contains `landing_peds`, `'pediatrics'`, `peds_signup`
  - `'countdown is readable without script'`
    - FM output contains `בחינת שלב א׳`, `14.06.2027`, `לפי לוח הבחינות של הר״י · המועד עשוי להשתנות`, and `href="https://www.ima.org.il/Internship/Events.aspx"`, all outside any `<script>`
  - `'countdown script is the tested function'`
    - inside a `<script>`, the output contains the text of `daysUntil.toString()` and `countdownState.toString()`, imported from `countdown.mjs`
    - the past-state text `מועד הבחינה הבא יפורסם בקרוב` and the today text `הבחינה היום` appear in the script
  - `'sources are escaped and LTR-isolated'`
    - a track whose source title is `Brenner & Rector's The Kidney 11e` renders `<span class="ltr-iso">Brenner &amp; Rector&#39;s The Kidney 11e</span>`. Extend `esc` here to escape `'` too, and keep the `render-tracks` tests green.
  - `'questions section is omitted when empty and numbered when present'`
    - `questions: []` → no `id="q-title"`
    - two questions → `שאלה 1 מתוך 2`, and exactly one `data-right` per question
  - `'no placeholder survives'`
    - each output matches neither `/\{\{/` nor `/<!-- (\/)?if:/`
  - `'validatePage rejects a soon page without signup and a live page without app links'`
  - `'existing FM launch-price perk is kept'`
    - FM output contains `מחיר השקה מיוחד`
- [ ] **Step 3: Run them to see them fail.**
  Run: `node --test scripts/render-specialties.test.mjs`
  Expected: FAIL, module not found.
- [ ] **Step 4: Implement `renderPage`, `validatePage` and the CLI** in `scripts/render-specialties.mjs`.
  - Import `esc` and `rich` from `render-tracks.mjs`.
  - Date text format: `DD.MM.YYYY`.
  - The countdown block's served HTML shows `{nameHe} · {date}` and the footnote. The script fills `<b data-days>` with `daysUntil(...)` and switches the text by `countdownState`. It inlines `String(daysUntil)` and `String(countdownState)`.
  - The question widget generalises today's single-question script:
    - one question visible at a time, with previous/next buttons and `שאלה X מתוך N`
    - a right answer shows `explanationHtml` and the quote with its citation in `.q-explain` / `.q-src`
    - a wrong answer shows that option's `tutor` (the existing Socratic reply) or else its `why`, and lets the visitor pick again
    - gtag `{{prefix}}_sample_question` with `{ result, answer, q }`
  - FM and peds keep today's one question, as `questions[0]`, with their `tutor` lines.
- [ ] **Step 5: Run the tests.**
  Run: `node --test scripts/render-specialties.test.mjs scripts/render-tracks.test.mjs scripts/countdown.test.mjs`
  Expected: PASS, all.
- [ ] **Step 6: Regenerate and check for drift.**
  Run: `node scripts/render-specialties.mjs && node scripts/render-specialties.mjs --check`
  Expected: `written family-medicine.html`, `written pediatrics.html`, then `ok` for both.
- [ ] **Step 7: Diff against the old pages.**
  Run: `git diff --stat family-medicine.html pediatrics.html`, then read `git diff family-medicine.html`.
  Expected: the only changes are the new countdown block, the sources section, the question widget's numbering and nav, and the renamed analytics attributes. Any other changed line is a template bug: fix it and repeat Steps 5–7.
- [ ] **Step 8: Check in the browser.**
  Run: `python3 -m http.server 8000`, then open `http://localhost:8000/family-medicine.html` at 375 px and at desktop width.
  Expected:
  - the countdown shows a number and the date
  - the sample question answers right and wrong as before
  - the sign-up form is unchanged
  - with JavaScript disabled, the date line still reads
- [ ] **Step 9: Commit.**
  ```bash
  git add specialty.template.html specialties scripts/render-specialties.mjs scripts/render-specialties.test.mjs scripts/render-tracks.mjs family-medicine.html pediatrics.html
  git commit -m "feat(specialty-pages): one template for specialty pages, with countdown and sources"
  ```

### Task 5: `/nephrology` (live page)

**Files:**
- Create: `specialties/nephrology.json`
- Generate: `nephrology.html`
- Modify: `scripts/make-promo-image.mjs`
- Create: `og-nephrology.png`, `whatsapp-nephrology.png`
- Test: `scripts/render-specialties.test.mjs`

**Interfaces:**
- Consumes: the page JSON shape and `renderPage` (Task 4).

- [ ] **Step 1: Write the failing test** `'nephrology is a live page with app links and no form'`. Its output must:
  - contain `https://app.meduxa.ai/?signup=1&amp;src=landing&amp;pl=hero` and `…pl=closing`, and `התחילו ללמוד — חינם`
  - contain `בחינה במקצוע-על — חלק א׳` and `12.01.2027`
  - contain `Brenner &amp; Rector`
  - not contain `id="notifyForm"`, `מחיר השקה` or `שלב א׳ בנפרולוגיה`
  - have the canonical `https://meduxa.ai/nephrology`
- [ ] **Step 2: Run it to see it fail.**
  Run: `node --test scripts/render-specialties.test.mjs`
  Expected: FAIL, no `specialties/nephrology.json`.
- [ ] **Step 3: Write `specialties/nephrology.json`.**
  - `mode: "live"`, `prefix: "nephro"`, `questions: []`.
  - Copy adapted from FM's:
    - hero stage: `הכנה לבחינת מקצוע-על בנפרולוגיה`
    - status states: the engine is live and residents use it today; there is no "content being built" state
    - features lead: `…מותאם לבחינת מקצוע-על בנפרולוגיה`
  - Claims must come from what the homepage already says about nephrology (`tracks.json` blurb, the `#features` section).
  - Both app links carry `data-nephro-cta="hero"` / `"closing"`. The template's existing home-click listener pattern sends `va('event', { name: 'nephro_app_click', data: { placement } })` for them, which is the live-page counterpart of `fm_home_click`.
  - `ogImage: "https://meduxa.ai/og-nephrology.png?v=1"`.
- [ ] **Step 4: Extend `make-promo-image.mjs`.**
  - `PAGES` gains:
    - `nephro: { slug: 'nephrology', h1: 'הכנה לבחינת<br>מקצוע-על בנפרולוגיה', pill: 'פתוח עכשיו', offer: null }`
    - `cardio: { slug: 'cardiology', h1: 'הכנה לבחינת<br>מקצוע-על בקרדיולוגיה', pill: 'בקרוב', offer: null }`
  - `fm` and `peds` get `pill: 'בקרוב'` and their current offer text.
  - Where `offer` is null, the offer line is omitted.
  - Then run `node scripts/make-promo-image.mjs og nephro` and `node scripts/make-promo-image.mjs square nephro`, and pngquant them as the README describes.
  - Expected: both PNGs exist, and the cards show `פתוח עכשיו` and no price.
- [ ] **Step 5: Render and test.**
  Run: `node scripts/render-specialties.mjs && node --test scripts/render-specialties.test.mjs`
  Expected: `written nephrology.html`, and the tests PASS.
- [ ] **Step 6: Check in the browser.** Open `http://localhost:8000/nephrology.html` at 375 px and at desktop width.
  Expected: the countdown shows 79 or fewer days, the sources list reads correctly in RTL, both app buttons go to the URLs above, and there is no layout overflow.
- [ ] **Step 7: Commit.**
  ```bash
  git add specialties/nephrology.json nephrology.html scripts/make-promo-image.mjs og-nephrology.png whatsapp-nephrology.png scripts/render-specialties.test.mjs
  git commit -m "feat(specialty-pages): /nephrology"
  ```

### Task 6: `/cardiology` (coming-soon page)

**Files:**
- Create: `specialties/cardiology.json`
- Generate: `cardiology.html`
- Create: `og-cardiology.png`, `whatsapp-cardiology.png`
- Test: `scripts/render-specialties.test.mjs`

**Interfaces:**
- Consumes: Task 4's shape, Task 5's `cardio` promo page, and Task 1's interest key.

- [ ] **Step 1: Write the failing test** `'cardiology is a soon page with its own waitlist keys and no launch price'`. Its output must:
  - contain `source: 'landing_cardio'`, `p_interest: 'cardiology'`, `cardio_signup`, `15.12.2026` and `Braunwald`
  - not contain `מחיר השקה` or `הנחה קבוצתית`
- [ ] **Step 2: Run it to see it fail.**
  Run: `node --test scripts/render-specialties.test.mjs`
  Expected: FAIL.
- [ ] **Step 3: Write `specialties/cardiology.json`.**
  - `mode: "soon"`, `prefix: "cardio"`.
  - `signup.perks`: one perk, with no price: `נכתוב לכם ברגע שההכנה בקרדיולוגיה נפתחת.`
  - `consentText`: `אני מאשר/ת שתשלחו לי עדכון במייל כשההכנה לבחינת מקצוע-על בקרדיולוגיה תיפתח.`
  - `questions: []`.
  - Generate the og and square images with `cardio`.
- [ ] **Step 4: Render and test.**
  Run: `node scripts/render-specialties.mjs && node --test scripts/render-specialties.test.mjs`
  Expected: `written cardiology.html`, and the tests PASS.
- [ ] **Step 5: Gate.** Re-run Task 1 Step 4's SQL.
  Expected: one row for `cardiology`. If there is no row, keep this commit off `main` until Task 1 is applied.
- [ ] **Step 6: Commit.**
  ```bash
  git add specialties/cardiology.json cardiology.html og-cardiology.png whatsapp-cardiology.png scripts/render-specialties.test.mjs
  git commit -m "feat(specialty-pages): /cardiology coming-soon page"
  ```

### Task 7: Sitemap, README, full check

**Files:**
- Modify: `sitemap.xml`, `README.md`

- [ ] **Step 1: Sitemap.** Add `<url><loc>https://meduxa.ai/nephrology</loc></url>` and `<url><loc>https://meduxa.ai/cardiology</loc></url>`, after `/pediatrics`, in the same form as those entries.
- [ ] **Step 2: README.**
  - In "What's here", add the template, `specialties/`, the two render scripts, `countdown.mjs`, and the new pages and images.
  - Add a new section, "Exam dates":
    - the dates live in `tracks.json` `exam`
    - to refresh them: open the IMA calendar, filter by specialty, take only exam rows (never `ועדה מקצועית`), part A / Stage A only
    - re-check each date a month before it, when the IMA finalises it
    - then run `node scripts/render-specialties.mjs`
  - Analytics section:
    - add `nephro_*` and `cardio_*` events and `<prefix>_sample_question`
    - the nephrology homepage card no longer fires `cta_click`, since it now goes to `/nephrology`, not the app; remove the "fires both" note
- [ ] **Step 3: Run all checks.**
  Run: `node --test scripts/*.test.mjs && node scripts/render-tracks.mjs --check && node scripts/render-specialties.mjs --check && node scripts/check-crawler-exemption.mjs`
  Expected: every test passes, and every page reports `ok`.
- [ ] **Step 4: Check the whole flow in the browser.**
  - Open the homepage, click each of the four cards, and confirm each lands on its page.
  - Do the same from `/en`: the cards show the "Hebrew content" pill.
  - Confirm `/nephrology` and `/cardiology` resolve without `.html`, using `npx vercel dev` if available, otherwise check the `.html` paths.
- [ ] **Step 5: Commit.**
  ```bash
  git add sitemap.xml README.md
  git commit -m "docs: specialty pages, exam dates and their refresh"
  ```

---

## Release 2 — sample questions (after owner sign-off)

### Task 8: Candidate questions for owner sign-off

**Files:**
- Create: `docs/sample-questions/2026-10-candidates.md`

This is not code. It is a human gate: nothing from it ships until the owner signs off.

- [ ] **Step 1: Pull candidates, read-only.** Use the product Supabase project and run this once per module (`nephrology`, `family`, `peds`, `cardio`):

```sql
select aq.id, aq.topic, aq.text, aq.options, aq.correct, aq.explanation, aq.source, aq.quote,
       aq."distractorRationale", p.quality_level, p.citation_verified
from public.app_ready_questions_v2 aq
join public.question_published_v2 p on p.question_id = aq.id
where aq.module = :module
  and p.citation_verified
  and coalesce(aq."needsImage", false) = false
  and not coalesce(aq."multipleCorrect", false)
order by p.quality_level desc, aq.id
limit 40;
```

- [ ] **Step 2: Pick 5 per module.** Choose high-yield topics that don't overlap, with a short stem and a quote under 300 characters.
  - For each, check the `quote` against the source text in the product repo's `sources/` where it exists. Mark each candidate `quote checked` or `quote not checkable (source not in repo)`.
  - If a module has no candidate that passes, write `none` for it. Its page then ships without the questions section.
- [ ] **Step 3: Write the review doc.** Per candidate, include the DB id, topic, stem, options with the marked answer, explanation, quote and citation, the quote-check mark, and a sign-off checkbox for the owner. Commit it.
  ```bash
  git add docs/sample-questions/2026-10-candidates.md
  git commit -m "docs: sample-question candidates for owner sign-off"
  ```
- [ ] **Step 4: Stop. The owner signs off or swaps questions in the doc.** Continue to Task 9 only for the questions marked approved.

### Task 9: Ship approved questions

**Files:**
- Modify: `specialties/*.json`, `specialty.template.html`
- Regenerate: the four pages
- Test: `scripts/render-specialties.test.mjs`

- [ ] **Step 1: Write the failing test** `'approved questions render with the rights note'`. For each page with questions, the output must contain `שאלה 1 מתוך N` (where N is that page's count) and the rights note `השאלות מבוססות על נושאים ממבחני עבר ונערכו על ידי הצוות שלנו.`
- [ ] **Step 2: Run it to see it fail.**
  Run: `node --test scripts/render-specialties.test.mjs`
  Expected: FAIL.
- [ ] **Step 3: Add the questions.**
  - Transcribe each approved question into its page's `questions` array, exactly as signed off: options, the `right` flag, `why` from `distractorRationale`, `explanationHtml`, `quote` and `citation`.
  - On FM and peds, the existing hand-written question stays first.
  - Add the rights note under the widget inside `if:questions`.
- [ ] **Step 4: Render and test.**
  Run: `node scripts/render-specialties.mjs && node --test scripts/*.test.mjs && node scripts/render-specialties.mjs --check`
  Expected: PASS, every page `ok`.
- [ ] **Step 5: Check in the browser.** On each page, answer every question right once and wrong once.
  Expected: right shows the explanation and source, wrong shows the reason and allows a retry, and next/previous move between the questions.
- [ ] **Step 6: Commit.**
  ```bash
  git add specialties specialty.template.html nephrology.html cardiology.html family-medicine.html pediatrics.html scripts/render-specialties.test.mjs
  git commit -m "feat(specialty-pages): owner-approved sample questions"
  ```
