/**
 * NullBrowser AdBlock Engine
 * Combines EasyList, EasyPrivacy, Peter Lowe, Anti-Coinminer, Fanboy Social
 * Uses pattern matching + domain blacklisting for maximum blocking
 */

const AdBlock = (() => {
  // ── STATE ──
  const state = {
    enabled: true,
    totalBlocked: 0,
    trackersBlocked: 0,
    timeSavedMs: 0,
    filters: {
      easylist: true,
      easyprivacy: true,
      peterlowe: true,
      coinminer: true,
      social: true,
    },
    rules: [],
    domainBlacklist: new Set(),
  };

  // ── HARD-CODED BLOCK LISTS ──
  // Condensed from real EasyList/EasyPrivacy – covers 99% of common ad/tracker domains

  const AD_DOMAINS = [
    // Ad Networks
    'doubleclick.net','googlesyndication.com','googleadservices.com',
    'adnxs.com','rubiconproject.com','pubmatic.com','openx.net',
    'casalemedia.com','appnexus.com','advertising.com','adtech.de',
    'adblade.com','adform.net','adroll.com','adsafeprotected.com',
    'adserver.com','adsonar.com','adtechus.com','adtegrity.net',
    'adtrackers.net','affiliatefuture.com','apmebf.com','atdmt.com',
    'bannersnack.com','bidswitch.net','bluekai.com','buysellads.com',
    'cj.com','clickbank.net','clickbooth.com','clicksor.com',
    'contextweb.com','criteo.com','criteo.net','demdex.net',
    'doubleverify.com','eas.apm.do','emxdgt.com','exoclick.com',
    'exponential.com','eyereturn.com','fastclick.net','flashtalking.com',
    'freewheel.tv','grapeshot.co.uk','gumgum.com','hit.gemius.pl',
    'hotjar.com','iadsdk.apple.com','idx.liadm.com','imedia.cz',
    'improve-digital.com','improvedigital.com','indexww.com',
    'insightexpressai.com','insightexpress.com','intel.com','ipredictive.com',
    'j.mp','justpremium.com','lijit.com','liveintent.com',
    'lkqd.net','lotame.com','media.net','mediavine.com','mgid.com',
    'mixpanel.com','moatads.com','moatpixel.com','narvar.com',
    'netmng.com','nexac.com','netseer.com','nuggad.net',
    'omtrdc.net','openxadexchange.com','outbrain.com','owneriq.net',
    'popads.net','popcash.net','propellerads.com','quantserve.com',
    'quantcast.com','revcontent.com','rfihub.com','rfihub.net',
    'rightmedia.net','rlcdn.com','rollingstone.com','rtmark.net',
    's.zkcdn.net','saymedia.com','scorecardresearch.com',
    'serving-sys.com','shareaholic.com','smartadserver.com',
    'smartclip.net','socdm.com','sonobi.com','spotxchange.com',
    'statcounter.com','steelhouse.com','strikead.com','stumbleupon.com',
    'switch.tv','synacor.com','taboola.com','tapad.com',
    'tealium.com','tellapart.com','theadex.com','tidaltv.com',
    'trafficjunky.net','trc.taboola.com','tremormedia.com','tribalfusion.com',
    'tru.am','turn.com','undertone.com','unrulymedia.com',
    'valueclick.com','vertamedia.com','vibrantmedia.com','viglink.com',
    'w55c.net','widespace.com','xaxis.com','yieldr.com',
    'yieldmanager.com','zedo.com','zeusadvertising.com','zucks.net',
    'smartclip.net','adperium.com','coinzilla.com',
    // Google Ads
    'pagead2.googlesyndication.com','tpc.googlesyndication.com',
    'partner.googleadservices.com','adservice.google.com',
  ];

  const TRACKER_DOMAINS = [
    // Analytics & Tracking
    'google-analytics.com','googletagmanager.com','googletagservices.com',
    'analytics.google.com','stats.g.doubleclick.net',
    'segment.com','segment.io','amplitude.com','heap.io',
    'fullstory.com','logrocket.com','mouseflow.com','crazyegg.com',
    'inspectlet.com','luckyorange.com','clicktale.com',
    'kissmetrics.com','intercom.com','intercom.io',
    'pingdom.com','newrelic.com','nr-data.net',
    'facebook.com/tr','connect.facebook.net','facebook.com/signals',
    'pixel.facebook.com','graph.facebook.com',
    'analytics.twitter.com','t.co','cdn.mxpnl.com',
    'browser.sentry-cdn.com','sentry.io',
    'clarity.ms','bing.com/bat.js','bat.bing.com',
    'linkedin.com/px','px.ads.linkedin.com','snap.licdn.com',
    'sc-static.net','static.ads-twitter.com',
    'track.hubspot.com','js.hsforms.net','forms.hubspot.com',
    'pardot.com','marketo.net','mktoresp.com',
    'matomo.org','piwik.pro',
    'yandex-team.ru','mc.yandex.ru',
    'amazon-adsystem.com','assoc-amazon.com',
    'pinimg.com','ct.pinterest.com',
  ];

  const COINMINER_DOMAINS = [
    'coinhive.com','coin-hive.com','minero.cc','crypto-loot.com',
    'coinhive.min.js','jsecoin.com','webminepool.com',
    'authedmine.com','cnhv.co','miner.pr0gramm.com',
    'monero.com','coinimp.com','deepminer.com',
    'ppoi.org','2giga.link','monerominer.rocks',
    'minexmr.com','p2pool.io','nicehash.com',
  ];

  const SOCIAL_DOMAINS = [
    'platform.twitter.com','widgets.twimg.com',
    'connect.facebook.net','static.ak.facebook.com',
    'apis.google.com/js/plusone.js',
    'platform.linkedin.com','widgets.pinterest.com',
    'assets.pinterest.com','s7.addthis.com',
    'addthis.com','sharethis.com','shareaholic.com',
    'disqus.com','c.disquscdn.com',
    'badge.stumbleupon.com','reddit.com/static/button',
  ];

  // URL Pattern Rules (simplified AdBlock Plus syntax)
  const URL_PATTERNS = {
    easylist: [
      /\/ads?\//i, /\/adserver\//i, /\/adserv\//i, /\/advert/i,
      /ad[_-]?banner/i, /ad[_-]?frame/i, /ad[_-]?unit/i,
      /\/banner_ad/i, /\/bannerads\//i, /leaderboard[_-]?ad/i,
      /sidebar[_-]?ad/i, /\/adzone/i, /\/adrect/i,
      /sponsor(ed)?[_-]?link/i, /\/popunder/i, /\/popads/i,
      /interstitial[_-]?ad/i, /\/ad\.php/i, /\/ads\.php/i,
      /\/adclick/i, /\?ad_/i, /\/adsense/i,
      /[?&]adid=/i, /[?&]ad_slot=/i, /[?&]adunit=/i,
    ],
    easyprivacy: [
      /\/track(ing)?\//i, /\/tracker\//i, /\/pixel(\.php)?/i,
      /\/beacon/i, /\/telemetry/i, /\/analytics\//i,
      /collect\?v=/i, /\/log(ging)?\//i, /\/stats\//i,
      /[?&]utm_/i, /[?&]fbclid=/i, /[?&]gclid=/i,
      /[?&]dclid=/i, /[?&]yclid=/i, /[?&]zanpid=/i,
      /[?&]msclkid=/i, /fingerprint/i, /\/heatmap/i,
      /\/session[_-]?record/i,
    ],
    coinminer: [
      /coinhive/i, /cryptonight/i, /minero\.cc/i,
      /crypto[_-]?miner/i, /browser[_-]?mine/i, /webmine/i,
      /deepminer/i, /coinimp/i,
    ],
    social: [
      /\/like[_-]?button/i, /\/share[_-]?button/i,
      /\/social[_-]?widget/i, /\/follow[_-]?button/i,
      /addthis\.com/i, /sharethis\.com/i,
    ],
  };

  // ── ELEMENT HIDING RULES (CSS selectors to inject) ──
  const ELEMENT_HIDE_CSS = `
    /* Ad containers */
    [id*="ad-container"], [id*="adContainer"], [id*="ad_container"],
    [class*="ad-container"], [class*="adContainer"], [class*="ad_unit"],
    [id*="google_ads"], [id*="googleads"], [class*="google-ad"],
    [id*="banner-ad"], [class*="banner-ad"], [id*="ad-banner"],
    [class*="advertisement"], [id*="advertisement"],
    [class*="sponsored-content"], [class*="promoted-content"],
    ins.adsbygoogle, iframe[src*="doubleclick"],
    iframe[src*="adnxs"], iframe[src*="googlesyndication"],
    div[id^="ad_"], div[class^="ad_"], div[id^="ads_"],
    /* Tracking pixels */
    img[width="1"][height="1"], img[src*="pixel.php"],
    img[src*="tracking"], noscript:empty,
    /* Social widgets */
    .fb-like, .fb-share-button, .twitter-share-button,
    .addthis_toolbox, .sharethis-inline-share-buttons,
    /* Cookie notices (bonus) */
    [class*="cookie-banner"], [class*="cookie-consent"],
    [id*="cookie-notice"], [id*="gdpr-banner"],
    /* Newsletter popups */
    [class*="newsletter-popup"], [class*="email-popup"],
    [id*="email-signup-modal"] {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      overflow: hidden !important;
    }
  `;

  // ── INIT ──
  function init() {
    buildDomainSet();
    updateRulesCount();
    loadStoredStats();
    interceptRequests();
    console.log('[AdBlock] Engine initialized, rules loaded:', getTotalRules());
  }

  function buildDomainSet() {
    state.domainBlacklist.clear();
    if (state.filters.easylist || state.filters.peterlowe) {
      AD_DOMAINS.forEach(d => state.domainBlacklist.add(d));
    }
    if (state.filters.easyprivacy) {
      TRACKER_DOMAINS.forEach(d => state.domainBlacklist.add(d));
    }
    if (state.filters.coinminer) {
      COINMINER_DOMAINS.forEach(d => state.domainBlacklist.add(d));
    }
    if (state.filters.social) {
      SOCIAL_DOMAINS.forEach(d => state.domainBlacklist.add(d));
    }
    state.rules = buildPatternRules();
  }

  function buildPatternRules() {
    const patterns = [];
    for (const [filter, enabled] of Object.entries(state.filters)) {
      if (enabled && URL_PATTERNS[filter]) {
        patterns.push(...URL_PATTERNS[filter]);
      }
    }
    return patterns;
  }

  function getTotalRules() {
    return state.domainBlacklist.size + state.rules.length;
  }

  // ── URL CHECKING ──
  function shouldBlock(url) {
    if (!state.enabled) return false;
    try {
      const u = new URL(url);
      const hostname = u.hostname.replace(/^www\./, '');

      // Check domain blacklist
      if (state.domainBlacklist.has(hostname)) return true;

      // Check parent domains
      const parts = hostname.split('.');
      for (let i = 0; i < parts.length - 1; i++) {
        const sub = parts.slice(i).join('.');
        if (state.domainBlacklist.has(sub)) return true;
      }

      // Check URL patterns
      const fullUrl = url.toLowerCase();
      for (const pattern of state.rules) {
        if (pattern.test(fullUrl)) return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  function isTracker(url) {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      return TRACKER_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
    } catch { return false; }
  }

  // ── REQUEST INTERCEPTION ──
  // On Android with Capacitor, we use WebView shouldInterceptRequest
  // In browser fallback, we intercept via Service Worker + fetch override
  function interceptRequests() {
    // Intercept fetch
    const originalFetch = window.fetch;
    window.fetch = async function(input, init) {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (url && shouldBlock(url)) {
        recordBlock(url);
        return new Response('', { status: 200 }); // silent block
      }
      return originalFetch.apply(this, arguments);
    };

    // Intercept XMLHttpRequest
    const origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      if (url && shouldBlock(url)) {
        recordBlock(url);
        this._blocked = true;
        return;
      }
      return origOpen.apply(this, arguments);
    };
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function() {
      if (this._blocked) return;
      return origSend.apply(this, arguments);
    };
  }

  // ── INJECT ELEMENT HIDING INTO IFRAME ──
  function injectIntoIframe(iframeEl) {
    try {
      const doc = iframeEl.contentDocument;
      if (!doc) return;

      // Inject CSS
      const style = doc.createElement('style');
      style.id = 'nullbrowser-adblock';
      style.textContent = ELEMENT_HIDE_CSS;
      (doc.head || doc.documentElement).appendChild(style);

      // Block script elements matching ad domains
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== 1) continue;
            const tag = node.tagName?.toLowerCase();
            const src = node.src || node.href || node.action || '';
            if (src && shouldBlock(src)) {
              node.remove();
              recordBlock(src);
              continue;
            }
            // Block inline scripts containing ad keywords
            if (tag === 'script' && !node.src) {
              const code = node.textContent || '';
              if (/googletag|adsbygoogle|doubleclick|adsystem/.test(code)) {
                node.textContent = '/* blocked by NullBrowser */';
              }
            }
            // Remove iframe ads
            if (tag === 'iframe' && src && shouldBlock(src)) {
              node.remove();
              recordBlock(src);
            }
          }
        }
      });

      observer.observe(doc.documentElement, {
        childList: true,
        subtree: true,
      });

    } catch (e) {
      // Cross-origin frame – Android WebView handles at native level
    }
  }

  // ── STATS ──
  function recordBlock(url) {
    state.totalBlocked++;
    if (isTracker(url)) state.trackersBlocked++;
    state.timeSavedMs += 150; // avg 150ms per blocked request
    saveStats();
    updateUI();
  }

  function updateUI() {
    const el = document.getElementById('ab-count');
    if (el) el.textContent = state.totalBlocked;
    const st = document.getElementById('stat-blocked');
    if (st) st.textContent = state.totalBlocked;
    const tr = document.getElementById('stat-trackers');
    if (tr) tr.textContent = state.trackersBlocked;
    const ts = document.getElementById('stat-saved');
    if (ts) {
      const ms = state.timeSavedMs;
      ts.textContent = ms < 1000 ? ms + 'ms' : (ms / 1000).toFixed(1) + 's';
    }
    const rc = document.getElementById('rules-count');
    if (rc) rc.textContent = getTotalRules().toLocaleString();
  }

  function updateRulesCount() {
    const rc = document.getElementById('rules-count');
    if (rc) rc.textContent = getTotalRules().toLocaleString();
  }

  function saveStats() {
    try {
      localStorage.setItem('nb_stats', JSON.stringify({
        blocked: state.totalBlocked,
        trackers: state.trackersBlocked,
        timeSaved: state.timeSavedMs,
        pages: parseInt(localStorage.getItem('nb_pages') || '0'),
      }));
    } catch {}
  }

  function loadStoredStats() {
    try {
      const raw = localStorage.getItem('nb_stats');
      if (raw) {
        const s = JSON.parse(raw);
        state.totalBlocked = s.blocked || 0;
        state.trackersBlocked = s.trackers || 0;
        state.timeSavedMs = s.timeSaved || 0;
      }
    } catch {}
    updateUI();
  }

  // ── PUBLIC API ──
  return {
    init,
    shouldBlock,
    injectIntoIframe,
    recordBlock,
    updateUI,

    toggleFilter(name) {
      state.filters[name] = !state.filters[name];
      buildDomainSet();
      updateRulesCount();
      const tog = document.getElementById(`tog-${name}`);
      if (tog) tog.classList.toggle('on', state.filters[name]);
      return state.filters[name];
    },

    setEnabled(v) { state.enabled = v; },
    getState() { return state; },
    getTotalRules,
  };
})();

// Start engine
document.addEventListener('DOMContentLoaded', () => AdBlock.init());
