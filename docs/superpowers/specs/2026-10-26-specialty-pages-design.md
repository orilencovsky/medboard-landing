# Specialty pages — design

Date: 2026-10-26 · Repo: `medboard-landing` (meduxa.ai) · Plus one small change in the product repo
(`/Users/ori/dev/meduxa`).

## Why

A competitor (tatexams.com) launched a site close to ours. Reviewing it, the owner picked four
things worth adopting: a clear list of specialties, a countdown to each specialty's exam, a few
free sample questions per specialty, and the list of sources each specialty's explanations are
built on. Today our homepage sends a nephrology visitor straight to the app signup, and the two
"coming soon" pages have a single hand-written sample question each. A visitor can't see, per
specialty, how close their exam is, what the content is based on, or try more than one question.

Success: a resident lands on meduxa.ai, finds their specialty, clicks it, and on that specialty's
page sees how many days are left to their exam, tries a few real questions, sees what the
explanations are sourced from, and then signs up (live) or leaves an email (coming soon).

## Decided by the owner

- **No prices** anywhere for now. **No team list** for now.
- **A list of specialties** on the homepage. Clicking a specialty opens **its own page**
  (option B from the mockups: `meduxa.ai/nephrology`, `/cardiology`, …), not an inline panel and
  not a pop-up.
- **A countdown per specialty**, shown on that specialty's page (not one global countdown).
- **Exam dates come from the IMA events calendar** (https://www.ima.org.il/Internship/Events.aspx),
  **exam events only** — never "ועדה מקצועית" (professional committee) rows.
- **1–5 free sample questions per specialty.**
- **A list of sources per specialty.**
- **Specialties:** nephrology (live), family medicine (soon), pediatrics (soon), and **cardiology
  added as "coming soon"**.
- Page order and behaviour as played back and confirmed ("נשמע נכון"):
  header with countdown and the main action → sample questions → sources → closing action.
  Sample questions are answered one at a time; after answering, the visitor sees the right
  answer, the explanation and its source.
- **The existing middle sections stay** (status, "איך לומדים כאן", "מה תקבלו", the comparison
  table) on all four pages, placed after the sources and before the closing action. Full order:
  header + countdown → sample questions → sources → status → method → features → comparison →
  closing action (sign-up form on coming-soon pages, "התחילו ללמוד — חינם" on nephrology).
  /nephrology and /cardiology get the same sections, with their specialty's wording.
- **The owner gives the final medical sign-off** on every public sample question.
- **Cardiology gets a countdown too**, to 15.12.2026, even though it is a coming-soon track.

## Calls made by Claude (owner can override)

- **Hebrew only.** Specialty pages are Hebrew, like today's `/family-medicine` and `/pediatrics`.
  `/en` keeps its cards and links to them with the existing "Hebrew content" pill.
- **URLs:** `/nephrology` (new), `/cardiology` (new), `/family-medicine` and `/pediatrics` (kept —
  they are already shared and indexed; they are upgraded in place, not replaced).
- **Nephrology homepage card now links to `/nephrology`**, not straight to the app. The homepage
  hero CTA and the `#pilot` closing CTA still go straight to the app — the fast path stays.
- **Coming-soon pages keep their email sign-up** as the main action (the existing form, its
  consent wording and its events). The live page's main action is "התחילו ללמוד — חינם" → app.
- **A short line under the sample questions** says they are based on topics from past exams
  and were edited by our team (TATExams carries a similar rights note).
- **Exam naming follows the IMA wording**, because it's the official one:
  - Nephrology and cardiology are sub-specialties: "בחינה במקצוע-על — חלק א׳".
  - Family medicine and pediatrics: "בחינת שלב א׳".
  The page title/hero can keep the site's existing wording; the countdown line uses the IMA's.
- **"No prices" means no new pricing.** The launch-pricing / group-discount copy that is already
  live (tracks.json blurbs, announcement bar, FM/peds pages, promo images) stays as it is. The new
  cardiology card and page don't mention a launch price.
- **Two releases.** First: homepage cards, the four specialty pages with countdown and sources,
  and the cardiology sign-up. Second: sample questions, once approved. The question section is
  simply absent until then.

## Exam dates (from the IMA calendar, read 2026-10-25)

| Specialty | Exam (IMA wording) | Date |
|---|---|---|
| Nephrology | בחינה במקצוע-על — חלק א׳ | 12/01/2027 |
| Cardiology | בחינה במקצוע-על — חלק א׳ | 15/12/2026 |
| Family medicine | בחינת שלב א׳ | 14/06/2027 |
| Pediatrics | בחינת שלב א׳ | 14/06/2027 (listed twice, same day; treat as one) |

Part B (חלק ב׳) dates exist for nephrology (14/01/2027) and cardiology (16/12/2026) but the site
only prepares for part A / Stage A, so only part A is counted down.

The IMA says dates may change and the final date is published up to a month before each exam.

## Countdown behaviour

- Shows "**N** ימים לבחינה" plus one line: the exam's IMA name, the date (DD.MM.YYYY), and
  "לפי לוח הבחינות של הר״י · המועד עשוי להשתנות" with a link to the IMA page.
- Days are counted in Israel time (Asia/Jerusalem), calendar days, from today to the exam day.
- The date and exam name are in the served HTML (crawlers, no-JS and first paint see them); only
  the day count is filled in by script. Without script, the line still reads correctly
  (e.g. "הבחינה: 12.01.2027").
- On exam day: "הבחינה היום". After the date passes and before the data is updated: hide the
  number and show "מועד הבחינה הבא יפורסם בקרוב" — never a negative or stale count.
- The date lives in exactly one place (see "Data"); nothing hard-codes it in page text.

## Sample questions

- 1–5 per specialty, one at a time, with "שאלה X מתוך N" and next/previous.
- Each question: stem, 4 options. Picking the right answer shows the explanation and its source
  quote with citation (book/guideline + chapter/page), in the existing `.q-explain` / `.q-src`
  look from the coming-soon pages. Picking a wrong answer shows why that option is wrong (the
  question's distractor rationale) and lets the visitor try again.
- The existing hand-written question on `/family-medicine` and `/pediatrics` (with the Socratic
  "tutor asks back" replies) may stay as question 1; that's the builder's call.
- Content source: **the product DB is the authority for every specialty**, including
  nephrology (`src/data/questions.js` is an older snapshot; the DB has had manual edits since).
  Read-only export with the service role. Candidates must be served in the app today
  (`app_ready_questions_v2`), have `citation_verified`, a valid answer key, the highest
  available `quality_level`, and need no image (images are out of scope).
- `moderation_status='approved'` is a structural check, not a human review (per the product's
  schema doc; e.g. the 2019 nephrology rows were bulk-approved), so it is not enough on its own.
- The site can't read questions live: the public anon key is blocked from question content by
  design. Questions are copied into the site as static content.
- Process: Claude picks 5 candidates per specialty and checks each one's quote against the
  source text where the source is available (in the product repo's `sources/`), flagging any
  it can't check. Then the owner gives the medical sign-off on answer key, explanation and
  source, or swaps a question. Only signed-off questions ship. If a specialty has no approved question that passes the
  checks (cardiology may not), its page ships without the sample-questions section rather than
  with a weak one.
- Questions are shown as they are in the app (based on past exams, edited by our team).

## Sources section

Heading like "על מה מבוססים ההסברים". A list of the specialty's main textbooks and guidelines, from
each bundle's `manifest.json` in the product repo:

- **Nephrology:** Brenner & Rector's The Kidney 11e; Johnson, Comprehensive Clinical Nephrology
  7e; Daugirdas, Handbook of Dialysis 6e; Rose & Post, Clinical Physiology of Acid-Base and
  Electrolyte Disorders 5e; Danovitch, Handbook of Kidney Transplantation 7e; KDIGO, KDOQI and
  ISPD guidelines; Israeli hypertension position paper 2026.
- **Pediatrics:** Nelson Textbook of Pediatrics 22e; Israeli clinical guidelines (25, e.g.
  gastroenteritis, UTI, community-acquired pneumonia, otitis media, neonatal jaundice).
- **Family medicine:** Goroll, Primary Care Medicine 9e; Nelson 22e; AFP review articles;
  Israeli Medical Association guidelines and position papers; GINA, GOLD, ADA 2025; Ministry of
  Health vaccine guide.
- **Cardiology:** Braunwald's Heart Disease 13e; ESC guidelines; recent journal articles
  (Eur Heart J, JACC, Circulation, JAMA).

Show textbooks with edition; guidelines as named groups (not 25 separate lines). Don't list
UpToDate/NEJM/Lancet-type secondary references unless the manifest ranks them as primary.

## Homepage changes

- `#tracks` gains a fourth card: cardiology, "בקרוב", → `/cardiology`.
- Nephrology card → `/nephrology` (the card's action text can stay "התחילו ללמוד — חינם" or
  become "לפרטים" — builder's call; keep `track_click` firing).
- Announcement bar and `#pilot` closing line already join the "soon" tracks from `tracks.json`,
  so cardiology appears there automatically.
- No countdown and no prices on the homepage.

## Data

- **One source of truth for the shared facts**: exam (IMA name, date, IMA link) and sources per
  specialty go into `tracks.json`, next to the existing per-track fields, so homepage and pages
  can't disagree.
- Sample questions: one static data block per specialty (in `tracks.json` or a sibling
  `specialties/<id>.json` — builder's call).
- The site has no build step at deploy and no dependencies; keep it that way. Same pattern as
  `scripts/render-tracks.mjs`: a plain-Node script renders data into the pages between marker
  comments, with `--check` as a drift guard. Whether the four pages share one template file or
  stay four hand-authored files with rendered sections is the builder's call — but they must not
  become four drifting copies of the same 1,000 lines.

## Cardiology sign-up (product repo, separate PR, lands first)

The coming-soon form writes to the product's Supabase: insert into `waitlist` with a `source`
(`landing_fm`, `landing_peds`) and then `rpc/waitlist_add_interest` with an interest key
(`family_medicine`, `pediatrics`). The DB only accepts known interest keys
(`20260926120000_waitlist_interests.sql`, `20261006153000_waitlist_interest_pediatrics.sql`).
Cardiology needs a migration in `/Users/ori/dev/meduxa` adding the interest `cardiology`,
following the pediatrics migration (a data-only insert of the interest key). The source
`landing_cardio` already passes the `source` check, so it needs no change.
`/cardiology`'s form must not go live before that migration is applied.

## Analytics

Follow the existing per-page pattern: `cardio_signup`, `cardio_home_click`, and a sample-question
event per specialty like the existing `fm_sample_question` (`{result, answer}`, plus the question
number). On `/nephrology`, the app link keeps the closed `src`/`pl` vocabulary: use `src=landing`
with `pl=hero` (page header) and `pl=closing` (bottom), since a new placement value would need an
app-side migration first. README's analytics section lists the new events.

## SEO and sharing

- `/nephrology` and `/cardiology` get title, description, canonical and OG tags like the existing
  pages, and go in `sitemap.xml`.
- OG images for `/nephrology` and `/cardiology` from `scripts/make-promo-image.mjs` (extend it with
  `nephro` and `cardio`).
- `/family-medicine` and `/pediatrics` titles drop "בקרוב:" only if the owner wants; otherwise
  unchanged.

## Keeping dates current

README gets a short "Exam dates" section: where the dates live, how to read the IMA calendar
(filter by specialty, take exam rows only, part A / Stage A), and to re-check each date a month
before it, when the IMA finalises it.

## Goals

- Every specialty is one click from the homepage and has its own page with countdown, sample
  questions and sources.
- The countdown is right, or silent — never wrong.
- Adding a fifth specialty is a data change plus content, not a new page written by hand.

## Non-goals

- Prices, plans, checkout. Team / reviewers list. FAQ section.
- English specialty pages.
- Live questions from the DB; a public sample bank larger than 5 per specialty.
- Part B / Stage B countdowns. Exam dates inside the app.
- Specialties beyond these four.

## Anti-goals (would be a failure even if it works)

- A committee date shown as an exam date, or a countdown that keeps counting after the exam.
- Nephrology's exam called "שלב א׳" in the countdown line, against the IMA's name.
- A public sample question with a wrong answer key, a broken source, or an unverified quote.
- Cards or countdowns that only exist after JavaScript runs (crawlers and no-JS see nothing).
- Four copies of the page that drift apart.
- Cardiology sign-ups silently failing because the DB rejects the interest key.

