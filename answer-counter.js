/* Live "answers given by users so far" line in the hero (home he/en and every specialty page).

   What it shows: two aggregate numbers read from the app, https://app.meduxa.ai/api/answer-counter
   ({ok:true,total,last24h}, CDN-cached ~30 s, CORS-allowed for https://meduxa.ai only): answers recorded on the
   platform in total and in the last 24 hours. No cookie, no storage, no request body, nothing identifying the visitor;
   the privacy policy describes it in section 14.

   Real numbers only. The line stays invisible until the first successful read at or above the floors (a young counter
   must not read as an empty product), is removed again when the first read fails, and after a later failed poll the last
   good number stays. A failed read is never rendered as zero. The route answers 503 {ok:false} on any failure.

   Ported from the app's sign-in counter (src/answerCounter*.js, src/LiveAnswerCounter.jsx in the app repo); keep the
   rules identical: parse, floors, poller (30 s, abort on hidden, backoff, give up after 3), 600 ms ease-out tween.

   Layout: the mount (<div data-mx-live style="min-height:...">) reserves the line's height from the first paint, so the
   hero does not shift when the number arrives. If the counter never shows (failure, below the floor, script blocked,
   ENABLED = false, an exception in init) the mount is hidden and the hero closes up exactly as it was before this feature.
   If this file itself never runs (blocked by an ad blocker, network error) the script tag's onerror puts `mx-live-off` on <html>
   and a rule in each page's own <style> hides the mount; with JavaScript off a <noscript> rule does.

   Kill switch: ENABLED below. Floors and cadence are constants, not configuration. */
(function (root) {
  'use strict';

  var ENABLED = true;
  var ENDPOINT = 'https://app.meduxa.ai/api/answer-counter';
  var FLOOR_TOTAL = 1000; // below this the whole line stays hidden
  var FLOOR_24H = 25;     // below this only the "last 24 hours" line is hidden
  var POLL_MS = 30000;
  var MAX_FAILURES = 3;
  var BACKOFF_CAP_MS = 5 * 60 * 1000;
  var TWEEN_MS = 600;
  var FETCH_TIMEOUT_MS = 8000; // a hung request counts as a failed read

  var STRINGS = {
    he: {
      label: 'תשובות שניתנו על ידי משתמשים עד היום',
      dayAfter: ' ב-24 השעות האחרונות',
      srTotal: '{total} תשובות שניתנו על ידי משתמשים עד היום.',
      srDay: ' {day} ב-24 השעות האחרונות.',
      intl: 'he-IL'
    },
    en: {
      label: 'answers given by users so far',
      dayAfter: ' in the last 24 hours',
      srTotal: '{total} answers given by users so far.',
      srDay: ' {day} in the last 24 hours.',
      intl: 'en-US'
    }
  };

  function isCount(n) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n && n >= 0 && n <= 9007199254740991; }

  // {ok:true,total,last24h} -> {total,last24h}; anything else -> null (never coerced).
  function parsePayload(json) {
    if (json === null || typeof json !== 'object' || Array.isArray(json)) return null;
    if (json.ok !== true) return null;
    if (!isCount(json.total) || !isCount(json.last24h)) return null;
    if (json.last24h > json.total) return null;
    return { total: json.total, last24h: json.last24h };
  }

  function view(payload, floors) {
    floors = floors || { total: FLOOR_TOTAL, last24h: FLOOR_24H };
    if (payload == null || !isCount(payload.total) || !isCount(payload.last24h)) return { state: 'hidden' };
    if (payload.total < floors.total) return { state: 'hidden' };
    return { state: 'ok', total: payload.total, last24h: payload.last24h, showDay: payload.last24h >= floors.last24h };
  }

  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  // Frames of a count-up. Only an increase animates; reduced motion, a lower/equal value or a non-finite input is one instant frame.
  function countUpFrames(from, to, reduced, frames) {
    frames = frames || 24;
    if (reduced || !isFinite(from) || !isFinite(to) || !(to > from) || !(frames > 1)) return [to];
    var out = [];
    for (var i = 1; i <= frames; i++) out.push(i === frames ? to : Math.round(from + (to - from) * easeOutQuart(i / frames)));
    return out;
  }

  // Latin digits with locale grouping (Hebrew readers see 14,082, as in the app).
  function formatCount(n, intl) {
    try { return new Intl.NumberFormat(intl, { numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); }
  }

  function text(lang) {
    var key = String(lang || '').toLowerCase().split(/[-_]/)[0];
    var s = STRINGS[key] || STRINGS.en;
    return {
      label: s.label,
      dayAfter: s.dayAfter,
      intl: s.intl,
      srSummary: function (totalFormatted, dayFormatted) {
        return s.srTotal.replace('{total}', String(totalFormatted)) +
          (dayFormatted == null ? '' : s.srDay.replace('{day}', String(dayFormatted)));
      }
    };
  }

  /* ---- poller: one load at once, ONE timer armed after the previous load settled; polls only while visible ---- */
  function safeCall(fn, arg) { try { if (fn) fn(arg); } catch (e) { /* the caller's bug, not a failed load */ } }

  function createPoller(o) {
    var isVisible = o.isVisible || function () { return typeof document === 'undefined' ? true : document.visibilityState === 'visible'; };
    var subscribeVisibility = o.subscribeVisibility || function (cb) {
      if (typeof document === 'undefined') return function () {};
      document.addEventListener('visibilitychange', cb);
      return function () { document.removeEventListener('visibilitychange', cb); };
    };
    var setT = o.setTimeoutFn || function (fn, ms) { return setTimeout(fn, ms); };
    var clearT = o.clearTimeoutFn || function (id) { clearTimeout(id); };
    var Ctor = o.AbortControllerCtor !== undefined ? o.AbortControllerCtor : (typeof AbortController === 'undefined' ? undefined : AbortController);
    var maxFailures = o.maxFailures || MAX_FAILURES;
    var cap = o.backoffCapMs || BACKOFF_CAP_MS;
    var running = false, gaveUp = false, failures = 0, timer = null, current = null, unsubscribe = null, healthy = false;

    function setHealth(next) { if (healthy === next) return; healthy = next; safeCall(o.onHealth, next); }
    function clearTimer() { if (timer !== null) { clearT(timer); timer = null; } }
    function abortCurrent() { if (!current) return; var c = current; current = null; c.abort(); }
    function schedule(delay) {
      clearTimer();
      if (!running || gaveUp || !isVisible()) return;
      timer = setT(function () { timer = null; run(); }, delay);
    }
    function run() {
      if (!running || gaveUp || current) return;
      clearTimer();
      var controller = Ctor ? new Ctor() : { signal: undefined, abort: function () {} };
      current = controller;
      var settle = function (value) {
        if (current !== controller) return; // aborted or stopped meanwhile: stays silent
        current = null;
        if (value) {
          failures = 0;
          if (isVisible()) setHealth(true);
          safeCall(o.onValue, value);
          schedule(o.pollMs);
          return;
        }
        failures += 1;
        if (failures >= maxFailures) gaveUp = true;
        setHealth(false);
        safeCall(o.onFail, { failures: failures, final: gaveUp });
        schedule(Math.min(o.pollMs * Math.pow(2, failures), cap));
      };
      var p;
      try { p = Promise.resolve(o.load(controller.signal)); } catch (e) { p = Promise.reject(e); }
      p.then(function (json) { settle(parsePayload(json)); }, function () { settle(null); });
    }
    function onVisibilityChange() {
      if (!running || gaveUp) return;
      if (isVisible()) { if (current === null && timer === null) run(); }
      else { abortCurrent(); clearTimer(); setHealth(false); }
    }
    return {
      start: function () {
        if (running) return;
        running = true; gaveUp = false; setHealth(false); failures = 0;
        unsubscribe = subscribeVisibility(onVisibilityChange);
        if (isVisible()) run();
      },
      stop: function () {
        running = false; clearTimer(); abortCurrent();
        if (unsubscribe) { unsubscribe(); unsubscribe = null; }
      }
    };
  }

  /* ---- tween: time-based count-up; the final frame is exactly `to`, never emitted early ---- */
  function createTweener(o) {
    var duration = o.durationMs || TWEEN_MS;
    var handle = null, token = 0;
    function cancel() { token += 1; if (handle !== null) { o.caf(handle); handle = null; } }
    function start(from, to) {
      cancel();
      var frames = countUpFrames(from, to, o.reducedMotion());
      if (frames.length <= 1) { o.onFrame(to, true); return; }
      var mine = token, t0 = o.now(), last = frames.length - 2;
      var step = function () {
        if (mine !== token) return;
        var elapsed = o.now() - t0;
        if (elapsed >= duration) { handle = null; o.onFrame(to, true); return; }
        var idx = Math.min(last, Math.floor((elapsed / duration) * frames.length));
        o.onFrame(Math.min(frames[idx], to - 1), false);
        handle = o.raf(step);
      };
      o.onFrame(from, false);
      handle = o.raf(step);
    }
    return { start: start, cancel: cancel };
  }

  // Tween only when a previous good value was visible and the new one is too; null = show the new value directly.
  function tweenStart(prev, next, shown) {
    if (!prev || view(prev).state !== 'ok' || view(next).state !== 'ok') return null;
    return { from: shown == null ? prev.total : shown, to: next.total };
  }

  // The dot's ring fires once per REAL increase (against the previous real total, never the value mid-tween).
  function ringBumps(prev, next) {
    if (!prev || view(prev).state !== 'ok' || view(next).state !== 'ok') return false;
    return next.total > prev.total;
  }

  /* ---- DOM ---- */
  var EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
  var CSS =
    '.mx-live{position:relative;display:flex;flex-direction:column;gap:3px;align-items:flex-start;color:#B8D4EA;font-family:inherit;}' +
    '.mx-live[hidden]{display:none;}' +
    '.mx-live-body{opacity:0;visibility:hidden;}' +
    '.mx-live.mx-on .mx-live-body{opacity:1;visibility:visible;}' +
    '.mx-live-row{display:flex;align-items:baseline;gap:0 8px;flex-wrap:wrap;font-size:15px;line-height:1.35;}' +
    '.mx-live-num{display:inline-block;direction:ltr;unicode-bidi:isolate;font-variant-numeric:tabular-nums;font-size:22px;line-height:1.15;font-weight:700;letter-spacing:-.01em;color:#22D3EE;}' +
    '.mx-live-day{font-size:14px;line-height:1.4;color:#9FBBD3;}' +
    '.mx-live-daynum{display:inline-block;direction:ltr;unicode-bidi:isolate;font-variant-numeric:tabular-nums;font-weight:600;color:#E2F4FD;}' +
    '.mx-live-dot{position:relative;display:inline-block;align-self:center;width:6px;height:6px;border-radius:50%;background:#22D3EE;opacity:0;transition:opacity 200ms ' + EASE + ';}' +
    '.mx-live-dot[data-on="true"]{opacity:1;}' +
    '.mx-live-ring{position:absolute;inset:0;border-radius:50%;background:#22D3EE;opacity:0;}' +
    '.mx-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;}' +
    '@media (prefers-reduced-motion:no-preference){' +
      '.mx-live-body{transition:opacity 260ms ' + EASE + ',transform 260ms ' + EASE + ';transform:translateY(3px);}' +
      '.mx-live.mx-on .mx-live-body{transform:none;}' +
      '.mx-live-ring{animation:mx-live-ring 900ms ' + EASE + ' both;}' +
    '}' +
    '@keyframes mx-live-ring{from{opacity:.45;transform:scale(1);}to{opacity:0;transform:scale(2.6);}}';

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  function prefersReducedMotion() {
    return typeof root.matchMedia === 'function' && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function mount(host, opts) {
    opts = opts || {};
    if (host.getAttribute('data-mx-mounted')) return { stop: function () {} };
    host.setAttribute('data-mx-mounted', '1');
    var t = text(opts.lang || host.lang || document.documentElement.lang);
    host.className = (host.className ? host.className + ' ' : '') + 'mx-live';
    host.textContent = '';
    var body = el('div', 'mx-live-body');
    body.setAttribute('aria-hidden', 'true');
    var row = el('div', 'mx-live-row');
    var dot = el('span', 'mx-live-dot'); dot.setAttribute('data-on', 'false');
    var num = el('span', 'mx-live-num');
    var label = el('span'); label.textContent = t.label;
    row.appendChild(dot); row.appendChild(num); row.appendChild(label);
    var day = el('div', 'mx-live-day');
    var dayNum = el('span', 'mx-live-daynum');
    var dayAfter = el('span'); dayAfter.textContent = t.dayAfter;
    day.appendChild(dayNum); day.appendChild(dayAfter);
    body.appendChild(row); body.appendChild(day);
    var sr = el('span', 'mx-sr');
    host.appendChild(body); host.appendChild(sr);

    var realPrev = null, shown = null, shownVisible = false, ping = 0, closed = false;
    var load = opts.load || function (signal) {
      var timer;
      var timeout = new Promise(function (resolve) { timer = setTimeout(function () { resolve(null); }, FETCH_TIMEOUT_MS); });
      var read = fetch(ENDPOINT, { signal: signal, mode: 'cors', credentials: 'omit' }).then(function (res) {
        return res.status === 200 ? res.json() : null;
      });
      var done = function () { clearTimeout(timer); };
      read.then(done, done);
      return Promise.race([read, timeout]);
    };

    function hide() {
      // Nothing real to show: remove the reserved space so the hero closes up exactly as it was.
      host.hidden = true;
      host.classList.remove('mx-on');
      dot.textContent = ''; // no stale ring left to replay when the line comes back
    }
    function paint(v, totalOnScreen) {
      num.textContent = formatCount(totalOnScreen, t.intl);
      if (v.showDay) { dayNum.textContent = formatCount(v.last24h, t.intl); day.hidden = false; } else { day.hidden = true; }
      sr.textContent = t.srSummary(formatCount(v.total, t.intl), v.showDay ? formatCount(v.last24h, t.intl) : null);
    }
    function reveal() { host.hidden = false; host.classList.add('mx-on'); shownVisible = true; }

    var tweener = createTweener({
      raf: function (cb) { return root.requestAnimationFrame(cb); },
      caf: function (id) { root.cancelAnimationFrame(id); },
      now: function () { return root.performance.now(); },
      reducedMotion: opts.reducedMotion || prefersReducedMotion,
      onFrame: function (value, done) {
        shown = value;
        if (realPrev) paint(view(realPrev), done ? realPrev.total : value);
      }
    });

    var poller = createPoller({
      load: load,
      pollMs: opts.pollMs || POLL_MS,
      onHealth: function (on) { dot.setAttribute('data-on', on ? 'true' : 'false'); },
      onValue: function (value) {
        var v = view(value);
        if (v.state !== 'ok') { tweener.cancel(); realPrev = null; shown = null; if (shownVisible) { shownVisible = false; } hide(); return; }
        var plan = tweenStart(realPrev, value, shown);
        var bump = ringBumps(realPrev, value);
        realPrev = value;
        if (bump) {
          ping += 1;
          var ring = el('span', 'mx-live-ring'); ring.setAttribute('data-ping', String(ping));
          dot.textContent = ''; dot.appendChild(ring);
        }
        if (plan) { paint(v, plan.from); tweener.start(plan.from, plan.to); }
        else { tweener.cancel(); shown = value.total; paint(v, value.total); }
        reveal();
      },
      onFail: function (info) {
        // First read failed (nothing real was ever shown): remove the reserved space. After a good value the last number stays.
        if (!shownVisible) hide();
      }
    });

    // Hidden tab: rAF pauses, so a running count-up would sit frozen mid-way. Settle on the latest real total.
    function onPageVisibility() {
      if (document.visibilityState === 'visible') return;
      tweener.cancel();
      if (realPrev) { shown = realPrev.total; paint(view(realPrev), realPrev.total); }
    }
    document.addEventListener('visibilitychange', onPageVisibility);
    poller.start();

    return {
      stop: function () {
        if (closed) return; closed = true;
        poller.stop(); tweener.cancel();
        document.removeEventListener('visibilitychange', onPageVisibility);
      }
    };
  }

  function init() {
    if (typeof document === 'undefined') return;
    var hosts = document.querySelectorAll('[data-mx-live]');
    if (!hosts.length) return;
    try {
      if (!ENABLED) throw new Error('disabled');
      if (!document.querySelector('style[data-mx-live-css]')) {
        var style = document.createElement('style');
        style.setAttribute('data-mx-live-css', '');
        style.textContent = CSS;
        document.head.appendChild(style);
      }
      for (var j = 0; j < hosts.length; j++) mount(hosts[j]);
    } catch (e) {
      // Anything wrong, or the kill switch: close the reserved space so the hero is exactly as it was.
      for (var i = 0; i < hosts.length; i++) hosts[i].hidden = true;
    }
  }

  var api = {
    ENDPOINT: ENDPOINT, FLOOR_TOTAL: FLOOR_TOTAL, FLOOR_24H: FLOOR_24H, POLL_MS: POLL_MS, MAX_FAILURES: MAX_FAILURES,
    BACKOFF_CAP_MS: BACKOFF_CAP_MS, TWEEN_MS: TWEEN_MS, STRINGS: STRINGS,
    FETCH_TIMEOUT_MS: FETCH_TIMEOUT_MS,
    isEnabled: function () { return ENABLED; },
    parsePayload: parsePayload, view: view, countUpFrames: countUpFrames, formatCount: formatCount, text: text,
    createPoller: createPoller, createTweener: createTweener, tweenStart: tweenStart, ringBumps: ringBumps, mount: mount, init: init
  };
  root.MeduxaAnswerCounter = api;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
})(typeof window !== 'undefined' ? window : this);
