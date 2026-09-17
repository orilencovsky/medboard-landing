#!/usr/bin/env node
// Guards the crawler exemption in vercel.json's language router.
//
// `/` is the Hebrew page. Rule 2 of the router sends a visitor on to `/en` when
// they are neither on a Hebrew-language browser nor in Israel — and Googlebot is
// both: it crawls from US addresses and sends no Accept-Language at all. Every
// one of rule 2's `missing` conditions therefore held for it, so the Hebrew
// homepage answered Googlebot with a 307 and Search Console filed it under
// "Page with redirect" — never indexed, and taking the whole hreflang cluster
// with it, since `hreflang="he"` pointed at a URL that redirected.
//
// The fix is one more `missing` condition: a user-agent that looks like a
// crawler. A bot's UA matches, so the condition is not "missing", so rule 2 does
// not fire and `/` serves the Hebrew page with a 200. This is not cloaking —
// Googlebot gets exactly the bytes an Israeli visitor gets, and `/en` stays
// separately crawlable with its own self-referential canonical.
//
// This file exists because the bug was invisible from Israel: the owner, the
// browser and every local check all satisfy rule 2's conditions and see a 200.
// Only a request from abroad with no Hebrew in Accept-Language reproduced it,
// and nothing in the repo would have failed if the condition were dropped again.
//
// Run: node scripts/check-crawler-exemption.mjs
//
// Note the regex is evaluated here by JavaScript and on Vercel by Go's RE2. It
// is written in the syntax subset both read identically — plain alternation and
// character classes, and case spelled out rather than an inline flag, the same
// idiom `accept-language` already uses in this file for the same reason.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));

// Crawlers that must reach the Hebrew page at `/` without a redirect. Search
// engines so the page can be indexed; social unfurlers so a Hebrew link shared
// into WhatsApp, Facebook or Slack previews the Hebrew title and og-image-he
// rather than the English page's.
const CRAWLERS = [
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/125.0.6422.60 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.60 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Mozilla/5.0 (compatible; Google-InspectionTool/1.0;)',   // the URL Inspection tool itself
  'Mozilla/5.0 (compatible; GoogleOther)',
  'Mediapartners-Google',
  'AdsBot-Google (+http://www.google.com/adsbot.html)',
  'Mozilla/5.0 (compatible; Googlebot-Image/1.0; +http://www.google.com/bot.html)',
  'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  'Mozilla/5.0 (compatible; DuckDuckBot-Https/1.1; https://duckduckgo.com/duckduckbot)',
  'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)',
  'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'WhatsApp/2.23.20.0 A',
  'Twitterbot/1.0',
  'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
  'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
  'TelegramBot (like TwitterBot)',
  'Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)',
];

// Real visitors, who must keep today's routing untouched. GSA (the Google
// Search app's in-app browser) and an Android WebView (`wv`) are in the list as
// near misses: both are Google's own plumbing carrying a person, so they pin
// that a future broadening of the pattern toward Google-adjacent tokens does not
// quietly start treating a reader as a crawler.
//
// The pattern deliberately names Google's four documented crawler tokens rather
// than the bare vendor name. That is a choice about how wide a claim to make,
// not something this list proves: replacing the tokens with a bare "Google"
// leaves every case here passing, and no real visitor agent is known to carry
// the literal string. Widen it only against a UA you have actually observed.
const VISITORS = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/324.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; SM-S918B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36',
];

const failures = [];

// The geo/language rule is the one that can bounce a crawler: it is the only
// redirect whose conditions a cookieless, query-less, US-based request all meet.
const geoRule = (config.redirects ?? []).find(
  (r) => r.source === '/' && (r.missing ?? []).some((c) => c.key === 'x-vercel-ip-country'),
);
if (!geoRule) failures.push('No `/` redirect carries the x-vercel-ip-country condition — the language router is gone or unrecognisable.');

const uaCondition = (geoRule?.missing ?? []).find((c) => c.type === 'header' && c.key === 'user-agent');
if (!uaCondition) {
  failures.push('The geo/language rule has no `missing` user-agent condition — crawlers are being redirected off `/` again.');
} else {
  const pattern = new RegExp(uaCondition.value);
  // `missing` means "header absent, or present and not matching". A crawler's UA
  // must therefore MATCH (condition unmet -> no redirect); a visitor's must not.
  for (const ua of CRAWLERS) {
    if (!pattern.test(ua)) failures.push(`Crawler would still be redirected off the Hebrew page: ${ua}`);
  }
  for (const ua of VISITORS) {
    if (pattern.test(ua)) failures.push(`Real visitor would stop being language-routed: ${ua}`);
  }
}

if (failures.length) {
  console.error('FAIL — crawler exemption is broken:\n');
  for (const f of failures) console.error(`  - ${f}`);
  console.error(`\n${failures.length} problem(s).`);
  process.exit(1);
}

console.log(`OK — ${CRAWLERS.length} crawlers reach the Hebrew page at /, ${VISITORS.length} visitor agents stay language-routed.`);
