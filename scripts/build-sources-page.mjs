// Builds /<track>/sources (a static "sources" page) for a track that has not
// opened yet ("soon"), from:
//   - the rendered <track>.html: head CSS, nav, footer and the reveal and
//     countdown scripts (the sample-question code and the hero video pin are
//     cut out, the page has neither);
//   - tracks.json: exam date and name, and the source titles;
//   - specialties/<track>.json: analytics prefix, examBased and the citation of
//     the first sample question;
//   - CONTENT below: the page copy, written by hand per track.
//
//   node scripts/build-sources-page.mjs obgyn           write obgyn/sources.html
//   node scripts/build-sources-page.mjs obgyn --check   exit 1 if the file differs
//
// Only tracks in CONTENT can be built. cardiology, nephrology, family-medicine
// and geriatrics/sources.html were built before this script and are not in
// CONTENT: running it for them throws instead of overwriting their copy.
// The daily date bot (scripts/check-ima-dates.mjs) does not run this script;
// it swaps the date in the committed page as text, so the page shows only the
// track's own date (scripts/sources-pages.test.mjs checks it).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Analytics prefix per track, used when specialties/<track>.json has none.
const PREFIX = { pediatrics: 'peds', psychiatry: 'psych', anesthesia: 'anes', obgyn: 'obgyn', geriatrics: 'geri' };

// Page copy per track. Only facts that tracks.json, specialties/<track>.json or
// the track page already state. `books` maps each tracks.json source title to
// its card text (a plain paraphrase of the title); every source must appear in
// exactly one group.
const CONTENT = {
  obgyn: {
    title: 'מקורות להכנה לשלב א׳ במיילדות וגינקולוגיה | MeduXa.ai',
    description: 'על אילו מקורות מבוססות השאלות לשלב א׳ במיילדות וגינקולוגיה ב-MeduXa: Gabbe, Berek & Novak ו-Speroff, וקישור ללוח הבחינות של הר״י.',
    ogDescription: 'שלושה ספרי לימוד: המקורות שמהם לקוחים ההסברים והציטוטים בשאלות למיילדות וגינקולוגיה ב-MeduXa.',
    ogImageAlt: 'MeduXa.ai: מקורות להכנה לשלב א׳ במיילדות וגינקולוגיה',
    h1: 'המקורות להכנה לשלב א׳ במיילדות וגינקולוגיה',
    lead: 'על אלה מבוססים ההסברים והציטוטים בשאלות למיילדות וגינקולוגיה ב-MeduXa. לכל תשובה יש הסבר שמגובה בציטוט מילה במילה מהמקור, כדי שתוכלו לבדוק כל טענה בעצמכם.',
    sourcesIntro: 'שלושה ספרי לימוד.',
    groups: [
      { title: null, items: [
        { source: "Gabbe's Obstetrics: Normal and Problem Pregnancies 9e", icon: 'ph-book-open', text: 'ספר לימוד במיילדות.' },
        { source: "Berek & Novak's Gynecology 17e", icon: 'ph-book-open', text: 'ספר לימוד בגינקולוגיה.' },
        { source: "Speroff's Clinical Gynecologic Endocrinology and Infertility 10e", icon: 'ph-book-open', text: 'ספר לימוד באנדוקרינולוגיה גינקולוגית ובפוריות.' },
      ] },
    ],
    // The citation line of specialties/<track>.json questions[0], not its quote.
    citeIntro: (topic) => `בשאלה לדוגמה בנושא ${topic}, זו שורת המקור שמופיעה מתחת לציטוט בהסבר.`,
    citeTry: 'נסו את השאלה',
    factsTitle: 'על הרשימה, על הבחינה ועל השאלות',
    facts: ({ dmy, imaLink, imaSpecialty, examName }) => [
      `<p><strong>זו הרשימה של MeduXa, לא רשימה רשמית.</strong> מאלה לקוחים ההסברים והציטוטים בשאלות למיילדות וגינקולוגיה אצלנו. את הפרטים הרשמיים על הבחינה מפרסמת ההסתדרות הרפואית, ב${imaLink}.</p>`,
      `<p data-exam-fact><strong>מועד הבחינה.</strong> ${examName} במיילדות וגינקולוגיה תתקיים ב-<span class="ltr-iso">${dmy}</span>, לפי לוח הר״י.</p>`,
      `<p><strong>השם בלוח הר״י.</strong> בלוח הר״י המקצוע נקרא ${imaSpecialty}.</p>`,
    ],
    // Only when specialties/<track>.json has examBased: the obgyn page's own wording.
    pastExam: '<p><strong>השאלות.</strong> שאלות בסגנון שלב א׳, ולכל תשובה הסבר עם ציטוט מהמקור. השאלה לדוגמה בעמוד מיילדות וגינקולוגיה מבוססת על נושא ממבחני עבר ונערכה על ידי הצוות שלנו.</p>',
    noPastExam: '<p><strong>השאלות.</strong> שאלות בסגנון שלב א׳, ולכל תשובה הסבר עם ציטוט מהמקור.</p>',
    moreText: 'עוד על ההכנה למיילדות וגינקולוגיה',
    closingTitle: 'עדכון במייל כשההכנה תיפתח',
    closingHtml: '<strong>ההכנה לשלב א׳ במיילדות וגינקולוגיה</strong> נבנית עכשיו. הירשמו לעדכון ונכתוב לכם כשהיא נפתחת.',
    closingButton: 'הרשמה לעדכון',
  },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// {{…}} marks a Latin run inside Hebrew, as in specialties/*.json.
const inline = (s) => esc(s).replace(/'/g, '&#39;').replace(/\{\{([\s\S]*?)\}\}/g, '<span class="ltr-iso">$1</span>');
const L = (s) => `<span class="ltr-iso">${esc(s)}</span>`;
const ld = (o) => `<script type="application/ld+json">\n${JSON.stringify(o).replace(/</g, '\\u003c')}\n</script>`;

// "Berek & Novak's Gynecology 17e" -> card title with the Latin part isolated.
function bookTitle(title) {
  const m = title.match(/^(.*) (\d+)e$/);
  if (!m) return /[\u0590-\u05FF]/.test(title) ? esc(title) : L(title);
  return `${L(m[1])}, מהדורה ${m[2]}`;
}

export function buildSourcesPage(id, read = (p) => readFileSync(join(root, p), 'utf8')) {
  const c = CONTENT[id];
  if (!c) throw new Error(`no CONTENT for "${id}" in scripts/build-sources-page.mjs (built: ${Object.keys(CONTENT).join(', ')})`);
  const track = JSON.parse(read('tracks.json')).tracks.find((t) => t.id === id);
  if (!track) throw new Error(`no track "${id}" in tracks.json`);
  if (track.status !== 'soon') throw new Error(`${id} is ${track.status}: this script builds pages for "soon" tracks (sign-up, no app link)`);
  if (track.launchOffer) throw new Error(`${id} has a launchOffer: add its launch-price line before building`);
  const spec = JSON.parse(read(`specialties/${id}.json`));
  const prefix = spec.prefix || PREFIX[id];
  if (!/^[a-z]+$/.test(prefix || '')) throw new Error(`no analytics prefix for ${id}`);
  const DATE = track.exam.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(DATE || '')) throw new Error(`${id} has no exam date in tracks.json`);
  const DMY = DATE.split('-').reverse().join('.');
  const href = track.href;
  const URL_ = `https://meduxa.ai${href}/sources`;
  const cta = `data-${prefix}-cta`;

  const src = read(`${href.slice(1)}.html`).replace(/\r\n/g, '\n');
  // The breadcrumb name must be the one /<track> gives itself.
  const crumbLd = src.match(/"@type":"BreadcrumbList"[\s\S]*?"position":2,"name":"([^"]+)"/);
  if (!crumbLd) throw new Error(`${href}.html has no 2-level BreadcrumbList`);
  const crumb = crumbLd[1];

  // Every tracks.json source on exactly one card.
  const cards = c.groups.flatMap((g) => g.items.map((i) => i.source));
  const titles = track.sources.map((s) => s.title);
  if (JSON.stringify([...cards].sort()) !== JSON.stringify([...titles].sort())) {
    throw new Error(`CONTENT.${id}.groups must list exactly the tracks.json sources:\n  tracks.json: ${titles.join(' | ')}\n  CONTENT:     ${cards.join(' | ')}`);
  }

  let head = src.slice(0, src.indexOf('</head>'));
  const swap = (re, to) => { if (!re.test(head)) throw new Error('no match ' + re); head = head.replace(re, () => to); };
  swap(/<title>[^<]*<\/title>/, `<title>${c.title}</title>`);
  swap(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${URL_}" />`);
  swap(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(c.description)}" />`);
  swap(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${c.title}" />`);
  swap(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(c.ogDescription)}" />`);
  swap(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${URL_}" />`);
  swap(/<meta property="og:image:alt" content="[^"]*" \/>/, `<meta property="og:image:alt" content="${esc(c.ogImageAlt)}" />`);
  swap(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${c.title}" />`);
  swap(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${esc(c.ogDescription)}" />`);
  // Analytics: the logo and nav keep the track page's <prefix>_home_click; the
  // links that stay on the page or go to /<track> get their own event.
  const p = prefix;
  swap(new RegExp(`  // ${p}_home_click: [\\s\\S]*?    if \\(a\\) window\\.va\\('event', \\{ name: '${p}_home_click', data: \\{ placement: a\\.getAttribute\\('data-${p}-cta'\\) \\} \\}\\);`),
    `  // ${p}_home_click: the logo or nav sent a visitor back to the homepage.
  // ${p}_sources_click: any other link on this page (to ${href} and its
  // signup). Cookieless like the rest of Vercel Analytics.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[data-${p}-cta]') : null;
    if (!a) return;
    var placement = a.getAttribute('data-${p}-cta');
    var name = (placement === 'logo' || placement === 'nav') ? '${p}_home_click' : '${p}_sources_click';
    window.va('event', { name: name, data: { placement: placement } });`);
  const blocks = [
    ld({ '@context': 'https://schema.org', '@type': 'WebPage', '@id': URL_ + '#webpage', url: URL_, name: c.title, description: c.description, inLanguage: 'he',
         isPartOf: { '@type': 'WebSite', name: 'MeduXa.ai', url: 'https://meduxa.ai/' } }),
    ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'MeduXa.ai', item: 'https://meduxa.ai/' },
      { '@type': 'ListItem', position: 2, name: crumb, item: `https://meduxa.ai${href}` },
      { '@type': 'ListItem', position: 3, name: 'מקורות', item: URL_ } ] }),
  ].join('\n');
  swap(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n<script type="application\/ld\+json">[\s\S]*?<\/script>/, blocks);
  swap(/<\/style>(?![\s\S]*<\/style>)/, `
  /* ${href}/sources: a reading page. A short hero without the video, the
     sources as cards, one citation line as an example, then the exam facts.
     Built by scripts/build-sources-page.mjs. */
  .hero.page-hero { min-height: 0; padding-block: 140px 72px; }
  .page-hero h1 { font-size: clamp(34px, 4.4vw, 56px); }
  .page-hero .lead { max-width: 60ch; }
  .crumbs { margin: 0 0 18px; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 8px; font-size: 14px; color: var(--t3); }
  .crumbs li + li::before { content: '/'; margin-inline-end: 8px; color: var(--t4); }
  .crumbs a { color: var(--t3); text-decoration: underline; text-underline-offset: 3px; }
  .crumbs a:hover { color: var(--cyan-soft); }
  /* Breadcrumb links: 44px tap targets, the row pulled up so the text stays put. */
  .crumbs { align-items: center; row-gap: 0; margin-block: -12px 6px; }
  .crumbs li { display: inline-flex; align-items: center; }
  .crumbs a { display: inline-flex; align-items: center; min-height: 44px; }
  .page-hero .cd-note a { display: inline-flex; align-items: center; min-height: 44px; }
  .src-group + .src-group { margin-top: 40px; }
  .src-group h3.src-group-title { margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #fff; }
  /* Cards fill the row: three sit side by side on wide screens, any other
     count fills the row with auto-fit; one column on phones. */
  .src-detail { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 14px; margin: 0; padding: 0; list-style: none; }
  .src-detail.n3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .src-detail li { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; align-content: start; background: var(--card); border: 1px solid var(--border); border-radius: var(--r-md); padding: 20px 22px; }
  .src-detail .ph { grid-row: span 2; font-size: 24px; color: var(--cyan); margin-top: 2px; }
  .src-detail li:not(:has(p)) .ph { grid-row: auto; }
  .src-detail :is(h3, h4) { margin: 0; font-size: 17px; font-weight: 600; line-height: 1.45; color: #fff; overflow-wrap: anywhere; }
  .src-detail p { margin: 0; font-size: 15.5px; line-height: 1.7; color: var(--t2); }
  .sec.cite-ex { padding-block: 0 80px; background: var(--ink); }
  .sec.cite-ex + .sec { border-top: 1px solid var(--line); }
  .cite-line { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; max-width: 760px; margin: 0; border-inline-start: 3px solid var(--cyan); background: rgba(34,211,238,.06); border-radius: var(--r-sm); padding: 18px 20px; }
  .cite-line .ph { grid-row: span 2; font-size: 24px; color: var(--cyan); margin-top: 2px; }
  .cite-topic { font-size: 14px; color: var(--t3); }
  .cite-line cite { font-style: normal; font-size: 16px; line-height: 1.6; color: #DDEBF7; overflow-wrap: anywhere; }
  .cite-ex .src-more { margin: 18px 0 0; }
  .facts { display: grid; gap: 16px; max-width: 760px; }
  .facts p { margin: 0; font-size: 17px; line-height: 1.75; color: var(--t2); }
  .facts strong { color: #fff; font-weight: 600; }
  .facts a { color: var(--cyan-soft); text-decoration: underline; text-underline-offset: 3px; }
  .facts .src-more { margin: 4px 0 0; }
  @media (max-width: 900px) { .src-detail.n3 { grid-template-columns: 1fr; } }
  @media (max-width: 600px) { .hero.page-hero { padding-block: 112px 56px; } .src-detail li, .cite-line { padding: 16px; } .sec.cite-ex { padding-block: 0 64px; } }
</style>`);

  const body0 = src.slice(src.indexOf('</head>'), src.indexOf('<main id="main">'));
  // The nav button points at the sign-up form, which lives on /<track>.
  const navCta = '<a class="btn nav-cta" href="#signup">';
  if (!body0.includes(navCta)) throw new Error('nav cta marker');
  const nav = body0.replace('<nav>', '<nav aria-label="ניווט ראשי">')
    .replace(navCta, `<a class="btn nav-cta" href="${href}#signup" ${cta}="sources_nav">`);
  if (!nav.includes('<nav aria-label="ניווט ראשי">')) throw new Error('nav marker');
  const footer = src.slice(src.indexOf('</main>') + '</main>'.length, src.indexOf('<script>', src.indexOf('<footer>')));
  let script = src.slice(src.indexOf('<script>', src.indexOf('<footer>')));
  const q0 = script.indexOf('  // Sample questions.'), q1 = script.indexOf('  // Exam countdown.');
  if (q0 < 0 || q1 < q0) throw new Error('sample-question markers');
  script = script.slice(0, q0) + script.slice(q1);
  const cut = script.indexOf('  // Hero background pin');
  if (cut < 0) throw new Error('hero pin marker');
  script = script.slice(0, cut).replace(/\s*$/, '\n\n') + '</script>\n</body>\n</html>\n';
  const pastLine = "      box.querySelector('.cd-exam').textContent = 'מועד הבחינה הבא יפורסם בקרוב';";
  if (!script.includes(pastLine)) throw new Error('countdown past marker');
  script = script.replace(pastLine, pastLine + "\n      document.querySelectorAll('[data-exam-fact]').forEach(function (el) { el.hidden = true; });");

  const many = c.groups.length > 1;
  const h = many ? 'h4' : 'h3';
  const card = (i) => {
    const s = track.sources.find((x) => x.title === i.source);
    return `          <li>
            <i class="ph ${i.icon}" aria-hidden="true"></i>
            <${h}>${bookTitle(s.title)}</${h}>${i.text ? `\n            <p>${esc(i.text)}</p>` : ''}
          </li>`;
  };
  const groups = c.groups.map((g, n) => `      <div class="src-group" data-reveal style="--i:${n + 1}">
${g.title ? `        <h3 class="src-group-title">${esc(g.title)}</h3>\n` : ''}        <ul class="src-detail${g.items.length === 3 ? ' n3' : ''}">
${g.items.map(card).join('\n')}
        </ul>
      </div>`).join('\n');

  const q = (spec.questions || [])[0];
  const cite = q && q.citation ? `
  <section class="sec cite-ex" aria-labelledby="t-cite">
    <div class="wrap">
      <div class="sec-head" data-reveal>
        <h2 id="t-cite">ציטוט מהמקור, לדוגמה</h2>
        <p>${esc(c.citeIntro(q.topic))}</p>
      </div>
      <figure class="cite-line" data-reveal style="--i:1">
        <i class="ph ph-quotes" aria-hidden="true"></i>
        <span class="cite-topic">${inline(q.topic)}</span>
        <cite>${inline(q.citation)}</cite>
      </figure>
      <p class="src-more" data-reveal style="--i:2"><a href="${href}" ${cta}="sources_try">${esc(c.citeTry)}<i class="ph ph-arrow-left" aria-hidden="true"></i></a></p>
    </div>
  </section>
` : '';

  const imaLink = `<a href="${track.exam.url}" target="_blank" rel="noopener">לוח הבחינות של הר״י</a>`;
  const facts = [
    ...c.facts({ dmy: DMY, imaLink, imaSpecialty: esc(track.exam.ima.specialty), examName: esc(track.exam.nameHe) }),
    spec.examBased ? c.pastExam : c.noPastExam,
  ];

  const main = `<main id="main">

  <header class="hero page-hero no-video">
    <div class="hero-overlay"></div>
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <!-- Not a <nav>: the page's nav rule styles every <nav> as the top bar. -->
        <div role="navigation" aria-label="מיקום באתר">
          <ol class="crumbs enter" style="--i:0">
            <li><a href="/">MeduXa.ai</a></li>
            <li><a href="${href}" ${cta}="sources_crumb">${esc(crumb)}</a></li>
            <li aria-current="page">מקורות</li>
          </ol>
        </div>
        <h1 class="enter" style="--i:1">${esc(c.h1)}</h1>
        <p class="lead enter" style="--i:2">${esc(c.lead)}</p>
        <div class="countdown enter" style="--i:3" data-exam-date="${DATE}">
          <p class="cd-days" hidden><b data-days></b> <span data-cd-unit></span></p>
          <p class="cd-exam">${esc(track.exam.nameHe)} · <span class="ltr-iso">${DMY}</span></p>
          <p class="cd-note"><a href="${track.exam.url}" target="_blank" rel="noopener">לפי לוח הבחינות של הר״י · המועד עשוי להשתנות</a> · <a href="/exams">כל מועדי הבחינות</a></p>
        </div>
      </div>
    </div>
  </header>

  <section class="sources" aria-labelledby="t-sources">
    <div class="wrap">
      <div class="sec-head" data-reveal>
        <h2 id="t-sources">המקורות המרכזיים</h2>
        <p>${esc(c.sourcesIntro)}</p>
      </div>
${groups}
    </div>
  </section>
${cite}
  <section class="sec" aria-labelledby="t-facts">
    <div class="wrap">
      <div class="sec-head" data-reveal>
        <h2 id="t-facts">${esc(c.factsTitle)}</h2>
      </div>
      <div class="facts" data-reveal style="--i:1">
${facts.map((f) => '        ' + f).join('\n')}
        <p class="src-more"><a href="${href}" ${cta}="sources_more">${esc(c.moreText)}<i class="ph ph-arrow-left" aria-hidden="true"></i></a></p>
      </div>
    </div>
  </section>

  <section class="sec signup-band" aria-labelledby="t-start">
    <div class="wrap">
      <div class="signup-copy" data-reveal>
        <h2 id="t-start">${esc(c.closingTitle)}</h2>
        <p class="signup-for">${c.closingHtml}</p>
        <a class="btn hero-cta" href="${href}#signup" ${cta}="sources_closing">${esc(c.closingButton)}<i class="ph ph-arrow-left" aria-hidden="true"></i></a>
      </div>
    </div>
  </section>
</main>`;

  return { file: `${href.slice(1)}/sources.html`, html: (head + nav + main + footer + script).replace(/\r\n/g, '\n') };
}

function main() {
  const args = process.argv.slice(2);
  const id = args.find((a) => !a.startsWith('--'));
  if (!id) { console.error('usage: node scripts/build-sources-page.mjs <track id> [--check]'); process.exit(2); }
  const { file, html } = buildSourcesPage(id);
  const path = join(root, file);
  const before = existsSync(path) ? readFileSync(path, 'utf8') : null;
  if (before === html) { console.log(`ok       ${file}`); return; }
  if (args.includes('--check')) { console.log(`DRIFT    ${file} (run: node scripts/build-sources-page.mjs ${id})`); process.exit(1); }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, html);
  console.log(`written  ${file}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
