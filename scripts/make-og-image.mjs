// Renders the Open Graph card for a locale to a 1200x630 PNG.
//
//   node scripts/make-og-image.mjs he   ->  og-image-he.png
//   node scripts/make-og-image.mjs en   ->  og-image.png
//
// Needs a headless Chromium and the IBM Plex families installed system-wide
// (IBM Plex Sans, IBM Plex Mono, IBM Plex Sans Hebrew). On macOS:
//   brew install --cask font-ibm-plex-sans font-ibm-plex-mono font-ibm-plex-sans-hebrew
// Point CHROME at the binary if it is not on PATH:
//   CHROME=/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome node scripts/make-og-image.mjs he
//
// Note: og-image.png was hand-made before this script existed, so regenerating
// `en` will not reproduce it byte for byte — it is a close recreation.
import { writeFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const LOCALES = {
  en: {
    out: 'og-image.png',
    dir: 'ltr',
    sans: "'IBM Plex Sans', sans-serif",
    tagline: 'The smarter way to prepare for medical boards',
    meta: '9 evidence-based principles · Source-cited answers · Socratic AI tutor',
    // The English card sets its strapline in mono, matching the site's eyebrows.
    metaFont: "'IBM Plex Mono', monospace",
    metaTracking: '0.01em',
  },
  he: {
    out: 'og-image-he.png',
    dir: 'rtl',
    sans: "'IBM Plex Sans Hebrew', 'IBM Plex Sans', sans-serif",
    tagline: 'הדרך החכמה להתכונן לבחינות ההתמחות',
    meta: '9 עקרונות מבוססי-ראיות · תשובות עם ציטוט מקור · מורה AI סוקרטי',
    // IBM Plex Mono has no Hebrew, and a monospaced strapline is not a Hebrew
    // idiom anyway — the Hebrew sans with tracking carries the same texture.
    metaFont: "'IBM Plex Sans Hebrew', sans-serif",
    metaTracking: '0.04em',
  },
};

const locale = process.argv[2];
const L = LOCALES[locale];
if (!L) {
  console.error(`usage: node scripts/make-og-image.mjs <${Object.keys(LOCALES).join('|')}>`);
  process.exit(1);
}

const MARK = `<svg width="150" height="150" viewBox="0 0 96 96" fill="none">
  <rect x="2" y="2" width="92" height="92" rx="22" fill="#0B2545"></rect>
  <rect x="2" y="2" width="92" height="92" rx="22" fill="none" stroke="#22D3EE" stroke-width="3"></rect>
  <path d="M18 22 C 30 26, 40 36, 48 48 C 56 60, 66 70, 78 74" stroke="#1E4A6E" stroke-width="6" stroke-linecap="round" fill="none"></path>
  <path d="M18 74 C 30 70, 40 60, 48 48 C 56 36, 66 26, 78 22" stroke="#38BDF8" stroke-width="7" stroke-linecap="round" fill="none"></path>
  <circle cx="48" cy="48" r="9" fill="#22D3EE"></circle>
</svg>`;

const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><style>
  html, body { margin: 0; padding: 0; }
  .card {
    width: 1200px; height: 630px; position: relative; overflow: hidden;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0;
    background:
      radial-gradient(90% 70% at 50% 118%, rgba(34,211,238,.13), transparent 62%),
      linear-gradient(158deg, #04101E 0%, #0A1F3D 58%, #0C2A4E 100%);
  }
  /* One arm of the brand swoosh, ghosted into the bottom-right corner. Only the
     single sweep shows — both arms would read as a second logo. */
  .arc { position: absolute; right: -280px; bottom: -320px; width: 800px; height: 800px; opacity: .2; }
  .inner { position: relative; display: flex; flex-direction: column; align-items: center; }
  .mark { margin-bottom: 30px; filter: drop-shadow(0 0 22px rgba(34,211,238,.2)); }
  .wordmark { display: flex; align-items: baseline; direction: ltr; line-height: 1; }
  .wordmark .name { font-family: 'IBM Plex Sans', sans-serif; font-size: 72px; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
  .wordmark .tld { font-family: 'IBM Plex Mono', monospace; font-size: 72px; font-weight: 400; color: #22D3EE; }
  .tagline { margin-top: 30px; font-family: ${L.sans}; font-size: 32px; font-weight: 400; line-height: 1.2; color: #B8D4EA; text-align: center; }
  .meta { margin-top: 26px; font-family: ${L.metaFont}; font-size: 24px; font-weight: 400; line-height: 1.2; color: #5B87A8; letter-spacing: ${L.metaTracking}; text-align: center; }
  .bar { margin-top: 30px; width: 180px; height: 5px; border-radius: 3px; background: linear-gradient(90deg, #0EA5E9, #22D3EE); }
</style></head><body>
<div class="card" dir="${L.dir}">
  <svg class="arc" viewBox="0 0 96 96" fill="none">
    <path d="M18 74 C 30 70, 40 60, 48 48 C 56 36, 66 26, 78 22" stroke="#38BDF8" stroke-width="1.3" stroke-linecap="round" fill="none"></path>
  </svg>
  <div class="inner">
    <div class="mark">${MARK}</div>
    <div class="wordmark"><span class="name">MeduXa</span><span class="tld">.ai</span></div>
    <div class="tagline">${L.tagline}</div>
    <div class="meta">${L.meta}</div>
    <div class="bar"></div>
  </div>
</div>
</body></html>`;

const work = mkdtempSync(join(tmpdir(), 'og-'));
const page = join(work, 'card.html');
writeFileSync(page, html);

const chrome = process.env.CHROME
  || ['/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      'google-chrome', 'chromium'].find((p) => { try { execFileSync(p, ['--version'], { stdio: 'ignore' }); return true; } catch { return false; } });

if (!chrome) {
  console.error('No Chromium found. Set CHROME to the browser binary.');
  process.exit(1);
}

execFileSync(chrome, [
  '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  '--force-device-scale-factor=1', '--window-size=1200,630',
  `--screenshot=${L.out}`, '--virtual-time-budget=4000', `file://${page}`,
], { stdio: 'ignore' });

unlinkSync(page);
console.log(`wrote ${L.out}`);
