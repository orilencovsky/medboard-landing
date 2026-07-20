# MeduXa Landing Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the bilingual (HE/EN) marketing landing page in the new MeduXa.ai brand, pixel-faithful to the Claude Design handoff, on the apex domain meduxa.ai.

**Architecture:** Two static HTML files served by Vercel (`cleanUrls`). Each file is a full rewrite that adapts the design handoff markup (the visual source of truth) into production HTML — stripping the design's proprietary template runtime, inlining its data-driven card lists as static markup, converting its `style-hover`/`style-focus` pseudo-attributes to real CSS, and adding a real `<head>` that preserves the site's working infrastructure (GA4, Hebrew auto-route, hreflang graph) with all brand/URL strings rebranded to MeduXa.ai / meduxa.ai. One deliberate deviation from the design: the pilot section's email waitlist form becomes a direct link to the live app (product is launched, not pre-launch).

**Tech Stack:** Static HTML + inline CSS, vanilla JS (hamburger toggle), Google Fonts (IBM Plex Sans / Sans Hebrew / Mono), Vercel hosting, GA4. OG image rasterized via the Pilot repo's `sharp`.

## Global Constraints

- **Design source of truth (read-only reference):** `/private/tmp/claude-501/-Users-ori-Claude/df38788b-8a1f-46a0-8c46-ed882c24a9bb/scratchpad/medboard-design/design_handoff_meduxa_landing/` — `Meduxa Landing EN.dc.html` (EN, LTR), `Meduxa Landing v2.dc.html` (HE, RTL). Fidelity is **hifi**: colors, type, spacing, copy are final — reproduce exactly.
- **Repo:** `/Users/ori/Desktop/medboard-landing` (git, branch `main`).
- **Canonical domain:** apex `https://meduxa.ai` (EN root `/`, HE `/he`). Replace every occurrence of `medboard-landing.vercel.app` with `meduxa.ai`.
- **App URL (all primary CTAs):** `https://pilot-rust-nine.vercel.app/` — referenced below as `APP_URL`. Single constant; when the app later moves to `app.meduxa.ai`, only this string changes.
- **GA4 tag:** keep `G-EBPKT4TS21` verbatim on both pages.
- **localStorage key:** keep `mbil_lang` verbatim (renaming forgets returning visitors' language choice).
- **Brand strings:** wordmark is always `MeduXa` + `.ai` (capital M, capital X), rendered LTR even on the HE page. No "MedBoard" / "MedBoard IL" strings may remain in either page (historical `docs/` untouched).
- **Fonts:** HE page `'IBM Plex Sans Hebrew'`; EN page `'IBM Plex Sans'`; data/IDs/citations `'IBM Plex Mono'` (always LTR). Google Fonts `<link>` per design `<helmet>`.
- **Responsive breakpoint:** single `@media (max-width: 900px)` block, copied verbatim from design `<helmet>` `<style>`.
- **Transform rules (design → production), applied in every page rewrite:**
  - **T1** Delete the design runtime: `<x-dc>`, `<helmet>` wrapper tags, `<script src="./support.js">`, and the `<script type="text/x-dc" data-dc-script>` block. Keep the *contents* of `<helmet>` (font `<link>`s + `<style>`), relocated into the real `<head>`.
  - **T2** Expand each `sc-for` into static repeated markup using the data arrays from the design's script block (9 principles, 7 features, 4 steps) — one hardcoded card per item, same inline styles as the loop template.
  - **T3** Replace the `sc-if menuOpen` mobile menu with an always-rendered `<div id="mobileMenu" style="display:none; ...">` (same inner styles), toggled by JS.
  - **T4** Convert `style-hover="…"` / `style-focus="…"` pseudo-attributes to real CSS: give nav links `class="nav-link"`, mobile-menu links `class="m-link"` (move their color/size/weight out of inline `style` into those classes so `:hover` can win), and add the `:hover` rules to the page `<style>`.
  - **T5** Wire links per the **Link map** below.
  - **T6** Replace the pilot `<form>` (input + submit) with a single anchor button → `APP_URL`.

- **Link map (both locales):**
  | Element | href |
  |---|---|
  | Nav anchor links (The Science / Features / How it works / Vision) | `#science` `#features` `#how` `#vision` |
  | Nav CTA ("Get Early Access →" / "גישה מוקדמת ←") | `APP_URL` |
  | Hero primary ("Start studying free" / "התחילו ללמוד — חינם") | `APP_URL` |
  | Hero secondary ("See how it works" / "איך זה עובד") | `#how` |
  | Mobile-menu links | same anchors as nav; each also runs `closeMenu()` on click |
  | Language toggle — **EN page** ("עברית") | `/he` |
  | Language toggle — **HE page** ("EN") | `/?lang=en` (the `?lang=en` sets the English preference so the root auto-route does not bounce back to `/he`) |
  | Pilot CTA button | `APP_URL` |
  | Footer | no links |

---

### Task 1: English page (`index.html`) full rewrite

**Files:**
- Modify (full rewrite): `/Users/ori/Desktop/medboard-landing/index.html`
- Reference (read-only): design `Meduxa Landing EN.dc.html`

**Interfaces:**
- Produces: the canonical EN page at `/`. Later tasks (sitemap, OG) rely on `<link rel="canonical" href="https://meduxa.ai/">` and `og:image` `https://meduxa.ai/og-image.png` being present here.

- [ ] **Step 1: Write `<head>`** — real `<head>` (not `<helmet>`) containing, in order:
  1. `<meta charset="UTF-8">`
  2. **Auto-route script, verbatim from the current file** (preserves returning-visitor routing):
     ```html
     <script>
       (function () {
         try {
           var p = new URLSearchParams(location.search);
           if (p.get('lang') === 'en') { localStorage.setItem('mbil_lang', 'en'); return; }
           if (localStorage.getItem('mbil_lang') === 'en') return;
           if ((navigator.language || '').toLowerCase().indexOf('he') === 0) location.replace('/he');
         } catch (e) {}
       })();
     </script>
     ```
  3. GA4 block (verbatim, tag `G-EBPKT4TS21`).
  4. `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
  5. `<title>MeduXa.ai — The smarter way to prepare for medical boards</title>`
  6. Canonical + hreflang:
     ```html
     <link rel="canonical" href="https://meduxa.ai/" />
     <link rel="alternate" hreflang="en" href="https://meduxa.ai/" />
     <link rel="alternate" hreflang="he" href="https://meduxa.ai/he" />
     <link rel="alternate" hreflang="x-default" href="https://meduxa.ai/" />
     ```
  7. `<meta name="description" content="Active recall, spaced repetition, and a Socratic AI tutor — all grounded in the real sources your medical board exam is written from. Built for residents." />`
  8. `<meta name="robots" content="index, follow" />`
  9. `<meta name="theme-color" content="#061225" />`
  10. Favicon (MeduXa logo mark, URL-encoded SVG data-URI):
      ```html
      <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect x='2' y='2' width='92' height='92' rx='22' fill='%230B2545'/%3E%3Crect x='2' y='2' width='92' height='92' rx='22' fill='none' stroke='%2322D3EE' stroke-width='3'/%3E%3Cpath d='M18 22 C 30 26, 40 36, 48 48 C 56 60, 66 70, 78 74' stroke='%231E4A6E' stroke-width='6' stroke-linecap='round' fill='none'/%3E%3Cpath d='M18 74 C 30 70, 40 60, 48 48 C 56 36, 66 26, 78 22' stroke='%2338BDF8' stroke-width='7' stroke-linecap='round' fill='none'/%3E%3Ccircle cx='48' cy='48' r='9' fill='%2322D3EE'/%3E%3C/svg%3E" />
      ```
  11. Open Graph + Twitter, rebranded:
      ```html
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="MeduXa.ai" />
      <meta property="og:title" content="MeduXa.ai — The smarter way to prepare for medical boards" />
      <meta property="og:description" content="Active recall, spaced repetition, and a Socratic AI tutor — grounded in the real sources your board exam is written from." />
      <meta property="og:url" content="https://meduxa.ai/" />
      <meta property="og:image" content="https://meduxa.ai/og-image.png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:locale:alternate" content="he_IL" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="MeduXa.ai — The smarter way to prepare for medical boards" />
      <meta name="twitter:description" content="Active recall, spaced repetition, and a Socratic AI tutor — grounded in the real sources your board exam is written from." />
      <meta name="twitter:image" content="https://meduxa.ai/og-image.png" />
      ```
  12. JSON-LD (rebranded):
      ```html
      <script type="application/ld+json">
      {"@context":"https://schema.org","@type":"SoftwareApplication","name":"MeduXa.ai","applicationCategory":"EducationalApplication","operatingSystem":"Web","url":"https://meduxa.ai/","inLanguage":["en","he"],"offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}}
      </script>
      ```
  13. Fonts + `<style>` from the design `<helmet>` (EN font stack), **plus** appended CSS:
      ```css
      html { scroll-behavior: smooth; }
      header[data-mq-hero], section[data-mq-section] { scroll-margin-top: 80px; }
      .nav-link { color:#B8D4EA; font-size:15px; font-weight:500; transition:color .15s; }
      .nav-link:hover { color:#22D3EE; }
      .m-link { color:#B8D4EA; font-size:17px; font-weight:500; padding:12px 8px; border-radius:8px; transition:color .15s,background .15s; }
      .m-link:hover { color:#22D3EE; background:rgba(34,211,238,.06); }
      ```
  Set `<html lang="en">`; the page wrapper `<div>` keeps `dir="ltr"`.

- [ ] **Step 2: Write `<body>`** — copy the design EN markup (lines 31–217 of `Meduxa Landing EN.dc.html`) applying transforms **T2–T6**:
  - Nav: give the four desktop anchor links `class="nav-link"` (remove their inline `color/font-size/font-weight`, drop `style-hover`). CTA anchor → `APP_URL`. Burger `onClick="{{ toggleMenu }}"` → `onclick="toggleMenu()"`. Mobile menu: replace the `sc-if` with `<div id="mobileMenu" style="display:none; background:rgba(6,18,37,.98); border-bottom:1px solid rgba(34,211,238,.15); flex-direction:column; padding:12px 24px 20px; gap:4px;">` containing the four links with `class="m-link"` and `onclick="closeMenu()"` (keep their anchors).
  - Hero: primary CTA → `APP_URL`; secondary → `#how`. Everything else verbatim (status pill, gradient-clip h1, 4 mono stats, decorative curves SVG, product demo card).
  - Science / Features / How: expand the three `sc-for` loops into static cards using the EN `principles` (9), `features` (7), `steps` (4) arrays from the design script block (copy each `num`/`title`/`desc` exactly).
  - Vision: verbatim.
  - Pilot (T6): replace the `<form>…</form>` with:
    ```html
    <a href="https://pilot-rust-nine.vercel.app/" style="background: linear-gradient(135deg, #0EA5E9, #22D3EE); color: #062033; border-radius: 12px; padding: 16px 40px; font-size: 18px; font-weight: 700; box-shadow: 0 6px 24px rgba(14,165,233,.4); margin-top: 8px;">Get early access — it's free →</a>
    ```
    Keep the mono sub-caption `free early access · no spam`.
  - Footer: verbatim.

- [ ] **Step 3: Append inline JS** before `</body>`:
  ```html
  <script>
    function toggleMenu(){var m=document.getElementById('mobileMenu');m.style.display=(m.style.display==='none'||!m.style.display)?'flex':'none';}
    function closeMenu(){document.getElementById('mobileMenu').style.display='none';}
  </script>
  ```

- [ ] **Step 4: Validate structure.** Run from repo root:
  ```bash
  cd /Users/ori/Desktop/medboard-landing
  grep -c "<h1" index.html                 # expect 1
  grep -ci "medboard" index.html           # expect 0
  grep -c "medboard-landing.vercel.app" index.html   # expect 0
  grep -c "G-EBPKT4TS21" index.html        # expect >=1
  grep -c "meduxa.ai" index.html           # expect >=6
  grep -c "pilot-rust-nine.vercel.app" index.html    # expect 4 (nav CTA, hero primary, pilot button — plus any)
  grep -c "sc-for\|sc-if\|x-dc\|support.js\|{{" index.html   # expect 0
  ```
  Expected: h1 = 1, medboard = 0, old domain = 0, GA present, meduxa ≥6, no template runtime left.

- [ ] **Step 5: Browser check.** Start a static server + preview:
  ```bash
  cd /Users/ori/Desktop/medboard-landing && python3 -m http.server 4599 >/dev/null 2>&1 &
  ```
  Open `http://localhost:4599/` in the Browser pane. Verify: fonts load, hero gradient + gradient-clipped headline, demo card matches design, 9/7/4 cards render, no console errors (`read_console_messages`). Resize to 375px: desktop links hidden, burger visible; click burger → mobile menu opens; click a link → menu closes and scrolls. Screenshot desktop + mobile.

- [ ] **Step 6: Commit.**
  ```bash
  cd /Users/ori/Desktop/medboard-landing
  git add index.html
  git commit -m "Rebrand EN landing to MeduXa.ai design"
  ```

---

### Task 2: Hebrew page (`he/index.html`) full rewrite

**Files:**
- Modify (full rewrite): `/Users/ori/Desktop/medboard-landing/he/index.html`
- Reference (read-only): design `Meduxa Landing v2.dc.html`

**Interfaces:**
- Consumes: same `APP_URL`, GA tag, transform rules, and `.nav-link`/`.m-link`/`#mobileMenu`/`toggleMenu`/`closeMenu` conventions as Task 1.
- Produces: the canonical HE page at `/he`.

- [ ] **Step 1: Write `<head>`** — `<html lang="he" dir="rtl">`. Head contains (order): charset; **GA4 block** (verbatim); viewport; `<title>MeduXa.ai — הדרך החכמה להתכונן לבחינות ההתמחות</title>`; canonical/hreflang:
  ```html
  <link rel="canonical" href="https://meduxa.ai/he" />
  <link rel="alternate" hreflang="en" href="https://meduxa.ai/" />
  <link rel="alternate" hreflang="he" href="https://meduxa.ai/he" />
  <link rel="alternate" hreflang="x-default" href="https://meduxa.ai/" />
  ```
  description `<meta name="description" content="הדרך החכמה להתכונן לבחינות ההתמחות: היזכרות פעילה, חזרה מרווחת ומורה AI סוקרטי — הכול מעוגן במקורות האמיתיים שמהם נכתבת הבחינה." />`; `robots index, follow`; `theme-color #061225`; the **same favicon data-URI** as Task 1 Step 1.10; OG/Twitter (HE copy, `og:url https://meduxa.ai/he`, `og:locale he_IL`, `og:locale:alternate en_US`, `og:image https://meduxa.ai/og-image.png`, title/description in Hebrew mirroring the title + description above); JSON-LD identical to Task 1 but `"url":"https://meduxa.ai/he"`. Fonts + `<style>` from the **HE** design `<helmet>` (IBM Plex Sans Hebrew stack) plus the same appended CSS block (scroll-behavior, `.nav-link`, `.m-link`) as Task 1.
  **No auto-route script** on this page (auto-routing lives only on the EN root, which routes *to* `/he`).

- [ ] **Step 2: Write `<body>`** — copy design HE markup (lines 31–217 of `Meduxa Landing v2.dc.html`, `dir="rtl"`) applying T2–T6. Identical to Task 1 Step 2 except: Hebrew copy throughout; expand loops from the **HE** `principles`/`features`/`steps` arrays; language toggle link ("EN") → `/?lang=en`; pilot button:
  ```html
  <a href="https://pilot-rust-nine.vercel.app/" style="background: linear-gradient(135deg, #0EA5E9, #22D3EE); color: #062033; border-radius: 12px; padding: 16px 40px; font-size: 18px; font-weight: 700; box-shadow: 0 6px 24px rgba(14,165,233,.4); margin-top: 8px;">גישה מוקדמת — חינם ←</a>
  ```
  Keep the mono sub-caption `free early access · no spam` (LTR mono, verbatim from design).

- [ ] **Step 3: Append the same inline JS** (`toggleMenu`/`closeMenu`) as Task 1 Step 3.

- [ ] **Step 4: Validate.**
  ```bash
  cd /Users/ori/Desktop/medboard-landing
  grep -c "<h1" he/index.html               # expect 1
  grep -ci "medboard" he/index.html          # expect 0
  grep -c "medboard-landing.vercel.app" he/index.html  # expect 0
  grep -c 'lang="he"' he/index.html          # expect 1
  grep -c 'dir="rtl"' he/index.html          # expect >=1
  grep -c "/?lang=en" he/index.html          # expect 1
  grep -c "sc-for\|sc-if\|x-dc\|support.js\|{{" he/index.html  # expect 0
  ```

- [ ] **Step 5: Browser check.** With the server from Task 1 running, open `http://localhost:4599/he`. Verify RTL mirroring (logo/nav on right, decorative curves on right, text right-aligned), Hebrew fonts, wordmark still LTR, demo card RTL. Mobile 375px burger flow. Click "EN" toggle → lands on `/?lang=en` (stays English, no bounce). Screenshot desktop + mobile.

- [ ] **Step 6: Commit.**
  ```bash
  git add he/index.html
  git commit -m "Rebrand HE landing to MeduXa.ai design"
  ```

---

### Task 3: SEO assets domain swap (`sitemap.xml`, `robots.txt`)

**Files:**
- Modify: `/Users/ori/Desktop/medboard-landing/sitemap.xml`
- Modify: `/Users/ori/Desktop/medboard-landing/robots.txt`

- [ ] **Step 1: sitemap.xml** — replace every `https://medboard-landing.vercel.app` with `https://meduxa.ai` (2 `<loc>` blocks: `/` and `/he`, each with the three hreflang `xhtml:link`s). Keep structure identical.

- [ ] **Step 2: robots.txt** — change the sitemap line to `Sitemap: https://meduxa.ai/sitemap.xml`; keep `User-agent: *` / `Allow: /`.

- [ ] **Step 3: Validate.**
  ```bash
  cd /Users/ori/Desktop/medboard-landing
  grep -c "medboard-landing" sitemap.xml robots.txt   # expect 0 each
  grep -c "meduxa.ai" sitemap.xml                      # expect >=6
  ```

- [ ] **Step 4: Commit.**
  ```bash
  git add sitemap.xml robots.txt
  git commit -m "Point sitemap and robots at meduxa.ai"
  ```

---

### Task 4: Regenerate OG share image (`og-image.png`)

**Files:**
- Create (temp): `/private/tmp/claude-501/-Users-ori-Claude/df38788b-8a1f-46a0-8c46-ed882c24a9bb/scratchpad/build-og.mjs`
- Modify (overwrite): `/Users/ori/Desktop/medboard-landing/og-image.png`

**Interfaces:**
- Consumes: the Pilot repo's `sharp` (`/Users/ori/Desktop/Pilot/node_modules/sharp`) to rasterize an SVG to a 1200×630 PNG.

- [ ] **Step 1: Write `build-og.mjs`** — builds an SVG string (1200×630) and rasterizes it:
  - Background: `linear-gradient`-equivalent via `<rect>` + SVG `<linearGradient>` `#061225 → #0A1F3D → #0C2A4E`.
  - Centered MeduXa logo mark (the rounded-square + two curves + cyan circle SVG, scaled to ~132px, translated to center-top).
  - Wordmark `MeduXa.ai` — "MeduXa" in `font-family="Arial, Helvetica, sans-serif"` bold `#FFFFFF`, ".ai" in `font-family="monospace"` `#22D3EE`, ~72px.
  - Tagline `Study smarter for your medical boards` — ~30px `#B8D4EA`.
  - Sub-strip `9 evidence-based principles · Source-cited answers · Socratic AI tutor` — ~20px mono `#7DA2C4`.
  - Rasterize: `import sharp from 'sharp'; await sharp(Buffer.from(svg)).png().toFile('/Users/ori/Desktop/medboard-landing/og-image.png');`

- [ ] **Step 2: Run it from the Pilot dir** (so `sharp` resolves):
  ```bash
  cd /Users/ori/Desktop/Pilot && node /private/tmp/claude-501/-Users-ori-Claude/df38788b-8a1f-46a0-8c46-ed882c24a9bb/scratchpad/build-og.mjs
  ```
  Expected: writes `og-image.png`, no error.

- [ ] **Step 3: Verify dimensions.**
  ```bash
  sips -g pixelWidth -g pixelHeight /Users/ori/Desktop/medboard-landing/og-image.png
  ```
  Expected: pixelWidth 1200, pixelHeight 630.

- [ ] **Step 4: Visual check.** Open `http://localhost:4599/og-image.png` in the Browser pane (server still running); confirm MeduXa branding, legible wordmark + tagline, dark bg. Screenshot.

- [ ] **Step 5: Commit.**
  ```bash
  cd /Users/ori/Desktop/medboard-landing
  git add og-image.png
  git commit -m "Regenerate OG image with MeduXa branding"
  ```

---

### Task 5: Full integration verification + push

**Files:** none (verification only).

- [ ] **Step 1: Repo-wide brand sweep.**
  ```bash
  cd /Users/ori/Desktop/medboard-landing
  grep -rIl "medboard-landing.vercel.app" --include=*.html --include=*.xml --include=*.txt .   # expect no output
  grep -rIli "medboard il" --include=*.html .   # expect no output
  ```

- [ ] **Step 2: Cross-page link integrity.** With the server running, in the Browser pane: from `/` click "עברית" → `/he`; from `/he` click "EN" → `/?lang=en` (confirm stays EN). On each page click each nav anchor → smooth-scrolls to the right section. Confirm every `APP_URL` button navigates to the app.

- [ ] **Step 3: hreflang symmetry.**
  ```bash
  grep -h 'hreflang' index.html he/index.html | sort | uniq -c
  ```
  Expected: the `en`, `he`, `x-default` triple appears identically on both pages (6 lines, 3 distinct).

- [ ] **Step 4: Stop the preview server.**
  ```bash
  lsof -ti:4599 | xargs kill 2>/dev/null; echo done
  ```

- [ ] **Step 5: Push.**
  ```bash
  cd /Users/ori/Desktop/medboard-landing
  git status
  git push origin main
  ```
  Note: `main` diverged from `origin/main` by content-identical commits (prior session). If push is rejected, inspect with `git log --oneline origin/main` and reconcile (the design rewrite supersedes prior landing content); do **not** force-push without confirming no unique remote work is lost.

- [ ] **Step 6: Post-push changelog** — per user preference, output a bullet-point list of what changed.

---

## Manual user steps (outside this plan, done in the browser)

1. **Attach domain:** Vercel → `medboard-landing` project → Settings → Domains → add `meduxa.ai` (optionally `www.meduxa.ai` as a redirect) → copy the shown DNS records into the domain registrar. The old `medboard-landing.vercel.app` keeps working and redirects once attached.
2. **(Optional, later):** rename the GA4 property display name to "MeduXa" in the GA dashboard (cosmetic; the tag id is unchanged).

## Self-Review

- **Spec coverage:** domain swap (T-all, Tasks 1–3), GA preserved (1,2), auto-route preserved EN-only (1), CTA→app not waitlist (T6, 1,2), favicon (1,2), OG regenerate (4), all 8 design sections both locales (1,2), sitemap/robots (3), testing (5). ✓
- **Placeholder scan:** no TBD/TODO; every new `<head>` block, JS, CSS, and CTA is given in full; body markup references exact design file + line ranges + concrete transforms. ✓
- **Type/label consistency:** `#mobileMenu`, `toggleMenu()`, `closeMenu()`, `.nav-link`, `.m-link`, `APP_URL`, `mbil_lang`, `G-EBPKT4TS21` used identically across Tasks 1–2. ✓
- **Ambiguity:** HE "EN" toggle explicitly `/?lang=en` to avoid the auto-route bounce; only the EN root carries the auto-route script. ✓
