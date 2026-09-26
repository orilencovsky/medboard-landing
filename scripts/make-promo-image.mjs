// Renders the "coming soon — family medicine Stage A" promo images.
//
//   node scripts/make-promo-image.mjs og      ->  og-family-medicine.png (1200x630, link preview)
//   node scripts/make-promo-image.mjs square  ->  whatsapp-family-medicine.png (1080x1080, send as an image)
//
// Same fonts, Chromium and pngquant step as scripts/make-og-image.mjs; the
// card's look (mark, wordmark, navy gradient, cyan accent) is copied from it.
// The og card is what WhatsApp shows when someone pastes
// https://meduxa.ai/family-medicine — family-medicine.html points og:image at it.
import { writeFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const VARIANTS = {
  og:     { out: 'og-family-medicine.png',       w: 1200, h: 630,  mark: 80,  word: 40, pill: 24, h1: 58, sub: 24, url: 24, offer: 28, gap: 0.8, stack: false },
  square: { out: 'whatsapp-family-medicine.png', w: 1080, h: 1080, mark: 130, word: 56, pill: 32, h1: 84, sub: 32, url: 32, offer: 40, gap: 1.35, stack: true },
};

const V = VARIANTS[process.argv[2]];
if (!V) {
  console.error(`usage: node scripts/make-promo-image.mjs <${Object.keys(VARIANTS).join('|')}>`);
  process.exit(1);
}
// Wide card: one line with dots. Square card: one feature per line, since a
// dotted line wraps mid-feature at 1080px.
const FEATURES = V.stack
  ? ['שאלות בסגנון הבחינה · הסבר עם ציטוט מהמקור', 'חזרה מרווחת · תרגול ממוקד בחולשות', 'מורה <span dir="ltr">AI</span> סוקרטי לכל שאלה']
  : ['שאלות בסגנון הבחינה', 'הסבר עם ציטוט מהמקור', 'חזרה מרווחת', 'מורה <span dir="ltr">AI</span> סוקרטי'];
const g = (px) => Math.round(px * V.gap);

const MARK = `<svg width="${V.mark}" height="${V.mark}" viewBox="0 0 96 96" fill="none">
  <rect x="2" y="2" width="92" height="92" rx="22" fill="#0B2545"></rect>
  <rect x="2" y="2" width="92" height="92" rx="22" fill="none" stroke="#22D3EE" stroke-width="3"></rect>
  <path d="M18 22 C 30 26, 40 36, 48 48 C 56 60, 66 70, 78 74" stroke="#1E4A6E" stroke-width="6" stroke-linecap="round" fill="none"></path>
  <path d="M18 74 C 30 70, 40 60, 48 48 C 56 36, 66 26, 78 22" stroke="#38BDF8" stroke-width="7" stroke-linecap="round" fill="none"></path>
  <circle cx="48" cy="48" r="9" fill="#22D3EE"></circle>
</svg>`;

const html = `<!doctype html><html lang="he"><head><meta charset="utf-8"><style>
  html, body { margin: 0; padding: 0; }
  .card {
    width: ${V.w}px; height: ${V.h}px; position: relative; overflow: hidden; box-sizing: border-box;
    display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
    padding: 0 60px;
    background:
      radial-gradient(90% 70% at 50% 118%, rgba(34,211,238,.16), transparent 62%),
      linear-gradient(158deg, #04101E 0%, #0A1F3D 58%, #0C2A4E 100%);
    font-family: 'IBM Plex Sans Hebrew', 'IBM Plex Sans', sans-serif;
  }
  .arc { position: absolute; right: -280px; bottom: -320px; width: 800px; height: 800px; opacity: .2; }
  .inner { position: relative; display: flex; flex-direction: column; align-items: center; }
  .brand { display: flex; align-items: center; gap: ${g(18)}px; direction: ltr; }
  .brand svg { filter: drop-shadow(0 0 22px rgba(34,211,238,.2)); }
  .name { font-family: 'IBM Plex Sans', sans-serif; font-size: ${V.word}px; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
  .tld { font-family: 'IBM Plex Mono', monospace; font-size: ${V.word}px; color: #22D3EE; }
  .pill { margin-top: ${g(34)}px; font-size: ${V.pill}px; font-weight: 700; color: #04101E; background: #22D3EE; border-radius: 999px; padding: ${g(6)}px ${g(26)}px; }
  h1 { margin: ${g(22)}px 0 0; font-size: ${V.h1}px; font-weight: 700; line-height: 1.18; color: #fff; }
  .offer { margin-top: ${g(22)}px; font-size: ${V.offer}px; font-weight: 700; color: #FDE68A; border: 2px solid #F59E0B; background: rgba(245,158,11,.12); border-radius: 14px; padding: ${g(8)}px ${g(24)}px; }
  .sub { margin-top: ${g(18)}px; font-size: ${V.sub}px; line-height: 1.4; color: #B8D4EA; max-width: 900px; }
  .bar { margin-top: ${g(30)}px; width: 180px; height: 5px; border-radius: 3px; background: linear-gradient(90deg, #0EA5E9, #22D3EE); }
  .url { margin-top: ${g(22)}px; font-family: 'IBM Plex Mono', monospace; font-size: ${V.url}px; color: #7DD3FC; direction: ltr; }
</style></head><body>
<div class="card" dir="rtl">
  <svg class="arc" viewBox="0 0 96 96" fill="none">
    <path d="M18 74 C 30 70, 40 60, 48 48 C 56 36, 66 26, 78 22" stroke="#38BDF8" stroke-width="1.3" stroke-linecap="round" fill="none"></path>
  </svg>
  <div class="inner">
    <div class="brand">${MARK}<span><span class="name">MeduXa</span><span class="tld">.ai</span></span></div>
    <div class="pill">בקרוב</div>
    <h1>הכנה לשלב א<br>ברפואת משפחה</h1>
    <div class="offer">מחיר השקה מיוחד לנרשמים מראש</div>
    <div class="sub">${FEATURES.join(V.stack ? '<br>' : ' · ')}</div>
    <div class="bar"></div>
    <div class="url">meduxa.ai/family-medicine</div>
  </div>
</div>
</body></html>`;

const work = mkdtempSync(join(tmpdir(), 'promo-'));
const page = join(work, 'card.html');
writeFileSync(page, html);

const chrome = process.env.CHROME
  || ['/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      'google-chrome', 'chromium'].find((p) => { try { execFileSync(p, ['--version'], { stdio: 'ignore' }); return true; } catch { return false; } });
if (!chrome) { console.error('No Chromium found. Set CHROME to the browser binary.'); process.exit(1); }

execFileSync(chrome, [
  '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  '--force-device-scale-factor=1', `--window-size=${V.w},${V.h}`,
  `--screenshot=${V.out}`, '--virtual-time-budget=4000', `file://${page}`,
], { stdio: 'ignore' });

unlinkSync(page);
console.log(`wrote ${V.out}`);
