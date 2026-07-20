# MeduXa Landing Redesign — Design Spec

**Date:** 2026-07-20
**Repo:** `medboard-landing` (static HTML on Vercel, `cleanUrls: true`)
**Design source of truth:** Claude Design handoff bundle (`design_handoff_meduxa_landing/`), extracted to scratchpad. Files: `Meduxa Landing v2.dc.html` (Hebrew RTL, primary), `Meduxa Landing EN.dc.html` (English LTR), `Meduxa Design System.dc.html`, `README.md` (tokens + section spec).

## Goal

Rebrand and visually rebuild the bilingual marketing landing page from **MedBoard IL** to **MeduXa.ai**, pixel-faithful to the handoff design (hifi: colors, type, spacing, copy final), on the newly purchased apex domain **meduxa.ai**.

## Scope

**In:** the two landing pages (`index.html` EN, `he/index.html` HE), SEO/meta/OG assets, sitemap/robots, favicon, OG image.
**Out (later phases):** in-app rebrand (`Meduxa App Screens.dc.html`, 20+ screens in the Pilot repo), `app.meduxa.ai` subdomain move, GA property rename.

## Approach (chosen)

Rewrite the existing static HTML pages in place, preserving the repo's working infrastructure (GA4 tag, hreflang graph, Hebrew auto-route script, Vercel config). No framework migration — repo is two static files served by Vercel; the design bundle's markup + inline styles are the spec, its template runtime (`support.js`, `{{ }}` holes) is ignored per README.

Rejected alternatives: (a) Next.js rewrite — overkill for 2 static pages, new build pipeline, no benefit; (b) copying the `.dc.html` files verbatim — they carry a proprietary runtime and template holes, not production markup.

## Key decisions

1. **Domain:** canonical = apex `https://meduxa.ai`. All canonical/hreflang/OG/sitemap/JSON-LD URLs switch from `medboard-landing.vercel.app` to `meduxa.ai` (`/` EN, `/he` HE). User attaches the domain to the Vercel project manually (dashboard → Domains); old `.vercel.app` URL keeps working and redirects once attached.
2. **GA4:** keep existing tag `G-EBPKT4TS21` on both pages (historic continuity; property rename in GA UI is cosmetic, user-side, later).
3. **CTA ≠ email waitlist.** The design's pilot-CTA email form assumed pre-launch. The product is live (pilot launched 2026-09-08 target, funnel active). All CTAs remain **direct links to the app** (`https://pilot-rust-nine.vercel.app/`) styled as the design's gradient buttons; the email-form section is realized as the design's CTA section with a button instead of an input+submit. `sent` state from the design therefore drops out. When the app later moves to `app.meduxa.ai`, only the href changes.
4. **Language routing:** keep the existing `localStorage` auto-route script (`mbil_lang` key stays — renaming would forget returning visitors' explicit English choice), keep `?lang=en` escape hatch. Language toggle chips link `/` ↔ `/he` per design.
5. **Brand assets:**
   - Favicon: replace the 🩺 emoji favicon with the MeduXa logo mark (inline SVG data-URI — rounded square `rx:22` fill `#0B2545` stroke `#22D3EE`, two crossing curves with glowing X-point), taken from the design files.
   - OG image (`og-image.png`, 1200×630): regenerate in MeduXa branding (dark ink `#061225` bg, logo mark, `MeduXa` wordmark + `.ai` mono cyan, tagline). Rendered via headless screenshot of a purpose-built HTML frame (same technique as the current one).
   - Wordmark always LTR, even on the Hebrew page.

## Page structure (both locales, per README §Screens)

Nav (sticky, blur, 68px; hamburger ≤900px) → Hero (2-col, status pill, gradient-clipped h1 line, 4 mono stats, decorative curves SVG, product demo card with Q-0142·AKI question + AI-tutor panel + 68% progress) → The Science (9 principle cards) → Features (7 cards) → How it works (4 steps) → Vision (dark band, quote, 2 status pills) → CTA (72px logo, heading, gradient button → app) → Footer (`#04101E`).

Design tokens (colors, type scale, radii, shadows, 900px breakpoint) exactly per handoff README — IBM Plex Sans / Sans Hebrew / Mono via Google Fonts.

Interactions: smooth-scroll anchors, nav hover cyan, status-dot pulse keyframes, hamburger `menuOpen` toggle (vanilla JS, no framework).

## SEO / meta

- `<title>`/description/OG/Twitter copy rebranded to MeduXa.ai (EN + HE variants), OG locale tags kept.
- JSON-LD `SoftwareApplication` updated: name MeduXa.ai, url meduxa.ai.
- `sitemap.xml` + `robots.txt` URLs → meduxa.ai.
- hreflang pairs preserved on both pages.

## Files touched

| File | Change |
|---|---|
| `index.html` | full rewrite (EN page, new design) |
| `he/index.html` | full rewrite (HE RTL page, new design) |
| `og-image.png` | regenerated, MeduXa brand |
| `sitemap.xml` | domain swap |
| `robots.txt` | domain swap (sitemap line) |
| `vercel.json` | unchanged (`cleanUrls`) |

## Testing

- Local preview both pages (desktop + 375px mobile): nav/hamburger, anchors, RTL mirroring, fonts, demo-card fidelity vs design file.
- Validate: single h1 per page, hreflang symmetry, GA tag present, all hrefs resolve, no leftover "MedBoard" strings (`grep -ri medboard` clean except historical docs/).
- Lighthouse sanity on preview (no console errors, images sized).

## Manual user steps (outside code)

1. Vercel → medboard-landing project → Settings → Domains → add `meduxa.ai` (+ optional `www` redirect) → copy DNS records to registrar.
2. (Optional, later) rename GA4 property display name to MeduXa.
