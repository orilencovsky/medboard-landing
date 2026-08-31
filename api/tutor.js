// POST /api/tutor — the live Socratic tutor behind the hero demo card.
//
// The system prompt lives here and never in the page, so the endpoint cannot be
// driven as a general-purpose chat. Requires ANTHROPIC_API_KEY in the Vercel
// project's environment variables (Production + Preview).
//
// Deliberately dependency-free, like the rest of the repo: this is one call to
// the Messages API over the Node runtime's global fetch, so there is no
// package.json and no install step for Vercel to run.

const CASE_HE = [
  'הלומד רואה שאלת התמחות ברפואה פנימית:',
  'בן 67 עם CKD על רקע סוכרת עובר צנתור כלילי. קראטינין לפני הפרוצדורה 1.5 מג/דל, ויומיים אחרי 1.77 מג/דל. לפי KDIGO — מה נכון?',
  'התשובה הנכונה: אינו עומד בקריטריונים ל-AKI על פי הקראטינין (עלייה של 0.27 מג/דל < 0.3; יחס 1.18x < 1.5x).',
  'נקודת הלמידה המרכזית: תפוקת השתן לא נמסרה במקרה, והיא פרמטר עצמאי לאבחנה ולדירוג — בלעדיה אי אפשר לשלול AKI בביטחון. הובילו את הלומד לשם.',
  'קריטריוני KDIGO 2012: אבחנה — עליית קראטינין >=0.3 מג/דל ב-48 שעות, או >=1.5x מהבסיס תוך 7 ימים, או תפוקת שתן <0.5 מל/קג/שעה ל-6 שעות.',
  'דרגה 1: >=0.3 מג/דל או 1.5-1.9x מהבסיס, או תפוקת שתן <0.5 מל/קג/שעה ל-6-12 שעות.',
  'דרגה 2: 2.0-2.9x מהבסיס, או תפוקת שתן <0.5 מל/קג/שעה ל->=12 שעות.',
  'דרגה 3: >=3.0x מהבסיס, או קראטינין >=4.0 מג/דל, או התחלת דיאליזה, או תפוקת שתן <0.3 מל/קג/שעה ל->=24 שעות, או אנוריה >=12 שעות.'
].join('\n');

const CASE_EN = [
  'The learner is looking at a board-style internal medicine question:',
  'A 67-year-old man with diabetic CKD undergoes coronary catheterization. Creatinine was 1.5 mg/dL before the procedure and 1.77 mg/dL two days later. Per KDIGO, which is correct?',
  'The correct answer: does not meet AKI criteria on creatinine (a rise of 0.27 mg/dL < 0.3; a ratio of 1.18x < 1.5x).',
  'The key teaching point: urine output was never given in the stem, and it is an independent parameter for both diagnosis and staging — without it AKI cannot be confidently ruled out. Lead the learner there.',
  'KDIGO 2012 criteria: diagnosis — creatinine rise >=0.3 mg/dL within 48 hours, or >=1.5x baseline within 7 days, or urine output <0.5 mL/kg/h for 6 hours.',
  'Stage 1: >=0.3 mg/dL or 1.5-1.9x baseline, or urine output <0.5 mL/kg/h for 6-12 hours.',
  'Stage 2: 2.0-2.9x baseline, or urine output <0.5 mL/kg/h for >=12 hours.',
  'Stage 3: >=3.0x baseline, or creatinine >=4.0 mg/dL, or initiation of dialysis, or urine output <0.3 mL/kg/h for >=24 hours, or anuria >=12 hours.'
].join('\n');

const SYSTEM_HE = [
  'את/ה המורה הסוקרטי של MeduXa — מלמד/ת רופאים לקראת בחינות ההתמחות בישראל.',
  'ענה/י תמיד בעברית תקנית בלבד (אותיות עבריות, מספרים ומונחים באנגלית בלבד), בגוף שני רבים, בטון קולגיאלי וחם, בלי אימוג\'י.',
  'סגנון סוקרטי: תשובה קצרה (עד 3 משפטים, עד 55 מילים), מסתיימת בשאלה מנחה אחת.',
  'קריטריוני KDIGO הם חלופיים (אחד מהם מספיק) — לא מצטברים.',
  'טקסט רגיל בלבד: בלי markdown, בלי כוכביות, בלי כותרות ובלי רשימות. גם אם מבקשים סיכום — עד 55 מילים.',
  'אם הלומד עונה על השאלה שלכם: אמרו קודם אם צדק, השלימו את הנתון החסר במשפט אחד (כולל ספי תפוקת השתן כשרלוונטי), וסיימו בשאלה אחת.',
  'הישארו בתוך המקרה הקליני ובקריטריוני KDIGO. אם נשאלתם על משהו רחוק מהנושא, החזירו בעדינות למקרה.',
  'אל תמציאו מקורות או מספרים שאינם מופיעים כאן.',
  '',
  CASE_HE
].join('\n');

const SYSTEM_EN = [
  'You are the MeduXa Socratic tutor, teaching physicians preparing for medical board exams.',
  'Always answer in English, in a warm, collegial, second-person tone, with no emoji.',
  'Socratic style: a short reply (at most 3 sentences, at most 55 words) that ends in a single guiding question.',
  'The KDIGO criteria are alternatives (any one is sufficient) — they are not cumulative.',
  'Plain text only: no markdown, no asterisks, no headings and no lists. Even if asked for a summary — at most 55 words.',
  'If the learner answers your question: say first whether they were right, fill in the missing parameter in one sentence (including the urine-output thresholds where relevant), and end with one question.',
  'Stay inside this clinical case and the KDIGO criteria. If asked about something far off topic, steer gently back to the case.',
  'Never invent sources or numbers that do not appear here.',
  '',
  CASE_EN
].join('\n');

// Best-effort limits. Serverless instances are short-lived and there may be
// several at once, so treat these as a speed bump rather than a guarantee —
// move them to Vercel KV / Upstash Redis if abuse shows up in the logs.
const HITS = new Map();   // ip -> [timestamps]
const IP_LIMIT = 3;       // per hour
const HOUR = 3600e3;
let dayStamp = new Date().toDateString();
let dayCount = 0;
const DAY_LIMIT = 600;    // global kill-switch, roughly $1/day on Haiku

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'not_configured' });

  const today = new Date().toDateString();
  if (today !== dayStamp) { dayStamp = today; dayCount = 0; }
  if (dayCount >= DAY_LIMIT) return res.status(429).json({ error: 'daily_cap' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const hits = (HITS.get(ip) || []).filter((t) => now - t < HOUR);
  if (hits.length >= IP_LIMIT) return res.status(429).json({ error: 'rate_limited' });
  hits.push(now);
  HITS.set(ip, hits);

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch (e) {
    return res.status(400).json({ error: 'bad_request' });
  }
  const msgs = Array.isArray(body.messages) ? body.messages : [];
  if (!msgs.length || msgs.length > 8) return res.status(400).json({ error: 'bad_request' });

  const messages = msgs.slice(-8).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || '').slice(0, 600)
  }));

  const headers = {
    'content-type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  };
  // Required only for a key that isn't scoped to a single workspace; omit
  // ANTHROPIC_WORKSPACE_ID entirely for a key that already is.
  if (process.env.ANTHROPIC_WORKSPACE_ID) headers['anthropic-workspace-id'] = process.env.ANTHROPIC_WORKSPACE_ID;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        // The prompt caps the reply at 55 words; this is headroom, not a target.
        max_tokens: 300,
        // Binary today (README § Adding a third language). A new locale needs its
        // own SYSTEM_* prompt written in that language, not a translated one.
        system: body.locale === 'en' ? SYSTEM_EN : SYSTEM_HE,
        messages
      })
    });
    if (!r.ok) return res.status(r.status === 429 ? 429 : 502).json({ error: 'upstream', status: r.status });
    const data = await r.json();
    const reply = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
    dayCount++;
    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(502).json({ error: 'upstream_failed' });
  }
};
