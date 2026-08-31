# design-sync notes — medboard-landing / MeduXa Landing DS

## What this sync actually is

`medboard-landing` is a plain static HTML site (`index.html` (Hebrew root) + `en/index.html`, no framework, no build, no `package.json` at repo root) — there was **no real component library to extract**. With the user's explicit sign-off, a synthetic library (`design-system/`) was authored from scratch by hand-carving the landing page's markup into 14 React components (`design-system/src/*.tsx`), so this Claude Design project could be seeded. This is fabrication, not extraction — unlike a normal design-sync target, there's no upstream source of truth to re-sync against; `design-system/` **is** the source of truth going forward.

Target project: **"MeduXa Landing"**, `projectId` in `.design-sync/config.json` — separate from the existing "MeduXa Design System" project (that one syncs the actual app, `/Users/ori/Desktop/Pilot`).

## Known render warns

None outstanding — final validate run was 14/14 clean, 0 warnings (fonts resolve via `[FONT_REMOTE]`, informational only).

## Re-sync risks

- **The two are not wired together.** If `index.html` / `en/index.html` change, `design-system/src/*.tsx` does NOT update automatically — there's no build step reading the HTML. Any future landing-page edit that should be reflected in the DS must be hand-ported into the matching component.
- **`DemoCard` is behind the shipped hero card.** The landing page's question card became interactive (per-answer tutor lines, an expandable KDIGO panel, and a one-message chat against `/api/tutor`); `DemoCard.tsx` still models only the original static shape — question, options, one tutor tip, progress bar. Its props API is still accurate for what it does render, so nothing is *wrong* in it, but a design built from this DS will not show the chat or the staging panel. Porting them is new work, not a gap-fill.
- **RTL (the Hebrew root `index.html`) was not modeled.** All 14 components are LTR-only, matching `en/index.html`. The Hebrew page mirrors the same design but was not given a `dir` prop or RTL variant — if the design agent needs to build RTL screens with this DS, that's new work, not a gap-fill.
- **Copy is illustrative, not exhaustive.** Multi-item sections (9 Science principles, 7 Features, 4 How-it-works steps) are modeled as a single reusable card component (`PrincipleCard`, `FeatureCard`, `StepCard`) with 2-3 sample instances in the authored preview — not all 9/7/4 real copy blocks. The full copy lives in `index.html` if ever needed verbatim.
- **Fonts load remotely.** IBM Plex Sans/Mono ship via a Google Fonts `@import` in `styles.css` (matching production, which loads the same family via a `<link>` in `<head>`) — not bundled locally. Any design built with this DS depends on that CDN being reachable.
- **`design-system/` toolchain**: Node v24, tsup 8.x, TypeScript 5.x — no monorepo, no workspace quirks. `npm run build` from `design-system/` is the only step before re-running the converter.
- **`.ds-sync/` is not committed** (regenerate by copying the skill's scripts again, `npm i esbuild ts-morph @types/react playwright` in it, `npx playwright install chromium`).
