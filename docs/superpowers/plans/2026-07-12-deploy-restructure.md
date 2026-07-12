# Deploy medboard-landing Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `medboard-landing` from a 4-variant design-review repo into a deployable
2-page (EN + HE) static marketing site, wired to the live Pilot app, and ship it to Vercel.

**Architecture:** Plain static HTML, no build step, no framework. Two pages served from a single
Vercel project: `index.html` (EN, root) and `he/index.html` (HE), reachable at `/he` via
`cleanUrls`. All 6 CTA anchors (3 per page) point at the live Pilot app.

**Tech Stack:** Static HTML/CSS (inline, no external JS), Vercel (`npx vercel`, no local install).

## Global Constraints

- Pilot app URL (all CTA links): `https://pilot-rust-nine.vercel.app/`
- No custom domain yet — deploy to Vercel's default subdomain only.
- No build step — plain static files, `vercel.json` only sets `cleanUrls`.
- Preserve file history on rename — use `git mv`, not delete+create.

---

### Task 1: Restructure repo files

**Files:**
- Rename: `landing-a.html` → `index.html`
- Rename: `landing-a-he.html` → `he/index.html`
- Delete: `landing-b.html`, `landing-b-he.html`, old picker `index.html` (must be renamed
  first per above, so this "delete" only applies to `landing-b*.html`)

**Interfaces:**
- Consumes: nothing (pure file ops)
- Produces: `index.html` (EN page, at repo root) and `he/index.html` (HE page) — later tasks
  edit these two files by path.

- [ ] **Step 1: Rename the chosen variants into place**

```bash
cd /Users/ori/Desktop/medboard-landing
mkdir -p he
git rm index.html
git mv landing-a-he.html he/index.html
git mv landing-a.html index.html
```

`git rm index.html` removes the old picker page first, freeing up the `index.html`
path for `landing-a.html` to move into.

- [ ] **Step 2: Delete the B variants**

```bash
git rm landing-b.html landing-b-he.html
```

- [ ] **Step 3: Verify final file list**

Run: `git status --short`
Expected output (order may vary; the `index.html` line may show as `D` old-picker
+ `A` new-content rather than a detected `R`, since the two files' content differs):
```
D  index.html
R  landing-a-he.html -> he/index.html
A  index.html
D  landing-b-he.html
D  landing-b.html
```

- [ ] **Step 4: Commit**

```bash
git commit -m "Restructure: promote Option A to index.html + he/index.html, drop B variants and picker"
```

---

### Task 2: Wire EN page CTAs + language switcher

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: Pilot app URL from Global Constraints (`https://pilot-rust-nine.vercel.app/`)
- Produces: nothing consumed by later tasks (leaf edit)

- [ ] **Step 1: Update the 3 CTA hrefs**

In `index.html`, there are 3 anchors with `href="#"` and CTA text. Replace each:

Nav bar (currently `<a href="#" class="btn-nav">Get Early Access →</a>`):
```html
<a href="https://pilot-rust-nine.vercel.app/" class="btn-nav">Get Early Access →</a>
```

Hero (currently `<a href="#" class="btn-primary">Start studying free →</a>`):
```html
<a href="https://pilot-rust-nine.vercel.app/" class="btn-primary">Start studying free →</a>
```

Bottom CTA (currently
`<a href="#" class="btn-primary" style="font-size:16px; padding:16px 36px">Get early access — it's free →</a>`):
```html
<a href="https://pilot-rust-nine.vercel.app/" class="btn-primary" style="font-size:16px; padding:16px 36px">Get early access — it's free →</a>
```

Do NOT touch `href="#features"`, `href="#how"`, `href="#pilot"`, or the `nav-logo`'s
`href="#"` — those are in-page anchors and stay as-is.

- [ ] **Step 2: Add the language switcher link**

In the nav bar's `.nav-links` div, add a link to the HE page right before the
`btn-nav` anchor:

```html
  <div class="nav-links">
    <a href="#features" class="nav-link">Features</a>
    <a href="#how" class="nav-link">How it works</a>
    <a href="#pilot" class="nav-link">Pilot</a>
    <a href="/he/" class="nav-link">עברית</a>
    <a href="https://pilot-rust-nine.vercel.app/" class="btn-nav">Get Early Access →</a>
  </div>
```

- [ ] **Step 3: Verify no stray `#` CTAs remain**

Run: `grep -n 'href="#"' index.html`
Expected: only 1 match left — the `nav-logo` anchor (`<a href="#" class="nav-logo">`).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Wire EN landing page CTAs to Pilot app, add HE language switcher"
```

---

### Task 3: Wire HE page CTAs + language switcher

**Files:**
- Modify: `he/index.html`

**Interfaces:**
- Consumes: Pilot app URL from Global Constraints (`https://pilot-rust-nine.vercel.app/`)
- Produces: nothing consumed by later tasks (leaf edit)

- [ ] **Step 1: Update the 3 CTA hrefs**

In `he/index.html`, replace each `href="#"` CTA:

Nav bar (currently `<a href="#" class="btn-nav">← הצטרפו עכשיו</a>`):
```html
<a href="https://pilot-rust-nine.vercel.app/" class="btn-nav">← הצטרפו עכשיו</a>
```

Hero (currently `<a href="#" class="btn-primary">← התחל ללמוד בחינם</a>`):
```html
<a href="https://pilot-rust-nine.vercel.app/" class="btn-primary">← התחל ללמוד בחינם</a>
```

Bottom CTA (currently
`<a href="#" class="btn-primary" style="font-size:16px; padding:16px 36px">← גישה מוקדמת — בחינם</a>`):
```html
<a href="https://pilot-rust-nine.vercel.app/" class="btn-primary" style="font-size:16px; padding:16px 36px">← גישה מוקדמת — בחינם</a>
```

Do NOT touch `href="#features"`, `href="#how"`, `href="#pilot"`, or the `nav-logo`'s
`href="#"`.

- [ ] **Step 2: Add the language switcher link**

The HE nav's `.nav-links` div order is `btn-nav`, then `pilot`/`how`/`features`
nav-links (RTL flow). Add the switcher as the last item in that div:

```html
  <div class="nav-links">
    <a href="https://pilot-rust-nine.vercel.app/" class="btn-nav">← הצטרפו עכשיו</a>
    <a href="#pilot" class="nav-link">פיילוט</a>
    <a href="#how" class="nav-link">איך זה עובד</a>
    <a href="#features" class="nav-link">תכונות</a>
    <a href="/" class="nav-link">English</a>
  </div>
```

- [ ] **Step 3: Verify no stray `#` CTAs remain**

Run: `grep -n 'href="#"' he/index.html`
Expected: only 1 match left — the `nav-logo` anchor.

- [ ] **Step 4: Commit**

```bash
git add he/index.html
git commit -m "Wire HE landing page CTAs to Pilot app, add EN language switcher"
```

---

### Task 4: Add Vercel config and verify locally

**Files:**
- Create: `vercel.json`

**Interfaces:**
- Consumes: `index.html`, `he/index.html` (from Tasks 2-3)
- Produces: `vercel.json`, consumed by Task 5's `npx vercel` deploy

- [ ] **Step 1: Create vercel.json**

```json
{
  "cleanUrls": true
}
```

- [ ] **Step 2: Serve locally and verify both pages**

```bash
cd /Users/ori/Desktop/medboard-landing
python3 -m http.server 8791 --bind 127.0.0.1 &
sleep 1
curl -s http://127.0.0.1:8791/index.html | grep -c 'pilot-rust-nine.vercel.app'
curl -s http://127.0.0.1:8791/he/index.html | grep -c 'pilot-rust-nine.vercel.app'
kill %1
```

Expected: both `grep -c` calls print `3` (3 CTA links per page point at the Pilot app).

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "Add vercel.json with cleanUrls for /he routing"
```

---

### Task 5: Deploy to Vercel

**Files:**
- None (deploy-only task, no file changes)

**Interfaces:**
- Consumes: `index.html`, `he/index.html`, `vercel.json` from Tasks 1-4
- Produces: live URL (reported to user, not consumed by further tasks)

- [ ] **Step 1: Deploy via Vercel CLI (no local install, uses npx)**

```bash
cd /Users/ori/Desktop/medboard-landing
npx vercel --prod
```

This prompts for Vercel login (browser flow) on first run, then project setup
(accept defaults — no framework, root directory `.`). Note the deployed URL from
the command's output.

- [ ] **Step 2: Verify the live deployment**

```bash
curl -sI https://<deployed-url>/ | head -1
curl -sI https://<deployed-url>/he | head -1
```

Expected: both return `HTTP/2 200`. Replace `<deployed-url>` with the URL printed by
Step 1.

- [ ] **Step 3: Report the live URL to the user**

No commit needed — deployment is not a file change. Tell the user the live root and
`/he` URLs so they can confirm visually.
