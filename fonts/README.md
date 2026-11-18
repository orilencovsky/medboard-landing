# Self-hosted fonts

IBM Plex, (c) IBM Corp., licensed under the SIL Open Font License 1.1: see `OFL.txt`
(copied from https://github.com/IBM/plex/blob/master/LICENSE.txt). The OFL allows
redistribution and subsetting; keep `OFL.txt` next to the files.

Downloaded 2026-11-18 from Google Fonts (the subsets Google serves to Chrome):

| File | Family, weight, subset | Upstream |
|---|---|---|
| `ibm-plex-sans-hebrew-v12-{400,500,600,700}-hebrew.woff2` | IBM Plex Sans Hebrew, Hebrew subset | `fonts.gstatic.com/s/ibmplexsanshebrew/v12/` |
| `ibm-plex-sans-hebrew-v12-{400,500,600,700}-latin.woff2` | IBM Plex Sans Hebrew, Latin subset | `fonts.gstatic.com/s/ibmplexsanshebrew/v12/` |
| `ibm-plex-sans-v23-latin.woff2` | IBM Plex Sans, variable (wght), Latin subset; Google serves this one file for 400-700 | `fonts.gstatic.com/s/ibmplexsans/v23/` |
| `ibm-plex-mono-v23-{400,500}-latin.woff2` | IBM Plex Mono, Latin subset | `fonts.gstatic.com/s/ibmplexmono/v23/` |

The CSS they came from:

    https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Hebrew:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap

## Regenerating

1. Fetch that CSS with a current desktop Chrome user agent (otherwise Google answers
   with TTF and no subsets), e.g. `curl -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)
   AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" "<url>"`.
2. From each `@font-face` block marked `/* hebrew */` or `/* latin */`, download the
   `src` woff2. Skip the other subsets unless page text needs them (check for
   characters outside the two `unicode-range`s).
3. Name the file `<family>-v<N>-<weight>-<subset>.woff2`, `v<N>` being the version in
   the gstatic path. **Never overwrite an existing name**: `/fonts/*.woff2` is served
   as `immutable` for a year (vercel.json), so a changed file needs a new name, and
   `fonts.css` plus the pages' `<link rel="preload">` lines must point at it.
4. Copy each block's `unicode-range` into `fonts.css`.
5. If the metrics changed (unitsPerEm, hhea ascender/descender/lineGap), recompute the
   `* Fallback` faces at the end of `fonts.css`: `ascent-override` = ascender /
   unitsPerEm / size-adjust, the same for `descent-override`; `size-adjust` is the width
   of the pages' text in Plex divided by its width in Arial (measured with canvas
   `measureText`). The v12/v23 files: unitsPerEm 1000, ascender 1025, descender -275,
   line gap 0.
6. Run `node --test scripts/fonts.test.mjs`.
