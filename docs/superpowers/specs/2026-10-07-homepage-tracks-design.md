# Homepage tracks section — design

Date: 2026-10-07 · Branch: `feat/homepage-tracks` · Pages: `index.html`, `en/index.html`

## Decided by the owner (not reopened here)

- New `#tracks` "choose your specialty" section right after the hero, replacing `#vision`.
- Three tracks: Nephrology Stage A (live → `app.meduxa.ai/?signup=1&src=landing&pl=hero`),
  Family medicine Stage A (soon → `/family-medicine`), Pediatrics Stage A (soon → `/pediatrics`).
  Early signup = link to the bundle's own page. No new form, no DB change.
- Under the cards: "preparing for another specialty? write to us" → `hello@meduxa.ai`.
- Hero: three chips under the main CTA, each jumping to its card.
- Announcement bar: generic FM + peds "coming soon", links to `#tracks`.
- Nav: add "התמחויות" / "Specialties" → `#tracks`.
- `#pilot`: nephrology CTA kept; add a line for FM/peds → `#tracks`.
- `/en`: same cards; FM and peds marked "Hebrew content".
- Cards come from ONE data list; a new bundle = one entry.
- Analytics: Vercel `track_click` `{track}`; nephrology card uses `pl=hero` (app placement
  vocabulary is closed: nav/hero/closing).
- Keep: a11y statement promises, CSP, crawler exemption, no dependencies, no invite codes.

## Design read

Extension of an incumbent system, not a redesign. Persuade mode: the visitor's success is
"I found my exam and took the next step". The existing navy / cyan / violet language, IBM Plex
Sans Hebrew + Plex Mono, 12–20px radii and the `.motion` reveal system are the authority.
Cyan = learner data / status; violet = system acting (commit CTA). Never both on one control.

## The one data list

Runtime JS rendering would put the cards outside the served HTML (crawlers, no-JS, a layout
shift under the hero). Instead:

- `tracks.json` at the repo root — the single list. Per entry:
  `id`, `status` (`live` | `soon`), `href`, `contentLang` (`he` for a Hebrew-only bundle),
  and per-locale `{ name, stage, blurb, cta, chip }` for `he` and `en`. Optional `ctaAttrs`
  (the nephrology entry carries `data-cta="hero"` so it also counts in `cta_click`).
- `scripts/render-tracks.mjs` (plain Node, no deps) rewrites everything between marker
  comments in both pages: `<!-- tracks:cards -->…<!-- /tracks:cards -->`,
  `<!-- tracks:chips -->…`, `<!-- tracks:closing -->…`, `<!-- tracks:announce -->…`.
  `--check` exits 1 if any page differs from what the list renders (drift guard, same style
  as `check-crawler-exemption.mjs`).
- Adding a bundle: one entry in `tracks.json`, `node scripts/render-tracks.mjs`, commit both.

The announce/closing lines name the soon tracks by joining the `soon` entries' names, so they
also follow the list.

## Section `#tracks`

Placement: directly under the hero (`header[data-mq-hero]`), before `#science`. Dark ink
(`#061225`) with a 1px `#153650` top rule, so the hero's video fade lands on a calm band.

Header (no eyebrow — the heading carries itself):
- HE h2: "בחרו את ההתמחות שלכם"
- HE sub: "אותו מנוע למידה, ותוכן שנבנה בנפרד לכל בחינה. נפרולוגיה פתוחה עכשיו, ורפואת משפחה ורפואת ילדים בדרך."
- EN h2: "Choose your specialty"
- EN sub: "One learning engine, with content built separately for each board exam. Nephrology is open now; family medicine and pediatrics are on the way."

Grid: 4 columns ≥ 981px. A `live` card spans 2 columns, `soon` cards span 1, so three tracks
read as one wide open door plus two quieter ones — not three equal tiles. 2 columns at
641–980px (live spans 2 → full row, soon cards share the next row). 1 column ≤ 640px, live
first. A fourth or fifth entry flows into the same rules with no layout code change.

Card anatomy (`<article class="track" id="track-<id>">`):
1. Status line: `live` → teal pill "פתוח עכשיו" / "Open now" with a check glyph;
   `soon` → muted pill "בקרוב" / "Coming soon". On `/en`, a `contentLang: he` entry adds a
   second pill "Hebrew content". Status is text, never colour alone.
2. `h3` name ("נפרולוגיה") + stage line in mono ("שלב א" / "Stage A").
3. One-sentence blurb, reusing claims the site already makes (no new facts):
   - Nephrology: "1,000+ שאלות ברמת הבחינה, הסבר עם ציטוט מהמקור ומורה AI סוקרטי."
   - FM: "שאלות בסגנון הבחינה, הסבר עם ציטוט מהמקור ומחיר השקה לנרשמים מראש."
   - Peds: "שאלות שנבדקו בידי רופא מומחה ברפואת ילדים, הסבר עם ציטוט מהמקור ומחיר השקה לנרשמים מראש."
4. Action, pinned to the card's bottom:
   - live → violet `btn-action` "התחילו ללמוד — חינם" / "Start studying free" (same label as the
     hero/closing CTA: one label per intent).
   - soon → outline link "להרשמה מוקדמת" / "Join the early list" with a direction-aware arrow.
     On `/en` the link carries `hreflang="he"` since the target page is Hebrew.

Whole card is the hit area via a stretched link (`a::after { inset: 0 }`) — one tab stop per
card, the accessible name is the link text plus `aria-describedby` → the card's name/stage.
Focus ring on the card through `:focus-within` (violet, matching the page's focus colour).
Hover (fine pointers only): border warms toward cyan, 2px lift. Press: `scale(.98)`.

Visual weight: the live card uses the page's existing "brand card" idiom from `#compare`
(cyan top bar + cyan-tinted border + deeper shadow), on the dark `#0B2545` card surface. Soon
cards: `#081D3A` surface, `#1E4A6E` border, no shadow.

Below the grid, a single line: "מתכוננים להתמחות אחרת? <a>כתבו לנו</a>" → `mailto:hello@meduxa.ai`
("Preparing for another specialty? Write to us").

## Hero chips

Under the hero CTA row, one row: a short label ("או קפצו להתמחות:" / "Or jump to a specialty:")
then one chip per track (`href="#track-<id>"`). Live chip: teal dot-less pill with the name;
soon chips: name + "· בקרוב". Pills reuse the hero badge's cyan-wash style; ≥ 40px tall,
8px gap; they wrap on phones. They are in-page anchors (smooth scroll already on `html`;
`scroll-margin-top` covers the sticky nav).

## Announcement bar (HE only — `/en` has none today)

"בקרוב: הכנה לשלב א ברפואת משפחה וברפואת ילדים · מחיר השקה לנרשמים מראש · לפרטים" → `#tracks`.
Same gradient bar, same "בקרוב" pill.

## Nav

Replace "חזון" / "Vision" (its section is gone) with "התמחויות" / "Specialties" → `#tracks`, placed
first (it is the page's new second section). Desktop row and mobile menu both.

## `#pilot` closing

Keep heading, line and nephrology CTA. Under the CTA: "מתכוננים לרפואת משפחה או לרפואת ילדים?
<a href="#tracks">הירשמו מראש</a>" / EN equivalent.

## Analytics

One capture-phase listener, beside the existing `cta_click` one:
`a[data-track]` → `va('event', { name: 'track_click', data: { track, placement } })` where
`placement` is `card` or `chip` (`data-track-placement`). `track` is the entry `id`
(`nephrology`, `family-medicine`, `pediatrics`). The nephrology card also keeps `data-cta="hero"`
so `cta_click` stays the total landing→app measure and the app records `pl=hero`, as decided.

## Motion

Reuse the page's system: the `#tracks` h2 block gets the existing `head()` word reveal
automatically (it matches `main section h2[data-mq-h2]`); add `cards('#tracks .tracks-grid',
'rv-card', 90)`. Nothing new to gate — everything sits behind `html.motion`, which is never
set under reduced motion.

## Accessibility (statement promises)

- Section `aria-labelledby` its h2; each card an `article` with an `h3`.
- Every new link reachable by Tab, native `<a>` (no div controls).
- Contrast targets (checked in the browser after build): teal `#5EEAD4`, muted `#7DA2C4`,
  body `#9CC3DF` / `#B8D4EA` on `#0B2545` / `#081D3A` / `#061225` all ≥ 4.5:1.
- Reduced motion: no new motion outside `.motion`.
- Skip link + single `<main>` untouched.

## Must-not-change

CSP (`vercel.json`): no new origins (inline SVG only, no icon font). Crawler exemption check
re-run. No dependencies (render script is plain Node, run by hand, not by Vercel). No invite codes.

## Docs

README: page-structure table (`#vision` → `#tracks`), analytics (`track_click`), the
`tracks.json` + render workflow, pediatrics "not linked from the homepage yet" → linked.

## Verification

- `node scripts/render-tracks.mjs --check` (0), `node scripts/check-crawler-exemption.mjs`.
- `python3 -m http.server`, real browser: `/` and `/en/` at 1440 and 390 px; click every card,
  chip, nav link, announce bar, closing link, mailto; keyboard pass (Tab order, focus ring,
  Enter); reduced-motion emulation; console clean; `va` events observed via a stub.
- Vercel preview from the pushed branch, clicked once more; then ask the owner to merge.

## Review fixes (Fable review, 2026-10-07 — APPROVE-WITH-FIXES, all accepted)

1. Stretched link is `.track-link::before` on a plain, unpositioned `<a>`; the violet look sits
   on an inner `<span class="btn-action">` (`.btn-action` already owns `::after` and
   `overflow: hidden`). Press/hover are driven from `.track-link:active` / `.track:hover`.
2. `#tracks` carries `data-mq-section` (mobile padding + `scroll-margin-top`); `.track` gets its
   own `scroll-margin-top: 96px` for the chip anchors.
3. h2 + sub live in their own `.tracks-head` div so `head()` never marks the grid; the grid is a
   sibling and gets `cards()`.
4. Analytics key is `via` (`card` | `chip`), not `placement`, so it cannot be mis-joined with
   `cta_click.placement`. The nephrology card keeps `data-cta="hero"`: one click fires both
   `cta_click{hero}` and `track_click{nephrology}`, and hero button vs card are no longer
   separable in `cta_click` / the app's `pl` (owner's call). README says so; the "three start
   buttons" comments are updated.
5. Renderer: escapes text/attributes (`&` → `&amp;`); `{{…}}` in a blurb becomes
   `<span class="ltr-iso">…</span>`; `cards`/`chips`/`closing` markers are required (exit 1 if
   missing), `announce` is optional (skipped when absent — `/en` has no bar); output is LF,
   indented to the opening marker's column; `--check` is listed in README beside the crawler check.
   `tracks.json` is publicly served (no `.vercelignore`); accepted — it holds only public copy.
6. `#vision` removed from both pages' nav + mobile menu and README; sitemap, JSON-LD and the
   legal pages have no reference to it.
7. On `/en`, a Hebrew-page entry's link is `aria-describedby` both the name and the
   "Hebrew content" pill.
8. Hero chips: own hook (`data-mq-hero-tracks`), label hidden ≤ 600px, the "· בקרוב" suffix
   becomes screen-reader-only there so the row fits one line.
9. Grid `align-items: stretch`, action pinned with `margin-top: auto`; a 4th `soon` entry wraps
   to the start of row 2.
10–12. `.ltr-iso` on `1,000+` / `AI`; arrow is inline SVG mirrored by `[dir="rtl"]`; soon-link
   colour `#7DD3FC`.

## Copy pass (marketing agent + copy-editing skill, 2026-10-07)

Applied after verifying each claim against the destination pages:
- Coming-soon action is "הרשמה לעדכון" / "Get notified" (was "להרשמה מוקדמת" / "Join the early
  list"): the FM and peds pages call their form exactly that, and it is an update list, not a
  reserved place.
- Section sub: "…או השאירו מייל ונעדכן כשמסלול נוסף נפתח." (the pages' own phrasing); EN drops
  "board" ("each exam").
- Closing line names the exam: "מתכוננים לשלב א ברפואת משפחה או ברפואת ילדים? לפרטים ולהרשמה
  לעדכון" / "Preparing for Stage A in … ? Details and updates".
Flagged, not changed (pre-existing): the homepage says both "1,000+ שאלות" (hero, nephrology card)
and "אלפי שאלות" (#features, #compare).

## Campaign line above #how (owner, 2026-10-07)

A lead statement above "How it works", in the campaign's words (handoff 2026-10-07 §5/§7):
"הבחינה לא השתנתה. הדרך להתכונן אליה, כן." + "פתרון בחינות עבר מראה מה נכון. כאן מה שפספסתם
חוזר אליכם, מוסבר מהמקור, לשינון ממוקד." (EN mirrored). No named product, no deficiency claim
about others; every capability it mentions is already claimed on the page. Per the positioning
(don't compete on count), the nephrology card no longer opens with "1,000+".
