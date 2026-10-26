// Countdown day math for the exam dates on the study-track pages.
// Both functions are self-contained (no imports, no module-scope helpers) so
// that pages can inline them with String(fn) into a <script> tag.

// Whole calendar days from today (Asia/Jerusalem) to examDate ('YYYY-MM-DD').
// 0 on exam day, negative after. Day counts use Date.UTC on Y-M-D values, so
// DST never shifts the result.
export function daysUntil(examDate, now) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  const todayMs = Date.UTC(get('year'), get('month') - 1, get('day'));
  const [y, m, d] = examDate.split('-').map(Number);
  const examMs = Date.UTC(y, m - 1, d);
  return Math.round((examMs - todayMs) / 86400000);
}

// 'future' before exam day, 'today' on it, 'past' after it.
export function countdownState(days) {
  if (days > 0) return 'future';
  if (days === 0) return 'today';
  return 'past';
}
