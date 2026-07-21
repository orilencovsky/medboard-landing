# Mobile Polish (≤600px) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a phone-tuned `@media (max-width: 600px)` layer to the MeduXa landing page (EN + HE) so it fits and reads well at 375px, with zero desktop change.

**Architecture:** CSS-only, reusing the existing `data-mq-*` attribute-hook pattern. A new 600px block is appended immediately after the existing 900px block (later rule wins on equal specificity, since ≤600 also satisfies ≤900). A handful of new hooks are added to markup, plus one CTA label swap (full/short spans). No JS changes.

**Tech Stack:** Static HTML + inline `<style>`. No build, no framework. Deploy = Vercel auto-deploy on `git push`.

## Global Constraints

- Two files, kept in lockstep: `index.html` (EN, LTR) and `he/index.html` (HE, RTL). Every hook/CSS edit applies to both.
- Inline element styles beat media-query rules on specificity → all 600px rules use `!important` (matches the existing 900px block).
- The 600px block MUST be placed AFTER the 900px block in source order.
- Desktop (≥901px) rendering must not change.
- No JS edits. No copy changes except adding the nav CTA short-label span.
- RTL on the HE page is handled by existing `dir="rtl"` + flex/grid — no RTL-specific CSS is expected.

---

## Shared reference: the CSS block (identical in both files)

Base rule to add next to the existing `[data-mq-burger] { display: none; }` line:

```css
[data-mq-cta-short] { display: none; }
```

The new media block to append immediately after the `@media (max-width: 900px) { … }` block:

```css
@media (max-width: 600px) {
  [data-mq-nav] { padding: 0 14px !important; }
  [data-mq-navright] { gap: 10px !important; }
  [data-mq-cta] { padding: 9px 14px !important; font-size: 14px !important; gap: 6px !important; }
  [data-mq-cta] > svg { display: none !important; }
  [data-mq-cta-full] { display: none !important; }
  [data-mq-cta-short] { display: inline !important; }
  [data-mq-lang] { padding: 6px 10px !important; font-size: 13px !important; }
  [data-mq-logo] { gap: 8px !important; }
  [data-mq-logo] > svg { width: 30px !important; height: 30px !important; }
  [data-mq-logo-text] > span { font-size: 18px !important; }
  [data-mq-hero] { padding: 40px 18px 48px !important; }
  [data-mq-hero-title] { font-size: 32px !important; }
  [data-mq-hero-sub] { font-size: 17px !important; }
  [data-mq-hero-actions] { flex-direction: column !important; align-items: stretch !important; }
  [data-mq-hero-actions] > a { text-align: center !important; }
  [data-mq-stats] { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 16px !important; }
  [data-mq-demo] { padding: 18px !important; }
  [data-mq-demo-q] { font-size: 16px !important; }
  [data-mq-demo-opts] > div { font-size: 14px !important; }
  [data-mq-section] { padding: 48px 18px !important; }
  [data-mq-h2] { font-size: 26px !important; }
  [data-mq-cards] > div { padding: 20px !important; }
  [data-mq-form] { flex-direction: column !important; }
  [data-mq-form] > input, [data-mq-form] > button { width: 100% !important; min-width: 0 !important; }
  [data-mq-footer] { flex-direction: column !important; text-align: center !important; gap: 10px !important; }
}
```

Note: today the hero video is only hidden by `@media (prefers-reduced-motion: reduce)`, never by width. The spec also wants it off on phones, so add this line inside the 600px block:

```css
  .hero-video { display: none !important; }
```

(The gradient `background` on the `<header>` and the `.hero-overlay` remain, so the hero still looks intentional.)

---

## Shared reference: markup hooks (same elements in both files)

Ten hook additions per file. Exact anchor strings differ slightly EN vs HE and are given verbatim in each task.

| # | Element | Hook to add |
|---|---------|-------------|
| 1 | Nav right-side container `<div style="…gap: 26px;">` | `data-mq-navright` |
| 2 | Nav CTA `<a href="#pilot" …>` | `data-mq-cta` + wrap label text in `<span data-mq-cta-full>` / `<span data-mq-cta-short>` |
| 3 | Hero subtitle `<p>` (font-size: 20px) | `data-mq-hero-sub` |
| 4 | Hero button row `<div style="display: flex; gap: 14px; …">` | `data-mq-hero-actions` |
| 5 | Demo card inner `<div style="background: #0B2545; …padding: 26px…">` | `data-mq-demo` |
| 6 | Demo question `<div style="font-size: 18px; …">` | `data-mq-demo-q` |
| 7 | Demo options wrapper `<div style="display: flex; flex-direction: column; gap: 10px;">` | `data-mq-demo-opts` |
| 8 | Three card-grid `<div style="display: grid; …">` (science, features, how) | `data-mq-cards` (×3) |
| 9 | Waitlist `<form id="waitlistForm" …>` | `data-mq-form` |
| 10 | Footer inner `<div style="…justify-content: space-between; …">` | `data-mq-footer` |
| 11 | Nav logo cluster `<div style="display: flex; align-items: center; gap: 12px;">` | `data-mq-logo` |
| 12 | Nav wordmark `<span style="display: flex; align-items: baseline;…">` | `data-mq-logo-text` |
| 13 | Nav language switch `<a href="/he">עברית</a>` (EN) / `<a href="/?lang=en">EN</a>` (HE) | `data-mq-lang` |

A second, narrower tier was also added after testing at 320px (iPhone SE class), where the row still overflowed by 8px:

```css
@media (max-width: 350px) {
  [data-mq-logo-text] { display: none !important; }
}
```

Threshold 350px, not 380px: measured slack is 33px at 375px and 18px at 360px, reaching zero near 342px — so only SE-class widths drop the wordmark, and the logo mark still carries the brand there.

Hooks 11–13 were added after the first 375px measurement showed the nav row still overflowing by 17px: logo 164px + right cluster 214px exceeded the 347px content width. Shrinking the logo, the language pill, and dropping the CTA's decorative chevron brought the row to 314px with 33px of slack.

`data-mq-stats` already exists on the stats row — no edit needed there.

---

### Task 1: EN page (`index.html`) — hooks + CSS + verify at 375px

**Files:**
- Modify: `/Users/ori/Desktop/medboard-landing/index.html`

**Interfaces:**
- Produces: the `data-mq-*` hook names and 600px CSS block that Task 2 mirrors verbatim (only CTA short-label text differs).

- [ ] **Step 1: Add the base short-label rule**

In the `<style>` block, the line reads:

```css
  [data-mq-burger] { display: none; }
```

Replace with:

```css
  [data-mq-burger] { display: none; }
  [data-mq-cta-short] { display: none; }
```

- [ ] **Step 2: Append the 600px media block**

The 900px block ends with:

```css
    [data-mq-burger] { display: flex !important; }
  }
```

Immediately after that closing `}`, insert the full 600px block from "Shared reference: the CSS block" above, including the `.hero-video { display: none !important; }` line inside it.

- [ ] **Step 3: Hook the nav right container**

Find (the nav's right-side cluster):

```html
      <div style="display: flex; align-items: center; gap: 26px;">
        <a data-mq-hide class="nav-link" href="#science">The Science</a>
```

Add the hook to that opening `<div>`:

```html
      <div data-mq-navright style="display: flex; align-items: center; gap: 26px;">
        <a data-mq-hide class="nav-link" href="#science">The Science</a>
```

- [ ] **Step 4: Hook the nav CTA + add short label**

Find:

```html
        <a href="#pilot" style="background: linear-gradient(135deg, #0EA5E9, #22D3EE); color: #062033; border-radius: 10px; padding: 10px 22px; font-size: 15px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px;">Get Early Access<svg width="20" height="16" viewBox="0 0 32 24" fill="none" stroke="#062033" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l6 6-6 6"/><path d="M12 6l6 6-6 6"/></svg></a>
```

Replace with:

```html
        <a data-mq-cta href="#pilot" style="background: linear-gradient(135deg, #0EA5E9, #22D3EE); color: #062033; border-radius: 10px; padding: 10px 22px; font-size: 15px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px;"><span data-mq-cta-full>Get Early Access</span><span data-mq-cta-short>Join</span><svg width="20" height="16" viewBox="0 0 32 24" fill="none" stroke="#062033" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l6 6-6 6"/><path d="M12 6l6 6-6 6"/></svg></a>
```

- [ ] **Step 5: Hook the hero subtitle**

Find:

```html
        <p style="margin: 0; font-size: 20px; color: #B8D4EA; line-height: 1.65; max-width: 540px;">Active recall, spaced repetition, and a Socratic AI tutor — all grounded in the real sources your exam is written from. Built for medical residents, worldwide.</p>
```

Add `data-mq-hero-sub`:

```html
        <p data-mq-hero-sub style="margin: 0; font-size: 20px; color: #B8D4EA; line-height: 1.65; max-width: 540px;">Active recall, spaced repetition, and a Socratic AI tutor — all grounded in the real sources your exam is written from. Built for medical residents, worldwide.</p>
```

- [ ] **Step 6: Hook the hero button row**

Find (the row holding "Start studying free" + "See how it works"):

```html
        <div style="display: flex; gap: 14px; align-items: center; flex-wrap: wrap;">
          <a href="#pilot" style="background: linear-gradient(135deg, #0EA5E9, #22D3EE); color: #062033; border-radius: 12px; padding: 16px 34px; font-size: 18px; font-weight: 700; box-shadow: 0 6px 24px rgba(14,165,233,.4);">Start studying free</a>
```

Add the hook to the opening `<div>`:

```html
        <div data-mq-hero-actions style="display: flex; gap: 14px; align-items: center; flex-wrap: wrap;">
          <a href="#pilot" style="background: linear-gradient(135deg, #0EA5E9, #22D3EE); color: #062033; border-radius: 12px; padding: 16px 34px; font-size: 18px; font-weight: 700; box-shadow: 0 6px 24px rgba(14,165,233,.4);">Start studying free</a>
```

- [ ] **Step 7: Hook the demo card, question, options**

Find:

```html
        <div style="background: #0B2545; border: 1px solid #1E4A6E; border-radius: 20px; padding: 26px; box-shadow: 0 30px 80px rgba(2,8,20,.6); display: flex; flex-direction: column; gap: 18px;">
```

Add `data-mq-demo`:

```html
        <div data-mq-demo style="background: #0B2545; border: 1px solid #1E4A6E; border-radius: 20px; padding: 26px; box-shadow: 0 30px 80px rgba(2,8,20,.6); display: flex; flex-direction: column; gap: 18px;">
```

Find the question div:

```html
          <div style="font-size: 18px; font-weight: 600; color: #E2F4FD; line-height: 1.6;">A 67-year-old man with diabetic CKD undergoes coronary catheterization. Creatinine was 1.5 mg/dL before the procedure, 1.77 mg/dL two days later. Per KDIGO criteria, which is correct?</div>
```

Add `data-mq-demo-q`:

```html
          <div data-mq-demo-q style="font-size: 18px; font-weight: 600; color: #E2F4FD; line-height: 1.6;">A 67-year-old man with diabetic CKD undergoes coronary catheterization. Creatinine was 1.5 mg/dL before the procedure, 1.77 mg/dL two days later. Per KDIGO criteria, which is correct?</div>
```

Find the options wrapper (the `<div>` immediately after the question, holding the four answer rows):

```html
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="border: 1px solid #22D3EE; background: rgba(34,211,238,.08); border-radius: 10px; padding: 12px 16px; font-size: 15px; color: #67E8F9; font-weight: 600; display: flex; justify-content: space-between; align-items: center;"><span>Does not meet AKI criteria</span>
```

Add `data-mq-demo-opts` to the wrapper:

```html
          <div data-mq-demo-opts style="display: flex; flex-direction: column; gap: 10px;">
            <div style="border: 1px solid #22D3EE; background: rgba(34,211,238,.08); border-radius: 10px; padding: 12px 16px; font-size: 15px; color: #67E8F9; font-weight: 600; display: flex; justify-content: space-between; align-items: center;"><span>Does not meet AKI criteria</span>
```

- [ ] **Step 8: Hook the three card grids**

Each of the three section card grids has this exact opening tag:

```html
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
```

There are two with `minmax(300px, 1fr)` (Science `id="science"`, Features `id="features"`) and one with `minmax(250px, 1fr)` (How `id="how"`):

```html
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
```

Add `data-mq-cards` to all three. Use `replace_all` for the `minmax(300px, 1fr)` string (both occurrences take the same hook), and edit the `minmax(250px, 1fr)` one separately:

```html
    <div data-mq-cards style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
```
```html
    <div data-mq-cards style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
```

- [ ] **Step 9: Hook the waitlist form**

Find:

```html
      <form id="waitlistForm" style="display: flex; gap: 12px; width: 100%; max-width: 520px; margin-top: 8px; flex-wrap: wrap; justify-content: center;">
```

Add `data-mq-form`:

```html
      <form data-mq-form id="waitlistForm" style="display: flex; gap: 12px; width: 100%; max-width: 520px; margin-top: 8px; flex-wrap: wrap; justify-content: center;">
```

- [ ] **Step 10: Hook the footer inner div**

Find:

```html
    <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
      <span style="display: flex; align-items: baseline;"><span style="font-size: 17px; font-weight: 700; color: #7DA2C4;">MeduXa</span>
```

Add `data-mq-footer` to that `<div>`:

```html
    <div data-mq-footer style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
      <span style="display: flex; align-items: baseline;"><span style="font-size: 17px; font-weight: 700; color: #7DA2C4;">MeduXa</span>
```

- [ ] **Step 11: Verify at 375px in the browser**

Open the local file at mobile width and assert. Serve/navigate to the EN page (via preview browser), resize to 375×812, then run:

```js
(() => {
  const r = {};
  r.docScrollW = document.documentElement.scrollWidth;      // expect <= 376
  r.navInnerOverflow = (() => { const n = document.querySelector('[data-mq-nav]'); return n.scrollWidth - n.clientWidth; })(); // expect <= 0
  r.ctaFull = getComputedStyle(document.querySelector('[data-mq-cta-full]')).display;   // expect 'none'
  r.ctaShort = getComputedStyle(document.querySelector('[data-mq-cta-short]')).display; // expect 'inline'
  r.statsDisplay = getComputedStyle(document.querySelector('[data-mq-stats]')).display; // expect 'grid'
  r.statsCols = getComputedStyle(document.querySelector('[data-mq-stats]')).gridTemplateColumns; // expect two tracks
  r.video = getComputedStyle(document.querySelector('.hero-video')).display;            // expect 'none'
  r.heroActions = getComputedStyle(document.querySelector('[data-mq-hero-actions]')).flexDirection; // expect 'column'
  r.formDir = getComputedStyle(document.querySelector('[data-mq-form]')).flexDirection; // expect 'column'
  return r;
})()
```

Expected:
- `docScrollW` ≤ 376 (no horizontal scroll)
- `navInnerOverflow` ≤ 0 (nav row fits)
- `ctaFull` = `"none"`, `ctaShort` = `"inline"`
- `statsDisplay` = `"grid"`, `statsCols` = two width tracks
- `video` = `"none"`
- `heroActions` = `"column"`, `formDir` = `"column"`

If any assertion fails, fix the corresponding hook/CSS and re-run before committing.

- [ ] **Step 12: Screenshot proof (hero + one section) at 375px**

Take a mobile screenshot of the hero, and one scrolled to the Science/Features cards. Keep for the final proof step.

- [ ] **Step 13: Commit**

```bash
cd /Users/ori/Desktop/medboard-landing
git add index.html
git commit -m "feat(landing): phone-tuned <=600px layout (EN)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: HE page (`he/index.html`) — mirror hooks + CSS + verify at 375px (RTL)

**Files:**
- Modify: `/Users/ori/Desktop/medboard-landing/he/index.html`

**Interfaces:**
- Consumes: the exact hook names and CSS block from Task 1. Only the CTA short-label text differs (`הצטרפו` instead of `Join`).

- [ ] **Step 1: Add the base short-label rule** — identical edit to Task 1 Step 1 (same two CSS lines).

- [ ] **Step 2: Append the 600px media block** — identical to Task 1 Step 2 (same CSS block, including `.hero-video { display: none !important; }`).

- [ ] **Step 3: Hook the nav right container**

Find:

```html
      <div style="display: flex; align-items: center; gap: 26px;">
        <a data-mq-hide class="nav-link" href="#science">מדע הלמידה</a>
```

Add `data-mq-navright` to the `<div>`.

- [ ] **Step 4: Hook the nav CTA + add short label**

Find:

```html
        <a href="#pilot" style="background: linear-gradient(135deg, #0EA5E9, #22D3EE); color: #062033; border-radius: 10px; padding: 10px 22px; font-size: 15px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px;">גישה מוקדמת<svg width="20" height="16" viewBox="0 0 32 24" fill="none" stroke="#062033" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6l-6 6 6 6"/><path d="M28 6l-6 6 6 6"/></svg></a>
```

Replace with:

```html
        <a data-mq-cta href="#pilot" style="background: linear-gradient(135deg, #0EA5E9, #22D3EE); color: #062033; border-radius: 10px; padding: 10px 22px; font-size: 15px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px;"><span data-mq-cta-full>גישה מוקדמת</span><span data-mq-cta-short>הצטרפו</span><svg width="20" height="16" viewBox="0 0 32 24" fill="none" stroke="#062033" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6l-6 6 6 6"/><path d="M28 6l-6 6 6 6"/></svg></a>
```

- [ ] **Step 5: Hook the hero subtitle**

Find the `<p style="margin: 0; font-size: 20px; color: #B8D4EA; …">היזכרות פעילה…</p>` and add `data-mq-hero-sub`.

- [ ] **Step 6: Hook the hero button row**

Find the `<div style="display: flex; gap: 14px; align-items: center; flex-wrap: wrap;">` holding `התחילו ללמוד — חינם` and add `data-mq-hero-actions`.

- [ ] **Step 7: Hook the demo card, question, options**

- Card: `<div style="background: #0B2545; border: 1px solid #1E4A6E; border-radius: 20px; padding: 26px; …">` → add `data-mq-demo`.
- Question: `<div style="font-size: 18px; font-weight: 600; color: #E2F4FD; line-height: 1.6;">בן 67…</div>` → add `data-mq-demo-q`.
- Options wrapper: the `<div style="display: flex; flex-direction: column; gap: 10px;">` immediately after the question → add `data-mq-demo-opts`.

- [ ] **Step 8: Hook the three card grids**

Same as Task 1 Step 8: two `minmax(300px, 1fr)` grids (Science, Features) via `replace_all`, one `minmax(250px, 1fr)` grid (How) separately. Add `data-mq-cards` to each.

- [ ] **Step 9: Hook the waitlist form**

Find `<form id="waitlistForm" style="display: flex; gap: 12px; width: 100%; max-width: 520px; …">` and add `data-mq-form`.

- [ ] **Step 10: Hook the footer inner div**

Find `<div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">` (with `direction: ltr` span inside) and add `data-mq-footer`.

- [ ] **Step 11: Verify at 375px (RTL)**

Navigate to the HE page, resize to 375×812, run the same JS assertion block from Task 1 Step 11. Same expected values. Additionally confirm the page is RTL:

```js
getComputedStyle(document.body.querySelector('div[dir="rtl"]')).direction // expect 'rtl'
```

- [ ] **Step 12: Screenshot proof (hero + one section) at 375px, RTL.**

- [ ] **Step 13: Commit**

```bash
cd /Users/ori/Desktop/medboard-landing
git add he/index.html
git commit -m "feat(landing): phone-tuned <=600px layout (HE/RTL)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Desktop regression check + proof + gated deploy

**Files:** none modified (verification + push only).

- [ ] **Step 1: Confirm desktop unchanged (EN)**

Resize browser to 1280×800, load EN page. Assert desktop values are untouched:

```js
(() => ({
  ctaFull: getComputedStyle(document.querySelector('[data-mq-cta-full]')).display,   // expect 'inline'
  ctaShort: getComputedStyle(document.querySelector('[data-mq-cta-short]')).display, // expect 'none'
  statsDisplay: getComputedStyle(document.querySelector('[data-mq-stats]')).display, // expect 'flex'
  video: getComputedStyle(document.querySelector('.hero-video')).display,            // expect 'block'
  navLinks: getComputedStyle(document.querySelector('[data-mq-hide]')).display,      // expect not 'none'
  h1: getComputedStyle(document.querySelector('[data-mq-hero-title]')).fontSize      // expect '54px'
}))()
```

Expected: full CTA shown / short hidden, stats `flex`, video `block`, nav links visible, h1 `54px`.

- [ ] **Step 2: Confirm desktop unchanged (HE)** — repeat Step 1 on the HE page (nav links visible, video block, stats flex).

- [ ] **Step 3: Present proof to the user**

Post the 375px screenshots (EN + HE hero + a section) and the desktop-unchanged assertion results. **Do not push yet** — wait for the user's OK (per spec: push only after they see proof).

- [ ] **Step 4: Deploy on approval**

```bash
cd /Users/ori/Desktop/medboard-landing
git push
```

Then, per the user's standing preference, show a bullet-point changelog of what shipped.

---

## Addendum: hero video restored on phones (post-launch follow-up)

The original spec hid `.hero-video` on phones to save cellular data. After
shipping, the user asked whether a mobile-tuned video could run instead of
being hidden entirely. Investigated and built:

- The source footage (abstract flowing gradients, no hard edges/text)
  compresses extremely well: an 800px-wide encode came out at **214KB
  (mp4) / 178KB (webm)** — under 5% of the desktop file's 4.4MB — with no
  visible quality loss given the page's own 82–88% dark overlay.
- Added `hero-mobile.mp4` / `hero-mobile.webm` (800px wide, crf 26/34) and
  regenerated `hero.webm` (1600px, crf 40, 307KB) — the desktop webm the
  prep script always generated but was never committed, so the page fell
  back to the 4.4MB mp4 for every browser including webm-capable ones.
- Wired via native `<source media="(max-width: 600px)">` inside both
  `<video>` elements (webm before mp4 in each tier, mobile tier before
  desktop tier) — the browser fetches exactly one file, no JS needed, no
  double-download race. Removed the `.hero-video { display: none }` rule
  from the 600px block.
- `scripts/prep-hero-video.sh` now generates all four outputs from one
  raw clip, so future clip swaps can't silently drop the webm pair again.

**Verified** via `performance.clearResourceTimings()` + reload (immune to
the browser pane's cross-navigation network-log accumulation that a plain
network-request read would double-count): at 375px both EN and HE fetch
only `hero-mobile.webm`; at 1280px both fetch only `hero.webm` (a bonus —
desktop dropped from 4.4MB to 307KB too, since the missing webm is now
present). `videoWidth`/`videoHeight` on the mobile fetch read 800×450,
confirming the mobile file is what actually decoded, not a fallback.

## Self-Review

**Spec coverage:**
- Nav short CTA + fit → T1/T2 Steps 3–4, CSS `[data-mq-cta*]`, `[data-mq-navright]`. ✓
- Hero padding/title/subtitle/CTA full-width/stats 2×2/demo card → T1/T2 Steps 5–7, CSS. ✓
- Video hidden on phones → CSS `.hero-video { display: none !important; }`. ✓
- Sections padding/h2/cards/form/footer → T1/T2 Steps 8–10, CSS. ✓
- HE mirror → Task 2. ✓
- Verification (no overflow, nav fits, EN+HE, desktop unchanged, screenshots) → T1 S11–12, T2 S11–12, T3. ✓
- Deploy gated on proof → T3 S3–4. ✓

**Placeholder scan:** none — all edits give verbatim before/after strings and concrete CSS.

**Type consistency:** hook names identical across CSS block, hook table, and all edit steps (`data-mq-navright`, `-cta`, `-cta-full`, `-cta-short`, `-hero-sub`, `-hero-actions`, `-demo`, `-demo-q`, `-demo-opts`, `-cards`, `-form`, `-footer`; reused existing `-nav`, `-hero`, `-hero-title`, `-h2`, `-section`, `-stats`). ✓
