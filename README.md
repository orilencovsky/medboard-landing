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

## Waitlist

The signup form posts straight into the product's Supabase `waitlist` table using the **publishable**
key, insert-only — row-level security blocks reads, so the embedded key exposes nothing. Each row
records the submitting page's locale (`en` / `he`).

## Hero demo card and the AI tutor

The question card beside the hero copy is interactive. The visitor picks one of the four answers
and gets the Socratic line written for *that* option (`data-tutor` on each `.qopt`); an expandable
panel lists the full KDIGO staging criteria. From there they may send **one** message to a live
tutor — by picking one of the suggested chips or by typing — which posts to `/api/tutor`.

`api/tutor.js` holds the system prompt server-side, so the endpoint cannot be driven as a
general-purpose chat. It needs `ANTHROPIC_API_KEY` set in **Vercel → Project → Settings →
Environment Variables** (Production + Preview); without it the endpoint answers `503`
`not_configured` and the card shows its "connection dropped" message. Spend is bounded on four
layers:

| Layer | Limit |
|---|---|
| Client | 1 message per visitor per answer (`MAX_MESSAGES`) |
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

GA4 is wired inline on both pages, sharing the property used by the app so landing → signup can be
followed end to end.

## License

Private project. All rights reserved.
