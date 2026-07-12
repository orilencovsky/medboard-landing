# Deploy medboard-landing as standalone marketing site

**Status:** Approved · **Date:** 2026-07-12 · **Owner:** Ori

## Problem

`medboard-landing` currently holds 4 preview variants (A/B × en/he) behind a picker
`index.html`, meant for design review only. Option A (Clean & Clinical) was chosen for
both languages. The repo needs restructuring into an actual deployable static site,
pointed at the live Pilot app, and shipped to Vercel on its default subdomain.

## Scope

**In scope:**
- Restructure into `index.html` (EN, root) + `he/index.html` (HE).
- Update the 3 CTA `href="#"` anchors in each file to
  `https://pilot-rust-nine.vercel.app/`.
- Add a language-switcher nav link between the two pages.
- Add `vercel.json` with `cleanUrls: true`.
- Delete `landing-b.html`, `landing-b-he.html`, and the old picker `index.html`.
- Deploy to Vercel's default subdomain (no custom domain yet).

**Out of scope:**
- Custom domain purchase/setup — follow-up once a domain is bought.
- Any framework/build step — plain static HTML, no Vite/Next needed for 2 pages.
- Waitlist/email capture — CTAs link straight to the live app, not a form.

## File structure

```
medboard-landing/
├── index.html          # was landing-a.html (EN, site root)
├── he/
│   └── index.html      # was landing-a-he.html
└── vercel.json          # new
```

`git mv` used for the renames to preserve file history.

## CTA links

In both files, the 3 CTA anchors currently `href="#"`:
- Nav bar: "Get Early Access →" / "← הצטרפו עכשיו"
- Hero: "Start studying free →" / "← התחל ללמוד בחינם"
- Bottom: "Get early access — it's free →" / "← גישה מוקדמת — בחינם"

All 3 become `href="https://pilot-rust-nine.vercel.app/"`.

In-page anchors (`#features`, `#how`, `#pilot`) and `nav-logo` (`href="#"`, scrolls to
top) are unchanged.

## Language switcher

One small nav link added to each page's nav bar, pointing to the other language:
- EN nav gains: `<a href="/he/">עברית</a>`
- HE nav gains: `<a href="/">English</a>`

## Deploy config

`vercel.json`:
```json
{ "cleanUrls": true }
```

Makes `/he/index.html` reachable as `/he` (Vercel strips `.html` and `index`).

## Testing

- Open both pages locally (static file server) after edits: confirm all CTA links
  point to the Pilot app, language switcher links work both directions, no broken
  in-page anchors.
- After `vercel deploy`, hit the live root and `/he` path, confirm `cleanUrls`
  routing works as expected.
