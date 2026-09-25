/* Consent gate for the two identifier-based trackers: Google Analytics 4 and
   Microsoft Clarity. Neither loads until the visitor clicks "accept".

   Why a gate at all: both set cookies and derive a persistent visitor id, and
   the edge router sends EU traffic to /en, so the site is inside the GDPR as
   well as Israel's Privacy Protection Law (Amendment 13). Both want opt-in
   before such a script runs, not a notice after it has already run.

   Vercel Web Analytics is NOT behind this gate: it is cookieless and keeps no
   visitor id, so it measures every visitor (including the cta_click events)
   whatever they choose here.

   The choice is stored in localStorage under mx_analytics_consent
   ("granted" | "denied"). That entry is strictly necessary: without it the
   banner would reappear on every page. Undecided means nothing loads.

   Reopen the banner from anywhere with window.mxConsent.open() — the privacy
   pages link to it. Withdrawing a grant reloads the page, because a tracker
   that has already loaded cannot be unloaded any other way. */
(function () {
  var GA_ID = 'G-XGGFVEFFWZ';
  var CLARITY_ID = 'yhjkv4kj7h';
  var KEY = 'mx_analytics_consent';
  var loaded = false;

  function read() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function write(v) {
    try { window.localStorage.setItem(KEY, v); } catch (e) {}
  }

  function loadTrackers() {
    if (loaded) return;
    loaded = true;
    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(ga);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);

    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
  }

  var he = (document.documentElement.lang || '').toLowerCase().indexOf('he') === 0;
  var T = he ? {
    label: 'הסכמה למדידה',
    text: 'נשמח למדוד איך משתמשים באתר בעזרת Google Analytics ו-Microsoft Clarity, כדי לשפר אותו. הם יופעלו רק אם תסכימו.',
    more: 'מדיניות הפרטיות',
    moreHref: '/privacy',
    accept: 'מסכים/ה',
    reject: 'לא, תודה'
  } : {
    label: 'Analytics consent',
    text: 'We would like to measure how the site is used with Google Analytics and Microsoft Clarity, to improve it. They only run if you agree.',
    more: 'Privacy policy',
    moreHref: '/en/privacy',
    accept: 'Accept',
    reject: 'No, thanks'
  };

  var banner = null;

  function close() {
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    banner = null;
  }

  function choose(value) {
    var before = read();
    write(value);
    close();
    if (value === 'granted') loadTrackers();
    else if (before === 'granted' && loaded) window.location.reload();
  }

  function button(label, value) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    // Accept and reject carry equal visual weight: same size, same shape.
    b.style.cssText = 'font:inherit;font-size:14px;font-weight:700;padding:10px 18px;' +
      'border-radius:10px;cursor:pointer;min-width:110px;border:1px solid #0EA5E9;' +
      (value === 'granted' ? 'background:#0EA5E9;color:#fff;' : 'background:#fff;color:#0F172A;');
    b.addEventListener('click', function () { choose(value); });
    return b;
  }

  function open() {
    if (banner) return;
    banner = document.createElement('div');
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', T.label);
    banner.dir = he ? 'rtl' : 'ltr';
    banner.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;' +
      'max-width:640px;margin:0 auto;background:#fff;color:#0F172A;border:1px solid #E2E8F0;' +
      'border-radius:14px;box-shadow:0 10px 30px rgba(15,23,42,.18);padding:16px 18px;' +
      'font-family:inherit;display:flex;flex-direction:column;gap:12px;';

    var p = document.createElement('p');
    p.style.cssText = 'margin:0;font-size:14px;line-height:1.6;';
    p.appendChild(document.createTextNode(T.text + ' '));
    var a = document.createElement('a');
    a.href = T.moreHref;
    a.textContent = T.more;
    a.style.cssText = 'color:#0369A1;text-decoration:underline;';
    p.appendChild(a);

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';
    row.appendChild(button(T.accept, 'granted'));
    row.appendChild(button(T.reject, 'denied'));

    banner.appendChild(p);
    banner.appendChild(row);
    document.body.appendChild(banner);
  }

  window.mxConsent = { open: open };

  function start() {
    var v = read();
    if (v === 'granted') loadTrackers();
    else if (v !== 'denied') open();
  }
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
