/* First-touch traffic source ("via") for sign-up attribution.

   What it keeps: ONE value from a closed list (VIAS: google, whatsapp, direct, ...), in
   sessionStorage['mx_via'] — so it lives only in the open tab and is gone when the tab closes.
   Never an address, a referrer URL or free text: anything unrecognised is 'other'.

   What it does with it: when a visitor clicks an app sign-up link (https://app.meduxa.ai/...
   carrying src=landing) it appends `pg` (this page, from <html data-page>) and `via`, at click
   time. The waitlist form sends the same `via` (window.MeduxaAttribution.current()).

   Every public page loads this script, so the first touch is taken on the real entry page. If a
   visit's first page is somehow unscripted (or storage is blocked) and the referrer is our own
   origin with nothing stored, the source is unknown: 'other', never 'direct' (which would be
   inflated by unscripted entries).

   The host/utm mapping mirrors api/_lib/external/via.js in the app repo — keep the two lists
   identical (scripts/attribution.test.mjs pins VIAS). Not behind the consent gate: nothing here
   identifies a person or leaves the tab until the visitor signs up. */
(function (root) {
  var VIAS = ['google', 'bing', 'facebook', 'instagram', 'whatsapp', 'linkedin', 'x',
    'chatgpt', 'newsletter', 'direct', 'other'];
  var KEY = 'mx_via';
  var APP_HOST = 'app.meduxa.ai';
  var INTERNAL_HOSTS = ['meduxa.ai'];
  var HOST_SUFFIXES = [
    ['bing', ['bing.com']],
    ['facebook', ['facebook.com', 'fb.com', 'fb.me']],
    ['instagram', ['instagram.com']],
    ['whatsapp', ['whatsapp.com', 'wa.me']],
    ['linkedin', ['linkedin.com', 'lnkd.in']],
    ['x', ['x.com', 't.co', 'twitter.com']],
    ['chatgpt', ['chatgpt.com', 'chat.openai.com', 'openai.com']]
  ];
  var ALIASES = {
    google: 'google', bing: 'bing', facebook: 'facebook', fb: 'facebook', instagram: 'instagram',
    ig: 'instagram', whatsapp: 'whatsapp', wa: 'whatsapp', linkedin: 'linkedin', x: 'x',
    twitter: 'x', chatgpt: 'chatgpt', newsletter: 'newsletter', direct: 'direct'
  };
  var GOOGLE_RE = /^(?:[a-z0-9-]+\.)*google\.[a-z]{2,3}(?:\.[a-z]{2})?$/;
  var has = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };
  var matches = function (host, d) { return host === d || host.slice(-(d.length + 1)) === '.' + d; };

  // null = our own origin (not a source: keep the stored first touch).
  function viaOfHost(host) {
    var h = String(host == null ? '' : host).trim().toLowerCase();
    if (!h || h === '(direct)' || h === '(not set)') return 'direct';
    var i;
    for (i = 0; i < INTERNAL_HOSTS.length; i++) if (matches(h, INTERNAL_HOSTS[i])) return null;
    if (has(ALIASES, h)) return ALIASES[h];
    if (GOOGLE_RE.test(h)) return 'google';
    for (i = 0; i < HOST_SUFFIXES.length; i++) {
      var ds = HOST_SUFFIXES[i][1];
      for (var j = 0; j < ds.length; j++) if (matches(h, ds[j])) return HOST_SUFFIXES[i][0];
    }
    return 'other';
  }

  function viaOfUtm(utm) {
    var u = String(utm == null ? '' : utm).trim().toLowerCase();
    if (!u) return null;
    return has(ALIASES, u) ? ALIASES[u] : 'other';
  }

  function isVia(v) { return typeof v === 'string' && VIAS.indexOf(v) !== -1; }

  function hostOf(url) {
    try { return new URL(url).hostname; } catch (e) { return undefined; }
  }

  // The first touch of this tab: stored value wins; else utm_source, else the referrer.
  function firstTouch(storage, href, referrer) {
    var stored = null;
    try { stored = storage.getItem(KEY); } catch (e) { stored = null; }
    if (isVia(stored)) return stored;
    var computed = null;
    var utm = null;
    try { utm = new URL(href).searchParams.get('utm_source'); } catch (e) { utm = null; }
    computed = viaOfUtm(utm);
    if (computed === null) {
      var ref = String(referrer == null ? '' : referrer).trim();
      if (!ref) computed = 'direct';
      else {
        var host = hostOf(ref);
        computed = host === undefined ? 'other' : viaOfHost(host);
      }
    }
    if (computed === null) computed = 'other'; // internal referrer, nothing stored: unknown, not direct
    try { storage.setItem(KEY, computed); } catch (e) {}
    return computed;
  }

  // Only https://app.meduxa.ai links that already carry src=landing; never any other link.
  function decorate(href, page, via) {
    var u;
    try { u = new URL(href); } catch (e) { return href; }
    if (u.protocol !== 'https:' || u.hostname !== APP_HOST) return href;
    if (u.searchParams.get('src') !== 'landing') return href;
    var changed = false;
    if (typeof page === 'string' && /^[a-z][a-z-]{0,30}$/.test(page)) { u.searchParams.set('pg', page); changed = true; }
    if (isVia(via)) { u.searchParams.set('via', via); changed = true; }
    return changed ? u.toString() : href;
  }

  var api = { VIAS: VIAS, TABLES: { HOST_SUFFIXES: HOST_SUFFIXES, ALIASES: ALIASES, INTERNAL_HOSTS: INTERNAL_HOSTS, GOOGLE_RE: GOOGLE_RE }, viaOfHost: viaOfHost, viaOfUtm: viaOfUtm, firstTouch: firstTouch, decorate: decorate, current: function () { return null; } };
  root.MeduxaAttribution = api;

  if (typeof document === 'undefined') return;
  var storage = null;
  try { storage = root.sessionStorage; } catch (e) { storage = null; }
  var via = firstTouch(storage || { getItem: function () { throw 0; }, setItem: function () { throw 0; } },
    root.location.href, document.referrer);
  api.current = function () { return via; };

  function onClick(e) {
    var el = e.target;
    while (el && el.nodeType === 1 && el.tagName !== 'A') el = el.parentNode;
    if (!el || el.nodeType !== 1 || !el.getAttribute) return;
    var href = el.getAttribute('href');
    if (!href) return;
    var next = decorate(el.href, document.documentElement.getAttribute('data-page'), via);
    if (next !== el.href) el.setAttribute('href', next);
  }
  document.addEventListener('click', onClick, true);
  document.addEventListener('auxclick', onClick, true);
})(typeof window !== 'undefined' ? window : this);
