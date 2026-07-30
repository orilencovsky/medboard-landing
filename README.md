# MeduXa.ai — marketing site

The public landing site for **[MeduXa.ai](https://meduxa.ai)** — a source-grounded, AI-powered
platform for medical board exam prep. This repo is the marketing site only; the product itself
lives in a separate private repo and is served from `app.meduxa.ai`.

| | |
|---|---|
| **Live (EN)** | https://meduxa.ai |
| **Live (HE)** | https://meduxa.ai/he |
| **Host** | Vercel (static, `cleanUrls: true`) |
| **Product** | Nephrology Stage A board prep — pilot launch September 8, 2026 |

> The repo is still named `medboard-landing` after the product's former name, **MedBoard IL**.
> The product rebranded to **MeduXa** in July 2026; the repo name is historical.

## What's here

```
index.html               English landing page (single file: markup + inline CSS + inline JS)
he/index.html            Hebrew / RTL landing page — a full translation, not a wrapper
hero.mp4 / hero.webm             Desktop hero video
hero-mobile.mp4 / hero-mobile.webm   Phone hero video (<=600px)
og-image.png             Open Graph / Twitter card image
robots.txt, sitemap.xml  Indexing — this site is the only indexed MeduXa surface
vercel.json              Vercel config (cleanUrls)
scripts/prep-hero-video.sh   ffmpeg pipeline that produces the four hero video files
docs/hero-video-prompt.md    The generation prompt behind the hero footage
```

There is **no build step and no dependencies** — the pages are hand-authored static HTML with
inline styles and inline scripts. Open `index.html` in a browser, or serve the directory:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000/ (EN) and http://localhost:8000/he/ (HE).

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

## Waitlist

The signup form posts straight into the product's Supabase `waitlist` table using the **publishable**
key, insert-only — row-level security blocks reads, so the embedded key exposes nothing. Each row
records the submitting page's locale (`en` / `he`).

## Hero video

The hero uses two tiers, picked by `<source media="(max-width: 600px)">`, with WebM before MP4 in
each tier. To regenerate them from a raw clip:

```bash
./scripts/prep-hero-video.sh path/to/raw-clip.mp4
```

The script strips audio, scales to 1600px (desktop) and 800px (phone), and targets roughly
"desktop pair under 5 MB, mobile pair under 1 MB". It needs `ffmpeg` (`brew install ffmpeg`).

## Editing conventions

- **Both languages, every time.** `index.html` and `he/index.html` are independent files. A copy or
  layout change made in one must be mirrored in the other, or the two drift.
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
