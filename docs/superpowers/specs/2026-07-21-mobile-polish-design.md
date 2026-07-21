# Mobile polish pass — MeduXa landing (EN + HE)

**Date:** 2026-07-21
**Scope:** CSS-only polish for phone screens (≤600px). No redesign, no desktop changes.
**Files:** `index.html`, `he/index.html`

## Problem

Only one breakpoint exists (900px). At phone width (~375px):

- Nav row is cramped: language switch + "Get Early Access" CTA + burger ≈ 285px cluster in ~430px of space.
- Hero runs ~2 screens tall before first content section.
- Stats row wraps unevenly.
- Hero video downloads on cellular for no visual benefit (dark overlay on top).
- Section/card paddings and type sizes are desktop-scaled.

## Mechanism

Add a `@media (max-width: 600px)` block to the existing `<style>` in each file, reusing the established `data-mq-*` attribute-hook pattern. No layout restructuring. No JS changes.

One markup exception: the nav CTA gets two label spans — full and short — toggled by CSS per breakpoint.

## Changes at ≤600px

### Nav
- CTA shows short label: "Join" (EN) / "הצטרפו" (HE); full label hidden. Smaller padding/font.
- Language switch + burger unchanged. Row must fit 375px with no overlap.

### Hero
- Header padding 40px 18px 48px.
- Title 32px; subtitle 17px.
- Both hero CTA buttons full-width (stacked).
- Stats: 2×2 grid (`grid-template-columns: 1fr 1fr`), gap ~16px.
- Demo card: padding 18px; question text 16px; answer options 14px.
- `.hero-video { display: none; }` — gradient background remains (same fallback as `prefers-reduced-motion`). Saves cellular data.

### Sections
- Section padding 48px 18px.
- h2 26px; section intro paragraph 16px.
- Cards (science/features/how): padding 20px.
- Waitlist form: button full-width below input.
- Footer: stacked, centered.

### HE page
Identical rule block and CTA label spans (Hebrew short label). RTL mirrors automatically via flex/grid — no dedicated RTL rules expected.

## Verification

Browser at 375px viewport, both pages:
1. No horizontal overflow (`document.documentElement.scrollWidth` ≤ viewport).
2. Nav row fits without overlap; burger menu opens.
3. Screenshot proof of hero + sections, EN + HE.
4. Desktop (1280px) unchanged visually.

## Deploy

Commit → push publishes via Vercel. Push only after user sees verification proof.

## Out of scope

- Any desktop change.
- Restructuring hero/sections (approach B — rejected).
- App (Pilot repo) mobile work.
