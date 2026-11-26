// /<track>/sources: static pages (<track>/sources.html). cardiology,
// nephrology, family-medicine and geriatrics were built by hand; obgyn,
// pediatrics, psychiatry and anesthesia by scripts/build-sources-page.mjs,
// which only runs when someone runs it. The daily date bot edits all of them
// as text. These checks keep each one reachable, indexable and in step with
// tracks.json, specialties/<track>.json and scripts/countdown.mjs.
// Run: node --test scripts/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderPage } from './render-specialties.mjs';
import { buildSourcesPage, firstCaption } from './build-sources-page.mjs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const tracks = JSON.parse(read('tracks.json')).tracks;
const dmy = (iso) => iso.split('-').reverse().join('.');
const visible = (html) => html.replace(/<script\b[\s\S]*?<\/script>/g, '').replace(/<style\b[\s\S]*?<\/style>/g, '')
  .replace(/<\/?span\b[^>]*>/g, '').replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');

// Per page: the tracks.json source titles it was written from (a change there
// must be carried into the page by hand, then here), the strings the page must
// show for them, and whether the track's own page makes the expert-review claim.
const PAGES = [
  {
    id: 'cardiology', crumb: 'קרדיולוגיה', expertReview: false,
    syllabus: 'https://www.ima.org.il/Internship/Syllabus.aspx?SpId=2',
    sources: ["Braunwald's Heart Disease 13e", 'ESC Guidelines', 'מאמרים עדכניים מכתבי עת (Eur Heart J, JACC, Circulation, JAMA)'],
    shows: ["Braunwald's Heart Disease", 'מהדורה 13', 'הנחיות ESC', 'European Heart Journal', 'JACC', 'Circulation', 'JAMA'],
  },
  {
    id: 'nephrology', crumb: 'נפרולוגיה', expertReview: true,
    syllabus: 'https://www.ima.org.il/Internship/Syllabus.aspx?SpId=3',
    sources: ["Brenner & Rector's The Kidney 11e", 'Johnson, Comprehensive Clinical Nephrology 7e', 'Daugirdas, Handbook of Dialysis 6e',
      'Rose & Post, Clinical Physiology of Acid-Base and Electrolyte Disorders 5e', 'Danovitch, Handbook of Kidney Transplantation 7e',
      'KDIGO', 'KDOQI', 'ISPD', 'נייר עמדה ישראלי ליתר לחץ דם 2026', 'UpToDate'],
    shows: ["Brenner & Rector's The Kidney, מהדורה 11", 'Comprehensive Clinical Nephrology, מהדורה 7', 'Johnson',
      'Handbook of Dialysis, מהדורה 6', 'Daugirdas', 'Clinical Physiology of Acid-Base and Electrolyte Disorders, מהדורה 5', 'Rose', 'Post',
      'Handbook of Kidney Transplantation, מהדורה 7', 'Danovitch', 'הנחיות KDIGO', 'הנחיות KDOQI', 'הנחיות ISPD', 'נייר עמדה ישראלי ליתר לחץ דם 2026', 'מאגר ידע קליני', 'UpToDate'],
  },
  {
    id: 'family-medicine', crumb: 'רפואת משפחה', expertReview: true,
    syllabus: 'https://www.ima.org.il/Internship/Syllabus.aspx?SpId=99',
    sources: ['Goroll, Primary Care Medicine 9e', 'Nelson Textbook of Pediatrics 22e', 'AFP review articles',
      'הנחיות וניירות עמדה של ההסתדרות הרפואית', 'GINA', 'GOLD', 'ADA 2026', 'תדריך החיסונים של משרד הבריאות'],
    shows: ['Primary Care Medicine, מהדורה 9', 'Goroll', 'Nelson Textbook of Pediatrics, מהדורה 22',
      'מאמרי סקירה מכתב העת AFP', 'American Family Physician', 'הנחיות וניירות עמדה של ההסתדרות הרפואית',
      'הנחיות GINA', 'הנחיות GOLD', 'הנחיות ADA לשנת 2026', 'תדריך החיסונים של משרד הבריאות'],
  },
  {
    id: 'geriatrics', crumb: 'גריאטריה', expertReview: false,
    syllabus: 'https://www.ima.org.il/Internship/Syllabus.aspx?SpId=42',
    sources: ["Hazzard's Geriatric Medicine and Gerontology 8e", "Harrison's Principles of Internal Medicine 22e", 'פרסומי משרד הבריאות', 'מאמרים מכתבי עת'],
    shows: ["Hazzard's Geriatric Medicine and Gerontology, מהדורה 8", "Harrison's Principles of Internal Medicine, מהדורה 22", 'פרסומי משרד הבריאות', 'מאמרים מכתבי עת'],
  },
  {
    id: 'obgyn', crumb: 'מיילדות וגינקולוגיה', expertReview: false, built: true,
    syllabus: 'https://www.ima.org.il/Internship/Syllabus.aspx?SpId=20',
    sources: ["Gabbe's Obstetrics: Normal and Problem Pregnancies 9e", "Berek & Novak's Gynecology 17e", "Speroff's Clinical Gynecologic Endocrinology and Infertility 10e"],
    shows: ["Gabbe's Obstetrics: Normal and Problem Pregnancies, מהדורה 9", 'ספר לימוד במיילדות.',
      "Berek & Novak's Gynecology, מהדורה 17", 'ספר לימוד בגינקולוגיה.',
      "Speroff's Clinical Gynecologic Endocrinology and Infertility, מהדורה 10", 'ספר לימוד באנדוקרינולוגיה גינקולוגית ובפוריות.',
      'בלוח הר״י המקצוע נקרא יילוד וגינקולוגיה', 'ציטוט מהמקור, לדוגמה', 'נסו את השאלה'],
  },
  {
    id: 'pediatrics', crumb: 'רפואת ילדים', expertReview: true, built: true,
    syllabus: 'https://www.ima.org.il/Internship/Syllabus.aspx?SpId=10',
    sources: ['Nelson Textbook of Pediatrics 22e', 'הנחיות קליניות ישראליות עדכניות', 'תדריך החיסונים של משרד הבריאות'],
    shows: ['Nelson Textbook of Pediatrics, מהדורה 22', 'ספר לימוד ברפואת ילדים.', 'גם בין המקורות לרפואת משפחה',
      'הנחיות קליניות ישראליות עדכניות', 'תדריך החיסונים של משרד הבריאות',
      'כל שאלה עוברת ביקורת מומחה ברפואת ילדים', 'הפיילוט לשלב א׳ ברפואת ילדים',
      'דוגמה לשורת מקור מתדריך החיסונים', 'משרד הבריאות, תדריך החיסונים, פרק אבעבועות רוח, עדכון יוני 2026', 'נסו את השאלה'],
  },
  {
    id: 'psychiatry', crumb: 'פסיכיאטריה', expertReview: false, built: true,
    syllabus: 'https://www.ima.org.il/Internship/Syllabus.aspx?SpId=50',
    sources: ['DSM-5 (American Psychiatric Association, 2013)', "Kaplan & Sadock's Comprehensive Textbook of Psychiatry",
      "Kaplan & Sadock's Synopsis of Psychiatry", 'חוקי משרד הבריאות'],
    shows: ['DSM-5 (American Psychiatric Association, 2013)', "Kaplan & Sadock's Comprehensive Textbook of Psychiatry",
      "Kaplan & Sadock's Synopsis of Psychiatry", 'חוקי משרד הבריאות', 'ספרים', 'חוקים',
      'Trauma- and Stressor-Related Disorders: Acute Stress Disorder', 'נסו את השאלה'],
  },
  {
    id: 'anesthesia', crumb: 'הרדמה', expertReview: false, built: true,
    syllabus: 'https://www.ima.org.il/Internship/Syllabus.aspx?SpId=47',
    sources: ["Miller's Anesthesia 10e", 'Barash, Clinical Anesthesia', 'Marino, The ICU Book',
      "Yao & Artusio's Anesthesiology: Problem-Oriented Patient Management", "Kaplan's Cardiac Anesthesia",
      "Hines & Jones, Stoelting's Anesthesia and Co-Existing Disease", "Jaffe, Anesthesiologist's Manual of Surgical Procedures",
      "Chestnut's Obstetric Anesthesia: Principles and Practice", "Hadzic's Textbook of Regional Anesthesia and Acute Pain Management",
      'Cote, A Practice of Anesthesia for Infants and Children', "Cottrell and Patel's Neuroanesthesia", 'Ehrenwerth, Anesthesia Equipment'],
    shows: ["Miller's Anesthesia, מהדורה 10", 'Barash, Clinical Anesthesia', 'Marino, The ICU Book',
      "Yao & Artusio's Anesthesiology: Problem-Oriented Patient Management", "Kaplan's Cardiac Anesthesia",
      "Hines & Jones, Stoelting's Anesthesia and Co-Existing Disease", "Jaffe, Anesthesiologist's Manual of Surgical Procedures",
      "Chestnut's Obstetric Anesthesia: Principles and Practice", "Hadzic's Textbook of Regional Anesthesia and Acute Pain Management",
      'Cote, A Practice of Anesthesia for Infants and Children', "Cottrell and Patel's Neuroanesthesia", 'Ehrenwerth, Anesthesia Equipment',
      'Chapter 44: Perioperative Acid–Base Balance', 'נסו את השאלה'],
  },
];

for (const cfg of PAGES) {
  const url = `https://meduxa.ai/${cfg.id}/sources`;
  const page = read(`${cfg.id}/sources.html`);
  const text = visible(page);
  const track = tracks.find((t) => t.id === cfg.id);
  const ld = [...page.matchAll(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/g)].map((m) => JSON.parse(m[1]));

  test(`${cfg.id}/sources: canonical, indexable, WebPage + 3-level breadcrumbs`, () => {
    assert.ok(page.includes(`<link rel="canonical" href="${url}" />`));
    assert.ok(page.includes('<meta name="robots" content="index, follow" />'));
    assert.equal(page.match(/<h1\b/g).length, 1);
    assert.equal(ld.find((b) => b['@type'] === 'WebPage').url, url);
    const crumbs = ld.find((b) => b['@type'] === 'BreadcrumbList').itemListElement;
    assert.deepEqual(crumbs.map((c) => c.item), ['https://meduxa.ai/', `https://meduxa.ai/${cfg.id}`, url]);
    assert.equal(crumbs[1].name, cfg.crumb);
  });

  test(`${cfg.id}/sources: exam exactly as tracks.json has it`, () => {
    assert.ok(page.includes(`data-exam-date="${track.exam.date}"`), 'countdown date drifted from tracks.json');
    assert.ok(text.includes(track.exam.nameHe), 'exam name drifted from tracks.json');
    assert.ok(text.includes(dmy(track.exam.date)), 'visible exam date drifted from tracks.json');
    assert.ok(page.includes(track.exam.url));
    // The dated sentence outside the countdown must be hideable after the
    // exam, and must itself carry the current date (the hero line alone
    // would satisfy a page-wide check).
    const fact = page.match(/<(\w+) data-exam-fact>([\s\S]*?)<\/\1>/);
    assert.ok(fact, 'the dated sentence must carry data-exam-fact');
    assert.ok(visible(fact[2]).includes(dmy(track.exam.date)), 'the date in the data-exam-fact sentence drifted');
    for (const d of track.exam.nameHe.match(/\d{2}\.\d{2}\.\d{4}/g) || []) assert.ok(text.includes(d), `date ${d} drifted`);
  });

  test(`${cfg.id}/sources: every source in tracks.json, edition included`, () => {
    assert.deepEqual(track.sources.map((s) => s.title), cfg.sources,
      `tracks.json ${cfg.id} sources changed: update ${cfg.id}/sources.html, then this list`);
    for (const s of cfg.shows) assert.ok(text.includes(s), `missing on the page: ${s}`);
  });

  test(`${cfg.id}/sources: inlines the current countdown functions`, () => {
    const src = read('scripts/countdown.mjs');
    for (const name of ['daysUntil', 'countdownState']) {
      const fn = src.match(new RegExp(`function ${name}\\b[\\s\\S]*?\\n}`))[0];
      assert.ok(page.includes(fn), `${name} drifted from scripts/countdown.mjs`);
    }
  });

  test(`${cfg.id}/sources: not an official list; expert-review claim only where the track page makes it`, () => {
    assert.ok(text.includes('לא רשימה רשמית'));
    const claims = /ביקורת מומחה|נבדק(ה|ות)? על ידי מומחה/.test(text);
    assert.equal(claims, cfg.expertReview);
    // The launch-price promise only where tracks.json gives the track one.
    assert.equal(text.includes('מחיר ההשקה'), Boolean(track.launchOffer), 'launch-price line does not match launchOffer');
    if (claims) assert.ok(read(`${cfg.id}.html`).includes('כל שאלה עוברת ביקורת מומחה'), 'the track page no longer makes the claim');
  });

  // A track that has not opened yet has nothing to sign in to: the page sends
  // to the sign-up on the track page, never to the app.
  test(`${cfg.id}/sources: the call to action matches the track status`, () => {
    if (track.status === 'soon') {
      assert.ok(!page.includes('app.meduxa.ai'), 'a soon track must not link to the app');
      assert.ok(page.includes(`href="/${cfg.id}#signup"`));
      assert.ok(read(`${cfg.id}.html`).includes('<section id="signup"'), 'the sign-up anchor moved');
    } else {
      assert.ok(page.includes('https://app.meduxa.ai/?signup=1'));
    }
  });

  // Copied from the track page, links like the nav button's #signup can point
  // at a section this page does not have.
  test(`${cfg.id}/sources: every in-page #link has its target`, () => {
    const ids = new Set([...page.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    for (const [, id] of page.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(id), `#${id} has no target`);
  });

  // The date bot swaps dd.mm.yyyy as text across the file, so the page may
  // show no date but its own exam's (and any date inside the exam name).
  test(`${cfg.id}/sources: shows no date but the track's own exam date`, () => {
    const body = visible(page.slice(page.indexOf('<body>')));
    const allowed = new Set([dmy(track.exam.date), ...(track.exam.nameHe.match(/\d{2}\.\d{2}\.\d{4}/g) || [])]);
    for (const [d] of body.matchAll(/\d{2}\.\d{2}\.\d{4}/g)) assert.ok(allowed.has(d), `${d} is not ${cfg.id}'s exam date`);
    assert.equal(page.match(/data-exam-date="/g).length, 1, 'one countdown per page');
  });

  // A citation shown as an example is one the track's sample questions really carry.
  test(`${cfg.id}/sources: a citation example is a real sample-question citation`, () => {
    const spec = JSON.parse(read(`specialties/${cfg.id}.json`));
    const plain = (s) => s.replace(/\{\{|\}\}/g, '');
    // A question's citation, or (sources kept in explanationHtml) its first source caption.
    const known = (spec.questions || []).map((q) => plain(q.citation || firstCaption(q.explanationHtml) || ''));
    for (const [, c] of page.matchAll(/<cite>([\s\S]*?)<\/cite>/g)) assert.ok(known.includes(visible(c).trim()), `unknown citation: ${visible(c)}`);
  });

  // "based on past-exam topics" only where specialties/<track>.json says so.
  // Generated pages must also say it where it is set; the hand-built
  // nephrology page predates examBased and does not, which is allowed.
  test(`${cfg.id}/sources: the past-exam sentence matches examBased`, () => {
    const spec = JSON.parse(read(`specialties/${cfg.id}.json`));
    if (!spec.examBased) assert.ok(!text.includes('ממבחני עבר'), 'claims past-exam topics without examBased');
    else if (cfg.built) assert.ok(text.includes('ממבחני עבר'), 'examBased is set but the page does not say it');
  });

  if (cfg.built) {
    test(`${cfg.id}/sources: is what scripts/build-sources-page.mjs makes`, () => {
      assert.equal(buildSourcesPage(cfg.id).html, page, `run: node scripts/build-sources-page.mjs ${cfg.id}`);
    });
  }

  // Psychiatry: the laws item is explained with the two laws the IMA syllabus names, linked to their public texts.
  if (cfg.id === 'psychiatry') {
    test('psychiatry/sources: names and links the laws the syllabus mentions, without calling the list the syllabus', () => {
      assert.ok(page.includes('https://www.nevo.co.il/law_html/law00/70314.htm') && page.includes('https://www.nevo.co.il/law_html/law00/71833.htm'));
      assert.ok(text.includes('חוק טיפול בחולי נפש') && text.includes('חוק זכויות החולה'));
      assert.ok(text.includes('הסילבוס של הר״י מזכיר, בין השאר'));
    });
  }
  // The Ministry of Health publishes the immunization guide; pediatrics links it directly.
  if (cfg.id === 'pediatrics') {
    test('pediatrics/sources: links the Ministry of Health immunization guide page', () => {
      assert.ok(page.includes('<a href="https://www.gov.il/he/pages/vaccine-guidelines-main" target="_blank" rel="noopener">'));
      assert.ok(text.includes('האגף לאפידמיולוגיה במשרד הבריאות'));
    });
  }
  // The official syllabus is the IMA's: linked as such, never as the source of this list.
  if (cfg.syllabus) {
    test(`${cfg.id}/sources: links the IMA syllabus page without calling the list the syllabus`, () => {
      assert.ok(page.includes(`<a href="${cfg.syllabus}" target="_blank" rel="noopener">`));
      assert.ok(!/לפי הסילבוס|הסילבוס של MeduXa|זו רשימת הסילבוס/.test(text));
    });
  }

  // A link to another track's sources page must land on a page that lists the
  // same source, and must not carry that page's date.
  test(`${cfg.id}/sources: links to other sources pages are backed by tracks.json`, () => {
    for (const [, other] of page.matchAll(/href="\/([a-z-]+)\/sources"/g)) {
      if (other === cfg.id) continue;
      const theirs = tracks.find((t) => t.id === other).sources.map((s) => s.title);
      assert.ok(cfg.sources.some((s) => theirs.includes(s)), `${other} shares no source with ${cfg.id}`);
      read(`${other}/sources.html`);
    }
  });

  test(`/${cfg.id} links to its sources page, and the sitemap lists it`, () => {
    assert.ok(read(`${cfg.id}.html`).includes(`<a href="/${cfg.id}/sources">`));
    assert.ok(read('sitemap.xml').includes(`<loc>${url}</loc>`));
    assert.equal(JSON.parse(read(`specialties/${cfg.id}.json`)).sourcesHref, `/${cfg.id}/sources`);
  });
}

test('build-sources-page refuses tracks it has no copy for (the four older pages included)', () => {
  assert.throws(() => buildSourcesPage('geriatrics'), /no CONTENT/);
  assert.throws(() => buildSourcesPage('nope'), /no CONTENT/);
});

test('every sources page has a 44px breadcrumb tap target rule', () => {
  for (const cfg of PAGES) assert.match(read(`${cfg.id}/sources.html`), /\.crumbs a \{ display: inline-flex; align-items: center; min-height: 44px; \}/, cfg.id);
});

test('sourcesHref adds the link only where set, and is validated', () => {
  const template = read('specialty.template.html');
  const track = tracks.find((t) => t.id === 'cardiology');
  const p = JSON.parse(read('specialties/cardiology.json'));
  assert.ok(renderPage(template, p, structuredClone(track)).includes('class="src-more"'));
  const without = { ...p }; delete without.sourcesHref;
  assert.ok(!renderPage(template, without, structuredClone(track)).includes('class="src-more"'));
  assert.throws(() => renderPage(template, { ...p, sourcesHref: '/x"><script>' }, structuredClone(track)), /sourcesHref/);
});
