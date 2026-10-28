// Countdown day math for the exam dates on the study-track pages.
// Both functions are self-contained (no imports, no module-scope helpers) so
// that pages can inline them with String(fn) into a <script> tag. Written in
// ES5 (var, no arrows or destructuring) because that tag is ES5: a browser
// that cannot parse newer syntax would drop the whole block, not just these.

// Whole calendar days from today (Asia/Jerusalem) to examDate ('YYYY-MM-DD').
// 0 on exam day, negative after. Day counts use Date.UTC on Y-M-D values, so
// DST never shifts the result.
export function daysUntil(examDate, now) {
  var parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  var ymd = {};
  for (var i = 0; i < parts.length; i++) ymd[parts[i].type] = Number(parts[i].value);
  var todayMs = Date.UTC(ymd.year, ymd.month - 1, ymd.day);
  var exam = examDate.split('-');
  var examMs = Date.UTC(Number(exam[0]), Number(exam[1]) - 1, Number(exam[2]));
  return Math.round((examMs - todayMs) / 86400000);
}

// 'future' before exam day, 'today' on it, 'past' after it.
export function countdownState(days) {
  if (days > 0) return 'future';
  if (days === 0) return 'today';
  return 'past';
}
