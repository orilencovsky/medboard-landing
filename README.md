# MeduXa.ai — marketing site

The public landing site for **[MeduXa.ai](https://meduxa.ai)** — a source-grounded, AI-powered
platform for medical board exam prep. This repo is the marketing site only; the product itself
lives in a separate private repo and is served from `app.meduxa.ai`.

| | |
|---|---|
| **Live (HE)** | https://meduxa.ai |
| **Live (EN)** | https://meduxa.ai/en |
| **Host** | Vercel (static, `cleanUrls: true`; `/he` 308s to `/?lang=he`) |
| **Product** | Nephrology Stage A board prep — pilot launch September 8, 2026 |

> The repo is still named `medboard-landing` after the product's former name, **MedBoard IL**.
> The product rebranded to **MeduXa** in July 2026; the repo name is historical.

## What's here

```
index.html               Hebrew / RTL landing page — the root (single file: markup + inline CSS + inline JS)
en/index.html            English landing page — a full translation, not a wrapper
privacy.html, terms.html, accessibility.html          Legal pages, Hebrew (/privacy, /terms, /accessibility)
en/privacy.html, en/terms.html, en/accessibility.html Legal pages, English (under /en)
404.html                 Not-found page — one bilingual file for every missing path
hero.mp4 / hero.webm             Desktop hero video
hero-mobile.mp4 / hero-mobile.webm   Phone hero video (<=600px)
og-image.png             Open Graph / Twitter card — English (/en)
og-image-he.png          Open Graph / Twitter card — Hebrew (root)
robots.txt, sitemap.xml  Indexing — this site is the only indexed MeduXa surface
vercel.json              Vercel config (cleanUrls + the language routing rules)
api/tutor.js             Serverless endpoint behind the hero card's live AI tutor
scripts/prep-hero-video.sh   ffmpeg pipeline that produces the four hero video files
scripts/make-og-image.mjs    renders an OG card to PNG (`node scripts/make-og-image.mjs he`)
docs/hero-video-prompt.md    The generation prompt behind the hero footage
```

There is **no build step and no dependencies** — the pages are hand-authored static HTML with
inline styles and inline scripts, and `api/tutor.js` is a single `fetch` against the Anthropic
Messages API, so there is no root `package.json` for Vercel to install from either. Open
`index.html` in a browser, or serve the directory:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000/ (HE) and http://localhost:8000/en/ (EN).

Language routing happens at the Vercel edge, so locally `/` always renders Hebrew and `/en` always
renders English — see **Language routing** below for how to exercise the real rules.

## Page structure

Both language versions share the same section order, anchored for in-page nav:

| Anchor | Section (EN heading) |
|---|---|
| — | Hero — video background + the one-line pitch |
| `#science` | "Learning backed by how the brain actually works" — the nine evidence-based principles |
| `#features` | "Everything you need to pass — nothing you don't" |
| `#how` | "From first question to exam day" |
| `#vision` | "One engine, every board exam" — the subject-agnostic story beyond nephrology |
| `#pilot` | "Ready to study smarter?" — the nephrology pilot + waitlist signup |

Off that spine sit six standalone legal pages — `/privacy`, `/terms`, `/accessibility` and their
`/en` counterparts — reachable from every footer, and the privacy and terms pages also from the
notice under the waitlist form.

## Legal pages

`privacy.html` / `terms.html` and `en/privacy.html` / `en/terms.html` are four independent files in
the same hand-authored style as the landing pages, sharing a small `.doc` stylesheet rather than a
template. They exist because the site collects email addresses from EU visitors by design: the edge
router sends every non-Israeli, non-Hebrew-speaking request to `/en`, which puts the site squarely
inside the GDPR alongside Israel's Privacy Protection Law (Amendment 13).

What has to stay true as the site changes — each of these is a statement the pages make:

| The pages say | So if you change… |
|---|---|
| Waitlist emails are kept 24 months, or until deletion is requested (30-day turnaround) | …see [Handling a deletion request](#handling-a-deletion-request) — today that's a manual `DELETE` against Supabase, not an automated flow, so the 30-day and 24-month promises hold only as long as someone is actually doing that by hand |
| The only cookie is `mx_lang`, functional, no tracking cookies at all | …adding any identifier-based script means a consent banner **and** a rewrite of § 3 |
| Processors are Supabase, Vercel and Anthropic, transferring under their DPAs' SCCs | …a new third-party script or backend is a new named processor in § 4 |
| `privacy@meduxa.ai` is answered within 30 days | …the address has to keep reaching a human; it is the only contact point in both documents |
| The controller is "MeduXa" | …on incorporation, name the registered entity here — a trade name alone does not satisfy GDPR Art. 13(1)(a) |

Both documents carry a "last updated" line that should move whenever their substance does. Neither
has been reviewed by a lawyer.

## Accessibility

`/accessibility` and `/en/accessibility` are the accessibility statement, in the same hand-authored
style as the other legal pages. They exist because the site serves the Israeli public, where the
Equal Rights for Persons with Disabilities Regulations (Service Accessibility Adjustments),
5773-2013 expect a business website to meet **IS 5568 level AA** (which adopts WCAG 2.0) and to
publish a statement saying so. Like the privacy and terms pages, it has not been reviewed by a
lawyer, and no certified accessibility professional (מורשה נגישות) has audited the site — the
statement says both of those in its own text rather than implying otherwise.

**The statement is a set of claims about the code, so the code has to keep making them true:**

| The statement says | So keep true |
|---|---|
| Every interactive element is reachable by `Tab` and fires on `Enter`/`Space` | The demo card's options, chips, send and expand controls are `div`s with `role="button"`; their keyboard handling is wired by hand in the page script. A new `div` control needs the same wiring — see the `keydown` delegation at the bottom of `index.html` |
| Every page has a skip link, first in the tab order, pointing at `<main id="main">` | All eight pages carry `<a class="skip" href="#main">` right after `<body>` and exactly one `<main id="main">`. A new page needs both |
| Every text colour meets 4.5:1 against its background | Check any new colour before using it. Two were fixed to make this true: the waitlist status line (`#94A3B8` → `#64748B`, 2.56:1 → 4.76:1) and the legal pages' "last updated" line (`#64748B` → `#5B6B80`, 4.37:1 → 4.99:1 on `#F0F6FA`) |
| The hero video is silent, decorative and hidden under `prefers-reduced-motion` | It is `muted`, `aria-hidden="true"`, and hidden by the reduced-motion media query. Any new motion follows the same rule |
| Section 4 lists the known gaps | It names four, honestly — unmarked `lang` on Latin terms inside Hebrew (WCAG 3.1.2), the hover-and-click science cards, unreviewed live tutor wording, and third-party DOI links. **Fixing one means deleting it from the list; adding a gap means adding it** |
| Reports go to `privacy@meduxa.ai`, answered within 30 days | Same inbox as the privacy pages. If a dedicated `accessibility@` alias is ever created, it changes in both language versions together |

The statement also carries the date it was last checked (currently **2 September 2026**) and states
that the check was a self-assessment by the development team. That date should move only when
someone actually re-checks. Note it deliberately does **not** name an accessibility coordinator or a
phone number: the regulations require appointing one at 25+ employees, so revisit this on hiring.

## The 404 page

`404.html` at the repo root is served by Vercel for **every** missing path, including paths under
`/en`, so it is one bilingual file rather than two — the page picks its own language on load, most
explicit signal first:

1. the path (`/en/...` was clearly aimed at the English side),
2. the `mx_lang` cookie (a preference the visitor already stated),
3. `navigator.language`.

The edge router's country check cannot be reproduced there. The `redirects` in `vercel.json` only
match `/`, so a 404 never passes through them and `x-vercel-ip-country` never reaches the page. An
Israeli visitor on an English-language browser therefore lands on the English 404 while the router
would have kept them on Hebrew — the single point where the two disagree, and it is not fixable
client-side.

`python3 -m http.server` returns its own plain 404 and never reaches this file, so exercise it on a
preview deployment or with a static server that falls back to `404.html`.

## Language routing

`/` is the Hebrew page and `/en` is the English one; the choice between them is made by the
**Vercel edge router**, in the `redirects` block of `vercel.json`. Hebrew is the default — a request
for `/` is sent on to `/en` only when one of these holds:

| # | Condition | Why |
|---|---|---|
| 1 | Cookie `mx_lang=en` | The visitor has chosen English before |
| 2 | `Accept-Language` does **not** start with `he`, **and** `x-vercel-ip-country` is **not** `IL` | Neither a Hebrew-language browser nor an Israeli visitor |

Rule 2 is skipped once the `mx_lang` cookie exists, so a stated preference always beats a guessed
one. Note it is a single rule with both conditions: an Israeli visitor on an English-language
browser stays on Hebrew, which is the same call the previous English-root version made in reverse.
The redirects are **307 (temporary)**, and both pages carry `hreflang` tags, so each language stays
independently indexable.

The `mx_lang` cookie (one year, `SameSite=Lax`) is written client-side by the pages themselves,
since only the router reads it:

- `/` sets `mx_lang=he` on load, and strips any `lang` param back out of the URL (leaving any
  `utm_*` intact) so a copied link doesn't carry the lock to the next person.
- `/en` sets `mx_lang=en` on load.

Every rule also requires the `lang` query param to be **absent** — that is what keeps `/?lang=he`
from being bounced straight to `/en` before the cookie can be written. The `עברית` switcher on `/en`
links to `/?lang=he` for exactly that reason.

`/he` — the address the Hebrew page used to live at — **308s to `/?lang=he`**, not to `/`. The param
matters: without it, an old Hebrew link followed by someone carrying an `mx_lang=en` cookie would be
bounced straight to `/en`, and the explicit link would lose to the stale cookie.

Visitors from before the cookie existed carry `mbil_lang` in localStorage. `/en` migrates a stored
`he` over to the cookie once and sends them back to the root; a stored `en` needs no migration,
since the router would send them to `/en` anyway.

> **Country detection only exists on Vercel.** Served locally over `python3 -m http.server` there is
> no router, so `/` always renders Hebrew — test rule 2 on a preview deployment. `vercel dev` does
> not evaluate the geolocation `has` condition either.

### Adding a third language

Everything above is built for exactly two locales — the redirect rules are one binary choice
(`mx_lang=en` present or not), not a per-language table. Arabic, Russian, and French are on the
roadmap; when one is actually being added, plan for more than a new folder:

- **Routing** — `vercel.json`'s `redirects` need a real per-language rule set instead of the current
  he/en binary (cookie value, `Accept-Language` match, and a fallback per locale).
- **The AI tutor** — `api/tutor.js` switches its system prompt on `body.locale`, currently only
  `'en'` vs. everything-else-is-Hebrew (see `SYSTEM_HE` / `SYSTEM_EN`). A new locale needs its own
  system prompt, written and reviewed in that language, not a mechanical translation of the Hebrew
  or English one — it is instructing a live model on a clinical case.
- **RTL** — Arabic reuses the Hebrew page's RTL patterns (`.ltr-iso` for embedded Latin numerals,
  `dir` handling); Russian and French are LTR like `en/index.html`.
- **hreflang** — every page's `<link rel="alternate" hreflang="...">` block lists all locales, so
  each new page means an edit to all the *existing* pages too, not just a new one.
- **Medical copy** — the KDIGO criteria and similar clinical content need a native-speaking medical
  reviewer, not just a translator; this is body-copy accuracy, not marketing copy.

## Waitlist

The signup form posts straight into the product's Supabase `waitlist` table using the **publishable**
key, insert-only — row-level security blocks reads, so the embedded key exposes nothing. Each row
records the submitting page's locale (`en` / `he`).

The form carries a **required consent checkbox** and, under it, the notice the Privacy Protection
Law (§ 11) wants at the point of collection: that giving the address is voluntary, what it is used
for, who holds it, and that deletion can be requested. `required` on the checkbox means the browser
blocks the `submit` event itself, so the handler never sees an address nobody consented to sending
— don't drop that attribute, and don't move the consent text out of the `<form>`.

Consent is evidenced server-side: `waitlist.consent_at` (nullable `timestamptz`, added after launch
planning) records the moment the submit handler read the checkbox as checked, sent as an ISO
timestamp in the insert body alongside the double-check `if (!val || !consent.checked) return;` —
belt-and-suspenders against the `required` attribute ever being dropped from the checkbox. Rows
inserted before this column existed carry `consent_at = null`. Adding any other new column to the
insert body the same way needs the RLS `INSERT` policy's `with_check` to keep allowing it — an
unknown column makes PostgREST reject the row with a `400` and the visitor sees the generic failure
message, but `consent_at` isn't checked there, so it isn't at risk from that policy.

### Handling a deletion request

There is no self-serve deletion endpoint and no `DELETE` RLS policy on `waitlist` — the table only
grants `INSERT` to `anon` and `SELECT` (to admins, via `is_question_v2_admin()`), so the publishable
key used by the form cannot delete a row even if it wanted to. Deletion is a manual, human step:

1. A request arrives at `privacy@meduxa.ai` — the only contact point the privacy pages name for
   this, in both languages (§ 7).
2. Whoever holds it opens the Supabase dashboard for the `MeduXa` project (`pappjpdsajkcoqrfqqqx`)
   → **Table Editor** → `waitlist`, finds the row by the email in the request, and deletes it — or
   runs the equivalent `delete from waitlist where email = '<address>';` in the SQL editor. Either
   path needs a Supabase account with access to this project; there is no separate admin tool.
3. Reply to the requester confirming it's done. The privacy pages promise this inside **30 days**
   (§ 5, § 7) — that clock is not enforced by anything technical, so it is on whoever is watching
   the inbox.

24-month retention (§ 5 of the privacy pages) is likewise not auto-pruned — there is no scheduled
job deleting rows past that age. Until one exists, treat it as a manual housekeeping task: query
`select email, created_at from waitlist where created_at < now() - interval '24 months';` from time
to time and delete what comes back the same way as an ad-hoc request.

## Hero demo card and the AI tutor

The question card beside the hero copy is interactive. The visitor picks one of the four answers
and gets the Socratic line written for *that* option (`data-tutor` on each `.qopt`); an expandable
panel lists the full KDIGO staging criteria. From there they may send **one** message to a live
tutor — by picking one of the suggested chips or by typing — which posts to `/api/tutor`.

That pick is taken **once**, the way the exam is sat: it sets the ✓/✕, reveals the right answer
(`.qopt.key`) if they missed it, spends the one tutor message, and reports `demo_answer_selected`.
After it the options become a review surface — clicking one only swaps the explanation, and shows
`data-review`, a neutral line that states the criterion rather than reacting as though they had
just chosen it. So each option needs **both** attributes, and the verdict, the thread and the
message quota never reset. Re-picking used to reset all three, which let a visitor brute-force
their way to the ✓ and refill the client-side quota at will.

`api/tutor.js` holds the system prompt server-side, so the endpoint cannot be driven as a
general-purpose chat. It needs `ANTHROPIC_API_KEY` set in **Vercel → Project → Settings →
Environment Variables** (Production + Preview); without it the endpoint answers `503`
`not_configured` and the card shows its "connection dropped" message. If that key is not scoped to
a single workspace, the Anthropic API also requires an `anthropic-workspace-id` header, or every
request 400s — set `ANTHROPIC_WORKSPACE_ID` (Console → Settings → Workspaces) alongside it; the
header is only sent when that variable is present. Spend is bounded on four layers:

| Layer | Limit |
|---|---|
| Client | 1 message per visitor (`MAX_MESSAGES`), not refilled by re-picking |
| Endpoint | 3 requests/hour per IP; 600 requests/day global kill-switch |
| Model | `claude-haiku-4-5`, `max_tokens: 300` |
| Prompt | System prompt server-side only |

At roughly 1,000 input + 150 output tokens per reply (≈ $0.001), the daily cap bounds spend at
about **$1/day**. The rate limiter lives in memory, so it is per serverless instance and
best-effort — move it to Vercel KV / Upstash if the logs ever show abuse.

The endpoint takes a `locale` field (`he` / `en`) and switches the system prompt on it; each page
sends its own. The pages' copy and the prompt's case notes state the same KDIGO facts, so both
have to be edited together if the demo question ever changes.

Because the card grows as it is answered, the hero videos live inside a `.hero-bg` wrapper whose
height is pinned once by script — `object-fit: cover` re-crops on every height change, and without
the pin the footage visibly jumps the moment a visitor answers.

## Hero video

The hero uses two tiers, picked by `<source media="(max-width: 600px)">`, with WebM before MP4 in
each tier. To regenerate them from a raw clip:

```bash
./scripts/prep-hero-video.sh path/to/raw-clip.mp4
```

The script strips audio, scales to 1600px (desktop) and 800px (phone), and targets roughly
"desktop pair under 5 MB, mobile pair under 1 MB". It needs `ffmpeg` (`brew install ffmpeg`).

## Editing conventions

- **Both languages, every time.** `index.html` (Hebrew, the root) and `en/index.html` are independent
  files. A copy or layout change made in one must be mirrored in the other, or the two drift.
- **RTL is real, not flipped.** The Hebrew page is authored right-to-left; check it in a browser
  rather than assuming a mirrored desktop layout holds up.
- **Phones are the tight case.** The `<=600px` breakpoint is tuned against SE-class viewports —
  re-check the nav row and the waitlist input at that width after any change.
- Keep the site **dependency-free**. No bundler, no framework, no CDN scripts.

## Analytics

**Vercel Web Analytics**, wired inline on both pages — the shim plus
`/_vercel/insights/script.js`. It has to be switched on under **Vercel → Project → Analytics**;
the path is served by the platform, so it 404s on a local static server and no events are sent
from `python3 -m http.server`.

Three custom events survive from the GA4 setup this replaced: `sign_up` (waitlist submitted),
`tutor_reply_shown` and `demo_answer_selected` — all fired through `va('event', { name, data })`.

The swap away from GA4 was a compliance decision, not a preference. GA4 set cookies and derived a
persistent identifier before any consent, on a site whose edge router deliberately sends every
non-Israeli, non-Hebrew-speaking visitor — EU traffic included — to `/en`. Cookieless measurement
removes the thing that would have needed a consent banner. Reintroducing GA4, or any
identifier-based analytics, means building that banner and re-writing § 3 of both privacy pages.

## License

Private project. All rights reserved.
